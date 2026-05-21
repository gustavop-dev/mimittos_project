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

### [ERROR-001] Product detail showed another color's photos
- **Date**: 2026-05-21
- **Context**: Product detail page — selecting a color displayed images uploaded to a different color (e.g. selecting "Algodón", which had no photos, showed "Rubí rojo" photos).
- **Root Cause**: The frontend paired `available_colors[i]` with `color_images_meta[i]` by array index, but the backend serialized those two arrays with different `ORDER BY` clauses (`['sort_order','name']` vs `['sort_order']`). With tied `sort_order` values the arrays diverged, so the selected swatch indexed into the wrong color's images.
- **Resolution**: Merged the two arrays into one. The peluch serializers now return `available_colors` with each color carrying its own `preview_url`, `image_count` and (detail only) `images`. The `color_images_meta` field and the lazy `getColorImages` per-color fetch were removed. The frontend reads images off the same color object — index coupling is structurally impossible.
- **Files Affected**: `backend/base_feature_app/serializers/catalog.py`, `frontend/lib/types.ts`, `frontend/app/peluches/[slug]/page.tsx`, `frontend/app/peluches/[slug]/layout.tsx`, `frontend/app/page.tsx`, `frontend/app/catalog/page.tsx`, `frontend/components/admin/PeluchForm.tsx`, `frontend/lib/services/peluchService.ts`, `frontend/lib/services/peluchAdminService.ts`
