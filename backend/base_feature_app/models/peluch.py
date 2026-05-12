from django.core.validators import MaxValueValidator
from django.db import models
from django_attachments.fields import GalleryField
from django_attachments.models import Library

from .category import Category
from .global_color import GlobalColor


class Peluch(models.Model):
    class BadgeType(models.TextChoices):
        NONE = 'none', 'Sin badge'
        BESTSELLER = 'bestseller', 'Más vendido'
        NEW = 'new', 'Nuevo'
        LIMITED = 'limited_edition', 'Edición limitada'

    title = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='peluches')
    lead_description = models.CharField(max_length=280)
    description = models.JSONField(default=list, blank=True)
    specifications = models.JSONField(default=dict)
    care_instructions = models.JSONField(default=list)
    available_colors = models.ManyToManyField(GlobalColor, blank=True, related_name='peluches')
    badge = models.CharField(max_length=20, choices=BadgeType.choices, default=BadgeType.NONE)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    discount_pct = models.PositiveSmallIntegerField(default=0, validators=[MaxValueValidator(100)])
    display_order = models.PositiveSmallIntegerField(default=100)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    review_count = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    gallery = GalleryField(related_name='peluches_with_gallery', on_delete=models.CASCADE)

    has_huella = models.BooleanField(default=False)
    has_corazon = models.BooleanField(default=False)
    has_audio = models.BooleanField(default=False)
    huella_extra_cost = models.PositiveIntegerField(default=0)
    corazon_extra_cost = models.PositiveIntegerField(default=0)
    audio_extra_cost = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-is_featured', '-created_at']

    def __str__(self):
        return self.title

    def delete(self, *args, **kwargs):
        try:
            if self.gallery:
                self.gallery.delete()
        except Library.DoesNotExist:
            pass
        super().delete(*args, **kwargs)
