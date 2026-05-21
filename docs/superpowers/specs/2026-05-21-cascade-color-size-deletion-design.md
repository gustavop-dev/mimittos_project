# Eliminación en cascada de colores y tallas con confirmación SweetAlert2

- **Fecha**: 2026-05-21
- **Branch**: `fix/peluche-size-deselection-not-persisting`
- **Estado**: Diseño aprobado — pendiente plan de implementación

---

## 1. Problema

Desde el backoffice (`PeluchForm`), un admin puede intentar borrar un color o talla
global. Hoy:

- **Tallas**: no se pueden borrar. `PeluchSizePrice.size` es `on_delete=PROTECT`, y
  `OrderItem.size` también. Cualquier intento lanza `ProtectedError` → 500.
- **Colores**: el M2M `available_colors` y `PeluchColorImage.color` (`CASCADE`)
  permitirían borrar, pero `OrderItem.color` es `PROTECT` → si el color aparece en
  algún pedido, el borrado falla con 500.
- La confirmación actual es un `window.confirm` nativo, sin peso visual ni fricción
  proporcional a lo destructiva que es la acción.

## 2. Objetivo

Permitir borrar un color/talla global con **cascada al catálogo**, **preservando el
historial de pedidos**, detrás de un modal SweetAlert2 con identidad de marca y
confirmación escribiendo el nombre exacto del ítem.

## 3. Decisiones tomadas

| Decisión | Elección | Razón |
|----------|----------|-------|
| Pedidos pasados | Snapshot + permitir borrar | `OrderItem.configuration_snapshot` **ya** guarda `size_label`, `size_cm`, `color_name`, `color_hex`. El historial sobrevive sin la FK. |
| Palabra de confirmación | Nombre exacto del color/talla | Estilo GitHub: obliga a reconocer qué se borra; evita borrar el ítem equivocado. |
| Detalle de la advertencia | Números reales de impacto | Más honesto y tranquilizador. Requiere un endpoint admin de uso. |
| Tipo de borrado | Hard delete | El usuario pidió eliminación real con cascada, no desactivación. |

## 4. Arquitectura

### 4.1 Backend — modelo + migración

Migración nueva `0013_cascade_color_size_deletion` con 3 `AlterField`:

| FK | Antes | Después | Efecto al borrar el global |
|----|-------|---------|----------------------------|
| `PeluchSizePrice.size` | `PROTECT` | `CASCADE` | Borra todas las filas de precio-por-talla de esa talla |
| `OrderItem.size` | `PROTECT` | `SET_NULL`, `null=True` | La FK queda null; el ítem conserva el snapshot |
| `OrderItem.color` | `PROTECT` | `SET_NULL`, `null=True` | Igual para color |

Sin cambios en `PeluchColorImage.color` (ya `CASCADE`) ni en el M2M
`available_colors` (Django limpia las filas intermedias solo). La migración no
modifica datos: las FK existentes permanecen intactas hasta que algo se borre.

### 4.2 Backend — endpoint de uso (admin-only)

Dos endpoints nuevos, solo para staff:

- `GET /colors/<id>/usage/` → `{ "products": N, "photos": M, "orders": K }`
  - `products` = `Peluch.objects.filter(available_colors=color).count()`
  - `photos` = `PeluchColorImage.objects.filter(color=color).count()`
  - `orders` = `OrderItem.objects.filter(color=color).count()`
- `GET /sizes/<id>/usage/` → `{ "products": N, "orders": K }`
  - `products` = `PeluchSizePrice.objects.filter(size=size).count()`
  - `orders` = `OrderItem.objects.filter(size=size).count()`

`404` si el id no existe; `403` si el usuario no es staff. El frontend lo invoca al
pulsar "eliminar", antes de abrir el modal, para construir los bullets de impacto.

### 4.3 Backend — vistas de borrado

`color_detail` y `size_detail` (método DELETE) ya hacen `.delete()`. Tras el cambio
de modelo, ese `.delete()` cascadea correctamente. Único añadido:

- En el borrado de **color**: reunir los ids de `Attachment` de los
  `PeluchColorImage` de ese color, ejecutar `color.delete()` (que cascadea los
  `PeluchColorImage`), y luego borrar esos `Attachment` ya huérfanos (si no, quedan
  filas y archivos sin dueño). Las tallas no tienen imágenes asociadas → sin
  limpieza extra.

### 4.4 Frontend — SweetAlert2 + wrapper de marca

