from rest_framework import serializers

from base_feature_app.models import Order, OrderItem, OrderStatusHistory, WompiTransaction
from base_feature_app.serializers.catalog import GlobalSizeSerializer, GlobalColorSerializer


class OrderItemCreateSerializer(serializers.Serializer):
    peluch_id = serializers.IntegerField()
    size_id = serializers.IntegerField()
    color_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=10)
    has_huella = serializers.BooleanField(default=False)
    huella_type = serializers.ChoiceField(
        choices=OrderItem.HuellaType.choices, required=False, allow_blank=True
    )
    huella_text = serializers.CharField(max_length=60, required=False, allow_blank=True)
    huella_media_id = serializers.IntegerField(required=False, allow_null=True)
    has_corazon = serializers.BooleanField(default=False)
    corazon_phrase = serializers.CharField(max_length=50, required=False, allow_blank=True)
    has_audio = serializers.BooleanField(default=False)
    audio_media_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        from base_feature_app.models import Peluch, GlobalSize, GlobalColor, PeluchSizePrice, PersonalizationMedia

        try:
            peluch = Peluch.objects.get(id=data['peluch_id'], is_active=True)
        except Peluch.DoesNotExist:
            raise serializers.ValidationError({'peluch_id': 'Peluche no encontrado.'})

        try:
            size = GlobalSize.objects.get(id=data['size_id'], is_active=True)
        except GlobalSize.DoesNotExist:
            raise serializers.ValidationError({'size_id': 'Tamaño no válido.'})

        try:
            color = GlobalColor.objects.get(id=data['color_id'], is_active=True)
        except GlobalColor.DoesNotExist:
            raise serializers.ValidationError({'color_id': 'Color no válido.'})

        if not peluch.available_colors.filter(id=color.id).exists():
            raise serializers.ValidationError({'color_id': 'Este color no está disponible para este peluche.'})

        if not PeluchSizePrice.objects.filter(peluch=peluch, size=size, is_available=True).exists():
            raise serializers.ValidationError({'size_id': 'Este tamaño no está disponible para este peluche.'})

        if data.get('has_huella'):
            if not peluch.has_huella:
                raise serializers.ValidationError({'has_huella': 'Este peluche no ofrece personalización de huella.'})
            if data.get('huella_type') == OrderItem.HuellaType.IMAGE:
                media_id = data.get('huella_media_id')
                if not media_id:
                    raise serializers.ValidationError({'huella_media_id': 'Debes subir una imagen para la huella.'})
                try:
                    data['huella_media'] = PersonalizationMedia.objects.get(
                        id=media_id, media_type=PersonalizationMedia.MediaType.HUELLA_IMAGE
                    )
                except PersonalizationMedia.DoesNotExist:
                    raise serializers.ValidationError({'huella_media_id': 'Imagen de huella no encontrada.'})

        if data.get('has_audio'):
            if not peluch.has_audio:
                raise serializers.ValidationError({'has_audio': 'Este peluche no ofrece audio personalizado.'})
            media_id = data.get('audio_media_id')
            if not media_id:
                raise serializers.ValidationError({'audio_media_id': 'Debes subir un audio.'})
            try:
                data['audio_media'] = PersonalizationMedia.objects.get(
                    id=media_id, media_type=PersonalizationMedia.MediaType.AUDIO
                )
            except PersonalizationMedia.DoesNotExist:
                raise serializers.ValidationError({'audio_media_id': 'Audio no encontrado.'})

        data['peluch'] = peluch
        data['size'] = size
        data['color'] = color
        return data


class OrderCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=200)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    department = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = OrderItemCreateSerializer(many=True, min_length=1)


class OrderItemReadSerializer(serializers.ModelSerializer):
    peluch_title = serializers.CharField(source='peluch.title', read_only=True)
    peluch_slug = serializers.CharField(source='peluch.slug', read_only=True)
    size = GlobalSizeSerializer(read_only=True)
    color = GlobalColorSerializer(read_only=True)
    line_total = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'peluch_title', 'peluch_slug', 'size', 'color', 'quantity',
            'unit_price', 'personalization_cost', 'line_total',
            'has_huella', 'huella_type', 'huella_text',
            'has_corazon', 'corazon_phrase',
            'has_audio',
            'configuration_snapshot',
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source='changed_by.email', read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'previous_status', 'new_status', 'changed_by_email', 'notes', 'changed_at']


class WompiTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WompiTransaction
        fields = ['reference', 'status', 'payment_method_type', 'checkout_url', 'created_at']


class OrderListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'customer_email',
            'city', 'department', 'status', 'total_amount',
            'deposit_amount', 'balance_amount', 'created_at',
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    payment = WompiTransactionSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'customer_email', 'customer_phone',
            'address', 'city', 'department', 'postal_code',
            'status', 'total_amount', 'deposit_amount', 'balance_amount',
            'tracking_number', 'shipping_carrier', 'notes',
            'created_at', 'updated_at',
            'items', 'status_history', 'payment',
        ]


class OrderTrackingSerializer(serializers.ModelSerializer):
    payment_status = serializers.SerializerMethodField()
    checkout_url = serializers.SerializerMethodField()
    items = OrderItemReadSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_number', 'status', 'tracking_number',
            'shipping_carrier', 'created_at', 'updated_at',
            'payment_status', 'checkout_url',
            'customer_name', 'customer_phone',
            'address', 'city', 'department', 'postal_code',
            'items',
        ]

    def get_payment_status(self, obj):
        payment = getattr(obj, 'payment', None)
        return payment.status if payment else None

    def get_checkout_url(self, obj):
        payment = getattr(obj, 'payment', None)
        return payment.checkout_url if payment else None


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
    notes = serializers.CharField(required=False, allow_blank=True)


class OrderTrackingUpdateSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=100)
    shipping_carrier = serializers.CharField(max_length=100, required=False, allow_blank=True)
