# Audio personalization feedback + order detail in backoffice

**Fecha:** 2026-05-12
**Estado:** Aprobado — listo para plan de implementación

## Problema

1. En la página de producto, al subir el audio personalizado (máx. 30s) el único indicio de éxito es que el texto del botón cambia a `✓ nombre-archivo` — demasiado sutil. Si el upload falla, el `catch` lo silencia: no se muestra ningún error. No se ve la duración ni el tamaño del audio resultante, ni hay forma de escucharlo.
2. El incremento de precio por la personalización de audio (`audio_extra_cost`) se aplica al total "en silencio": no hay un desglose visible que muestre `🔊 Audio +$X`.
3. El backoffice de pedidos (`/backoffice/pedidos`) es solo una tabla — no hay vista de detalle. No se ven los ítems, tallas, colores ni personalizaciones de cada compra. El admin no puede escuchar el audio ni ver la imagen de huella que subió el cliente.

## Estado actual relevante (no se modifica)

- `OrderItem` ya persiste `has_audio`, `audio_media` (FK → `PersonalizationMedia`), `has_huella`, `huella_type`, `huella_text`, `huella_media`, `has_corazon`, `corazon_phrase`, `personalization_cost`, `configuration_snapshot`. **No se tocan modelos ni migraciones.**
- `OrderService.create_order` ya guarda toda la personalización y marca el media como `is_used`.
- `upload_media` (`/media/upload/`) ya procesa el audio (recorta a 30s, comprime a mp3 64k) y devuelve `{ media_id, file_url, file_size_kb, duration_sec }`. `ffmpeg` + `pydub` están instalados.
- `order_detail_view` ya hace `prefetch_related('items__huella_media', 'items__audio_media', ...)`.
- `orderService.getOrderDetail(orderNumber)` ya existe en el frontend.

## Alcance

### 1. Backend — exponer los archivos de personalización

- **`OrderItemReadSerializer`** (`backend/base_feature_app/serializers/order.py`): añadir campos calculados de solo lectura:
  - `huella_media_url` — URL absoluta del archivo de huella, o `null`.
  - `audio_media_url` — URL absoluta del archivo de audio, o `null`.
  - `audio_duration_sec` — `duration_sec` del `PersonalizationMedia` de audio, o `null`.
  - `audio_size_kb` — `file_size_kb` del `PersonalizationMedia` de audio, o `null`.
  - Las URLs se construyen con `self.context['request'].build_absolute_uri(...)`; si no hay request en contexto, se devuelve la URL relativa como fallback.
- **Vistas** (`backend/base_feature_app/views/order_views.py`): pasar `context={'request': request}` al instanciar `OrderDetailSerializer` y `OrderTrackingSerializer` (en `order_detail_view`, `track_order`, `update_order_status`, `update_order_tracking`).

### 2. Frontend — página de producto (`frontend/app/peluches/[slug]/page.tsx`)

- **Estado nuevo**: `audioError: string`, `audioMeta: { url: string; durationSec: number | null; sizeKb: number } | null`. Se mantiene `audioMediaId`, `audioUploading`, `audioFileName`.
- **`handleAudioUpload`**: en `try` setear `audioMeta` con `result.file_url`, `result.duration_sec`, `result.file_size_kb`; en `catch` setear `audioError` con el mensaje (`err.response?.data?.detail ?? 'No se pudo subir el audio. Intenta de nuevo.'`) y limpiar `audioFileName`/`audioMediaId`/`audioMeta`.
- **UI del bloque de audio** cuando `audioMediaId !== null`: tarjeta de confirmación con ✓ "Audio listo", nombre del archivo, duración (`X.Xs`) y tamaño (`X KB`), un `<audio controls src={audioMeta.url}>`, y un botón "Cambiar audio" que reabre el file picker. Si `audioError`, mostrar mensaje de error inline (rojo). Mantener el estado `Subiendo...`.
- **Feedback de error del upload de huella imagen**: añadir `huellaError` y mostrarlo inline (hoy el `catch` también es silencioso). Sin reproductor — solo el manejo de error, por consistencia.
- **Desglose de precio**: en el bloque de precio, cuando `personalizationCost > 0`, renderizar líneas con los componentes activos (`🐾 Huella +$x`, `💖 Corazón +$x`, `🔊 Audio +$x`) para que el incremento sea visible. El total ya se calcula bien.

