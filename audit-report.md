# Auditoría de vulnerabilidades y actualización de dependencias

**Rama:** `chore/29082026-vuln-audit`

**Fecha:** 2026-08-29

**Base:** `main` @ `67ebc29`

**Alcance:** sólo backend; actualizaciones patch/minor compatibles (`--apply`), sin feature releases de framework

## Resumen

| Superficie | Vulnerabilidades iniciales | Paquetes outdated iniciales |
|---|---:|---:|
| Venv productivo, auditoría read-only previa | 0 | 10 |
| Venv aislado de esta corrida | 7 registros en `pip 24.0` | 3 |

La auditoría productiva inmediatamente anterior no encontró vulnerabilidades. De
sus 10 paquetes outdated, sólo `coverage` era una dependencia directa con un bump
patch/minor aplicable. Django 6.1 queda fuera del batch porque es una feature
release del framework y producción continúa en MySQL 8.0; Django 6.1 requiere
MySQL 8.4.

El venv aislado se creó con Python 3.12.3 y el bootstrap `pip 24.0`. Sus siete
hallazgos pertenecían exclusivamente a esa herramienta del entorno, no a una
dependencia runtime declarada. Se alineó `pip` a 26.2.1 dentro de
`backend/.venv` —directorio gitignored— antes de la validación final. Esto no
modifica el venv productivo ni agrega `pip` a `requirements.txt`.

---

## Backend — `pip-audit` inicial

Fuente: `/tmp/mimittos_project-pip-audit.json`.

| Paquete | Versión | Registros | Fixes publicados |
|---|---:|---:|---|
| pip | 24.0 | 7 | 25.3, 26.0, 26.1, 26.1.2 y 26.2, según el ID |

No se detectaron vulnerabilidades en las dependencias directas del proyecto.
Tras alinear el tooling aislado, el audit final quedó en **0 vulnerabilidades**.

## Backend — `pip list --outdated` inicial

Fuente: `/tmp/mimittos_project-pip-outdated.json`.

| Paquete | Actual → latest | Clase | Decisión |
|---|---|---|---|
| coverage | 7.15.4 → 7.16.0 | minor, directa | ✅ Aplicado al pin declarado |
| Django | 6.0.8 → 6.1 | feature release del framework | ⏭️ Diferido por el constraint de MySQL 8.0 |
| pip | 24.0 → 26.2.1 | tooling del venv aislado | ✅ Alineado sólo dentro del venv gitignored |

Los otros paquetes que aparecían outdated en el entorno productivo eran
transitivos o tooling. Una instalación limpia resolvió sus versiones compatibles
sin convertirlos en dependencias directas.

---

## Plan y resultado

| Paquete | Actual → objetivo | Tipo | Resultado |
|---|---|---|---|
| coverage | 7.15.4 → 7.16.0 | minor | ✅ Aplicado |
| Django | 6.0.8 → 6.1 | feature release del framework | ⏭️ No aplicado; requiere primero MySQL 8.4 y un batch dedicado |
| pip | 24.0 → 26.2.1 | tooling aislado | ✅ Validación local; sin cambio versionado |

## Actualizaciones aplicadas

### Backend

- `coverage==7.15.4` → `coverage==7.16.0`.
- Se respetaron todos los demás pins y rangos existentes.
- No se agregaron paquetes transitivos como dependencias directas.
- No se modificó el constraint de Django.

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
| `pip-audit` final | ✅ 0 vulnerabilidades |
| `pip list --outdated` final | ✅ Sólo Django 6.1, diferido por constraint |
| Acceso a base de producción | ✅ No se ejecutaron migraciones ni tests contra MySQL |

## Pendientes

- Actualizar MySQL 8.0 → 8.4 antes de planificar Django 6.1 en un batch dedicado.
- Aplicar este cambio en producción mediante el flujo normal de merge y deploy;
  esta sesión no modifica el checkout ni el venv productivos.

## Evidencia temporal

- Baseline aislado: `/tmp/mimittos_project-pip-audit.json` y
  `/tmp/mimittos_project-pip-outdated.json`.
- Resultado final: `/tmp/mimittos_project-pip-audit-final.json` y
  `/tmp/mimittos_project-pip-outdated-final.json`.
