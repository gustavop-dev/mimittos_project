# Per-size pricing config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the four peluche-level pricing fields (`deposit_percentage`, `full_payment_discount_pct`, `free_shipping`, `shipping_cost`) onto `PeluchSizePrice` so each size of a plush toy can be configured independently — exactly like `price` already is — across model, API, Django admin, the order-pricing path, the product detail page, and the backoffice form.

**Architecture:** `PeluchSizePrice` (the existing `peluch × size → price/is_available` row) gains the four columns. A single migration adds them, copies each peluche's current values onto all of that peluche's size rows, then drops the four columns from `Peluch`. `discount_pct` stays on `Peluch`. `OrderService.create_order` reads the four values from the matched `PeluchSizePrice` instead of the `Peluch`; everything downstream (the `Order` snapshot fields, `WompiTransaction.amount_in_cents`, `wompi_service.py`, `/payment/*`) is untouched. The frontend product detail page snapshots the *selected size's* config onto each `CartItem` (the `CartItem` shape doesn't change), and the backoffice `PeluchForm` moves those four inputs from a global section into the per-size table rows.

**Tech Stack:** Django 6 + DRF, pytest-django, MySQL (dev & prod); Next.js 16 App Router + React + TypeScript, Jest.

**Spec:** `docs/superpowers/specs/2026-05-12-per-size-pricing-config-design.md`

---

## File structure

**Backend (`backend/`):**
- `base_feature_app/models/peluch_size_price.py` — *modify*: add 4 fields.
- `base_feature_app/models/peluch.py` — *modify*: remove 4 fields, trim an unused import.
- `base_feature_app/migrations/0012_per_size_pricing_config.py` — *create*: AddField×4 + RunPython copy + RemoveField×4.
- `base_feature_app/serializers/catalog.py` — *modify*: `PeluchSizePriceSerializer`, `PeluchSizePriceWriteSerializer`, `PeluchCreateUpdateSerializer._sync_size_prices` + `Meta.fields`, `PeluchListSerializer.Meta.fields`, `PeluchDetailSerializer.Meta.fields`.
- `base_feature_app/services/order_service.py` — *modify*: `_item_subtotal` returns the matched `PeluchSizePrice`; `create_order` reads deposit/discount/shipping from it; `OrderItem.configuration_snapshot` keys come from it.
- `base_feature_app/admin.py` — *modify*: `PeluchSizePriceInline.fields`.
- `base_feature_app/tests/services/test_order_service.py` — *modify*: add fixtures + per-size tests.

**Frontend (`frontend/`):**
- `lib/types.ts` — *modify*: move 4 fields from `Peluch` to `PeluchSizePrice`.
- `lib/utils/pricing.ts` — *create*: `roundToHundred`, `computeDeposit` pure helpers.
- `lib/utils/__tests__/pricing.test.ts` — *create*: unit tests for the helpers.
- `app/peluches/[slug]/page.tsx` — *modify*: use the helpers + per-size `deposit_percentage` for the displayed deposit and the "Abono X%" label; snapshot the four fields onto `CartItem` from the selected `PeluchSizePrice`.
- `components/admin/PeluchForm.tsx` — *modify*: extend `SizePriceRow` + `updateSizePrice` + the per-size table UI + the submitted `size_prices_data`; remove the "Pagos y envíos" section, its form state, and its validation; drop the 4 top-level keys from the payload.

---

## Task 1: Backend — model fields + migration

**Files:**
- Modify: `backend/base_feature_app/models/peluch_size_price.py`
- Modify: `backend/base_feature_app/models/peluch.py:1` and `:42-59`
- Create: `backend/base_feature_app/migrations/0012_per_size_pricing_config.py`
- Test (smoke): `backend/base_feature_app/tests/services/test_order_service.py` (reuse existing tests)

- [ ] **Step 1: Add the four fields to `PeluchSizePrice`**

Replace the whole contents of `backend/base_feature_app/models/peluch_size_price.py` with:

```python
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .peluch import Peluch
from .global_size import GlobalSize


class PeluchSizePrice(models.Model):
    peluch = models.ForeignKey(Peluch, on_delete=models.CASCADE, related_name='size_prices')
    size = models.ForeignKey(GlobalSize, on_delete=models.PROTECT, related_name='peluch_prices')
    price = models.PositiveIntegerField()
    is_available = models.BooleanField(default=True)
    deposit_percentage = models.PositiveSmallIntegerField(
        default=50,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text='% del precio que se cobra como anticipo (modalidad contraentrega) para esta talla.',
    )
    full_payment_discount_pct = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(100)],
        help_text='% de descuento si el cliente paga el total por adelantado, para esta talla.',
    )
    free_shipping = models.BooleanField(
        default=False,
        help_text='Si está activo, esta talla no aporta costo de envío.',
    )
    shipping_cost = models.PositiveIntegerField(
        default=0,
        help_text='Costo de envío en COP para esta talla. Se ignora si free_shipping=True.',
    )

    class Meta:
        unique_together = ('peluch', 'size')
        ordering = ['size__sort_order']

    def __str__(self):
        return f'{self.peluch.title} — {self.size.label}: ${self.price:,}'
```

- [ ] **Step 2: Remove the four fields from `Peluch`**

In `backend/base_feature_app/models/peluch.py`:

Change line 1 from:
```python
from django.core.validators import MaxValueValidator, MinValueValidator
```
to:
```python
from django.core.validators import MaxValueValidator
```

Delete this entire block (currently lines 42–59, the four fields and their blank line above):
```python

    deposit_percentage = models.PositiveSmallIntegerField(
        default=50,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text='% del precio que cobra como anticipo para pago contraentrega.',
    )
    full_payment_discount_pct = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(100)],
        help_text='% de descuento si el cliente paga el total por adelantado.',
    )
    free_shipping = models.BooleanField(
        default=False,
        help_text='Si está activo, este peluche no aporta costo de envío al carrito.',
    )
    shipping_cost = models.PositiveIntegerField(
        default=0,
        help_text='Costo de envío en COP (entero). Se ignora si free_shipping=True.',
    )
```

Leave everything else in `peluch.py` unchanged (`discount_pct`, `huella_extra_cost`, `corazon_extra_cost`, `audio_extra_cost`, etc.).

- [ ] **Step 3: Create the migration file by hand**

Create `backend/base_feature_app/migrations/0012_per_size_pricing_config.py` with exactly:

