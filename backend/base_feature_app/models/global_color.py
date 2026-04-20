from django.db import models


class GlobalColor(models.Model):
    name = models.CharField(max_length=60)
    slug = models.SlugField(unique=True)
    hex_code = models.CharField(max_length=7)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f'{self.name} ({self.hex_code})'
