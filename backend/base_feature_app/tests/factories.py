import factory
from django.contrib.auth import get_user_model
from django_attachments.models import Library

from base_feature_app.models import (
    Category,
    GlobalColor,
    GlobalSize,
    Order,
    OrderItem,
    Peluch,
    PeluchColorImage,
    PeluchSizePrice,
    PersonalizationMedia,
    Review,
    WompiTransaction,
)


User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f'user{n}@example.com')
    first_name = factory.Sequence(lambda n: f'User{n}')
    last_name = 'Test'
    is_active = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop('password', 'testpassword123')
        return model_class.objects.create_user(*args, password=password, **kwargs)


class AdminUserFactory(UserFactory):
    email = factory.Sequence(lambda n: f'admin{n}@example.com')
    first_name = factory.Sequence(lambda n: f'Admin{n}')
    is_staff = True
    is_superuser = True


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category

    name = factory.Sequence(lambda n: f'Categoría {n}')
    slug = factory.Sequence(lambda n: f'categoria-{n}')
    is_active = True


class GlobalColorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GlobalColor

    name = factory.Sequence(lambda n: f'Color {n}')
    slug = factory.Sequence(lambda n: f'color-{n}')
    hex_code = '#FF69B4'
    sort_order = factory.Sequence(lambda n: n)
    is_active = True


class GlobalSizeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GlobalSize

    label = factory.Sequence(lambda n: f'Talla {n}')
    slug = factory.Sequence(lambda n: f'talla-{n}')
    cm = '30cm'
    sort_order = factory.Sequence(lambda n: n)
    is_active = True


class LibraryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Library

    title = factory.Sequence(lambda n: f'Gallery {n}')


class PeluchFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Peluch

    title = factory.Sequence(lambda n: f'Peluche {n}')
    slug = factory.Sequence(lambda n: f'peluche-{n}')
    category = factory.SubFactory(CategoryFactory)
    lead_description = 'Adorable peluche artesanal'
    gallery = factory.SubFactory(LibraryFactory)
    is_active = True

    @factory.post_generation
    def colors(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for color in extracted:
                self.available_colors.add(color)


class PeluchSizePriceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PeluchSizePrice

    peluch = factory.SubFactory(PeluchFactory)
    size = factory.SubFactory(GlobalSizeFactory)
    price = 75000
    is_available = True


class PeluchColorImageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PeluchColorImage
        exclude = ['attachment_obj']

    peluch = factory.SubFactory(PeluchFactory)
    color = factory.SubFactory(GlobalColorFactory)
    display_order = 0

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        from django_attachments.models import Attachment, Library
        library = kwargs['peluch'].gallery
        attachment = Attachment.objects.create(
            library=library,
            original_filename='test.jpg',
            file='personalizations/test/test.jpg',
        )
        kwargs['attachment'] = attachment
        return super()._create(model_class, *args, **kwargs)


class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    customer = factory.SubFactory(UserFactory)
    customer_email = factory.LazyAttribute(lambda o: o.customer.email if o.customer else 'guest@example.com')
    customer_name = factory.LazyAttribute(lambda o: f'{o.customer.first_name} {o.customer.last_name}' if o.customer else 'Guest User')
    customer_phone = '3001234567'
    address = 'Calle 123 # 45-67'
    city = 'Bogotá'
    department = 'Cundinamarca'
    status = Order.Status.PENDING_PAYMENT
    total_amount = 80000
    deposit_amount = 40000
    balance_amount = 40000


class DeliveredOrderFactory(OrderFactory):
    status = Order.Status.DELIVERED


class OrderItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OrderItem

    order = factory.SubFactory(OrderFactory)
    peluch = factory.SubFactory(PeluchFactory)
    size = factory.SubFactory(GlobalSizeFactory)
    color = factory.SubFactory(GlobalColorFactory)
    quantity = 1
    unit_price = 75000


class PersonalizationMediaFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PersonalizationMedia

    uploaded_by = factory.SubFactory(UserFactory)
    media_type = PersonalizationMedia.MediaType.HUELLA_IMAGE
    file = factory.django.FileField(filename='test_huella.jpg')
    file_size_kb = 120
    is_used = False


class WompiTransactionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = WompiTransaction

    order = factory.SubFactory(OrderFactory)
    reference = factory.Sequence(lambda n: f'REF-TEST-{n:04d}')
    amount_in_cents = 4000000
    currency = 'COP'
    status = WompiTransaction.Status.PENDING


class ReviewFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Review

    peluch = factory.SubFactory(PeluchFactory)
    user = factory.SubFactory(UserFactory)
    order = factory.SubFactory(DeliveredOrderFactory, customer=factory.SelfAttribute('..user'))
    rating = 5
    comment = 'Excelente peluche, muy bien hecho.'
    is_approved = False