```python
import django.core.validators
from django.db import migrations, models


def copy_pricing_to_sizes(apps, schema_editor):
    PeluchSizePrice = apps.get_model('base_feature_app', 'PeluchSizePrice')
    to_update = []
    for sp in PeluchSizePrice.objects.select_related('peluch').all():
        sp.deposit_percentage = sp.peluch.deposit_percentage
        sp.full_payment_discount_pct = sp.peluch.full_payment_discount_pct
        sp.free_shipping = sp.peluch.free_shipping
        sp.shipping_cost = sp.peluch.shipping_cost
        to_update.append(sp)
    if to_update:
        PeluchSizePrice.objects.bulk_update(
            to_update,
            ['deposit_percentage', 'full_payment_discount_pct', 'free_shipping', 'shipping_cost'],
        )


def copy_pricing_back_to_peluch(apps, schema_editor):
    Peluch = apps.get_model('base_feature_app', 'Peluch')
    PeluchSizePrice = apps.get_model('base_feature_app', 'PeluchSizePrice')
    for peluch in Peluch.objects.all():
        first = (
            PeluchSizePrice.objects
            .filter(peluch=peluch)
            .order_by('size__sort_order')
            .first()
        )
        if first:
            peluch.deposit_percentage = first.deposit_percentage
            peluch.full_payment_discount_pct = first.full_payment_discount_pct
            peluch.free_shipping = first.free_shipping
            peluch.shipping_cost = first.shipping_cost
            peluch.save(update_fields=[
                'deposit_percentage', 'full_payment_discount_pct', 'free_shipping', 'shipping_cost',
            ])


class Migration(migrations.Migration):

    dependencies = [
        ('base_feature_app', '0011_order_amount_paid_now_order_discount_amount_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='peluchsizeprice',
            name='deposit_percentage',
            field=models.PositiveSmallIntegerField(
                default=50,
                help_text='% del precio que se cobra como anticipo (modalidad contraentrega) para esta talla.',
                validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(100)],
            ),
        ),
        migrations.AddField(
            model_name='peluchsizeprice',
            name='full_payment_discount_pct',
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text='% de descuento si el cliente paga el total por adelantado, para esta talla.',
                validators=[django.core.validators.MaxValueValidator(100)],
            ),
        ),
        migrations.AddField(
            model_name='peluchsizeprice',
            name='free_shipping',
            field=models.BooleanField(
                default=False,
                help_text='Si está activo, esta talla no aporta costo de envío.',
            ),
        ),
        migrations.AddField(
            model_name='peluchsizeprice',
            name='shipping_cost',
            field=models.PositiveIntegerField(
                default=0,
                help_text='Costo de envío en COP para esta talla. Se ignora si free_shipping=True.',
            ),
        ),
        migrations.RunPython(copy_pricing_to_sizes, copy_pricing_back_to_peluch),
        migrations.RemoveField(model_name='peluch', name='deposit_percentage'),
        migrations.RemoveField(model_name='peluch', name='full_payment_discount_pct'),
        migrations.RemoveField(model_name='peluch', name='free_shipping'),
        migrations.RemoveField(model_name='peluch', name='shipping_cost'),
    ]
```

Note: the dependency is the latest `base_feature_app` migration as of writing. If `python manage.py makemigrations base_feature_app --check --dry-run` reports a *different* latest migration, update the `dependencies` entry to match — but do **not** let `makemigrations` auto-generate this file; the hand-written one above has the `RunPython` step ordered correctly between the AddFields and the RemoveFields.

- [ ] **Step 4: Verify no further migrations are needed and apply**

Run:
```bash
cd backend && source venv/bin/activate && python manage.py makemigrations --check --dry-run
```
Expected: `No changes detected` (the hand-written migration covers everything). If it reports changes, the hand-written migration's field definitions don't exactly match the models — reconcile them.

Then:
```bash
cd backend && source venv/bin/activate && python manage.py migrate base_feature_app
```
Expected: `Applying base_feature_app.0012_per_size_pricing_config... OK`.

- [ ] **Step 5: Smoke-test the existing order-service tests still pass**

Run:
```bash
cd backend && source venv/bin/activate && pytest base_feature_app/tests/services/test_order_service.py -v
```
Expected: all tests PASS (the existing `peluch_with_price` fixture creates a `PeluchSizePrice` whose new fields default to `deposit_percentage=50 / full_payment_discount_pct=0 / free_shipping=False / shipping_cost=0`, matching the old `Peluch` defaults, so `test_create_order_deposit_is_50_percent` etc. are unaffected).

- [ ] **Step 6: Commit**

```bash
cd backend && git add base_feature_app/models/peluch_size_price.py base_feature_app/models/peluch.py base_feature_app/migrations/0012_per_size_pricing_config.py
git commit -m "feat(catalog): per-size pricing config on PeluchSizePrice + migration"
```

---

## Task 2: Backend — serializers

**Files:**
- Modify: `backend/base_feature_app/serializers/catalog.py`

There is no existing peluch-CRUD test file to extend, so this task is verified by a quick `manage.py shell` round-trip (Step 5 below) plus the end-to-end check in Task 8.

- [ ] **Step 1: Update `PeluchSizePriceSerializer` (read, nested in detail)**

In `backend/base_feature_app/serializers/catalog.py`, replace:
```python
class PeluchSizePriceSerializer(serializers.ModelSerializer):
    size = GlobalSizeSerializer(read_only=True)

    class Meta:
        model = PeluchSizePrice
        fields = ['id', 'size', 'price', 'is_available']
```
with:
```python
class PeluchSizePriceSerializer(serializers.ModelSerializer):
    size = GlobalSizeSerializer(read_only=True)

    class Meta:
        model = PeluchSizePrice
        fields = [
            'id', 'size', 'price', 'is_available',
            'deposit_percentage', 'full_payment_discount_pct',
            'free_shipping', 'shipping_cost',
        ]
```

- [ ] **Step 2: Update `PeluchSizePriceWriteSerializer` (write, in `size_prices_data`)**

Replace:
```python
class PeluchSizePriceWriteSerializer(serializers.Serializer):
    size_id = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_available = serializers.BooleanField(default=True)
```
with:
```python
class PeluchSizePriceWriteSerializer(serializers.Serializer):
    size_id = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_available = serializers.BooleanField(default=True)
    deposit_percentage = serializers.IntegerField(default=50, min_value=1, max_value=100)
    full_payment_discount_pct = serializers.IntegerField(default=0, min_value=0, max_value=100)
    free_shipping = serializers.BooleanField(default=False)
    shipping_cost = serializers.IntegerField(default=0, min_value=0)
```

