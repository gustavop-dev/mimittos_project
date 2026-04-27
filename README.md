# MIMITTOS

> **Más que un peluche, un recuerdo.**  
> E-commerce de peluches artesanales hechos a mano en Colombia, con personalización completa y panel de administración.

[![Django](https://img.shields.io/badge/Django-5-092E20?style=flat&logo=django)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python)](https://www.python.org/)

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Django 5 + Django REST Framework, JWT auth (SimpleJWT), Google OAuth |
| Frontend | Next.js 14 App Router, React 18, TypeScript, Tailwind CSS 4, Zustand |
| Pagos | Wompi (Colombia) — flujo webhook, sin polling |
| Imágenes | django-attachments + PIL (optimización automática) |
| Base de datos | SQLite (desarrollo) / MySQL 8 (producción) |
| Tareas | Huey + Redis |
| Animaciones | GSAP (page curtain), CSS keyframes (ticker banner) |

---

## Características

### Tienda pública
- Catálogo de peluches con filtros por categoría y búsqueda
- Página de detalle con galería de imágenes, selector de talla y color
- Personalizaciones opcionales: huella (nombre/fecha/letra), corazón con frase, mensaje de audio
- Carrito persistente (Zustand + localStorage)
- Checkout completo con pago Wompi (tarjeta, PSE, Nequi, Bancolombia)
- Confirmación post-pago + seguimiento de pedido para usuarios registrados
- Ticker de promoción configurable desde el admin (banner scrolling estilo Wall Street)
- Imagen del hero configurable desde el admin
- Página de contacto, historia de la marca y términos y condiciones
- Animación de entrada (PageCurtain GSAP con branding MIMITTOS®)
- Botón flotante de WhatsApp

### Autenticación
- Registro y login con email/contraseña (JWT)
- Login con Google OAuth
- Flujo de recuperación de contraseña por email (código 6 dígitos)
- Verificación de email al registrarse

### Backoffice (panel admin)
- Dashboard con métricas de ventas y analíticas
- Gestión de pedidos (listado, detalle, cambio de estado, tracking)
- Gestión de peluches (CRUD con galería de imágenes, tallas, colores, personalizaciones)
- Gestión de categorías con imágenes
- Gestión de usuarios
- Configuración del sitio: banner de promoción + imagen del hero (upload directo)

---

## Inicio rápido

### Requisitos

- Python 3.12+
- Node.js 20+
- Git

### 1. Clonar

```bash
git clone <url-del-repo>
cd mimittos_project
```

### 2. Backend

```bash
cd backend

# Crear y activar entorno virtual
python3 -m venv venv
source venv/bin/activate       # Linux/Mac
# venv\Scripts\activate        # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Sembrar todos los datos de demo (una sola vez)
python manage.py seed_all

# Iniciar servidor
python manage.py runserver 0.0.0.0:8000
```

Backend disponible en: `http://localhost:8000`  
Demo user: `demo@mimittos.com` / `Demo1234!`

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores (NEXT_PUBLIC_BACKEND_ORIGIN, NEXT_PUBLIC_GOOGLE_CLIENT_ID)

# Iniciar servidor de desarrollo
npm run dev
```

Frontend disponible en: `http://localhost:3000`

---

## Seed de datos

Un solo comando siembra todo el ambiente de desarrollo:

```bash
cd backend && source venv/bin/activate

# Seed completo (idempotente — no duplica si ya existe)
python manage.py seed_all

# Resetear peluches/órdenes y re-sembrar desde cero
python manage.py seed_all --reset

# Rápido — sin descargas de Unsplash ni analytics
python manage.py seed_all --skip-featured --skip-analytics --skip-color-images

# Sin internet (omite descarga de imágenes reales)
python manage.py seed_all --skip-featured
```

### ¿Qué siembra `seed_all`?

| Paso | Comando | Descripción |
|------|---------|-------------|
| 1 | `seed_featured` | 4 categorías con imágenes Unsplash + 4 peluches destacados con imágenes reales |
| 2 | `seed_demo` | Usuario demo + 3 órdenes de ejemplo (delivered / in_production / pending) |
| 3 | `seed_analytics` | 30 días de page-views y analíticas falsas |
| 4 | `seed_color_images` | Imágenes placeholder por combinación peluch+color |
| 5 | SiteContent | Banner de promoción activo + hero image placeholder |

> **⚠️ `seed_peluches`** no forma parte de `seed_all` porque es destructivo (borra todos los peluches y órdenes antes de crear). Úsalo solo si quieres un reset completo manual.

---

## Estructura del proyecto

```
mimittos_project/
├── backend/
│   ├── base_feature_app/               # Única app Django — todo el dominio aquí
│   │   ├── models/                     # Un archivo por modelo
│   │   │   ├── user.py                 # User (email como identificador, roles)
│   │   │   ├── peluch.py               # Peluch, PeluchSizePrice, PeluchColorImage
│   │   │   ├── category.py             # Category (con imagen)
│   │   │   ├── global_color.py         # GlobalColor
│   │   │   ├── global_size.py          # GlobalSize
│   │   │   ├── order.py                # Order, OrderItem, OrderStatusHistory
│   │   │   ├── wompi_transaction.py    # WompiTransaction
│   │   │   ├── site_content.py         # SiteContent (banner, hero image)
│   │   │   ├── blog.py                 # Blog
│   │   │   ├── page_view.py            # PageView (analytics)
│   │   │   └── password_code.py        # PasswordCode (reset de contraseña)
│   │   ├── views/                      # FBV por dominio
│   │   ├── serializers/
│   │   ├── services/                   # Lógica de negocio
│   │   │   ├── catalog_service.py
│   │   │   ├── order_service.py
│   │   │   ├── payment_service.py      # Integración Wompi
│   │   │   ├── content_service.py      # SiteContent CRUD + upload
│   │   │   └── email_service.py
│   │   ├── management/commands/
│   │   │   ├── seed_all.py             # ← Entry point principal
│   │   │   ├── seed_featured.py        # Imágenes Unsplash
│   │   │   ├── seed_demo.py            # Demo user + órdenes
│   │   │   ├── seed_analytics.py       # Analytics
│   │   │   ├── seed_color_images.py    # Imágenes por color
│   │   │   ├── create_fake_data.py     # Faker — volumen de datos
│   │   │   └── seed_peluches.py        # ⚠️ Destructivo
│   │   ├── migrations/
│   │   └── tests/
│   ├── base_feature_project/           # Configuración Django
│   │   ├── settings.py
│   │   ├── settings_prod.py
│   │   └── urls.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── app/                            # Next.js App Router
    │   ├── page.tsx                    # Home (hero, categorías, catálogo, FAQs)
    │   ├── catalog/                    # Catálogo con filtros
    │   ├── peluches/[slug]/            # Detalle de peluche
    │   ├── checkout/                   # Carrito → datos → pago → confirmación
    │   ├── about/                      # Historia de la marca
    │   ├── contact/                    # Contacto
    │   ├── terms/                      # Términos y condiciones
    │   ├── sign-in/ sign-up/           # Auth
    │   ├── forgot-password/            # Reset de contraseña
    │   ├── orders/                     # Mis pedidos (auth)
    │   └── backoffice/                 # Panel admin (auth + role=admin)
    │       ├── pedidos/
    │       ├── peluches/
    │       ├── categorias/
    │       ├── usuarios/
    │       └── configuracion/          # Banner + hero image
    ├── components/
    │   ├── layout/
    │   │   ├── PublicChrome.tsx        # Wrapper de vistas públicas
    │   │   ├── Header.tsx              # Nav con scroll-aware behavior
    │   │   ├── Footer.tsx              # Footer + botón WhatsApp flotante
    │   │   └── PromoBanner.tsx         # Ticker scrolling configurable
    │   ├── ui/
    │   │   └── PageCurtain.tsx         # Animación de entrada GSAP
    │   └── admin/
    │       └── AdminSidebar.tsx
    ├── lib/
    │   ├── stores/
    │   │   ├── authStore.ts            # Auth + tokens
    │   │   └── cartStore.ts            # Carrito persistido
    │   └── services/
    │       ├── http.ts                 # Axios con interceptors JWT
    │       └── contentService.ts       # SiteContent API + upload
    ├── app/globals.css                 # Variables CSS + keyframes
    └── .env.example
```

---

## API principal

### Auth
```
POST  /api/sign_in/                           # Login email + password
POST  /api/sign_up/                           # Registro
POST  /api/google_login/                      # Login Google OAuth
POST  /api/token/refresh/                     # Refresh JWT
POST  /api/send_passcode/                     # Enviar código de reset
POST  /api/verify_passcode_and_reset_password/ # Verificar código + nueva contraseña
```

### Catálogo (público)
```
GET   /api/categories/                        # Listado de categorías
GET   /api/peluches/                          # Catálogo con filtros (?category=, ?search=)
GET   /api/peluches/<slug>/                   # Detalle de peluche
```

### Órdenes
```
POST  /api/orders/                            # Crear orden (checkout)
GET   /api/orders/                            # Mis órdenes (auth)
GET   /api/orders/<order_number>/             # Detalle de orden (auth)
```

### Pagos — Wompi
```
POST  /api/payments/initiate/                 # Iniciar pago → crea WompiTransaction
GET   /api/payments/status/<order_number>/    # Estado de pago (un solo check)
POST  /api/payments/webhook/                  # Webhook Wompi (sin auth, con firma)
```

### Contenido configurable
```
GET   /api/content/promo_banner/              # Banner de promoción
GET   /api/content/hero_image/                # URL de imagen del hero
POST  /api/content/hero-image/upload/         # Upload imagen del hero (admin)
PUT   /api/content/<key>/                     # Actualizar contenido (admin)
```

### Backoffice (requiere role=admin)
```
GET/PUT  /api/backoffice/orders/              # Gestión de pedidos
GET/PUT  /api/backoffice/peluches/            # Gestión de peluches
GET/PUT  /api/backoffice/categories/          # Gestión de categorías
GET/PUT  /api/backoffice/users/               # Gestión de usuarios
```

---

## Scripts frontend

```bash
cd frontend

npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run lint             # ESLint

npm run test             # Tests unitarios (Jest)
npm run test:coverage    # Con reporte de cobertura

npm run e2e              # Tests E2E (Playwright)
npm run e2e:coverage     # E2E + reporte de flujos
```

---

## Variables de entorno

### Backend (`backend/.env`)

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de datos (omitir para SQLite en dev)
# DATABASE_URL=mysql://user:pass@localhost/mimittos

# Wompi
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_EVENTS_SECRET=your-events-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=hola@mimittos.co
EMAIL_HOST_PASSWORD=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Redis (para Huey)
REDIS_URL=redis://localhost:6379/0
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## Flujo de pago (Wompi)

```
Usuario → Checkout → POST /api/orders/ → POST /api/payments/initiate/
  → Redirect a Wompi checkout
  → Usuario paga
  → Wompi → POST /api/payments/webhook/ (APPROVED)
  → Order.status = payment_confirmed
  → Frontend: GET /api/payments/status/<order_number>/ (un solo check al volver)
  → Página de confirmación
```

**Importante**: Wompi no soporta códigos de descuento. El webhook es la fuente de verdad — el frontend nunca hace polling.

---

## Licencia

MIT — ver `LICENSE` para más detalles.
