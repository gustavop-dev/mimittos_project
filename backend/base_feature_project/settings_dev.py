"""
Development settings for base_feature_project.

This is the default DJANGO_SETTINGS_MODULE used by manage.py. It inherits the
base configuration from settings.py — including the database, which is driven by
the .env file (MySQL: mimittos_project_db) — and only layers development-friendly
overrides on top (DEBUG=True, permissive ALLOWED_HOSTS, console email fallback).

To force a local SQLite database instead (e.g. an isolated scratch DB), set
DJANGO_DB_ENGINE=django.db.backends.sqlite3 in your .env.
"""

from .settings import *  # noqa: F401,F403

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

EMAIL_BACKEND = (
    'django.core.mail.backends.smtp.EmailBackend'
    if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD
    else 'django.core.mail.backends.console.EmailBackend'
)
