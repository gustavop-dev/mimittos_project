from django.urls import path
from base_feature_app.views import content_views

urlpatterns = [
    path('content/hero-image/upload/', content_views.hero_image_upload, name='hero-image-upload'),
    path('content/<str:key>/', content_views.site_content, name='site-content'),
]
