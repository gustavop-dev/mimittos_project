from collections import defaultdict

from django.utils.text import slugify

from rest_framework import serializers
from rest_framework.fields import empty

from base_feature_app.models import GlobalSize, GlobalColor, Category, Peluch, PeluchSizePrice
from django_attachments.models import Library


class GlobalSizeSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False)

    class Meta:
        model = GlobalSize
        fields = ['id', 'label', 'slug', 'cm', 'sort_order', 'is_active']

    def _unique_slug(self, base, exclude_id=None):
        slug = base
        qs = GlobalSize.objects.all()
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)
        n = 1
        while qs.filter(slug=slug).exists():
            slug = f'{base}-{n}'
            n += 1
        return slug

    def create(self, validated_data):
        if not validated_data.get('slug'):
            validated_data['slug'] = self._unique_slug(slugify(validated_data['label']))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if not validated_data.get('slug'):
            validated_data['slug'] = self._unique_slug(
                slugify(validated_data.get('label', instance.label)), exclude_id=instance.pk
            )
        return super().update(instance, validated_data)


class GlobalColorSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False)

    class Meta:
        model = GlobalColor
        fields = ['id', 'name', 'slug', 'hex_code', 'sort_order', 'is_active']

    def _unique_slug(self, base, exclude_id=None):
        slug = base
        qs = GlobalColor.objects.all()
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)
        n = 1
        while qs.filter(slug=slug).exists():
            slug = f'{base}-{n}'
            n += 1
        return slug

    def create(self, validated_data):
        if not validated_data.get('slug'):
            validated_data['slug'] = self._unique_slug(slugify(validated_data['name']))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if not validated_data.get('slug'):
            validated_data['slug'] = self._unique_slug(
                slugify(validated_data.get('name', instance.name)), exclude_id=instance.pk
            )
        return super().update(instance, validated_data)


class CategorySerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'display_order', 'is_active']

    def _unique_slug(self, base_slug, exclude_id=None):
        slug = base_slug
        qs = Category.objects.all()
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)
        n = 1
        while qs.filter(slug=slug).exists():
            slug = f'{base_slug}-{n}'
            n += 1
        return slug

    def create(self, validated_data):
        if not validated_data.get('slug'):
            validated_data['slug'] = self._unique_slug(slugify(validated_data['name']))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if not validated_data.get('slug'):
            validated_data['slug'] = self._unique_slug(slugify(validated_data.get('name', instance.name)), exclude_id=instance.pk)
        return super().update(instance, validated_data)


class PeluchSizePriceSerializer(serializers.ModelSerializer):
    size = GlobalSizeSerializer(read_only=True)

    class Meta:
        model = PeluchSizePrice
        fields = ['id', 'size', 'price', 'is_available']


class PeluchListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    min_price = serializers.SerializerMethodField()
    discounted_min_price = serializers.SerializerMethodField()
    available_colors = GlobalColorSerializer(many=True, read_only=True)
    gallery_urls = serializers.SerializerMethodField()
    color_images_meta = serializers.SerializerMethodField()

    class Meta:
        model = Peluch
        fields = [
            'id', 'title', 'slug', 'category_name', 'category_slug',
            'lead_description', 'badge', 'is_featured',
            'discount_pct', 'display_order',
            'min_price', 'discounted_min_price', 'available_colors', 'gallery_urls',
            'color_images_meta',
            'average_rating', 'review_count',
            'has_huella', 'has_corazon', 'has_audio',
        ]

    def get_min_price(self, obj):
        sp = obj.size_prices.filter(is_available=True).order_by('price').first()
        return sp.price if sp else None

    def get_discounted_min_price(self, obj):
        sp = obj.size_prices.filter(is_available=True).order_by('price').first()
        if not sp:
            return None
        if obj.discount_pct > 0:
            return round(sp.price * (100 - obj.discount_pct) / 100)
        return sp.price

    def get_color_images_meta(self, obj):
        first_by_color = {}
        counts = defaultdict(int)
        for ci in obj.color_images.select_related('color', 'attachment').order_by('color__sort_order', 'display_order'):
            counts[ci.color_id] += 1
            if ci.color_id not in first_by_color:
                first_by_color[ci.color_id] = ci
        result = []
        for color in obj.available_colors.order_by('sort_order'):
            first = first_by_color.get(color.id)
            url = first.attachment.file.url if first else None
            result.append({
                'color_id': color.id,
                'color_slug': color.slug,
                'color_name': color.name,
                'hex_code': color.hex_code,
                'preview_url': url,
                'count': counts.get(color.id, 0),
            })
        return result

    def get_gallery_urls(self, obj):
        try:
            return [a.file.url for a in obj.gallery.attachment_set.all()[:1]]
        except Exception:
            return []


class PeluchDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    available_colors = GlobalColorSerializer(many=True, read_only=True)
    size_prices = PeluchSizePriceSerializer(many=True, read_only=True)
    min_price = serializers.SerializerMethodField()
    discounted_min_price = serializers.SerializerMethodField()
    gallery_urls = serializers.SerializerMethodField()
    color_images_meta = serializers.SerializerMethodField()

    class Meta:
        model = Peluch
        fields = [
            'id', 'title', 'slug', 'category', 'category_name', 'category_slug',
            'lead_description', 'description', 'specifications', 'care_instructions',
            'available_colors', 'size_prices', 'badge', 'is_featured',
            'discount_pct', 'display_order',
            'min_price', 'discounted_min_price',
            'average_rating', 'review_count', 'view_count',
            'gallery_urls', 'color_images_meta',
            'has_huella', 'has_corazon', 'has_audio',
            'huella_extra_cost', 'corazon_extra_cost', 'audio_extra_cost',
            'created_at', 'updated_at',
        ]

    def get_min_price(self, obj):
        sp = obj.size_prices.filter(is_available=True).order_by('price').first()
        return sp.price if sp else None

    def get_discounted_min_price(self, obj):
        sp = obj.size_prices.filter(is_available=True).order_by('price').first()
        if not sp:
            return None
        if obj.discount_pct > 0:
            return round(sp.price * (100 - obj.discount_pct) / 100)
        return sp.price

    def get_gallery_urls(self, obj):
        try:
            return [a.file.url for a in obj.gallery.attachment_set.all()]
        except Exception:
            return []

    def get_color_images_meta(self, obj):
        first_by_color = {}
        counts = defaultdict(int)
        for ci in obj.color_images.select_related('color', 'attachment').order_by('color__sort_order', 'display_order'):
            counts[ci.color_id] += 1
            if ci.color_id not in first_by_color:
                first_by_color[ci.color_id] = ci
        result = []
        for color in obj.available_colors.order_by('sort_order'):
            first = first_by_color.get(color.id)
            url = first.attachment.file.url if first else None
            result.append({
                'color_id': color.id,
                'color_slug': color.slug,
                'color_name': color.name,
                'hex_code': color.hex_code,
                'preview_url': url,
                'count': counts.get(color.id, 0),
            })
        return result


class PeluchSizePriceWriteSerializer(serializers.Serializer):
    size_id = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_available = serializers.BooleanField(default=True)


class PeluchCreateUpdateSerializer(serializers.ModelSerializer):
    available_color_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )
    size_prices_data = PeluchSizePriceWriteSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Peluch
        fields = [
            'title', 'slug', 'category', 'lead_description', 'description',
            'specifications', 'care_instructions', 'badge',
            'is_active', 'is_featured',
            'discount_pct', 'display_order',
            'has_huella', 'has_corazon', 'has_audio',
            'huella_extra_cost', 'corazon_extra_cost', 'audio_extra_cost',
            'available_color_ids', 'size_prices_data',
        ]

    def _sync_colors(self, peluch, color_ids):
        if color_ids is not None:
            colors = GlobalColor.objects.filter(id__in=color_ids)
            peluch.available_colors.set(colors)

    def _sync_size_prices(self, peluch, size_prices_data):
        if size_prices_data is None:
            return
        for sp_data in size_prices_data:
            PeluchSizePrice.objects.update_or_create(
                peluch=peluch,
                size_id=sp_data['size_id'],
                defaults={'price': sp_data['price'], 'is_available': sp_data['is_available']},
            )

    def create(self, validated_data):
        color_ids = validated_data.pop('available_color_ids', None)
        size_prices_data = validated_data.pop('size_prices_data', None)
        library = Library.objects.create(title=validated_data.get('title', ''))
        validated_data['gallery'] = library
        peluch = super().create(validated_data)
        self._sync_colors(peluch, color_ids)
        self._sync_size_prices(peluch, size_prices_data)
        return peluch

    def update(self, instance, validated_data):
        color_ids = validated_data.pop('available_color_ids', None)
        size_prices_data = validated_data.pop('size_prices_data', None)
        peluch = super().update(instance, validated_data)
        self._sync_colors(peluch, color_ids)
        self._sync_size_prices(peluch, size_prices_data)
        return peluch
