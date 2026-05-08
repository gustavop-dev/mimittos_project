import json
import logging

from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from base_feature_app.models import WompiTransaction
from base_feature_app.services.wompi_service import WompiService

logger = logging.getLogger(__name__)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def wompi_webhook(request):
    try:
        event_data = json.loads(request.body)
    except json.JSONDecodeError:
        return Response({'detail': 'Invalid JSON.'}, status=status.HTTP_400_BAD_REQUEST)

    if not WompiService.verify_signature(event_data):
        return Response({'detail': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

    WompiService.process_event(event_data)
    return Response({'received': True})


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_status(request, reference: str):
    try:
        tx = WompiTransaction.objects.select_related('order').get(reference=reference)
    except WompiTransaction.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'reference': tx.reference,
        'status': tx.status,
        'order_number': tx.order.order_number,
        'checkout_url': tx.checkout_url,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_info(request, order_number: str):
    try:
        tx = WompiTransaction.objects.select_related('order').get(order__order_number=order_number)
    except WompiTransaction.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    order = tx.order
    return Response({
        'order_number': order.order_number,
        'reference': tx.reference,
        'amount_in_cents': tx.amount_in_cents,
        'currency': tx.currency,
        'total_amount': order.total_amount,
        'deposit_amount': order.deposit_amount,
        'balance_amount': order.balance_amount,
        'shipping_amount': order.shipping_amount,
        'discount_amount': order.discount_amount,
        'payment_mode': order.payment_mode,
        'amount_paid_now': order.amount_paid_now,
        'customer_name': order.customer_name,
        'customer_email': order.customer_email,
        'customer_phone': order.customer_phone or '',
        'status': tx.status,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def process_payment(request):
    order_number = request.data.get('order_number', '')
    method = request.data.get('method', '').upper()

    received_keys = sorted(list(request.data.keys()))
    logger.info(
        'process_payment called order=%s method=%s keys=%s acceptance_token_present=%s personal_auth_present=%s',
        order_number, method, received_keys,
        bool(request.data.get('acceptance_token')),
        bool(request.data.get('acceptance_personal_auth_token')),
    )

    if not order_number or not method:
        return Response({'detail': 'order_number y method son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        tx = WompiTransaction.objects.select_related('order').get(order__order_number=order_number)
    except WompiTransaction.DoesNotExist:
        return Response({'detail': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if tx.status == WompiTransaction.Status.APPROVED:
        return Response({'detail': 'Este pedido ya fue pagado.'}, status=status.HTTP_400_BAD_REQUEST)

    if method == 'CARD':
        card_token = request.data.get('card_token', '')
        if not card_token:
            return Response({'detail': 'card_token requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        method_data = {
            'type': 'CARD',
            'installments': int(request.data.get('installments', 1)),
            'token': card_token,
        }

    elif method == 'NEQUI':
        phone = request.data.get('phone_number', '').strip()
        if not phone:
            return Response({'detail': 'phone_number requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        method_data = {
            'type': 'NEQUI',
            'phone_number': phone,
        }

    elif method == 'PSE':
        bank_code = request.data.get('bank_code', '')
        user_legal_id = request.data.get('user_legal_id', '').strip()
        if not bank_code or not user_legal_id:
            return Response({'detail': 'bank_code y user_legal_id requeridos.'}, status=status.HTTP_400_BAD_REQUEST)
        legal_id_type = request.data.get('user_legal_id_type', 'CC')
        if legal_id_type not in ('CC', 'CE', 'NIT'):
            return Response(
                {'detail': f'user_legal_id_type debe ser CC, CE o NIT (recibido: {legal_id_type}).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        method_data = {
            'type': 'PSE',
            'user_type': int(request.data.get('user_type', 0)),
            'user_legal_id_type': legal_id_type,
            'user_legal_id': user_legal_id,
            'financial_institution_code': bank_code,
            'payment_description': f'Pedido {tx.order.order_number}',
        }

    elif method == 'BANCOLOMBIA_TRANSFER':
        user_legal_id = request.data.get('user_legal_id', '').strip()
        if not user_legal_id:
            return Response({'detail': 'user_legal_id requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        legal_id_type = request.data.get('user_legal_id_type', 'CC')
        if legal_id_type not in ('CC', 'CE', 'NIT'):
            return Response(
                {'detail': f'user_legal_id_type debe ser CC, CE o NIT (recibido: {legal_id_type}).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user_type_raw = str(request.data.get('user_type', 'PERSON')).upper()
        if user_type_raw not in ('PERSON', 'COMPANY'):
            return Response(
                {'detail': 'user_type debe ser PERSON o COMPANY.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        method_data = {
            'type': 'BANCOLOMBIA_TRANSFER',
            'user_type': user_type_raw,
            'user_legal_id_type': legal_id_type,
            'user_legal_id': user_legal_id,
            'payment_description': f'Pedido {tx.order.order_number}',
        }

    else:
        return Response({'detail': f'Método no soportado: {method}'}, status=status.HTTP_400_BAD_REQUEST)

    acceptance_token = request.data.get('acceptance_token', '')
    personal_auth_token = request.data.get('acceptance_personal_auth_token', '')

    if not acceptance_token or not personal_auth_token:
        return Response(
            {'detail': 'Faltan tokens de aceptación de Wompi. Recarga el checkout.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = WompiService.process_transaction(tx, method_data, acceptance_token, personal_auth_token)
    except Exception as exc:
        logger.error('process_payment failed for %s: %s', order_number, exc, exc_info=True)
        wompi_detail = ''
        resp = getattr(exc, 'response', None)
        if resp is not None:
            try:
                body = resp.json()
                if isinstance(body, dict):
                    error_obj = body.get('error') or {}
                    wompi_detail = error_obj.get('reason') or error_obj.get('type') or ''
                    messages = error_obj.get('messages')
                    if isinstance(messages, dict) and messages:
                        wompi_detail = f'{wompi_detail} | {messages}'.strip(' |')
            except ValueError:
                wompi_detail = (resp.text or '')[:300]
        return Response(
            {
                'detail': 'Error procesando el pago. Por favor intenta de nuevo.',
                'wompi_detail': wompi_detail,
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(result)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_payment_status(request, order_number: str):
    """Query Wompi directly for the current transaction status and sync our DB."""
    try:
        tx = WompiTransaction.objects.select_related('order').get(order__order_number=order_number)
    except WompiTransaction.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not tx.wompi_id:
        return Response({'status': tx.status, 'synced': False})

    wompi_data = WompiService.fetch_transaction(tx.wompi_id)
    if not wompi_data:
        return Response({'status': tx.status, 'synced': False})

    wompi_status_raw = wompi_data.get('status', '').upper()
    status_map = {
        'APPROVED': WompiTransaction.Status.APPROVED,
        'DECLINED': WompiTransaction.Status.DECLINED,
        'VOIDED': WompiTransaction.Status.VOIDED,
        'ERROR': WompiTransaction.Status.ERROR,
    }
    new_status = status_map.get(wompi_status_raw)

    if new_status and tx.status != new_status:
        tx.status = new_status
        tx.raw_response = wompi_data
        tx.save(update_fields=['status', 'raw_response', 'updated_at'])

        if new_status == WompiTransaction.Status.APPROVED:
            from base_feature_app.models import Order
            from base_feature_app.services.order_service import OrderService
            from base_feature_app.services.notification_service import NotificationService
            order = tx.order
            if order.status == Order.Status.PENDING_PAYMENT:
                OrderService.update_status(order, Order.Status.PAYMENT_CONFIRMED)
                NotificationService.notify_new_order_admin(order)

    return Response({'status': tx.status, 'synced': bool(new_status)})


@api_view(['GET'])
@permission_classes([AllowAny])
def pse_banks(request):
    banks = WompiService.get_pse_banks()
    return Response(banks)
