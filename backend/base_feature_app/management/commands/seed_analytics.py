"""
Seed fake analytics data (PageViews + Orders) for the last N days.

Usage:
    python manage.py seed_analytics            # 30 days, default volume
    python manage.py seed_analytics --days 60
    python manage.py seed_analytics --clear    # delete existing analytics first
"""
import random
import uuid
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from base_feature_app.models import (
    GlobalColor, GlobalSize, Order, OrderItem, PageView, Peluch
)

# ── Colombian geography ────────────────────────────────────────────────────────
CITIES = [
    ('Bogotá', 'Cundinamarca'),
    ('Medellín', 'Antioquia'),
    ('Cali', 'Valle del Cauca'),
    ('Barranquilla', 'Atlántico'),
    ('Cartagena', 'Bolívar'),
    ('Bucaramanga', 'Santander'),
    ('Manizales', 'Caldas'),
    ('Pereira', 'Risaralda'),
    ('Armenia', 'Quindío'),
    ('Ibagué', 'Tolima'),
]

NAMES = [
    'Valentina García', 'Sofía Martínez', 'Isabella López', 'Camila Rodríguez',
    'Luciana Hernández', 'Valeria González', 'Daniela Pérez', 'Sebastián Torres',
    'Santiago Ramírez', 'Mateo Flores', 'Samuel Díaz', 'Nicolás Morales',
    'Alejandra Jiménez', 'Laura Vargas', 'Mariana Castro', 'Juliana Romero',
]

# ── Traffic weights (realistic for an Instagram-heavy brand) ──────────────────
TRAFFIC_SOURCES = ['instagram', 'direct', 'google', 'whatsapp', 'other']
TRAFFIC_WEIGHTS = [45, 20, 20, 10, 5]

DEVICE_TYPES = ['mobile', 'desktop', 'tablet']
DEVICE_WEIGHTS = [70, 22, 8]

# ── Price bands per size (COP) ────────────────────────────────────────────────
SIZE_PRICES = {
    'Pequeño': (75_000, 110_000),
    'Mediano': (110_000, 170_000),
    'Grande':  (170_000, 260_000),
}
DEFAULT_PRICE_RANGE = (80_000, 150_000)

ORDER_STATUSES = [
    Order.Status.PENDING_PAYMENT,
    Order.Status.PAYMENT_CONFIRMED,
    Order.Status.IN_PRODUCTION,
    Order.Status.SHIPPED,
    Order.Status.DELIVERED,
]
STATUS_WEIGHTS = [10, 20, 30, 25, 15]


def _rand_price(size_label: str) -> int:
    lo, hi = SIZE_PRICES.get(size_label, DEFAULT_PRICE_RANGE)
    return random.randrange(lo, hi, 5_000)


def _session_id() -> str:
    return uuid.uuid4().hex[:20]


