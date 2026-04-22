import random
import uuid

from faker import Faker
from django.core.management.base import BaseCommand
from django.db import transaction

from base_feature_app.models import (
    Blog,
    Category,
    GlobalColor,
    GlobalSize,
    Order,
    OrderItem,
    OrderStatusHistory,
    Peluch,
    PeluchSizePrice,
    User,
    WompiTransaction,
)
from base_feature_app.services.order_service import OrderService

from ._fake_data import (
    FAKE_DEFAULT_PASSWORD,
    fake_blog_title,
    fake_guest_email,
    fake_slug,
    fake_user_email,
    create_library,
)


CATEGORY_SEED = [
    ('Osos', 'Peluche clásico y abrazable para cualquier ocasión.'),
    ('Conejos', 'Orejas largas, acabados suaves y personalidad tierna.'),
    ('Unicornios', 'Opciones mágicas con colores suaves y detalles brillantes.'),
]

COLOR_SEED = [
    ('Beige', '#F5E6D3'),
    ('Rosado', '#FFB6C1'),
    ('Azul cielo', '#87CEEB'),
    ('Blanco', '#FFFFFF'),
    ('Café', '#8B6914'),
    ('Lila', '#C7B8EA'),
]

SIZE_SEED = [
    ('Pequeno', '20 cm'),
    ('Mediano', '30 cm'),
    ('Grande', '40 cm'),
]

DEPARTMENTS = [
    'Antioquia',
    'Bogota',
    'Cundinamarca',
    'Valle del Cauca',
    'Atlantico',
    'Santander',
]

PELUCHE_TEMPLATES = [
    {
        'title': 'Osito Mimoso',
        'category': 'Osos',
        'lead': 'Un abrazo suave y artesanal para regalar con intención.',
        'description': [
            'Confeccionado con felpa premium y relleno siliconado.',
            'Ideal para regalos de nacimiento, cumpleaños o aniversarios.',
            'Disponible en varias opciones de color y personalización.',
        ],
        'specifications': {
            'material': 'Felpa premium',
            'relleno': 'Fibra siliconada',
            'lavado': 'A mano',
        },
        'care': ['Lavar a mano', 'Secar a la sombra', 'Guardar en lugar seco'],
        'color_names': ['Beige', 'Café', 'Blanco'],
        'size_prices': {'Pequeno': 89000, 'Mediano': 119000, 'Grande': 149000},
        'badge': Peluch.BadgeType.BESTSELLER,
        'is_featured': True,
        'has_huella': True,
        'has_corazon': True,
        'has_audio': False,
        'huella_extra_cost': 15000,
        'corazon_extra_cost': 12000,
        'audio_extra_cost': 0,
    },
    {
        'title': 'Conejita Luna',
        'category': 'Conejos',
        'lead': 'Peluche delicado con orejas largas y tonos pastel.',
        'description': [
            'Tela ultrasuave certificada y costuras reforzadas.',
            'Funciona muy bien como regalo para baby shower y primera infancia.',
            'Permite personalizaciones bordadas y mensaje en corazon.',
        ],
        'specifications': {
            'material': 'Felpa ultrasuave',
            'relleno': 'Algodon hipoalergenico',
            'certificacion': 'OEKO-TEX',
        },
        'care': ['Lavar a mano', 'No planchar', 'Secar al aire libre'],
        'color_names': ['Rosado', 'Blanco', 'Azul cielo'],
        'size_prices': {'Pequeno': 95000, 'Mediano': 125000, 'Grande': 160000},
        'badge': Peluch.BadgeType.NEW,
        'is_featured': True,
        'has_huella': True,
        'has_corazon': True,
        'has_audio': True,
        'huella_extra_cost': 15000,
        'corazon_extra_cost': 12000,
        'audio_extra_cost': 20000,
    },
    {
        'title': 'Unicornio Estelar',
        'category': 'Unicornios',
        'lead': 'Una pieza magica pensada para celebraciones memorables.',
        'description': [
            'Melena color pastel y acabados artesanales de alta calidad.',
            'Pensado para detalles especiales con nombre o dedicatoria.',
            'Se fabrica bajo pedido y funciona bien en sesiones de fotos o regalos premium.',
        ],
        'specifications': {
            'material': 'Felpa brillante',
            'relleno': 'Fibra siliconada premium',
            'detalle': 'Cuerno textil bordado',
        },
        'care': ['Limpiar con pano humedo', 'No usar secadora', 'Guardar cubierto'],
        'color_names': ['Rosado', 'Lila', 'Blanco'],
        'size_prices': {'Pequeno': 110000, 'Mediano': 145000, 'Grande': 190000},
        'badge': Peluch.BadgeType.LIMITED,
        'is_featured': True,
        'has_huella': True,
        'has_corazon': True,
        'has_audio': True,
        'huella_extra_cost': 18000,
        'corazon_extra_cost': 15000,
        'audio_extra_cost': 22000,
    },
    {
        'title': 'Pandita Nube',
        'category': 'Osos',
        'lead': 'Version MIMITTOS del panda clasico en tonos suaves.',
        'description': [
            'Balance entre look clasico y acabado boutique.',
            'Perfecto para sorprender con una pieza tierna pero sobria.',
            'Disponible con corazon personalizado.',
        ],
        'specifications': {
            'material': 'Felpa bicolor',
            'relleno': 'Fibra siliconada',
            'ojos': 'Botones seguros',
        },
        'care': ['Lavar a mano', 'Secar a temperatura ambiente'],
        'color_names': ['Blanco', 'Café'],
        'size_prices': {'Pequeno': 79000, 'Mediano': 105000, 'Grande': 135000},
        'badge': Peluch.BadgeType.NONE,
        'is_featured': False,
        'has_huella': False,
        'has_corazon': True,
        'has_audio': False,
        'huella_extra_cost': 0,
        'corazon_extra_cost': 12000,
        'audio_extra_cost': 0,
    },
]


