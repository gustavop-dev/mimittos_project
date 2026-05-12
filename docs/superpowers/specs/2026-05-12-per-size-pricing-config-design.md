# Per-size pricing config (deposit %, shipping, full-payment discount)

**Date:** 2026-05-12
**Status:** Approved — ready for implementation plan

## Problem

A `Peluch` (plush toy) currently carries four pricing-related fields that are **global to the whole product**:

| Field | Meaning |
|---|---|
| `deposit_percentage` | % of the price charged upfront for cash-on-delivery (`deposit`) mode |
| `full_payment_discount_pct` | extra % discount if the customer pays the full amount upfront (`full` mode) |
| `free_shipping` | if true, this product adds no shipping cost |
| `shipping_cost` | shipping cost in COP per unit, ignored when `free_shipping` is true |

Meanwhile **price is already per-size** via `PeluchSizePrice (peluch, size → price, is_available)`. The business need is that each size of a product can have its own deposit %, its own shipping (free or a cost), and its own full-payment discount — exactly the same way `price` already works per size.

There is also a separate, always-on `discount_pct` on `Peluch` (general discount applied to the size's base price). **`discount_pct` stays at the `Peluch` level** — only the four fields above move per-size. *(Decision confirmed with the user.)*

## Scope & boundaries

- Backend: model, migration, serializers, `OrderService.create_order` (the order-pricing path), Django admin inline, tests.
- Frontend: TypeScript types, product detail page, cart store (no logic change, only data source), backoffice `PeluchForm`, tests.
- **Out of scope / must not change:** `wompi_service.py`, `payment_views.py`, the `Order` / `WompiTransaction` models, `/payment/info`, `/payment/process`, and the cart/checkout pages' totals logic. The work stops once `OrderService.create_order` has correctly populated the `Order` snapshot fields and the `WompiTransaction.amount_in_cents`; everything downstream toward the Wompi gateway is untouched.
- The `PeluchSizePrice` model is **not renamed** (it now means "config for this size on this peluche" rather than just "price", but renaming touches the migration + ~15 files for little gain). *(Decision confirmed with the user.)*

## Current flow (as found)

- `OrderService.create_order(validated_data, user)`:
  - For each item dict it calls `_item_subtotal(item, peluch)`, which `PeluchSizePrice.objects.get(peluch, size, is_available=True)`, computes `personalization_cost` from the peluche's `*_extra_cost`, applies `peluch.discount_pct` to `size_price.price` → `unit_price`, and returns `(unit_price, personalization_cost, line_subtotal)`.
  - It accumulates a weighted-by-line deposit (`line_subtotal * peluch.deposit_percentage / 100`), a weighted full-payment discount (`line_subtotal * peluch.full_payment_discount_pct / 100`), and a shipping total (`peluch.shipping_cost * quantity` unless `peluch.free_shipping`).
  - Rounds each to the nearest 100 COP. `total_amount = product_subtotal` (products only; shipping is separate).
  - For `payment_mode == FULL`: `amount_paid_now = max(product_subtotal - discount_amount, 0) + shipping_amount`, `balance_amount = 0`. For `DEPOSIT`: `amount_paid_now = deposit_amount`, `balance_amount = (product_subtotal - deposit_amount) + shipping_amount`.
  - Creates the `Order` with those snapshot fields, then one `OrderItem` per item (with a `configuration_snapshot` JSON that currently stores `peluch.deposit_percentage`, `peluch.full_payment_discount_pct`, `peluch.free_shipping`, `peluch.shipping_cost`, plus `peluch.discount_pct` and `size_price.price`), then a `WompiTransaction(amount_in_cents=amount_paid_now * 100)`.
- `WompiService.process_transaction(tx, ...)` later reads `tx.amount_in_cents` and POSTs it to Wompi. **Not touched.**
- Frontend product detail (`app/peluches/[slug]/page.tsx`): tracks the selected size via `activeSizeIdx`, reads `size_prices[activeSizeIdx].price`, applies `peluch.discount_pct` for display, **hardcodes `Math.round(total * 0.5 / 100) * 100` for the displayed deposit** (a bug — it ignores `deposit_percentage`), and on "add to cart" copies `peluch.deposit_percentage / full_payment_discount_pct / free_shipping / shipping_cost` onto the `CartItem`.
- `cartStore.ts`: `calcDeposit`, `calcFullPaymentDiscount`, `calcShipping`, `calcAmountToPayNow`, `calcBalanceAtDelivery` all read per-`CartItem` fields and weight per line. Cart page and checkout page just consume those helpers; checkout sends only `{peluch_id, size_id, color_id, quantity, personalization…}` + `payment_mode` to the backend.
- Backoffice `PeluchForm.tsx`: a "Pagos y envíos" section with the four global inputs, and a separate "Tallas y precios" table where each row is `{size_id, price, is_available}`; the submitted payload has the four fields at top level and `size_prices_data: [{size_id, price, is_available}]`.

## Design

### 1. Model & migration

Add four fields to `PeluchSizePrice` (same defaults/validators they have on `Peluch` today):

```python
class PeluchSizePrice(models.Model):
    peluch = FK(Peluch, on_delete=CASCADE, related_name='size_prices')
    size   = FK(GlobalSize, on_delete=PROTECT, related_name='peluch_prices')
    price  = PositiveIntegerField()
    is_available = BooleanField(default=True)
    # NEW:
    deposit_percentage = PositiveSmallIntegerField(
        default=50, validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text='% del precio que se cobra como anticipo (modalidad contraentrega) para esta talla.')
    full_payment_discount_pct = PositiveSmallIntegerField(
        default=0, validators=[MaxValueValidator(100)],
        help_text='% de descuento si el cliente paga el total por adelantado, para esta talla.')
    free_shipping = BooleanField(
        default=False, help_text='Si está activo, esta talla no aporta costo de envío.')
    shipping_cost = PositiveIntegerField(
        default=0, help_text='Costo de envío en COP para esta talla. Se ignora si free_shipping=True.')

    class Meta:
        unique_together = ('peluch', 'size')
        ordering = ['size__sort_order']
```

Remove the four fields from `Peluch` (keep `discount_pct`, `huella_extra_cost`, `corazon_extra_cost`, `audio_extra_cost`).

**One migration** with three steps:
1. `AddField` × 4 on `PeluchSizePrice` (defaults make this safe on existing rows).
2. `migrations.RunPython(copy_forward, copy_backward)`:
   - `copy_forward`: for every `PeluchSizePrice`, set `deposit_percentage / full_payment_discount_pct / free_shipping / shipping_cost` from its related `peluch`. Bulk-update.
   - `copy_backward`: re-creating the columns is handled by Django's reverse of `RemoveField`; this RunPython's reverse best-effort copies, per `Peluch`, the values from its first `PeluchSizePrice` (order by `size__sort_order`) back onto the peluche — acceptable for a dev-only rollback.
3. `RemoveField` × 4 on `Peluch`.

### 2. Serializers (`base_feature_app/serializers/catalog.py`)

- `PeluchSizePriceSerializer` (read, nested in `PeluchDetailSerializer.size_prices`): add `deposit_percentage`, `full_payment_discount_pct`, `free_shipping`, `shipping_cost` to `fields`.
- `PeluchSizePriceWriteSerializer` (the `Serializer` used in `size_prices_data`): add the four fields — `deposit_percentage = IntegerField(default=50, min_value=1, max_value=100)`, `full_payment_discount_pct = IntegerField(default=0, min_value=0, max_value=100)`, `free_shipping = BooleanField(default=False)`, `shipping_cost = IntegerField(default=0, min_value=0)`.
- `PeluchCreateUpdateSerializer`: remove `deposit_percentage`, `full_payment_discount_pct`, `free_shipping`, `shipping_cost` from `Meta.fields` (keep `discount_pct`). In `_sync_size_prices`, include the four fields in `defaults` of `update_or_create`.
- `PeluchListSerializer` and `PeluchDetailSerializer`: remove the four fields from `Meta.fields` (the list never needed them; the detail exposes them via `size_prices`). Keep `discount_pct`, `min_price`, `discounted_min_price`.

### 3. Order pricing path (`base_feature_app/services/order_service.py`)

- Refactor `_item_subtotal(item, peluch)` to also return the `PeluchSizePrice` instance it already fetched (it currently fetches the same row twice — once here, once again for the snapshot). New signature returns `(size_price, unit_price, personalization_cost, line_subtotal)`.
- In `create_order`'s loop, read `deposit_pct`, `full_disc_pct`, `free_shipping`, `shipping_cost` from `size_price`, not `peluch`:
  - `deposit_pct = size_price.deposit_percentage or int(getattr(settings, 'DEPOSIT_PERCENTAGE', 50))`
  - `full_disc_pct = size_price.full_payment_discount_pct or 0`
  - `if not size_price.free_shipping: shipping_total += size_price.shipping_cost * item['quantity']`
- The weighted-per-line arithmetic, the rounding to 100, `total_amount`, the `FULL` vs `DEPOSIT` branches, the `Order.objects.create(...)`, and `WompiTransaction(amount_in_cents=amount_paid_now * 100)` are **unchanged in formula** — only the source of the four values changes.
- `OrderItem.configuration_snapshot`: `deposit_percentage`, `full_payment_discount_pct`, `free_shipping`, `shipping_cost` now come from `size_price`; `discount_pct` and `original_unit_price` are unchanged.
- `OrderService.calculate_deposit(total)` (legacy global fallback, used only by `create_fake_data`): unchanged.

### 4. Django admin (`base_feature_app/admin.py`)

- `PeluchSizePriceInline.fields = ('size', 'price', 'is_available', 'deposit_percentage', 'full_payment_discount_pct', 'free_shipping', 'shipping_cost')`.
- `PeluchAdmin`: nothing to remove (the four fields were never in an explicit fieldset; removing them from the model makes them disappear).

### 5. Frontend types (`frontend/lib/types.ts`)

- `PeluchSizePrice`: add `deposit_percentage: number`, `full_payment_discount_pct: number`, `free_shipping: boolean`, `shipping_cost: number`.
- `Peluch`: remove `deposit_percentage`, `full_payment_discount_pct`, `free_shipping`, `shipping_cost`. Keep `discount_pct`.
- `PeluchDetail`: unchanged except it inherits the slimmer `Peluch`; still has `discount_pct` and `size_prices: PeluchSizePrice[]`.
- `CartItem`: **no shape change** — it keeps `deposit_percentage`, `full_payment_discount_pct`, `free_shipping`, `shipping_cost`; these are now a snapshot of the chosen size's config rather than the peluche's.

### 6. Product detail page (`frontend/app/peluches/[slug]/page.tsx`)

- The price/deposit/shipping panel reflects `size_prices[activeSizeIdx]` whenever the size changes: deposit %, "envío gratis" vs cost, and full-payment discount of *that size*.
- Replace the hardcoded `Math.round(total * 0.5 / 100) * 100` with a computation using `activeSizePrice.deposit_percentage` (rounded to the nearest 100, matching the backend).
- On "add to cart", populate the `CartItem`'s four fields from `activeSizePrice` (fallbacks `50 / 0 / false / 0` if a stale/missing size config ever arrives).

### 7. Cart store / cart page / checkout

- `cartStore.ts`: **no logic change** — the helpers already weight per `CartItem`. Correctness now depends only on step 6 putting the right values on each `CartItem`.
- `cart/page.tsx` and `checkout/page.tsx`: no change. `allFreeShipping = items.every(i => i.free_shipping)` still makes sense (now "every line-size is free shipping").

### 8. Backoffice `PeluchForm.tsx`

- Remove the "Pagos y envíos" section (the four global inputs) and the corresponding keys from form state and validation.
- The "Tallas y precios" table gains, per row: `% anticipo` (number, 1–100), `% descuento pago completo` (number, 0–100), `envío gratis` (checkbox), `costo envío` (number, ≥0, disabled when "envío gratis" is checked).
- When editing an existing peluche, initialize those per-row fields from the API's `size_prices`.
- Submitted payload: drop the four top-level keys; each `size_prices_data` row becomes `{ size_id, price, is_available, deposit_percentage, full_payment_discount_pct, free_shipping, shipping_cost }`.

### 9. Tests

- Update `backend/base_feature_app/tests/services/test_order_service.py` (and any `test_payment_views` / `test_review_and_payment_views` that build a `Peluch` with the removed fields) so the four values are set on the `PeluchSizePrice` rows instead.
- Keep the existing `calculate_deposit` tests as-is.
- New tests:
  - per-size `deposit_percentage` drives `deposit_amount` / `amount_paid_now` in `DEPOSIT` mode;
  - per-size `full_payment_discount_pct` drives `discount_amount` / `amount_paid_now` in `FULL` mode;
  - per-size `free_shipping=True` contributes zero shipping while another size of the same peluche with `shipping_cost>0` contributes;
  - an order with two sizes of the *same* peluche, each with a different config, produces the correct weighted `amount_paid_now`, and `WompiTransaction.amount_in_cents == amount_paid_now * 100`.
- Frontend: a `PeluchForm` test that the per-row config round-trips into `size_prices_data`; a product-detail test that switching size updates the displayed deposit/shipping.
- Seeds (`seed_demo`, `seed_featured`, `seed_peluches`, `create_fake_data`): continue to work via defaults; optionally set realistic per-size values — not blocking.

## End-to-end verification (manual, after implementation)

Backoffice saves per-size config → product detail shows the right deposit/shipping/full-payment discount when switching size → cart and checkout totals match → order created with correct `deposit_amount` / `shipping_amount` / `discount_amount` / `amount_paid_now` → `/payment/info` returns them → `WompiTransaction.amount_in_cents == amount_paid_now * 100`. The actual Wompi call is neither modified nor exercised.

## Risks / notes

- Existing `localStorage` carts hold the old `CartItem` shape (values copied from the peluche). Since `CartItem`'s shape doesn't change, they keep working; the next add-to-cart for that product will use per-size values. Acceptable — the cart is ephemeral.
- The migration's `RunPython` reverse is best-effort (collapses per-size values back to a single per-peluche value from the first size). This is a one-way change in practice; the reverse exists only so `migrate <app> <prev>` doesn't hard-fail in dev.
- `DEPOSIT_PERCENTAGE` Django setting remains the fallback when a `PeluchSizePrice.deposit_percentage` is somehow falsy (shouldn't happen given the `MinValueValidator(1)` and default 50).
