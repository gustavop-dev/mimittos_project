import uuid
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from base_feature_app.models import (
    Order, OrderItem, OrderStatusHistory, WompiTransaction,
    PeluchSizePrice, PersonalizationMedia,
)


class OrderService:

    @staticmethod
    def generate_order_number() -> str:
        date_str = timezone.now().strftime('%Y%m%d')
        suffix = uuid.uuid4().hex[:4].upper()
        return f'PELUCH-{date_str}-{suffix}'

    @staticmethod
    def calculate_deposit(total: int) -> int:
        percentage = int(getattr(settings, 'DEPOSIT_PERCENTAGE', 50))
        raw = total * percentage / 100
        return int(round(raw / 100) * 100)

    @staticmethod
    @transaction.atomic
    def create_order(validated_data: dict, user=None) -> Order:
        items_data = validated_data.pop('items')

        total_amount = 0
        for item in items_data:
            size_price = PeluchSizePrice.objects.get(
                peluch=item['peluch'],
                size=item['size'],
                is_available=True,
            )
            personalization_cost = sum([
                item['peluch'].huella_extra_cost if item.get('has_huella') else 0,
                item['peluch'].corazon_extra_cost if item.get('has_corazon') else 0,
                item['peluch'].audio_extra_cost if item.get('has_audio') else 0,
            ])
            discount = getattr(item['peluch'], 'discount_pct', 0)
            item['unit_price'] = round(size_price.price * (100 - discount) / 100)
            item['personalization_cost'] = personalization_cost
            total_amount += (item['unit_price'] + personalization_cost) * item['quantity']

        deposit_amount = OrderService.calculate_deposit(total_amount)
        balance_amount = total_amount - deposit_amount

        order = Order.objects.create(
            customer=user,
            total_amount=total_amount,
            deposit_amount=deposit_amount,
            balance_amount=balance_amount,
            **validated_data,
        )

        for item in items_data:
            peluch = item['peluch']
            OrderItem.objects.create(
                order=order,
                peluch=peluch,
                size=item['size'],
                color=item['color'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
                personalization_cost=item['personalization_cost'],
                has_huella=item.get('has_huella', False),
                huella_type=item.get('huella_type', ''),
                huella_text=item.get('huella_text', ''),
                huella_media=item.get('huella_media'),
                has_corazon=item.get('has_corazon', False),
                corazon_phrase=item.get('corazon_phrase', ''),
                has_audio=item.get('has_audio', False),
                audio_media=item.get('audio_media'),
                configuration_snapshot={
                    'peluch_title': peluch.title,
                    'size_label': item['size'].label,
                    'size_cm': item['size'].cm,
                    'color_name': item['color'].name,
                    'color_hex': item['color'].hex_code,
                    'discount_pct': peluch.discount_pct,
                    'original_unit_price': size_price.price,
                    'has_huella': item.get('has_huella', False),
                    'huella_type': item.get('huella_type', ''),
                    'huella_text': item.get('huella_text', ''),
                    'has_corazon': item.get('has_corazon', False),
                    'corazon_phrase': item.get('corazon_phrase', ''),
                    'has_audio': item.get('has_audio', False),
                },
            )

        reference = f'{order.order_number}-{uuid.uuid4().hex[:8].upper()}'
        WompiTransaction.objects.create(
            order=order,
            reference=reference,
            amount_in_cents=deposit_amount * 100,
        )

        OrderService.mark_media_as_used(order)

        return order

    @staticmethod
    def update_status(order: Order, new_status: str, changed_by=None, notes: str = '') -> Order:
        from base_feature_app.services.notification_service import NotificationService

        previous_status = order.status
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])

        OrderStatusHistory.objects.create(
            order=order,
            previous_status=previous_status,
            new_status=new_status,
            changed_by=changed_by,
            notes=notes,
        )

        NotificationService.notify_status_change(order, new_status)

        return order

    @staticmethod
    def mark_media_as_used(order: Order) -> None:
        media_ids = []
        for item in order.items.all():
            if item.huella_media_id:
                media_ids.append(item.huella_media_id)
            if item.audio_media_id:
                media_ids.append(item.audio_media_id)
        if media_ids:
            PersonalizationMedia.objects.filter(id__in=media_ids).update(is_used=True)
