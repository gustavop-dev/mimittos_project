import pytest
from django_attachments.models import Library
from rest_framework.test import APIRequestFactory

from base_feature_app.models import (
    Category,
    GlobalColor,
    GlobalSize,
    Order,
    OrderItem,
    Peluch,
    PeluchSizePrice,
    PersonalizationMedia,
)
from base_feature_app.serializers.order import (
    OrderCreateSerializer,
    OrderItemCreateSerializer,
    OrderItemReadSerializer,
    OrderStatusUpdateSerializer,
    OrderTrackingUpdateSerializer,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def category(db):
    return Category.objects.create(name='Gatos', slug='gatos-ser', is_active=True)


@pytest.fixture
def color(db):
    return GlobalColor.objects.create(name='Negro', slug='negro-ser', hex_code='#000000', is_active=True)


@pytest.fixture
def size(db):
    return GlobalSize.objects.create(label='Grande', slug='grande-ser', cm='40cm', is_active=True)


@pytest.fixture
def peluch(db, category, color):
    library = Library.objects.create(title='Serializer Gallery')
    p = Peluch.objects.create(
        title='Gatito Negro',
        slug='gatito-negro-ser',
        category=category,
        lead_description='Adorable',
        gallery=library,
        is_active=True,
    )
    p.available_colors.add(color)
    return p


@pytest.fixture
def peluch_with_price(peluch, size):
    PeluchSizePrice.objects.create(peluch=peluch, size=size, price=90000, is_available=True)
    return peluch


@pytest.fixture
def huella_peluch(db, category, color):
    library = Library.objects.create(title='Huella Gallery')
    p = Peluch.objects.create(
        title='Gatito Huella',
        slug='gatito-huella-ser',
        category=category,
        lead_description='Con huella',
        gallery=library,
        is_active=True,
        has_huella=True,
        has_audio=True,
    )
    p.available_colors.add(color)
    return p


@pytest.fixture
def huella_peluch_with_price(huella_peluch, size):
    PeluchSizePrice.objects.create(peluch=huella_peluch, size=size, price=95000, is_available=True)
    return huella_peluch


@pytest.fixture
def huella_image(db, existing_user):
    return PersonalizationMedia.objects.create(
        uploaded_by=existing_user,
        media_type=PersonalizationMedia.MediaType.HUELLA_IMAGE,
        file='personalizations/2026/01/test.jpg',
        file_size_kb=100,
    )


@pytest.fixture
def audio_media(db, existing_user):
    return PersonalizationMedia.objects.create(
        uploaded_by=existing_user,
        media_type=PersonalizationMedia.MediaType.AUDIO,
        file='personalizations/2026/01/test.mp3',
        file_size_kb=200,
        duration_sec=5.0,
    )


def _base_item(peluch_id, size_id, color_id):
    return {
        'peluch_id': peluch_id,
        'size_id': size_id,
        'color_id': color_id,
        'quantity': 1,
        'has_huella': False,
        'has_corazon': False,
        'has_audio': False,
    }


# ---------------------------------------------------------------------------
# OrderItemCreateSerializer — peluch validation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_order_item_rejects_nonexistent_peluch(size, color):
    data = _base_item(99999, size.id, color.id)
    ser = OrderItemCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'peluch_id' in str(ser.errors)


@pytest.mark.django_db
def test_order_item_rejects_inactive_size(peluch, color):
    data = _base_item(peluch.id, 99998, color.id)
    ser = OrderItemCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'size_id' in str(ser.errors)


@pytest.mark.django_db
def test_order_item_rejects_inactive_color(peluch_with_price, size):
    inactive = GlobalColor.objects.create(name='Morado', slug='morado-ser2', hex_code='#800080', is_active=False)
    data = _base_item(peluch_with_price.id, size.id, inactive.id)
    ser = OrderItemCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'color_id' in str(ser.errors)


@pytest.mark.django_db
def test_order_item_rejects_color_not_available_for_peluch(peluch_with_price, size, db):
    other_color = GlobalColor.objects.create(name='Verde', slug='verde-ser', hex_code='#00FF00', is_active=True)
    data = _base_item(peluch_with_price.id, size.id, other_color.id)
    ser = OrderItemCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'color_id' in str(ser.errors)


@pytest.mark.django_db
def test_order_item_rejects_unavailable_size_price(peluch, color, size):
    PeluchSizePrice.objects.create(peluch=peluch, size=size, price=80000, is_available=False)
    data = _base_item(peluch.id, size.id, color.id)
    ser = OrderItemCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'size_id' in str(ser.errors)


@pytest.mark.django_db
def test_order_item_rejects_huella_on_peluch_without_huella(peluch_with_price, size, color):
    data = {**_base_item(peluch_with_price.id, size.id, color.id), 'has_huella': True, 'huella_type': 'name'}
    ser = OrderItemCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'has_huella' in str(ser.errors)


@pytest.mark.django_db
def test_order_item_rejects_image_huella_without_media(huella_peluch_with_price, size, color):
    data = {
        **_base_item(huella_peluch_with_price.id, size.id, color.id),
        'has_huella': True,
        'huella_type': OrderItem.HuellaType.IMAGE,
    }
    ser = OrderItemCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'huella_media_id' in str(ser.errors)


@pytest.mark.django_db
def test_order_item_rejects_image_huella_with_nonexistent_media(huella_peluch_with_price, size, color):
    data = {
        **_base_item(huella_peluch_with_price.id, size.id, color.id),
        'has_huella': True,
        'huella_type': OrderItem.HuellaType.IMAGE,
        'huella_media_id': 99999,
    }
    ser = OrderItemCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'huella_media_id' in str(ser.errors)


@pytest.mark.django_db
def test_order_item_rejects_audio_on_peluch_without_audio(peluch_with_price, size, color):
    data = {**_base_item(peluch_with_price.id, size.id, color.id), 'has_audio': True}
    ser = OrderItemCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'has_audio' in str(ser.errors)


@pytest.mark.django_db
def test_order_item_rejects_audio_without_media(huella_peluch_with_price, size, color):
    data = {**_base_item(huella_peluch_with_price.id, size.id, color.id), 'has_audio': True}
    ser = OrderItemCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'audio_media_id' in str(ser.errors)


@pytest.mark.django_db
def test_order_item_rejects_audio_with_nonexistent_media(huella_peluch_with_price, size, color):
    data = {
        **_base_item(huella_peluch_with_price.id, size.id, color.id),
        'has_audio': True,
        'audio_media_id': 99999,
    }
    ser = OrderItemCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'audio_media_id' in str(ser.errors)


@pytest.mark.django_db
def test_order_item_valid_data_passes(peluch_with_price, size, color):
    data = _base_item(peluch_with_price.id, size.id, color.id)
    ser = OrderItemCreateSerializer(data=data)
    assert ser.is_valid(), ser.errors
    assert ser.validated_data['peluch'] == peluch_with_price


# ---------------------------------------------------------------------------
# OrderCreateSerializer
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_order_create_requires_at_least_one_item():
    data = {
        'customer_name': 'Test',
        'customer_email': 'test@example.com',
        'address': 'Calle 1',
        'city': 'Bogotá',
        'department': 'Cundinamarca',
        'items': [],
    }
    ser = OrderCreateSerializer(data=data)
    assert not ser.is_valid()
    assert 'items' in str(ser.errors)


# ---------------------------------------------------------------------------
# OrderStatusUpdateSerializer
# ---------------------------------------------------------------------------

def test_order_status_update_rejects_invalid_status():
    ser = OrderStatusUpdateSerializer(data={'status': 'nonexistent_status'})
    assert not ser.is_valid()
    assert 'status' in ser.errors


def test_order_status_update_accepts_valid_status():
    ser = OrderStatusUpdateSerializer(data={'status': Order.Status.IN_PRODUCTION})
    assert ser.is_valid(), ser.errors


# ---------------------------------------------------------------------------
# OrderTrackingUpdateSerializer
# ---------------------------------------------------------------------------

def test_order_tracking_update_requires_tracking_number():
    ser = OrderTrackingUpdateSerializer(data={})
    assert not ser.is_valid()
    assert 'tracking_number' in ser.errors


def test_order_tracking_update_accepts_valid_data():
    ser = OrderTrackingUpdateSerializer(data={'tracking_number': 'TRK-001', 'shipping_carrier': 'Servientrega'})
    assert ser.is_valid(), ser.errors


# ---------------------------------------------------------------------------
# OrderItemReadSerializer — personalization media exposure
# ---------------------------------------------------------------------------

@pytest.fixture
def read_order(db):
    return Order.objects.create(
        customer_email='read@example.com',
        customer_name='Read Tester',
        address='Calle 1',
        city='Bogotá',
        department='Cundinamarca',
        total_amount=90000,
        deposit_amount=45000,
        balance_amount=45000,
    )


@pytest.mark.django_db
def test_order_item_read_exposes_audio_media_url(read_order, peluch_with_price, size, color, audio_media):
    item = OrderItem.objects.create(
        order=read_order, peluch=peluch_with_price, size=size, color=color,
        quantity=1, unit_price=90000, has_audio=True, audio_media=audio_media,
        personalization_cost=20000,
    )
    request = APIRequestFactory().get('/')
    data = OrderItemReadSerializer(item, context={'request': request}).data
    assert data['audio_media_url'].endswith('/media/personalizations/2026/01/test.mp3')


@pytest.mark.django_db
def test_order_item_read_exposes_audio_duration(read_order, peluch_with_price, size, color, audio_media):
    item = OrderItem.objects.create(
        order=read_order, peluch=peluch_with_price, size=size, color=color,
        quantity=1, unit_price=90000, has_audio=True, audio_media=audio_media,
    )
    data = OrderItemReadSerializer(item, context={'request': APIRequestFactory().get('/')}).data
    assert data['audio_duration_sec'] == 5.0


@pytest.mark.django_db
def test_order_item_read_exposes_audio_size_kb(read_order, peluch_with_price, size, color, audio_media):
    item = OrderItem.objects.create(
        order=read_order, peluch=peluch_with_price, size=size, color=color,
        quantity=1, unit_price=90000, has_audio=True, audio_media=audio_media,
    )
    data = OrderItemReadSerializer(item, context={'request': APIRequestFactory().get('/')}).data
    assert data['audio_size_kb'] == 200


@pytest.mark.django_db
def test_order_item_read_exposes_huella_media_url(read_order, peluch_with_price, size, color, huella_image):
    item = OrderItem.objects.create(
        order=read_order, peluch=peluch_with_price, size=size, color=color,
        quantity=1, unit_price=90000, has_huella=True,
        huella_type=OrderItem.HuellaType.IMAGE, huella_media=huella_image,
    )
    data = OrderItemReadSerializer(item, context={'request': APIRequestFactory().get('/')}).data
    assert data['huella_media_url'].endswith('/media/personalizations/2026/01/test.jpg')


@pytest.mark.django_db
def test_order_item_read_audio_fields_are_null_without_media(read_order, peluch_with_price, size, color):
    item = OrderItem.objects.create(
        order=read_order, peluch=peluch_with_price, size=size, color=color,
        quantity=1, unit_price=90000,
    )
    data = OrderItemReadSerializer(item, context={'request': APIRequestFactory().get('/')}).data
    assert data['audio_media_url'] is None
    assert data['audio_duration_sec'] is None
    assert data['audio_size_kb'] is None
    assert data['huella_media_url'] is None


@pytest.mark.django_db
def test_order_item_read_returns_relative_url_without_request_context(read_order, peluch_with_price, size, color, audio_media):
    item = OrderItem.objects.create(
        order=read_order, peluch=peluch_with_price, size=size, color=color,
        quantity=1, unit_price=90000, has_audio=True, audio_media=audio_media,
    )
    data = OrderItemReadSerializer(item).data
    assert data['audio_media_url'] == '/media/personalizations/2026/01/test.mp3'


@pytest.mark.django_db
def test_order_item_read_returns_null_for_deleted_size(read_order, peluch_with_price, size, color):
    item = OrderItem.objects.create(
        order=read_order, peluch=peluch_with_price, size=size, color=color,
        quantity=1, unit_price=90000,
    )
    item.size = None
    item.save()

    data = OrderItemReadSerializer(item).data

    assert data['size'] is None


@pytest.mark.django_db
def test_order_item_read_returns_null_for_deleted_color(read_order, peluch_with_price, size, color):
    item = OrderItem.objects.create(
        order=read_order, peluch=peluch_with_price, size=size, color=color,
        quantity=1, unit_price=90000,
    )
    item.color = None
    item.save()

    data = OrderItemReadSerializer(item).data

    assert data['color'] is None
