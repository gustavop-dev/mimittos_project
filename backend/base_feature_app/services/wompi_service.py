import hashlib
import hmac
import logging

import requests
from django.conf import settings

from base_feature_app.models import WompiTransaction, Order

logger = logging.getLogger(__name__)


class WompiService:
    @staticmethod
    def _api_url() -> str:
        return getattr(settings, 'WOMPI_API_URL', 'https://production.wompi.co/v1')

    @staticmethod
    def _private_key() -> str:
        return getattr(settings, 'WOMPI_PRIVATE_KEY', '')

    @staticmethod
    def _public_key() -> str:
        return getattr(settings, 'WOMPI_PUBLIC_KEY', '')

    @staticmethod
    def _events_secret() -> str:
        return getattr(settings, 'WOMPI_EVENTS_SECRET', '')

    @staticmethod
    def _integrity_secret() -> str:
        return getattr(settings, 'WOMPI_INTEGRITY_SECRET', '')

    @staticmethod
    def create_checkout(wompi_transaction: WompiTransaction) -> str:
        order = wompi_transaction.order
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

        payload = {
            'name': f'Pedido {order.order_number}',
            'description': f'Abono pedido Peluchelandia — {order.order_number}',
            'single_use': True,
            'collect_shipping': False,
            'currency': 'COP',
            'amount_in_cents': wompi_transaction.amount_in_cents,
            'redirect_url': f'{frontend_url}/tracking?order={order.order_number}',
            'reference': wompi_transaction.reference,
            'customer_data': {
                'email': order.customer_email,
                'full_name': order.customer_name,
                'phone_number': order.customer_phone or '',
            },
        }

        try:
            resp = requests.post(
                f'{WompiService._api_url()}/payment_links',
                json=payload,
                headers={
                    'Authorization': f'Bearer {WompiService._private_key()}',
                    'Content-Type': 'application/json',
                },
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json().get('data', {})
            checkout_url = data.get('url', '')

            wompi_transaction.checkout_url = checkout_url
            wompi_transaction.raw_response = data
            wompi_transaction.save(update_fields=['checkout_url', 'raw_response', 'updated_at'])

            return checkout_url

        except requests.RequestException as exc:
            logger.error('Wompi checkout creation failed: %s', exc)
            raise

    @staticmethod
    def verify_signature(event_data: dict) -> bool:
        """Verify Wompi webhook signature using SHA256.

        Wompi embeds the checksum inside the body (not in an HTTP header).
        Algorithm: sha256(prop1 + prop2 + ... + unix_timestamp + events_secret)
        Properties and their order come from event_data['signature']['properties'].
        """
        secret = WompiService._events_secret()
        if not secret:
            logger.warning('WOMPI_EVENTS_SECRET not configured')
            return False

        try:
            sig = event_data['signature']
            expected_checksum = sig['checksum']
            properties = sig['properties']
            sent_at = event_data['sent_at']
            data = event_data.get('data', {})

            concat = ''
            for prop in properties:
                value = data
                for part in prop.split('.'):
                    value = value[part]
                concat += str(value)

            from datetime import datetime
            dt = datetime.fromisoformat(sent_at.replace('Z', '+00:00'))
            concat += str(int(dt.timestamp()))
            concat += secret

            computed = hashlib.sha256(concat.encode()).hexdigest()
            return hmac.compare_digest(computed, expected_checksum)
        except (KeyError, TypeError, ValueError):
            logger.warning('Wompi signature verification failed: malformed event payload')
            return False

    @staticmethod
    def process_event(event_data: dict) -> None:
        from base_feature_app.services.order_service import OrderService

        event_type = event_data.get('event')
        if event_type != 'transaction.updated':
            return

        data = event_data.get('data', {}).get('transaction', {})
        reference = data.get('reference', '')

        try:
            wompi_tx = WompiTransaction.objects.select_related('order').get(reference=reference)
        except WompiTransaction.DoesNotExist:
            logger.warning('WompiTransaction not found for reference: %s', reference)
            return

        wompi_status = data.get('status', '').lower()
        status_map = {
            'approved': WompiTransaction.Status.APPROVED,
            'declined': WompiTransaction.Status.DECLINED,
            'voided': WompiTransaction.Status.VOIDED,
            'error': WompiTransaction.Status.ERROR,
        }
        new_wompi_status = status_map.get(wompi_status, WompiTransaction.Status.PENDING)

        wompi_tx.wompi_id = data.get('id', '')
        wompi_tx.status = new_wompi_status
        wompi_tx.payment_method_type = data.get('payment_method_type', '')
        wompi_tx.raw_response = data
        wompi_tx.save(update_fields=['wompi_id', 'status', 'payment_method_type', 'raw_response', 'updated_at'])

        if new_wompi_status == WompiTransaction.Status.APPROVED:
            order = wompi_tx.order
            if order.status == Order.Status.PENDING_PAYMENT:
                OrderService.update_status(order, Order.Status.PAYMENT_CONFIRMED)
