---
trigger: manual
description: Project intelligence and lessons learned. Reference for project-specific patterns, preferences, and key insights discovered during development.
---

# Lessons Learned — Mimittos

This file captures important patterns, preferences, and project intelligence that help work more effectively with this codebase. Updated as new insights are discovered.

---

## 1. Architecture Patterns

### Content Storage: Structured JSON over CMS
- Proposal sections, portfolio works, and blog posts use Django `JSONField` for content
- Each proposal section's `content_json` maps directly to a React component's props interface
- Blog supports dual format: structured JSON (preferred) with HTML fallback via `dangerouslySetInnerHTML` (sanitized with DOMPurify)
- This avoids the need for a full CMS while keeping content rich and structured

### Single Django App: `base_feature_app`
- All models, views, serializers, and services live in the `base_feature_app` app
- This works for now but may need splitting if scope grows significantly
- Models are already split into individual files under `base_feature_app/models/`

### Service Layer Pattern
- Business logic lives in `base_feature_app/services/`, not in views
- Views are thin FBV wrappers that call service methods

---

## 2. Code Style & Conventions

### Backend: Function-Based Views (FBV)
- **All** DRF views use `@api_view` decorators, not class-based views
- Never convert to CBV unless explicitly requested

### Frontend: Zustand Stores
- State management uses Zustand with TypeScript
- HTTP requests go through centralized API client in `lib/services/http.ts` (Axios instance with JWT interceptors)

### Bilingual Content Pattern
- Models have paired fields: `title_en`/`title_es`, `content_json_en`/`content_json_es`, etc.
- Frontend reads the appropriate field based on current locale via `next-intl`
- Proposals have a `language` field (`es`/`en`) that determines which default content to use

### Naming Conventions
- Backend: snake_case for everything (Python standard)
- Frontend components: PascalCase (`product/ProductCard.tsx`, `layout/Header.tsx`)
- Frontend hooks: camelCase with `use` prefix (`useExpirationTimer.ts`)
- Frontend stores: camelCase (`useProposalStore.ts`)

---

## 3. Development Workflow

### Backend Commands Always Need venv
```bash
source venv/bin/activate && <command>
# or
venv/bin/python <command>
```

### Huey Immediate Mode in Development
- When `DJANGO_ENV != 'production'`, Huey tasks execute synchronously
- No need to run Redis or Huey worker for development
- Tasks still need to be importable and functional

### Frontend Dev Proxy
- Next.js proxies `/api`, `/admin`, `/static`, `/media` to Django at `127.0.0.1:8000`
- Both servers must be running simultaneously for full functionality
- In production, everything goes through Django (no separate Next.js server)

### Test Execution Rules
- Never run the full test suite — always specify files
- Backend: `pytest backend/content/tests/<specific_file> -v`
- Frontend: `npm test -- <specific_file>`
- E2E: max 2 files per `npx playwright test` invocation
- Use `E2E_REUSE_SERVER=1` when dev server is already running

---

## 4. Staging Deployment

### Build Flow
1. Frontend: `npm run build` → generates static output
2. Backend: `python manage.py collectstatic` → copies to `backend/staticfiles/`
3. Restart: `sudo systemctl restart base_django_react_next_feature_staging && sudo systemctl restart base_django_react_next_feature-staging-huey`

### Django Serves Next.js Pages
- The catch-all view in `base_feature_project/views.py` serves pre-rendered Next.js pages
- This is the LAST URL pattern — all other routes take priority

---

## 5. Email System

### Template Registry Pattern
- All emails defined in `EmailTemplateRegistry` with default content
- Admin can override content via `EmailTemplateConfig` model
- Admin can disable specific emails via `is_active` flag
- Preview rendering available for all templates

### Transactional Emails
- Order confirmation, status update, and account emails are all transactional
- Each email type defined in `EmailTemplateRegistry` with default content
- Admin can override content via `EmailTemplateConfig` model in Django admin
- Admin can disable specific email types via `is_active` flag

---

## 6. Mimittos Domain Specifics

### Wompi Payment Flow
- Checkout creates an `Order` + initiates Wompi transaction via `wompi_service`
- Wompi sends async webhook to `POST /api/payment/wompi-webhook/` on status change
- Webhook updates `WompiTransaction.status` and triggers `order_service` to update order status
- Wompi response uses `id` field for transaction identifier (not `transaction_id`)
- PSE bank list fetched from Wompi API at checkout time

### Personalization Media
- Four customization layers per order item: huella, corazón, audio, size+color
- Audio and image files uploaded via `POST /api/media/upload/`
- Files validated (type + 5 MB limit) and stored in `backend/media/`
- `PersonalizationMedia` model links media files to `OrderItem`

### Review Gate
- Reviews only allowed after order status is `DELIVERED`
- Enforced in `review_service` — raises validation error otherwise
- Staff approves reviews via backoffice before they appear publicly

---

## 7. Testing Insights

### Backend conftest.py
- Custom coverage report with Unicode progress bars replaces default pytest-cov output
- `api_client` fixture provides unauthenticated DRF APIClient
- `base_feature_app/tests/` has its own `conftest.py` with model-specific fixtures (factories via factory-boy)

### E2E Flow Definitions
- Every navigation flow must be registered in `docs/USER_FLOW_MAP.md` and `frontend/e2e/flow-definitions.json`
- E2E tests must reflect real user integrations
- Follow quality standards from `docs/TESTING_QUALITY_STANDARDS.md`

### Spanish Locale is Canonical for Tests
- All E2E and most unit tests assert Spanish-language strings
- Wompi responses use `id` (not `transaction_id`) — tests align with this
- Test fixtures for review tests require an order in `DELIVERED` status
