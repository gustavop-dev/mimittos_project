import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


def _generate_order_number():
    date_str = timezone.now().strftime('%Y%m%d')
    suffix = uuid.uuid4().hex[:4].upper()
    return f'PELUCH-{date_str}-{suffix}'


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = 'pending_payment', 'Pendiente de pago'
        PAYMENT_CONFIRMED = 'payment_confirmed', 'Pago confirmado'
        IN_PRODUCTION = 'in_production', 'En producción'
        SHIPPED = 'shipped', 'Despachado'
        DELIVERED = 'delivered', 'Entregado'
        CANCELLED = 'cancelled', 'Cancelado'

    order_number = models.CharField(max_length=30, unique=True, default=_generate_order_number)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='orders',
    )
    customer_email = models.EmailField()
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=20, blank=True)

    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)

    total_amount = models.PositiveIntegerField()
    deposit_amount = models.PositiveIntegerField()
    balance_amount = models.PositiveIntegerField()

    tracking_number = models.CharField(max_length=100, blank=True)
    shipping_carrier = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    last_automated_email_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_number} — {self.customer_name}'