- [ ] **Step 3: Update `PeluchCreateUpdateSerializer` — `Meta.fields` and `_sync_size_prices`**

In `PeluchCreateUpdateSerializer.Meta.fields`, remove the four entries `'deposit_percentage', 'full_payment_discount_pct', 'free_shipping', 'shipping_cost'` (keep `'discount_pct'`). The list becomes:
```python
        fields = [
            'title', 'slug', 'category', 'lead_description', 'description',
            'specifications', 'care_instructions', 'badge',
            'is_active', 'is_featured',
            'discount_pct', 'display_order',
            'has_huella', 'has_corazon', 'has_audio',
            'huella_extra_cost', 'corazon_extra_cost', 'audio_extra_cost',
            'available_color_ids', 'size_prices_data',
        ]
```

Replace `_sync_size_prices`:
```python
    def _sync_size_prices(self, peluch, size_prices_data):
        if size_prices_data is None:
            return
        for sp_data in size_prices_data:
            PeluchSizePrice.objects.update_or_create(
                peluch=peluch,
                size_id=sp_data['size_id'],
                defaults={'price': sp_data['price'], 'is_available': sp_data['is_available']},
            )
```
with:
```python
    def _sync_size_prices(self, peluch, size_prices_data):
        if size_prices_data is None:
            return
        for sp_data in size_prices_data:
            PeluchSizePrice.objects.update_or_create(
                peluch=peluch,
                size_id=sp_data['size_id'],
                defaults={
                    'price': sp_data['price'],
                    'is_available': sp_data['is_available'],
                    'deposit_percentage': sp_data['deposit_percentage'],
                    'full_payment_discount_pct': sp_data['full_payment_discount_pct'],
                    'free_shipping': sp_data['free_shipping'],
                    'shipping_cost': sp_data['shipping_cost'],
                },
            )
```
(The write serializer has `default=` on all four new keys, so they are always present in `sp_data`.)

- [ ] **Step 4: Remove the four fields from the list and detail serializers**

In `PeluchListSerializer.Meta.fields`, delete the line `'deposit_percentage', 'full_payment_discount_pct',` and the line `'free_shipping', 'shipping_cost',`. Keep `'discount_pct', 'display_order',` and everything else.

In `PeluchDetailSerializer.Meta.fields`, delete the line `'deposit_percentage', 'full_payment_discount_pct',` and the line `'free_shipping', 'shipping_cost',`. Keep `'discount_pct', 'display_order',`, the `'size_prices'` entry, and everything else.

- [ ] **Step 5: Sanity-check serializers import and a peluch CRUD round-trip**

Run:
```bash
cd backend && source venv/bin/activate && python manage.py shell -c "
from base_feature_app.serializers.catalog import PeluchCreateUpdateSerializer, PeluchDetailSerializer
from base_feature_app.models import Category, GlobalSize
cat = Category.objects.first(); size = GlobalSize.objects.first()
s = PeluchCreateUpdateSerializer(data={'title':'Tmp QA','slug':'tmp-qa','category':cat.id,'lead_description':'x','description':[],'specifications':{},'care_instructions':[],'available_color_ids':[],'size_prices_data':[{'size_id':size.id,'price':50000,'is_available':True,'deposit_percentage':30,'full_payment_discount_pct':10,'free_shipping':True,'shipping_cost':0}]})
assert s.is_valid(), s.errors
p = s.save()
sp = p.size_prices.first()
print('OK', sp.deposit_percentage, sp.full_payment_discount_pct, sp.free_shipping, sp.shipping_cost)
data = PeluchDetailSerializer(p).data
print('detail size_prices[0]:', data['size_prices'][0])
assert 'deposit_percentage' not in data, 'peluche-level field should be gone'
p.delete()
print('cleaned up')
"
```
Expected output includes `OK 30 10 True 0`, a `size_prices[0]` dict containing `deposit_percentage`/`full_payment_discount_pct`/`free_shipping`/`shipping_cost`, and `cleaned up`. (This writes to the dev MySQL DB and deletes the temp peluche afterward.)

- [ ] **Step 6: Commit**

```bash
cd backend && git add base_feature_app/serializers/catalog.py
git commit -m "feat(catalog): expose & accept per-size pricing config in serializers"
```

---

## Task 3: Backend — order pricing path + tests (TDD)

**Files:**
- Modify: `backend/base_feature_app/services/order_service.py`
- Modify: `backend/base_feature_app/tests/services/test_order_service.py`

- [ ] **Step 1: Add fixtures and the failing per-size tests**

In `backend/base_feature_app/tests/services/test_order_service.py`, after the existing `peluch_with_price` fixture (around line 56), add:

```python
@pytest.fixture
def size_l(db):
    return GlobalSize.objects.create(label='Grande', slug='grande', cm='40cm', sort_order=2)


@pytest.fixture
def peluch_per_size(peluch, size, size_l):
    PeluchSizePrice.objects.create(
        peluch=peluch, size=size, price=80000,
        deposit_percentage=30, full_payment_discount_pct=10,
        free_shipping=False, shipping_cost=5000,
    )
    PeluchSizePrice.objects.create(
        peluch=peluch, size=size_l, price=120000,
        deposit_percentage=50, full_payment_discount_pct=0,
        free_shipping=True, shipping_cost=0,
    )
    return peluch


def _order_data(peluch, *items):
    """items: list of (size, color, quantity). Returns a create_order payload dict."""
    return {
        'customer_name': 'Ana García',
        'customer_email': 'ana@example.com',
        'customer_phone': '3001234567',
        'address': 'Calle 123',
        'city': 'Bogotá',
        'department': 'Cundinamarca',
        'items': [
            {
                'peluch': peluch, 'size': sz, 'color': col, 'quantity': q,
                'has_huella': False, 'has_corazon': False, 'has_audio': False,
                'huella_media': None, 'audio_media': None,
            }
            for (sz, col, q) in items
        ],
    }
```

Then, at the end of the `create_order` section of tests (after `test_create_order_customer_is_none_for_anonymous`, around line 213), add:

