"""
Seed command for demo/dev environment.

Creates a complete dataset:
  - 3 categories (Osos, Conejos, Unicornios)
  - 5 colors + 3 sizes
  - 4 peluches with size prices and gallery images
  - 1 demo customer: demo@mimittos.com / Demo1234!
  - 3 orders (pending_payment, in_production, delivered)

Usage:
    source venv/bin/activate
    python manage.py seed_demo
    python manage.py seed_demo --reset   # wipe peluch/order data first
"""

import io
import random

from django.core.management.base import BaseCommand
from django.db import transaction

from base_feature_app.models import (
    User,
    Category,
    GlobalColor,
    GlobalSize,
    Peluch,
    PeluchSizePrice,
    Order,
    OrderItem,
    OrderStatusHistory,
)

try:
    from django_attachments.models import Attachment, Library
    HAS_ATTACHMENTS = True
except ImportError:
    HAS_ATTACHMENTS = False

try:
    from PIL import Image, ImageDraw
    from django.core.files.base import ContentFile
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


# ── Palette for gradient placeholder images ─────────────────────────────────
PALETTES = [
    ((255, 179, 186), (255, 205, 210)),
    ((186, 225, 255), (144, 202, 249)),
    ((204, 204, 255), (179, 157, 219)),
    ((185, 246, 202), (165, 214, 167)),
    ((255, 236, 179), (255, 213, 79)),
]


def _make_gradient_image(index: int) -> "ContentFile":
    c1, c2 = PALETTES[index % len(PALETTES)]
    w, h = 600, 600
    img = Image.new("RGB", (w, h))
    for y in range(h):
        t = y / h
        row_color = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
        img.paste(Image.new("RGB", (w, 1), row_color), (0, y))
    draw = ImageDraw.Draw(img, "RGBA")
    for _ in range(3):
        cx, cy = random.randint(0, w), random.randint(0, h)
        r = random.randint(60, 140)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 40))
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="WEBP", quality=85)
    buf.seek(0)
    return ContentFile(buf.read(), name=f"peluch_placeholder_{index}.webp")


def _create_gallery(title: str, num_images: int = 3) -> "Library | None":
    if not HAS_ATTACHMENTS or not HAS_PIL:
        return None
    lib = Library.objects.create(title=title)
    for i in range(num_images):
        Attachment.objects.create(
            library=lib,
            file=_make_gradient_image(i),
            original_name=f"{title.lower().replace(' ', '_')}_{i + 1}.webp",
            rank=i,
        )
    return lib


# ── Seed data definitions ────────────────────────────────────────────────────

CATEGORIES = [
    {"name": "Osos",       "slug": "osos",       "description": "Osos de peluche artesanales", "display_order": 1},
    {"name": "Conejos",    "slug": "conejos",    "description": "Conejos suaves y adorables",   "display_order": 2},
    {"name": "Unicornios", "slug": "unicornios", "description": "Unicornios mágicos y únicos",  "display_order": 3},
]

COLORS = [
    {"name": "Beige",      "slug": "beige",      "hex_code": "#F5E6D3", "sort_order": 1},
    {"name": "Rosado",     "slug": "rosado",     "hex_code": "#FFB6C1", "sort_order": 2},
    {"name": "Azul cielo", "slug": "azul-cielo", "hex_code": "#87CEEB", "sort_order": 3},
    {"name": "Blanco",     "slug": "blanco",     "hex_code": "#FFFFFF", "sort_order": 4},
    {"name": "Café",       "slug": "cafe",       "hex_code": "#8B6914", "sort_order": 5},
]

SIZES = [
    {"label": "Pequeño",  "slug": "pequeno",  "cm": "20 cm", "sort_order": 1},
    {"label": "Mediano",  "slug": "mediano",  "cm": "30 cm", "sort_order": 2},
    {"label": "Grande",   "slug": "grande",   "cm": "40 cm", "sort_order": 3},
]

