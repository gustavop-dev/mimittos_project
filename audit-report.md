# Vulnerability Audit & Dependency Update Report

**Branch:** chore/26082026-vuln-audit
**Date:** 2026-08-26
**Base:** main @ ca78e8c
**Scope:** patch + minor updates only (no major version bumps)

## Summary

| Surface | Vulns (initial) | Vulns (final) | Outdated (initial) |
|---|---:|---:|---:|
| Frontend | 10 total: 0 critical / 9 high / 0 moderate / 1 low | 0 | 23 |
| Backend | 44 findings (33 unique) across 5 packages | 4 findings across 1 package | 23 |

The production-only npm audit initially reported 6 high vulnerabilities. The full
audit, including development dependencies, reported the 10 packages summarized
below.

---

## Frontend — npm audit (initial)

Source: /tmp/mimittos_project-npm-audit-apply-initial.json

| Package | Severity | Notes |
|---|---|---|
| @babel/core | low | Arbitrary file read through sourceMappingURL comments. |
| axios | high | HTTP proxy inheritance plus form serialization, prototype pollution, and upload-limit advisories. |
| brace-expansion | high | CPU and memory denial-of-service advisories. |
| form-data | high | CRLF injection in multipart names and filenames. |
| js-yaml | high | Quadratic CPU use in merge-key and omap resolution. |
| nanoid | high | Infinite-loop denial of service in custom/non-secure generators. |
| next | high | App Router, Server Actions, rewrites, cache, image, and endpoint-disclosure advisories. |
| postcss | high | XSS, path traversal, and source-map file disclosure advisories. |
| sharp | high | Vulnerable libvips versions bundled below sharp 0.35.0. |
| ws | high | Memory exhaustion through fragmented WebSocket payloads. |

**Totals:** 0 critical / 9 high / 0 moderate / 1 low.

## Frontend — npm outdated (initial)

Source: /tmp/mimittos_project-npm-outdated-apply-initial.json

- @playwright/test: 1.60.0 -> 1.62.1 -> 1.62.1
- @tailwindcss/postcss: 4.3.0 -> 4.3.3 -> 4.3.3
- @testing-library/user-event: 14.6.1 -> 14.6.6 -> 14.6.6
- @types/node: 25.8.0 -> 25.9.5 -> 26.3.0 (latest major skipped)
- @types/react: 19.2.14 -> 19.2.18 -> 19.2.18
- @types/react-dom: 19.2.3 -> 19.2.5 -> 19.2.5
- @uiw/react-md-editor: 4.1.0 -> 4.1.2 -> 4.1.2
- axios: 1.16.1 -> 1.20.0 -> 1.20.0
- eslint: 9.39.4 -> 9.39.5 -> 10.9.1 (latest major skipped)
- eslint-config-next: 16.2.6 -> 16.2.6 -> 16.3.3
- eslint-plugin-playwright: 2.10.2 -> 2.11.0 -> 2.11.0
- framer-motion: 12.38.0 -> 12.43.0 -> 13.1.1 (latest major skipped)
- js-cookie: 3.0.7 -> 3.0.8 -> 3.0.8
- next: 16.2.6 -> 16.2.6 -> 16.3.3
- next-intl: 4.12.0 -> 4.13.7 -> 4.13.7
- react: 19.2.6 -> 19.2.6 -> 19.2.8
- react-dom: 19.2.6 -> 19.2.6 -> 19.2.8
- recharts: 3.8.1 -> 3.10.1 -> 3.10.1
- sweetalert2: 11.26.24 -> 11.26.25 -> 11.26.25
- swiper: 12.1.4 -> 12.2.0 -> 14.1.0 (latest major skipped)
- tailwindcss: 4.3.0 -> 4.3.3 -> 4.3.3
- typescript: 5.9.3 -> 5.9.3 -> 7.0.2 (major skipped)
- zustand: 5.0.13 -> 5.0.15 -> 5.0.15

---

## Backend — pip-audit (initial)

Source: /tmp/mimittos_project-pip-audit.json

| Package | Current | Findings | Minimum in-major fix |
|---|---:|---:|---:|
| Django | 6.0.5 | 9 | 6.0.8 |
| Pillow | 12.2.0 | 20 reported / 13 unique | 12.3.0 |
| pip | 26.1.1 | 3 reported / 2 unique | 26.2 |
| PyJWT | 2.12.1 | 8 reported / 5 unique | 2.13.0 |
| sqlparse | 0.5.5 | 4 | 0.6.0 (major under 0.x policy) |

## Backend — pip list --outdated (initial)

Source: /tmp/mimittos_project-pip-outdated.json

