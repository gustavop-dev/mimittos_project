# Vulnerability Audit Report — `double-check-30042026`

**Project**: mimittos_project
**Date**: 2026-04-30
**Branch**: `double-check-30042026` (from `origin/main`)
**Scope**: Patch + minor dependency updates only. No major bumps.

---

## Summary CVEs

### Frontend (npm audit)

| Severity | Count |
|----------|------:|
| High     | 3 |
| Moderate | 5 |
| Low      | 0 |
| **Total**| **8** |

### Backend (pip-audit)

| Severity | Count |
|----------|------:|
| Total CVEs | 10 |
| Affected packages | 4 |

---

## Frontend Outdated Table

| Package | Current | Wanted | Latest | Bump Type |
|---------|---------|--------|--------|-----------|
| @playwright/test | 1.58.2 | 1.59.1 | 1.59.1 | minor |
| @react-oauth/google | 0.13.4 | 0.13.5 | 0.13.5 | patch |
| @tailwindcss/postcss | 4.2.1 | 4.2.4 | 4.2.4 | patch |
| @types/node | 25.3.0 | 25.6.0 | 25.6.0 | minor |
| axios | 1.13.5 | 1.15.2 | 1.15.2 | minor |
| eslint | 9.39.3 | 9.39.4 | 10.2.1 | patch (major skipped) |
| eslint-config-next | 16.1.6 | 16.1.6 | 16.2.4 | minor |
| eslint-plugin-playwright | 2.7.1 | 2.10.2 | 2.10.2 | minor |
| jest | 30.2.0 | 30.3.0 | 30.3.0 | minor |
| jest-environment-jsdom | 30.2.0 | 30.3.0 | 30.3.0 | minor |
| next | 16.1.6 | 16.1.6 | 16.2.4 | minor |
| next-intl | 4.8.3 | 4.11.0 | 4.11.0 | minor |
| react | 19.2.4 | 19.2.4 | 19.2.5 | patch |
| react-dom | 19.2.4 | 19.2.4 | 19.2.5 | patch |
| swiper | 12.1.3 | 12.1.4 | 12.1.4 | patch |
| tailwindcss | 4.2.1 | 4.2.4 | 4.2.4 | patch |
| typescript | 5.9.3 | 5.9.3 | 6.0.3 | none (major skipped) |
| zustand | 5.0.11 | 5.0.12 | 5.0.12 | patch |

## Backend Outdated Table

| Package | Current | Latest | Bump Type |
|---------|---------|--------|-----------|
| coverage | 7.13.4 | 7.13.5 | patch |
| Django | 6.0.2 | 6.0.4 | patch |
| djangorestframework | 3.16.1 | 3.17.1 | minor |
| Faker | 40.5.1 | 40.15.0 | minor |
| gunicorn | 23.0.0 | 25.3.0 | major (skipped, pinned `<24.0`) |
| pillow | 12.1.1 | 12.2.0 | minor |
| pytest | 9.0.2 | 9.0.3 | patch |
| pytest-cov | 7.0.0 | 7.1.0 | minor |
| requests | 2.32.5 | 2.33.1 | minor |
| ruff | 0.15.2 | 0.15.12 | patch |

---

## CVE Details

### Frontend

| Package | Severity | Advisory |
|---------|----------|----------|
| axios | moderate | NO_PROXY Hostname Normalization Bypass (SSRF); Unrestricted Cloud Metadata Exfiltration via Header Injection |
| brace-expansion | moderate | Zero-step sequence causes process hang and memory exhaustion |
| flatted | high | Prototype Pollution via parse() |
| follow-redirects | moderate | Leaks Custom Authentication Headers to Cross-Domain Redirect Targets |
| next | high | HTTP request smuggling in rewrites; unbounded next/image cache; unbounded postpone resume DoS; null-origin Server Actions CSRF bypass; null-origin dev HMR CSRF bypass; DoS with Server Components |
| next-intl | moderate | Open redirect vulnerability |
| picomatch | high | Method injection in POSIX character classes; ReDoS via extglob quantifiers |
| postcss | moderate | XSS via unescaped `</style>` in CSS stringify output |

### Backend

