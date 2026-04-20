from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.conf import settings

from .peluch import Peluch
from .order import Order


class Review(models.Model):
    peluch = models.ForeignKey(Peluch, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews'
    )
    order = models.ForeignKey(
        Order, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviews'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('peluch', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} → {self.peluch.title} ({self.rating}★)'
