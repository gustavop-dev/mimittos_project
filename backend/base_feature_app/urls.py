from django.urls import include, path

urlpatterns = [
    # Base template routes
    path('', include('base_feature_app.urls.auth')),
    path('', include('base_feature_app.urls.blog')),
    path('', include('base_feature_app.urls.product')),
    path('', include('base_feature_app.urls.sale')),
    # Peluchelandia routes
    path('', include('base_feature_app.urls.catalog')),
    path('', include('base_feature_app.urls.orders')),
    path('', include('base_feature_app.urls.payment')),
    path('', include('base_feature_app.urls.media')),
    path('', include('base_feature_app.urls.content')),
    path('', include('base_feature_app.urls.analytics')),
    path('', include('base_feature_app.urls.reviews')),
]
