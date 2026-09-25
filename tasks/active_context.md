---
trigger: manual
description: Current work focus, recent changes, active decisions, and next steps for Mimittos.
---

# Active Context — Mimittos



## Rendimiento — KPIs, reseñas y sesión (2026-09-24)

Rama `fix/24092026-perf-kpis-reviews-session`, PR #68 contra `main`, independiente
del PR #67. KPIs usa un agregado condicional; el rating reúne promedio y cantidad
aprobada antes de actualizar; las restauraciones simultáneas comparten una
validación pendiente por sesión. Al cerrar o cambiar sesión se invalida la
restauración anterior. Se conserva el refresco automático de access token.

Presupuestos declarados: KPIs `Q(1)=Q(50)≤1`, rating `Q(1)=Q(50)≤2` incluyendo
la escritura, sesión una validación lógica para consumidores concurrentes. QA
verificado sobre SQLite aislada y Jest, con gate estricto limpio; sin modificaciones de base de datos,
infraestructura, dependencias o flujos de usuario. Perfil: `vps-projectapp-prod`,
según el estándar canónico y el ledger del toolkit.