PELUCHES = [
    {
        "title": "Osito Mimoso",
        "slug": "osito-mimoso",
        "category_slug": "osos",
        "lead_description": "El oso más tierno que jamás habrás abrazado.",
        "description": (
            "Osito Mimoso es un peluche artesanal elaborado a mano con tela de felpa suave premium. "
            "Perfecto como regalo de cumpleaños, baby shower o simplemente para consentir a alguien especial. "
            "Disponible en tres tamaños para todos los gustos."
        ),
        "specifications": {"material": "Felpa premium", "relleno": "Fibra siliconada", "lavado": "A mano"},
        "care_instructions": ["Lavar a mano con agua fría", "No usar secadora", "Guardar en lugar seco"],
        "badge": "bestseller",
        "is_featured": True,
        "has_huella": True,
        "has_corazon": True,
        "has_audio": False,
        "huella_extra_cost": 15000,
        "corazon_extra_cost": 12000,
        "color_slugs": ["beige", "cafe", "blanco"],
        "size_prices": {"pequeno": 89000, "mediano": 119000, "grande": 149000},
    },
    {
        "title": "Conejita Luna",
        "slug": "conejita-luna",
        "category_slug": "conejos",
        "lead_description": "Una conejita suave con orejas largas que enamora a todos.",
        "description": (
            "Conejita Luna tiene orejas largas y suaves que la hacen irresistible. "
            "Fabricada con tela ultrasuave certificada libre de sustancias nocivas. "
            "El regalo ideal para bebés y niños de todas las edades."
        ),
        "specifications": {"material": "Felpa ultrasuave", "relleno": "Algodón hipoalergénico", "certificación": "OEKO-TEX"},
        "care_instructions": ["Lavar a mano", "Secar al aire libre", "No planchar"],
        "badge": "new",
        "is_featured": True,
        "has_huella": True,
        "has_corazon": True,
        "has_audio": True,
        "huella_extra_cost": 15000,
        "corazon_extra_cost": 12000,
        "audio_extra_cost": 20000,
        "color_slugs": ["rosado", "blanco", "azul-cielo"],
        "size_prices": {"pequeno": 95000, "mediano": 125000, "grande": 160000},
    },
    {
        "title": "Unicornio Estelar",
        "slug": "unicornio-estelar",
        "category_slug": "unicornios",
        "lead_description": "Brillante, mágico y completamente personalizable.",
        "description": (
            "El Unicornio Estelar es la pieza estrella de MIMITTOS. "
            "Con su melena multicolor y su cuerno brillante, transforma cualquier cuarto en un lugar mágico. "
            "Puedes personalizarlo con el nombre de quien más quieras."
        ),
        "specifications": {"material": "Felpa brillante", "relleno": "Fibra siliconada premium", "cuerno": "Plástico ABS seguro"},
        "care_instructions": ["Lavar a mano con delicadeza", "No frotar el cuerno", "Guardar cubierto"],
        "badge": "limited_edition",
        "is_featured": True,
        "has_huella": True,
        "has_corazon": True,
        "has_audio": True,
        "huella_extra_cost": 18000,
        "corazon_extra_cost": 15000,
        "audio_extra_cost": 22000,
        "color_slugs": ["rosado", "azul-cielo", "blanco"],
        "size_prices": {"pequeno": 110000, "mediano": 145000, "grande": 190000},
    },
    {
        "title": "Osito Pandita",
        "slug": "osito-pandita",
        "category_slug": "osos",
        "lead_description": "El clásico osito panda en versión MIMITTOS.",
        "description": (
            "Osito Pandita combina el blanco y negro clásico del panda con la suavidad característica de MIMITTOS. "
            "Un regalo memorable para cualquier ocasión."
        ),
        "specifications": {"material": "Felpa bicolor", "relleno": "Fibra siliconada", "ojos": "Botones plásticos seguros"},
        "care_instructions": ["Lavar a mano", "Secar a temperatura ambiente"],
        "badge": "none",
        "is_featured": False,
        "has_huella": False,
        "has_corazon": True,
        "has_audio": False,
        "corazon_extra_cost": 12000,
        "color_slugs": ["blanco", "cafe"],
        "size_prices": {"pequeno": 79000, "mediano": 105000, "grande": 135000},
    },
]

DEMO_USER = {
    "email": "demo@mimittos.com",
    "password": "Demo1234!",
    "first_name": "Valentina",
    "last_name": "Gómez",
    "phone": "+57 310 555 0001",
}

ORDERS = [
    {
        "status": "delivered",
        "customer_name": "Valentina Gómez",
        "customer_phone": "+57 310 555 0001",
        "address": "Cra 15 #93-47 Apto 301",
        "city": "Bogotá",
        "department": "Cundinamarca",
        "postal_code": "110221",
        "notes": "Tocar timbre dos veces por favor.",
        "tracking_number": "TCC-2026-001234",
        "shipping_carrier": "TCC Envíos",
        "peluch_slug": "osito-mimoso",
        "size_slug": "mediano",
        "color_slug": "beige",
        "quantity": 1,
        "has_huella": True,
        "huella_type": "name",
        "huella_text": "VALE",
        "has_corazon": False,
    },
    {
        "status": "in_production",
        "customer_name": "Valentina Gómez",
        "customer_phone": "+57 310 555 0001",
        "address": "Cra 15 #93-47 Apto 301",
        "city": "Bogotá",
        "department": "Cundinamarca",
        "postal_code": "110221",
        "notes": "",
        "peluch_slug": "conejita-luna",
        "size_slug": "grande",
        "color_slug": "rosado",
        "quantity": 1,
        "has_huella": True,
        "huella_type": "name",
        "huella_text": "SOFIA",
        "has_corazon": True,
        "corazon_phrase": "Para mi amor eterno",
    },
    {
        "status": "pending_payment",
        "customer_name": "Valentina Gómez",
        "customer_phone": "+57 310 555 0001",
        "address": "Cra 15 #93-47 Apto 301",
        "city": "Bogotá",
        "department": "Cundinamarca",
        "postal_code": "110221",
        "notes": "Regalo de cumpleaños, envolver bonito.",
        "peluch_slug": "unicornio-estelar",
        "size_slug": "pequeno",
        "color_slug": "rosado",
        "quantity": 2,
        "has_huella": False,
        "has_corazon": False,
    },
]


