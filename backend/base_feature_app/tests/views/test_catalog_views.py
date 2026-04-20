import pytest
from django_attachments.models import Library
from rest_framework.test import APIClient

from base_feature_app.models import Category, GlobalColor, GlobalSize, Peluch, PeluchSizePrice


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_user(email='admin@example.com', password='pass')
    user.is_staff = True
    user.save(update_fields=['is_staff'])
    return user


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def category(db):
    return Category.objects.create(name='Osos', slug='osos', is_active=True)


@pytest.fixture
def size_small(db):
    return GlobalSize.objects.create(label='Pequeño', slug='pequeno', cm='20cm', sort_order=1)


@pytest.fixture
def size_large(db):
    return GlobalSize.objects.create(label='Grande', slug='grande', cm='40cm', sort_order=2)


@pytest.fixture
def color_pink(db):
    return GlobalColor.objects.create(name='Rosa', slug='rosa', hex_code='#FF69B4', sort_order=1)


@pytest.fixture
def peluch(db, category, color_pink):
    library = Library.objects.create(title='Test Gallery')
    p = Peluch.objects.create(
        title='Osito Rosa',
        slug='osito-rosa',
        category=category,
        lead_description='Adorable osito',
        description='Descripción completa',
        gallery=library,
    )
    p.available_colors.add(color_pink)
    return p


@pytest.fixture
def peluch_with_price(peluch, size_small):
    PeluchSizePrice.objects.create(peluch=peluch, size=size_small, price=50000)
    return peluch


@pytest.fixture
def featured_peluch(db, category):
    library = Library.objects.create(title='Featured Gallery')
    p = Peluch.objects.create(
        title='Peluche Destacado',
        slug='peluche-destacado',
        category=category,
        lead_description='Destacado',
        description='El más vendido',
        is_featured=True,
        gallery=library,
    )
    return p


# ---------------------------------------------------------------------------
# Sizes endpoint
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_sizes_list_returns_active_sizes(api_client, size_small):
    response = api_client.get('/api/sizes/')
    assert response.status_code == 200
    slugs = [s['slug'] for s in response.data]
    assert 'pequeno' in slugs


@pytest.mark.django_db
def test_sizes_list_excludes_inactive_sizes(api_client, db):
    GlobalSize.objects.create(label='Inactivo', slug='inactivo', cm='5cm', is_active=False)
    response = api_client.get('/api/sizes/')
    slugs = [s['slug'] for s in response.data]
    assert 'inactivo' not in slugs


# ---------------------------------------------------------------------------
# Colors endpoint
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_colors_list_returns_active_colors(api_client, color_pink):
    response = api_client.get('/api/colors/')
    assert response.status_code == 200
    slugs = [c['slug'] for c in response.data]
    assert 'rosa' in slugs


@pytest.mark.django_db
def test_colors_list_excludes_inactive_colors(api_client, db):
    GlobalColor.objects.create(name='Invisible', slug='invisible', hex_code='#000', is_active=False)
    response = api_client.get('/api/colors/')
    slugs = [c['slug'] for c in response.data]
    assert 'invisible' not in slugs


# ---------------------------------------------------------------------------
# Categories endpoint
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_categories_get_returns_active_categories(api_client, category):
    response = api_client.get('/api/categories/')
    assert response.status_code == 200
    names = [c['name'] for c in response.data]
    assert 'Osos' in names


@pytest.mark.django_db
def test_categories_post_creates_category_as_admin(admin_client):
    payload = {'name': 'Conejos', 'slug': 'conejos', 'description': '', 'display_order': 0, 'is_active': True}
    response = admin_client.post('/api/categories/', payload)
    assert response.status_code == 201
    assert Category.objects.filter(slug='conejos').exists()


@pytest.mark.django_db
def test_categories_post_returns_403_for_anonymous(api_client):
    payload = {'name': 'Conejos', 'slug': 'conejos'}
    response = api_client.post('/api/categories/', payload)
    assert response.status_code == 403


@pytest.mark.django_db
def test_categories_post_returns_400_for_invalid_data(admin_client):
    response = admin_client.post('/api/categories/', {})
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# Category detail endpoint
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_category_detail_patch_updates_name(admin_client, category):
    response = admin_client.patch(f'/api/categories/{category.id}/', {'name': 'Osos Polares'})
    assert response.status_code == 200
    category.refresh_from_db()
    assert category.name == 'Osos Polares'


@pytest.mark.django_db
def test_category_detail_delete_removes_category(admin_client, category):
    response = admin_client.delete(f'/api/categories/{category.id}/')
    assert response.status_code == 204
    assert not Category.objects.filter(id=category.id).exists()


@pytest.mark.django_db
def test_category_detail_returns_403_for_anonymous(api_client, category):
    response = api_client.delete(f'/api/categories/{category.id}/')
    assert response.status_code == 403


