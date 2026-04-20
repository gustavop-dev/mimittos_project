from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from base_feature_app.models import SiteContent
from base_feature_app.serializers.analytics import SiteContentSerializer


@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def site_content(request, key: str):
    valid_keys = [choice[0] for choice in SiteContent.Key.choices]
    if key not in valid_keys:
        return Response({'detail': 'Clave de contenido no válida.'}, status=status.HTTP_404_NOT_FOUND)

    content_obj, _ = SiteContent.objects.get_or_create(key=key, defaults={'content_json': {}})

    if request.method == 'GET':
        return Response({'key': content_obj.key, 'content_json': content_obj.content_json})

    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = SiteContentSerializer(data={'key': key, 'content_json': request.data.get('content_json', {})})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    content_obj.content_json = serializer.validated_data['content_json']
    content_obj.updated_by = request.user
    content_obj.save()

    return Response({'key': content_obj.key, 'content_json': content_obj.content_json})
