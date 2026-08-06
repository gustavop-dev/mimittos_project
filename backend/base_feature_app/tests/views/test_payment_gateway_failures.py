"""POST /api/payment/process/ — rejection and gateway-failure paths.

The happy path and the PSE legal-entity rules are covered in
`test_review_and_payment_views.py`. What was never covered is what happens when
the payment does NOT go through: the per-method 400s that guard the Wompi call,
and the 502 branch that turns a WompiService exception into a customer-facing
error (`payment_views.py:176-199`).

That 502 branch is the one that matters most: it is the only thing standing
between a gateway outage and a 500 traceback reaching the checkout page, and it
also decides how much of Wompi's raw error is surfaced as `wompi_detail`.
"""

from unittest.mock import patch

import pytest

from base_feature_app.models import Order, WompiTransaction

_PROCESS_URL = '/api/payment/process/'
_WOMPI_CALL = 'base_feature_app.views.payment_views.WompiService.process_transaction'


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def existing_order(db, existing_user):
    """Return an order still awaiting payment — the state `process_payment` expects."""
    return Order.objects.create(
        order_number='MMT-20260805-PAYF',
        customer=existing_user,
        customer_email=existing_user.email,
        customer_name='Test User',
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
    """Return the PENDING Wompi transaction attached to that order."""
    return WompiTransaction.objects.create(
        order=existing_order,
        reference='REF-PAYF-001',
        amount_in_cents=4000000,
        status=WompiTransaction.Status.PENDING,
        checkout_url='https://checkout.wompi.co/l/test',
    )


class _FakeWompiResponse:
    """Stands in for the `.response` an HTTP client attaches to its exceptions."""

    def __init__(self, payload=None, text=''):
        self._payload = payload
        self.text = text

    def json(self):
        if self._payload is None:
            raise ValueError('response body is not JSON')
        return self._payload


def _gateway_error(payload=None, text=''):
    exc = Exception('wompi call blew up')
    exc.response = _FakeWompiResponse(payload=payload, text=text)
    return exc


def _bancolombia_payload(order_number):
    """Minimal valid body — BANCOLOMBIA_TRANSFER needs no extra method fields."""
    return {
        'order_number': order_number,
        'method': 'BANCOLOMBIA_TRANSFER',
        'acceptance_token': 'acc',
        'acceptance_personal_auth_token': 'per',
    }


# ---------------------------------------------------------------------------
# 502 — the gateway failed
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch(_WOMPI_CALL)
def test_process_payment_returns_502_when_gateway_raises(mock_process, api_client, wompi_tx):
    """Catches: removing the try/except so a Wompi outage 500s the checkout."""
    mock_process.side_effect = Exception('connection reset by peer')

    response = api_client.post(
        _PROCESS_URL, _bancolombia_payload(wompi_tx.order.order_number), format='json'
    )

    assert response.status_code == 502
    assert response.data['detail'] == 'Error procesando el pago. Por favor intenta de nuevo.'


@pytest.mark.django_db
@patch(_WOMPI_CALL)
def test_process_payment_502_surfaces_wompi_reason(mock_process, api_client, wompi_tx):
    """Catches: dropping the `error.reason` extraction, blinding support to WHY it failed."""
    mock_process.side_effect = _gateway_error(
        payload={'error': {'reason': 'Token de aceptación vencido', 'type': 'INPUT_VALIDATION_ERROR'}}
    )

    response = api_client.post(
        _PROCESS_URL, _bancolombia_payload(wompi_tx.order.order_number), format='json'
    )

    assert response.status_code == 502
    assert response.data['wompi_detail'] == 'Token de aceptación vencido'


@pytest.mark.django_db
@patch(_WOMPI_CALL)
def test_process_payment_502_falls_back_to_error_type(mock_process, api_client, wompi_tx):
    """Catches: an `error` object with no `reason` losing its `type` fallback."""
    mock_process.side_effect = _gateway_error(payload={'error': {'type': 'NOT_ACCEPTABLE'}})

    response = api_client.post(
        _PROCESS_URL, _bancolombia_payload(wompi_tx.order.order_number), format='json'
    )

    assert response.status_code == 502
    assert response.data['wompi_detail'] == 'NOT_ACCEPTABLE'


@pytest.mark.django_db
@patch(_WOMPI_CALL)
def test_process_payment_502_appends_field_messages(mock_process, api_client, wompi_tx):
    """Catches: dropping `error.messages`, hiding which field Wompi rejected."""
    mock_process.side_effect = _gateway_error(
        payload={'error': {'reason': 'Datos inválidos', 'messages': {'phone_number': ['is invalid']}}}
    )

    response = api_client.post(
        _PROCESS_URL, _bancolombia_payload(wompi_tx.order.order_number), format='json'
    )

    assert response.status_code == 502
    assert response.data['wompi_detail'] == "Datos inválidos | {'phone_number': ['is invalid']}"


@pytest.mark.django_db
@patch(_WOMPI_CALL)
def test_process_payment_502_uses_raw_text_when_body_is_not_json(mock_process, api_client, wompi_tx):
    """Catches: an HTML error page from Wompi raising ValueError instead of degrading."""
    mock_process.side_effect = _gateway_error(text='<html>502 Bad Gateway</html>')

    response = api_client.post(
        _PROCESS_URL, _bancolombia_payload(wompi_tx.order.order_number), format='json'
    )

    assert response.status_code == 502
    assert response.data['wompi_detail'] == '<html>502 Bad Gateway</html>'


# ---------------------------------------------------------------------------
# 400 / 404 — rejected before the gateway is ever called
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch(_WOMPI_CALL)
def test_process_payment_rejects_missing_acceptance_tokens(mock_process, api_client, wompi_tx):
    """Catches: charging a customer who never accepted Wompi's terms."""
    response = api_client.post(_PROCESS_URL, {
        'order_number': wompi_tx.order.order_number,
        'method': 'BANCOLOMBIA_TRANSFER',
    }, format='json')

    assert response.status_code == 400
    assert response.data['detail'] == 'Faltan tokens de aceptación de Wompi. Recarga el checkout.'
    mock_process.assert_not_called()


@pytest.mark.django_db
@patch(_WOMPI_CALL)
def test_process_payment_card_requires_card_token(mock_process, api_client, wompi_tx):
    """Catches: a CARD payment reaching Wompi with no token and 500ing there."""
    response = api_client.post(_PROCESS_URL, {
        'order_number': wompi_tx.order.order_number,
        'method': 'CARD',
        'acceptance_token': 'acc',
        'acceptance_personal_auth_token': 'per',
    }, format='json')

    assert response.status_code == 400
    assert response.data['detail'] == 'card_token requerido.'
    mock_process.assert_not_called()


@pytest.mark.django_db
@patch(_WOMPI_CALL)
def test_process_payment_nequi_requires_phone_number(mock_process, api_client, wompi_tx):
    """Catches: a NEQUI charge sent without the phone it must be pushed to."""
    response = api_client.post(_PROCESS_URL, {
        'order_number': wompi_tx.order.order_number,
        'method': 'NEQUI',
        'phone_number': '   ',
        'acceptance_token': 'acc',
        'acceptance_personal_auth_token': 'per',
    }, format='json')

    assert response.status_code == 400
    assert response.data['detail'] == 'phone_number requerido.'
    mock_process.assert_not_called()


@pytest.mark.django_db
@patch(_WOMPI_CALL)
def test_process_payment_rejects_unsupported_method(mock_process, api_client, wompi_tx):
    """Catches: an unknown method falling through to Wompi instead of being refused."""
    response = api_client.post(_PROCESS_URL, {
        'order_number': wompi_tx.order.order_number,
        'method': 'CRYPTO',
        'acceptance_token': 'acc',
        'acceptance_personal_auth_token': 'per',
    }, format='json')

    assert response.status_code == 400
    assert response.data['detail'] == 'Método no soportado: CRYPTO'
    mock_process.assert_not_called()


@pytest.mark.django_db
@patch(_WOMPI_CALL)
def test_process_payment_refuses_to_charge_an_approved_order_twice(mock_process, api_client, wompi_tx):
    """Catches: the double-charge regression — a paid order accepting a second charge."""
    wompi_tx.status = WompiTransaction.Status.APPROVED
    wompi_tx.save(update_fields=['status'])

    response = api_client.post(
        _PROCESS_URL, _bancolombia_payload(wompi_tx.order.order_number), format='json'
    )

    assert response.status_code == 400
    assert response.data['detail'] == 'Este pedido ya fue pagado.'
    mock_process.assert_not_called()


@pytest.mark.django_db
@patch(_WOMPI_CALL)
def test_process_payment_returns_404_for_unknown_order(mock_process, api_client, db):
    """Catches: an unknown order number 500ing on DoesNotExist instead of 404ing."""
    response = api_client.post(_PROCESS_URL, _bancolombia_payload('MMT-00000000-NOPE'), format='json')

    assert response.status_code == 404
    assert response.data['detail'] == 'Pedido no encontrado.'
    mock_process.assert_not_called()