- asgiref 3.11.1 -> 3.12.1
- certifi 2026.4.22 -> 2026.7.22 (transitive)
- charset-normalizer 3.4.7 -> 3.5.1 (transitive)
- coverage 7.14.0 -> 7.15.4
- Django 6.0.5 -> 6.1 (security plan targets 6.0.8; feature release deferred)
- django-silk 5.5.0 -> 5.5.2 (existing open range)
- djangorestframework 3.17.1 -> 3.18.0
- Faker 40.18.0 -> 40.37.0
- gunicorn 23.0.0 -> 26.2.0 (major and blocked by <24 pin)
- huey 3.0.1 -> 3.3.4
- idna 3.15 -> 3.19 (transitive)
- packaging 26.2 -> 26.3 (transitive)
- Pillow 12.2.0 -> 12.3.0
- pip 26.1.1 -> 26.2.1 (audit environment tooling)
- Pygments 2.20.0 -> 2.21.0 (transitive)
- PyJWT 2.12.1 -> 2.13.0
- pytest 9.0.3 -> 9.1.1
- pytest-django 4.12.0 -> 4.14.0
- redis 7.4.0 -> 8.1.0 (major skipped; 7.4.1 selected)
- ruff 0.15.13 -> 0.16.4 (0.x minor is treated as major; 0.15.22 selected)
- sqlparse 0.5.5 -> 0.6.0 (0.x minor is treated as major; skipped)
- typing_extensions 4.15.0 -> 4.16.0
- wheel 0.47.0 -> 0.48.0 (transitive)

---

## Plan

### Frontend

- Run npm audit fix without force to refresh vulnerable transitive dependencies.
- Apply patch/minor direct updates with npm-check-updates.
- Keep all direct dependencies within their current major.
- Revert any update whose runtime engine or compatibility contract is not met.

### Backend

- Apply secure in-major releases for Django, Pillow, PyJWT, and the outdated
  direct requirements.
- Add an explicit PyJWT pin because it was previously only transitive.
- Bound Redis and Huey below their next major while raising their minimums.
- Keep ruff on 0.15.x and sqlparse on 0.5.x because 0.x -> 0.y is a major
  transition under this audit policy.

## Updates Applied

### Frontend (commit deps(frontend): apply patch+minor updates)

- 22 direct dependency versions were updated:
  - @uiw/react-md-editor 4.1.0 -> 4.1.2
  - axios 1.16.1 -> 1.20.0
  - framer-motion 12.38.0 -> 12.43.0
  - js-cookie 3.0.7 -> 3.0.8
  - next 16.2.6 -> 16.3.3
  - next-intl 4.12.0 -> 4.13.7
  - react/react-dom 19.2.6 -> 19.2.8
  - recharts 3.8.1 -> 3.10.1
  - sweetalert2 11.26.24 -> 11.26.25
  - swiper 12.1.4 -> 12.2.0
  - zustand 5.0.13 -> 5.0.15
  - @playwright/test 1.60.0 -> 1.62.1
  - @tailwindcss/postcss/tailwindcss 4.3.0 -> 4.3.3
  - @testing-library/user-event 14.6.1 -> 14.6.6
  - @types/node 25.8.0 -> 25.9.5
  - @types/react 19.2.14 -> 19.2.18
  - @types/react-dom 19.2.3 -> 19.2.5
  - eslint 9.39.4 -> 9.39.5
  - eslint-config-next 16.2.6 -> 16.3.3
  - eslint-plugin-playwright 2.10.2 -> 2.11.0
- npm audit fix also refreshed vulnerable transitive packages without --force.
- Final npm audit: 0 critical / 0 high / 0 moderate / 0 low.
- Remaining outdated majors: @types/node 26, eslint 10, framer-motion 13,
  swiper 14, and TypeScript 7.

### Backend (commit deps(backend): apply patch+minor updates)

- asgiref 3.11.1 -> 3.12.1
- Django 6.0.5 -> 6.0.8
- djangorestframework 3.17.1 -> 3.18.0
- PyJWT 2.12.1 -> 2.13.0, now explicitly pinned
- Faker 40.18.0 -> 40.37.0
- huey floor 2.5.0 -> 3.3.4 with <4.0 ceiling
- Pillow 12.2.0 -> 12.3.0
- pytest 9.0.3 -> 9.1.1
- pytest-django 4.12.0 -> 4.14.0
- coverage 7.14.0 -> 7.15.4
- redis 7.4.0 -> 7.4.1 with <8.0 ceiling
- ruff 0.15.13 -> 0.15.22
- typing_extensions 4.15.0 -> 4.16.0
- The isolated audit environment also updated pip to 26.2.1.
- Final pip-audit: 4 findings in sqlparse only, down from 44 findings in
  five packages. All four fixes require sqlparse 0.6.0.

## Rollbacks

- @testing-library/jest-dom 6.10.0 was reverted to 6.9.1 and pinned exactly.
  The proposed release declares Node >=22 and is marked as a breaking/deprecated
  transition, while this project builds on Node 20.

## Verification Results

### Frontend

- npm audit: 0 vulnerabilities.
- npm run build: success with Next.js 16.3.3; 29 routes generated.
- Focused Jest verification: 57 tests passed across the seven affected test files.
- A clean-worktree build exposed stale test fixture typings that also failed on
  main with the original dependencies. Test-only fixtures and mocks were brought
  in line with the production types; application behavior was not changed.

### Backend

- pip check: no broken requirements.
- python manage.py check: 0 issues.
- pytest --collect-only -q: 502 tests collected, 0 collection errors.
- Slice: pytest base_feature_app/tests/commands/test_fake_data_commands.py -v:
  8 passed.
- All Django test commands used an isolated SQLite database. No migrations were
  run and the production database was not touched.
- Code search found no direct sqlparse import or formatter endpoint in the
  project. The residual risk is therefore indirect through framework/tooling
  paths, but remains tracked until a separately reviewed 0.6 migration.
