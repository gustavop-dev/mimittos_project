"""
Seed 4 featured categories and 4 featured peluches with Unsplash images.

Usage:
    cd backend && source venv/bin/activate
    python manage.py seed_featured
"""
import io
import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django_attachments.models import Library, Attachment

from base_feature_app.models import (
    Category, GlobalColor, GlobalSize, Peluch, PeluchSizePrice,
)

# ── Colors ────────────────────────────────────────────────────────────────────
COLORS = [
    {'name': 'Beige',      'slug': 'beige',      'hex_code': '#D4A574', 'sort_order': 1},
    {'name': 'Café',       'slug': 'cafe',        'hex_code': '#8B5E3C', 'sort_order': 2},
    {'name': 'Rosado',     'slug': 'rosado',      'hex_code': '#F4A8B4', 'sort_order': 3},
    {'name': 'Blanco',     'slug': 'blanco',      'hex_code': '#FAFAFA', 'sort_order': 4},
    {'name': 'Azul cielo', 'slug': 'azul-cielo',  'hex_code': '#87CEEB', 'sort_order': 5},
    {'name': 'Gris',       'slug': 'gris',        'hex_code': '#A8A8A8', 'sort_order': 6},
    {'name': 'Lila',       'slug': 'lila',        'hex_code': '#C8A2C8', 'sort_order': 7},
]

# ── Sizes ─────────────────────────────────────────────────────────────────────
SIZES = [
    {'label': 'Pequeño', 'slug': 'pequeno', 'cm': '20 cm', 'sort_order': 1},
    {'label': 'Mediano',  'slug': 'mediano',  'cm': '30 cm', 'sort_order': 2},
    {'label': 'Grande',   'slug': 'grande',   'cm': '40 cm', 'sort_order': 3},
    {'label': 'Jumbo',    'slug': 'jumbo',    'cm': '60 cm', 'sort_order': 4},
]

# ── Categories ────────────────────────────────────────────────────────────────
CATEGORIES = [
    {
        'name': 'Osos',
        'slug': 'osos',
        'description': 'Ositos artesanales hechos a mano con amor',
        'display_order': 1,
        'is_featured': True,
        'image_url': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
        'image_filename': 'cat-osos.jpg',
    },
    {
        'name': 'Conejos',
        'slug': 'conejos',
        'description': 'Conejitos tiernos y suaves para regalar',
        'display_order': 2,
        'is_featured': True,
        'image_url': 'https://images.unsplash.com/photo-1474877812284-d7a8c766c5e7?w=800&q=80',
        'image_filename': 'cat-conejos.jpg',
    },
    {
        'name': 'Unicornios',
        'slug': 'unicornios',
        'description': 'Magia y color en cada abrazo',
        'display_order': 3,
        'is_featured': True,
        'image_url': 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80',
        'image_filename': 'cat-unicornios.jpg',
    },
    {
        'name': 'Personajes',
        'slug': 'personajes',
        'description': 'Tus personajes favoritos hechos a mano',
        'display_order': 4,
        'is_featured': True,
        'image_url': 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&q=80',
        'image_filename': 'cat-personajes.jpg',
    },
]

