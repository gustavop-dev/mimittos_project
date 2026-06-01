import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class BaseFeatureAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'base_feature_app'

    def ready(self):
        # huey 3.0 only autodiscovers tasks.py inside INSTALLED_APPS.
        # tasks.py lives at the config-package level (base_feature_project),
        # so force-load it here for the consumer to register periodic tasks.
        from base_feature_project import tasks  # noqa: F401

        # Wompi config validation: warns (without aborting startup) if there are
        # empty keys or a frontend/backend environment mismatch — the silent
        # failure that broke payments in production.
        from base_feature_app.services.wompi_service import WompiService
        for issue in WompiService.validate_config():
            logger.warning('Config Wompi: %s', issue)
