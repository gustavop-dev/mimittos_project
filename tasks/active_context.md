---
trigger: manual
description: Current work focus, recent changes, active decisions, and next steps for Mimittos.
---

# Active Context — Mimittos

Last updated: 2026-05-21

---

## Cascade color/size deletion (2026-05-21)

Admins can now hard-delete a global color or size from `PeluchForm`. `PeluchSizePrice.size` is
`CASCADE` and `OrderItem.size/color` are `SET_NULL` (migration `0013`), so deletion is unblocked
and cascades to the catalog while order history survives via `OrderItem.configuration_snapshot`
(`size_label`/`color_name` already stored there). New admin endpoints `GET /colors|sizes/<id>/usage/`
feed real impact counts into a branded SweetAlert2 dialog (`lib/utils/confirmDelete.ts`) that gates
the delete button on typing the exact preset name. Order views fall back to the snapshot via
`lib/utils/orderItemDisplay.ts` when the FK is null. Spec/plan:
`docs/superpowers/specs/2026-05-21-cascade-color-size-deletion-design.md`,
`docs/superpowers/plans/2026-05-21-cascade-color-size-deletion.md`.

---

## Branch `fix/peluche-size-deselection-not-persisting` (2026-05-21)

Fixed the product-detail color/photo mismatch (see `error-documentation.md` ERROR-001). The peluch
serializers (`PeluchListSerializer`, `PeluchDetailSerializer`) no longer emit a separate
`color_images_meta` array — each entry of `available_colors` now carries its own `preview_url`,
`image_count`, and (detail only) `images`. List endpoints omit the full `images` array to keep the
catalog payload light. The lazy per-color `getColorImages` fetch was removed; the detail payload
ships all per-color images at once. Purchase flow untouched: cart/checkout still read the
`CartItem.gallery_urls` snapshot, whose shape is unchanged.

---

## Branch `feat/per-size-pricing` (2026-05-12)

Moved the per-product pricing knobs onto `PeluchSizePrice` so each size is configured independently:
`deposit_percentage`, `full_payment_discount_pct`, `free_shipping`, `shipping_cost` now live on `PeluchSizePrice`
(alongside `price`), not on `Peluch`. `discount_pct` (general always-on discount) stays on `Peluch`.
Migration `0012_per_size_pricing_config` copies each peluche's old values onto all of its size rows, then drops
the four columns from `Peluch`. `OrderService.create_order` reads deposit/discount/shipping per matched size;
everything downstream (`Order` snapshot fields, `WompiTransaction.amount_in_cents`, `wompi_service.py`,
`/payment/*`) is unchanged. Frontend: product detail snapshots the selected size's config onto the `CartItem`
(shape unchanged) and shows that size's "Abono X%"; the backoffice `PeluchForm` edits the four fields per size
row instead of in a global "Pagos y envíos" section. Spec/plan: `docs/superpowers/specs/2026-05-12-per-size-pricing-config-design.md`,
`docs/superpowers/plans/2026-05-12-per-size-pricing-config.md`.

Note: dev DB is now MySQL (`.env`); the `mimittos` user can't create the pytest `test_*` DB, so run backend
tests with `DJANGO_DB_ENGINE=django.db.backends.sqlite3 pytest ...` (the project's original SQLite test setup).

---

## Current Focus

Stabilizing CI on branch `double-check-30042026`. The 1 failing E2E (`auth-login-invalid`) is fixed and the CI matrix now exercises all 20 e2e spec files — projected 61/61 flow coverage on next CI run.

Pending product decisions from flow audit (2026-05-01) before registering 4 new flows in `flow-definitions.json` / `USER_FLOW_MAP.md`.

---

## Recent Changes (this branch)

| Commit | Change |
|--------|--------|
| `9598e89` | ci(e2e): expand matrix from 4 → 6 shards, every spec file runs |
| `701e083` | fix: http.ts 401 interceptor was refreshing tokens on unauthenticated requests, causing sign-in failures to redirect to home |
| `fdfb66e` | test(e2e): mock `sign_in/` to force deterministic 401 path |
| `5526eb7` | test(e2e): assert non-redirect invariant for invalid credentials |
| `b62eed4` | chore: gitignore coverage artifact files |
| `8e35d85` | ci(quality-gate): trigger on every PR/push, drop paths filter |
| `b05e492` | ci: adopt blob+merge-reports pattern with custom matrix |

---

## Active Decisions

- **Spanish locale is canonical for tests**: All E2E and unit tests assert Spanish-language strings. English translations exist in code but tests don't cover them separately.
- **Wompi uses `id` field**: Wompi transaction responses return `id`, not `transaction_id`. Tests and serializers align with this.
- **E2E flow definitions are the contract**: Every navigable user flow must be registered in `frontend/e2e/flow-definitions.json` and documented in `docs/USER_FLOW_MAP.md` before writing E2E tests.
- **401 interceptor only refreshes when Authorization header was on the request** (`frontend/lib/services/http.ts`) — public endpoints returning 401 (sign_in, sign_up, google_login) reject directly so the page can render the error message.
- **CI E2E matrix is explicit, not glob-based** — each spec file is listed by name in `.github/workflows/ci.yml` to avoid double-runs and to keep shard balance visible.

---

## Architecture State

| Layer | Count |
|-------|-------|
| Backend models | 19 |
| View files (FBV organized by domain) | 16 |
| Service modules | 7 |
| Serializer files | 18 |
| Migrations | 10 |
| Management commands | 13 |
| URL modules | 13 (~60+ paths) |
| Frontend pages (App Router) | 27 |
| Frontend components | 20 |
| Zustand stores | 10 |
| Frontend services (axios + helpers) | 13 |

---

## Next Steps

1. Wait for CI to confirm 61/61 flow coverage on `9598e89`.
2. Get product decisions on flow-audit findings (see `tasks_plan.md` "Flow Audit Findings"):
   - Whether to wire a backend handler for the contact form (or remove the form).
   - Whether to build backoffice blog management UI (or remove the unused endpoints).
   - Whether to register `app-dashboard-access` rename.
3. After decisions: register the 4 new flows in `flow-definitions.json` + `USER_FLOW_MAP.md` and add specs.
4. Expand the 6 partial-coverage specs (CRUD/submit assertions, not just page-render).
5. Merge `double-check-30042026` → `main`.