```python
@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_uses_per_size_deposit_percentage(mock_media, peluch_per_size, size, color):
    order = OrderService.create_order(_order_data(peluch_per_size, (size, color, 1)))
    assert order.deposit_amount == 24000  # 80000 * 30%
    assert order.amount_paid_now == 24000


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_per_size_shipping_cost_is_added(mock_media, peluch_per_size, size, color):
    order = OrderService.create_order(_order_data(peluch_per_size, (size, color, 1)))
    assert order.shipping_amount == 5000


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_per_size_free_shipping_contributes_zero(mock_media, peluch_per_size, size_l, color):
    order = OrderService.create_order(_order_data(peluch_per_size, (size_l, color, 1)))
    assert order.shipping_amount == 0


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_full_payment_uses_per_size_discount(mock_media, peluch_per_size, size, color):
    data = _order_data(peluch_per_size, (size, color, 1))
    data['payment_mode'] = Order.PaymentMode.FULL
    order = OrderService.create_order(data)
    assert order.discount_amount == 8000  # 80000 * 10%
    assert order.amount_paid_now == 77000  # 80000 - 8000 + 5000 shipping
    assert order.balance_amount == 0


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_wompi_amount_matches_amount_paid_now(mock_media, peluch_per_size, size, color):
    order = OrderService.create_order(_order_data(peluch_per_size, (size, color, 2)))
    tx = WompiTransaction.objects.get(order=order)
    assert tx.amount_in_cents == order.amount_paid_now * 100


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_mixed_sizes_weighted_deposit(mock_media, peluch_per_size, size, size_l, color):
    # size: price 80000, deposit 30%, ship 5000  |  size_l: price 120000, deposit 50%, free ship
    order = OrderService.create_order(_order_data(peluch_per_size, (size, color, 1), (size_l, color, 1)))
    assert order.total_amount == 200000
    assert order.deposit_amount == 84000      # 80000*30% + 120000*50% = 24000 + 60000
    assert order.shipping_amount == 5000
    assert order.balance_amount == 121000     # (200000 - 84000) + 5000


@pytest.mark.django_db
@patch('base_feature_app.services.order_service.OrderService.mark_media_as_used')
def test_create_order_snapshot_stores_per_size_config(mock_media, peluch_per_size, size, color):
    order = OrderService.create_order(_order_data(peluch_per_size, (size, color, 1)))
    snap = order.items.first().configuration_snapshot
    assert snap['deposit_percentage'] == 30
    assert snap['full_payment_discount_pct'] == 10
    assert snap['shipping_cost'] == 5000
    assert snap['free_shipping'] is False
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run:
```bash
cd backend && source venv/bin/activate && pytest base_feature_app/tests/services/test_order_service.py -k "per_size or mixed_sizes or wompi_amount or snapshot_stores" -v
```
Expected: FAIL (the values are computed from the `Peluch`, which no longer has those fields → `AttributeError` on `peluch.deposit_percentage`, or wrong amounts).

- [ ] **Step 3: Update `_item_subtotal` to also return the matched `PeluchSizePrice`**

In `backend/base_feature_app/services/order_service.py`, replace `_item_subtotal`:
```python
    @staticmethod
    def _item_subtotal(item: dict, peluch) -> tuple[int, int]:
        """Return (unit_price, line_subtotal) for a cart item dict."""
        size_price = PeluchSizePrice.objects.get(
            peluch=peluch,
            size=item['size'],
            is_available=True,
        )
        personalization_cost = sum([
            peluch.huella_extra_cost if item.get('has_huella') else 0,
            peluch.corazon_extra_cost if item.get('has_corazon') else 0,
            peluch.audio_extra_cost if item.get('has_audio') else 0,
        ])
        discount = getattr(peluch, 'discount_pct', 0) or 0
        unit_price = round(size_price.price * (100 - discount) / 100)
        line_subtotal = (unit_price + personalization_cost) * item['quantity']
        return unit_price, personalization_cost, line_subtotal
```
with:
```python
    @staticmethod
    def _item_subtotal(item: dict, peluch):
        """Return (size_price, unit_price, personalization_cost, line_subtotal) for a cart item dict."""
        size_price = PeluchSizePrice.objects.get(
            peluch=peluch,
            size=item['size'],
            is_available=True,
        )
        personalization_cost = sum([
            peluch.huella_extra_cost if item.get('has_huella') else 0,
            peluch.corazon_extra_cost if item.get('has_corazon') else 0,
            peluch.audio_extra_cost if item.get('has_audio') else 0,
        ])
        discount = getattr(peluch, 'discount_pct', 0) or 0
        unit_price = round(size_price.price * (100 - discount) / 100)
        line_subtotal = (unit_price + personalization_cost) * item['quantity']
        return size_price, unit_price, personalization_cost, line_subtotal
```

- [ ] **Step 4: Update `create_order` to read deposit/discount/shipping from `size_price`**

In `create_order`, change the first loop body from:
```python
        for item in items_data:
            peluch = item['peluch']
            unit_price, personalization_cost, line_subtotal = OrderService._item_subtotal(item, peluch)
            item['unit_price'] = unit_price
            item['personalization_cost'] = personalization_cost
            item['_line_subtotal'] = line_subtotal

            product_subtotal += line_subtotal

            deposit_pct = peluch.deposit_percentage or int(getattr(settings, 'DEPOSIT_PERCENTAGE', 50))
            weighted_deposit_raw += line_subtotal * deposit_pct / 100

            full_disc_pct = peluch.full_payment_discount_pct or 0
            weighted_full_discount_raw += line_subtotal * full_disc_pct / 100

            if not peluch.free_shipping:
                shipping_total += peluch.shipping_cost * item['quantity']
```
to:
```python
        for item in items_data:
            peluch = item['peluch']
            size_price, unit_price, personalization_cost, line_subtotal = OrderService._item_subtotal(item, peluch)
            item['unit_price'] = unit_price
            item['personalization_cost'] = personalization_cost
            item['_line_subtotal'] = line_subtotal
            item['_size_price'] = size_price

            product_subtotal += line_subtotal

            deposit_pct = size_price.deposit_percentage or int(getattr(settings, 'DEPOSIT_PERCENTAGE', 50))
            weighted_deposit_raw += line_subtotal * deposit_pct / 100

            full_disc_pct = size_price.full_payment_discount_pct or 0
            weighted_full_discount_raw += line_subtotal * full_disc_pct / 100

            if not size_price.free_shipping:
                shipping_total += size_price.shipping_cost * item['quantity']
