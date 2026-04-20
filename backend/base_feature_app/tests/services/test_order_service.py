import pytest
from unittest.mock import patch
from django_attachments.models import Library

from base_feature_app.models import (
    Category, GlobalColor, GlobalSize, Order, OrderItem,
    OrderStatusHistory, Peluch, PeluchSizePrice, WompiTransaction
)
from base_feature_app.services.order_service import OrderService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def category(db):
    return Category.objects.create(name='Osos', slug='osos', is_active=True)


@pytest.fixture
def size(db):
    return GlobalSize.objects.create(label='Pequeño', slug='pequeno', cm='20cm')


@pytest.fixture
def color(db):
    return GlobalColor.objects.create(name='Rosa', slug='rosa', hex_code='#FF69B4')


@pytest.fixture
def peluch(db, category, color):
    library = Library.objects.create(title='Peluch Gallery')
    p = Peluch.objects.create(
        title='Osito',
        slug='osito',
        category=category,
        lead_description='Adorable',
        description='Descripción completa',
        gallery=library,
    )
    p.available_colors.add(color)
    return p


@pytest.fixture
def peluch_with_price(peluch, size):
    PeluchSizePrice.objects.create(peluch=peluch, size=size, price=80000)
    return peluch


@pytest.fixture
def base_order_data(peluch_with_price, size, color):
    return {
        'customer_name': 'Ana García',
        'customer_email': 'ana@example.com',
        'customer_phone': '3001234567',
        'address': 'Calle 123',
        'city': 'Bogotá',
        'department': 'Cundinamarca',
        'items': [
            {
                'peluch': peluch_with_price,
                'size': size,
                'color': color,
                'quantity': 1,
                'has_huella': False,
                'has_corazon': False,
                'has_audio': False,
                'huella_media': None,
                'audio_media': None,
            }
        ],
    }


@pytest.fixture
def existing_order(db):
    return Order.objects.create(
        order_number='PELUCH-20260420-TEST',
        customer_email='test@example.com',
        customer_name='Test User',
        address='Calle 1',
        city='Bogotá',
        department='Cundinamarca',
        total_amount=80000,
        deposit_amount=40000,
        balance_amount=40000,
        status=Order.Status.PENDING_PAYMENT,
    )


# ---------------------------------------------------------------------------
# generate_order_number
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_generate_order_number_has_peluch_prefix():
    number = OrderService.generate_order_number()
    assert number.startswith('PELUCH-')


@pytest.mark.django_db
def test_generate_order_number_has_date_segment():
    number = OrderService.generate_order_number()
    parts = number.split('-')
    assert len(parts) == 3
    assert len(parts[1]) == 8  # YYYYMMDD


@pytest.mark.django_db
def test_generate_order_number_suffix_is_uppercase():
    number = OrderService.generate_order_number()
    suffix = number.split('-')[2]
    assert suffix == suffix.upper()


# ---------------------------------------------------------------------------
# calculate_deposit
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_calculate_deposit_returns_half_of_total(settings):
    settings.DEPOSIT_PERCENTAGE = 50
    result = OrderService.calculate_deposit(100000)
    assert result == 50000


@pytest.mark.django_db
def test_calculate_deposit_rounds_to_nearest_100():
    result = OrderService.calculate_deposit(99999)
    assert result % 100 == 0


@pytest.mark.django_db
def test_calculate_deposit_uses_deposit_percentage_setting(settings):
    settings.DEPOSIT_PERCENTAGE = 30
    result = OrderService.calculate_deposit(100000)
    assert result == 30000


# ---------------------------------------------------------------------------
# create_order
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_creates_order_in_database(mock_media, base_order_data):
    order = OrderService.create_order(base_order_data)
    assert Order.objects.filter(id=order.id).exists()


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_creates_order_item(mock_media, base_order_data):
    order = OrderService.create_order(base_order_data)
    assert OrderItem.objects.filter(order=order).count() == 1


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_creates_wompi_transaction(mock_media, base_order_data):
    order = OrderService.create_order(base_order_data)
    assert WompiTransaction.objects.filter(order=order).exists()


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_calculates_total_from_price(mock_media, base_order_data):
    order = OrderService.create_order(base_order_data)
    assert order.total_amount == 80000


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_deposit_is_50_percent(mock_media, base_order_data, settings):
    settings.DEPOSIT_PERCENTAGE = 50
    order = OrderService.create_order(base_order_data)
    assert order.deposit_amount == 40000
    assert order.balance_amount == 40000


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_sets_status_pending_payment(mock_media, base_order_data):
    order = OrderService.create_order(base_order_data)
    assert order.status == Order.Status.PENDING_PAYMENT


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_assigns_customer_when_user_provided(mock_media, base_order_data, db):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_user(email='client@example.com', password='pass')
    order = OrderService.create_order(base_order_data, user=user)
    assert order.customer == user


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_customer_is_none_for_anonymous(mock_media, base_order_data):
    order = OrderService.create_order(base_order_data, user=None)
    assert order.customer is None


# ---------------------------------------------------------------------------
# update_status
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.NotificationService.notify_status_change')
def test_update_status_changes_order_status(mock_notify, existing_order):
    OrderService.update_status(existing_order, Order.Status.PAYMENT_CONFIRMED)
    existing_order.refresh_from_db()
    assert existing_order.status == Order.Status.PAYMENT_CONFIRMED


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.NotificationService.notify_status_change')
def test_update_status_creates_history_entry(mock_notify, existing_order):
    OrderService.update_status(existing_order, Order.Status.IN_PRODUCTION)
    assert OrderStatusHistory.objects.filter(order=existing_order).exists()


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.NotificationService.notify_status_change')
def test_update_status_records_previous_status(mock_notify, existing_order):
    previous = existing_order.status
    OrderService.update_status(existing_order, Order.Status.PAYMENT_CONFIRMED)
    history = OrderStatusHistory.objects.get(order=existing_order)
    assert history.previous_status == previous


@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.NotificationService.notify_status_change')
def test_update_status_calls_notify(mock_notify, existing_order):
    OrderService.update_status(existing_order, Order.Status.SHIPPED)
    mock_notify.assert_called_once_with(existing_order, Order.Status.SHIPPED)
