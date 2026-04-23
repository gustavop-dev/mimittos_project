import pytest
from django_attachments.models import Library

from base_feature_app.models import (
    Category,
    GlobalColor,
    GlobalSize,
    Peluch,
    PeluchSizePrice,
)
from base_feature_app.serializers.catalog import (
    CategorySerializer,
    GlobalColorSerializer,
    GlobalSizeSerializer,
    PeluchCreateUpdateSerializer,
    PeluchListSerializer,
)

# ---------------------------------------------------------------------------
# GlobalSizeSerializer
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_global_size_create_generates_slug_from_label():
    ser = GlobalSizeSerializer(data={'label': 'Muy Pequeño', 'cm': '15cm', 'sort_order': 0})
    assert ser.is_valid(), ser.errors
    instance = ser.save()
    assert instance.slug == 'muy-pequeno'


@pytest.mark.django_db
def test_global_size_create_uses_explicit_slug():
    ser = GlobalSizeSerializer(data={'label': 'Pequeño', 'slug': 'pequeno-exp', 'cm': '20cm'})
    assert ser.is_valid(), ser.errors
    instance = ser.save()
    assert instance.slug == 'pequeno-exp'


@pytest.mark.django_db
def test_global_size_create_deduplicates_slug_on_collision(db):
    GlobalSize.objects.create(label='Mediano', slug='mediano', cm='30cm')
    ser = GlobalSizeSerializer(data={'label': 'Mediano', 'cm': '30cm'})
    assert ser.is_valid(), ser.errors
    instance = ser.save()
    assert instance.slug == 'mediano-1'


@pytest.mark.django_db
def test_global_size_update_generates_slug_when_omitted(db):
    size = GlobalSize.objects.create(label='Grande', slug='grande', cm='40cm')
    ser = GlobalSizeSerializer(instance=size, data={'label': 'Super Grande', 'cm': '50cm'}, partial=True)
    assert ser.is_valid(), ser.errors
    updated = ser.save()
    assert updated.slug == 'super-grande'


@pytest.mark.django_db
def test_global_size_update_keeps_explicit_slug(db):
    size = GlobalSize.objects.create(label='XL', slug='xl', cm='60cm')
    ser = GlobalSizeSerializer(instance=size, data={'label': 'XL Plus', 'slug': 'xl-plus', 'cm': '65cm'}, partial=True)
    assert ser.is_valid(), ser.errors
    updated = ser.save()
    assert updated.slug == 'xl-plus'


# ---------------------------------------------------------------------------
# GlobalColorSerializer
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_global_color_create_generates_slug_from_name():
    ser = GlobalColorSerializer(data={'name': 'Azul Marino', 'hex_code': '#000080', 'sort_order': 0})
    assert ser.is_valid(), ser.errors
    instance = ser.save()
    assert instance.slug == 'azul-marino'


@pytest.mark.django_db
def test_global_color_create_deduplicates_slug_on_collision(db):
    GlobalColor.objects.create(name='Verde', slug='verde', hex_code='#00FF00')
    ser = GlobalColorSerializer(data={'name': 'Verde', 'hex_code': '#00EE00'})
    assert ser.is_valid(), ser.errors
    instance = ser.save()
    assert instance.slug == 'verde-1'


@pytest.mark.django_db
def test_global_color_update_generates_slug_when_omitted(db):
    color = GlobalColor.objects.create(name='Naranja', slug='naranja', hex_code='#FFA500')
    ser = GlobalColorSerializer(instance=color, data={'name': 'Naranja Oscuro', 'hex_code': '#FF8C00'}, partial=True)
    assert ser.is_valid(), ser.errors
    updated = ser.save()
    assert updated.slug == 'naranja-oscuro'


@pytest.mark.django_db
def test_global_color_update_keeps_explicit_slug(db):
    color = GlobalColor.objects.create(name='Rojo', slug='rojo', hex_code='#FF0000')
    ser = GlobalColorSerializer(instance=color, data={'name': 'Rojo Vivo', 'slug': 'rojo-vivo', 'hex_code': '#FF1111'}, partial=True)
    assert ser.is_valid(), ser.errors
    updated = ser.save()
    assert updated.slug == 'rojo-vivo'


# ---------------------------------------------------------------------------
# CategorySerializer
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_category_create_generates_slug_from_name():
    ser = CategorySerializer(data={'name': 'Peluches de Tela', 'display_order': 1})
    assert ser.is_valid(), ser.errors
    instance = ser.save()
    assert instance.slug == 'peluches-de-tela'


@pytest.mark.django_db
def test_category_create_deduplicates_slug_on_collision(db):
    Category.objects.create(name='Perros', slug='perros')
    ser = CategorySerializer(data={'name': 'Perros', 'display_order': 2})
    assert ser.is_valid(), ser.errors
    instance = ser.save()
    assert instance.slug == 'perros-1'


