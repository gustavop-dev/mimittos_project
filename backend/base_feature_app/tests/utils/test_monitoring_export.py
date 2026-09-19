"""Isolated contracts for the bounded, non-secret Silk exporter."""
import json
import tempfile
from unittest import TestCase
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from django.http import HttpResponse
from django.test import override_settings
from django.urls import path

from base_feature_project import monitoring_export


urlpatterns = [path('api/orders/<int:order_id>/', lambda request: HttpResponse('ok'))]


class MonitoringExportTests(TestCase):
    def test_should_profile_respects_sample_boundary(self):
        """Falla si el porcentaje de captura deja de ser un límite estricto."""
        with override_settings(MONITORING_SILK_SAMPLE_PERCENT=5):
            with patch.object(monitoring_export.random, 'random', return_value=0.049):
                self.assertTrue(monitoring_export.should_profile(SimpleNamespace(path='/api/orders/1/')))
            with patch.object(monitoring_export.random, 'random', return_value=0.05):
                self.assertFalse(monitoring_export.should_profile(SimpleNamespace(path='/api/orders/1/')))

    def test_should_profile_rejects_ineligible_routes(self):
        """Falla si una ruta de credenciales o fuera de API entra a la muestra Silk."""
        self.assertFalse(monitoring_export.should_profile(SimpleNamespace(path='/api/token/refresh/')))
        self.assertFalse(monitoring_export.should_profile(SimpleNamespace(path='/panel/orders/1/')))

    def test_route_label_uses_registered_placeholders(self):
        """Falla si IDs o parámetros reales dejan el host en el nombre de ruta."""
        with override_settings(ROOT_URLCONF=__name__):
            self.assertEqual(monitoring_export.route_label('/api/orders/902/?token=private'), 'api/orders/<int:order_id>/')

    def test_export_report_groups_worst_metrics_per_registered_route(self):
        """Falla si una ruta conserva una duración o conteo N+1 menor que el peor."""
        slow = [
            SimpleNamespace(request=SimpleNamespace(path='/api/orders/1/?email=secret@example.com'), time_taken=125.4, sql='SELECT * FROM users'),
            SimpleNamespace(request=SimpleNamespace(path='/api/orders/2/?email=secret@example.com'), time_taken=840.2, sql='SELECT password FROM users'),
        ]
        suspects = [SimpleNamespace(path='/api/orders/3/?token=secret', query_count=12), SimpleNamespace(path='/api/orders/4/?token=secret', query_count=31)]
        now = datetime(2026, 9, 19, 12, 0, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as directory, override_settings(BASE_DIR=Path(directory), ROOT_URLCONF=__name__, MONITORING_SILK_SAMPLE_PERCENT=5, SLOW_QUERY_THRESHOLD_MS=500, N_PLUS_ONE_THRESHOLD=10):
            with patch('django.utils.timezone.now', return_value=now):
                monitoring_export.export_report(slow, suspects)
            document = json.loads(next((Path(directory) / 'logs' / 'monitoring').glob('silk-*.json')).read_text())
        slow_finding = next(item for item in document['findings'] if item['title'].startswith('Consulta lenta'))
        n1_finding = next(item for item in document['findings'] if item['title'].startswith('Posible N+1'))
        self.assertEqual(len(document['findings']), 2)
        self.assertEqual(slow_finding['evidence']['duration_ms'], 840.2)
        self.assertEqual(n1_finding['evidence']['query_count'], 31)
        self.assertEqual(slow_finding['evidence']['route'], 'api/orders/<int:order_id>/')
        self.assertEqual(len(slow_finding['fingerprint']), 64)

    def test_export_report_omits_request_secrets(self):
        """Falla si el exportador serializa SQL o datos de la petición en el JSON local."""
        slow = [SimpleNamespace(request=SimpleNamespace(path='/api/orders/1/?email=secret@example.com'), time_taken=840.2, sql='SELECT password FROM users')]
        suspects = [SimpleNamespace(path='/api/orders/4/?token=secret', query_count=31)]
        with tempfile.TemporaryDirectory() as directory, override_settings(BASE_DIR=Path(directory), ROOT_URLCONF=__name__):
            monitoring_export.export_report(slow, suspects)
            document = json.dumps(json.loads(next((Path(directory) / 'logs' / 'monitoring').glob('silk-*.json')).read_text()))
        self.assertNotIn('SELECT', document)
        self.assertNotIn('secret@example.com', document)
        self.assertNotIn('token=secret', document)

    def test_export_report_safely_records_filesystem_failure(self):
        """Falla si una escritura local de monitoreo corta el informe Silk existente."""
        with tempfile.TemporaryDirectory() as directory, override_settings(BASE_DIR=Path(directory)):
            with patch.object(monitoring_export.Path, 'mkdir', side_effect=OSError('disk unavailable')), patch.object(monitoring_export.logging, 'getLogger') as get_logger:
                self.assertIsNone(monitoring_export.export_report_safely([], []))
        get_logger.assert_called_once_with('backups')
        get_logger.return_value.exception.assert_called_once_with('Local monitoring export failed; continuing legacy report')
