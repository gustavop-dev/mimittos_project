"""Behavioral tests for review validation and persisted peluch ratings."""

from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import connection
from django.test.utils import CaptureQueriesContext
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

MAX_PELUCH_RATING_QUERIES = 2

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def category(db):
    """Provide a category for review catalogue fixtures."""
    return Category.objects.create(name='Osos', slug='osos-review', is_active=True)


@pytest.fixture
def color(db):
    """Provide a color for review catalogue fixtures."""
    return GlobalColor.objects.create(name='Azul', slug='azul-review', hex_code='#0000FF')


@pytest.fixture
def size(db):
    """Provide a size for review catalogue fixtures."""
    return GlobalSize.objects.create(label='Mediano', slug='mediano-review', cm='30cm')


@pytest.fixture
def peluch(db, category, color):
    """Provide a peluch with an image gallery for review fixtures."""
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
    """Provide a sellable peluch for review order items."""
    PeluchSizePrice.objects.create(peluch=peluch, size=size, price=75000)
    return peluch


@pytest.fixture
def delivered_order(db, existing_user, peluch_with_price, size, color):
    """Provide an eligible delivered order for a review author."""
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
    """Falla si un usuario sin compra recibida logra crear una reseña."""
    with pytest.raises(ValidationError) as exc_info:
        ReviewService.create_review(peluch, existing_user, None, 5, 'Excelente')
    assert 'Solo puedes reseñar' in str(exc_info.value)


@pytest.mark.django_db
def test_create_review_raises_on_duplicate_review(existing_user, peluch_with_price, delivered_order):
    """Falla si un usuario logra duplicar su reseña del mismo peluch."""
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
    """Falla si una compra entregada no puede dejar su reseña."""
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
    """Falla si una reseña aprobada no actualiza promedio y conteo."""
    Review.objects.create(
        peluch=peluch_with_price, user=existing_user, order=delivered_order,
        rating=4, comment='Bueno', is_approved=True,
    )
    ReviewService.update_peluch_rating(peluch_with_price)

    peluch_with_price.refresh_from_db()
    assert peluch_with_price.average_rating == 4.00
    assert peluch_with_price.review_count == 1


@pytest.mark.django_db
def test_update_peluch_rating_resets_stale_values_without_approved_reviews(existing_user, peluch_with_price, delivered_order):
    """Falla si un producto conserva su promedio cuando ya no tiene reseñas aprobadas."""
    Peluch.objects.filter(pk=peluch_with_price.pk).update(
        average_rating=Decimal('4.50'),
        review_count=8,
    )
    Review.objects.create(
        peluch=peluch_with_price, user=existing_user, order=delivered_order,
        rating=2, comment='Regular', is_approved=False,
    )
    ReviewService.update_peluch_rating(peluch_with_price)

    peluch_with_price.refresh_from_db()
    assert peluch_with_price.average_rating == Decimal('0.00')
    assert peluch_with_price.review_count == 0


@pytest.mark.django_db
def test_update_peluch_rating_rounds_fractional_average_to_two_decimal_places(
    existing_user, peluch_with_price, delivered_order,
):
    """Falla si el promedio fraccional deja de persistirse redondeado a dos decimales."""
    User = get_user_model()
    second_user = User.objects.create(email='rounding-second@example.com')
    third_user = User.objects.create(email='rounding-third@example.com')
    Review.objects.create(
        peluch=peluch_with_price, user=existing_user, order=delivered_order,
        rating=3, comment='Tres', is_approved=True,
    )
    Review.objects.create(
        peluch=peluch_with_price, user=second_user,
        rating=4, comment='Cuatro', is_approved=True,
    )
    Review.objects.create(
        peluch=peluch_with_price, user=third_user,
        rating=4, comment='Cuatro otra vez', is_approved=True,
    )

    ReviewService.update_peluch_rating(peluch_with_price)
    peluch_with_price.refresh_from_db()

    assert peluch_with_price.average_rating == Decimal('3.67')


@pytest.mark.django_db
def test_update_peluch_rating_uses_approved_reviews_from_its_product(existing_user, peluch_with_price, delivered_order, category, color):
    """Falla si el promedio incluye reseñas no aprobadas o reseñas de otro producto."""
    User = get_user_model()
    second_user = User.objects.create(email='approved-second@example.com')
    unapproved_user = User.objects.create(email='unapproved@example.com')
    other_product_user = User.objects.create(email='other-product@example.com')
    other_peluch = Peluch.objects.create(
        title='Otro Oso Azul',
        slug='otro-oso-azul-review',
        category=category,
        lead_description='Otro producto',
        gallery=Library.objects.create(title='Other Review Peluch Gallery'),
    )
    other_peluch.available_colors.add(color)
    Review.objects.create(
        peluch=peluch_with_price, user=existing_user, order=delivered_order,
        rating=3, comment='Aprobada tres', is_approved=True,
    )
    Review.objects.create(
        peluch=peluch_with_price, user=second_user,
        rating=4, comment='Aprobada cuatro', is_approved=True,
    )
    Review.objects.create(
        peluch=peluch_with_price, user=unapproved_user,
        rating=1, comment='Pendiente', is_approved=False,
    )
    Review.objects.create(
        peluch=other_peluch, user=other_product_user,
        rating=5, comment='Otro producto', is_approved=True,
    )

    ReviewService.update_peluch_rating(peluch_with_price)
    peluch_with_price.refresh_from_db()

    assert peluch_with_price.average_rating == Decimal('3.50')
    assert peluch_with_price.review_count == 2


def _create_approved_reviews(peluch, count, offset):
    User = get_user_model()
    users = User.objects.bulk_create(
        [User(email=f'rating-budget-{offset + index}@example.com') for index in range(count)]
    )
    Review.objects.bulk_create(
        [
            Review(peluch=peluch, user=user, rating=4, comment='Presupuesto', is_approved=True)
            for user in users
        ]
    )


def _update_rating_with_query_count(peluch):
    with CaptureQueriesContext(connection) as captured:
        ReviewService.update_peluch_rating(peluch)
    return len(captured)


@pytest.mark.django_db
def test_update_peluch_rating_query_budget_stays_constant_for_fifty_reviews(peluch_with_price):
    """Falla si actualizar el rating vuelve a separar el agregado o a consultar por reseña."""
    _create_approved_reviews(peluch_with_price, count=1, offset=0)

    single_query_count = _update_rating_with_query_count(peluch_with_price)
    peluch_with_price.refresh_from_db()

    _create_approved_reviews(peluch_with_price, count=49, offset=1)
    fifty_query_count = _update_rating_with_query_count(peluch_with_price)
    peluch_with_price.refresh_from_db()

    assert peluch_with_price.average_rating == Decimal('4.00')
    assert peluch_with_price.review_count == 50
    assert single_query_count == fifty_query_count
    assert fifty_query_count <= MAX_PELUCH_RATING_QUERIES
