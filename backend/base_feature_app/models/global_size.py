from django.db import models


class GlobalSize(models.Model):
    label = models.CharField(max_length=30)
    slug = models.SlugField(unique=True)
    cm = models.CharField(max_length=10)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order', 'label']

    def __str__(self):
        return f'{self.label} ({self.cm})'
