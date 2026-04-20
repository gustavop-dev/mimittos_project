import hashlib
import hmac
import json
import pytest
from unittest.mock import MagicMock, patch

from base_feature_app.models import Order, WompiTransaction
from base_feature_app.services.wompi_service import WompiService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def existing_order(db):
    return Order.objects.create(
        order_number='PELUCH-20260420-W001',
        customer_email='test@example.com',
        customer_name='Test User',
        customer_phone='3001234567',
        address='Calle 1',
        city='Bogotá',
        department='Cundinamarca',
        total_amount=80000,
        deposit_amount=40000,
        balance_amount=40000,
        status=Order.Status.PENDING_PAYMENT,
    )


@pytest.fixture
def wompi_tx(db, existing_order):
    return WompiTransaction.objects.create(
        order=existing_order,
        reference='PELUCH-20260420-W001-ABCD1234',
        amount_in_cents=4000000,
        status=WompiTransaction.Status.PENDING,
    )


# ---------------------------------------------------------------------------
# verify_signature
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_verify_signature_returns_true_for_valid_hmac(settings):
    settings.WOMPI_EVENTS_SECRET = 'secret123'
    payload = b'{"event": "transaction.updated"}'
    sig = hmac.new(b'secret123', payload, hashlib.sha256).hexdigest()
    assert WompiService.verify_signature(payload, sig) is True


@pytest.mark.django_db
def test_verify_signature_returns_false_for_invalid_signature(settings):
    settings.WOMPI_EVENTS_SECRET = 'secret123'
    payload = b'{"event": "transaction.updated"}'
    assert WompiService.verify_signature(payload, 'badsignature') is False


@pytest.mark.django_db
def test_verify_signature_returns_false_when_secret_not_configured(settings):
    settings.WOMPI_EVENTS_SECRET = ''
    payload = b'{"event": "transaction.updated"}'
    assert WompiService.verify_signature(payload, 'anysig') is False


# ---------------------------------------------------------------------------
# process_event — non-transaction events
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_process_event_ignores_non_transaction_event(wompi_tx):
    event_data = {'event': 'charge.created', 'data': {}}
    WompiService.process_event(event_data)
    wompi_tx.refresh_from_db()
    assert wompi_tx.status == WompiTransaction.Status.PENDING


# ---------------------------------------------------------------------------
# process_event — transaction.updated
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_process_event_updates_status_to_approved(wompi_tx):
    event_data = {
        'event': 'transaction.updated',
        'data': {
            'transaction': {
                'id': 'wompi-id-001',
                'reference': wompi_tx.reference,
                'status': 'APPROVED',
                'payment_method_type': 'CARD',
            }
        },
    }
    with patch('base_feature_app.services.order_service.OrderService.update_status') as mock_update:
        WompiService.process_event(event_data)
        wompi_tx.refresh_from_db()
        assert wompi_tx.status == WompiTransaction.Status.APPROVED
        mock_update.assert_called_once()


@pytest.mark.django_db
def test_process_event_updates_status_to_declined(wompi_tx):
    event_data = {
        'event': 'transaction.updated',
        'data': {
            'transaction': {
                'id': 'wompi-id-002',
                'reference': wompi_tx.reference,
                'status': 'DECLINED',
                'payment_method_type': 'CARD',
            }
        },
    }
    WompiService.process_event(event_data)
    wompi_tx.refresh_from_db()
    assert wompi_tx.status == WompiTransaction.Status.DECLINED


@pytest.mark.django_db
def test_process_event_does_not_update_order_for_declined(wompi_tx, existing_order):
    event_data = {
        'event': 'transaction.updated',
        'data': {
            'transaction': {
                'id': 'wompi-id-003',
                'reference': wompi_tx.reference,
                'status': 'DECLINED',
                'payment_method_type': 'CARD',
            }
        },
    }
    with patch('base_feature_app.services.order_service.OrderService.update_status') as mock_update:
        WompiService.process_event(event_data)
        mock_update.assert_not_called()


@pytest.mark.django_db
def test_process_event_logs_warning_for_missing_reference(wompi_tx):
    event_data = {
        'event': 'transaction.updated',
        'data': {
            'transaction': {
                'id': 'wompi-id-004',
                'reference': 'NONEXISTENT-REFERENCE',
                'status': 'APPROVED',
                'payment_method_type': 'CARD',
            }
        },
    }
    WompiService.process_event(event_data)
    wompi_tx.refresh_from_db()
    assert wompi_tx.status == WompiTransaction.Status.PENDING


@pytest.mark.django_db
def test_process_event_stores_wompi_id(wompi_tx):
    event_data = {
        'event': 'transaction.updated',
        'data': {
            'transaction': {
                'id': 'wompi-id-999',
                'reference': wompi_tx.reference,
                'status': 'VOIDED',
                'payment_method_type': 'PSE',
            }
        },
    }
    WompiService.process_event(event_data)
    wompi_tx.refresh_from_db()
    assert wompi_tx.wompi_id == 'wompi-id-999'


@pytest.mark.django_db
def test_process_event_stores_payment_method_type(wompi_tx):
    event_data = {
        'event': 'transaction.updated',
        'data': {
            'transaction': {
                'id': 'wompi-id-998',
                'reference': wompi_tx.reference,
                'status': 'ERROR',
                'payment_method_type': 'NEQUI',
            }
        },
    }
    WompiService.process_event(event_data)
    wompi_tx.refresh_from_db()
    assert wompi_tx.payment_method_type == 'NEQUI'


# ---------------------------------------------------------------------------
# create_checkout
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('base_feature_app.services.wompi_service.requests.post')
def test_create_checkout_returns_checkout_url(mock_post, wompi_tx, settings):
    settings.WOMPI_API_URL = 'https://sandbox.wompi.co/v1'
    settings.WOMPI_PRIVATE_KEY = 'prv_test_key'
    settings.FRONTEND_URL = 'http://localhost:3000'

    mock_response = MagicMock()
    mock_response.json.return_value = {'data': {'url': 'https://checkout.wompi.co/l/testlink'}}
    mock_response.raise_for_status.return_value = None
    mock_post.return_value = mock_response

    url = WompiService.create_checkout(wompi_tx)
    assert url == 'https://checkout.wompi.co/l/testlink'


@pytest.mark.django_db
@patch('base_feature_app.services.wompi_service.requests.post')
def test_create_checkout_saves_url_to_transaction(mock_post, wompi_tx, settings):
    settings.WOMPI_API_URL = 'https://sandbox.wompi.co/v1'
    settings.WOMPI_PRIVATE_KEY = 'prv_test_key'
    settings.FRONTEND_URL = 'http://localhost:3000'

    mock_response = MagicMock()
    mock_response.json.return_value = {'data': {'url': 'https://checkout.wompi.co/l/saved'}}
    mock_response.raise_for_status.return_value = None
    mock_post.return_value = mock_response

    WompiService.create_checkout(wompi_tx)
    wompi_tx.refresh_from_db()
    assert wompi_tx.checkout_url == 'https://checkout.wompi.co/l/saved'


@pytest.mark.django_db
@patch('base_feature_app.services.wompi_service.requests.post', side_effect=Exception('Connection error'))
def test_create_checkout_raises_on_request_failure(mock_post, wompi_tx, settings):
    settings.WOMPI_API_URL = 'https://sandbox.wompi.co/v1'
    settings.WOMPI_PRIVATE_KEY = 'prv_test_key'
    settings.FRONTEND_URL = 'http://localhost:3000'

    with pytest.raises(Exception):
        WompiService.create_checkout(wompi_tx)