@pytest.mark.django_db
def test_category_detail_returns_404_for_missing_id(admin_client):
    response = admin_client.patch('/api/categories/99999/', {'name': 'Ghost'})
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Peluches list endpoint
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_peluches_list_returns_active_peluches(api_client, peluch):
    response = api_client.get('/api/peluches/')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_peluches_list_excludes_inactive_peluche(api_client, peluch):
    peluch.is_active = False
    peluch.save()
    response = api_client.get('/api/peluches/')
    assert response.status_code == 200
    assert len(response.data) == 0


@pytest.mark.django_db
def test_peluches_list_filters_by_category_slug(api_client, peluch, category):
    response = api_client.get(f'/api/peluches/?category={category.slug}')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_peluches_list_returns_empty_for_nonexistent_category(api_client, peluch):
    response = api_client.get('/api/peluches/?category=no-existe')
    assert response.status_code == 200
    assert len(response.data) == 0


@pytest.mark.django_db
def test_peluches_list_filters_by_color_slug(api_client, peluch, color_pink):
    response = api_client.get(f'/api/peluches/?color={color_pink.slug}')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_peluches_list_filters_by_size_slug(api_client, peluch_with_price, size_small):
    response = api_client.get(f'/api/peluches/?size={size_small.slug}')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_peluches_list_filters_by_min_price(api_client, peluch_with_price):
    response = api_client.get('/api/peluches/?min_price=40000')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_peluches_list_filters_by_max_price_excludes_above(api_client, peluch_with_price):
    response = api_client.get('/api/peluches/?max_price=20000')
    assert response.status_code == 200
    assert len(response.data) == 0


@pytest.mark.django_db
def test_peluches_list_filters_has_huella(api_client, peluch):
    peluch.has_huella = True
    peluch.save()
    response = api_client.get('/api/peluches/?has_huella=true')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_peluches_list_filters_has_audio(api_client, peluch):
    peluch.has_audio = True
    peluch.save()
    response = api_client.get('/api/peluches/?has_audio=true')
    assert response.status_code == 200
    assert len(response.data) == 1


@pytest.mark.django_db
def test_peluches_list_sort_by_new(api_client, peluch):
    response = api_client.get('/api/peluches/?sort=new')
    assert response.status_code == 200


@pytest.mark.django_db
def test_peluches_list_sort_by_price_asc(api_client, peluch_with_price):
    response = api_client.get('/api/peluches/?sort=price_asc')
    assert response.status_code == 200


@pytest.mark.django_db
def test_peluches_list_sort_by_top_rated(api_client, peluch):
    response = api_client.get('/api/peluches/?sort=top_rated')
    assert response.status_code == 200


@pytest.mark.django_db
def test_peluches_post_returns_403_for_anonymous(api_client):
    response = api_client.post('/api/peluches/', {})
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Featured peluches
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_peluches_featured_returns_only_featured(api_client, peluch, featured_peluch):
    response = api_client.get('/api/peluches/featured/')
    assert response.status_code == 200
    slugs = [p['slug'] for p in response.data]
    assert 'peluche-destacado' in slugs
    assert 'osito-rosa' not in slugs


# ---------------------------------------------------------------------------
# Peluch detail
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_peluch_detail_returns_200_for_existing_slug(api_client, peluch):
    response = api_client.get(f'/api/peluches/{peluch.slug}/')
    assert response.status_code == 200
    assert response.data['slug'] == peluch.slug


@pytest.mark.django_db
def test_peluch_detail_increments_view_count(api_client, peluch):
    initial_count = peluch.view_count
    api_client.get(f'/api/peluches/{peluch.slug}/')
    peluch.refresh_from_db()
    assert peluch.view_count == initial_count + 1


@pytest.mark.django_db
def test_peluch_detail_returns_404_for_nonexistent_slug(api_client):
    response = api_client.get('/api/peluches/no-existe/')
    assert response.status_code == 404


@pytest.mark.django_db
def test_peluch_detail_delete_returns_403_for_anonymous(api_client, peluch):
    response = api_client.delete(f'/api/peluches/{peluch.slug}/')
    assert response.status_code == 403


@pytest.mark.django_db
def test_peluch_detail_delete_removes_peluch(admin_client, peluch):
    response = admin_client.delete(f'/api/peluches/{peluch.slug}/')
    assert response.status_code == 204
    assert not Peluch.objects.filter(slug=peluch.slug).exists()


@pytest.mark.django_db
def test_peluch_detail_patch_returns_403_for_anonymous(api_client, peluch):
    response = api_client.patch(f'/api/peluches/{peluch.slug}/', {'title': 'Cambio'})
    assert response.status_code == 403
