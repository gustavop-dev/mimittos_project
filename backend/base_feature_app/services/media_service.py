import io

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile


class MediaOptimizationService:
    IMAGE_MAX_SIZE = (1200, 1200)
    IMAGE_QUALITY = 80
    IMAGE_MAX_KB = 500

    AUDIO_BITRATE = '64k'
    AUDIO_MAX_DURATION_SEC = 30
    AUDIO_MAX_KB = 1024
    ALLOWED_AUDIO_FORMATS = {'mp3', 'm4a', 'wav', 'ogg', 'opus', 'aac', 'webm', 'flac', 'amr', 'aiff', '3gp', 'mp4'}
    AUDIO_MIME_TO_FORMAT = {
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/ogg': 'ogg',
        'audio/opus': 'opus',
        'audio/aac': 'aac',
        'audio/x-aac': 'aac',
        'audio/webm': 'webm',
        'audio/amr': 'amr',
        'audio/flac': 'flac',
        'audio/x-flac': 'flac',
        'audio/mp4': 'mp4',
        'audio/x-m4a': 'm4a',
        'audio/3gpp': '3gp',
        'audio/aiff': 'aiff',
        'audio/x-aiff': 'aiff',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
        'video/webm': 'webm',
        'video/mp4': 'mp4',
        'video/3gpp': '3gp',
    }

    @staticmethod
    def optimize_image(file) -> InMemoryUploadedFile:
        try:
            from PIL import Image
        except ImportError:
            raise ValidationError('Pillow no está instalado.')

        try:
            img = Image.open(file)
        except Exception:
            raise ValidationError('El archivo no es una imagen válida.')

        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGB')
        elif img.mode == 'RGBA':
            bg = Image.new('RGB', img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            img = bg

        img.thumbnail(MediaOptimizationService.IMAGE_MAX_SIZE, Image.LANCZOS)

        output = io.BytesIO()
        img.save(output, format='JPEG', quality=MediaOptimizationService.IMAGE_QUALITY, optimize=True)
        output.seek(0)

        size_kb = output.getbuffer().nbytes // 1024
        if size_kb > MediaOptimizationService.IMAGE_MAX_KB:
            raise ValidationError(
                f'La imagen sigue siendo demasiado grande ({size_kb}KB) después de comprimir.'
            )

        return InMemoryUploadedFile(
            output,
            field_name='file',
            name=f'{file.name.rsplit(".", 1)[0]}.jpg',
            content_type='image/jpeg',
            size=output.getbuffer().nbytes,
            charset=None,
        )

    @staticmethod
    def optimize_audio(file) -> tuple[InMemoryUploadedFile, float]:
        ext = file.name.rsplit('.', 1)[-1].lower() if '.' in file.name else ''
        mime_type = getattr(file, 'content_type', '') or ''

        if ext in MediaOptimizationService.ALLOWED_AUDIO_FORMATS:
            fmt = ext
        elif mime_type in MediaOptimizationService.AUDIO_MIME_TO_FORMAT:
            fmt = MediaOptimizationService.AUDIO_MIME_TO_FORMAT[mime_type]
        else:
            raise ValidationError(
                f'Formato de audio no soportado. Formatos válidos: mp3, m4a, wav, ogg, opus, aac, webm, flac.'
            )

        try:
            from pydub import AudioSegment
        except ImportError:
            raise ValidationError('pydub no está instalado.')

        try:
            audio = AudioSegment.from_file(file, format=fmt)
        except Exception:
            raise ValidationError('No se pudo procesar el archivo de audio.')

        max_ms = MediaOptimizationService.AUDIO_MAX_DURATION_SEC * 1000
        if len(audio) > max_ms:
            audio = audio[:max_ms]

        duration_sec = len(audio) / 1000.0

        output = io.BytesIO()
        audio.export(output, format='mp3', bitrate=MediaOptimizationService.AUDIO_BITRATE)
        output.seek(0)

        size_kb = output.getbuffer().nbytes // 1024
        if size_kb > MediaOptimizationService.AUDIO_MAX_KB:
            raise ValidationError(
                f'El audio sigue siendo demasiado grande ({size_kb}KB) después de comprimir.'
            )

        return InMemoryUploadedFile(
            output,
            field_name='file',
            name=f'{file.name.rsplit(".", 1)[0]}.mp3',
            content_type='audio/mpeg',
            size=output.getbuffer().nbytes,
            charset=None,
        ), duration_sec
