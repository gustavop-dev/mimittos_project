import io
import pytest
from unittest.mock import MagicMock, patch, PropertyMock
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile

from base_feature_app.services.media_service import MediaOptimizationService


def _make_fake_file(name='test.jpg', content=b'fake', content_type='image/jpeg'):
    buf = io.BytesIO(content)
    buf.name = name
    return buf


# ---------------------------------------------------------------------------
# optimize_image — success paths
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('PIL.Image')
def test_optimize_image_returns_in_memory_uploaded_file(mock_image_module):
    fake_img = MagicMock()
    fake_img.mode = 'RGB'
    fake_img.size = (800, 800)

    output_buf = io.BytesIO(b'x' * 100)

    def save_side_effect(buf, **kwargs):
        buf.write(b'x' * 100)

    fake_img.save.side_effect = save_side_effect
    mock_image_module.open.return_value = fake_img
    mock_image_module.LANCZOS = 1

    file = _make_fake_file()
    result = MediaOptimizationService.optimize_image(file)
    assert isinstance(result, InMemoryUploadedFile)
    assert result.content_type == 'image/jpeg'


@pytest.mark.django_db
@patch('PIL.Image')
def test_optimize_image_output_name_has_jpg_extension(mock_image_module):
    fake_img = MagicMock()
    fake_img.mode = 'RGB'
    fake_img.save = MagicMock(side_effect=lambda buf, **kw: buf.write(b'x' * 50))
    mock_image_module.open.return_value = fake_img
    mock_image_module.LANCZOS = 1

    file = _make_fake_file(name='photo.png')
    result = MediaOptimizationService.optimize_image(file)
    assert result.name == 'photo.jpg'


@pytest.mark.django_db
@patch('PIL.Image')
def test_optimize_image_converts_rgba_to_rgb(mock_image_module):
    rgba_img = MagicMock()
    rgba_img.mode = 'RGBA'
    rgba_img.size = (100, 100)
    rgba_img.split.return_value = [None, None, None, MagicMock()]
    rgba_img.save = MagicMock(side_effect=lambda buf, **kw: buf.write(b'x' * 50))

    rgb_bg = MagicMock()
    rgb_bg.mode = 'RGB'
    rgb_bg.save = MagicMock(side_effect=lambda buf, **kw: buf.write(b'x' * 50))

    mock_image_module.open.return_value = rgba_img
    mock_image_module.new.return_value = rgb_bg
    mock_image_module.LANCZOS = 1

    file = _make_fake_file()
    result = MediaOptimizationService.optimize_image(file)
    assert result.content_type == 'image/jpeg'


# ---------------------------------------------------------------------------
# optimize_image — error paths
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('PIL.Image')
def test_optimize_image_raises_for_invalid_image_file(mock_image_module):
    mock_image_module.open.side_effect = Exception('Not an image')
    file = _make_fake_file()
    with pytest.raises(ValidationError, match='imagen válida'):
        MediaOptimizationService.optimize_image(file)


# ---------------------------------------------------------------------------
# optimize_audio — success paths
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@patch('pydub.AudioSegment')
def test_optimize_audio_returns_file_and_duration(mock_audio_segment):
    fake_audio = MagicMock()
    fake_audio.__len__ = MagicMock(return_value=15000)
    fake_audio.__getitem__ = MagicMock(return_value=fake_audio)
    fake_audio.export = MagicMock(side_effect=lambda buf, **kw: buf.write(b'a' * 100))
    mock_audio_segment.from_file.return_value = fake_audio

    file = _make_fake_file(name='voice.mp3', content=b'mp3data')
    result_file, duration = MediaOptimizationService.optimize_audio(file)
    assert isinstance(result_file, InMemoryUploadedFile)
    assert duration == 15.0


@pytest.mark.django_db
@patch('pydub.AudioSegment')
def test_optimize_audio_trims_audio_longer_than_30_seconds(mock_audio_segment):
    long_audio = MagicMock()
    long_audio.__len__ = MagicMock(return_value=60000)
    trimmed = MagicMock()
    trimmed.__len__ = MagicMock(return_value=30000)
    trimmed.export = MagicMock(side_effect=lambda buf, **kw: buf.write(b'a' * 100))
    long_audio.__getitem__ = MagicMock(return_value=trimmed)
    mock_audio_segment.from_file.return_value = long_audio

    file = _make_fake_file(name='long.mp3')
    result_file, duration = MediaOptimizationService.optimize_audio(file)
    assert duration == 30.0


@pytest.mark.django_db
@patch('pydub.AudioSegment')
def test_optimize_audio_output_name_has_mp3_extension(mock_audio_segment):
    fake_audio = MagicMock()
    fake_audio.__len__ = MagicMock(return_value=10000)
    fake_audio.__getitem__ = MagicMock(return_value=fake_audio)
    fake_audio.export = MagicMock(side_effect=lambda buf, **kw: buf.write(b'a' * 50))
    mock_audio_segment.from_file.return_value = fake_audio

    file = _make_fake_file(name='recording.wav')
    result_file, _ = MediaOptimizationService.optimize_audio(file)
    assert result_file.name == 'recording.mp3'


# ---------------------------------------------------------------------------
# optimize_audio — error paths
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_optimize_audio_raises_for_unsupported_format():
    file = _make_fake_file(name='video.mp4')
    with pytest.raises(ValidationError, match='Formato de audio no soportado'):
        MediaOptimizationService.optimize_audio(file)


@pytest.mark.django_db
@patch('pydub.AudioSegment')
def test_optimize_audio_raises_when_audio_processing_fails(mock_audio_segment):
    mock_audio_segment.from_file.side_effect = Exception('Decode error')
    file = _make_fake_file(name='bad.mp3')
    with pytest.raises(ValidationError, match='No se pudo procesar'):
        MediaOptimizationService.optimize_audio(file)