```

- [ ] **Step 5: Update the `OrderItem` creation loop to reuse `_size_price` and snapshot per-size config**

In `create_order`, change the second loop. Replace:
```python
        for item in items_data:
            peluch = item['peluch']
            size_price = PeluchSizePrice.objects.get(
                peluch=peluch, size=item['size'], is_available=True,
            )
            OrderItem.objects.create(
                order=order,
                peluch=peluch,
                size=item['size'],
                color=item['color'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
                personalization_cost=item['personalization_cost'],
                has_huella=item.get('has_huella', False),
                huella_type=item.get('huella_type', ''),
                huella_text=item.get('huella_text', ''),
                huella_media=item.get('huella_media'),
                has_corazon=item.get('has_corazon', False),
                corazon_phrase=item.get('corazon_phrase', ''),
                has_audio=item.get('has_audio', False),
                audio_media=item.get('audio_media'),
                configuration_snapshot={
                    'peluch_title': peluch.title,
                    'size_label': item['size'].label,
                    'size_cm': item['size'].cm,
                    'color_name': item['color'].name,
                    'color_hex': item['color'].hex_code,
                    'discount_pct': peluch.discount_pct,
                    'original_unit_price': size_price.price,
                    'deposit_percentage': peluch.deposit_percentage,
                    'full_payment_discount_pct': peluch.full_payment_discount_pct,
                    'free_shipping': peluch.free_shipping,
                    'shipping_cost': peluch.shipping_cost,
                    'has_huella': item.get('has_huella', False),
                    'huella_type': item.get('huella_type', ''),
                    'huella_text': item.get('huella_text', ''),
                    'has_corazon': item.get('has_corazon', False),
                    'corazon_phrase': item.get('corazon_phrase', ''),
                    'has_audio': item.get('has_audio', False),
                },
            )
```
with:
```python
        for item in items_data:
            peluch = item['peluch']
            size_price = item['_size_price']
            OrderItem.objects.create(
                order=order,
                peluch=peluch,
                size=item['size'],
                color=item['color'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
                personalization_cost=item['personalization_cost'],
                has_huella=item.get('has_huella', False),
                huella_type=item.get('huella_type', ''),
                huella_text=item.get('huella_text', ''),
                huella_media=item.get('huella_media'),
                has_corazon=item.get('has_corazon', False),
                corazon_phrase=item.get('corazon_phrase', ''),
                has_audio=item.get('has_audio', False),
                audio_media=item.get('audio_media'),
                configuration_snapshot={
                    'peluch_title': peluch.title,
                    'size_label': item['size'].label,
                    'size_cm': item['size'].cm,
                    'color_name': item['color'].name,
                    'color_hex': item['color'].hex_code,
                    'discount_pct': peluch.discount_pct,
                    'original_unit_price': size_price.price,
                    'deposit_percentage': size_price.deposit_percentage,
                    'full_payment_discount_pct': size_price.full_payment_discount_pct,
                    'free_shipping': size_price.free_shipping,
                    'shipping_cost': size_price.shipping_cost,
                    'has_huella': item.get('has_huella', False),
                    'huella_type': item.get('huella_type', ''),
                    'huella_text': item.get('huella_text', ''),
                    'has_corazon': item.get('has_corazon', False),
                    'corazon_phrase': item.get('corazon_phrase', ''),
                    'has_audio': item.get('has_audio', False),
                },
            )
```

Leave `OrderService.calculate_deposit` (the legacy global fallback) unchanged.

- [ ] **Step 6: Run the new tests + the whole order-service file**

Run:
```bash
cd backend && source venv/bin/activate && pytest base_feature_app/tests/services/test_order_service.py -v
```
Expected: all tests PASS (the new per-size tests and the pre-existing ones).

- [ ] **Step 7: Run any other order/payment tests that build a `Peluch` to confirm no breakage**

Run:
```bash
cd backend && source venv/bin/activate && pytest base_feature_app/tests/views/test_order_views.py base_feature_app/tests/views/test_review_and_payment_views.py -q
```
Expected: PASS. If any test fails because it set `deposit_percentage=` / `full_payment_discount_pct=` / `free_shipping=` / `shipping_cost=` directly on a `Peluch`, move that kwarg onto the relevant `PeluchSizePrice.objects.create(...)` call in that test's setup.

- [ ] **Step 8: Commit**

```bash
cd backend && git add base_feature_app/services/order_service.py base_feature_app/tests/services/test_order_service.py
git commit -m "feat(orders): compute deposit/discount/shipping from per-size config"
```

---

## Task 4: Backend — Django admin inline

**Files:**
- Modify: `backend/base_feature_app/admin.py:181-184`

- [ ] **Step 1: Show the new fields in the size-price inline**

In `backend/base_feature_app/admin.py`, replace:
```python
class PeluchSizePriceInline(admin.TabularInline):
    model = PeluchSizePrice
    extra = 1
    fields = ('size', 'price', 'is_available')
```
with:
```python
class PeluchSizePriceInline(admin.TabularInline):
    model = PeluchSizePrice
    extra = 1
    fields = (
        'size', 'price', 'is_available',
        'deposit_percentage', 'full_payment_discount_pct', 'free_shipping', 'shipping_cost',
    )
```
Leave `PeluchAdmin` unchanged (the removed `Peluch` fields disappear from the change form automatically).

- [ ] **Step 2: Verify the admin loads without errors**

Run:
```bash
cd backend && source venv/bin/activate && python manage.py check
```
Expected: `System check identified no issues`.

- [ ] **Step 3: Commit**

```bash
cd backend && git add base_feature_app/admin.py
git commit -m "feat(admin): per-size pricing fields in PeluchSizePrice inline"
```

---

## Task 5: Frontend — types

**Files:**
- Modify: `frontend/lib/types.ts:41-73`

- [ ] **Step 1: Move the four fields from `Peluch` to `PeluchSizePrice`**

In `frontend/lib/types.ts`, replace:
```typescript
export type PeluchSizePrice = {
  id: number
  size: GlobalSize
  price: number
  is_available: boolean
}
```
with:
```typescript
export type PeluchSizePrice = {
  id: number
  size: GlobalSize
  price: number
  is_available: boolean
  deposit_percentage: number
  full_payment_discount_pct: number
  free_shipping: boolean
  shipping_cost: number
}
```

And in the `Peluch` type, delete these four lines:
```typescript
  deposit_percentage: number
  full_payment_discount_pct: number
  free_shipping: boolean
  shipping_cost: number
```
Keep `discount_pct: number` and everything else. Do **not** change `CartItem` — it keeps `deposit_percentage` / `full_payment_discount_pct` / `free_shipping` / `shipping_cost` (now snapshots of the chosen size).

- [ ] **Step 2: Type-check**

Run:
```bash
cd frontend && npx tsc --noEmit
```
Expected: errors only in `app/peluches/[slug]/page.tsx` (it still reads `peluch.deposit_percentage` etc.) and `components/admin/PeluchForm.tsx` (it still reads `existing.deposit_percentage` etc.). Those are fixed in Tasks 6 and 7. No errors elsewhere.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add lib/types.ts
git commit -m "feat(types): per-size pricing config on PeluchSizePrice"
```

---

## Task 6: Frontend — pricing helpers + product detail page (TDD for the helpers)

**Files:**
- Create: `frontend/lib/utils/pricing.ts`
- Create: `frontend/lib/utils/__tests__/pricing.test.ts`
- Modify: `frontend/app/peluches/[slug]/page.tsx`

- [ ] **Step 1: Write the failing helper tests**

Create `frontend/lib/utils/__tests__/pricing.test.ts`:
```typescript
import { roundToHundred, computeDeposit } from '@/lib/utils/pricing'

describe('roundToHundred', () => {
  it('rounds 99999 up to 100000', () => {
    expect(roundToHundred(99999)).toBe(100000)
  })

  it('leaves a multiple of 100 unchanged', () => {
    expect(roundToHundred(80000)).toBe(80000)
  })
})

describe('computeDeposit', () => {
  it('returns 30% of the total rounded to the nearest 100', () => {
    expect(computeDeposit(80000, 30)).toBe(24000)
  })

  it('returns 50% of the total when pct is 50', () => {
    expect(computeDeposit(81000, 50)).toBe(40500)
  })

  it('rounds the 50% of an odd total to the nearest 100', () => {
    expect(computeDeposit(81234, 50)).toBe(40600) // 40617 -> 40600
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
cd frontend && npm test -- lib/utils/__tests__/pricing.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/utils/pricing'`.

- [ ] **Step 3: Implement the helpers**

Create `frontend/lib/utils/pricing.ts`:
```typescript
export function roundToHundred(value: number): number {
  return Math.round(value / 100) * 100
}

export function computeDeposit(total: number, depositPct: number): number {
  return roundToHundred((total * depositPct) / 100)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
cd frontend && npm test -- lib/utils/__tests__/pricing.test.ts
```
Expected: PASS.

- [ ] **Step 5: Use the per-size deposit in the product detail page**

In `frontend/app/peluches/[slug]/page.tsx`:

Add the import near the top (with the other `@/lib/...` imports):
```typescript
import { computeDeposit } from '@/lib/utils/pricing'
```

Replace (currently around line 197–199):
```typescript
  const unitPrice = effectivePrice(activeSizePrice?.price ?? peluch.min_price ?? 0, peluch.discount_pct)
  const total = (unitPrice + personalizationCost) * qty
  const deposit = Math.round((total * 0.5) / 100) * 100
```
with:
```typescript
  const unitPrice = effectivePrice(activeSizePrice?.price ?? peluch.min_price ?? 0, peluch.discount_pct)
  const total = (unitPrice + personalizationCost) * qty
  const depositPct = activeSizePrice?.deposit_percentage ?? 50
  const deposit = computeDeposit(total, depositPct)
```

- [ ] **Step 6: Use the per-size config when adding to cart**

In the same file, in `handleAdd()`, replace (currently around line 250–253):
```typescript
      deposit_percentage: peluch.deposit_percentage ?? 50,
      full_payment_discount_pct: peluch.full_payment_discount_pct ?? 0,
      free_shipping: peluch.free_shipping ?? false,
      shipping_cost: peluch.shipping_cost ?? 0,
```
with:
```typescript
      deposit_percentage: activeSizePrice.deposit_percentage ?? 50,
      full_payment_discount_pct: activeSizePrice.full_payment_discount_pct ?? 0,
      free_shipping: activeSizePrice.free_shipping ?? false,
      shipping_cost: activeSizePrice.shipping_cost ?? 0,
```
(`handleAdd` already early-returns `if (!peluch || !activeSizePrice || !activeColor) return`, so `activeSizePrice` is defined here.)

- [ ] **Step 7: Update the "Abono 50%" label to the actual percentage**

In the same file, find (currently around line 510) the trust-badge entry:
```typescript
              { icon: 'M2 5h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zM2 10h20', title: 'Abono 50%', sub: `Pagas ${fmt(deposit)} hoy vía Wompi` },
```
and replace `title: 'Abono 50%'` with `title: \`Abono ${depositPct}%\``:
```typescript
              { icon: 'M2 5h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zM2 10h20', title: `Abono ${depositPct}%`, sub: `Pagas ${fmt(deposit)} hoy vía Wompi` },
```

- [ ] **Step 8: Type-check and run the helper tests once more**

Run:
```bash
cd frontend && npx tsc --noEmit && npm test -- lib/utils/__tests__/pricing.test.ts
```
Expected: no TypeScript errors in `app/peluches/[slug]/page.tsx` (errors may remain in `PeluchForm.tsx` — fixed in Task 7); tests PASS.

- [ ] **Step 9: Commit**

```bash
cd frontend && git add lib/utils/pricing.ts lib/utils/__tests__/pricing.test.ts "app/peluches/[slug]/page.tsx"
git commit -m "feat(product-detail): use per-size deposit; pricing helpers"
```

---

## Task 7: Frontend — backoffice `PeluchForm`

**Files:**
- Modify: `frontend/components/admin/PeluchForm.tsx`

- [ ] **Step 1: Extend the `SizePriceRow` interface**

In `frontend/components/admin/PeluchForm.tsx`, replace:
```typescript
interface SizePriceRow {
  size_id: number
  size_label: string
  size_cm: string
  price: string
  is_available: boolean
}
```
with:
```typescript
interface SizePriceRow {
  size_id: number
  size_label: string
  size_cm: string
  price: string
  is_available: boolean
  deposit_percentage: string
  full_payment_discount_pct: string
  free_shipping: boolean
  shipping_cost: string
}
```

- [ ] **Step 2: Remove the global pricing keys from `form` state and seed defaults for new size rows**

In the `useState` for `form` (around line 87–96), delete these four lines:
```typescript
    deposit_percentage: '50',
    full_payment_discount_pct: '0',
    free_shipping: false,
    shipping_cost: '0',
```
so `form` ends at `huella_extra_cost: '0', corazon_extra_cost: '0', audio_extra_cost: '0',`.

In the `useEffect` that builds the initial `rows` (around line 129–131), replace:
```typescript
      const rows: SizePriceRow[] = sizes.map((s) => ({
        size_id: s.id, size_label: s.label, size_cm: s.cm, price: '0', is_available: false,
      }))
```
with:
```typescript
      const rows: SizePriceRow[] = sizes.map((s) => ({
        size_id: s.id, size_label: s.label, size_cm: s.cm, price: '0', is_available: false,
        deposit_percentage: '50', full_payment_discount_pct: '0', free_shipping: false, shipping_cost: '0',
      }))
```

- [ ] **Step 3: Drop the global pricing keys from the "load existing" branch and merge per-size config**

In the `if (existing) { setForm({ ... }) }` call (around line 134–152), delete these four lines:
```typescript
          deposit_percentage: String(existing.deposit_percentage ?? 50),
          full_payment_discount_pct: String(existing.full_payment_discount_pct ?? 0),
          free_shipping: existing.free_shipping ?? false,
          shipping_cost: String(existing.shipping_cost ?? 0),
```
so the `setForm` object ends at `audio_extra_cost: String(existing.audio_extra_cost ?? 0),`.

Replace the `mergedRows` block (around line 161–165):
```typescript
        const mergedRows = rows.map((row) => {
          const sp = existing.size_prices?.find((p) => p.size.id === row.size_id)
          return sp ? { ...row, price: String(sp.price), is_available: sp.is_available } : row
        })
        setSizePrices(mergedRows)
```
with:
```typescript
        const mergedRows = rows.map((row) => {
          const sp = existing.size_prices?.find((p) => p.size.id === row.size_id)
          return sp
            ? {
                ...row,
                price: String(sp.price),
                is_available: sp.is_available,
                deposit_percentage: String(sp.deposit_percentage ?? 50),
                full_payment_discount_pct: String(sp.full_payment_discount_pct ?? 0),
                free_shipping: sp.free_shipping ?? false,
                shipping_cost: String(sp.shipping_cost ?? 0),
              }
            : row
        })
        setSizePrices(mergedRows)
```

- [ ] **Step 4: Add default per-size config to the "add new size" row**

Find (around line 286):
```typescript
      const newRow: SizePriceRow = { size_id: created.id, size_label: created.label, size_cm: created.cm, price: '0', is_available: false }
```
and replace with:
```typescript
      const newRow: SizePriceRow = {
        size_id: created.id, size_label: created.label, size_cm: created.cm, price: '0', is_available: false,
        deposit_percentage: '50', full_payment_discount_pct: '0', free_shipping: false, shipping_cost: '0',
      }
```

- [ ] **Step 5: Generalize `updateSizePrice` to accept the new fields**

Replace:
```typescript
  function updateSizePrice(size_id: number, field: 'price' | 'is_available', value: string | boolean) {
    setSizePrices((prev) => prev.map((row) => row.size_id === size_id ? { ...row, [field]: value } : row))
  }
```
with:
```typescript
  function updateSizePrice(
    size_id: number,
    field: 'price' | 'is_available' | 'deposit_percentage' | 'full_payment_discount_pct' | 'free_shipping' | 'shipping_cost',
    value: string | boolean,
  ) {
    setSizePrices((prev) => prev.map((row) => row.size_id === size_id ? { ...row, [field]: value } : row))
  }
```

- [ ] **Step 6: Update the payload — drop the global keys, send per-size config in `size_prices_data`**

In `handleSubmit`'s `payload` object (around line 357–384), delete these four lines:
```typescript
        deposit_percentage: Math.min(100, Math.max(1, Number(form.deposit_percentage) || 50)),
        full_payment_discount_pct: Math.min(100, Math.max(0, Number(form.full_payment_discount_pct) || 0)),
        free_shipping: form.free_shipping,
        shipping_cost: form.free_shipping ? 0 : Math.max(0, Number(form.shipping_cost) || 0),
```

Replace the `size_prices_data` mapping:
```typescript
        size_prices_data: sizePrices
          .filter((r) => r.is_available && Number(r.price) > 0)
          .map((r) => ({ size_id: r.size_id, price: Number(r.price), is_available: true })),
```
with:
```typescript
        size_prices_data: sizePrices
          .filter((r) => r.is_available && Number(r.price) > 0)
          .map((r) => ({
            size_id: r.size_id,
            price: Number(r.price),
            is_available: true,
            deposit_percentage: Math.min(100, Math.max(1, Number(r.deposit_percentage) || 50)),
            full_payment_discount_pct: Math.min(100, Math.max(0, Number(r.full_payment_discount_pct) || 0)),
            free_shipping: r.free_shipping,
            shipping_cost: r.free_shipping ? 0 : Math.max(0, Number(r.shipping_cost) || 0),
          })),
```

- [ ] **Step 7: Add the per-size config controls to each row in the "Tallas y precios" section**

In the `sizePrices.map((row) => ( ... ))` block (around line 517–536), the current row is a single horizontal `<div>` ending with the delete button. Restructure it so each row is a vertical container: line 1 = the existing checkbox + price; line 2 = the new four controls (only meaningful when the size is available). Replace the whole `{sizePrices.map((row) => ( ... ))}` block with:

```tsx
          {sizePrices.map((row) => (
            <div key={row.size_id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', background: row.is_available ? '#fff' : 'var(--cream-warm)', borderRadius: 10, border: `1.5px solid ${row.is_available ? 'rgba(212,132,138,.3)' : 'rgba(27,42,74,.06)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180, cursor: 'pointer' }}>
                  <input type="checkbox" checked={row.is_available} onChange={(e) => updateSizePrice(row.size_id, 'is_available', e.target.checked)} />
                  <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{row.size_label}</span>
                  <span style={{ fontSize: 11, color: 'var(--gray-warm)' }}>{row.size_cm}</span>
                </label>
                <span style={{ fontSize: 13, color: 'var(--gray-warm)' }}>$</span>
                <input type="number" min={0} step={100} value={row.price} disabled={!row.is_available} onChange={(e) => updateSizePrice(row.size_id, 'price', e.target.value)} style={{ ...I, width: 140, opacity: row.is_available ? 1 : .4 }} placeholder="0" />
                <span style={{ fontSize: 12, color: 'var(--gray-warm)' }}>COP</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSize(row.size_id, row.size_label)}
                  title="Eliminar esta talla globalmente"
                  style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: 7, border: '1px solid #FFCDD2', background: '#FFF5F5', color: '#C62828', cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                </button>
              </div>
              {row.is_available && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', paddingLeft: 28 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-warm)' }}>
                    Anticipo %
                    <input type="number" min={1} max={100} value={row.deposit_percentage} onChange={(e) => updateSizePrice(row.size_id, 'deposit_percentage', e.target.value)} style={{ ...I, width: 70 }} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-warm)' }}>
                    Desc. pago completo %
                    <input type="number" min={0} max={100} value={row.full_payment_discount_pct} onChange={(e) => updateSizePrice(row.size_id, 'full_payment_discount_pct', e.target.value)} style={{ ...I, width: 70 }} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-warm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={row.free_shipping} onChange={(e) => updateSizePrice(row.size_id, 'free_shipping', e.target.checked)} />
                    Envío gratis
                  </label>
                  {!row.free_shipping && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-warm)' }}>
                      Costo envío
                      <input type="number" min={0} value={row.shipping_cost} onChange={(e) => updateSizePrice(row.size_id, 'shipping_cost', e.target.value)} style={{ ...I, width: 110 }} placeholder="0" />
                      <span>COP</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          ))}
