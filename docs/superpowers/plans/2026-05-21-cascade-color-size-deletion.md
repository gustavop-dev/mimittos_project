# Cascade Color/Size Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow an admin to hard-delete a global color or size with catalog cascade, preserving order history, behind a branded SweetAlert2 type-to-confirm dialog.

**Architecture:** `PeluchSizePrice.size` becomes `CASCADE` and `OrderItem.size/color` become `SET_NULL` so deletion is unblocked; order history survives via the existing `configuration_snapshot`. New admin usage endpoints feed real impact numbers into a reusable, brand-styled SweetAlert2 wrapper that gates the delete button on typing the exact name.

**Tech Stack:** Django 5 + DRF, Next.js 16 + React + TypeScript, SweetAlert2, pytest, Jest.

---

## Reference notes for the engineer

- **Backend tests run with:** `cd backend && source venv/bin/activate && DJANGO_DB_ENGINE=django.db.backends.sqlite3 pytest <path> -v` — the `mimittos` MySQL user cannot create the pytest test DB, so the SQLite engine override is mandatory.
- **Frontend tests run with:** `cd frontend && npx jest <path>`.
- The permission pattern in `views/catalog.py` is `@permission_classes([AllowAny])` followed by a manual `if not request.user.is_authenticated or not request.user.is_staff` check. Follow it exactly for new views.
- Test factories live in `backend/base_feature_app/tests/factories.py`: `GlobalColorFactory`, `GlobalSizeFactory`, `PeluchFactory` (accepts `colors=[...]`), `PeluchSizePriceFactory`, `PeluchColorImageFactory`, `OrderItemFactory`.
- Brand CSS variables (in `frontend/app/globals.css`): `--coral`, `--terracotta`, `--navy`, `--cream-warm`, `--gray-warm`, `--radius-sm`, `--radius-md`. Heading font is `Quicksand`, body font `Nunito`.

---

## Task 1: Backend — model `on_delete` changes + migration

**Files:**
- Modify: `backend/base_feature_app/models/peluch_size_price.py:10`
- Modify: `backend/base_feature_app/models/order_item.py:19-20`
- Create: `backend/base_feature_app/migrations/0013_cascade_color_size_deletion.py` (generated)
- Test: `backend/base_feature_app/tests/views/test_color_size_deletion.py` (new)

- [ ] **Step 1: Write the failing tests**

Create `backend/base_feature_app/tests/views/test_color_size_deletion.py`:

```python
import pytest

from base_feature_app.models import OrderItem, PeluchSizePrice
from base_feature_app.tests.factories import (
    GlobalColorFactory,
    GlobalSizeFactory,
    OrderItemFactory,
    PeluchFactory,
    PeluchSizePriceFactory,
)


@pytest.mark.django_db
def test_deleting_size_removes_its_size_prices(admin_client):
    size_price = PeluchSizePriceFactory()
    size = size_price.size

    response = admin_client.delete(f'/api/sizes/{size.id}/')

    assert response.status_code == 204
    assert not PeluchSizePrice.objects.filter(pk=size_price.pk).exists()


@pytest.mark.django_db
def test_deleting_size_nullifies_order_item_size(admin_client):
    order_item = OrderItemFactory()
    size = order_item.size

    response = admin_client.delete(f'/api/sizes/{size.id}/')

    assert response.status_code == 204
    order_item.refresh_from_db()
    assert order_item.size_id is None
    assert OrderItem.objects.filter(pk=order_item.pk).exists()


@pytest.mark.django_db
def test_deleting_color_nullifies_order_item_color(admin_client):
    order_item = OrderItemFactory()
    color = order_item.color

    response = admin_client.delete(f'/api/colors/{color.id}/')

    assert response.status_code == 204
    order_item.refresh_from_db()
    assert order_item.color_id is None
    assert OrderItem.objects.filter(pk=order_item.pk).exists()


@pytest.mark.django_db
def test_deleting_color_removes_it_from_products(admin_client):
    color = GlobalColorFactory()
    peluch = PeluchFactory(colors=[color])

    response = admin_client.delete(f'/api/colors/{color.id}/')

    assert response.status_code == 204
    assert not peluch.available_colors.filter(pk=color.pk).exists()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && source venv/bin/activate && DJANGO_DB_ENGINE=django.db.backends.sqlite3 pytest base_feature_app/tests/views/test_color_size_deletion.py -v`
Expected: `test_deleting_size_*` and `test_deleting_color_nullifies_order_item_color` FAIL (HTTP 500 — `ProtectedError`). `test_deleting_color_removes_it_from_products` may already PASS.

- [ ] **Step 3: Change `PeluchSizePrice.size` to CASCADE**

In `backend/base_feature_app/models/peluch_size_price.py`, line 10:

```python
    size = models.ForeignKey(GlobalSize, on_delete=models.CASCADE, related_name='peluch_prices')
```

- [ ] **Step 4: Change `OrderItem.size` and `OrderItem.color` to SET_NULL**

In `backend/base_feature_app/models/order_item.py`, lines 19-20:

```python
    size = models.ForeignKey(
        GlobalSize, null=True, blank=True, on_delete=models.SET_NULL, related_name='order_items'
    )
    color = models.ForeignKey(
        GlobalColor, null=True, blank=True, on_delete=models.SET_NULL, related_name='order_items'
    )
```

- [ ] **Step 5: Generate the migration**

Run: `cd backend && source venv/bin/activate && python manage.py makemigrations base_feature_app --name cascade_color_size_deletion`
Expected: creates `0013_cascade_color_size_deletion.py` with 3 `AlterField` operations (`peluchsizeprice.size`, `orderitem.size`, `orderitem.color`).

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && source venv/bin/activate && DJANGO_DB_ENGINE=django.db.backends.sqlite3 pytest base_feature_app/tests/views/test_color_size_deletion.py -v`
Expected: all 4 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/base_feature_app/models/peluch_size_price.py backend/base_feature_app/models/order_item.py backend/base_feature_app/migrations/0013_cascade_color_size_deletion.py backend/base_feature_app/tests/views/test_color_size_deletion.py
git commit -m "feat(backend): cascade color/size deletion, nullify order item FKs"
```

---

## Task 2: Backend — color delete cleans up orphaned attachments

**Files:**
- Modify: `backend/base_feature_app/views/catalog.py` (`color_detail`, DELETE branch)
- Test: `backend/base_feature_app/tests/views/test_color_size_deletion.py`

- [ ] **Step 1: Write the failing test**

Append to `backend/base_feature_app/tests/views/test_color_size_deletion.py`:

```python
from django_attachments.models import Attachment

from base_feature_app.models import PeluchColorImage
from base_feature_app.tests.factories import PeluchColorImageFactory


@pytest.mark.django_db
def test_deleting_color_removes_its_color_image_attachments(admin_client):
    color_image = PeluchColorImageFactory()
    color = color_image.color
    attachment_id = color_image.attachment_id

    response = admin_client.delete(f'/api/colors/{color.id}/')

    assert response.status_code == 204
    assert not PeluchColorImage.objects.filter(pk=color_image.pk).exists()
    assert not Attachment.objects.filter(pk=attachment_id).exists()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && source venv/bin/activate && DJANGO_DB_ENGINE=django.db.backends.sqlite3 pytest base_feature_app/tests/views/test_color_size_deletion.py::test_deleting_color_removes_its_color_image_attachments -v`
Expected: FAIL — `Attachment` still exists (the `PeluchColorImage` cascades, but the `Attachment` row is orphaned).

- [ ] **Step 3: Update the `color_detail` DELETE branch**

In `backend/base_feature_app/views/catalog.py`, find the `color_detail` view's DELETE branch:

```python
    if request.method == 'DELETE':
        color.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
```

Replace it with:

```python
    if request.method == 'DELETE':
        attachment_ids = list(
            PeluchColorImage.objects.filter(color=color).values_list('attachment_id', flat=True)
        )
        color.delete()
        Attachment.objects.filter(id__in=attachment_ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
```

`PeluchColorImage` and `Attachment` are already imported at the top of `catalog.py`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && source venv/bin/activate && DJANGO_DB_ENGINE=django.db.backends.sqlite3 pytest base_feature_app/tests/views/test_color_size_deletion.py -v`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/base_feature_app/views/catalog.py backend/base_feature_app/tests/views/test_color_size_deletion.py
git commit -m "feat(backend): delete orphaned color-image attachments on color delete"
```

---

## Task 3: Backend — color/size usage endpoints

**Files:**
- Modify: `backend/base_feature_app/views/catalog.py` (add 2 views + 1 import line)
- Modify: `backend/base_feature_app/urls/catalog.py` (add 2 routes)
- Test: `backend/base_feature_app/tests/views/test_color_size_deletion.py`

- [ ] **Step 1: Write the failing tests**

Append to `backend/base_feature_app/tests/views/test_color_size_deletion.py`:

```python
@pytest.mark.django_db
def test_color_usage_returns_counts(admin_client):
    color = GlobalColorFactory()
    PeluchFactory(colors=[color])
    PeluchColorImageFactory(color=color, peluch=PeluchFactory(colors=[color]))
    OrderItemFactory(color=color)

    response = admin_client.get(f'/api/colors/{color.id}/usage/')

    assert response.status_code == 200
    assert response.data['products'] == 2
    assert response.data['photos'] == 1
    assert response.data['orders'] == 1


@pytest.mark.django_db
def test_color_usage_returns_403_for_anonymous(api_client):
    color = GlobalColorFactory()
    response = api_client.get(f'/api/colors/{color.id}/usage/')
    assert response.status_code == 403


@pytest.mark.django_db
def test_color_usage_returns_404_for_unknown_id(admin_client):
    response = admin_client.get('/api/colors/999999/usage/')
    assert response.status_code == 404


@pytest.mark.django_db
def test_size_usage_returns_counts(admin_client):
    size = GlobalSizeFactory()
    PeluchSizePriceFactory(size=size)
    OrderItemFactory(size=size)

    response = admin_client.get(f'/api/sizes/{size.id}/usage/')

    assert response.status_code == 200
    assert response.data['products'] == 1
    assert response.data['orders'] == 1


@pytest.mark.django_db
def test_size_usage_returns_403_for_anonymous(api_client):
    size = GlobalSizeFactory()
    response = api_client.get(f'/api/sizes/{size.id}/usage/')
    assert response.status_code == 403
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && source venv/bin/activate && DJANGO_DB_ENGINE=django.db.backends.sqlite3 pytest base_feature_app/tests/views/test_color_size_deletion.py -k usage -v`
Expected: FAIL with 404 (routes do not exist).

