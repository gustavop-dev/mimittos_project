from datetime import date

import pytest
from django_attachments.models import Library
from freezegun import freeze_time

from base_feature_app.models import (
    Category,
    GlobalColor,
    GlobalSize,
    Order,
    OrderItem,
    PageView,
    Peluch,
    PeluchSizePrice,
)
from base_feature_app.services.analytics_service import AnalyticsService

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def category(db):
    return Category.objects.create(name='Analytics Cat', slug='analytics-cat', is_active=True)


@pytest.fixture
def color(db):
    return GlobalColor.objects.create(name='Blanco', slug='blanco-analytics', hex_code='#FFFFFF')


@pytest.fixture
def size(db):
    return GlobalSize.objects.create(label='Analítico', slug='analitico', cm='25cm')


@pytest.fixture
def peluch(db, category, color):
    library = Library.objects.create(title='Analytics Gallery')
    p = Peluch.objects.create(
        title='Peluche Analytics',
        slug='peluche-analytics',
        category=category,
        lead_description='Test',
        gallery=library,
    )
    p.available_colors.add(color)
    return p


@pytest.fixture
def peluch_with_price(peluch, size):
    PeluchSizePrice.objects.create(peluch=peluch, size=size, price=60000)
    return peluch


def _make_order(status=Order.Status.PENDING_PAYMENT, deposit=0, user=None, **kwargs):
    defaults = dict(
        customer=user,
        customer_email='analytics@example.com',
        customer_name='Test Client',
        address='Calle A',
        city='Cali',
        department='Valle',
        total_amount=60000,
        deposit_amount=deposit,
        balance_amount=60000 - deposit,
        status=status,
    )
    defaults.update(kwargs)
    return Order.objects.create(**defaults)


# ---------------------------------------------------------------------------
# get_kpis
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_get_kpis_returns_zero_for_empty_db():
    today = date(2026, 4, 22)
    result = AnalyticsService.get_kpis(for_date=today)
    assert result['new_orders'] == 0
    assert result['confirmed_deposits'] == 0
    assert result['in_production'] == 0
    assert result['pending_dispatch'] == 0


@pytest.mark.django_db
@freeze_time('2026-04-22 12:00:00')
def test_get_kpis_counts_new_orders_for_given_date():
    _make_order()
    result = AnalyticsService.get_kpis(for_date=date(2026, 4, 22))
    assert result['new_orders'] == 1


@pytest.mark.django_db
@freeze_time('2026-04-22 12:00:00')
def test_get_kpis_sums_confirmed_deposits_for_given_date():
    _make_order(status=Order.Status.PAYMENT_CONFIRMED, deposit=30000)
    result = AnalyticsService.get_kpis(for_date=date(2026, 4, 22))
    assert result['confirmed_deposits'] == 30000


@pytest.mark.django_db
@freeze_time('2026-04-22 12:00:00')
def test_get_kpis_counts_in_production_orders():
    _make_order(status=Order.Status.IN_PRODUCTION, deposit=20000)
    result = AnalyticsService.get_kpis(for_date=date(2026, 4, 22))
    assert result['in_production'] == 1


@pytest.mark.django_db
@freeze_time('2026-04-22 12:00:00')
def test_get_kpis_counts_pending_dispatch():
    _make_order(status=Order.Status.PAYMENT_CONFIRMED, deposit=15000)
    result = AnalyticsService.get_kpis(for_date=date(2026, 4, 22))
    assert result['pending_dispatch'] == 1


@pytest.mark.django_db
@freeze_time('2026-04-22 10:00:00')
def test_get_kpis_defaults_to_today_when_no_date_given():
    _make_order()
    result = AnalyticsService.get_kpis()
    assert result['new_orders'] == 1


# ---------------------------------------------------------------------------
# get_dashboard_data
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_get_dashboard_data_returns_expected_keys():
    result = AnalyticsService.get_dashboard_data(date(2026, 4, 1), date(2026, 4, 22))
    assert set(result.keys()) == {
        'daily_orders', 'new_vs_returning', 'device_types',
        'traffic_sources', 'top_peluches', 'confirmed_revenue',
        'total_orders', 'orders_by_status',
    }


@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_get_dashboard_data_total_orders_within_range():
    _make_order()
    _make_order()
    result = AnalyticsService.get_dashboard_data(date(2026, 4, 1), date(2026, 4, 30))
    assert result['total_orders'] == 2


@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_get_dashboard_data_device_types_count():
    PageView.objects.create(
        url_path='/catalog/', session_id='s1', device_type=PageView.DeviceType.MOBILE,
    )
    PageView.objects.create(
        url_path='/catalog/', session_id='s2', device_type=PageView.DeviceType.DESKTOP,
    )
    result = AnalyticsService.get_dashboard_data(date(2026, 4, 1), date(2026, 4, 30))
    assert result['device_types']['mobile'] == 1
    assert result['device_types']['desktop'] == 1


@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_get_dashboard_data_top_peluches_ranking(peluch_with_price, size, color):
    order = _make_order(status=Order.Status.DELIVERED, deposit=60000)
    OrderItem.objects.create(
        order=order, peluch=peluch_with_price, size=size, color=color,
        quantity=3, unit_price=60000,
    )
    result = AnalyticsService.get_dashboard_data(date(2026, 4, 1), date(2026, 4, 30))
    assert len(result['top_peluches']) >= 1
    assert result['top_peluches'][0]['slug'] == peluch_with_price.slug


@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_get_dashboard_data_new_vs_returning_counts_guest_as_new():
    _make_order()  # no customer → guest
    result = AnalyticsService.get_dashboard_data(date(2026, 4, 1), date(2026, 4, 30))
    assert result['new_vs_returning']['new'] >= 1


# ---------------------------------------------------------------------------
# export_orders_csv
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_export_orders_csv_returns_bytes_with_utf8_bom():
    result = AnalyticsService.export_orders_csv(date(2026, 4, 1), date(2026, 4, 30))
    assert isinstance(result, bytes)
    assert result[:3] == b'\xef\xbb\xbf'  # UTF-8 BOM


@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_export_orders_csv_includes_header_row():
    result = AnalyticsService.export_orders_csv(date(2026, 4, 1), date(2026, 4, 30))
    text = result.decode('utf-8-sig')
    assert 'Número pedido' in text


@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_export_orders_csv_includes_order_data(peluch_with_price, size, color):
    order = _make_order()
    OrderItem.objects.create(
        order=order, peluch=peluch_with_price, size=size, color=color,
        quantity=1, unit_price=60000,
    )
    result = AnalyticsService.export_orders_csv(date(2026, 4, 1), date(2026, 4, 30))
    text = result.decode('utf-8-sig')
    assert order.order_number in text
    assert peluch_with_price.title in text
