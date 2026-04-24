---
trigger: manual
description: Technical stack, dev setup, design patterns, env config, and testing strategy for Mimittos.
---

# Technical Reference — Mimittos

---

## 1. Stack Versions

### Backend

| Package | Version |
|---------|---------|
| Python | 3.x (venv) |
| Django | 6.0.2 |
| djangorestframework | 3.16.1 |
| djangorestframework-simplejwt | 5.5.1 |
| django-cors-headers | 4.9.0 |
| mysqlclient | >=2.2,<3.0 |
| Pillow | 12.1.1 |
| easy-thumbnails | 2.10.1 |
| Huey | >=2.5.0 |
| Redis | >=4.0.0 |
| pytest | 9.0.2 |
| pytest-cov | 7.0.0 |
| factory-boy | 3.3.3 |
| freezegun | 1.5.5 |
| gunicorn | >=23.0,<24.0 |
| ruff | 0.15.2 |

### Frontend

| Package | Version |
|---------|---------|
| Next.js | 16.1.6 |
| React | 19.2.4 |
| TypeScript | ^5 |
| Zustand | ^5.0.11 |
| Axios | ^1.13.5 |
| next-intl | ^4.8.3 |
| Tailwind CSS | ^4.2.1 |
| @playwright/test | ^1.58.2 |
| Jest | ^30.2.0 |
| @testing-library/react | ^16.3.2 |
| jwt-decode | ^4.0.0 |
| js-cookie | ^3.0.5 |
| @react-oauth/google | ^0.13.4 |
| recharts | ^3.8.1 |

---

## 2. Development Setup

### Backend

```bash
cd backend
source venv/bin/activate
python manage.py runserver 8000
```

- Huey tasks run **synchronously** in dev (`DJANGO_ENV != 'production'`) — no Redis/worker needed
- MySQL must be running locally or via Docker

### Frontend

```bash
cd frontend
npm install
npm run dev   # starts Next.js on :3000
```

- Next.js proxies `/api`, `/admin`, `/static`, `/media` to Django at `127.0.0.1:8000` (configured in `next.config.ts`)
- **Both servers must be running** for full functionality

### Environment Variables

```bash
# backend/.env
DJANGO_SECRET_KEY=...
DJANGO_ENV=development
DATABASE_URL=mysql://user:pass@localhost/mimittos
WOMPI_PUBLIC_KEY=...
WOMPI_PRIVATE_KEY=...
WOMPI_EVENTS_SECRET=...
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...

# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

---

## 3. Design Patterns

### Backend

**Function-Based Views (FBV)**
- All DRF views use `@api_view` decorators
- Never convert to class-based views (CBV) unless explicitly requested

**Service Layer**
- Business logic lives in `base_feature_app/services/` (not in views)
- Views are thin wrappers: validate request → call service → return response
- Services: `analytics_service`, `email_service`, `media_service`, `notification_service`, `order_service`, `review_service`, `wompi_service`

**Model Organization**
- Each model in its own file under `base_feature_app/models/`
- `__init__.py` re-exports all models

**URL Organization**
- 13 URL modules under `base_feature_app/urls/`, one per domain area
- Aggregated in `base_feature_app/urls/__init__.py` or main `urls.py`

### Frontend

**Zustand Stores**
- Five domain stores in `lib/stores/`: `authStore`, `blogStore`, `cartStore`, `localeStore`, `productStore`
- Stores use TypeScript types from `lib/types.ts`

**Service Layer**
- All HTTP calls go through `lib/services/` (13 service modules)
- Axios instance in `lib/services/http.ts` with JWT interceptors and auto-refresh on 401

**JWT Auth**
- Tokens stored in cookies (js-cookie)
- `useRequireAuth` hook enforces auth on protected routes
- Auto-logout on failed token refresh

**i18n**
- next-intl for bilingual routing (ES primary, EN secondary)
- `localeStore` tracks current locale
- Model fields: `name_es`/`name_en`, `content_json_es`/`content_json_en`

---

## 4. Testing Strategy

### Constraints

- **Never run the full test suite** — always specify files
- **Max 20 tests per batch**, 3 commands per cycle
- Always activate venv for backend tests

### Backend (pytest)

```bash
source venv/bin/activate && pytest backend/base_feature_app/tests/<file>.py -v
```

Test categories: `models/`, `serializers/`, `services/`, `views/`, `utils/`, `commands/`

Coverage reports stored in: `.coverage_full.json`, `.catalog_cov.json`, `.coverage_out.json`

### Frontend Unit (Jest)

```bash
cd frontend && npm test -- <path/to/file.test.tsx>
```

### E2E (Playwright)

```bash
cd frontend && npx playwright test e2e/<file>.spec.ts
# max 2 files per invocation
# use E2E_REUSE_SERVER=1 when dev server is already running
```

---

## 5. Task Queue

| Environment | Mode |
|-------------|------|
| Development | Immediate (synchronous) |
| Production | Redis-backed async |

Huey workers in production managed by systemd service: `base_django_react_next_feature-staging-huey`

---

## 6. Database

- **MySQL 8** (via `mysqlclient`)
- ORM: Django ORM exclusively — never raw SQL with user input
- Parameterized queries if raw SQL is unavoidable

---

## 7. Media & Files

- User uploads stored under `backend/media/`
- Thumbnails auto-generated via `easy-thumbnails`
- `django-cleanup` removes orphan files on model delete
- Allowed upload types: `.jpg`, `.jpeg`, `.png`, `.pdf` (images); audio files for personalization
- Max upload size: 5 MB (enforced in `validate_upload`)
