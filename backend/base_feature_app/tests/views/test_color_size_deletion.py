import pytest
from django_attachments.models import Attachment

from base_feature_app.models import OrderItem, PeluchColorImage, PeluchSizePrice
from base_feature_app.tests.factories import (
    GlobalColorFactory,
    GlobalSizeFactory,
    OrderItemFactory,
    PeluchColorImageFactory,
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


@pytest.mark.django_db
def test_deleting_color_removes_its_color_image_attachments(admin_client):
    color_image = PeluchColorImageFactory()
    color = color_image.color
    attachment_id = color_image.attachment_id

    response = admin_client.delete(f'/api/colors/{color.id}/')

    assert response.status_code == 204
    assert not PeluchColorImage.objects.filter(pk=color_image.pk).exists()
    assert not Attachment.objects.filter(pk=attachment_id).exists()


@pytest.mark.django_db
def test_color_usage_returns_counts(admin_client):
    color = GlobalColorFactory()
    PeluchFactory(colors=[color])
    PeluchColorImageFactory(color=color, peluch=PeluchFactory(colors=[color]))
    OrderItemFactory(color=color)

    response = admin_client.get(f'/api/colors/{color.id}/usage/')

    assert response.status_code == 200
    assert response.data['products'] == 2
    assert response.data['photos'] == 1
    assert response.data['orders'] == 1


@pytest.mark.django_db
def test_color_usage_returns_403_for_anonymous(api_client):
    color = GlobalColorFactory()
    response = api_client.get(f'/api/colors/{color.id}/usage/')
    assert response.status_code == 403


@pytest.mark.django_db
def test_color_usage_returns_404_for_unknown_id(admin_client):
    response = admin_client.get('/api/colors/999999/usage/')
    assert response.status_code == 404


@pytest.mark.django_db
def test_size_usage_returns_counts(admin_client):
    size = GlobalSizeFactory()
    PeluchSizePriceFactory(size=size)
    OrderItemFactory(size=size)

    response = admin_client.get(f'/api/sizes/{size.id}/usage/')

    assert response.status_code == 200
    assert response.data['products'] == 1
    assert response.data['orders'] == 1


@pytest.mark.django_db
def test_size_usage_returns_403_for_anonymous(api_client):
    size = GlobalSizeFactory()
    response = api_client.get(f'/api/sizes/{size.id}/usage/')
    assert response.status_code == 403
