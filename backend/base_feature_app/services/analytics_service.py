import csv
import io
from datetime import date

from django.db.models import Count, Sum
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
            ).count(),
            'in_production': Order.objects.filter(status=Order.Status.IN_PRODUCTION).count(),
            'pending_dispatch': Order.objects.filter(status=Order.Status.PAYMENT_CONFIRMED).count(),
        }

    @staticmethod
    def get_dashboard_data(date_from: date, date_to: date) -> dict:
        orders_qs = Order.objects.filter(
            created_at__date__gte=date_from,
            created_at__date__lte=date_to,
        )

        orders_by_status = dict(
            orders_qs.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )

        top_peluches = (
            Peluch.objects.filter(
                order_items__order__created_at__date__gte=date_from,
                order_items__order__created_at__date__lte=date_to,
            )
            .annotate(total_sold=Sum('order_items__quantity'))
            .order_by('-total_sold')
            .values('id', 'title', 'slug', 'total_sold')[:10]
        )

        traffic_sources = dict(
            PageView.objects.filter(
                created_at__date__gte=date_from,
                created_at__date__lte=date_to,
            )
            .values('traffic_source')
            .annotate(count=Count('id'))
            .values_list('traffic_source', 'count')
        )

        devices = dict(
            PageView.objects.filter(
                created_at__date__gte=date_from,
                created_at__date__lte=date_to,
            )
            .values('device_type')
            .annotate(count=Count('id'))
            .values_list('device_type', 'count')
        )

        revenue = orders_qs.filter(
            status__in=[
                Order.Status.PAYMENT_CONFIRMED,
                Order.Status.IN_PRODUCTION,
                Order.Status.SHIPPED,
                Order.Status.DELIVERED,
            ]
        ).aggregate(total=Sum('deposit_amount'))['total'] or 0

        return {
            'orders_by_status': orders_by_status,
            'top_peluches': list(top_peluches),
            'traffic_sources': traffic_sources,
            'devices': devices,
            'confirmed_revenue': revenue,
            'total_orders': orders_qs.count(),
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