# ── Peluches ──────────────────────────────────────────────────────────────────
PELUCHES = [
    {
        'title': 'Osito Caramelo',
        'slug': 'osito-caramelo',
        'category_slug': 'osos',
        'lead_description': 'El oso más suave para llevar tus recuerdos más cercanos.',
        'description': [
            'Osito Caramelo está hecho con felpa premium de doble capa, perfecta para abrazar sin soltarlo.',
            'Su relleno hipoalergénico lo hace ideal para bebés y niños de todas las edades.',
        ],
        'specifications': {
            'Material exterior': 'Felpa premium soft',
            'Relleno': 'Fibra sintética hipoalergénica',
            'País de fabricación': 'Colombia',
        },
        'care_instructions': ['Lavar a mano con agua fría y jabón suave.', 'Secar al aire en lugar fresco.'],
        'badge': 'bestseller',
        'is_featured': True,
        'discount_pct': 15,
        'display_order': 1,
        'has_huella': True,
        'has_corazon': True,
        'has_audio': False,
        'huella_extra_cost': 15000,
        'corazon_extra_cost': 10000,
        'audio_extra_cost': 0,
        'color_slugs': ['beige', 'cafe', 'rosado'],
        'sizes': [
            {'slug': 'pequeno', 'price': 85000},
            {'slug': 'mediano', 'price': 128000},
            {'slug': 'grande',  'price': 175000},
        ],
        'image_url': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
        'image_filename': 'osito-caramelo.jpg',
    },
    {
        'title': 'Conejita Luna',
        'slug': 'conejita-luna',
        'category_slug': 'conejos',
        'lead_description': 'Una conejita tierna que guarda los secretos más dulces del corazón.',
        'description': [
            'Conejita Luna tiene orejas largas y suaves, perfectas para envolver en un abrazo eterno.',
            'Puedes personalizarla con un corazón que lleva una frase dedicada para la persona especial.',
        ],
        'specifications': {
            'Material exterior': 'Felpa ultra suave',
            'Relleno': 'Fibra hipoalergénica de alta densidad',
            'País de fabricación': 'Colombia',
        },
        'care_instructions': ['Lavar a mano con agua fría.', 'Secar en posición horizontal.'],
        'badge': 'new',
        'is_featured': True,
        'discount_pct': 0,
        'display_order': 2,
        'has_huella': False,
        'has_corazon': True,
        'has_audio': False,
        'huella_extra_cost': 0,
        'corazon_extra_cost': 12000,
        'audio_extra_cost': 0,
        'color_slugs': ['rosado', 'blanco'],
        'sizes': [
            {'slug': 'pequeno', 'price': 92000},
            {'slug': 'mediano', 'price': 138000},
            {'slug': 'grande',  'price': 185000},
        ],
        'image_url': 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=800&q=80',
        'image_filename': 'conejita-luna.jpg',
    },
    {
        'title': 'Pandita MIMITTOS',
        'slug': 'pandita-mimittos',
        'category_slug': 'osos',
        'lead_description': 'Un pandita blanco y negro que enamora con su ternura infinita.',
        'description': [
            'Pandita MIMITTOS tiene manchas características cosidas a mano que lo hacen único.',
            'Su tamaño mediano lo convierte en el compañero ideal para dormir o regalar.',
        ],
        'specifications': {
            'Material exterior': 'Felpa bicolor artesanal',
            'Relleno': 'Fibra sintética premium',
            'País de fabricación': 'Colombia',
        },
        'care_instructions': ['Lavar a mano delicadamente.', 'No usar lavadora.'],
        'badge': 'none',
        'is_featured': True,
        'discount_pct': 10,
        'display_order': 3,
        'has_huella': True,
        'has_corazon': False,
        'has_audio': False,
        'huella_extra_cost': 15000,
        'corazon_extra_cost': 0,
        'audio_extra_cost': 0,
        'color_slugs': ['blanco', 'gris'],
        'sizes': [
            {'slug': 'pequeno', 'price': 88000},
            {'slug': 'mediano', 'price': 132000},
            {'slug': 'grande',  'price': 178000},
        ],
        'image_url': 'https://images.unsplash.com/photo-1611601322175-ef8ef43113e0?w=800&q=80',
        'image_filename': 'pandita.jpg',
    },
    {
        'title': 'Unicornio Celeste',
        'slug': 'unicornio-celeste',
        'category_slug': 'unicornios',
        'lead_description': 'Un unicornio mágico que trae color y fantasía a cada rincón.',
        'description': [
            'Unicornio Celeste tiene un cuerno brillante y una melena arcoíris que brilla con la luz.',
            'Puedes agregarle una huella personalizada o incluso un mensaje de audio para hacerlo único.',
        ],
        'specifications': {
            'Material exterior': 'Felpa brillante premium',
            'Cuerno': 'Plástico ABS pintado a mano',
            'País de fabricación': 'Colombia',
        },
        'care_instructions': ['Lavar a mano cuidadosamente.', 'No lavar en lavadora.'],
        'badge': 'none',
        'is_featured': True,
        'discount_pct': 0,
        'display_order': 4,
        'has_huella': True,
        'has_corazon': False,
        'has_audio': True,
        'huella_extra_cost': 15000,
        'corazon_extra_cost': 0,
        'audio_extra_cost': 20000,
        'color_slugs': ['rosado', 'azul-cielo', 'lila'],
        'sizes': [
            {'slug': 'pequeno', 'price': 98000},
            {'slug': 'mediano', 'price': 148000},
            {'slug': 'grande',  'price': 198000},
        ],
        'image_url': 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80',
        'image_filename': 'unicornio-celeste.jpg',
    },
]


def download_image(url: str, timeout: int = 15) -> bytes | None:
    try:
        r = requests.get(url, timeout=timeout, headers={'User-Agent': 'MIMITTOS-Seed/1.0'})
        r.raise_for_status()
        return r.content
    except Exception as e:
        return None