| Package | Version | CVE IDs | Fix Versions |
|---------|---------|---------|--------------|
| Django | 6.0.2 | CVE-2026-25674, CVE-2026-25673, CVE-2026-33033, CVE-2026-33034, CVE-2026-4292, CVE-2026-4277, CVE-2026-3902 | 6.0.3 / 6.0.4 |
| pillow | 12.1.1 | CVE-2026-40192 | 12.2.0 |
| pytest | 9.0.2 | CVE-2025-71176 | 9.0.3 |
| requests | 2.32.5 | CVE-2026-25645 | 2.33.0 / 2.33.1 |

---

## Reproducibility

### Frontend

```bash
cd frontend
npm install
npm audit --json > /tmp/mimittos_project-npm-audit.json
npm outdated --json > /tmp/mimittos_project-npm-outdated.json
```

### Backend

```bash
cd backend
python3 -m venv .venv-audit
.venv-audit/bin/pip install --upgrade pip pip-audit
.venv-audit/bin/pip install -r requirements.txt
.venv-audit/bin/pip-audit -r requirements.txt --format json > /tmp/mimittos_project-pip-audit.json
.venv-audit/bin/pip list --outdated --format json > /tmp/mimittos_project-pip-outdated.json
```

---

## Majors Skipped

Per the policy in this branch (patch + minor only, no major bumps):

| Package | Current | Latest Major | Reason |
|---------|---------|--------------|--------|
| eslint | 9.39.3 | 10.2.1 | major version bump |
| typescript | 5.9.3 | 6.0.3 | major version bump |
| gunicorn | 23.0.0 | 25.3.0 | constrained by `<24.0` pin in requirements.txt |

These should be addressed in a dedicated upgrade PR with breaking-change validation.

---

## Updates Applied

### Frontend (`frontend/package.json`)

Applied via `npm audit fix` and `npx npm-check-updates -u --target minor`:

- @playwright/test ^1.58.2 → ^1.59.1
- @react-oauth/google ^0.13.4 → ^0.13.5
- @tailwindcss/postcss ^4.2.1 → ^4.2.4
- @testing-library/dom ^10.0.0 → ^10.4.1
- @testing-library/jest-dom ^6.4.2 → ^6.9.1
- @testing-library/user-event ^14.5.2 → ^14.6.1
- @types/node ^25.3.0 → ^25.6.0
- axios ^1.13.5 → ^1.15.2
- eslint ^9.39.3 → ^9.39.4
- eslint-config-next 16.1.6 → 16.2.4
- eslint-plugin-playwright ^2.7.1 → ^2.10.2
- jest ^30.2.0 → ^30.3.0
- jest-environment-jsdom ^30.2.0 → ^30.3.0
- next 16.1.6 → 16.2.4
- next-intl ^4.8.3 → ^4.11.0
- react 19.2.4 → 19.2.5
- react-dom 19.2.4 → 19.2.5
- swiper ^12.1.3 → ^12.1.4
- tailwindcss ^4.2.1 → ^4.2.4
- zustand ^5.0.11 → ^5.0.12

### Backend (`backend/requirements.txt`)

- Django 6.0.2 → 6.0.4
- djangorestframework 3.16.1 → 3.17.1
- Faker 40.5.1 → 40.15.0
- pillow 12.1.1 → 12.2.0
- pytest 9.0.2 → 9.0.3
- pytest-cov 7.0.0 → 7.1.0
- coverage 7.13.4 → 7.13.5
- ruff 0.15.2 → 0.15.12
- requests 2.32.5 → 2.33.1

### Post-update CVE status

- **Backend pip-audit**: 0 vulnerabilities (was 10).
- **Frontend npm audit**: 3 moderate (was 8 — 3 high, 5 moderate). All 3 high vulns resolved.
  - Remaining: postcss 8.4.31 transitive under `next@16.2.4` (next bundles its own postcss). Cannot resolve without major upgrade or `overrides` (avoided per policy and to skip force).

## Build & Test Verification

### Frontend

- `npm run build`: SUCCESS (Next.js 16.2.4 Turbopack, 25 routes generated).
- `npm run test`: 60 suites / 324 tests PASS.
- `npm run lint`: pre-existing errors in `scripts/*.cjs` (require-style imports) — not introduced by this update; not fixed in this scope.

### Backend

- `python manage.py check`: SUCCESS (0 issues).
- `pytest`: 459 passed, 9 warnings (210s). All green.

## Rollbacks

None. All proposed patch+minor bumps installed cleanly and passed verification.

Notes on pydub: pydub 0.25.1 remained unchanged (not flagged as outdated). Native `ffmpeg` is a runtime requirement; not a security concern for this audit.