class Command(BaseCommand):
    help = "Seed demo data: categories, colors, sizes, peluches, demo user and orders"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing peluches, orders and demo user before seeding",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self._reset()

        self.stdout.write(self.style.SUCCESS("\n🧸  MIMITTOS — Demo Seed\n"))

        categories = self._seed_categories()
        colors = self._seed_colors()
        sizes = self._seed_sizes()
        peluches = self._seed_peluches(categories, colors, sizes)
        user = self._seed_demo_user()
        self._seed_orders(user, peluches, sizes, colors)

        self.stdout.write(self.style.SUCCESS("\n✅  Demo seed complete!\n"))
        self.stdout.write(f"   👤  demo@mimittos.com  /  Demo1234!\n")
        self.stdout.write(f"   🧸  {len(peluches)} peluches creados\n")
        self.stdout.write(f"   🛒  {len(ORDERS)} órdenes creadas\n\n")

    # ── Reset ────────────────────────────────────────────────────────────────

    def _reset(self):
        self.stdout.write(self.style.WARNING("  ⚠️  --reset: borrando datos anteriores…"))
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        PeluchSizePrice.objects.all().delete()
        Peluch.objects.all().delete()
        User.objects.filter(email=DEMO_USER["email"]).delete()
        self.stdout.write(self.style.WARNING("  ✓  Datos borrados.\n"))

    # ── Categories ───────────────────────────────────────────────────────────

    def _seed_categories(self) -> dict:
        result = {}
        for data in CATEGORIES:
            obj, created = Category.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "name": data["name"],
                    "description": data["description"],
                    "display_order": data["display_order"],
                    "is_active": True,
                },
            )
            result[data["slug"]] = obj
            label = "✓ creada" if created else "· ya existe"
            self.stdout.write(f"  Categoría [{label}] {obj.name}")
        return result

    # ── Colors ───────────────────────────────────────────────────────────────

    def _seed_colors(self) -> dict:
        result = {}
        for data in COLORS:
            obj, created = GlobalColor.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "name": data["name"],
                    "hex_code": data["hex_code"],
                    "sort_order": data["sort_order"],
                    "is_active": True,
                },
            )
            result[data["slug"]] = obj
            label = "✓ creado" if created else "· ya existe"
            self.stdout.write(f"  Color      [{label}] {obj.name}")
        return result

    # ── Sizes ────────────────────────────────────────────────────────────────

    def _seed_sizes(self) -> dict:
        result = {}
        for data in SIZES:
            obj, created = GlobalSize.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "label": data["label"],
                    "cm": data["cm"],
                    "sort_order": data["sort_order"],
                    "is_active": True,
                },
            )
            result[data["slug"]] = obj
            label = "✓ creado" if created else "· ya existe"
            self.stdout.write(f"  Talla      [{label}] {obj.label} ({obj.cm})")
        return result

    # ── Peluches ─────────────────────────────────────────────────────────────

    def _seed_peluches(self, categories: dict, colors: dict, sizes: dict) -> dict:
        result = {}
        self.stdout.write("")

        for data in PELUCHES:
            if Peluch.objects.filter(slug=data["slug"]).exists():
                peluch = Peluch.objects.get(slug=data["slug"])
                self.stdout.write(f"  Peluche    [· ya existe] {peluch.title}")
                result[data["slug"]] = peluch
                continue

            gallery = _create_gallery(data["title"], num_images=3)

            peluch_kwargs = {
                "title": data["title"],
                "slug": data["slug"],
                "category": categories[data["category_slug"]],
                "lead_description": data["lead_description"],
                "description": data["description"],
                "specifications": data["specifications"],
                "care_instructions": data["care_instructions"],
                "badge": data["badge"],
                "is_featured": data["is_featured"],
                "is_active": True,
                "has_huella": data.get("has_huella", False),
                "has_corazon": data.get("has_corazon", False),
                "has_audio": data.get("has_audio", False),
                "huella_extra_cost": data.get("huella_extra_cost", 0),
                "corazon_extra_cost": data.get("corazon_extra_cost", 0),
                "audio_extra_cost": data.get("audio_extra_cost", 0),
            }
            if gallery:
                peluch_kwargs["gallery"] = gallery

            peluch = Peluch.objects.create(**peluch_kwargs)

            for color_slug in data.get("color_slugs", []):
                if color_slug in colors:
                    peluch.available_colors.add(colors[color_slug])

            for size_slug, price in data.get("size_prices", {}).items():
                if size_slug in sizes:
                    PeluchSizePrice.objects.get_or_create(
                        peluch=peluch,
                        size=sizes[size_slug],
                        defaults={"price": price, "is_available": True},
                    )

            result[data["slug"]] = peluch
            self.stdout.write(self.style.SUCCESS(f"  Peluche    [✓ creado ] {peluch.title}"))

        return result

    # ── Demo user ────────────────────────────────────────────────────────────

    def _seed_demo_user(self) -> User:
        self.stdout.write("")
        user, created = User.objects.get_or_create(
            email=DEMO_USER["email"],
            defaults={
                "first_name": DEMO_USER["first_name"],
                "last_name": DEMO_USER["last_name"],
                "phone": DEMO_USER["phone"],
                "role": User.Role.CUSTOMER,
                "is_active": True,
            },
        )
        if created:
            user.set_password(DEMO_USER["password"])
            user.save(update_fields=["password"])
            self.stdout.write(self.style.SUCCESS(f"  Usuario    [✓ creado ] {user.email}"))
        else:
            self.stdout.write(f"  Usuario    [· ya existe] {user.email}")
        return user

    # ── Orders ───────────────────────────────────────────────────────────────

    def _seed_orders(self, user: User, peluches: dict, sizes: dict, colors: dict):
        self.stdout.write("")

        if Order.objects.filter(customer=user).count() >= len(ORDERS):
            self.stdout.write(f"  Órdenes    [· ya existen] {Order.objects.filter(customer=user).count()} órdenes para {user.email}")
            return

        for order_data in ORDERS:
            peluch = peluches.get(order_data["peluch_slug"])
            size = sizes.get(order_data["size_slug"])
            color = colors.get(order_data["color_slug"])

            if not peluch or not size or not color:
                self.stdout.write(
                    self.style.WARNING(
                        f"  Orden      [! omitida ] datos incompletos para {order_data['peluch_slug']}"
                    )
                )
                continue

            size_price = PeluchSizePrice.objects.filter(peluch=peluch, size=size).first()
            unit_price = size_price.price if size_price else 0

            personalization_cost = 0
            if order_data.get("has_huella"):
                personalization_cost += peluch.huella_extra_cost
            if order_data.get("has_corazon"):
                personalization_cost += peluch.corazon_extra_cost

            qty = order_data.get("quantity", 1)
            line_total = (unit_price + personalization_cost) * qty
            deposit = line_total // 2
            balance = line_total - deposit

            order = Order.objects.create(
                customer=user,
                customer_email=user.email,
                customer_name=order_data["customer_name"],
                customer_phone=order_data["customer_phone"],
                address=order_data["address"],
                city=order_data["city"],
                department=order_data["department"],
                postal_code=order_data.get("postal_code", ""),
                status=order_data["status"],
                total_amount=line_total,
                deposit_amount=deposit,
                balance_amount=balance if order_data["status"] != "delivered" else 0,
                tracking_number=order_data.get("tracking_number", ""),
                shipping_carrier=order_data.get("shipping_carrier", ""),
                notes=order_data.get("notes", ""),
            )

            snapshot = {
                "peluch_title": peluch.title,
                "size_label": size.label,
                "color_name": color.name,
            }
            if order_data.get("has_huella"):
                snapshot["huella_type"] = order_data.get("huella_type", "")
                snapshot["huella_text"] = order_data.get("huella_text", "")
            if order_data.get("has_corazon"):
                snapshot["corazon_phrase"] = order_data.get("corazon_phrase", "")

            OrderItem.objects.create(
                order=order,
                peluch=peluch,
                size=size,
                color=color,
                quantity=qty,
                unit_price=unit_price,
                has_huella=order_data.get("has_huella", False),
                huella_type=order_data.get("huella_type", ""),
                huella_text=order_data.get("huella_text", ""),
                has_corazon=order_data.get("has_corazon", False),
                corazon_phrase=order_data.get("corazon_phrase", ""),
                has_audio=False,
                personalization_cost=personalization_cost,
                configuration_snapshot=snapshot,
            )

            OrderStatusHistory.objects.create(
                order=order,
                previous_status="",
                new_status=order_data["status"],
                notes="Estado inicial asignado por seed_demo.",
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"  Orden      [✓ creada ] #{order.order_number}  "
                    f"{peluch.title} ({size.label})  →  {order.get_status_display()}"
                )
            )
