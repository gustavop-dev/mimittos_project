"""Behavioral tests for analytics service results and query budgets."""

from datetime import date, datetime

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
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

MAX_KPI_QUERIES = 1

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def category(db):
    """Provide a category for analytics catalogue fixtures."""
    return Category.objects.create(name='Analytics Cat', slug='analytics-cat', is_active=True)


@pytest.fixture
def color(db):
    """Provide a color for analytics catalogue fixtures."""
    return GlobalColor.objects.create(name='Blanco', slug='blanco-analytics', hex_code='#FFFFFF')


@pytest.fixture
def size(db):
    """Provide a size for analytics catalogue fixtures."""
    return GlobalSize.objects.create(label='Analítico', slug='analitico', cm='25cm')


@pytest.fixture
def peluch(db, category, color):
    """Provide a peluch with an image gallery for analytics fixtures."""
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
    """Provide a sellable peluch for analytics order items."""
    PeluchSizePrice.objects.create(peluch=peluch, size=size, price=60000)
    return peluch


def _make_order(status=Order.Status.PENDING_PAYMENT, deposit=0, user=None, **kwargs):
    defaults = {
        'customer': user,
        'customer_email': 'analytics@example.com',
        'customer_name': 'Test Client',
        'address': 'Calle A',
        'city': 'Cali',
        'department': 'Valle',
        'total_amount': 60000,
        'deposit_amount': deposit,
        'balance_amount': 60000 - deposit,
        'status': status,
    }
    defaults.update(kwargs)
    return Order.objects.create(**defaults)


def _make_pending_orders(count):
    return Order.objects.bulk_create(
        [
            Order(
                customer_email=f'kpi-{index}@example.com',
                customer_name=f'KPI Client {index}',
                address='Calle A',
                city='Cali',
                department='Valle',
                total_amount=60000,
                deposit_amount=0,
                balance_amount=60000,
            )
            for index in range(count)
        ]
    )


def _get_kpis_with_query_count(for_date):
    with CaptureQueriesContext(connection) as captured:
        result = AnalyticsService.get_kpis(for_date=for_date)
    return result, len(captured)


# ---------------------------------------------------------------------------
# get_kpis
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_get_kpis_returns_zero_for_empty_db():
    """Falla si un catálogo vacío devuelve valores no nulos o no cero."""
    today = date(2026, 4, 22)
    result = AnalyticsService.get_kpis(for_date=today)
    assert result['new_orders'] == 0
    assert result['confirmed_deposits'] == 0
    assert result['in_production'] == 0
    assert result['pending_dispatch'] == 0


@pytest.mark.django_db
@freeze_time('2026-04-22 12:00:00')
def test_get_kpis_counts_new_orders_for_given_date():
    """Falla si los pedidos creados en la fecha dejan de contarse."""
    _make_order()
    result = AnalyticsService.get_kpis(for_date=date(2026, 4, 22))
    assert result['new_orders'] == 1


@pytest.mark.django_db
@freeze_time('2026-04-22 12:00:00')
@pytest.mark.parametrize(
    'eligible_status',
    [
        Order.Status.PAYMENT_CONFIRMED,
        Order.Status.IN_PRODUCTION,
        Order.Status.SHIPPED,
        Order.Status.DELIVERED,
    ],
)
def test_get_kpis_sums_deposits_for_each_eligible_status(eligible_status):
    """Falla si un estado elegible deja de aportar su anticipo al KPI diario."""
    _make_order(status=eligible_status, deposit=30000)
    result = AnalyticsService.get_kpis(for_date=date(2026, 4, 22))
    assert result['confirmed_deposits'] == 30000


@pytest.mark.django_db
@freeze_time('2026-04-22 12:00:00')
def test_get_kpis_counts_in_production_orders():
    """Falla si los pedidos en producción dejan de contarse globalmente."""
    _make_order(status=Order.Status.IN_PRODUCTION, deposit=20000)
    result = AnalyticsService.get_kpis(for_date=date(2026, 4, 22))
    assert result['in_production'] == 1


@pytest.mark.django_db
@freeze_time('2026-04-22 12:00:00')
def test_get_kpis_counts_pending_dispatch():
    """Falla si los pagos confirmados dejan de contarse para despacho."""
    _make_order(status=Order.Status.PAYMENT_CONFIRMED, deposit=15000)
    result = AnalyticsService.get_kpis(for_date=date(2026, 4, 22))
    assert result['pending_dispatch'] == 1


@pytest.mark.django_db
@freeze_time('2026-04-22 10:00:00')
def test_get_kpis_defaults_to_today_when_no_date_given():
    """Falla si el KPI sin fecha no usa el día actual del negocio."""
    _make_order()
    result = AnalyticsService.get_kpis()
    assert result['new_orders'] == 1


