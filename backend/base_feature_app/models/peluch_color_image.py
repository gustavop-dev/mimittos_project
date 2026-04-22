from django.db import models
from django_attachments.models import Attachment

from .peluch import Peluch
from .global_color import GlobalColor


class PeluchColorImage(models.Model):
    peluch        = models.ForeignKey(Peluch, on_delete=models.CASCADE, related_name='color_images')
    color         = models.ForeignKey(GlobalColor, on_delete=models.CASCADE, related_name='color_images')
    attachment    = models.ForeignKey(Attachment, on_delete=models.CASCADE)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['color__sort_order', 'display_order']

    def __str__(self):
        return f'{self.peluch.title} — {self.color.name} #{self.display_order}'
