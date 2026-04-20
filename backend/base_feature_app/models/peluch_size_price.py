from django.db import models

from .peluch import Peluch
from .global_size import GlobalSize


class PeluchSizePrice(models.Model):
    peluch = models.ForeignKey(Peluch, on_delete=models.CASCADE, related_name='size_prices')
    size = models.ForeignKey(GlobalSize, on_delete=models.PROTECT, related_name='peluch_prices')
    price = models.PositiveIntegerField()
    is_available = models.BooleanField(default=True)

    class Meta:
        unique_together = ('peluch', 'size')
        ordering = ['size__sort_order']

    def __str__(self):
        return f'{self.peluch.title} — {self.size.label}: ${self.price:,}'
