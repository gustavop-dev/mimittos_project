from django.db import models
from django.conf import settings


class SiteContent(models.Model):
    class Key(models.TextChoices):
        FAQ = 'faq', 'Preguntas frecuentes'
        HISTORY = 'history', 'Historia de Peluchelandia'
        TERMS = 'terms', 'Términos y condiciones'
        WELCOME_TEXT = 'welcome_text', 'Texto de bienvenida'
        CONTACT_INFO = 'contact_info', 'Información de contacto'

    key = models.CharField(max_length=30, choices=Key.choices, unique=True)
    content_json = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='site_content_updates',
    )

    class Meta:
        verbose_name_plural = 'site content'

    def __str__(self):
        return self.get_key_display()
