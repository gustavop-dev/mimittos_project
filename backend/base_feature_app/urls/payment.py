from django.urls import path
from base_feature_app.views import payment_views

urlpatterns = [
    path('payment/wompi/webhook/', payment_views.wompi_webhook, name='wompi-webhook'),
    path('payment/status/<str:reference>/', payment_views.payment_status, name='payment-status'),
]