@pytest.mark.django_db
def test_category_update_generates_slug_when_omitted(db):
    cat = Category.objects.create(name='Conejos', slug='conejos')
    ser = CategorySerializer(instance=cat, data={'name': 'Conejos Blancos', 'display_order': 0}, partial=True)
    assert ser.is_valid(), ser.errors
    updated = ser.save()
    assert updated.slug == 'conejos-blancos'


@pytest.mark.django_db
def test_category_update_keeps_explicit_slug(db):
    cat = Category.objects.create(name='Aves', slug='aves')
    ser = CategorySerializer(instance=cat, data={'name': 'Aves y Más', 'slug': 'aves-y-mas'}, partial=True)
    assert ser.is_valid(), ser.errors
    updated = ser.save()
    assert updated.slug == 'aves-y-mas'


# ---------------------------------------------------------------------------
# PeluchCreateUpdateSerializer
# ---------------------------------------------------------------------------

@pytest.fixture
def cat(db):
    return Category.objects.create(name='Serpientes', slug='serpientes')


@pytest.mark.django_db
def test_peluch_create_creates_gallery_automatically(cat):
    ser = PeluchCreateUpdateSerializer(data={
        'title': 'Serpentina',
        'slug': 'serpentina',
        'category': cat.id,
        'lead_description': 'Suave',
    })
    assert ser.is_valid(), ser.errors
    peluch = ser.save()
    assert peluch.gallery is not None
    assert Library.objects.filter(id=peluch.gallery_id).exists()


@pytest.mark.django_db
def test_peluch_create_syncs_colors(cat, db):
    color = GlobalColor.objects.create(name='Lila', slug='lila', hex_code='#C8A2C8')
    ser = PeluchCreateUpdateSerializer(data={
        'title': 'Lila Peluch',
        'slug': 'lila-peluch',
        'category': cat.id,
        'lead_description': 'Bonito',
        'available_color_ids': [color.id],
    })
    assert ser.is_valid(), ser.errors
    peluch = ser.save()
    assert peluch.available_colors.filter(id=color.id).exists()


@pytest.mark.django_db
def test_peluch_create_syncs_size_prices(cat, db):
    size = GlobalSize.objects.create(label='Mini', slug='mini', cm='10cm')
    ser = PeluchCreateUpdateSerializer(data={
        'title': 'Mini Peluch',
        'slug': 'mini-peluch',
        'category': cat.id,
        'lead_description': 'Pequeñito',
        'size_prices_data': [{'size_id': size.id, 'price': '50000.00', 'is_available': True}],
    })
    assert ser.is_valid(), ser.errors
    peluch = ser.save()
    assert PeluchSizePrice.objects.filter(peluch=peluch, size=size).exists()


@pytest.mark.django_db
def test_peluch_update_syncs_colors(cat, db):
    library = Library.objects.create(title='Update Gallery')
    peluch = Peluch.objects.create(
        title='Old Peluch', slug='old-peluch', category=cat, lead_description='Old', gallery=library,
    )
    new_color = GlobalColor.objects.create(name='Celeste', slug='celeste', hex_code='#87CEEB')
    ser = PeluchCreateUpdateSerializer(instance=peluch, data={
        'title': 'Old Peluch',
        'slug': 'old-peluch',
        'category': cat.id,
        'lead_description': 'Updated',
        'available_color_ids': [new_color.id],
    })
    assert ser.is_valid(), ser.errors
    updated = ser.save()
    assert updated.available_colors.filter(id=new_color.id).exists()


# ---------------------------------------------------------------------------
# PeluchListSerializer — computed fields
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_peluch_list_serializer_min_price_returns_none_without_prices(cat, db):
    library = Library.objects.create(title='Empty Gallery')
    peluch = Peluch.objects.create(
        title='No Price', slug='no-price', category=cat, lead_description='Test', gallery=library,
    )
    ser = PeluchListSerializer(instance=peluch)
    assert ser.data['min_price'] is None


@pytest.mark.django_db
def test_peluch_list_serializer_discounted_price_applies_discount(cat, db):
    library = Library.objects.create(title='Discount Gallery')
    peluch = Peluch.objects.create(
        title='Discount Peluch', slug='discount-peluch', category=cat,
        lead_description='Test', gallery=library, discount_pct=10,
    )
    size = GlobalSize.objects.create(label='Disco', slug='disco', cm='25cm')
    PeluchSizePrice.objects.create(peluch=peluch, size=size, price=100000, is_available=True)
    ser = PeluchListSerializer(instance=peluch)
    assert ser.data['discounted_min_price'] == 90000
