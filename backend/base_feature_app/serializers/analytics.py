from rest_framework import serializers

from base_feature_app.models import PageView


class PageViewCreateSerializer(serializers.Serializer):
    url_path = serializers.CharField(max_length=255)
    session_id = serializers.CharField(max_length=64)
    peluch_slug = serializers.CharField(required=False, allow_blank=True)
    is_new_visitor = serializers.BooleanField(default=True)
    device_type = serializers.ChoiceField(choices=PageView.DeviceType.choices)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    traffic_source = serializers.ChoiceField(
        choices=PageView.TrafficSource.choices,
        default=PageView.TrafficSource.DIRECT,
    )


class SiteContentSerializer(serializers.Serializer):
    key = serializers.CharField()
    content_json = serializers.JSONField()