```

- [ ] **Step 8: Remove the "Pagos y envíos" section**

Delete the entire `{/* ── PAGOS Y ENVÍOS ─────────────────────────────── */}` block — that is the `<Section title="Pagos y envíos"> ... </Section>` element (currently lines 616–675). It contained the global `% de anticipo`, `% descuento si paga todo de una`, the `Envío gratis` checkbox and `Costo de envío`. Nothing replaces it (those controls now live per-row inside "Tallas y precios").

- [ ] **Step 9: Type-check and lint**

Run:
```bash
cd frontend && npx tsc --noEmit && npm run lint
```
Expected: no TypeScript errors and no new lint errors. (If `npm run lint` flags `form` keys that are now unused, you've correctly removed all four; if it flags a leftover reference to `form.deposit_percentage` / `form.shipping_cost` / `form.free_shipping` / `form.full_payment_discount_pct`, search the file and remove it.)

- [ ] **Step 10: Commit**

```bash
cd frontend && git add components/admin/PeluchForm.tsx
git commit -m "feat(backoffice): per-size pricing config in PeluchForm"
```

---

## Task 8: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Make sure both servers are running with the new code**

Backend on :8001 (matches `frontend/.env.local`), frontend on :3000. If they're already running with `--reload` / Turbopack, the changes are picked up; otherwise:
```bash
cd backend && source venv/bin/activate && python manage.py runserver 0.0.0.0:8001   # in one terminal
cd frontend && npm run dev                                                          # in another
```

- [ ] **Step 2: Backoffice — set distinct per-size config on a peluche**

In a browser, log in to the backoffice and edit a peluche (e.g. *Osito Caramelo*). In "Tallas y precios", give two different sizes different values — e.g. size S: anticipo 30%, desc. pago completo 10%, costo envío 5000; size M: anticipo 50%, envío gratis. Save. Re-open the edit form and confirm the values persisted (round-trip).

- [ ] **Step 3: API — confirm `size_prices` carries the new fields and the peluche no longer exposes them**

Run:
```bash
curl -s "http://localhost:3000/api/peluches/osito-caramelo/" | python3 -m json.tool | grep -E 'deposit_percentage|full_payment_discount_pct|free_shipping|shipping_cost' -n
```
Expected: those keys appear **inside** each `size_prices[]` entry and **not** at the top level of the peluche object.

- [ ] **Step 4: Product detail — deposit reflects the selected size**

Open `http://localhost:3000/peluches/osito-caramelo`. Pick the 30%-deposit size: the trust badge should read "Abono 30%" and "Pagas $X hoy vía Wompi" with X = 30% of the total rounded to 100. Switch to the free-shipping size: the badge percentage updates accordingly. Add the 30%/5000-shipping size to the cart.