class Command(BaseCommand):
    help = 'Seed 4 featured categories and 4 featured peluches with Unsplash images'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.HTTP_INFO('\n── Colors & Sizes ───────────────────────────────'))
        color_map = self._ensure_colors()
        size_map = self._ensure_sizes()

        self.stdout.write(self.style.HTTP_INFO('\n── Categories ───────────────────────────────────'))
        cat_map = self._seed_categories()

        self.stdout.write(self.style.HTTP_INFO('\n── Peluches ─────────────────────────────────────'))
        self._seed_peluches(cat_map, color_map, size_map)

        self.stdout.write(self.style.SUCCESS('\n✓ seed_featured complete\n'))

    # ── helpers ───────────────────────────────────────────────────────────────

    def _ensure_colors(self):
        color_map = {}
        for data in COLORS:
            obj, created = GlobalColor.objects.get_or_create(
                slug=data['slug'],
                defaults={k: v for k, v in data.items() if k != 'slug'},
            )
            color_map[data['slug']] = obj
            status = 'created' if created else 'exists'
            self.stdout.write(f'  {status}: color {obj.name}')
        return color_map

    def _ensure_sizes(self):
        size_map = {}
        for data in SIZES:
            obj, created = GlobalSize.objects.get_or_create(
                slug=data['slug'],
                defaults={k: v for k, v in data.items() if k != 'slug'},
            )
            size_map[data['slug']] = obj
            status = 'created' if created else 'exists'
            self.stdout.write(f'  {status}: size {obj.label}')
        return size_map

    def _seed_categories(self):
        cat_map = {}
        for data in CATEGORIES:
            cat, created = Category.objects.get_or_create(
                slug=data['slug'],
                defaults={
                    'name': data['name'],
                    'description': data['description'],
                    'display_order': data['display_order'],
                    'is_active': True,
                    'is_featured': data['is_featured'],
                },
            )
            if not created:
                # Update featured flag in case it exists but isn't featured
                cat.is_featured = data['is_featured']
                cat.display_order = data['display_order']
                cat.save(update_fields=['is_featured', 'display_order'])

            # Download and attach image
            if not cat.image:
                self.stdout.write(f'  Downloading image for {cat.name}…', ending=' ')
                img_bytes = download_image(data['image_url'])
                if img_bytes:
                    cat.image.save(data['image_filename'], ContentFile(img_bytes), save=True)
                    self.stdout.write(self.style.SUCCESS('ok'))
                else:
                    self.stdout.write(self.style.WARNING('failed (will show gradient)'))
            else:
                self.stdout.write(f'  image already set for {cat.name}')

            cat_map[data['slug']] = cat
            status = 'created' if created else 'updated'
            self.stdout.write(f'  ✓ {status}: {cat.name}')

        return cat_map

    def _seed_peluches(self, cat_map, color_map, size_map):
        for data in PELUCHES:
            cat = cat_map.get(data['category_slug'])
            if not cat:
                self.stdout.write(self.style.WARNING(f"  category '{data['category_slug']}' not found — skipping {data['title']}"))
                continue

            if Peluch.objects.filter(slug=data['slug']).exists():
                self.stdout.write(f'  exists: {data["title"]} — skipping')
                continue

            library = Library.objects.create(title=data['title'])

            # Download gallery image
            self.stdout.write(f'  Downloading image for {data["title"]}…', ending=' ')
            img_bytes = download_image(data['image_url'])
            if img_bytes:
                attachment = Attachment(library=library, rank=0, original_name=data['image_filename'])
                attachment.file.save(data['image_filename'], ContentFile(img_bytes), save=True)
                library.primary_attachment = attachment
                library.save(update_fields=['primary_attachment'])
                self.stdout.write(self.style.SUCCESS('ok'))
            else:
                self.stdout.write(self.style.WARNING('failed (no image)'))

            peluch = Peluch.objects.create(
                title=data['title'],
                slug=data['slug'],
                category=cat,
                lead_description=data['lead_description'],
                description=data['description'],
                specifications=data['specifications'],
                care_instructions=data['care_instructions'],
                badge=data['badge'],
                is_active=True,
                is_featured=data['is_featured'],
                discount_pct=data['discount_pct'],
                display_order=data['display_order'],
                has_huella=data['has_huella'],
                has_corazon=data['has_corazon'],
                has_audio=data['has_audio'],
                huella_extra_cost=data['huella_extra_cost'],
                corazon_extra_cost=data['corazon_extra_cost'],
                audio_extra_cost=data['audio_extra_cost'],
                gallery=library,
            )

            for slug in data['color_slugs']:
                color = color_map.get(slug)
                if color:
                    peluch.available_colors.add(color)

            for sp in data['sizes']:
                size = size_map.get(sp['slug'])
                if size:
                    PeluchSizePrice.objects.create(
                        peluch=peluch,
                        size=size,
                        price=sp['price'],
                        is_available=True,
                    )

            discount_str = f' [-{data["discount_pct"]}%]' if data['discount_pct'] else ''
            self.stdout.write(f'  ✓ created: {data["title"]}{discount_str}')
