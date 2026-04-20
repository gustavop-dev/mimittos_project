from django.db import models
from django.conf import settings

from .peluch import Peluch


class PageView(models.Model):
    class DeviceType(models.TextChoices):
        MOBILE = 'mobile', 'Móvil'
        TABLET = 'tablet', 'Tablet'
        DESKTOP = 'desktop', 'Escritorio'

    class TrafficSource(models.TextChoices):
        INSTAGRAM = 'instagram', 'Instagram'
        GOOGLE = 'google', 'Google'
        WHATSAPP = 'whatsapp', 'WhatsApp'
        DIRECT = 'direct', 'Directo'
        OTHER = 'other', 'Otro'

    url_path = models.CharField(max_length=255)
    peluch = models.ForeignKey(
        Peluch, null=True, blank=True, on_delete=models.SET_NULL, related_name='page_views'
    )
    session_id = models.CharField(max_length=64)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='page_views',
    )
    is_new_visitor = models.BooleanField(default=True)
    device_type = models.CharField(max_length=10, choices=DeviceType.choices, default=DeviceType.MOBILE)
    city = models.CharField(max_length=100, blank=True)
    traffic_source = models.CharField(
        max_length=15, choices=TrafficSource.choices, default=TrafficSource.DIRECT
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.url_path} — {self.device_type} ({self.created_at:%Y-%m-%d})'
