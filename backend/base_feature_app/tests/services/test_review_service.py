import pytest
from django.core.exceptions import ValidationError
from django_attachments.models import Library

from base_feature_app.models import (
    Category,
    GlobalColor,
    GlobalSize,
    Order,
    OrderItem,
    Peluch,
    PeluchSizePrice,
    Review,
)
from base_feature_app.services.review_service import ReviewService

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def category(db):
    return Category.objects.create(name='Osos', slug='osos-review', is_active=True)


@pytest.fixture
def color(db):
    return GlobalColor.objects.create(name='Azul', slug='azul-review', hex_code='#0000FF')


@pytest.fixture
def size(db):
    return GlobalSize.objects.create(label='Mediano', slug='mediano-review', cm='30cm')


@pytest.fixture
def peluch(db, category, color):
    library = Library.objects.create(title='Review Peluch Gallery')
    p = Peluch.objects.create(
        title='Oso Azul',
        slug='oso-azul-review',
        category=category,
        lead_description='Bonito',
        gallery=library,
    )
    p.available_colors.add(color)
    return p


@pytest.fixture
def peluch_with_price(peluch, size):
    PeluchSizePrice.objects.create(peluch=peluch, size=size, price=75000)
    return peluch


@pytest.fixture
def delivered_order(db, existing_user, peluch_with_price, size, color):
    order = Order.objects.create(
        customer=existing_user,
        customer_email=existing_user.email,
        customer_name='Test User',
        address='Calle 10',
        city='Medellín',
        department='Antioquia',
        total_amount=75000,
        deposit_amount=37500,
        balance_amount=37500,
        status=Order.Status.DELIVERED,
    )
    OrderItem.objects.create(
        order=order,
        peluch=peluch_with_price,
        size=size,
        color=color,
        quantity=1,
        unit_price=75000,
    )
    return order


# ---------------------------------------------------------------------------
# create_review — validation failures
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_create_review_raises_when_user_has_no_delivered_order(existing_user, peluch):
    with pytest.raises(ValidationError) as exc_info:
        ReviewService.create_review(peluch, existing_user, None, 5, 'Excelente')
    assert 'Solo puedes reseñar' in str(exc_info.value)


@pytest.mark.django_db
def test_create_review_raises_on_duplicate_review(existing_user, peluch_with_price, delivered_order):
    Review.objects.create(
        peluch=peluch_with_price,
        user=existing_user,
        order=delivered_order,
        rating=4,
        comment='Primera reseña',
    )

    with pytest.raises(ValidationError) as exc_info:
        ReviewService.create_review(peluch_with_price, existing_user, delivered_order, 5, 'Segunda')
    assert 'Ya tienes una reseña' in str(exc_info.value)


# ---------------------------------------------------------------------------
# create_review — success path
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_create_review_creates_review_for_delivered_order(existing_user, peluch_with_price, delivered_order):
    review = ReviewService.create_review(peluch_with_price, existing_user, delivered_order, 5, 'Perfecto')

    assert review.pk is not None
    assert review.peluch == peluch_with_price
    assert review.user == existing_user
    assert review.rating == 5


# ---------------------------------------------------------------------------
# update_peluch_rating
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_update_peluch_rating_calculates_average_of_approved_reviews(existing_user, peluch_with_price, delivered_order):
    Review.objects.create(
        peluch=peluch_with_price, user=existing_user, order=delivered_order,
        rating=4, comment='Bueno', is_approved=True,
    )
    ReviewService.update_peluch_rating(peluch_with_price)

    peluch_with_price.refresh_from_db()
    assert peluch_with_price.average_rating == 4.00
    assert peluch_with_price.review_count == 1


@pytest.mark.django_db
def test_update_peluch_rating_excludes_unapproved_reviews(existing_user, peluch_with_price, delivered_order):
    Review.objects.create(
        peluch=peluch_with_price, user=existing_user, order=delivered_order,
        rating=2, comment='Regular', is_approved=False,
    )
    ReviewService.update_peluch_rating(peluch_with_price)

    peluch_with_price.refresh_from_db()
    assert peluch_with_price.average_rating == 0.00
    assert peluch_with_price.review_count == 0


@pytest.mark.django_db
def test_update_peluch_rating_rounds_to_two_decimal_places(db, category, color, size):
    library = Library.objects.create(title='Rating Gallery')
    p = Peluch.objects.create(
        title='Rounding Peluch',
        slug='rounding-peluch',
        category=category,
        lead_description='Test',
        gallery=library,
    )
    from django.contrib.auth import get_user_model
    User = get_user_model()
    for i, rating in enumerate([3, 4, 5], start=1):
        user = User.objects.create_user(email=f'rater{i}@example.com', password='pass1234')
        order = Order.objects.create(
            customer=user,
            customer_email=user.email,
            customer_name=f'User {i}',
            address='Calle 1',
            city='Bogotá',
            department='Cundinamarca',
            total_amount=10000,
            deposit_amount=5000,
            balance_amount=5000,
            status=Order.Status.DELIVERED,
        )
        Review.objects.create(peluch=p, user=user, order=order, rating=rating, comment='ok', is_approved=True)

    ReviewService.update_peluch_rating(p)
    p.refresh_from_db()

    assert float(p.average_rating) == round((3 + 4 + 5) / 3, 2)
