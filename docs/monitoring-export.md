# Exportación de consultas al monitoreo de ProjectApp

La tarea semanal existente exporta además un JSON atómico en
`backend/logs/monitoring/silk-*.json`, para el colector local del toolkit.
Agrupa consultas lentas y posibles N+1 por la ruta parametrizada del resolver;
exporta duración máxima/conteo, nunca SQL ni valores de URL. Un fallo al escribir
el export se registra y no impide generar el reporte legado.

No hay HTTP, credenciales nuevas ni dependencia de ProjectApp en el request de
Mimittos. El transporte y los reintentos corresponden a la cola SQLite del VPS.
`ENABLE_SILK` sigue desactivado por defecto. Cuando el operador autorice el rollout,
la muestra inicial es 5 %, con tope de 1.000 solicitudes y sin cuerpos HTTP,
profiler ni EXPLAIN. Se excluyen rutas de auth/login/token/credenciales/accesos,
salud, MCP y el propio monitoreo.

Silk puede guardar valores SQL localmente: revisar privacidad y acceso antes de
activarlo. El export saneado no sustituye esa revisión. No se publica la UI de
Silk. No se infiere recuperación por ausencia en una muestra parcial.

Activación por etapas: primero ProjectApp durante 24 horas; después Mimittos y
Tenndalux por separado. No ejecutar migraciones ni editar `.env` desde el worktree.
El procedimiento central vive en `vps-ops-toolkit/docs/projectapp-monitoring.md`.
Las pruebas nuevas usan settings mínimos y directorios temporales, sin DB.
