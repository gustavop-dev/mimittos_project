from rest_framework import serializers

from base_feature_app.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'user_email', 'user_name', 'rating', 'comment', 'created_at']

    def get_user_name(self, obj):
        return obj.user.first_name or obj.user.email.split('@')[0]


class HomeReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    peluch_title = serializers.CharField(source='peluch.title', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user_name', 'rating', 'comment', 'peluch_title', 'created_at']

    def get_user_name(self, obj):
        return obj.user.first_name or obj.user.email.split('@')[0]


class ReviewCreateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(min_length=10, max_length=1000)
    order_id = serializers.IntegerField(required=False, allow_null=True)
