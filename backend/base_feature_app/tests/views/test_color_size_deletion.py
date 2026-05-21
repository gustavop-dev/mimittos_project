import pytest

from base_feature_app.models import OrderItem, PeluchSizePrice
from base_feature_app.tests.factories import (
    GlobalColorFactory,
    GlobalSizeFactory,
    OrderItemFactory,
    PeluchFactory,
    PeluchSizePriceFactory,
)


@pytest.mark.django_db
def test_deleting_size_removes_its_size_prices(admin_client):
    size_price = PeluchSizePriceFactory()
    size = size_price.size

    response = admin_client.delete(f'/api/sizes/{size.id}/')

    assert response.status_code == 204
    assert not PeluchSizePrice.objects.filter(pk=size_price.pk).exists()


@pytest.mark.django_db
def test_deleting_size_nullifies_order_item_size(admin_client):
    order_item = OrderItemFactory()
    size = order_item.size

    response = admin_client.delete(f'/api/sizes/{size.id}/')

    assert response.status_code == 204
    order_item.refresh_from_db()
    assert order_item.size_id is None
    assert OrderItem.objects.filter(pk=order_item.pk).exists()


@pytest.mark.django_db
def test_deleting_color_nullifies_order_item_color(admin_client):
    order_item = OrderItemFactory()
    color = order_item.color

    response = admin_client.delete(f'/api/colors/{color.id}/')

    assert response.status_code == 204
    order_item.refresh_from_db()
    assert order_item.color_id is None
    assert OrderItem.objects.filter(pk=order_item.pk).exists()


@pytest.mark.django_db
def test_deleting_color_removes_it_from_products(admin_client):
    color = GlobalColorFactory()
    peluch = PeluchFactory(colors=[color])

    response = admin_client.delete(f'/api/colors/{color.id}/')

    assert response.status_code == 204
    assert not peluch.available_colors.filter(pk=color.pk).exists()
