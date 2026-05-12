from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .peluch import Peluch
from .global_size import GlobalSize


class PeluchSizePrice(models.Model):
    peluch = models.ForeignKey(Peluch, on_delete=models.CASCADE, related_name='size_prices')
    size = models.ForeignKey(GlobalSize, on_delete=models.PROTECT, related_name='peluch_prices')
    price = models.PositiveIntegerField()
    is_available = models.BooleanField(default=True)
    deposit_percentage = models.PositiveSmallIntegerField(
        default=50,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text='% del precio que se cobra como anticipo (modalidad contraentrega) para esta talla.',
    )
    full_payment_discount_pct = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(100)],
        help_text='% de descuento si el cliente paga el total por adelantado, para esta talla.',
    )
    free_shipping = models.BooleanField(
        default=False,
        help_text='Si está activo, esta talla no aporta costo de envío.',
    )
    shipping_cost = models.PositiveIntegerField(
        default=0,
        help_text='Costo de envío en COP para esta talla. Se ignora si free_shipping=True.',
    )

    class Meta:
        unique_together = ('peluch', 'size')
        ordering = ['size__sort_order']

    def __str__(self):
        return f'{self.peluch.title} — {self.size.label}: ${self.price:,}'
