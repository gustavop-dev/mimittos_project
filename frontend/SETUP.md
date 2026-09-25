# Configuración del frontend

Revisado el 2026-09-25. Versiones y comandos: `package.json` y
`package-lock.json`. Next.js App Router sirve la interfaz en español.

## Inicio local

Desde `frontend/` del worktree propio:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

El servidor manual usa `http://localhost:3000`. Configuración de ejemplo:

```env
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

`next.config.ts` reenvía `/api/:path*` y `/media/:path*` al backend.
Ambos servidores deben estar disponibles para usar datos e imágenes reales.
Para Google OAuth, configurar los orígenes locales autorizados en Google Cloud y
reiniciar Next.js al cambiar el client ID. Los valores privados permanecen en el
backend; no se colocan en variables `NEXT_PUBLIC_*`.

## Estructura vigente

```text
frontend/
├── app/
│   ├── page.tsx                 # Inicio
│   ├── catalog/                 # Catálogo de peluches
│   ├── peluches/[slug]/         # Detalle y personalización
│   ├── cart/                    # Carrito
│   ├── checkout/                # Datos del pedido
│   ├── payment/                 # Métodos de pago
│   ├── order-confirmed/         # Confirmación
│   ├── orders/                  # Historial del usuario
│   ├── tracking/                # Seguimiento público
│   ├── blogs/                   # Listado y [blogId]/detalle
│   ├── sign-in/                 # Acceso con email y Google
│   ├── sign-up/                 # Registro
│   ├── forgot-password/         # Recuperación
│   ├── backoffice/              # Panel administrativo
│   └── providers.tsx            # Restauración de sesión
├── components/
│   ├── admin/                   # AdminSidebar, PeluchForm
│   ├── blog/                    # BlogCard
│   ├── layout/                  # Header, Footer, PublicChrome, PromoBanner
│   └── ui/                      # PageCurtain y animaciones
├── lib/
│   ├── hooks/                   # Auth, pageviews, subidas y producto destacado
│   ├── stores/                  # authStore, cartStore, blogStore
│   ├── services/                # HTTP, tokens y servicios por dominio
│   ├── utils/                   # Precios, imágenes y confirmaciones
│   └── types.ts
└── e2e/                         # Pruebas Playwright
```

El catálogo usa `peluchService`; la portada compone su contenido directamente y
usa Swiper. No hay `productStore`, carruseles independientes ni selector de idioma.

## Validación local

Hasta 20 tests por ejecución, tres comandos por ciclo y dos specs E2E por llamada.
Seleccionar los archivos afectados; las suites completas corren en CI.

```bash
npm test -- app/__tests__/page.test.tsx --runInBand
npm run test:watch -- components/blog/__tests__/BlogCard.test.tsx
npx playwright test e2e/public/navigation.spec.ts --project="Desktop Chrome"
```

Playwright usa el frontend en `http://localhost:3001` y el backend en
`127.0.0.1:8000`. Reutiliza servidores existentes fuera de CI. Desktop Chrome es
el único proyecto habilitado; los aliases mobile/tablet requieren activar esos
proyectos antes de usarse.

## Comandos de desarrollo

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor con recarga |
| `npm run build` | Build de producción en `.next/` |
| `npm run start` | Servir el build mediante un proceso Next.js |
| `npm run lint -- <archivo>` | ESLint sobre el archivo seleccionado |
| `npm test -- <archivo>` | Tests Jest seleccionados |
| `npm run test:e2e:ui -- <spec>` | Playwright interactivo acotado |
| `npm run e2e:modules` | Consultar módulos del registro de flujos |
| `npm run e2e:clean` | Limpiar reportes locales del worktree |

## Problemas frecuentes

- Imágenes o API sin respuesta: comprobar backend y `NEXT_PUBLIC_BACKEND_ORIGIN`.
- Google OAuth: comprobar client ID y orígenes autorizados; reiniciar el servidor
  propio después de cambiar `.env.local`.
- Puerto ocupado: consultar `lsof -i :3000 -i :3001 -i :8000`; reutilizar el servidor
  propio o elegir otro puerto. No detener procesos de otras sesiones.

Documentación: [tests unitarios](TESTING.md), [E2E](e2e/README.md) y
[arquitectura y despliegue](../docs/methodology/architecture.md).
