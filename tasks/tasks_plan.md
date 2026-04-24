---
trigger: manual
description: Task backlog, feature completion status, known issues, and test coverage tracking for Mimittos.
---

# Tasks Plan — Mimittos

Last updated: 2026-04-24

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
| Test files | 57 |
| Page tests | 24 |
| Component tests | 8 |
| Store tests | 5 |
| Hook tests | 2 |
| Service tests | 13 |
| Other (utils, i18n, scripts, app) | 5 |

### E2E (Playwright)

| Metric | Count |
|--------|-------|
| Test files | 11 |
| Flow coverage | 100% (all flows in `flow-definitions.json`) |
| Test quality gate | 99/100 |

---

## Current Work

**Branch**: `double-check-22042026`
**Status**: Final quality review before merge to main

Recent completions on this branch:
- 100% E2E flow coverage achieved
- Test quality gate reached 99/100
- Spanish locale locators fixed across all E2E tests
- Wompi `id` key usage corrected (not `transaction_id`)

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

#### E2E
- [ ] Add flow constants to `flow-tags.ts`: `AUTH_LOGIN_SUCCESS`, `AUTH_LOGOUT`, `AUTH_SESSION_PERSISTENCE`, `APP_DASHBOARD_ACCESS`, `BACKOFFICE_LOGIN`, `BACKOFFICE_DASHBOARD_DISPLAY`, `BACKOFFICE_ORDER_MANAGEMENT`, `PAYMENT_PAGE_DISPLAY`, `ORDER_CONFIRMED_DISPLAY`, `REVIEW_SUBMIT`
- [ ] Create `e2e/auth/auth-success.spec.ts` — auth-login-success (mock API), auth-logout (cookie clear), auth-session-persistence
- [ ] Create `e2e/app/dashboard.spec.ts` — app-dashboard-access (mock auth cookies)
- [ ] Create `e2e/backoffice/backoffice.spec.ts` — backoffice-login, backoffice-dashboard-display, backoffice-order-management
- [ ] Fix `auth.spec.ts` — auth-sign-up complete form submission (happy path with mocked API)
- [ ] Add cart quantity=0 removes item test to `cart.spec.ts`
- [ ] Update USER_FLOW_MAP.md note: flow-definitions.json is authoritative source; IDs in USER_FLOW_MAP map to flow-definitions keys
