import io
import pytest
from unittest.mock import MagicMock, patch
from django.core.files.uploadedfile import InMemoryUploadedFile
from rest_framework.test import APIClient

from base_feature_app.models import PersonalizationMedia, SiteContent


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
    u = User.objects.create_user(email='admin@example.com', password='pass')
    u.is_staff = True
    u.save(update_fields=['is_staff'])
    return u


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


def _make_in_memory_file(name='test.jpg', content=b'fake_image_data', content_type='image/jpeg'):
    buf = io.BytesIO(content)
    return InMemoryUploadedFile(buf, 'file', name, content_type, len(content), None)


# ---------------------------------------------------------------------------
# POST /api/media/upload/ — image upload
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_upload_media_returns_400_when_no_file_sent(api_client):
    response = api_client.post('/api/media/upload/', {'media_type': 'huella_image'})
    assert response.status_code == 400


@pytest.mark.django_db
def test_upload_media_returns_400_for_invalid_media_type(api_client):
    fake_file = _make_in_memory_file()
    response = api_client.post(
        '/api/media/upload/',
        {'file': fake_file, 'media_type': 'invalid_type'},
        format='multipart',
    )
    assert response.status_code == 400


@pytest.mark.django_db
@patch('base_feature_app.views.media_views.MediaOptimizationService.optimize_image')
def test_upload_media_image_returns_201_with_media_id(mock_optimize, api_client):
    optimized = _make_in_memory_file('optimized.jpg', b'x' * 1024)
    mock_optimize.return_value = optimized

    fake_file = _make_in_memory_file()
    response = api_client.post(
        '/api/media/upload/',
        {'file': fake_file, 'media_type': 'huella_image'},
        format='multipart',
    )
    assert response.status_code == 201
    assert 'media_id' in response.data
    assert PersonalizationMedia.objects.filter(media_type='huella_image').exists()


@pytest.mark.django_db
@patch('base_feature_app.views.media_views.MediaOptimizationService.optimize_image', side_effect=Exception('Image too large'))
def test_upload_media_image_returns_400_on_optimization_error(mock_optimize, api_client):
    fake_file = _make_in_memory_file()
    response = api_client.post(
        '/api/media/upload/',
        {'file': fake_file, 'media_type': 'huella_image'},
        format='multipart',
    )
    assert response.status_code == 400
    assert 'Image too large' in response.data['detail']


@pytest.mark.django_db
@patch('base_feature_app.views.media_views.MediaOptimizationService.optimize_audio')
def test_upload_media_audio_returns_201_with_duration(mock_optimize, api_client):
    optimized_audio = _make_in_memory_file('audio.mp3', b'a' * 512, 'audio/mpeg')
    mock_optimize.return_value = (optimized_audio, 15.5)

    fake_file = _make_in_memory_file('input.mp3', b'fake_audio', 'audio/mpeg')
    response = api_client.post(
        '/api/media/upload/',
        {'file': fake_file, 'media_type': 'audio'},
        format='multipart',
    )
    assert response.status_code == 201
    assert response.data['duration_sec'] == 15.5


# ---------------------------------------------------------------------------
# GET /api/content/<key>/ — public site content
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_site_content_get_returns_200_for_valid_key(api_client):
    response = api_client.get('/api/content/faq/')
    assert response.status_code == 200
    assert 'content_json' in response.data


@pytest.mark.django_db
def test_site_content_get_returns_404_for_invalid_key(api_client):
    response = api_client.get('/api/content/nonexistent/')
    assert response.status_code == 404


@pytest.mark.django_db
def test_site_content_get_creates_default_entry_if_missing(api_client):
    assert not SiteContent.objects.filter(key='faq').exists()
    api_client.get('/api/content/faq/')
    assert SiteContent.objects.filter(key='faq').exists()


# ---------------------------------------------------------------------------
# PUT /api/content/<key>/ — admin update
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_site_content_put_updates_content_as_admin(admin_client):
    payload = {'content_json': {'question': 'answer'}}
    response = admin_client.put('/api/content/faq/', payload, format='json')
    assert response.status_code == 200
    obj = SiteContent.objects.get(key='faq')
    assert obj.content_json == {'question': 'answer'}


@pytest.mark.django_db
def test_site_content_put_returns_403_for_anonymous(api_client):
    payload = {'content_json': {'question': 'answer'}}
    response = api_client.put('/api/content/faq/', payload, format='json')
    assert response.status_code == 403
