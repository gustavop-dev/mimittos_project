"""
Delete all existing peluches and seed a small set of demo products.

Usage:
    python manage.py seed_peluches
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django_attachments.models import Library

from base_feature_app.models import (
    Category, GlobalColor, GlobalSize,
    Order, Peluch, PeluchSizePrice,
)


SEED_DATA = [
    {
        'title': 'Osito Caramelo',
        'slug': 'osito-caramelo',
        'category_slug': 'osos',
        'lead_description': 'El oso más suave para llevar tus recuerdos más cercanos.',
        'description': [
            'Osito Caramelo está hecho con felpa premium de doble capa, perfecta para abrazar sin soltarlo.',
            'Su relleno hipoalergénico lo hace ideal para bebés y niños de todas las edades.',
            'Disponible en tallas Pequeño, Mediano y Grande. Perfecto como regalo o compañero de vida.',
        ],
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
            {'slug': 'grande', 'price': 175000},
        ],
        'specifications': {
            'Material exterior': 'Felpa premium soft',
            'Relleno': 'Fibra sintética hipoalergénica',
            'Tamaños disponibles': 'Pequeño (20cm), Mediano (30cm), Grande (40cm)',
            'País de fabricación': 'Colombia',
            'Apto para': 'Todas las edades',
        },
        'care_instructions': [
            'Lavar a mano con agua fría y jabón suave.',
            'No usar lavadora ni secadora.',
            'Dejar secar al aire en lugar fresco y ventilado.',
            'No exponer al sol directo por periodos prolongados.',
            'En caso de mancha, limpiar con paño húmedo de inmediato.',
        ],
    },
    {
        'title': 'Conejita Luna',
        'slug': 'conejita-luna',
        'category_slug': 'conejos',
        'lead_description': 'Una conejita tierna que guarda los secretos más dulces del corazón.',
        'description': [
            'Conejita Luna tiene orejas largas y suaves, perfectas para envolver en un abrazo eterno.',
            'Su pelaje rosado pastel y su lazo decorativo la convierten en el regalo más especial.',
            'Puedes personalizarla con un corazón que lleva una frase dedicada para la persona especial.',
        ],
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
            {'slug': 'grande', 'price': 185000},
        ],
        'specifications': {
            'Material exterior': 'Felpa ultra suave',
            'Relleno': 'Fibra hipoalergénica de alta densidad',
            'Tamaños disponibles': 'Pequeño (20cm), Mediano (30cm), Grande (40cm)',
            'País de fabricación': 'Colombia',
            'Incluye': 'Lazo decorativo y tarjeta de dedicatoria',
        },
        'care_instructions': [
            'Lavar a mano con agua fría.',
            'No centrifugar.',
            'Secar en posición horizontal.',
            'El lazo decorativo retirar antes de lavar.',
        ],
    },
    {
        'title': 'Unicornio Celeste',
        'slug': 'unicornio-celeste',
        'category_slug': 'unicornios',
        'lead_description': 'Un unicornio mágico que trae color y fantasía a cada rincón.',
        'description': [
            'Unicornio Celeste tiene un cuerno brillante y una melena arcoíris que brilla con la luz.',
            'Viene en varios colores para que elijas el que más conecte con tu magia interior.',
            'Puedes agregarle una huella personalizada o incluso un mensaje de audio para hacerlo único.',
        ],
        'badge': 'none',
        'is_featured': False,
        'discount_pct': 20,
        'display_order': 3,
        'has_huella': True,
        'has_corazon': False,
        'has_audio': True,
        'huella_extra_cost': 15000,
        'corazon_extra_cost': 0,
        'audio_extra_cost': 20000,
        'color_slugs': ['rosado', 'azul-cielo', 'blanco'],
        'sizes': [
            {'slug': 'pequeno', 'price': 98000},
            {'slug': 'mediano', 'price': 148000},
            {'slug': 'grande', 'price': 198000},
        ],
        'specifications': {
            'Material exterior': 'Felpa brillante premium',
            'Relleno': 'Fibra sintética premium',
            'Cuerno': 'Plástico ABS pintado a mano',
            'Tamaños disponibles': 'Pequeño (20cm), Mediano (30cm), Grande (40cm)',
            'País de fabricación': 'Colombia',
        },
        'care_instructions': [
            'Lavar a mano cuidadosamente.',
            'El cuerno es resistente al agua, pero evitar sumergirlo.',
            'No lavar en lavadora.',
            'Secar al aire libre.',
        ],
    },
    {
        'title': 'Stitch Travieso',
        'slug': 'stitch-travieso',
        'category_slug': 'stich',
        'lead_description': 'El experimento 626 más adorable de la galaxia, listo para ser tuyo.',
        'description': [
            'Stitch Travieso es el compañero perfecto para los amantes del personaje más icónico de Disney.',
            'Con sus orejas grandes y su expresión traviesa, es imposible no sonreír al verlo.',
            'Personalízalo con un corazón que lleva tu frase favorita de la película.',
        ],
        'badge': 'limited_edition',
        'is_featured': False,
        'discount_pct': 0,
        'display_order': 100,
        'has_huella': False,
        'has_corazon': True,
        'has_audio': False,
        'huella_extra_cost': 0,
        'corazon_extra_cost': 10000,
        'audio_extra_cost': 0,
        'color_slugs': ['azul-cielo', 'gris'],
        'sizes': [
            {'slug': 'pequeno', 'price': 105000},
            {'slug': 'mediano', 'price': 158000},
            {'slug': 'grande', 'price': 210000},
            {'slug': 'jumbo', 'price': 320000},
        ],
        'specifications': {
            'Material exterior': 'Felpa de alta calidad',
            'Relleno': 'Fibra sintética hipoalergénica',
            'Tamaños disponibles': 'Pequeño, Mediano, Grande, Jumbo (100cm)',
            'Edición': 'Limitada',
            'País de fabricación': 'Colombia',
        },
        'care_instructions': [
            'Lavar a mano con agua tibia.',
            'Usar detergente neutro.',
            'No planchar ni usar blanqueador.',
            'Secar en sombra.',
        ],
    },
]


class Command(BaseCommand):
    help = 'Delete all peluches and seed demo products'

    @transaction.atomic
    def handle(self, *args, **options):
        # ── Delete existing orders (unblock FK constraints) ───────────────────
        order_count = Order.objects.count()
        Order.objects.all().delete()
        self.stdout.write(f'  Deleted {order_count} existing orders.')

        # ── Delete existing peluches ──────────────────────────────────────────
        peluch_count = Peluch.objects.count()
        for peluch in Peluch.objects.select_related('gallery').all():
            try:
                gallery = peluch.gallery
                if gallery and gallery.pk:
                    # Delete without triggering Peluch.delete() cascade check
                    Peluch.objects.filter(pk=peluch.pk).delete()
                    gallery.delete()
                else:
                    Peluch.objects.filter(pk=peluch.pk).delete()
            except Exception:
                Peluch.objects.filter(pk=peluch.pk).delete()
        self.stdout.write(f'  Deleted {peluch_count} existing peluches.')

        # ── Build lookup maps ─────────────────────────────────────────────────
        categories = {c.slug: c for c in Category.objects.all()}
        colors = {c.slug: c for c in GlobalColor.objects.all()}
        sizes = {s.slug: s for s in GlobalSize.objects.all()}

        # ── Seed new peluches ─────────────────────────────────────────────────
        created = 0
        for data in SEED_DATA:
            cat = categories.get(data['category_slug'])
            if not cat:
                self.stdout.write(self.style.WARNING(
                    f"  Category '{data['category_slug']}' not found — skipping {data['title']}"
                ))
                continue

            library = Library.objects.create(title=data['title'])
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

            # Colors
            for slug in data['color_slugs']:
                if slug in colors:
                    peluch.available_colors.add(colors[slug])

            # Size prices
            for sp in data['sizes']:
                size_obj = sizes.get(sp['slug'])
                if size_obj:
                    PeluchSizePrice.objects.create(
                        peluch=peluch,
                        size=size_obj,
                        price=sp['price'],
                        is_available=True,
                    )

            created += 1
            discount_str = f' [-{data["discount_pct"]}%]' if data['discount_pct'] else ''
            self.stdout.write(f'  ✓ {data["title"]}{discount_str}')

        self.stdout.write(self.style.SUCCESS(f'\nDone — {created} peluches created.'))
