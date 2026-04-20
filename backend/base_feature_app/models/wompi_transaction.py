from django.db import models

from .order import Order


class WompiTransaction(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        APPROVED = 'approved', 'Aprobado'
        DECLINED = 'declined', 'Rechazado'
        VOIDED = 'voided', 'Anulado'
        ERROR = 'error', 'Error'

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    wompi_id = models.CharField(max_length=200, blank=True)
    reference = models.CharField(max_length=200, unique=True)
    amount_in_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=10, default='COP')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    payment_method_type = models.CharField(max_length=50, blank=True)
    checkout_url = models.URLField(blank=True)
    raw_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reference} — {self.get_status_display()}'
