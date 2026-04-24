---
trigger: manual
description: Current work focus, recent changes, active decisions, and next steps for Mimittos.
---

# Active Context — Mimittos

Last updated: 2026-04-24

---

## Current Focus

Final quality review on branch `double-check-22042026` before merging to `main`.

All major features are complete. The current effort is verifying test coverage and quality across backend, frontend unit, and E2E layers.

---

## Recent Changes (from git log)

| Commit | Change |
|--------|--------|
| `257da4f` | Add `delivered_order_with_peluch` fixture to satisfy purchase validation in review test |
| `a6423b8` | Achieve 100% E2E flow coverage — add orders, peluch-detail, checkout-wompi tests; fix auth Spanish locators |
| `281a734` | Improve test quality to pass quality gate at 99/100 |
| `fe7e810` | Fix captcha test to expect Spanish password error message |
| `f3c4b86` | Fix tests to match Spanish auth messages, Wompi `id` key, and refactored order view |

---

## Active Decisions

- **Spanish locale is canonical for tests**: All E2E and unit tests assert Spanish-language strings (error messages, labels). English translations exist in code but tests don't cover them separately.
- **Wompi uses `id` field**: Wompi transaction responses return `id`, not `transaction_id`. Tests and serializers align with this.
- **E2E flow definitions are the contract**: Every navigable user flow must be registered in `frontend/e2e/flow-definitions.json` and documented in `docs/USER_FLOW_MAP.md` before writing E2E tests.

---

## Architecture State

- All 19 models implemented and migrated
- 58+ API endpoints across 13 URL modules
- 26 frontend routes (App Router)
- 5 Zustand stores, 13 API services, 2 custom hooks

---

## Next Steps

1. Implement test infrastructure fixes from /new-feature-checklist audit (see tasks_plan.md backlog)
   - Phase 1: Backend factories.py + conftest.py update
   - Phase 2: 3 missing page tests + usePageView + paymentService + jest thresholds
   - Phase 3: E2E authenticated flows (auth-logout, session-persistence, backoffice, dashboard)
2. Merge `double-check-22042026` + test fixes → `main`
3. Deploy to staging
4. Verify deployment with smoke tests