class Command(BaseCommand):
    help = 'Seed fake PageViews and Orders for analytics testing'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=30, help='Number of past days to cover')
        parser.add_argument('--pageviews', type=int, default=350, help='Total PageView records')
        parser.add_argument('--orders', type=int, default=45, help='Total Order records')
        parser.add_argument('--clear', action='store_true', help='Delete existing analytics first')

    def handle(self, *args, **options):
        days = options['days']
        n_views = options['pageviews']
        n_orders = options['orders']

        peluches = list(Peluch.objects.filter(is_active=True))
        sizes = list(GlobalSize.objects.all())
        colors = list(GlobalColor.objects.all())

        if not peluches:
            self.stderr.write(self.style.ERROR('No hay peluches activos en la base de datos.'))
            return
        if not sizes or not colors:
            self.stderr.write(self.style.ERROR('Faltan tallas o colores globales.'))
            return

        if options['clear']:
            deleted_pv, _ = PageView.objects.all().delete()
            deleted_o, _ = Order.objects.filter(
                customer_email__endswith='@fake.mimittos.co'
            ).delete()
            self.stdout.write(self.style.WARNING(
                f'Eliminados {deleted_pv} PageViews y {deleted_o} pedidos fake.'
            ))

        now = timezone.now()

        # ── PageViews ──────────────────────────────────────────────────────────
        self.stdout.write('Generando PageViews…')
        paths = ['/'] + ['/catalogo'] + [f'/peluches/{p.slug}' for p in peluches]
        path_weights = [5, 10] + [15] * len(peluches)

        page_view_ids = []
        for _ in range(n_views):
            days_back = random.randint(0, days - 1)
            seconds_back = random.randint(0, 86_400)
            fake_dt = now - timedelta(days=days_back, seconds=seconds_back)

            url_path = random.choices(paths, weights=path_weights, k=1)[0]
            peluch_slug = url_path.split('/')[-1] if url_path.startswith('/peluches/') else None
            peluch_obj = next((p for p in peluches if p.slug == peluch_slug), None)

            pv = PageView.objects.create(
                url_path=url_path,
                peluch=peluch_obj,
                session_id=_session_id(),
                is_new_visitor=random.random() < 0.65,
                device_type=random.choices(DEVICE_TYPES, weights=DEVICE_WEIGHTS, k=1)[0],
                traffic_source=random.choices(TRAFFIC_SOURCES, weights=TRAFFIC_WEIGHTS, k=1)[0],
                city=random.choice(CITIES)[0],
            )
            page_view_ids.append((pv.pk, fake_dt))

        # Backdate created_at (bypasses auto_now_add)
        for pk, dt in page_view_ids:
            PageView.objects.filter(pk=pk).update(created_at=dt)

        self.stdout.write(self.style.SUCCESS(f'  ✓ {n_views} PageViews creados'))

        # ── Orders ─────────────────────────────────────────────────────────────
        self.stdout.write('Generando Pedidos…')
        order_ids = []
        for i in range(n_orders):
            days_back = random.randint(0, days - 1)
            seconds_back = random.randint(0, 86_400)
            fake_dt = now - timedelta(days=days_back, seconds=seconds_back)

            city, department = random.choice(CITIES)
            name = random.choice(NAMES)
            status = random.choices(ORDER_STATUSES, weights=STATUS_WEIGHTS, k=1)[0]

            # Pick 1-2 peluches for this order
            n_items = random.choices([1, 1, 1, 2], k=1)[0]
            selected = random.sample(peluches, min(n_items, len(peluches)))

            total = 0
            item_data = []
            for peluch in selected:
                size = random.choice(sizes)
                color = random.choice(colors)
                qty = random.choices([1, 1, 1, 2], k=1)[0]
                price = _rand_price(size.label)
                total += price * qty
                item_data.append((peluch, size, color, qty, price))

            deposit = int(total * 0.5)
            balance = total - deposit

            order = Order.objects.create(
                customer_name=name,
                customer_email=f'cliente{i+1}@fake.mimittos.co',
                customer_phone=f'31{random.randint(10000000, 99999999)}',
                address=f'Calle {random.randint(1, 100)} # {random.randint(1, 99)}-{random.randint(1, 99)}',
                city=city,
                department=department,
                status=status,
                total_amount=total,
                deposit_amount=deposit,
                balance_amount=balance,
            )

            for peluch, size, color, qty, price in item_data:
                OrderItem.objects.create(
                    order=order,
                    peluch=peluch,
                    size=size,
                    color=color,
                    quantity=qty,
                    unit_price=price,
                )

            order_ids.append((order.pk, fake_dt))

        for pk, dt in order_ids:
            Order.objects.filter(pk=pk).update(created_at=dt, updated_at=dt)

        self.stdout.write(self.style.SUCCESS(f'  ✓ {n_orders} Pedidos creados'))
        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Listo — {n_views} PageViews + {n_orders} Pedidos de los últimos {days} días'
        ))