- [ ] **Step 3: Add `OrderItem` and `PeluchSizePrice` to the catalog views import**

In `backend/base_feature_app/views/catalog.py`, change the model import line:

```python
from base_feature_app.models import (
    Peluch, Category, GlobalSize, GlobalColor, PeluchColorImage, PeluchSizePrice, OrderItem,
)
```

- [ ] **Step 4: Add the two usage views**

In `backend/base_feature_app/views/catalog.py`, add after the `color_detail` view:

```python
@api_view(['GET'])
@permission_classes([AllowAny])
def color_usage(request, color_id: int):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        color = GlobalColor.objects.get(pk=color_id)
    except GlobalColor.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        'products': Peluch.objects.filter(available_colors=color).count(),
        'photos': PeluchColorImage.objects.filter(color=color).count(),
        'orders': OrderItem.objects.filter(color=color).count(),
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def size_usage(request, size_id: int):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        size = GlobalSize.objects.get(pk=size_id)
    except GlobalSize.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        'products': PeluchSizePrice.objects.filter(size=size).count(),
        'orders': OrderItem.objects.filter(size=size).count(),
    })
```

- [ ] **Step 5: Add the URL routes**

In `backend/base_feature_app/urls/catalog.py`, add two routes right after their `detail` siblings:

```python
    path('sizes/<int:size_id>/', catalog.size_detail, name='size-detail'),
    path('sizes/<int:size_id>/usage/', catalog.size_usage, name='size-usage'),
    path('colors/', catalog.colors_list, name='colors-list'),
    path('colors/<int:color_id>/', catalog.color_detail, name='color-detail'),
    path('colors/<int:color_id>/usage/', catalog.color_usage, name='color-usage'),
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && source venv/bin/activate && DJANGO_DB_ENGINE=django.db.backends.sqlite3 pytest base_feature_app/tests/views/test_color_size_deletion.py -v`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/base_feature_app/views/catalog.py backend/base_feature_app/urls/catalog.py backend/base_feature_app/tests/views/test_color_size_deletion.py
git commit -m "feat(backend): add color/size usage endpoints for admin delete warning"
```

---

## Task 4: Frontend — install SweetAlert2 + brand CSS

**Files:**
- Modify: `frontend/package.json` (via npm)
- Modify: `frontend/app/globals.css` (append brand block)

- [ ] **Step 1: Install SweetAlert2**

Run: `cd frontend && npm install sweetalert2`
Expected: `sweetalert2` added to `dependencies` in `package.json`.

- [ ] **Step 2: Append the brand CSS block to `globals.css`**

Append to the end of `frontend/app/globals.css`:

```css
/* ── SweetAlert2 — MIMITTOS branding ──────────────────────── */
.swal-mimittos {
  border-radius: var(--radius-md);
  font-family: 'Nunito', ui-sans-serif, system-ui, sans-serif;
  background: var(--cream-warm);
}
.swal-mimittos .swal2-title {
  font-family: 'Quicksand', sans-serif;
  font-weight: 700;
  color: var(--navy);
}
.swal-mimittos .swal2-html-container {
  color: var(--gray-warm);
}
.swal-mimittos-input {
  border-radius: var(--radius-sm) !important;
  border: 1.5px solid rgba(27, 42, 74, .15) !important;
  box-shadow: none !important;
}
.swal-mimittos-confirm {
  background: var(--terracotta) !important;
  border-radius: 999px !important;
  font-family: 'Quicksand', sans-serif !important;
  font-weight: 700 !important;
}
.swal-mimittos-cancel {
  background: #fff !important;
  color: var(--navy) !important;
  border: 1.5px solid rgba(27, 42, 74, .15) !important;
  border-radius: 999px !important;
  font-family: 'Quicksand', sans-serif !important;
  font-weight: 700 !important;
}
```

- [ ] **Step 3: Verify the build is not broken**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: same count as before this task (no new errors — installing a package and adding CSS introduces none).

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/app/globals.css
git commit -m "chore(frontend): install sweetalert2 and add MIMITTOS dialog styling"
```

---

## Task 5: Frontend — `confirmDelete` wrapper module

**Files:**
- Create: `frontend/lib/utils/confirmDelete.ts`
- Test: `frontend/lib/utils/__tests__/confirmDelete.test.ts` (new)

- [ ] **Step 1: Write the failing tests**

Create `frontend/lib/utils/__tests__/confirmDelete.test.ts`:

```typescript
import {
  isConfirmationValid,
  buildColorImpact,
  buildSizeImpact,
  confirmDangerousDelete,
} from '../confirmDelete'
import Swal from 'sweetalert2'

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}))

const mockFire = Swal.fire as jest.Mock

describe('isConfirmationValid', () => {
  it('returns true when the input matches the name exactly', () => {
    expect(isConfirmationValid('Rubí rojo', 'Rubí rojo')).toBe(true)
  })

  it('returns true ignoring surrounding whitespace', () => {
    expect(isConfirmationValid('  Rubí rojo  ', 'Rubí rojo')).toBe(true)
  })

  it('returns false when the input does not match', () => {
    expect(isConfirmationValid('rubi rojo', 'Rubí rojo')).toBe(false)
  })
})

describe('buildColorImpact', () => {
  it('lists products, photos and orders when all are non-zero', () => {
    expect(buildColorImpact({ products: 5, photos: 12, orders: 3 })).toEqual([
      'Se quitará de 5 producto(s)',
      'Se borrarán 12 foto(s) de color',
      '3 pedido(s) conservarán el nombre como texto',
    ])
  })

  it('omits lines whose count is zero', () => {
    expect(buildColorImpact({ products: 0, photos: 0, orders: 0 })).toEqual([])
  })
})

describe('buildSizeImpact', () => {
  it('lists products and orders when non-zero', () => {
    expect(buildSizeImpact({ products: 4, orders: 2 })).toEqual([
      'Se quitará de 4 producto(s)',
      '2 pedido(s) conservarán la talla como texto',
    ])
  })
})

describe('confirmDangerousDelete', () => {
  beforeEach(() => mockFire.mockReset())

  it('returns true when the dialog is confirmed', async () => {
    mockFire.mockResolvedValue({ isConfirmed: true })
    const result = await confirmDangerousDelete({ entity: 'color', name: 'Rubí rojo', impact: [] })
    expect(result).toBe(true)
  })

  it('returns false when the dialog is dismissed', async () => {
    mockFire.mockResolvedValue({ isConfirmed: false })
    const result = await confirmDangerousDelete({ entity: 'color', name: 'Rubí rojo', impact: [] })
    expect(result).toBe(false)
  })

  it('passes a text input and the item name in the title', async () => {
    mockFire.mockResolvedValue({ isConfirmed: false })
    await confirmDangerousDelete({ entity: 'talla', name: 'Mediano', impact: [] })
    const config = mockFire.mock.calls[0][0]
    expect(config.input).toBe('text')
    expect(config.title).toContain('Mediano')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx jest lib/utils/__tests__/confirmDelete.test.ts`
Expected: FAIL — `../confirmDelete` does not exist.

- [ ] **Step 3: Add the `ColorUsage` / `SizeUsage` types**

In `frontend/lib/types.ts`, add after the `GlobalColor` type definition (these are the single canonical definitions — no other file redefines them):

```typescript
export type ColorUsage = {
  products: number
  photos: number
  orders: number
}

export type SizeUsage = {
  products: number
  orders: number
}
```

- [ ] **Step 4: Create the wrapper module**

Create `frontend/lib/utils/confirmDelete.ts`:

```typescript
import Swal from 'sweetalert2'

import type { ColorUsage, SizeUsage } from '../types'

interface ConfirmDeleteArgs {
  entity: 'color' | 'talla'
  name: string
  impact: string[]
}

export function isConfirmationValid(input: string, name: string): boolean {
  return input.trim() === name.trim()
}

export function buildColorImpact(usage: ColorUsage): string[] {
  const lines: string[] = []
  if (usage.products > 0) lines.push(`Se quitará de ${usage.products} producto(s)`)
  if (usage.photos > 0) lines.push(`Se borrarán ${usage.photos} foto(s) de color`)
  if (usage.orders > 0) lines.push(`${usage.orders} pedido(s) conservarán el nombre como texto`)
  return lines
}

export function buildSizeImpact(usage: SizeUsage): string[] {
  const lines: string[] = []
  if (usage.products > 0) lines.push(`Se quitará de ${usage.products} producto(s)`)
  if (usage.orders > 0) lines.push(`${usage.orders} pedido(s) conservarán la talla como texto`)
  return lines
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function confirmDangerousDelete({ entity, name, impact }: ConfirmDeleteArgs): Promise<boolean> {
  const safeName = escapeHtml(name)
  const impactHtml = impact.length > 0
    ? `<ul style="text-align:left;margin:12px 0;padding-left:18px">${
        impact.map((line) => `<li>${escapeHtml(line)}</li>`).join('')
      }</ul>`
    : '<p>Este color/talla no está en uso. Se puede eliminar de forma segura.</p>'

  const result = await Swal.fire({
    title: `Eliminar ${entity} «${name}»`,
    html: `${impactHtml}<p style="margin-top:8px">Para confirmar, escribe <b>${safeName}</b>:</p>`,
    icon: 'warning',
    input: 'text',
    inputPlaceholder: name,
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    customClass: {
      popup: 'swal-mimittos',
      input: 'swal-mimittos-input',
      confirmButton: 'swal-mimittos-confirm',
      cancelButton: 'swal-mimittos-cancel',
    },
    didOpen: () => {
      const confirmButton = Swal.getConfirmButton()
      const input = Swal.getInput()
      if (!confirmButton || !input) return
      confirmButton.disabled = true
      input.addEventListener('input', () => {
        confirmButton.disabled = !isConfirmationValid(input.value, name)
      })
    },
    preConfirm: (value: string) => {
      if (!isConfirmationValid(value ?? '', name)) {
        Swal.showValidationMessage('El nombre no coincide.')
        return false
      }
      return true
    },
  })

  return result.isConfirmed === true
}

export function notifyDeleteError(message: string): Promise<unknown> {
  return Swal.fire({
    title: 'No se pudo eliminar',
    text: message,
    icon: 'error',
    confirmButtonText: 'Entendido',
    customClass: { popup: 'swal-mimittos', confirmButton: 'swal-mimittos-confirm' },
  })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx jest lib/utils/__tests__/confirmDelete.test.ts`