@pytest.mark.django_db
def test_get_kpis_keeps_each_metric_filter_independent():
    """Falla si los KPIs mezclan la fecha o los estados de métricas distintas."""
    requested_date = date(2026, 4, 22)
    current_timezone = timezone.get_current_timezone()
    previous_day = datetime(2026, 4, 21, 12, 0, tzinfo=current_timezone)
    requested_day = datetime(2026, 4, 22, 12, 0, tzinfo=current_timezone)
    following_day = datetime(2026, 4, 23, 12, 0, tzinfo=current_timezone)

    new_order = _make_order(status=Order.Status.PENDING_PAYMENT, deposit=10)
    confirmed_order = _make_order(status=Order.Status.PAYMENT_CONFIRMED, deposit=110)
    production_order = _make_order(status=Order.Status.IN_PRODUCTION, deposit=120)
    shipped_order = _make_order(status=Order.Status.SHIPPED, deposit=130)
    pending_order = _make_order(status=Order.Status.PENDING_PAYMENT, deposit=140)
    delivered_order = _make_order(status=Order.Status.DELIVERED, deposit=150)

    Order.objects.filter(pk=new_order.pk).update(created_at=requested_day, updated_at=previous_day)
    Order.objects.filter(pk=confirmed_order.pk).update(created_at=previous_day, updated_at=requested_day)
    Order.objects.filter(pk=production_order.pk).update(created_at=previous_day, updated_at=requested_day)
    Order.objects.filter(pk=shipped_order.pk).update(created_at=following_day, updated_at=requested_day)
    Order.objects.filter(pk=pending_order.pk).update(created_at=previous_day, updated_at=requested_day)
    Order.objects.filter(pk=delivered_order.pk).update(created_at=previous_day, updated_at=following_day)

    result = AnalyticsService.get_kpis(for_date=requested_date)

    assert result == {
        'new_orders': 1,
        'confirmed_deposits': 360,
        'in_production': 1,
        'pending_dispatch': 1,
    }


@pytest.mark.django_db
@freeze_time('2026-04-22 12:00:00')
def test_get_kpis_query_budget_stays_constant_for_fifty_orders():
    """Falla si calcular KPIs vuelve a emitir consultas por métrica o por pedido."""
    requested_date = date(2026, 4, 22)
    _make_order()

    single_result, single_query_count = _get_kpis_with_query_count(requested_date)

    _make_pending_orders(49)
    fifty_result, fifty_query_count = _get_kpis_with_query_count(requested_date)

    assert single_result['new_orders'] == 1
    assert fifty_result['new_orders'] == 50
    assert single_query_count == fifty_query_count
    assert fifty_query_count <= MAX_KPI_QUERIES


@pytest.mark.django_db
@pytest.mark.parametrize(
    ('status', 'metric'),
    [
        (Order.Status.IN_PRODUCTION, 'in_production'),
        (Order.Status.PAYMENT_CONFIRMED, 'pending_dispatch'),
    ],
)
def test_get_kpis_counts_global_statuses_outside_requested_date(status, metric):
    """Falla si las métricas globales pasan a filtrarse por la fecha solicitada."""
    requested_date = date(2026, 4, 22)
    outside_requested_date = datetime(
        2026,
        4,
        21,
        12,
        0,
        tzinfo=timezone.get_current_timezone(),
    )
    order = _make_order(status=status)
    Order.objects.filter(pk=order.pk).update(
        created_at=outside_requested_date,
        updated_at=outside_requested_date,
    )

    result = AnalyticsService.get_kpis(for_date=requested_date)

    assert result[metric] == 1


# ---------------------------------------------------------------------------
# get_dashboard_data
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_get_dashboard_data_returns_expected_keys():
    """Falla si el dashboard deja de exponer una sección pública esperada."""
    result = AnalyticsService.get_dashboard_data(date(2026, 4, 1), date(2026, 4, 22))
    assert set(result.keys()) == {
        'daily_orders', 'new_vs_returning', 'device_types',
        'traffic_sources', 'top_peluches', 'confirmed_revenue',
        'total_orders', 'orders_by_status',
    }


@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_get_dashboard_data_total_orders_within_range():
    """Falla si el total de pedidos omite pedidos dentro del rango."""
    _make_order()
    _make_order()
    result = AnalyticsService.get_dashboard_data(date(2026, 4, 1), date(2026, 4, 30))
    assert result['total_orders'] == 2


@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_get_dashboard_data_device_types_count():
    """Falla si el dashboard deja de agrupar visitas por dispositivo."""
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
    """Falla si un peluch vendido deja de aparecer entre los más vendidos."""
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
    """Falla si un pedido invitado deja de contarse como cliente nuevo."""
    _make_order()  # no customer → guest
    result = AnalyticsService.get_dashboard_data(date(2026, 4, 1), date(2026, 4, 30))
    assert result['new_vs_returning']['new'] >= 1


# ---------------------------------------------------------------------------
# export_orders_csv
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_export_orders_csv_returns_bytes_with_utf8_bom():
    """Falla si la exportación deja de ser bytes UTF-8 con BOM."""
    result = AnalyticsService.export_orders_csv(date(2026, 4, 1), date(2026, 4, 30))
    assert isinstance(result, bytes)
    assert result[:3] == b'\xef\xbb\xbf'  # UTF-8 BOM


@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_export_orders_csv_includes_header_row():
    """Falla si la exportación deja de incluir su encabezado de columnas."""
    result = AnalyticsService.export_orders_csv(date(2026, 4, 1), date(2026, 4, 30))
    text = result.decode('utf-8-sig')
    assert 'Número pedido' in text


@pytest.mark.django_db
@freeze_time('2026-04-15 09:00:00')
def test_export_orders_csv_includes_order_data(peluch_with_price, size, color):
    """Falla si la exportación omite datos del pedido o de su peluch."""
    order = _make_order()
    OrderItem.objects.create(
        order=order, peluch=peluch_with_price, size=size, color=color,
        quantity=1, unit_price=60000,
    )
    result = AnalyticsService.export_orders_csv(date(2026, 4, 1), date(2026, 4, 30))
    text = result.decode('utf-8-sig')
    assert order.order_number in text
    assert peluch_with_price.title in text
