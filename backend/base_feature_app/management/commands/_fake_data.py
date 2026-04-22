import io
import random

from django.core.files.base import ContentFile
from django.utils.text import slugify

from django_attachments.models import Attachment, Library
from PIL import Image, ImageDraw


FAKE_EMAIL_DOMAIN = 'fake.mimittos.local'
FAKE_BLOG_TITLE_PREFIX = '[FAKE]'
FAKE_SLUG_PREFIX = 'fake-'
FAKE_DEFAULT_PASSWORD = 'FakeData123!'

GRADIENT_PALETTES = [
    ((255, 179, 186), (255, 205, 210)),
    ((186, 225, 255), (144, 202, 249)),
    ((204, 204, 255), (179, 157, 219)),
    ((185, 246, 202), (165, 214, 167)),
    ((255, 236, 179), (255, 213, 79)),
    ((255, 209, 220), (255, 171, 145)),
]


def fake_slug(value: str, suffix: str = '') -> str:
    slug = f'{FAKE_SLUG_PREFIX}{slugify(value)}'
    if suffix:
        slug = f'{slug}-{suffix}'
    return slug


def fake_user_email(index: int) -> str:
    return f'fake-user-{index:03d}@{FAKE_EMAIL_DOMAIN}'


def fake_guest_email(index: int) -> str:
    return f'fake-guest-{index:03d}@{FAKE_EMAIL_DOMAIN}'


def is_fake_email(email: str) -> bool:
    return email.lower().endswith(f'@{FAKE_EMAIL_DOMAIN}')


def is_fake_blog_title(title: str) -> bool:
    return title.startswith(f'{FAKE_BLOG_TITLE_PREFIX} ')


def fake_blog_title(base_title: str) -> str:
    return f'{FAKE_BLOG_TITLE_PREFIX} {base_title}'


def make_gradient_image(name: str, index: int) -> ContentFile:
    width, height = 800, 600
    start, end = GRADIENT_PALETTES[index % len(GRADIENT_PALETTES)]
    image = Image.new('RGB', (width, height))

    for y in range(height):
        ratio = y / height
        row_color = tuple(int(start[i] + (end[i] - start[i]) * ratio) for i in range(3))
        image.paste(Image.new('RGB', (width, 1), row_color), (0, y))

    draw = ImageDraw.Draw(image, 'RGBA')
    for _ in range(4):
        cx, cy = random.randint(0, width), random.randint(0, height)
        radius = random.randint(60, 180)
        draw.ellipse(
            [cx - radius, cy - radius, cx + radius, cy + radius],
            fill=(255, 255, 255, 40),
        )

    buffer = io.BytesIO()
    image.save(buffer, format='WEBP', quality=85)
    buffer.seek(0)
    safe_name = slugify(name) or 'fake-image'
    return ContentFile(buffer.read(), name=f'{safe_name}-{index}.webp')


def create_library(title: str, num_images: int = 1) -> Library:
    library = Library.objects.create(title=title)
    for index in range(num_images):
        image_file = make_gradient_image(title, index)
        Attachment.objects.create(
            library=library,
            file=image_file,
            original_name=image_file.name,
            rank=index,
        )
    return library
