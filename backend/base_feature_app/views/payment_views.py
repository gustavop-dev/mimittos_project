import json

from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from base_feature_app.models import WompiTransaction
from base_feature_app.services.wompi_service import WompiService


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def wompi_webhook(request):
    try:
        event_data = json.loads(request.body)
    except json.JSONDecodeError:
        return Response({'detail': 'Invalid JSON.'}, status=status.HTTP_400_BAD_REQUEST)

    if not WompiService.verify_signature(event_data):
        return Response({'detail': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

    WompiService.process_event(event_data)
    return Response({'received': True})


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_status(request, reference: str):
    try:
        tx = WompiTransaction.objects.select_related('order').get(reference=reference)
    except WompiTransaction.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'reference': tx.reference,
        'status': tx.status,
        'order_number': tx.order.order_number,
        'checkout_url': tx.checkout_url,
    })
