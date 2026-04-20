from django.urls import path
from base_feature_app.views import media_views

urlpatterns = [
    path('media/upload/', media_views.upload_media, name='media-upload'),
]
