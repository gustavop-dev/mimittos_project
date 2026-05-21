# Subida incremental de fotos por color (modelo borrador)

- **Fecha**: 2026-05-21
- **Branch**: `feat/incremental-color-image-upload`
- **Estado**: Diseño aprobado — pendiente plan de implementación

---

## 1. Problema

Al crear un peluche con muchos colores y varias fotos por color (ej. 20 colores ×
4 fotos = 80 imágenes), algunas fotos no se guardan y el usuario no se entera.

Causa real, en `PeluchForm.handleSubmit` (modo creación):

1. Las fotos se acumulan en memoria del navegador (`colorGallery`, con el `File`).
2. El peluche se crea **solo al pulsar guardar** (`peluchAdminService.create`).
3. Recién después, un bucle anidado sube las 80 imágenes una por una con
   `try { await uploadColorImage(...) } catch { /* continue */ }` — **traga todos
   los errores en silencio**. Si una subida falla (red, 5xx, 413 de nginx), el
   bucle sigue y se navega fuera como si todo se hubiera guardado.

Restricciones adicionales:

- **nginx** corta las requests que superan `client_max_body_size` (≈1MB) con `413`
  antes de que lleguen a Django. La optimización del backend (`_optimize_image`)
  no ayuda porque ocurre *después* de que nginx ya rechazó la request.
- `compressImage` (cliente) hoy solo redimensiona por dimensiones y **omite
  recomprimir si la imagen ya mide ≤1400px** — no garantiza ningún tope de bytes.

## 2. Objetivo

Cada foto se sube **al instante, una por una**, a un peluche que existe desde el
inicio como **borrador**, con estado visible por imagen, reintentos automáticos
ante fallos transitorios, y compresión que garantiza el tope de tamaño.

## 3. Decisiones tomadas

| Decisión | Elección | Razón |
|----------|----------|-------|
| Límite de nginx | No tocar nginx; comprimir en cliente bajo el límite | Cero cambios de infraestructura. |
| Reintentos | Auto-retry transitorios (2-3×) + botón manual por imagen + "reintentar todas" | Tolerante a hipos de red en cargas de 80 imágenes. |
| Guardar con fallos | **Bloquear** "Guardar" hasta que toda imagen esté subida o quitada | Garantiza que no se guarde nada incompleto sin que el usuario lo sepa. |
| Disparo del borrador | Crear el borrador en la **primera** subida de foto | Evita borradores huérfanos de usuarios que abren el form y no suben nada. |

## 4. Arquitectura

### 4.1 Modelo: el borrador

1. El form `/backoffice/peluches/nuevo` abre sin peluche. Los colores se
   seleccionan en estado local.
2. Las zonas de "subir foto" se **habilitan solo cuando título + slug + categoría
   están llenos** (con un hint cuando están deshabilitadas) — es lo mínimo que el
   serializer del backend exige para crear un `Peluch`.
3. En la **primera** subida de foto, el form crea el borrador:
   `POST /peluches/` con los datos actuales del form + `is_active=false`. Guarda el
   slug devuelto en `draftSlug`.
4. Con el borrador creado, el form se comporta como modo edición:
   - cada toggle de color → `PATCH /peluches/<draftSlug>/` con `available_color_ids`;
   - cada foto se sube directo (`POST .../color-image/<color_slug>/`);
   - cada borrado de foto → `DELETE .../color-image/.../<pci_id>/`.
5. "Guardar" → `PATCH /peluches/<draftSlug>/` con el payload completo +
   `is_active=true`.
6. "Cancelar" → si existe `draftSlug`, confirma "¿Descartar borrador y sus fotos?"
   → `DELETE /peluches/<draftSlug>/`.

El borrador siempre usa el `draftSlug` de creación para las subidas; el `PATCH`
final puede cambiar título/slug sin afectar las subidas ya hechas.

### 4.2 Backend

**Sin cambios.** Toda la orquestación usa endpoints existentes (`create`,
`PATCH`, `uploadColorImage`, `deleteColorImage`, `delete`). El borrador es un
`Peluch` con `is_active=false`, ya invisible en la tienda (los endpoints públicos
filtran `is_active=True`). El límite backend de 5MB y `_optimize_image` se dejan
como están (nginx corta antes; la doble compresión es inofensiva).

### 4.3 Frontend — compresión robusta (`lib/utils/imageCompressor.ts`)

`compressImage` se reescribe para **apuntar a un tope de bytes** (`TARGET_BYTES`
≈ 900_000, holgado bajo el 1MB de nginx):

- Siempre re-encodea a JPEG (ya no omite imágenes de dimensiones pequeñas).
- Redimensiona a máx. 1400×1400.
- Si el resultado supera `TARGET_BYTES`, baja la calidad de forma escalonada
  (0.82 → 0.65 → 0.5 → 0.4); si aún supera el tope, reduce dimensiones.
