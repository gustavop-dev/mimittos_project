# Vulnerability Audit & Dependency Update Report

**Branch:** main
**Date:** 2026-05-17
**Base:** main @ 6f6d5ba
**Scope:** patch + minor updates only (no major version bumps)

## Summary

| Surface  | Vulns (initial) | Vulns (final) | Outdated (initial) | Updated |
|----------|-----------------|---------------|--------------------|---------|
| Frontend | 2 (1 high, 1 moderate) | 3 moderate* | 16 | 14 (2 SKIP MAJOR) |
| Backend  | 24 CVEs en 7 paquetes | 7 CVEs en 3 paquetes† | 16 | 9 paquetes |

\* Las 3 moderate restantes están en `postcss` **empaquetado dentro de `next`** — la única "solución" de npm es downgrade a `next@9.3.3` (breaking change). Inaplicable.

† Vulnerabilidades restantes en dependencias transitivas no gestionadas directamente en `requirements.txt` (`pip`, `python-dotenv`, `urllib3`).

---

## Frontend — `npm audit` (initial)

| Paquete | Severity | CVEs / Notas |
|---------|----------|-------------|
| `next` 16.2.4 | **high** | DoS, middleware bypass, cache poisoning, XSS, SSRF (≥13 CVEs) |
| `postcss` (transitivo en next) | moderate | XSS via `</style>` no escapado — GHSA-qx2v-qp2m-jg93 |

**Totales iniciales:** 0 critical / 1 high / 1 moderate / 0 low = **2 total**

## Frontend — `npm outdated` (initial)

| Paquete | Current | Wanted | Latest | Acción |
|---------|---------|--------|--------|--------|
| `@playwright/test` | 1.59.1 | 1.60.0 | 1.60.0 | actualizado |
| `@tailwindcss/postcss` | 4.2.4 | 4.3.0 | 4.3.0 | actualizado |
| `@types/node` | 25.6.0 | 25.8.0 | 25.8.0 | actualizado |
| `axios` | 1.15.2 | 1.16.1 | 1.16.1 | actualizado |
| `eslint` | 9.39.4 | 9.39.4 | 10.4.0 | SKIP MAJOR (9→10) |
| `eslint-config-next` | 16.2.4 | 16.2.4 | 16.2.6 | actualizado |
| `jest` | 30.3.0 | 30.4.2 | 30.4.2 | actualizado |
| `jest-environment-jsdom` | 30.3.0 | 30.4.1 | 30.4.1 | actualizado |
| `js-cookie` | 3.0.5 | 3.0.7 | 3.0.7 | actualizado |
| `next` | 16.2.4 | 16.2.4 | 16.2.6 | actualizado (fix high) |
| `next-intl` | 4.11.0 | 4.12.0 | 4.12.0 | actualizado |
| `react` | 19.2.5 | 19.2.5 | 19.2.6 | actualizado |
| `react-dom` | 19.2.5 | 19.2.5 | 19.2.6 | actualizado |
| `tailwindcss` | 4.2.4 | 4.3.0 | 4.3.0 | actualizado |
| `typescript` | 5.9.3 | 5.9.3 | 6.0.3 | SKIP MAJOR (5→6) |
| `zustand` | 5.0.12 | 5.0.13 | 5.0.13 | actualizado |

---

## Backend — `pip-audit` (initial, desde venv)

> **Nota:** el venv tenía versiones anteriores a las del `requirements.txt` — la sincronización con `pip install -r requirements.txt` resolvio la mayoría de las vulnerabilidades.

| Paquete | Version venv | CVEs | Fix mínimo | Acción |
|---------|-------------|------|------------|--------|
| `django` | 6.0.2 | 10 (DoS, XSS, middleware bypass) | 6.0.5 | → 6.0.5 |
| `pillow` | 12.1.1 | 5 (GZIP, PDF, PSD, overflow) | 12.2.0 | → 12.2.0 |
| `pytest` | 9.0.2 | 1 (tmpdir race — CVE-2025-71176) | 9.0.3 | → 9.0.3 |
| `python-dotenv` | 1.2.1 | 1 (symlink follow — CVE-2026-28684) | 1.2.2 | transitivo, no en requirements.txt |
| `requests` | 2.32.5 | 1 (zip path traversal — CVE-2026-25645) | 2.33.0 | → 2.34.2 |
| `urllib3` | 2.6.3 | 2 (redirect headers, streaming) | 2.7.0 | transitivo, no en requirements.txt |
| `pip` | 24.0 | 4 (tar/wheel extraction) | 25.3–26.1 | herramienta venv, no en requirements.txt |

## Backend — `pip list --outdated` (initial)

