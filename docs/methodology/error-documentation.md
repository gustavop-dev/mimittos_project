---
trigger: manual
description: Error documentation and known issues tracking. Reference when debugging, fixing bugs, or encountering recurring issues.
---

# Error Documentation — Mimittos

This file tracks known errors, their context, and resolutions. When a reusable fix or correction is found during development, document it here to avoid repeating the same mistake.

---

## Format

```
### [ERROR-NNN] Short description
- **Date**: YYYY-MM-DD
- **Context**: Where/when this error occurs
- **Root Cause**: Why it happens
- **Resolution**: How to fix it
- **Files Affected**: List of files
```

---

## Known Issues

_No errors documented yet. This file will be updated as issues are discovered and resolved._

---

## Resolved Issues

### [ERROR-002] Hero image stale in production after re-upload
- **Date**: 2026-05-22
- **Context**: Tras subir una imagen de hero desde el backoffice, distintos usuarios veían versiones distintas en el home de la tienda (unos la nueva, otros una vieja o la default). Solo ocurría en producción, no en dev.
- **Root Cause**: `hero_image_upload` guardaba el archivo siempre con el nombre fijo `site/hero.jpg`, por lo que la URL `/media/site/hero.jpg` nunca cambiaba entre subidas. En producción (`DEBUG=False`) `/media/` lo sirve nginx con caché agresiva, así que navegadores/CDN seguían entregando los bytes viejos de esa URL invariable. En dev (`DEBUG=True`) Django sirve `/media/` sin caché, por eso no se reproducía.
- **Resolution**: Cada subida genera un nombre único `site/hero-<uuid>.jpg`, de modo que la URL cambia siempre y ninguna capa de caché tiene esa ruta previamente. Además se borra el archivo anterior si vivía en el storage local. Nota de despliegue: el código solo aplica en la próxima subida — hay que re-subir la imagen una vez tras el deploy.
- **Files Affected**: `backend/base_feature_app/views/content_views.py`, `backend/base_feature_app/tests/views/test_media_and_content_views.py`

### [ERROR-001] Product detail showed another color's photos
- **Date**: 2026-05-21
- **Context**: Product detail page — selecting a color displayed images uploaded to a different color (e.g. selecting "Algodón", which had no photos, showed "Rubí rojo" photos).
- **Root Cause**: The frontend paired `available_colors[i]` with `color_images_meta[i]` by array index, but the backend serialized those two arrays with different `ORDER BY` clauses (`['sort_order','name']` vs `['sort_order']`). With tied `sort_order` values the arrays diverged, so the selected swatch indexed into the wrong color's images.
- **Resolution**: Merged the two arrays into one. The peluch serializers now return `available_colors` with each color carrying its own `preview_url`, `image_count` and (detail only) `images`. The `color_images_meta` field and the lazy `getColorImages` per-color fetch were removed. The frontend reads images off the same color object — index coupling is structurally impossible.
- **Files Affected**: `backend/base_feature_app/serializers/catalog.py`, `frontend/lib/types.ts`, `frontend/app/peluches/[slug]/page.tsx`, `frontend/app/peluches/[slug]/layout.tsx`, `frontend/app/page.tsx`, `frontend/app/catalog/page.tsx`, `frontend/components/admin/PeluchForm.tsx`, `frontend/lib/services/peluchService.ts`, `frontend/lib/services/peluchAdminService.ts`
