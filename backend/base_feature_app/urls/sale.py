from django.urls import path

from base_feature_app.views import sale_crud

urlpatterns = [
    path('sales/', sale_crud.sales, name='sale-list'),
    path('sales/<int:sale_id>/', sale_crud.sale_detail, name='sale-detail'),
]
