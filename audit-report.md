# Auditoría de vulnerabilidades y actualización de dependencias

**Rama:** `chore/27082026-vuln-audit`
**Fecha:** 2026-08-27
**Base:** `main` @ `375cd9d`
**Alcance:** sólo backend; bumps patch/minor compatibles (`--apply`), sin majors

## Resumen

| Superficie | Vulnerabilidades iniciales | Outdated inicial |
|---|---:|---:|
| Backend de producción | 3 hallazgos en 1 paquete (`pip`; 2 IDs únicos) | 10 paquetes del entorno |

La auditoría separó las dependencias declaradas de los paquetes transitivos y de
las herramientas instaladas en el venv. El PR anterior, #58, ya había actualizado
las dependencias directas; esta corrida encontró un único bump declarativo
patch/minor aplicable: `django-silk` 5.5.0 → 5.5.2.

---

## Backend — `pip-audit` inicial

Fuente: `/tmp/mimittos_project-prod-pip-audit.json` (venv de producción, sólo lectura).

| Paquete | Versión | Hallazgos | Versión correctiva |
|---|---:|---|---:|
| pip | 26.1.1 | `PYSEC-2026-196` / `CVE-2026-8643` (duplicado por la salida) · `PYSEC-2026-3721` / `CVE-2026-13346` | 26.2.1 |

El venv aislado creado con Python 3.12 partió de su bootstrap `pip 24.0` y reportó
7 hallazgos; esto no representa la versión desplegada. La corrección se probó
únicamente dentro de `backend/.venv`, aislado y gitignored: `pip 26.2.1` dejó
`pip-audit` en **0 vulnerabilidades**. Esa prueba no
modifica ni actualiza el venv de producción y no se presenta como cambio persistente
de este PR.

## Backend — `pip list --outdated` inicial

Fuente: `/tmp/mimittos_project-prod-pip-outdated.json`.

| Paquete | Actual → latest | Clase | Decisión |
|---|---|---|---|
| certifi | 2026.4.22 → 2026.7.22 | transitiva | No se agrega como dependencia directa; el venv aislado resuelve latest |
| charset-normalizer | 3.4.7 → 3.5.1 | transitiva | No se agrega como dependencia directa; el venv aislado resuelve latest |
| Django | 6.0.8 → 6.1 | major de framework | ⏭️ Constraint: producción usa MySQL 8.0; Django 6.1 exige MySQL 8.4 |
| django-silk | 5.5.0 → 5.5.2 | patch, directa | ✅ Elevar el floor declarado a `>=5.5.2` |
| idna | 3.15 → 3.19 | transitiva | No se agrega como dependencia directa; el venv aislado resuelve latest |
| msgpack | 1.2.1 → 1.2.2 | tooling/transitiva | No se agrega como dependencia directa |
| packaging | 26.2 → 26.3 | tooling/transitiva | No se agrega como dependencia directa; el venv aislado resuelve latest |
| pip | 26.1.1 → 26.2.1 | herramienta del venv | ⚠️ Requiere remediación operativa; no está declarado en `requirements.txt` |
| Pygments | 2.20.0 → 2.21.0 | tooling/transitiva | No se agrega como dependencia directa; el venv aislado resuelve latest |
| wheel | 0.47.0 → 0.48.0 | tooling, cambio 0.x | No se agrega como dependencia directa |

La causa del drift es coherente con el comportamiento documentado por pip: una
instalación sin `--upgrade` conserva versiones ya instaladas que todavía satisfacen
los rangos. Referencia oficial: <https://pip.pypa.io/en/stable/cli/pip_install/#cmdoption-U>.

---

## Plan

| Paquete | Actual → objetivo | Tipo | Resultado |
|---|---|---|---|
| django-silk | 5.5.0 → 5.5.2 | patch | ✅ Aplicado al floor de `requirements.txt` |
| Django | 6.0.8 → 6.1 | major de framework | ⏭️ Bloqueado por MySQL 8.0 |
| pip | 26.1.1 → 26.2.1 | tooling del entorno | ⚠️ Validado en aislamiento; pendiente en producción |

## Actualizaciones aplicadas

### Backend

- `django-silk>=5.0.0` → `django-silk>=5.5.2`.
- No se agregaron transitivos como dependencias directas.
- No se cruzó ningún major ni se modificó el constraint de Django.

## Rollbacks

Ninguno.

## Verificaciones

| Verificación | Resultado |
|---|---|
| Python 3.12.3 en `backend/.venv` propio | ✅ Coincide con CI |
| `pip install -r backend/requirements.txt` + `pip check` | ✅ Sin conflictos |
| `manage.py check` con SQLite forzado | ✅ 0 issues |
| `pytest --collect-only -q` con SQLite forzado | ✅ 502 tests recolectados |
| Slice `test_fake_data_commands.py` | ✅ 8 passed |
| `pip-audit` tras elevar `pip` a 26.2.1 sólo en el venv aislado | ✅ 0 vulnerabilidades |
| Acceso a base de producción | ✅ No se ejecutaron migraciones ni tests contra MySQL |

## Pendientes operativos

- El venv productivo sigue en `pip 26.1.1`; este PR no lo modifica. La remediación
  autorizada debe actualizarlo a `26.2.1` y volver a ejecutar `pip-audit`.
- Evaluar en el toolkit si el bootstrap de deploy debe ejecutar explícitamente
  `python -m pip install --upgrade pip` antes de instalar `requirements.txt`.
- Django 6.1 permanece diferido hasta actualizar MySQL 8.0 → 8.4 en el VPS compartido.

## Evidencia temporal

- Producción, read-only: `/tmp/mimittos_project-prod-pip-{audit,outdated}.json`.
- Worktree aislado: `/tmp/mimittos_project-pip-{audit,outdated}.json`.
- Post-requirements, antes de actualizar tooling: `/tmp/mimittos_project-pip-audit-final.json` (`pip 24.0`, 7 hallazgos).
- Sonda de tooling: `/tmp/mimittos_project-pip-audit-tooling-remediated.json`.