- Instalar `sweetalert2`.
- Módulo reutilizable `lib/utils/confirmDelete.ts`:

  ```ts
  confirmDangerousDelete({
    entity: 'color' | 'talla',
    name: string,        // ej. 'Rubí rojo'
    impact: string[],    // bullets, ej. ['Se quita de 5 productos', 'Se borran 12 fotos']
  }): Promise<boolean>
  ```

  Encapsula:
  - **Tema de marca**: coral/navy/cream, fuentes Quicksand/Nunito, bordes
    redondeados — vía `customClass` de SweetAlert2 + un bloque CSS scoped
    (`.swal-mimittos*`) en `globals.css` usando las variables de marca existentes.
  - **Input de texto** para escribir el nombre.
  - **Type-to-confirm**: el botón "Eliminar" arranca deshabilitado; un listener en
    `didOpen` lo habilita solo cuando el input es **exactamente** `name`.
    `preConfirm` revalida como última barrera.
  - Devuelve `true` si se confirmó, `false` si se canceló.

  El branding vive en un solo lugar → reutilizable en futuras acciones peligrosas.

### 4.5 Frontend — integración

- `globalPresetService`: añadir `getColorUsage(id)` y `getSizeUsage(id)`.
- Tipos: `ColorUsage = { products; photos; orders }`, `SizeUsage = { products; orders }`.
- `PeluchForm.handleDeleteColor` / `handleDeleteSize`: reemplazar `window.confirm`
  por → pedir usage → construir bullets → `await confirmDangerousDelete(...)` → si
  `true`, llamar `deleteColor`/`deleteSize` y actualizar el estado local.
- **Tolerancia a FK null en pedidos**: `OrderItemRead.size` y `.color` pasan a
  `GlobalSize | null` / `GlobalColor | null`. Las vistas de pedido (detalle y
  tracking) muestran talla/color desde `configuration_snapshot.size_label` /
  `color_name` cuando la FK es null.

## 5. Flujo de datos (borrar un color)

1. Admin pulsa la papelera de un color en `PeluchForm`.
2. Frontend → `GET /colors/<id>/usage/` → `{ products, photos, orders }`.
3. Se abre el modal SweetAlert2 con los bullets de impacto (omite los que sean 0).
4. El botón "Eliminar" se habilita solo al escribir el nombre exacto.
5. Al confirmar → `DELETE /colors/<id>/`.
6. Backend: borra `Attachment`s de las `PeluchColorImage` del color → `color.delete()`
   cascadea (M2M, `PeluchColorImage`); `OrderItem.color` queda null.
7. Frontend actualiza `allColors`, `selectedColors` y `colorGallery`.

## 6. Manejo de errores

- Si el endpoint de uso falla: mostrar el modal con texto genérico (sin números) en
  vez de bloquear la acción.
- Si el `DELETE` falla: SweetAlert2 de error con el mensaje del backend.
- `preConfirm` garantiza que un nombre incorrecto nunca dispare el borrado aunque el
  botón se habilitara por error.

## 7. Plan de pruebas

**Backend**
- Borrar un color usado en un producto + con fotos + en un pedido → 204; el producto
  pierde el color, las fotos se borran, `OrderItem.color` queda null, el pedido sigue
  siendo legible (snapshot).
- Borrar una talla con `PeluchSizePrice` + en un pedido → 204; las filas de precio se
  borran, `OrderItem.size` queda null.
- Endpoints de uso: conteos correctos, `403` para no-admin, `404` para id inexistente.
- `OrderItemReadSerializer` renderiza con `size`/`color` FK en null.

**Frontend**
- `confirmDelete`: el botón se habilita solo con el nombre exacto; devuelve `true` al
  confirmar y `false` al cancelar.
- `PeluchForm`: borrar un color dispara el endpoint de uso, el diálogo, y al
  confirmar llama al servicio de borrado.
- `globalPresetService`: tests de `getColorUsage` / `getSizeUsage`.

## 8. Fuera de alcance

- `toggleColor` en `PeluchForm` (deseleccionar un color de *un* producto — acción
  local sin efecto global) conserva su `window.confirm` simple.
- No se crea una página de gestión de presets dedicada; el borrado sigue ocurriendo
  desde los selectores de `PeluchForm`.

## 9. Archivos afectados (estimado)

**Backend**: `models/peluch_size_price.py`, `models/order_item.py`,
`migrations/0013_*.py`, `views/catalog.py`, `urls/` (rutas de usage),
`serializers/order.py` (size/color nullable), `tests/`.

**Frontend**: `package.json`, `lib/utils/confirmDelete.ts` (nuevo),
`app/globals.css`, `lib/services/globalPresetService.ts`, `lib/types.ts`,
`components/admin/PeluchForm.tsx`, vistas de pedido (detalle/tracking),
tests y fixtures.
