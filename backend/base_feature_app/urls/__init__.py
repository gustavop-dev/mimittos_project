from django.urls import include, path

urlpatterns = [
    path('', include('base_feature_app.urls.auth')),
    path('google-captcha/', include('base_feature_app.urls.captcha')),
    path('', include('base_feature_app.urls.blog')),
    path('', include('base_feature_app.urls.product')),
    path('', include('base_feature_app.urls.sale')),
    path('', include('base_feature_app.urls.user')),
    # Peluchelandia routes
    path('', include('base_feature_app.urls.catalog')),
    path('', include('base_feature_app.urls.orders')),
    path('', include('base_feature_app.urls.payment')),
    path('', include('base_feature_app.urls.media')),
    path('', include('base_feature_app.urls.content')),
    path('', include('base_feature_app.urls.analytics')),
    path('', include('base_feature_app.urls.reviews')),
]
