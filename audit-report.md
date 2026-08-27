# Auditoría de vulnerabilidades y dependencias — modernización secuencial

**Fecha:** 2026-08-27
**Rama:** chore/27082026-deps-upgrade (PR #58)
**Base:** main @ c02072b
**Alcance:** patch + minor + majors, un commit por unidad con CI verde por commit · superficies: ambas (frontend npm + backend pip) · modo `/vuln-audit --upgrade` (piloto conducido desde la sesión del toolkit)

## Resultado ejecutivo

| Métrica | Antes | Después |
|---|---|---|
| npm audit (C/H/M/L) | 0/0/0/0 | 0/0/0/0 |
| npm outdated (directas) | 6 (next-intl, typescript, eslint, @types/node, framer-motion, swiper) | 2 diferidas (eslint 10, typescript 7) + @testing-library/react 16.3.3 (patch publicado durante la corrida) |
| pip-audit (vulns / paquetes) | 4 / 1 (sqlparse 0.5.5: PYSEC-2026-3696/3697/3698/3699) | 0 / 0 |
| pip outdated (directas) | 5 (Django, gunicorn, redis, ruff, sqlparse) | 1 diferida por constraint (Django 6.1) |
| Unidades aplicadas / vacías / diferidas | — | 9 / 4 / 3 |

## Actualizaciones aplicadas

### Frontend
| Paquete directo | Antes | Después | Unidad | Commit |
|---|---|---|---|---|
| next-intl | ^4.13.7 | ^4.14.0 | u3 minor batch (1 pkg) | ed22db4 |
| typescript | ^5 (5.9.3) | ^6.0.3 | u4 major tooling (escalón: 7.0.2 bloqueado) | f14902d |
| @types/node | ^25.9.5 | ^26.4.0 | u6 major (devDependency) | 4f43b78 |
| framer-motion | ^12.43.0 | ^13.1.1 | u7 major runtime (`components/ui/motion.tsx`) | 53d82a7 |
| swiper | ^12.2.0 | ^14.2.0 | u8 major runtime (`app/page.tsx`, `globals.css`) | b200d36 |

### Backend
| Paquete directo | Antes | Después | Unidad | Commit |
|---|---|---|---|---|
| ruff | ==0.15.22 | ==0.16.5 | u11 major tooling (0.x → 0.y) | 8a76c6e |
| gunicorn | >=23.0,<24.0 | >=26.2,<27.0 | u12 major runtime-only (`CI: no cubre`) | 9c75f31 |
| redis | >=7.4.1,<8.0 | >=8.1.0,<9.0 | u13 major (worker huey, `CI: no cubre`) | 6aef93a |
| sqlparse | ==0.5.5 | ==0.6.0 | u14 major (0.x → 0.y; cierra 4 PYSEC) | 56fd18a |

Unidades vacías (sin diff, sin commit ni run): u1 lockfile frontend (`npm audit fix`, 0 vulns), u2 patch frontend, u9 patch/minor backend.

## Rollback y excepciones
- Ningún revert ni pin-back: los 9 runs de CI salieron verdes al primer intento.
- u4 typescript: 7.0.2 compila (`next build` ✅) pero `npm run lint` se cae al cargar `eslint-config-next` (`Error: typescript-eslint does not support TS 7.0.`). Iteración local: escalón intermedio 6.0.3 (build ✅, lint sin regresión). Commit final: 5.9.3 → 6.0.3.
- `npm run lint` ya reportaba **54 problemas (32 errores, 22 warnings) en `main`** antes de esta corrida; el CI no lo gatea. Se usó como baseline: ninguna unidad lo hizo crecer.
- El `backend/.env` del worktree es el de producción y los settings leen el motor de la base del entorno: todos los `manage.py`/pytest del worktree se corrieron con `DJANGO_DB_ENGINE=django.db.backends.sqlite3` (base sqlite descartable en `/tmp`), salvo el gate de producción de la unidad Django (sólo lectura).

## Actualizaciones mayores diferidas
| Paquete | Actual | Objetivo | Causa | Evidencia (run / log) | Commit de revert |
|---|---|---|---|---|---|
| Django | 6.0.8 | 6.1 | gate de producción (`manage.py check --database default` con `settings_prod`, sólo lectura): `django.db.utils.NotSupportedError: MySQL 8.4 or later is required (found 8.0.46)`. El CI corre sobre sqlite y no lo ve. Constraint documentado en `backend/requirements.txt` en este commit | descartada en el smoke, sin ciclo de CI | — |
| eslint | 9.39.5 | 10.9.1 | smoke local rojo: `npm run lint` → `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function` — `eslint-plugin-react` (vía `eslint-config-next 16.3.3`, ya en latest) no soporta ESLint 10; forzar el peer con un override está prohibido | descartada antes del commit | — |
| typescript | 6.0.3 | 7.0.2 | `Error: typescript-eslint does not support TS 7.0.` al cargar `eslint-config-next`; el paquete 7.x es el compilador nativo | descartada en el smoke; se aplicó el escalón 6.0.3 | — |

Desbloqueo: Django 6.1 ⇒ upgrade de MySQL a 8.4 en vps-projectapp-prod (decisión de fleet: la instancia la comparten projectapp, mimittos, xpandia y kore); luego borrar el comentario y re-correr `/vuln-audit backend --upgrade`. eslint 10 / TS 7 ⇒ esperar un `eslint-config-next` (grupo `next`) cuyos plugins y `typescript-eslint` los soporten.

## Verificaciones ejecutadas
| Verificación | Resultado |
|---|---|
| Preflight: CI presente (T≈10 min), base `main` verde, sin PR de dependencias abierto, `nvm ls 20` (node de producción), `npm ci` con lockfile en sync | ✅ |
| Venv aislado `backend/.venv` (Python 3.12.3 = CI) recreado desde cero; `backend/venv` del clon principal intacto | ✅ |
| Por unidad frontend: `npm --prefix frontend install` + `npm ls --depth=0` + `next build` + conteo de `npm run lint` vs baseline (54) + un spec Jest cuando la unidad toca un componente (`motion.test.tsx` 7/7, `page.test.tsx` 6/6) | ✅ u3, u4, u6, u7, u8 |
| Por unidad backend (sqlite forzado): `pip install -r` + `pip check` + `manage.py check` + `pytest --collect-only -q` (502) + slice `base_feature_app/tests/commands/test_fake_data_commands.py` (8 passed) | ✅ u11, u12, u13, u14 |
| u10 Django 6.1: `pip check` ✅, `makemigrations --check --dry-run` (sqlite) «No changes detected», gate de producción ❌ (`MySQL 8.4 or later is required (found 8.0.46)`) | ⏭️ diferida |
| u12 extra: `gunicorn --check-config` con los flags del `.service` (workers 2, max-requests 800/jitter 80, timeout 30, graceful 20) · u13 extra: `import redis, huey; RedisHuey` | ✅ |
| u14 extra: `pip-audit` final | ✅ 0 vulns |
| CI por commit (7 checks: backend-tests, frontend-unit-tests, E2E shard 1/2 y 2/2, e2e-merge-reports, coverage-summary, test-quality-gate) | u3 run 33095629730 ✅ · u4 33096506138 ✅ · u6 33097326442 ✅ · u7 33098206514 ✅ · u8 33098649961 ✅ · u11 33099161796 ✅ · u12 33100014491 ✅ · u13 33100393112 ✅ · u14 33100928542 ✅ |

## Evidencia temporal de la ejecución
| # | Unidad | Paquetes (antes → después) | Commit | CI run | Iter. fix | Resultado |
|---|---|---|---|---|---|---|
| 1 | frontend lockfile | `npm audit fix` (0 vulns) | — | — | — | ⏭️ vacía |
| 2 | frontend patch | — | — | — | — | ⏭️ vacía |
| 3 | frontend minor (1) | next-intl 4.13.7 → 4.14.0 | ed22db4 | 33095629730 ✅ | 0 | ✅ aplicada |
| 4 | typescript (tooling) | 5.9.3 → 6.0.3 (7.0.2 bloqueado) | f14902d | 33096506138 ✅ | 1 local (escalón) | ✅ aplicada |
| 5 | eslint (tooling) | 9.39.5 → 10.9.1 | — | — | 0 | 🔁 diferida (plugin incompatible con ESLint 10) |
| 6 | @types/node | 25.9.5 → 26.4.0 | 4f43b78 | 33097326442 ✅ | 0 | ✅ aplicada |
| 7 | framer-motion | 12.43.0 → 13.1.1 | 53d82a7 | 33098206514 ✅ | 0 | ✅ aplicada |
| 8 | swiper | 12.2.0 → 14.2.0 | b200d36 | 33098649961 ✅ | 0 | ✅ aplicada |
| 9 | backend patch / minor | — | — | — | — | ⏭️ vacías |
| 10 | Django (framework) | 6.0.8 → 6.1 | — | — | 0 | ⏭️ constraint: MySQL 8.0.46 en producción (gate read-only) |
| 11 | ruff (tooling) | 0.15.22 → 0.16.5 | 8a76c6e | 33099161796 ✅ | 0 | ✅ aplicada · `CI: no cubre` |
| 12 | gunicorn | 23.0.0 → 26.2.0 | 9c75f31 | 33100014491 ✅ | 0 | ✅ aplicada · `CI: no cubre` |
| 13 | redis | 7.4.1 → 8.1.0 | 6aef93a | 33100393112 ✅ | 0 | ✅ aplicada · `CI: no cubre` (worker) |
| 14 | sqlparse | 0.5.5 → 0.6.0 | 56fd18a | 33100928542 ✅ | 0 | ✅ aplicada |
| 15 | reporte + constraint Django | audit-report.md, requirements.txt (comentario) | (este commit) | — | — | — |

Snapshots: `/tmp/mimittos_project-{npm-audit,npm-outdated,pip-audit,pip-outdated}.json` (inicio) y `…-final.json` (cierre) en vps-projectapp-prod.

## Acción operativa posterior al merge
- El deploy reinstala (`pip install -r backend/requirements.txt`, `npm ci && npm run build`); sin migraciones nuevas (Django queda en 6.0.8).
- Paquetes runtime que el CI no ejercita (`CI: no cubre`): **gunicorn 26.2.0** (reinicio del service `mimittos_project`, `Type=notify`), **redis 8.1.0** para el worker `mimittos-huey` y ruff (dev) — validar con `/deploy-and-check mimittos_project` tras el deploy (health + worker vivo).
- Majors diferidos, orden sugerido para la próxima corrida: (1) Django 6.1 tras MySQL 8.4; (2) eslint 10 y typescript 7 cuando `eslint-config-next` los soporte. `@testing-library/react` 16.3.3 (patch publicado durante la corrida) entra en el próximo batch patch.
