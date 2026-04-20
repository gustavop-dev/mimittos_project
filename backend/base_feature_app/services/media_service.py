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
    ALLOWED_AUDIO_FORMATS = {'mp3', 'm4a', 'wav', 'ogg'}

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
        ext = file.name.rsplit('.', 1)[-1].lower()
        if ext not in MediaOptimizationService.ALLOWED_AUDIO_FORMATS:
            raise ValidationError(
                f'Formato de audio no soportado. Use: {", ".join(MediaOptimizationService.ALLOWED_AUDIO_FORMATS)}'
            )

        try:
            from pydub import AudioSegment
        except ImportError:
            raise ValidationError('pydub no está instalado.')

        try:
            audio = AudioSegment.from_file(file, format=ext)
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
