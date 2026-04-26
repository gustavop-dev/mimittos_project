from django.apps import AppConfig


class BaseFeatureAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'base_feature_app'

    def ready(self):
        # huey 3.0 only autodiscovers tasks.py inside INSTALLED_APPS.
        # tasks.py lives at the config-package level (base_feature_project),
        # so force-load it here for the consumer to register periodic tasks.
        from base_feature_project import tasks  # noqa: F401
