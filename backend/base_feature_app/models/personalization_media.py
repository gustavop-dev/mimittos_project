from django.db import models
from django.conf import settings


class PersonalizationMedia(models.Model):
    class MediaType(models.TextChoices):
        HUELLA_IMAGE = 'huella_image', 'Imagen de huella'
        AUDIO = 'audio', 'Audio personalizado'

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='personalization_media',
    )
    media_type = models.CharField(max_length=20, choices=MediaType.choices)
    file = models.FileField(upload_to='personalizations/%Y/%m/')
    file_size_kb = models.PositiveIntegerField()
    duration_sec = models.FloatField(null=True, blank=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_media_type_display()} — {self.file_size_kb}KB'
