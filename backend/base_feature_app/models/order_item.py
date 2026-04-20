from django.db import models

from .order import Order
from .peluch import Peluch
from .global_size import GlobalSize
from .global_color import GlobalColor
from .personalization_media import PersonalizationMedia


class OrderItem(models.Model):
    class HuellaType(models.TextChoices):
        NAME = 'name', 'Nombre'
        DATE = 'date', 'Fecha'
        LETTER = 'letter', 'Letra'
        IMAGE = 'image', 'Imagen'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    peluch = models.ForeignKey(Peluch, on_delete=models.PROTECT, related_name='order_items')
    size = models.ForeignKey(GlobalSize, on_delete=models.PROTECT, related_name='order_items')
    color = models.ForeignKey(GlobalColor, on_delete=models.PROTECT, related_name='order_items')
    quantity = models.PositiveSmallIntegerField()
    unit_price = models.PositiveIntegerField()

    has_huella = models.BooleanField(default=False)
    huella_type = models.CharField(
        max_length=10, choices=HuellaType.choices, blank=True
    )
    huella_text = models.CharField(max_length=60, blank=True)
    huella_media = models.ForeignKey(
        PersonalizationMedia,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='huella_items',
    )

    has_corazon = models.BooleanField(default=False)
    corazon_phrase = models.CharField(max_length=50, blank=True)

    has_audio = models.BooleanField(default=False)
    audio_media = models.ForeignKey(
        PersonalizationMedia,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='audio_items',
    )

    personalization_cost = models.PositiveIntegerField(default=0)
    configuration_snapshot = models.JSONField(default=dict)

    def __str__(self):
        return f'{self.peluch.title} × {self.quantity} ({self.order.order_number})'

    @property
    def line_total(self):
        return (self.unit_price + self.personalization_cost) * self.quantity
