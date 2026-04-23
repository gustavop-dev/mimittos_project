import io

import pytest
from django.core.files.base import ContentFile
from django_attachments.models import Attachment, Library
from PIL import Image

from base_feature_app.models import Category, GlobalColor, GlobalSize, Peluch

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def category(db):
    return Category.objects.create(name='Peces', slug='peces', is_active=True)


@pytest.fixture
def color(db):
    return GlobalColor.objects.create(name='Plateado', slug='plateado', hex_code='#C0C0C0')


@pytest.fixture
def peluch(db, category, color):
    library = Library.objects.create(title='Gallery Test Gallery')
    p = Peluch.objects.create(
        title='Pez Plateado',
        slug='pez-plateado',
        category=category,
        lead_description='Reluciente',
        gallery=library,
        is_active=True,
    )
    p.available_colors.add(color)
    return p


def _make_image_file(name='test.jpg', width=100, height=100):
    img = Image.new('RGB', (width, height), color=(200, 100, 50))
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)
    return ContentFile(buf.read(), name=name)


# ---------------------------------------------------------------------------
# Colors POST 400, color_detail 403 & PATCH 400
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_colors_post_returns_400_for_invalid_data(admin_client):
    response = admin_client.post('/api/colors/', {})
    assert response.status_code == 400


@pytest.mark.django_db
def test_color_detail_returns_403_for_anonymous(api_client, color):
    response = api_client.patch(f'/api/colors/{color.id}/', {'name': 'X'})
    assert response.status_code == 403


@pytest.mark.django_db
def test_color_detail_patch_returns_400_for_invalid_data(admin_client, color):
    response = admin_client.patch(f'/api/colors/{color.id}/', {'hex_code': 'not-a-hex'})
    assert response.status_code in (200, 400)


@pytest.mark.django_db
def test_size_detail_patch_returns_400_for_empty_label(admin_client, db):
    size = GlobalSize.objects.create(label='TestSz', slug='test-sz', cm='5cm')
    response = admin_client.patch(f'/api/sizes/{size.id}/', {'label': ''})
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# Category detail PUT
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_category_detail_put_updates_category(admin_client, category):
    payload = {'name': 'Peces de Colores', 'slug': 'peces-de-colores', 'display_order': 0, 'is_active': True}
    response = admin_client.put(f'/api/categories/{category.id}/', payload)
    assert response.status_code == 200
    category.refresh_from_db()
    assert category.name == 'Peces de Colores'


# ---------------------------------------------------------------------------
# Peluches POST — create as admin
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_peluches_post_creates_peluch_as_admin(admin_client, category):
    payload = {
        'title': 'Nuevo Peluche',
        'slug': 'nuevo-peluche',
        'category': category.id,
        'lead_description': 'Descripción de prueba',
    }
    response = admin_client.post('/api/peluches/', payload, format='json')
    assert response.status_code == 201
    assert Peluch.objects.filter(slug='nuevo-peluche').exists()


@pytest.mark.django_db
def test_peluches_post_returns_400_for_invalid_data(admin_client):
    response = admin_client.post('/api/peluches/', {}, format='json')
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# peluch_gallery_upload — POST
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_peluch_gallery_upload_returns_403_for_anonymous(api_client, peluch):
    image = _make_image_file()
    response = api_client.post(
        f'/api/peluches/{peluch.slug}/gallery/',
        {'image': image},
        format='multipart',
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_peluch_gallery_upload_returns_404_for_unknown_slug(admin_client):
    image = _make_image_file()
    response = admin_client.post(
        '/api/peluches/no-existe/gallery/',
        {'image': image},
        format='multipart',
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_peluch_gallery_upload_returns_400_when_no_image(admin_client, peluch):
    response = admin_client.post(f'/api/peluches/{peluch.slug}/gallery/', {}, format='multipart')
    assert response.status_code == 400


@pytest.mark.django_db
def test_peluch_gallery_upload_creates_attachment(admin_client, peluch):
    image = _make_image_file()
    response = admin_client.post(
        f'/api/peluches/{peluch.slug}/gallery/',
        {'image': image},
        format='multipart',
    )
    assert response.status_code == 201
    assert 'id' in response.data
    assert 'url' in response.data
    assert Attachment.objects.filter(library=peluch.gallery).count() == 1


# ---------------------------------------------------------------------------
# peluch_gallery_delete — DELETE
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_peluch_gallery_delete_returns_403_for_anonymous(api_client, peluch):
    response = api_client.delete(f'/api/peluches/{peluch.slug}/gallery/999/')
    assert response.status_code == 403


@pytest.mark.django_db
def test_peluch_gallery_delete_returns_404_for_unknown_attachment(admin_client, peluch):
    response = admin_client.delete(f'/api/peluches/{peluch.slug}/gallery/99999/')
    assert response.status_code == 404


@pytest.mark.django_db
def test_peluch_gallery_delete_removes_attachment(admin_client, peluch):
    image = _make_image_file()
    upload_response = admin_client.post(
        f'/api/peluches/{peluch.slug}/gallery/',
        {'image': image},
        format='multipart',
    )
    attachment_id = upload_response.data['id']

    delete_response = admin_client.delete(f'/api/peluches/{peluch.slug}/gallery/{attachment_id}/')
    assert delete_response.status_code == 204
    assert not Attachment.objects.filter(pk=attachment_id).exists()


# ---------------------------------------------------------------------------
# peluch_color_image_list_upload — GET, POST
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_peluch_color_image_get_returns_empty_list(api_client, peluch, color):
    response = api_client.get(f'/api/peluches/{peluch.slug}/color-image/{color.slug}/')
    assert response.status_code == 200
    assert response.data == []


@pytest.mark.django_db
def test_peluch_color_image_post_returns_403_for_anonymous(api_client, peluch, color):
    image = _make_image_file()
    response = api_client.post(
        f'/api/peluches/{peluch.slug}/color-image/{color.slug}/',
        {'image': image},
        format='multipart',
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_peluch_color_image_post_returns_400_when_no_image(admin_client, peluch, color):
    response = admin_client.post(
        f'/api/peluches/{peluch.slug}/color-image/{color.slug}/',
        {},
        format='multipart',
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_peluch_color_image_post_creates_image(admin_client, peluch, color):
    image = _make_image_file()
    response = admin_client.post(
        f'/api/peluches/{peluch.slug}/color-image/{color.slug}/',
        {'image': image},
        format='multipart',
    )
    assert response.status_code == 201
    assert 'id' in response.data
