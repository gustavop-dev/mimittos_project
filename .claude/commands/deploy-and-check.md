---
description: Deploy latest main to production server for mimittos_project
---

> Execute these steps connected to the production server via SSH.
> Base path: `/home/ryzepeck/webapps/mimittos_project`
> Do NOT run locally.

# Deploy mimittos_project to Production

Run these steps on the production server at `/home/ryzepeck/webapps/mimittos_project` to deploy the latest `main` branch.

## Pre-Deploy

1. Quick status snapshot before deploy:
```bash
bash /home/ryzepeck/webapps/ops/vps/scripts/diagnostics/quick-status.sh
```

## Deploy Steps

2. Pull the latest code from main:
```bash
cd /home/ryzepeck/webapps/mimittos_project && git pull origin main
```

3. Install backend dependencies and run migrations:
```bash
cd /home/ryzepeck/webapps/mimittos_project/backend && source venv/bin/activate && pip install -r requirements.txt && DJANGO_SETTINGS_MODULE=base_feature_project.settings_prod python manage.py migrate --noinput
```

4. Build the Next.js frontend (runs on its own service at port 3002):
```bash
source /home/ryzepeck/.nvm/nvm.sh && nvm use 20.19.4 && cd /home/ryzepeck/webapps/mimittos_project/frontend && npm ci && NEXT_PUBLIC_BACKEND_ORIGIN=https://mimittos.projectapp.co npm run build
```

5. Collect Django static files:
```bash
cd /home/ryzepeck/webapps/mimittos_project/backend && source venv/bin/activate && DJANGO_SETTINGS_MODULE=base_feature_project.settings_prod python manage.py collectstatic --noinput
```

6. Restart services:
```bash
sudo systemctl restart mimittos_project mimittos-huey mimittos-frontend
```

## Post-Deploy Verification

7. Run post-deploy check for mimittos_project:
```bash
bash /home/ryzepeck/webapps/ops/vps/scripts/deployment/post-deploy-check.sh mimittos_project
```
Expected: PASS on all checks, FAIL=0.

8. HTTPS smoke test:
```bash
curl -sI https://mimittos.projectapp.co/
curl -s https://mimittos.projectapp.co/api/health/
```

9. If something fails, check the logs:
```bash
sudo journalctl -u mimittos_project.service --no-pager -n 30
sudo journalctl -u mimittos-huey.service --no-pager -n 30
sudo journalctl -u mimittos-frontend.service --no-pager -n 30
sudo tail -20 /var/log/nginx/error.log
```

## Architecture Reference

- **Domain**: `mimittos.projectapp.co`
- **Backend**: Django 6 (`base_feature_project` module). Settings: `DJANGO_SETTINGS_MODULE=base_feature_project.settings_prod`
- **Frontend**: Next.js 16 en puerto 3002 como servicio independiente (`mimittos-frontend.service`)
- **Services**: `mimittos_project.service` (Gunicorn, socket `/run/mimittos_project.sock`), `mimittos-huey.service` (Huey), `mimittos-frontend.service` (Next.js)
- **Nginx**: `/etc/nginx/sites-available/mimittos_project` — `/api/`, `/admin/`, `/admin-gallery/` → gunicorn socket; resto → `127.0.0.1:3002`
- **Static**: `/home/ryzepeck/webapps/mimittos_project/backend/staticfiles/`
- **Media**: `/home/ryzepeck/webapps/mimittos_project/backend/media/`
- **Backups**: `/var/backups/mimittos_project/` (Huey runs dbbackup los domingos 03:45 UTC)
- **Pasarela de pago**: Wompi (actualmente SANDBOX, migrar a producción cuando el cliente entregue claves)

## Notes

- VPS operations scripts viven en `/home/ryzepeck/webapps/ops/vps/scripts/`.
- `DJANGO_SETTINGS_MODULE=base_feature_project.settings_prod` debe estar seteado para migrate y collectstatic (manage.py por defecto usa `settings_dev`).
- Git branch es `main`.
- Node v20.19.4 vía nvm para el frontend build.
