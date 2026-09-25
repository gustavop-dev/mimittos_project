---
trigger: manual
description: Patrones comprobados y aprendizajes operativos de Mimittos.
---

# Lecciones aprendidas — Mimittos

Revisión: 2026-09-25. Registrar aquí comportamiento verificado; las propuestas de
producto pendientes pertenecen al PRD/backlog y no se describen como implementadas.

## Organización del código

- El dominio vive en `base_feature_app`; no existe una app `content` separada.
- Modelos por archivo; lógica de negocio en servicios y vistas DRF funcionales.
- `SiteContent.content_json` contiene configuración por key. El modelo Blog usa
  título, descripción, categoría e imagen: no tiene JSON bilingüe ni variantes
  `_es`/`_en`. Propuestas y portfolios no forman parte de estos modelos.
- Frontend: identificadores en inglés y copy visible en español. Los stores
  activos son auth, cart y blog; la tienda consulta peluches mediante servicios.
- La plantilla de emails está en `templates/emails/base.html`; la prepara
  `utils/email_renderer.py` y se envía mediante las utilidades/servicios Django.
  No existe EmailTemplateRegistry ni EmailTemplateConfig en este proyecto.

## Limpieza con evidencia

La ausencia de referencias textuales no prueba que una imagen pública sea inútil:
puede estar almacenada como URL en contenido de la base de datos. Conservarla hasta
comprobar esa fuente.

Para código frontend, seguir imports desde páginas y layouts. Un módulo usado sólo
por otro módulo inalcanzable continúa sin uso. Los tests y mocks por sí solos no
justifican conservarlo. La limpieza del 2026-09-25 retiró cinco módulos y sus cinco
tests: los carruseles antiguos, su tarjeta/store de productos y la configuración
i18n aislada. next-intl no tenía consumidores runtime. Swiper, BlogCard y blogStore
sí los tienen y permanecen.

Conservar lockfiles reproducibles, migraciones, `__init__.py`, management commands
y templates operativos con uso convencional aunque no tengan un import literal.
Los directorios `.agents/`, `.claude/` y `.codex/` son capas intencionales del fleet.

## Desarrollo y producción

- Trabajar en un worktree propio. La configuración enlazada puede apuntar a
  producción: no ejecutar migraciones ni seeds desde ese worktree.
- Backend: activar el venv al probar y seleccionar SQLite aislada explícitamente.
- Next.js reenvía `/api` y `/media` al backend; no incluye `/admin` ni `/static`.
- Producción usa procesos separados Django y Next.js. El build genera `.next/`;
  no hay catch-all Django para HTML exportado.
- Huey es inmediato fuera de producción y asíncrono con Redis en producción.
- La fuente de host, puertos y servicios es `vps-ops-toolkit/projects.yml`.
  Mimittos usa `mimittos_project`, `mimittos-frontend` y `mimittos-huey`.

## Pedidos, pagos y medios

- Configuración por talla en PeluchSizePrice; snapshots de OrderItem conservan
  los datos históricos aunque desaparezcan tallas o colores.
- Wompi usa `id` para identificar transacciones. El webhook
  `/api/payment/wompi/webhook/` informa su resultado y actualiza el pedido.
- El webhook es la fuente de verdad; no añadir polling a la API Wompi.
- Media de personalización se recibe en `/api/media/upload/`; los límites de
  imagen y audio se configuran separadamente.
- Las reseñas requieren pedido entregado; la regla la aplica `review_service`.

## Validación

- Ejecutar hasta 20 tests por lote y tres comandos por ciclo. Seleccionar archivos;
  no correr toda la suite por un cambio puntual.
- E2E: hasta dos specs por llamada. El frontend Playwright usa el puerto 3001,
  backend 8000, y reutiliza servidores fuera de CI. Desktop Chrome es el único
  proyecto activo.
- Los tests de páginas activas deben permanecer tras borrar módulos sin uso.
- Los flujos reales se registran en `flow-definitions.json` y `USER_FLOW_MAP.md`;
  no crear flujos para código que el usuario no puede alcanzar.
- La cobertura y el quality gate complementan las aserciones de comportamiento.
  Sus umbrales no deben relajarse para facilitar una limpieza.
