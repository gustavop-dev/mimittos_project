"""
Generate placeholder color images for each peluch+color combination.
Creates 3 images per color (slight shade variations) so gallery switching is visible.

Usage:
    python manage.py seed_color_images          # add images (skip if already exist)
    python manage.py seed_color_images --clear  # delete existing color images first
"""
import io
import textwrap

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw

from base_feature_app.models import Peluch, PeluchColorImage
from django_attachments.models import Attachment


def _hex_to_rgb(hex_code: str) -> tuple[int, int, int]:
    h = hex_code.lstrip('#')
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _darken(rgb: tuple, pct: float) -> tuple[int, int, int]:
    return tuple(max(0, int(c * (1 - pct))) for c in rgb)


def _lighten(rgb: tuple, pct: float) -> tuple[int, int, int]:
    return tuple(min(255, int(c + (255 - c) * pct)) for c in rgb)


def _contrast_color(rgb: tuple) -> str:
    # Returns black or white depending on luminance
    r, g, b = rgb
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    return '#1B2A4A' if lum > 160 else '#FFFFFF'


def _make_image(base_hex: str, label: str, variant: int) -> InMemoryUploadedFile:
    """Create a 600×600 placeholder image for a given color + variant (0, 1, 2)."""
    rgb = _hex_to_rgb(base_hex)

    # Variant shading
    if variant == 0:
        bg = rgb
        label_suffix = 'Vista frontal'
    elif variant == 1:
        bg = _lighten(rgb, 0.18)
        label_suffix = 'Vista lateral'
    else:
        bg = _darken(rgb, 0.12)
        label_suffix = 'Vista trasera'

    # Handle pure white — add a subtle tint
    if bg == (255, 255, 255):
        bg = (245, 245, 248)

    img = Image.new('RGB', (600, 600), bg)
    draw = ImageDraw.Draw(img)

    # Outer border
    border_color = _darken(bg, 0.2)
    draw.rectangle([20, 20, 579, 579], outline=border_color, width=3)

    # Inner decorative frame
    inner_color = _lighten(bg, 0.15) if _contrast_color(bg) == '#1B2A4A' else _darken(bg, 0.08)
    draw.rectangle([60, 60, 539, 539], outline=inner_color, width=2)

    # Stuffed animal silhouette (simple bear-like shape as circles)
    circle_color = _darken(bg, 0.25) if _contrast_color(bg) == '#1B2A4A' else _lighten(bg, 0.3)
    # Body
    draw.ellipse([200, 230, 400, 430], fill=circle_color)
    # Head
    draw.ellipse([220, 140, 380, 260], fill=circle_color)
    # Left ear
    draw.ellipse([200, 110, 255, 165], fill=circle_color)
    # Right ear
    draw.ellipse([345, 110, 400, 165], fill=circle_color)

    # Text labels
    text_color = _contrast_color(bg)
    # Product name
    draw.text((300, 470), label, fill=text_color, anchor='mm')
    # Variant label
    draw.text((300, 510), label_suffix, fill=text_color, anchor='mm')

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=88, optimize=True)
    buf.seek(0)

    filename = f'placeholder-{label.lower().replace(" ", "-")}-{variant}.jpg'
    return InMemoryUploadedFile(buf, 'file', filename, 'image/jpeg', buf.getbuffer().nbytes, None)


class Command(BaseCommand):
    help = 'Seed placeholder color images for demo peluches'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Delete existing color images first')

    def handle(self, *args, **options):
        if options['clear']:
            count = PeluchColorImage.objects.count()
            for pci in PeluchColorImage.objects.select_related('attachment').all():
                try:
                    pci.attachment.delete()
                except Exception:
                    pass
                pci.delete()
            self.stdout.write(f'  Cleared {count} existing color images.')

        peluches = Peluch.objects.prefetch_related('available_colors').all()
        total = 0

        for peluch in peluches:
            colors = list(peluch.available_colors.order_by('sort_order'))
            if not colors:
                continue

            for color in colors:
                # Skip if already has images for this color
                if PeluchColorImage.objects.filter(peluch=peluch, color=color).exists():
                    self.stdout.write(f'  skip {peluch.slug}/{color.slug} (already has images)')
                    continue

                rank_base = Attachment.objects.filter(library=peluch.gallery).count()

                for variant in range(3):
                    img_file = _make_image(color.hex_code, color.name, variant)
                    attachment = Attachment(
                        library=peluch.gallery,
                        original_name=img_file.name,
                        file=img_file,
                        rank=rank_base + variant,
                    )
                    attachment.save()
                    PeluchColorImage.objects.create(
                        peluch=peluch,
                        color=color,
                        attachment=attachment,
                        display_order=variant,
                    )
                    total += 1

                self.stdout.write(f'  ✓ {peluch.slug} / {color.name}  (3 images)')

        self.stdout.write(self.style.SUCCESS(f'\nDone — {total} placeholder images created.'))
