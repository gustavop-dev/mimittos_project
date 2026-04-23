from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from base_feature_app.management.commands._fake_data import FAKE_EMAIL_DOMAIN
from base_feature_app.models import (
    Blog,
    Category,
    GlobalColor,
    GlobalSize,
    Order,
    Peluch,
    Product,
    Sale,
    User,
    WompiTransaction,
)


@pytest.fixture(autouse=True)
def temp_media_root(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path / 'media'
    settings.MEDIA_ROOT.mkdir(parents=True, exist_ok=True)


@pytest.mark.django_db
def test_create_fake_data_positional_count_populates_current_domain():
    out = StringIO()

    call_command('create_fake_data', 2, stdout=out)

    assert Category.objects.count() == 3
    assert GlobalColor.objects.count() == 6
    assert GlobalSize.objects.count() == 3
    assert User.objects.count() == 2
    assert Blog.objects.count() == 2
    assert Peluch.objects.count() == 2
    assert Order.objects.count() == 2
    assert WompiTransaction.objects.count() == 2
    assert Product.objects.count() == 0
    assert Sale.objects.count() == 0
    assert User.objects.filter(is_staff=True).count() == 0
    assert User.objects.filter(email__iendswith=f'@{FAKE_EMAIL_DOMAIN}').count() == 2

    for order in Order.objects.prefetch_related('items').all():
        assert order.items.exists()
        calculated_total = sum(item.line_total for item in order.items.all())
        assert order.total_amount == calculated_total
        if order.status == Order.Status.DELIVERED:
            assert order.balance_amount == 0
        else:
            assert order.deposit_amount + order.balance_amount == order.total_amount


@pytest.mark.django_db
def test_create_fake_data_legacy_aliases_map_to_peluches_and_orders():
    out = StringIO()

    call_command(
        'create_fake_data',
        blogs=1,
        users=1,
        products=2,
        sales=3,
        stdout=out,
    )

    output = out.getvalue()
    assert '`--products` is deprecated. Use `--peluches` instead.' in output
    assert '`--sales` is deprecated. Use `--orders` instead.' in output
    assert Blog.objects.count() == 1
    assert User.objects.count() == 1
    assert Peluch.objects.count() == 2
    assert Order.objects.count() == 3


@pytest.mark.django_db
def test_delete_fake_data_removes_only_fake_records_and_preserves_real_data():
    out = StringIO()
    admin = User.objects.create_superuser(email='admin@example.com', password='adminpass')
    Category.objects.create(name='Real', slug='real-category', description='real')

    call_command('create_fake_data', 2, stdout=out)
    call_command('delete_fake_data', confirm=True, stdout=out)

    assert User.objects.filter(email=admin.email).exists()
    assert Category.objects.filter(slug='real-category').exists()
    assert User.objects.filter(email__iendswith=f'@{FAKE_EMAIL_DOMAIN}').count() == 0
    assert Blog.objects.count() == 0
    assert Peluch.objects.count() == 0
    assert Order.objects.count() == 0
    assert GlobalColor.objects.count() == 0
    assert GlobalSize.objects.count() == 0
    assert WompiTransaction.objects.count() == 0


def test_delete_fake_data_requires_confirm_flag():
    with pytest.raises(CommandError) as exc_info:
        call_command('delete_fake_data')
    assert 'confirm' in str(exc_info.value).lower()