### 3. Frontend — backoffice de pedidos (`frontend/app/backoffice/pedidos/page.tsx`)

- Cada fila de la tabla se vuelve clickeable → `onClick` setea `selectedOrderNumber`; un `useEffect` (o handler async) llama `orderService.getOrderDetail(selectedOrderNumber)` y guarda `detail`.
- **Modal centrado** (overlay + tarjeta scrollable, cierre con botón ✕ / click en overlay) que muestra:
  - **Cliente**: `customer_name`, `customer_email`, `customer_phone`, `address`, `city`, `department`, `postal_code`.
  - **Totales**: `total_amount` (subtotal productos), `shipping_amount`, `discount_amount`, `payment_mode`, `amount_paid_now`, `balance_amount`, estado de pago (`payment.status`).
  - **Ítems** (`detail.items`): por cada uno — `peluch_title`, talla (`size.label` · `size.cm`), color (`color.name` + swatch `color.hex_code`), `quantity`, `unit_price`, `personalization_cost`, `line_total`.
  - **Personalizaciones del ítem** (solo si `has_huella || has_corazon || has_audio`):
    - Huella: `huella_type` + (`huella_text` si tipo ≠ image, o miniatura/link a `huella_media_url` si tipo = image).
    - Corazón: `corazon_phrase`.
    - Audio: `<audio controls src={audio_media_url}>` + duración (`audio_duration_sec`) + link "Descargar" a `audio_media_url`.
  - **Historial de estados** (`detail.status_history`): lista compacta `previous_status → new_status` con `changed_at` y `notes`.
- Estado de carga/errores del detalle (`detailLoading`, `detailError`).

### 4. Frontend — tipos (`frontend/lib/types.ts`)

- Añadir al tipo del ítem de orden (el que mapea `OrderItemReadSerializer`): `huella_media_url: string | null`, `audio_media_url: string | null`, `audio_duration_sec: number | null`, `audio_size_kb: number | null`.
- Confirmar que `OrderDetail` incluye `items`, `status_history`, `payment`, `shipping_amount`, `discount_amount`, `payment_mode`, `amount_paid_now`, `balance_amount` (si falta algo, agregarlo).

## Decisiones de diseño

- **Modal centrado** en lugar de drawer lateral o página `/backoffice/pedidos/[orderNumber]` → menos cambios, consistente con el panel actual de página única.
- **`context={'request': request}` en los serializers** para URLs absolutas → más robusto que prefijar `NEXT_PUBLIC_API_URL` en el frontend (el media se sirve desde el backend, distinto origen en dev).
- No se tocan modelos ni migraciones — la persistencia del audio ya es correcta.

## Tests

- **Backend** (`backend/base_feature_app/tests/serializers/test_order_serializer.py` o nuevo): `OrderItemReadSerializer` devuelve `audio_media_url`/`audio_duration_sec`/`audio_size_kb` cuando hay `audio_media`; devuelve `null` cuando no lo hay. (Pasar un request fake en el contexto.)
- **Frontend** (`frontend/app/peluches/[slug]/__tests__/page.test.tsx`): muestra mensaje de error cuando `mediaService.uploadAudio` rechaza; muestra confirmación + reproductor cuando resuelve.
- **Frontend** (`frontend/app/backoffice/pedidos/__tests__/page.test.tsx`): al abrir el detalle, renderiza los ítems con talla/color y, si hay personalización de audio, renderiza el reproductor con la URL.

## Fuera de alcance

- Cambios en el Django admin (`/admin/`) — el usuario eligió solo el backoffice frontend.
- Cambios al `configuration_snapshot` — la info del media se deriva del FK.
- Validación de duración del audio en el cliente — el backend ya recorta a 30s.
