from rest_framework import serializers

from base_feature_app.models import GlobalSize, GlobalColor, Category, Peluch, PeluchSizePrice


class GlobalSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSize
        fields = ['id', 'label', 'slug', 'cm', 'sort_order']


class GlobalColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalColor
        fields = ['id', 'name', 'slug', 'hex_code', 'sort_order']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'display_order', 'is_active']


class PeluchSizePriceSerializer(serializers.ModelSerializer):
    size = GlobalSizeSerializer(read_only=True)

    class Meta:
        model = PeluchSizePrice
        fields = ['id', 'size', 'price', 'is_available']


class PeluchListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    min_price = serializers.SerializerMethodField()
    available_colors = GlobalColorSerializer(many=True, read_only=True)
    gallery_urls = serializers.SerializerMethodField()

    class Meta:
        model = Peluch
        fields = [
            'id', 'title', 'slug', 'category_name', 'category_slug',
            'lead_description', 'badge', 'is_featured',
            'min_price', 'available_colors', 'gallery_urls',
            'average_rating', 'review_count',
            'has_huella', 'has_corazon', 'has_audio',
        ]

    def get_min_price(self, obj):
        sp = obj.size_prices.filter(is_available=True).order_by('price').first()
        return sp.price if sp else None

    def get_gallery_urls(self, obj):
        request = self.context.get('request')
        try:
            attachments = obj.gallery.attachments.all()[:1]
            if request:
                return [request.build_absolute_uri(a.attachment.url) for a in attachments]
            return [a.attachment.url for a in attachments]
        except Exception:
            return []


class PeluchDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    available_colors = GlobalColorSerializer(many=True, read_only=True)
    size_prices = PeluchSizePriceSerializer(many=True, read_only=True)
    gallery_urls = serializers.SerializerMethodField()

    class Meta:
        model = Peluch
        fields = [
            'id', 'title', 'slug', 'category',
            'lead_description', 'description', 'specifications', 'care_instructions',
            'available_colors', 'size_prices', 'badge', 'is_featured',
            'average_rating', 'review_count', 'view_count',
            'gallery_urls',
            'has_huella', 'has_corazon', 'has_audio',
            'huella_extra_cost', 'corazon_extra_cost', 'audio_extra_cost',
            'created_at', 'updated_at',
        ]

    def get_gallery_urls(self, obj):
        request = self.context.get('request')
        try:
            attachments = obj.gallery.attachments.all()
            if request:
                return [request.build_absolute_uri(a.attachment.url) for a in attachments]
            return [a.attachment.url for a in attachments]
        except Exception:
            return []


class PeluchCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Peluch
        fields = [
            'title', 'slug', 'category', 'lead_description', 'description',
            'specifications', 'care_instructions', 'badge',
            'is_active', 'is_featured',
            'has_huella', 'has_corazon', 'has_audio',
            'huella_extra_cost', 'corazon_extra_cost', 'audio_extra_cost',
        ]
