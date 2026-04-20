from django.db.models import Min, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from base_feature_app.models import Peluch, Category, GlobalSize, GlobalColor
from base_feature_app.serializers.catalog import (
    PeluchListSerializer, PeluchDetailSerializer, PeluchCreateUpdateSerializer,
    CategorySerializer, GlobalSizeSerializer, GlobalColorSerializer,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def sizes_list(request):
    queryset = GlobalSize.objects.filter(is_active=True)
    return Response(GlobalSizeSerializer(queryset, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def colors_list(request):
    queryset = GlobalColor.objects.filter(is_active=True)
    return Response(GlobalColorSerializer(queryset, many=True).data)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def categories(request):
    if request.method == 'GET':
        qs = Category.objects.filter(is_active=True)
        return Response(CategorySerializer(qs, many=True).data)

    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
def category_detail(request, category_id: int):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = CategorySerializer(category, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def peluches_featured(request):
    qs = Peluch.objects.filter(is_active=True, is_featured=True).prefetch_related(
        'available_colors', 'size_prices__size', 'gallery'
    )
    return Response(PeluchListSerializer(qs, many=True, context={'request': request}).data)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def peluches(request):
    if request.method == 'GET':
        qs = Peluch.objects.filter(is_active=True).prefetch_related(
            'available_colors', 'size_prices__size', 'gallery', 'category'
        )

        category_slug = request.query_params.get('category')
        if category_slug:
            qs = qs.filter(category__slug=category_slug)

        size_slug = request.query_params.get('size')
        if size_slug:
            qs = qs.filter(size_prices__size__slug=size_slug, size_prices__is_available=True)

        color_slug = request.query_params.get('color')
        if color_slug:
            qs = qs.filter(available_colors__slug=color_slug)

        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price or max_price:
            qs = qs.annotate(price_min=Min('size_prices__price'))
            if min_price:
                qs = qs.filter(price_min__gte=int(min_price))
            if max_price:
                qs = qs.filter(price_min__lte=int(max_price))

        if request.query_params.get('has_huella') == 'true':
            qs = qs.filter(has_huella=True)
        if request.query_params.get('has_audio') == 'true':
            qs = qs.filter(has_audio=True)

        sort = request.query_params.get('sort', 'popular')
        sort_map = {
            'popular': '-view_count',
            'new': '-created_at',
            'price_asc': 'price_min',
            'price_desc': '-price_min',
            'top_rated': '-average_rating',
        }
        order_by = sort_map.get(sort, '-view_count')
        if order_by in ('price_min', '-price_min') and not (min_price or max_price):
            qs = qs.annotate(price_min=Min('size_prices__price'))
        qs = qs.order_by(order_by).distinct()

        serializer = PeluchListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = PeluchCreateUpdateSerializer(data=request.data)
    if serializer.is_valid():
        peluch = serializer.save()
        return Response(
            PeluchDetailSerializer(peluch, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
def peluch_detail(request, slug: str):
    try:
        peluch = Peluch.objects.prefetch_related(
            'available_colors', 'size_prices__size', 'gallery', 'category'
        ).get(slug=slug, is_active=True)
    except Peluch.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        Peluch.objects.filter(pk=peluch.pk).update(view_count=peluch.view_count + 1)
        serializer = PeluchDetailSerializer(peluch, context={'request': request})
        return Response(serializer.data)

    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        peluch.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = PeluchCreateUpdateSerializer(peluch, data=request.data, partial=(request.method == 'PATCH'))
    if serializer.is_valid():
        peluch = serializer.save()
        return Response(PeluchDetailSerializer(peluch, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
