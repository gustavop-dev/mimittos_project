from django.urls import path
from base_feature_app.views import payment_views

urlpatterns = [
    path('payment/wompi/webhook/', payment_views.wompi_webhook, name='wompi-webhook'),
    path('payment/status/<str:reference>/', payment_views.payment_status, name='payment-status'),
    path('payment/info/<str:order_number>/', payment_views.payment_info, name='payment-info'),
    path('payment/process/', payment_views.process_payment, name='payment-process'),
    path('payment/pse-banks/', payment_views.pse_banks, name='pse-banks'),
]
