---
trigger: manual
description: Task backlog, feature completion status, known issues, and test coverage tracking for Mimittos.
---

# Tasks Plan — Mimittos

Last updated: 2026-05-01

---

## Feature Status

### ✅ Completed

| Feature | Notes |
|---------|-------|
| Auth system | Email/password + Google OAuth + email verification + password reset |
| Product catalog | Peluch listing, filtering by category/size/color, featured products |
| Peluch detail | Gallery, size/price selector, personalization options (huella, corazón, audio) |
| Cart | Guest cart via localStorage + `cartStore`; persistence across sessions |
| Checkout | Wompi integration (credit/debit/PSE); order creation on payment |
| Wompi webhook | Auto status updates from Wompi events; transaction records |
| Order tracking | `/tracking?order=<id>` public; `/orders` authenticated history |
| Reviews | Post-delivery reviews; staff approval flow |
| Backoffice | Order management, peluch CRUD, category management, user list |
| Blog | Bilingual posts (ES/EN) with structured JSON content |
| Analytics | Page view tracking; KPI dashboard; data export |
| Email system | Template registry; transactional emails (verification, order updates) |
| Captcha | Google reCAPTCHA integration on auth endpoints |
| Bilingual i18n | ES primary, EN secondary via next-intl |
| Media uploads | Image/audio for personalization; compression + validation |

---

## Testing Status

### Backend (pytest)

| Metric | Count |
|--------|-------|
| Test files | 41 |
| Categories | models (5), serializers (6), services (7), views (15), utils (5), commands (3) |
| Coverage reports | `.coverage_full.json`, `.catalog_cov.json`, `.coverage_out.json` |

### Frontend Unit (Jest + Testing Library)

| Metric | Count |
|--------|-------|
| Test files | 60 |
| Categories | page, component, store, hook, service, util, i18n, app |

### E2E (Playwright)

| Metric | Count |
|--------|-------|
| Test files | 20 |
| CI matrix shards | 6 (public, catalog, auth, purchase, app, backoffice) |
| Flow coverage | 61/61 in `flow-definitions.json` |
| Test quality gate | 99/100 |

---

## Current Work

**Branch**: `double-check-30042026`
**Status**: Stabilizing CI before merge to main

Recent completions on this branch:
- Fixed `http.ts` 401 interceptor refreshing on unauthenticated requests (caused sign-in error to redirect to home instead of showing message) — `701e083`
- Expanded CI E2E matrix from 4 → 6 shards so all 20 spec files run, lifting CI flow coverage from 33/61 to 61/61 — `9598e89`
- Made invalid-credentials E2E test deterministic by mocking `sign_in/` to return 401 — `fdfb66e`

---

## Known Issues

None documented.

---

## Backlog

### Test Infrastructure Fixes (from /new-feature-checklist audit 2026-04-24)

#### Backend
- [ ] Create `base_feature_app/tests/factories.py` — centralized factory-boy factories with unique slugs
- [ ] Update `base_feature_app/tests/conftest.py` to use factories + add `verified_user`, `unverified_user`, `order_item_with_personalization_media` fixtures

#### Frontend Unit
- [ ] Add `app/__tests__/page.test.tsx` (Home page — FAQ accordion, product carousel, add-to-cart)
- [ ] Add `app/backoffice/peluches/nuevo/__tests__/page.test.tsx`
- [ ] Add `app/backoffice/peluches/[slug]/__tests__/page.test.tsx` (loading, not-found, edit mode)
- [ ] Add `detectDevice` / `detectTrafficSource` tests to `usePageView.test.ts`
- [ ] Add network-error / 500-error scenarios to `paymentService.test.ts`
- [ ] Raise Jest thresholds from 50% to 65% global (stores 75%, utils 90%)

#### E2E (from /new-feature-checklist audit 2026-04-24 — most items now resolved)
- [x] Flow constants added; `auth-success.spec.ts`, `dashboard.spec.ts`, `backoffice/*.spec.ts` all exist and pass
- [ ] Add cart quantity=0 removes item test to `cart.spec.ts`
- [ ] Update USER_FLOW_MAP.md note: flow-definitions.json is authoritative source; IDs in USER_FLOW_MAP map to flow-definitions keys

### Flow Audit Findings (2026-05-01) — pending product decisions

**New flows to register** (4):
- `backoffice-site-configuration` — promo banner + hero image management (`frontend/app/backoffice/configuracion/page.tsx`)
- `catalog-filter-by-category` and `catalog-sort-products` — filter/sort interactions on `/catalog`
- `auth-forgot-password-submit` — submission path beyond the form-display flow

**Partial-coverage flows** (existing IDs, specs only assert page renders):
- `backoffice-category-management`, `backoffice-user-management`, `backoffice-peluch-create`, `backoffice-peluch-edit`, `payment-page-display`, `checkout-wompi-redirect`

**Cleanup**:
- `app-dashboard-access` flow id is misleading — `/dashboard` route does not exist; tests actually exercise `/orders` redirect

**Product bugs surfaced by audit**:
- Contact form (`frontend/app/contact/page.tsx`) has no backend handler — submit is silent no-op
- Backoffice has no UI for blog management despite full CRUD endpoints in `backend/base_feature_app/urls/blog.py`
