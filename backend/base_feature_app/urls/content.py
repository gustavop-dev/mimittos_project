from django.urls import path
from base_feature_app.views import content_views

urlpatterns = [
    path('content/<str:key>/', content_views.site_content, name='site-content'),
]
