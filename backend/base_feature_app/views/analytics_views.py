from datetime import date

from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from base_feature_app.models import PageView, Peluch
from base_feature_app.serializers.analytics import PageViewCreateSerializer
from base_feature_app.services.analytics_service import AnalyticsService


@api_view(['POST'])
@permission_classes([AllowAny])
def record_pageview(request):
    serializer = PageViewCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    peluch = None
    peluch_slug = data.pop('peluch_slug', None)
    if peluch_slug:
        try:
            peluch = Peluch.objects.get(slug=peluch_slug)
        except Peluch.DoesNotExist:
            pass

    user = request.user if request.user.is_authenticated else None

    PageView.objects.create(
        peluch=peluch,
        user=user,
        **data,
    )
    return Response({'recorded': True}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def kpis(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    date_str = request.query_params.get('date')
    for_date = None
    if date_str:
        try:
            for_date = date.fromisoformat(date_str)
        except ValueError:
            return Response({'detail': 'Formato de fecha inválido. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(AnalyticsService.get_kpis(for_date))


@api_view(['GET'])
@permission_classes([AllowAny])
def analytics_dashboard(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        date_from = date.fromisoformat(request.query_params.get('date_from', date.today().replace(day=1).isoformat()))
        date_to = date.fromisoformat(request.query_params.get('date_to', date.today().isoformat()))
    except ValueError:
        return Response({'detail': 'Formato de fecha inválido. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(AnalyticsService.get_dashboard_data(date_from, date_to))


@api_view(['GET'])
@permission_classes([AllowAny])
def export_orders(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        date_from = date.fromisoformat(request.query_params.get('date_from', date.today().replace(day=1).isoformat()))
        date_to = date.fromisoformat(request.query_params.get('date_to', date.today().isoformat()))
    except ValueError:
        return Response({'detail': 'Formato de fecha inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    csv_bytes = AnalyticsService.export_orders_csv(date_from, date_to)
    response = HttpResponse(csv_bytes, content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = f'attachment; filename="pedidos-{date_from}-{date_to}.csv"'
    return response