- [ ] **Step 5: Cart & checkout — totals use the per-size values**

Open `http://localhost:3000/cart`. The deposit-now figure should be 30% of the subtotal (rounded to 100); shipping should be 5000 (for that one line). Add the free-shipping size of the same peluche to the cart too — shipping should stay 5000 (only the non-free line contributes). Proceed to checkout, fill the form, choose "Abono (contraentrega)", and place the order.

- [ ] **Step 6: Order & payment handoff — the amount sent to Wompi is correct**

After placing the order, on the payment page (or via the API), check the order:
```bash
curl -s "http://localhost:3000/api/payment/info/<ORDER_NUMBER>/" | python3 -m json.tool
```
Expected: `deposit_amount` = weighted 30%/50% by line, `shipping_amount` = 5000, `amount_paid_now` = `deposit_amount`. Then in Django shell confirm the gateway amount:
```bash
cd backend && source venv/bin/activate && python manage.py shell -c "
from base_feature_app.models import Order, WompiTransaction
o = Order.objects.get(order_number='<ORDER_NUMBER>')
tx = WompiTransaction.objects.get(order=o)
print('amount_paid_now', o.amount_paid_now, 'amount_in_cents', tx.amount_in_cents)
assert tx.amount_in_cents == o.amount_paid_now * 100
print('OK — gateway amount matches')
"
```
Do **not** attempt a real Wompi payment — verification stops at confirming `amount_in_cents`.

