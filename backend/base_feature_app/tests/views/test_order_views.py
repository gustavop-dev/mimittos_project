import pytest
from unittest.mock import patch
from django_attachments.models import Library

from base_feature_app.models import (
    Category, GlobalColor, GlobalSize, Order, Peluch, PeluchSizePrice, WompiTransaction
)


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
def order_data(peluch_with_price, size, color):
    return {
        'customer_name': 'Ana García',
        'customer_email': 'ana@example.com',
        'customer_phone': '3001234567',
        'address': 'Calle 123',
        'city': 'Bogotá',
        'department': 'Cundinamarca',
        'items': [
            {
                'peluch_id': peluch_with_price.id,
                'size_id': size.id,
                'color_id': color.id,
                'quantity': 1,
                'has_huella': False,
                'has_corazon': False,
                'has_audio': False,
            }
        ],
    }


@pytest.fixture
def existing_order(db, existing_user):
    return Order.objects.create(
        order_number='PELUCH-20260420-TEST',
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
def existing_user(db):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    return User.objects.create_user(email='user@example.com', password='pass')


@pytest.fixture
def admin_user(db):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    u = User.objects.create_user(email='admin@example.com', password='pass')
    u.is_staff = True
    u.save(update_fields=['is_staff'])
    return u


@pytest.fixture
def authenticated_client(existing_user):
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=existing_user)
    return client


@pytest.fixture
def admin_client(admin_user):
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def anon_client():
    from rest_framework.test import APIClient
    return APIClient()


# ---------------------------------------------------------------------------
# POST /api/orders/ — create order
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('base_feature_app.views.order_views.NotificationService.notify_new_order_admin', return_value=True)
def test_create_order_returns_201_with_valid_data(mock_notify, anon_client, order_data):
    response = anon_client.post('/api/orders/', order_data, format='json')
    assert response.status_code == 201
    assert 'order_number' in response.data


@pytest.mark.django_db
@patch('base_feature_app.views.order_views.NotificationService.notify_new_order_admin', return_value=True)
def test_create_order_stores_order_in_database(mock_notify, anon_client, order_data):
    anon_client.post('/api/orders/', order_data, format='json')
    assert Order.objects.filter(customer_email='ana@example.com').exists()


@pytest.mark.django_db
@patch('base_feature_app.views.order_views.NotificationService.notify_new_order_admin', return_value=True)
def test_create_order_returns_amounts_in_response(mock_notify, anon_client, order_data):
    response = anon_client.post('/api/orders/', order_data, format='json')
    assert response.data['total_amount'] == 80000
    assert response.data['deposit_amount'] == 40000
    assert response.data['balance_amount'] == 40000


@pytest.mark.django_db
def test_create_order_returns_400_for_missing_fields(anon_client):
    response = anon_client.post('/api/orders/', {}, format='json')
    assert response.status_code == 400


@pytest.mark.django_db
def test_create_order_returns_400_for_empty_items(anon_client, order_data):
    order_data['items'] = []
    response = anon_client.post('/api/orders/', order_data, format='json')
    assert response.status_code == 400


@pytest.mark.django_db
@patch('base_feature_app.views.order_views.NotificationService.notify_new_order_admin', return_value=True)
def test_create_order_returns_201_with_expected_keys(mock_notify, anon_client, order_data):
    response = anon_client.post('/api/orders/', order_data, format='json')
    assert response.status_code == 201
    for key in ('order_number', 'deposit_amount', 'balance_amount', 'total_amount', 'is_guest'):
        assert key in response.data


# ---------------------------------------------------------------------------
# GET /api/orders/track/<order_number>/ — public tracking
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_track_order_returns_200_for_valid_order(anon_client, existing_order):
    response = anon_client.get(f'/api/orders/track/{existing_order.order_number}/')
    assert response.status_code == 200
    assert response.data['order_number'] == existing_order.order_number


@pytest.mark.django_db
def test_track_order_returns_404_for_nonexistent_order(anon_client):
    response = anon_client.get('/api/orders/track/PELUCH-NOEXISTE-0000/')
    assert response.status_code == 404


@pytest.mark.django_db
def test_track_order_returns_status_in_response(anon_client, existing_order):
    response = anon_client.get(f'/api/orders/track/{existing_order.order_number}/')
    assert 'status' in response.data


# ---------------------------------------------------------------------------
# GET /api/orders/my/ — authenticated customer orders
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_my_orders_returns_200_for_authenticated_user(authenticated_client, existing_order):
    response = authenticated_client.get('/api/orders/my/')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_my_orders_returns_401_for_anonymous(anon_client):
    response = anon_client.get('/api/orders/my/')
    assert response.status_code == 401


