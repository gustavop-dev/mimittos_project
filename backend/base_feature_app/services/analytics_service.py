import csv
import io
from datetime import date

from django.db.models import Case, Count, DecimalField, Sum, When
from django.db.models.functions import TruncDate
from django.utils import timezone

from base_feature_app.models import Order, PageView, Peluch


class AnalyticsService:

    @staticmethod
    def get_kpis(for_date: date = None) -> dict:
        if for_date is None:
            for_date = timezone.now().date()

        day_orders = Order.objects.filter(created_at__date=for_date)

        return {
            'new_orders': day_orders.count(),
            'confirmed_deposits': Order.objects.filter(
                status__in=[
                    Order.Status.PAYMENT_CONFIRMED,
                    Order.Status.IN_PRODUCTION,
                    Order.Status.SHIPPED,
                    Order.Status.DELIVERED,
                ],
                updated_at__date=for_date,
            ).aggregate(total=Sum('deposit_amount'))['total'] or 0,
            'in_production': Order.objects.filter(status=Order.Status.IN_PRODUCTION).count(),
            'pending_dispatch': Order.objects.filter(status=Order.Status.PAYMENT_CONFIRMED).count(),
        }

    @staticmethod
    def get_dashboard_data(date_from: date, date_to: date) -> dict:
        confirmed_statuses = [
            Order.Status.PAYMENT_CONFIRMED,
            Order.Status.IN_PRODUCTION,
            Order.Status.SHIPPED,
            Order.Status.DELIVERED,
        ]

        orders_qs = Order.objects.filter(
            created_at__date__gte=date_from,
            created_at__date__lte=date_to,
        )

        # --- daily_orders: time series aggregated per day ---
        daily_data = (
            orders_qs
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(
                count=Count('id'),
                revenue=Sum(
                    Case(
                        When(status__in=confirmed_statuses, then='deposit_amount'),
                        default=0,
                        output_field=DecimalField(),
                    )
                ),
            )
            .order_by('day')
        )
        daily_orders = [
            {
                'date': d['day'].strftime('%d/%m'),
                'orders': d['count'],
                'revenue': float(d['revenue'] or 0),
            }
            for d in daily_data
        ]

        # --- new_vs_returning ---
        period_user_ids = set(
            orders_qs
            .exclude(customer__isnull=True)
            .values_list('customer_id', flat=True)
            .distinct()
        )
        returning_user_ids = set(
            Order.objects.filter(
                customer_id__in=period_user_ids,
                created_at__date__lt=date_from,
            )
            .values_list('customer_id', flat=True)
            .distinct()
        )
        returning_count = len(returning_user_ids)
        new_registered_count = len(period_user_ids - returning_user_ids)
        guest_count = orders_qs.filter(customer__isnull=True).count()
        new_vs_returning = {
            'new': new_registered_count + guest_count,
            'returning': returning_count,
        }

        # --- device_types (mapped from raw device_type values) ---
        devices = dict(
            PageView.objects.filter(
                created_at__date__gte=date_from,
                created_at__date__lte=date_to,
            )
            .values('device_type')
            .annotate(count=Count('id'))
            .values_list('device_type', 'count')
        )
        device_types = {
            'mobile': devices.get('mobile', 0),
            'desktop': devices.get('desktop', 0),
            'tablet': devices.get('tablet', 0),
        }

        # --- traffic_sources ---
        traffic_sources = dict(
            PageView.objects.filter(
                created_at__date__gte=date_from,
                created_at__date__lte=date_to,
            )
            .values('traffic_source')
            .annotate(count=Count('id'))
            .values_list('traffic_source', 'count')
        )

        # --- top_peluches ---
        top_peluches = list(
            Peluch.objects.filter(
                order_items__order__created_at__date__gte=date_from,
                order_items__order__created_at__date__lte=date_to,
            )
            .annotate(total_sold=Sum('order_items__quantity'))
            .order_by('-total_sold')
            .values('id', 'title', 'slug', 'total_sold')[:10]
        )

        # --- confirmed_revenue ---
        confirmed_revenue = (
            orders_qs
            .filter(status__in=confirmed_statuses)
            .aggregate(total=Sum('deposit_amount'))['total'] or 0
        )

        # --- orders_by_status ---
        orders_by_status = dict(
            orders_qs.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )

        return {
            'daily_orders': daily_orders,
            'new_vs_returning': new_vs_returning,
            'device_types': device_types,
            'traffic_sources': traffic_sources,
            'top_peluches': top_peluches,
            'confirmed_revenue': confirmed_revenue,
            'total_orders': orders_qs.count(),
            'orders_by_status': orders_by_status,
        }

    @staticmethod
    def export_orders_csv(date_from: date, date_to: date) -> bytes:
        orders = Order.objects.filter(
            created_at__date__gte=date_from,
            created_at__date__lte=date_to,
        ).prefetch_related('items__peluch', 'items__size', 'items__color')

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            'Número pedido', 'Fecha', 'Cliente', 'Email', 'Ciudad', 'Departamento',
            'Estado', 'Total', 'Abono', 'Saldo', 'Guía', 'Transportadora',
            'Peluche', 'Tamaño', 'Color', 'Cantidad', 'Precio unitario',
        ])

        for order in orders:
            for item in order.items.all():
                writer.writerow([
                    order.order_number,
                    order.created_at.strftime('%Y-%m-%d %H:%M'),
                    order.customer_name,
                    order.customer_email,
                    order.city,
                    order.department,
                    order.get_status_display(),
                    order.total_amount,
                    order.deposit_amount,
                    order.balance_amount,
                    order.tracking_number,
                    order.shipping_carrier,
                    item.peluch.title,
                    item.size.label,
                    item.color.name,
                    item.quantity,
                    item.unit_price,
                ])

        return output.getvalue().encode('utf-8-sig')