- [ ] **Step 7: Run the focused test suites once more**

```bash
cd backend && source venv/bin/activate && pytest base_feature_app/tests/services/test_order_service.py -q
cd frontend && npm test -- lib/utils/__tests__/pricing.test.ts
```
Expected: all PASS.

- [ ] **Step 8: Update Memory Bank docs**

Append to `docs/methodology/architecture.md` (or `tasks/active_context.md`) a short note that deposit %, full-payment discount %, and shipping (free/cost) are now configured per size on `PeluchSizePrice` (alongside `price`), while `discount_pct` remains a peluche-level field. Commit:
```bash
git add docs/ && git commit -m "docs: per-size pricing config note"
```

---

## Out of scope / follow-ups (not part of this plan)

- E2E (Playwright) coverage for the new per-size checkout path — add a `@flow:` test later if desired.
- Frontend component tests (a `PeluchForm` round-trip test for `size_prices_data`, a product-detail test that switching size updates the displayed deposit) — deferred; covered manually in Task 8 steps 2 & 4 for now. The pure pricing helpers *are* unit-tested (Task 6).
- Seed commands (`seed_demo`, `seed_featured`, `seed_peluches`, `create_fake_data`) still work via the new defaults; optionally give them realistic per-size values.
- Renaming `PeluchSizePrice` → `PeluchSize` (deliberately not done).
- `wompi_service.py`, `payment_views.py`, the `Order`/`WompiTransaction` models, `/payment/info`, `/payment/process` — untouched by design.