Expected: all tests PASS.

> Note: the `didOpen` button-disabling behaviour (button stays disabled until the exact name is typed) runs inside SweetAlert2 and is verified manually / via E2E, not in jsdom — the pure `isConfirmationValid` it delegates to is fully unit-tested above.

- [ ] **Step 6: Commit**

```bash
git add frontend/lib/types.ts frontend/lib/utils/confirmDelete.ts frontend/lib/utils/__tests__/confirmDelete.test.ts
git commit -m "feat(frontend): branded SweetAlert2 type-to-confirm delete wrapper"
```

---

## Task 6: Frontend — usage service methods + types

**Files:**
- Modify: `frontend/lib/services/globalPresetService.ts`
- Test: `frontend/lib/services/__tests__/globalPresetService.test.ts` (new)

- [ ] **Step 1: Write the failing tests**

Create `frontend/lib/services/__tests__/globalPresetService.test.ts`:

```typescript
import { globalPresetService } from '../globalPresetService'
import { api } from '../http'

jest.mock('../http', () => ({
  api: { get: jest.fn() },
}))

const mockGet = api.get as jest.Mock

describe('globalPresetService usage queries', () => {
  beforeEach(() => mockGet.mockReset())

  it('fetches color usage from the colors usage endpoint', async () => {
    const usage = { products: 5, photos: 12, orders: 3 }
    mockGet.mockResolvedValue({ data: usage })

    const result = await globalPresetService.getColorUsage(7)

    expect(mockGet).toHaveBeenCalledWith('/colors/7/usage/')
    expect(result).toEqual(usage)
  })

  it('fetches size usage from the sizes usage endpoint', async () => {
    const usage = { products: 4, orders: 2 }
    mockGet.mockResolvedValue({ data: usage })

    const result = await globalPresetService.getSizeUsage(9)

    expect(mockGet).toHaveBeenCalledWith('/sizes/9/usage/')
    expect(result).toEqual(usage)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx jest lib/services/__tests__/globalPresetService.test.ts`
Expected: FAIL — `getColorUsage` / `getSizeUsage` are not functions.

- [ ] **Step 3: Add the service methods**

In `frontend/lib/services/globalPresetService.ts`, update the import line and add two methods inside the `globalPresetService` object (place them right after `deleteColor`):

Change the import line at the top to:

```typescript
import type { ColorUsage, GlobalColor, GlobalSize, SizeUsage } from '../types'
```

Add inside the object, after `deleteColor: (id: number) => api.delete(`/colors/${id}/`),`:

```typescript
  getColorUsage: (id: number) =>
    api.get<ColorUsage>(`/colors/${id}/usage/`).then((r) => r.data),
  getSizeUsage: (id: number) =>
    api.get<SizeUsage>(`/sizes/${id}/usage/`).then((r) => r.data),
```

> The `ColorUsage` / `SizeUsage` types were already added to `types.ts` in Task 5, Step 3. This task only consumes them.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx jest lib/services/__tests__/globalPresetService.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/services/globalPresetService.ts frontend/lib/services/__tests__/globalPresetService.test.ts
git commit -m "feat(frontend): add color/size usage service methods"
```

---

## Task 7: Frontend — wire SweetAlert2 confirm into `PeluchForm`

**Files:**
- Modify: `frontend/components/admin/PeluchForm.tsx` (`handleDeleteColor`, `handleDeleteSize`, imports)
- Test: `frontend/components/admin/__tests__/PeluchForm.test.tsx`

- [ ] **Step 1: Write the failing test**

In `frontend/components/admin/__tests__/PeluchForm.test.tsx`, add this module mock next to the existing `jest.mock` calls (near the top, before the imports):

```typescript
jest.mock('@/lib/utils/confirmDelete', () => ({
  confirmDangerousDelete: jest.fn(),
  buildColorImpact: jest.fn(() => []),
  buildSizeImpact: jest.fn(() => []),
  notifyDeleteError: jest.fn(),
}))
```

Add `getColorUsage` and `getSizeUsage` to the existing `globalPresetService` mock object:

```typescript
jest.mock('@/lib/services/globalPresetService', () => ({
  globalPresetService: {
    createColor: jest.fn(),
    createSize: jest.fn(),
    deleteColor: jest.fn(),
    deleteSize: jest.fn(),
    getColorUsage: jest.fn(),
    getSizeUsage: jest.fn(),
  },
}))
```

Add this test inside the existing `describe('PeluchForm', ...)` block:

```typescript
it('deletes a color after the SweetAlert2 confirmation resolves true', async () => {
  const { globalPresetService } = require('@/lib/services/globalPresetService')
  const { confirmDangerousDelete } = require('@/lib/utils/confirmDelete')
  const { peluchService } = require('@/lib/services/peluchService')

  peluchService.getCategories.mockResolvedValue([])
  peluchService.getSizes.mockResolvedValue([])
  peluchService.getColors.mockResolvedValue([
    { id: 1, name: 'Coral', slug: 'coral', hex_code: '#FF6B6B', sort_order: 1 },
  ])
  globalPresetService.getColorUsage.mockResolvedValue({ products: 2, photos: 3, orders: 0 })
  confirmDangerousDelete.mockResolvedValue(true)
  globalPresetService.deleteColor.mockResolvedValue(undefined)

  render(<PeluchForm />)

  const deleteButton = await screen.findByTitle('Eliminar este color globalmente')
  await userEvent.click(deleteButton)

  await waitFor(() => {
    expect(globalPresetService.getColorUsage).toHaveBeenCalledWith(1)
    expect(confirmDangerousDelete).toHaveBeenCalled()
    expect(globalPresetService.deleteColor).toHaveBeenCalledWith(1)
  })
})

