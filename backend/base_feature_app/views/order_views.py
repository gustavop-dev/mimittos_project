from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from base_feature_app.models import Order
from base_feature_app.serializers.order import (
    OrderCreateSerializer, OrderListSerializer, OrderDetailSerializer,
    OrderTrackingSerializer, OrderStatusUpdateSerializer, OrderTrackingUpdateSerializer,
)
from base_feature_app.services.order_service import OrderService
from base_feature_app.services.wompi_service import WompiService
from base_feature_app.services.notification_service import NotificationService


@api_view(['POST'])
@permission_classes([AllowAny])
def create_order(request):
    serializer = OrderCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user if request.user.is_authenticated else None

    try:
        order = OrderService.create_order(serializer.validated_data, user=user)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    checkout_url = ''
    try:
        checkout_url = WompiService.create_checkout(order.payment)
    except Exception:
        pass

    NotificationService.notify_new_order_admin(order)

    return Response(
        {
            'order_number': order.order_number,
            'checkout_url': checkout_url,
            'deposit_amount': order.deposit_amount,
            'balance_amount': order.balance_amount,
            'total_amount': order.total_amount,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_orders(request):
    orders = Order.objects.filter(customer=request.user).prefetch_related('items__peluch')
    serializer = OrderListSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def track_order(request, order_number: str):
    try:
        order = Order.objects.get(order_number=order_number)
    except Order.DoesNotExist:
        return Response({'detail': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = OrderTrackingSerializer(order)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def orders_list(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    qs = Order.objects.all()

    status_filter = request.query_params.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)

    city_filter = request.query_params.get('city')
    if city_filter:
        qs = qs.filter(city__icontains=city_filter)

    serializer = OrderListSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def order_detail_view(request, order_number: str):
    try:
        order = Order.objects.prefetch_related(
            'items__peluch', 'items__size', 'items__color',
            'items__huella_media', 'items__audio_media',
            'status_history__changed_by',
            'payment',
        ).get(order_number=order_number)
    except Order.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    is_owner = request.user.is_authenticated and order.customer == request.user
    is_admin = request.user.is_authenticated and request.user.is_staff
    if not is_owner and not is_admin:
        return Response({'detail': 'No tienes permiso para ver este pedido.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = OrderDetailSerializer(order)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_order_status(request, order_number: str):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(order_number=order_number)
    except Order.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = OrderStatusUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    order = OrderService.update_status(
        order,
        serializer.validated_data['status'],
        changed_by=request.user,
        notes=serializer.validated_data.get('notes', ''),
    )
    return Response(OrderDetailSerializer(order).data)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_order_tracking(request, order_number: str):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(order_number=order_number)
    except Order.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = OrderTrackingUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    order.tracking_number = serializer.validated_data['tracking_number']
    order.shipping_carrier = serializer.validated_data.get('shipping_carrier', order.shipping_carrier)
    order.save(update_fields=['tracking_number', 'shipping_carrier', 'updated_at'])

    return Response(OrderDetailSerializer(order).data)