class Command(BaseCommand):
    help = 'Create fake data for the current MIMITTOS catalog, orders, users and blogs'

    def add_arguments(self, parser):
        parser.add_argument('number_of_records', type=int, nargs='?', default=None)
        parser.add_argument('--blogs', type=int, default=None)
        parser.add_argument('--peluches', type=int, default=None)
        parser.add_argument('--users', type=int, default=None)
        parser.add_argument('--orders', type=int, default=None)
        parser.add_argument(
            '--products',
            type=int,
            default=None,
            help='Legacy alias for --peluches',
        )
        parser.add_argument(
            '--sales',
            type=int,
            default=None,
            help='Legacy alias for --orders',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        counts = self._resolve_counts(options)
        fake = Faker('es_CO')

        self.stdout.write(self.style.SUCCESS('==== Creating Fake Data ===='))
        self.stdout.write('Target models: Category, GlobalColor, GlobalSize, Peluch, Order, Blog, User')

        categories = self._seed_categories()
        colors = self._seed_colors()
        sizes = self._seed_sizes()
        users = self._create_users(counts['users'], fake)
        self._create_blogs(counts['blogs'], fake)
        peluches = self._create_peluches(counts['peluches'], categories, colors, sizes, fake)
        self._create_orders(counts['orders'], users, peluches, fake)

        self.stdout.write(self.style.SUCCESS('\n==== Fake Data Creation Complete ===='))

    def _resolve_counts(self, options):
        number_of_records = options['number_of_records']
        if number_of_records is not None:
            return {
                'blogs': number_of_records,
                'peluches': number_of_records,
                'users': number_of_records,
                'orders': number_of_records,
            }

        blogs = options['blogs'] if options['blogs'] is not None else 10
        users = options['users'] if options['users'] is not None else 10
        peluches = options['peluches']
        orders = options['orders']

        if options['products'] is not None:
            if peluches is None:
                peluches = options['products']
            self.stdout.write(self.style.WARNING('`--products` is deprecated. Use `--peluches` instead.'))
        if options['sales'] is not None:
            if orders is None:
                orders = options['sales']
            self.stdout.write(self.style.WARNING('`--sales` is deprecated. Use `--orders` instead.'))

        return {
            'blogs': blogs,
            'peluches': peluches if peluches is not None else 10,
            'users': users,
            'orders': orders if orders is not None else 10,
        }

    def _seed_categories(self):
        self.stdout.write(self.style.SUCCESS('\n--- Ensuring Categories ---'))
        categories = {}
        for index, (name, description) in enumerate(CATEGORY_SEED, start=1):
            category, created = Category.objects.get_or_create(
                slug=fake_slug(name),
                defaults={
                    'name': name,
                    'description': description,
                    'display_order': index,
                    'is_active': True,
                },
            )
            categories[name] = category
            label = 'created' if created else 'exists'
            self.stdout.write(f'Category [{label}] {category.name}')
        return categories

    def _seed_colors(self):
        self.stdout.write(self.style.SUCCESS('\n--- Ensuring Colors ---'))
        colors = {}
        for index, (name, hex_code) in enumerate(COLOR_SEED, start=1):
            color, created = GlobalColor.objects.get_or_create(
                slug=fake_slug(name),
                defaults={
                    'name': name,
                    'hex_code': hex_code,
                    'sort_order': index,
                    'is_active': True,
                },
            )
            colors[name] = color
            label = 'created' if created else 'exists'
            self.stdout.write(f'Color [{label}] {color.name}')
        return colors

    def _seed_sizes(self):
        self.stdout.write(self.style.SUCCESS('\n--- Ensuring Sizes ---'))
        sizes = {}
        for index, (label_name, cm) in enumerate(SIZE_SEED, start=1):
            size, created = GlobalSize.objects.get_or_create(
                slug=fake_slug(label_name),
                defaults={
                    'label': label_name,
                    'cm': cm,
                    'sort_order': index,
                    'is_active': True,
                },
            )
            sizes[label_name] = size
            label = 'created' if created else 'exists'
            self.stdout.write(f'Size [{label}] {size.label}')
        return sizes

    def _create_users(self, count, fake):
        self.stdout.write(self.style.SUCCESS('\n--- Creating Users ---'))
        created_users = []
        for index in range(1, count + 1):
            email = fake_user_email(index)
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': fake.first_name(),
                    'last_name': fake.last_name(),
                    'phone': fake.numerify(text='3#########'),
                    'role': User.Role.CUSTOMER,
                    'is_active': True,
                    'is_staff': False,
                },
            )
            if created:
                user.set_password(FAKE_DEFAULT_PASSWORD)
                user.save(update_fields=['password'])
            created_users.append(user)
            label = 'created' if created else 'exists'
            self.stdout.write(f'User [{label}] {user.email}')

        self.stdout.write(self.style.SUCCESS(f'{count} fake users processed'))
        return created_users

    def _create_blogs(self, count, fake):
        self.stdout.write(self.style.SUCCESS('\n--- Creating Blogs ---'))
        blog_categories = ['Regalos', 'Tendencias', 'Cuidado', 'Inspiracion', 'Historias']

        for index in range(1, count + 1):
            title = fake_blog_title(fake.sentence(nb_words=5).rstrip('.'))
            blog = Blog.objects.filter(title=title).first()
            created = blog is None
            if created:
                blog = Blog.objects.create(
                    title=title,
                    description=fake.paragraph(nb_sentences=8),
                    category=random.choice(blog_categories),
                    image=create_library(title, num_images=1),
                )
            label = 'created' if created else 'exists'
            self.stdout.write(f'Blog [{label}] {blog.title}')

        self.stdout.write(self.style.SUCCESS(f'{count} fake blogs processed'))

    def _create_peluches(self, count, categories, colors, sizes, fake):
        self.stdout.write(self.style.SUCCESS('\n--- Creating Peluches ---'))
        peluches = []

        for index in range(1, count + 1):
            template = PELUCHE_TEMPLATES[(index - 1) % len(PELUCHE_TEMPLATES)]
            suffix = f'{index:03d}'
            slug = fake_slug(template['title'], suffix)
            gallery_title = f"{template['title']} {suffix}"
            peluch = Peluch.objects.filter(slug=slug).first()
            created = peluch is None
            if created:
                peluch = Peluch.objects.create(
                    title=f"{template['title']} {suffix}",
                    slug=slug,
                    category=categories[template['category']],
                    lead_description=template['lead'],
                    description=template['description'],
                    specifications=template['specifications'],
                    care_instructions=template['care'],
                    badge=template['badge'],
                    is_active=True,
                    is_featured=template['is_featured'] if index <= 6 else fake.boolean(chance_of_getting_true=30),
                    discount_pct=random.choice([0, 0, 10, 15]),
                    display_order=index,
                    gallery=create_library(gallery_title, num_images=3),
                    has_huella=template['has_huella'],
                    has_corazon=template['has_corazon'],
                    has_audio=template['has_audio'],
                    huella_extra_cost=template['huella_extra_cost'],
                    corazon_extra_cost=template['corazon_extra_cost'],
                    audio_extra_cost=template['audio_extra_cost'],
                )

            for color_name in template['color_names']:
                peluch.available_colors.add(colors[color_name])

            for size_label, base_price in template['size_prices'].items():
                PeluchSizePrice.objects.update_or_create(
                    peluch=peluch,
                    size=sizes[size_label],
                    defaults={
                        'price': base_price + random.choice([0, 2000, 5000]) if created else base_price,
                        'is_available': True,
                    },
                )

            peluches.append(peluch)
            label = 'created' if created else 'exists'
            self.stdout.write(f'Peluch [{label}] {peluch.title}')

        self.stdout.write(self.style.SUCCESS(f'{count} fake peluches processed'))
        return peluches

    def _create_orders(self, count, users, peluches, fake):
        self.stdout.write(self.style.SUCCESS('\n--- Creating Orders ---'))
        if not peluches:
            self.stdout.write(self.style.WARNING('No peluches available. Skipping orders.'))
            return

        statuses = [
            Order.Status.PENDING_PAYMENT,
            Order.Status.PAYMENT_CONFIRMED,
            Order.Status.IN_PRODUCTION,
            Order.Status.SHIPPED,
            Order.Status.DELIVERED,
        ]

        for index in range(1, count + 1):
            status = statuses[(index - 1) % len(statuses)]
            user = users[(index - 1) % len(users)] if users else None
            customer_email = user.email if user else fake_guest_email(index)
            customer_name = (
                f'{user.first_name} {user.last_name}'.strip()
                if user else fake.name()
            )
            customer_phone = user.phone if user and user.phone else fake.numerify(text='3#########')

            selected_peluches = random.sample(peluches, k=min(len(peluches), random.randint(1, min(3, len(peluches)))))
            order = Order.objects.create(
                customer=user,
                customer_email=customer_email,
                customer_name=customer_name,
                customer_phone=customer_phone,
                address=fake.street_address(),
                city=fake.city(),
                department=random.choice(DEPARTMENTS),
                postal_code=fake.postcode(),
                status=status,
                total_amount=0,
                deposit_amount=0,
                balance_amount=0,
                tracking_number=f'FAKE-TRACK-{index:04d}' if status in {Order.Status.SHIPPED, Order.Status.DELIVERED} else '',
                shipping_carrier='Transportadora Demo' if status in {Order.Status.SHIPPED, Order.Status.DELIVERED} else '',
                notes='Pedido generado por create_fake_data.',
            )

            total_amount = 0
            for peluch in selected_peluches:
                size_price = random.choice(list(peluch.size_prices.select_related('size').all()))
                color = random.choice(list(peluch.available_colors.all()))
                quantity = random.randint(1, 2)

                has_huella = peluch.has_huella and random.choice([True, False])
                has_corazon = peluch.has_corazon and random.choice([True, False])
                has_audio = peluch.has_audio and random.choice([False, False, True])

                personalization_cost = (
                    (peluch.huella_extra_cost if has_huella else 0) +
                    (peluch.corazon_extra_cost if has_corazon else 0) +
                    (peluch.audio_extra_cost if has_audio else 0)
                )

                unit_price = round(size_price.price * (100 - peluch.discount_pct) / 100)
                total_amount += (unit_price + personalization_cost) * quantity

                OrderItem.objects.create(
                    order=order,
                    peluch=peluch,
                    size=size_price.size,
                    color=color,
                    quantity=quantity,
                    unit_price=unit_price,
                    has_huella=has_huella,
                    huella_type=random.choice(
                        [OrderItem.HuellaType.NAME, OrderItem.HuellaType.DATE, OrderItem.HuellaType.LETTER]
                    ) if has_huella else '',
                    huella_text=fake.first_name()[:10].upper() if has_huella else '',
                    has_corazon=has_corazon,
                    corazon_phrase=fake.sentence(nb_words=4)[:50] if has_corazon else '',
                    has_audio=has_audio,
                    personalization_cost=personalization_cost,
                    configuration_snapshot={
                        'peluch_title': peluch.title,
                        'size_label': size_price.size.label,
                        'size_cm': size_price.size.cm,
                        'color_name': color.name,
                        'color_hex': color.hex_code,
                        'discount_pct': peluch.discount_pct,
                        'has_huella': has_huella,
                        'has_corazon': has_corazon,
                        'has_audio': has_audio,
                    },
                )

            deposit_amount = OrderService.calculate_deposit(total_amount)
            balance_amount = 0 if status == Order.Status.DELIVERED else total_amount - deposit_amount

            order.total_amount = total_amount
            order.deposit_amount = deposit_amount
            order.balance_amount = balance_amount
            order.save(update_fields=['total_amount', 'deposit_amount', 'balance_amount', 'updated_at'])

            self._create_status_history(order, status)
            WompiTransaction.objects.create(
                order=order,
                wompi_id=f'fake-wompi-{uuid.uuid4().hex[:10]}',
                reference=f'{order.order_number}-FAKE-{uuid.uuid4().hex[:6].upper()}',
                amount_in_cents=deposit_amount * 100,
                status=self._payment_status_for_order(status),
                payment_method_type='CARD',
                checkout_url=f'https://fake-checkout.local/{order.order_number.lower()}',
                raw_response={'source': 'create_fake_data'},
            )

            self.stdout.write(f'Order [created] {order.order_number} ({status})')

        self.stdout.write(self.style.SUCCESS(f'{count} fake orders created'))

    def _create_status_history(self, order, final_status):
        flow = [
            Order.Status.PENDING_PAYMENT,
            Order.Status.PAYMENT_CONFIRMED,
            Order.Status.IN_PRODUCTION,
            Order.Status.SHIPPED,
            Order.Status.DELIVERED,
        ]
        if final_status == Order.Status.PENDING_PAYMENT:
            return

        previous_status = flow[0]
        for new_status in flow[1:]:
            OrderStatusHistory.objects.create(
                order=order,
                previous_status=previous_status,
                new_status=new_status,
                notes='Historial generado por create_fake_data.',
            )
            if new_status == final_status:
                break
            previous_status = new_status

    def _payment_status_for_order(self, order_status):
        if order_status == Order.Status.PENDING_PAYMENT:
            return WompiTransaction.Status.PENDING
        return WompiTransaction.Status.APPROVED