it('does not delete a color when the confirmation resolves false', async () => {
  const { globalPresetService } = require('@/lib/services/globalPresetService')
  const { confirmDangerousDelete } = require('@/lib/utils/confirmDelete')
  const { peluchService } = require('@/lib/services/peluchService')

  peluchService.getCategories.mockResolvedValue([])
  peluchService.getSizes.mockResolvedValue([])
  peluchService.getColors.mockResolvedValue([
    { id: 1, name: 'Coral', slug: 'coral', hex_code: '#FF6B6B', sort_order: 1 },
  ])
  globalPresetService.getColorUsage.mockResolvedValue({ products: 0, photos: 0, orders: 0 })
  confirmDangerousDelete.mockResolvedValue(false)

  render(<PeluchForm />)

  const deleteButton = await screen.findByTitle('Eliminar este color globalmente')
  await userEvent.click(deleteButton)

  await waitFor(() => expect(confirmDangerousDelete).toHaveBeenCalled())
  expect(globalPresetService.deleteColor).not.toHaveBeenCalled()
})
```

> Confirm `render`, `screen`, `waitFor`, `userEvent` are imported at the top of the file — they are already used by existing tests.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx jest components/admin/__tests__/PeluchForm.test.tsx`
Expected: the two new tests FAIL — `handleDeleteColor` still uses `window.confirm`, so `getColorUsage` / `confirmDangerousDelete` are never called.

- [ ] **Step 3: Update the imports in `PeluchForm.tsx`**

In `frontend/components/admin/PeluchForm.tsx`, add this import near the other service imports (after the `globalPresetService` import):

```typescript
import { buildColorImpact, buildSizeImpact, confirmDangerousDelete, notifyDeleteError } from '@/lib/utils/confirmDelete'
```

- [ ] **Step 4: Replace `handleDeleteColor`**

In `frontend/components/admin/PeluchForm.tsx`, replace the whole `handleDeleteColor` function:

```typescript
  async function handleDeleteColor(id: number, name: string) {
    let impact: string[] = []
    try {
      impact = buildColorImpact(await globalPresetService.getColorUsage(id))
    } catch {
      impact = []
    }
    const confirmed = await confirmDangerousDelete({ entity: 'color', name, impact })
    if (!confirmed) return
    try {
      const color = allColors.find((c) => c.id === id)
      await globalPresetService.deleteColor(id)
      setAllColors((prev) => prev.filter((c) => c.id !== id))
      setSelectedColors((prev) => prev.filter((c) => c !== id))
      if (color) setColorGallery((prev) => { const n = { ...prev }; delete n[color.slug]; return n })
    } catch {
      await notifyDeleteError('No se pudo eliminar el color.')
    }
  }
```

- [ ] **Step 5: Replace `handleDeleteSize`**

Replace the whole `handleDeleteSize` function:

```typescript
  async function handleDeleteSize(size_id: number, label: string) {
    let impact: string[] = []
    try {
      impact = buildSizeImpact(await globalPresetService.getSizeUsage(size_id))
    } catch {
      impact = []
    }
    const confirmed = await confirmDangerousDelete({ entity: 'talla', name: label, impact })
    if (!confirmed) return
    try {
      await globalPresetService.deleteSize(size_id)
      setSizePrices((prev) => prev.filter((r) => r.size_id !== size_id))
    } catch {
      await notifyDeleteError('No se pudo eliminar la talla.')
    }
  }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx jest components/admin/__tests__/PeluchForm.test.tsx`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/components/admin/PeluchForm.tsx frontend/components/admin/__tests__/PeluchForm.test.tsx
