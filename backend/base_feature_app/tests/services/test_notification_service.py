import pytest
from datetime import timedelta
from unittest.mock import patch
from django.utils import timezone
from freezegun import freeze_time

from base_feature_app.models import Order
from base_feature_app.services.notification_service import NotificationService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def base_order(db):
    return Order.objects.create(
        order_number='PELUCH-20260420-N001',
        customer_email='client@example.com',
        customer_name='María López',
        customer_phone='3001112233',
        address='Calle 45',
        city='Medellín',
        department='Antioquia',
        total_amount=120000,
        deposit_amount=60000,
        balance_amount=60000,
        tracking_number='',
        shipping_carrier='',
    )


@pytest.fixture
def order_with_recent_email(base_order):
    base_order.last_automated_email_at = timezone.now() - timedelta(hours=1)
    base_order.save(update_fields=['last_automated_email_at'])
    return base_order


@pytest.fixture
def order_with_old_email(base_order):
    base_order.last_automated_email_at = timezone.now() - timedelta(hours=25)
    base_order.save(update_fields=['last_automated_email_at'])
    return base_order


# ---------------------------------------------------------------------------
# notify_order_confirmation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail')
def test_notify_order_confirmation_sends_email(mock_mail, base_order):
    result = NotificationService.notify_order_confirmation(base_order)
    assert result is True
    mock_mail.assert_called_once()


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail')
def test_notify_order_confirmation_respects_cooldown(mock_mail, order_with_recent_email):
    result = NotificationService.notify_order_confirmation(order_with_recent_email)
    assert result is False
    mock_mail.assert_not_called()


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail')
def test_notify_order_confirmation_sends_after_cooldown_expires(mock_mail, order_with_old_email):
    result = NotificationService.notify_order_confirmation(order_with_old_email)
    assert result is True
    mock_mail.assert_called_once()


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail')
def test_notify_order_confirmation_updates_last_sent_at(mock_mail, base_order):
    NotificationService.notify_order_confirmation(base_order)
    base_order.refresh_from_db()
    assert base_order.last_automated_email_at is not None


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail', side_effect=Exception('SMTP error'))
def test_notify_order_confirmation_returns_false_on_smtp_error(mock_mail, base_order):
    result = NotificationService.notify_order_confirmation(base_order)
    assert result is False


# ---------------------------------------------------------------------------
# notify_production_started
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail')
def test_notify_production_started_sends_email(mock_mail, base_order):
    result = NotificationService.notify_production_started(base_order)
    assert result is True
    mock_mail.assert_called_once()


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail')
def test_notify_production_started_respects_cooldown(mock_mail, order_with_recent_email):
    result = NotificationService.notify_production_started(order_with_recent_email)
    assert result is False


# ---------------------------------------------------------------------------
# notify_order_shipped
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail')
def test_notify_order_shipped_sends_email_without_tracking(mock_mail, base_order):
    result = NotificationService.notify_order_shipped(base_order)
    assert result is True
    call_args = mock_mail.call_args
    assert 'La guía estará disponible pronto' in call_args[0][1]


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail')
def test_notify_order_shipped_includes_tracking_number_when_available(mock_mail, base_order):
    base_order.tracking_number = 'TRACK-12345'
    base_order.shipping_carrier = 'Servientrega'
    base_order.save()
    NotificationService.notify_order_shipped(base_order)
    call_args = mock_mail.call_args
    assert 'TRACK-12345' in call_args[0][1]


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail')
def test_notify_order_shipped_respects_cooldown(mock_mail, order_with_recent_email):
    result = NotificationService.notify_order_shipped(order_with_recent_email)
    assert result is False


# ---------------------------------------------------------------------------
# notify_new_order_admin
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail')
def test_notify_new_order_admin_sends_email_when_configured(mock_mail, base_order, settings):
    settings.ADMIN_EMAIL = 'admin@peluchelandia.com'
    result = NotificationService.notify_new_order_admin(base_order)
    assert result is True
    mock_mail.assert_called_once()


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail')
def test_notify_new_order_admin_skips_when_no_email_configured(mock_mail, base_order, settings):
    settings.ADMIN_EMAIL = ''
    result = NotificationService.notify_new_order_admin(base_order)
    assert result is False
    mock_mail.assert_not_called()


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.send_mail', side_effect=Exception('SMTP error'))
def test_notify_new_order_admin_returns_false_on_smtp_error(mock_mail, base_order, settings):
    settings.ADMIN_EMAIL = 'admin@peluchelandia.com'
    result = NotificationService.notify_new_order_admin(base_order)
    assert result is False


# ---------------------------------------------------------------------------
# notify_status_change
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('base_feature_project.tasks.send_order_confirmation_email')
def test_notify_status_change_dispatches_task_for_payment_confirmed(mock_task, base_order):
    NotificationService.notify_status_change(base_order, Order.Status.PAYMENT_CONFIRMED)
    mock_task.assert_called_once_with(base_order.id)


@pytest.mark.django_db
@patch('base_feature_project.tasks.send_production_started_email')
def test_notify_status_change_dispatches_task_for_in_production(mock_task, base_order):
    NotificationService.notify_status_change(base_order, Order.Status.IN_PRODUCTION)
    mock_task.assert_called_once_with(base_order.id)


@pytest.mark.django_db
@patch('base_feature_project.tasks.send_order_shipped_email')
def test_notify_status_change_dispatches_task_for_shipped(mock_task, base_order):
    NotificationService.notify_status_change(base_order, Order.Status.SHIPPED)
    mock_task.assert_called_once_with(base_order.id)


@pytest.mark.django_db
def test_notify_status_change_does_nothing_for_unmapped_status(base_order):
    NotificationService.notify_status_change(base_order, Order.Status.CANCELLED)