| Paquete | Instalado | Latest | Acción |
|---------|-----------|--------|--------|
| Django | 6.0.2 | 6.0.5 | pin 6.0.4→6.0.5 + sync venv |
| Faker | 40.5.1 | 40.18.0 | pin 40.15.0→40.18.0 |
| coverage | 7.13.4 | 7.14.0 | pin 7.13.5→7.14.0 |
| djangorestframework | 3.16.1 | 3.17.1 | ya en requirements.txt, sync venv |
| gunicorn | 23.0.0 | 26.0.0 | pin `<24.0` — no hay 23.x mas nuevo |
| huey | 3.0.0 | 3.0.1 | satisface `>=2.5.0`, sync venv |
| idna | 3.13 | 3.15 | transitivo |
| packaging | 26.1 | 26.2 | transitivo |
| pillow | 12.1.1 | 12.2.0 | ya en requirements.txt, sync venv |
| pip | 24.0 | 26.1.1 | herramienta venv — SKIP MAJOR |
| pytest | 9.0.2 | 9.0.3 | ya en requirements.txt, sync venv |
| pytest-cov | 7.0.0 | 7.1.0 | ya en requirements.txt, sync venv |
| python-dotenv | 1.2.1 | 1.2.2 | transitivo, no en requirements.txt |
| requests | 2.32.5 | 2.34.2 | pin 2.33.1→2.34.2 |
| ruff | 0.15.2 | 0.15.13 | pin 0.15.12→0.15.13 |
| urllib3 | 2.6.3 | 2.7.0 | transitivo |

---

## Updates Applied

### Frontend (commit `deps(frontend): apply patch+minor updates` — a88997c)

| Paquete | Antes | Despues |
|---------|-------|---------|
| `next` | 16.2.4 | 16.2.6 |
| `eslint-config-next` | 16.2.4 | 16.2.6 |
| `@playwright/test` | ^1.59.1 | ^1.60.0 |
| `@tailwindcss/postcss` | ^4.2.4 | ^4.3.0 |
| `@types/node` | ^25.6.0 | ^25.8.0 |
| `axios` | ^1.15.2 | ^1.16.1 |
| `jest` | ^30.3.0 | ^30.4.2 |
| `jest-environment-jsdom` | ^30.3.0 | ^30.4.1 |
| `js-cookie` | ^3.0.5 | ^3.0.7 |
| `next-intl` | ^4.11.0 | ^4.12.0 |
| `react` | 19.2.5 | 19.2.6 |
| `react-dom` | 19.2.5 | 19.2.6 |
| `tailwindcss` | ^4.2.4 | ^4.3.0 |
| `zustand` | ^5.0.12 | ^5.0.13 |

`npm audit` final: 0 critical / 0 high / 3 moderate / 0 low
Moderate restantes: `postcss` empaquetado en `next/node_modules/postcss` — la correccion de npm (`next@9.3.3`) es un downgrade de 7 majors. Inaplicable sin breaking change.

### Backend (commit `deps(backend): apply patch+minor updates` — 7f1ecd1)

Cambios en `requirements.txt`:

| Paquete | Antes | Despues |
|---------|-------|---------|
| Django | 6.0.4 | 6.0.5 |
| Faker | 40.15.0 | 40.18.0 |
| requests | 2.33.1 | 2.34.2 |
| ruff | 0.15.12 | 0.15.13 |
| coverage | 7.13.5 | 7.14.0 |

Paquetes actualizados en venv por sincronizacion (ya estaban en requirements.txt):

| Paquete | Venv antes | Venv despues |
|---------|-----------|-------------|
| django | 6.0.2 | 6.0.5 |
| pillow | 12.1.1 | 12.2.0 |
| pytest | 9.0.2 | 9.0.3 |
| pytest-cov | 7.0.0 | 7.1.0 |
| djangorestframework | 3.16.1 | 3.17.1 |
| requests | 2.32.5 | 2.34.2 |
| ruff | 0.15.2 | 0.15.13 |
| coverage | 7.13.4 | 7.14.0 |
| Faker | 40.5.1 | 40.18.0 |

`pip-audit` final: 7 CVEs en 3 paquetes (todos transitivos / herramienta):
- `pip 24.0`: 4 CVEs — herramienta venv, no en requirements.txt. Fix requiere pip 26.x (MAJOR).
- `python-dotenv 1.2.1`: 1 CVE (CVE-2026-28684) — transitivo, fix 1.2.2 disponible pero no es dependencia directa.
- `urllib3 2.6.3`: 2 CVEs (CVE-2026-44431/44432) — transitivo, fix 2.7.0 disponible pero no es dependencia directa.

## Rollbacks

Ninguno.

## Verification Results

### Frontend
- `npm audit`: 1 high → 0 high (eliminado), 3 moderate restantes (postcss en next).
- `npm run build`: success — todas las rutas compiladas.

### Backend
- `python manage.py check`: System check identified no issues (0 silenced)
- `pytest --collect-only -q`: 472 tests collected, 0 errores de coleccion
- Slice — `pytest base_feature_app/tests/models/test_password_code_model.py -v`: 5 passed