git commit -m "feat(frontend): use SweetAlert2 type-to-confirm for color/size deletion"
```

---

## Task 8: Order pages — tolerate null size/color FK

**Files:**
- Create: `frontend/lib/utils/orderItemDisplay.ts`
- Modify: `frontend/lib/types.ts` (`OrderItemRead.size`, `.color`)
- Modify: `frontend/app/tracking/page.tsx:59`
- Modify: `frontend/app/backoffice/pedidos/page.tsx:310,312`
- Test: `frontend/lib/utils/__tests__/orderItemDisplay.test.ts` (new)
- Test: `backend/base_feature_app/tests/serializers/test_order_serializer.py`

- [ ] **Step 1: Write the failing frontend test**

Create `frontend/lib/utils/__tests__/orderItemDisplay.test.ts`:

```typescript
import { itemSizeLabel, itemSizeCm, itemColorName, itemColorHex } from '../orderItemDisplay'
import type { OrderItemRead } from '../../types'

const baseItem = {
  id: 1, peluch_title: 'Osito', peluch_slug: 'osito', quantity: 1, unit_price: 1000,
  personalization_cost: 0, line_total: 1000, has_huella: false, huella_type: '',
  huella_text: '', huella_media_url: null, has_corazon: false, corazon_phrase: '',
  has_audio: false, audio_media_url: null, audio_duration_sec: null, audio_size_kb: null,
} as const

it('uses the live FK when size is present', () => {
  const item = {
    ...baseItem,
    size: { id: 1, label: 'Mediano', slug: 'mediano', cm: '35cm', sort_order: 1 },
    color: { id: 1, name: 'Rubí rojo', slug: 'rubi-rojo', hex_code: '#C0182B', sort_order: 1 },
    configuration_snapshot: {},
  } as OrderItemRead
  expect(itemSizeLabel(item)).toBe('Mediano')
  expect(itemColorName(item)).toBe('Rubí rojo')
})

it('falls back to the snapshot when the size FK is null', () => {
  const item = {
    ...baseItem,
    size: null,
    color: null,
    configuration_snapshot: { size_label: 'Mediano', size_cm: '35cm', color_name: 'Rubí rojo', color_hex: '#C0182B' },
  } as OrderItemRead
  expect(itemSizeLabel(item)).toBe('Mediano')
  expect(itemSizeCm(item)).toBe('35cm')
  expect(itemColorName(item)).toBe('Rubí rojo')
  expect(itemColorHex(item)).toBe('#C0182B')
})

