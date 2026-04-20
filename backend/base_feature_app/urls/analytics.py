from django.urls import path
from base_feature_app.views import analytics_views

urlpatterns = [
    path('analytics/pageview/', analytics_views.record_pageview, name='analytics-pageview'),
    path('analytics/kpis/', analytics_views.kpis, name='analytics-kpis'),
    path('analytics/dashboard/', analytics_views.analytics_dashboard, name='analytics-dashboard'),
    path('analytics/export/orders/', analytics_views.export_orders, name='analytics-export-orders'),
]