- Si tras todos los pasos no baja del tope, lanza `ImageTooLargeError`.

Unidad autocontenida y testeable.

### 4.4 Frontend — orquestación de subida (`lib/hooks/useColorImageUpload.ts`)

`PeluchForm.tsx` ya tiene ~791 líneas; la lógica de subida se extrae a un hook
nuevo para mantener el componente manejable y la lógica testeable aislada. El hook
expone el estado `colorGallery` y operaciones:

- `uploadFiles(colorSlug, files)` — comprime y sube cada archivo incrementalmente.
- creación lazy del borrador en la primera subida.
- `retry(colorSlug, item)` y `retryAll()`.
- `removeImage(colorSlug, item)`.

Subida con **auto-retry**: ante fallo transitorio (error de red sin respuesta, o
status 5xx) reintenta hasta 2 veces (3 intentos en total) con pequeño backoff; ante
4xx (413, 415, 400) falla de inmediato (permanente). `ImageTooLargeError` de la
compresión → falla permanente con mensaje "imagen demasiado pesada".

### 4.5 Frontend — UI de estado + bloqueo de guardar

- `ColorGalleryItem` gana `status: 'uploading' | 'done' | 'failed'` (y un
  `errorMessage?` para el caso permanente).
- Cada tile renderiza: spinner (uploading) / ✓ (done) / ✗ + botón "reintentar"
  (failed).
- Acción "reintentar todas" cuando hay ≥1 fallida; resumen "N de M subidas".
- **"Guardar" queda deshabilitado** mientras haya imágenes en `uploading` o
  `failed`, con el aviso "⚠ N imágenes sin subir — reinténtalas o quítalas".

### 4.6 Modo edición unificado

Tras crear el borrador el form ya es "modo edición", así que la misma orquestación
sirve para editar un peluche existente. El modo edición actual (que ante un fallo
hace `alert` y **descarta** la foto, `PeluchForm.tsx:237-243`) hereda el estado
visible + retry.

### 4.7 Borradores huérfanos

"Cancelar" borra el borrador. Si el usuario cierra la pestaña queda un `Peluch`
`is_active=false` — invisible para clientes, visible para el admin en
`/backoffice/peluches`. Se añade un badge "Borrador" en esa lista para
identificarlos y limpiarlos fácil.

## 5. Flujo de datos (crear peluche con fotos)

1. Admin llena título y categoría → se habilitan las zonas de foto.
2. Admin selecciona colores y pulsa "+Foto" en un color, elige 4 archivos.
3. Primera foto → `POST /peluches/` (`is_active=false`) → `draftSlug`.
4. `PATCH` sincroniza `available_color_ids` del borrador.
5. Cada archivo: comprime → `POST color-image` → el tile pasa `uploading` → `done`
   (o `failed` con retry).
6. Admin repite para los demás colores.
7. "Guardar" (habilitado solo si no hay `uploading`/`failed`) →
   `PATCH /peluches/<draftSlug>/` con todo + `is_active=true` → navega a la lista.

## 6. Manejo de errores

- Fallo transitorio de subida → auto-retry hasta 2× → si persiste, `failed` +
  retry manual.
- Fallo permanente (4xx, imagen demasiado pesada) → `failed` inmediato con mensaje.
- Fallo al crear el borrador → mensaje en el form; no se intenta subir nada.
- Fallo al sincronizar colores (`PATCH`) → mensaje; la subida de ese color se
  pospone.

## 7. Plan de pruebas

**Frontend**

- `imageCompressor`: re-encodea aunque las dimensiones sean pequeñas; el resultado
  respeta `TARGET_BYTES`; lanza `ImageTooLargeError` cuando no puede bajar del tope.
- `useColorImageUpload`: sube incrementalmente y marca `done`; auto-retry ante 5xx
  y luego éxito; no reintenta ante 4xx; crea el borrador en la primera subida;
  `retry`/`retryAll` reintentan las fallidas.
- `PeluchForm`: la primera foto dispara la creación del borrador; "Guardar" está
  deshabilitado con imágenes `uploading`/`failed`; "Cancelar" borra el borrador.

**Backend**

- Sin cambios → sin tests nuevos de backend (los endpoints ya están cubiertos).

## 8. Fuera de alcance

- No se modifica nginx ni el límite backend de 5MB.
- No se cambia la doble compresión cliente + `_optimize_image` del servidor.
- No se implementa limpieza automática (cron) de borradores huérfanos; el badge
  "Borrador" + el borrado en "Cancelar" se consideran suficientes.

## 9. Archivos afectados (estimado)

**Frontend**: `lib/utils/imageCompressor.ts`, `lib/hooks/useColorImageUpload.ts`
(nuevo), `components/admin/PeluchForm.tsx`, `app/backoffice/peluches/page.tsx`
(badge "Borrador"), tests.

**Backend**: ninguno previsto.
