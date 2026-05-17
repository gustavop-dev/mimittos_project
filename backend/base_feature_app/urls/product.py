from django.urls import path

from base_feature_app.views import product_crud

urlpatterns = [
    path('products/', product_crud.products, name='products'),
    path('products/<int:product_id>/', product_crud.product_detail, name='product-detail'),
]