it('returns a dash when neither FK nor snapshot has the value', () => {
  const item = { ...baseItem, size: null, color: null, configuration_snapshot: {} } as OrderItemRead
  expect(itemSizeLabel(item)).toBe('—')
  expect(itemColorName(item)).toBe('—')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx jest lib/utils/__tests__/orderItemDisplay.test.ts`
Expected: FAIL — `../orderItemDisplay` does not exist.

- [ ] **Step 3: Make `OrderItemRead.size` / `.color` nullable**

In `frontend/lib/types.ts`, in the `OrderItemRead` type, change:

```typescript
  size: GlobalSize | null
  color: GlobalColor | null
```

- [ ] **Step 4: Create the display helper**

Create `frontend/lib/utils/orderItemDisplay.ts`:

```typescript
import type { OrderItemRead } from '../types'

function snap(item: OrderItemRead, key: string): string {
  const value = item.configuration_snapshot?.[key]
  return typeof value === 'string' ? value : ''
}

export function itemSizeLabel(item: OrderItemRead): string {
  return item.size?.label || snap(item, 'size_label') || '—'
}

export function itemSizeCm(item: OrderItemRead): string {
  return item.size?.cm || snap(item, 'size_cm') || ''
}

export function itemColorName(item: OrderItemRead): string {
  return item.color?.name || snap(item, 'color_name') || '—'
}

export function itemColorHex(item: OrderItemRead): string {
  return item.color?.hex_code || snap(item, 'color_hex') || '#cccccc'
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd frontend && npx jest lib/utils/__tests__/orderItemDisplay.test.ts`
Expected: all tests PASS.

- [ ] **Step 6: Use the helper in `tracking/page.tsx`**

In `frontend/app/tracking/page.tsx`, add the import near the top:

```typescript
import { itemSizeLabel, itemSizeCm, itemColorName } from '@/lib/utils/orderItemDisplay'
```

Replace line 59:

```tsx
            Talla: <strong>{item.size.label}</strong> ({item.size.cm}) · Color: <strong>{item.color.name}</strong>
```

with:

```tsx
            Talla: <strong>{itemSizeLabel(item)}</strong> ({itemSizeCm(item)}) · Color: <strong>{itemColorName(item)}</strong>
```

- [ ] **Step 7: Use the helper in `backoffice/pedidos/page.tsx`**

In `frontend/app/backoffice/pedidos/page.tsx`, add the import near the top:

```typescript
import { itemSizeLabel, itemSizeCm, itemColorName, itemColorHex } from '@/lib/utils/orderItemDisplay'
```

Replace line 310:

```tsx
            <span>Talla: {item.size.label} · {item.size.cm}</span>
```

with:

```tsx
            <span>Talla: {itemSizeLabel(item)} · {itemSizeCm(item)}</span>
```

Replace line 312 (the color span — the `background` reads `item.color.hex_code` and the trailing text reads `item.color.name`):

```tsx
              Color: <span style={{ width: 12, height: 12, borderRadius: '50%', background: item.color.hex_code, border: '1px solid rgba(27,42,74,.15)', display: 'inline-block' }} /> {item.color.name}
```

with:

```tsx
              Color: <span style={{ width: 12, height: 12, borderRadius: '50%', background: itemColorHex(item), border: '1px solid rgba(27,42,74,.15)', display: 'inline-block' }} /> {itemColorName(item)}
```

- [ ] **Step 8: Write the backend serializer test**

In `backend/base_feature_app/tests/serializers/test_order_serializer.py`, add (check that `OrderItemReadSerializer` and `OrderItemFactory` are importable — add the imports if missing):

```python
import pytest

from base_feature_app.serializers.order import OrderItemReadSerializer
from base_feature_app.tests.factories import OrderItemFactory


@pytest.mark.django_db
def test_order_item_serializer_returns_null_for_deleted_size():
    item = OrderItemFactory()
    item.size = None
    item.save()

    data = OrderItemReadSerializer(item).data

    assert data['size'] is None


@pytest.mark.django_db
def test_order_item_serializer_returns_null_for_deleted_color():
    item = OrderItemFactory()
    item.color = None
    item.save()

    data = OrderItemReadSerializer(item).data

    assert data['color'] is None
```

- [ ] **Step 9: Run all tests for this task**

Run: `cd frontend && npx jest lib/utils/__tests__/orderItemDisplay.test.ts`
Expected: PASS.

Run: `cd backend && source venv/bin/activate && DJANGO_DB_ENGINE=django.db.backends.sqlite3 pytest base_feature_app/tests/serializers/test_order_serializer.py -v`
Expected: PASS (the serializer needs no code change — a read-only nested serializer field emits `null` for a null relation).

- [ ] **Step 10: Commit**

```bash
git add frontend/lib/utils/orderItemDisplay.ts frontend/lib/utils/__tests__/orderItemDisplay.test.ts frontend/lib/types.ts frontend/app/tracking/page.tsx frontend/app/backoffice/pedidos/page.tsx backend/base_feature_app/tests/serializers/test_order_serializer.py
git commit -m "feat: tolerate null size/color FK on order items, fall back to snapshot"
```

---

## Task 9: Full verification + flow audit

- [ ] **Step 1: Run the full affected backend test set**

Run: `cd backend && source venv/bin/activate && DJANGO_DB_ENGINE=django.db.backends.sqlite3 pytest base_feature_app/tests/views/test_color_size_deletion.py base_feature_app/tests/views/test_catalog_gallery_views.py base_feature_app/tests/serializers/test_order_serializer.py -v`
Expected: all PASS.

- [ ] **Step 2: Run the full affected frontend test set**

Run: `cd frontend && npx jest lib/utils/__tests__/confirmDelete.test.ts lib/utils/__tests__/orderItemDisplay.test.ts lib/services/__tests__/globalPresetService.test.ts components/admin/__tests__/PeluchForm.test.tsx`
Expected: all PASS.

- [ ] **Step 3: Typecheck + lint the frontend**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: no increase in error count versus the pre-feature baseline.

Run: `cd frontend && npx eslint lib/utils/confirmDelete.ts lib/utils/orderItemDisplay.ts lib/services/globalPresetService.ts components/admin/PeluchForm.tsx app/tracking/page.tsx app/backoffice/pedidos/page.tsx`
Expected: no new errors.

- [ ] **Step 4: Manual browser verification**

Start backend (`python manage.py runserver 0.0.0.0:8000`) and frontend (`npm run dev`). In the backoffice peluch form: try to delete a size used by products → the SweetAlert2 dialog shows real counts; the "Eliminar" button stays disabled until the exact name is typed; confirming removes the size from all products. Repeat for a color, confirming its photos are removed. Open an order whose color/size was deleted → the order still shows the color/size name from the snapshot.

- [ ] **Step 5: Run the E2E user-flows audit**

Per `CLAUDE.md`, this change touches a backoffice user flow (deleting colors/sizes). Invoke the `e2e-user-flows-check` skill and address any gap it reports.

- [ ] **Step 6: Update memory docs**

Update `tasks/active_context.md` and `docs/methodology/error-documentation.md` (or `lessons-learned.md`) with a short note on the cascade-deletion behaviour and the SweetAlert2 wrapper.

---

## Self-review notes

- **Spec coverage:** §4.1 model+migration → Task 1; §4.2 usage endpoints → Task 3; §4.3 attachment cleanup → Task 2; §4.4 SweetAlert2 + brand CSS → Tasks 4-5; §4.5 service/types/PeluchForm/order null-tolerance → Tasks 6-8; §7 tests → every task; §8 out-of-scope (`toggleColor`) untouched — confirmed no task changes it.
- **Type consistency:** `ColorUsage`/`SizeUsage` are defined exactly once, in `types.ts` (Task 5, Step 3); `confirmDelete.ts` and `globalPresetService.ts` both import them from there — no duplicate declarations. `confirmDangerousDelete`, `buildColorImpact`, `buildSizeImpact`, `notifyDeleteError` exported in Task 5 and imported in Task 7 — names match.
- **Ordering note:** Task 5 imports `sweetalert2`, installed in Task 4 — keep Task 4 before Task 5. Task 6 consumes the types created in Task 5 — keep Task 5 before Task 6.