@pytest.mark.django_db
def test_my_orders_only_returns_own_orders(authenticated_client, db, existing_user, admin_user):
    Order.objects.create(
        order_number='PELUCH-20260420-ADMN',
        customer=admin_user,
        customer_email=admin_user.email,
        customer_name='Admin User',
        address='Calle 2',
        city='Medellín',
        department='Antioquia',
        total_amount=50000,
        deposit_amount=25000,
        balance_amount=25000,
    )
    response = authenticated_client.get('/api/orders/my/')
    assert response.status_code == 200
    assert len(response.data) == 0


# ---------------------------------------------------------------------------
# GET /api/orders/list/ — admin list
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_orders_list_returns_200_for_admin(admin_client, existing_order):
    response = admin_client.get('/api/orders/list/')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_orders_list_returns_403_for_anonymous(anon_client):
    response = anon_client.get('/api/orders/list/')
    assert response.status_code == 403


@pytest.mark.django_db
def test_orders_list_filters_by_status(admin_client, existing_order):
    response = admin_client.get('/api/orders/list/?status=pending_payment')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_orders_list_filters_by_city(admin_client, existing_order):
    response = admin_client.get('/api/orders/list/?city=Bogotá')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_orders_list_returns_empty_for_unmatched_city(admin_client, existing_order):
    response = admin_client.get('/api/orders/list/?city=NoExiste')
    assert response.status_code == 200
    assert len(response.data) == 0


# ---------------------------------------------------------------------------
# GET /api/orders/<order_number>/ — order detail
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_order_detail_returns_200_for_owner(authenticated_client, existing_order):
    response = authenticated_client.get(f'/api/orders/{existing_order.order_number}/')
    assert response.status_code == 200
    assert response.data['order_number'] == existing_order.order_number


@pytest.mark.django_db
def test_order_detail_returns_200_for_admin(admin_client, existing_order):
    response = admin_client.get(f'/api/orders/{existing_order.order_number}/')
    assert response.status_code == 200


@pytest.mark.django_db
def test_order_detail_returns_403_for_other_user(db, existing_order):
    from django.contrib.auth import get_user_model
    from rest_framework.test import APIClient
    User = get_user_model()
    other = User.objects.create_user(email='other@example.com', password='pass')
    client = APIClient()
    client.force_authenticate(user=other)
    response = client.get(f'/api/orders/{existing_order.order_number}/')
    assert response.status_code == 403


@pytest.mark.django_db
def test_order_detail_returns_404_for_nonexistent(admin_client):
    response = admin_client.get('/api/orders/PELUCH-NOEXISTE-0000/')
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /api/orders/<order_number>/status/ — update status (admin)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('base_feature_app.services.notification_service.NotificationService.notify_status_change')
def test_update_order_status_returns_200_for_admin(mock_notify, admin_client, existing_order):
    payload = {'status': 'payment_confirmed', 'notes': 'Pago verificado'}
    response = admin_client.patch(f'/api/orders/{existing_order.order_number}/status/', payload)
    assert response.status_code == 200
    existing_order.refresh_from_db()
    assert existing_order.status == Order.Status.PAYMENT_CONFIRMED


@pytest.mark.django_db
def test_update_order_status_returns_403_for_anonymous(anon_client, existing_order):
    response = anon_client.patch(f'/api/orders/{existing_order.order_number}/status/', {'status': 'payment_confirmed'})
    assert response.status_code == 403


@pytest.mark.django_db
def test_update_order_status_returns_400_for_invalid_status(admin_client, existing_order):
    response = admin_client.patch(f'/api/orders/{existing_order.order_number}/status/', {'status': 'invalid_status'})
    assert response.status_code == 400


@pytest.mark.django_db
def test_update_order_status_returns_404_for_missing_order(admin_client):
    response = admin_client.patch('/api/orders/PELUCH-NOEXISTE-0000/status/', {'status': 'payment_confirmed'})
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /api/orders/<order_number>/tracking/ — update tracking (admin)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_update_order_tracking_stores_tracking_number(admin_client, existing_order):
    payload = {'tracking_number': '123456', 'shipping_carrier': 'Servientrega'}
    response = admin_client.patch(f'/api/orders/{existing_order.order_number}/tracking/', payload)
    assert response.status_code == 200
    existing_order.refresh_from_db()
    assert existing_order.tracking_number == '123456'
    assert existing_order.shipping_carrier == 'Servientrega'


@pytest.mark.django_db
def test_update_order_tracking_returns_403_for_anonymous(anon_client, existing_order):
    response = anon_client.patch(f'/api/orders/{existing_order.order_number}/tracking/', {'tracking_number': '123'})
    assert response.status_code == 403


@pytest.mark.django_db
def test_update_order_tracking_returns_404_for_missing_order(admin_client):
    response = admin_client.patch('/api/orders/PELUCH-NOEXISTE-0000/tracking/', {'tracking_number': '123'})
    assert response.status_code == 404
