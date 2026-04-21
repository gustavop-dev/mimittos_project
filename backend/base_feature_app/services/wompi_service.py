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
    def _integrity_signature(reference: str, amount_in_cents: int, currency: str = 'COP') -> str:
        secret = WompiService._integrity_secret()
        raw = f'{reference}{amount_in_cents}{currency}{secret}'
        return hashlib.sha256(raw.encode()).hexdigest()

    @staticmethod
    def process_transaction(tx: WompiTransaction, method_data: dict) -> dict:
        """Create a direct Wompi transaction (no hosted checkout page)."""
        order = tx.order
        integrity = WompiService._integrity_signature(tx.reference, tx.amount_in_cents, tx.currency)

        payload = {
            'amount_in_cents': tx.amount_in_cents,
            'currency': tx.currency,
            'customer_email': order.customer_email,
            'reference': tx.reference,
            'signature': {'integrity': integrity},
            'customer_data': {
                'phone_number': order.customer_phone or '',
                'full_name': order.customer_name,
            },
            'payment_method': method_data,
        }

        resp = requests.post(
            f'{WompiService._api_url()}/transactions',
            json=payload,
            headers={
                'Authorization': f'Bearer {WompiService._private_key()}',
                'Content-Type': 'application/json',
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json().get('data', {})

        wompi_status_raw = data.get('status', 'ERROR').upper()
        status_map = {
            'APPROVED': WompiTransaction.Status.APPROVED,
            'DECLINED': WompiTransaction.Status.DECLINED,
            'VOIDED': WompiTransaction.Status.VOIDED,
            'ERROR': WompiTransaction.Status.ERROR,
        }
        new_status = status_map.get(wompi_status_raw, WompiTransaction.Status.PENDING)

        tx.wompi_id = data.get('id', '')
        tx.status = new_status
        tx.payment_method_type = data.get('payment_method_type', method_data.get('type', ''))
        tx.raw_response = data
        tx.save(update_fields=['wompi_id', 'status', 'payment_method_type', 'raw_response', 'updated_at'])

        if new_status == WompiTransaction.Status.APPROVED:
            from base_feature_app.services.order_service import OrderService
            if order.status == Order.Status.PENDING_PAYMENT:
                OrderService.update_status(order, Order.Status.PAYMENT_CONFIRMED)

        redirect_url = ''
        pm_data = data.get('payment_method') or {}
        if isinstance(pm_data, dict):
            extra = pm_data.get('extra') or {}
            redirect_url = extra.get('async_payment_url') or extra.get('redirect_url') or ''

        return {
            'status': wompi_status_raw,
            'redirect_url': redirect_url,
            'wompi_id': data.get('id', ''),
        }

    @staticmethod
    def get_pse_banks() -> list:
        try:
            resp = requests.get(
                f'{WompiService._api_url()}/pse/financial_institutions',
                headers={'Authorization': f'Bearer {WompiService._public_key()}'},
                timeout=10,
            )
            resp.raise_for_status()
            return resp.json().get('data', [])
        except requests.RequestException as exc:
            logger.warning('Could not fetch PSE banks: %s', exc)
            return []

    @staticmethod
    def create_checkout(wompi_transaction: WompiTransaction, new_account: bool = False) -> str:
        order = wompi_transaction.order
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        redirect_suffix = '&new_account=1' if new_account else ''

        payload = {
            'name': f'Pedido {order.order_number}',
            'description': f'Abono pedido Peluchelandia — {order.order_number}',
            'single_use': True,
            'collect_shipping': False,
            'currency': 'COP',
            'amount_in_cents': wompi_transaction.amount_in_cents,
            'redirect_url': f'{frontend_url}/tracking?order={order.order_number}{redirect_suffix}',
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
            link_id = data.get('id', '')
            checkout_url = f'https://checkout.wompi.co/l/{link_id}' if link_id else ''

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
