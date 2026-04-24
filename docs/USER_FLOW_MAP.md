# User Flow Map

**Single source of truth for all user flows in the application.**

Use this document to understand each flow's steps, branching conditions, role restrictions, and API contracts before writing or reviewing E2E tests.

**Version:** 1.2.0
**Last Updated:** 2026-04-24

---

## Table of Contents

1. [Module Index](#module-index)
2. [Auth Module](#auth-module)
3. [Public Module](#public-module)
4. [App Module](#app-module)
5. [Payment Module](#payment-module)
6. [Reviews Module](#reviews-module)
7. [Backoffice Module](#backoffice-module)
8. [Cross-Reference](#cross-reference)

---

## Module Index

| Flow ID | Name | Module | Priority | Roles | Frontend Route |
|---------|------|--------|----------|-------|----------------|
| `auth-sign-in` | Sign In | auth | P1 | guest | `/sign-in` |
| `auth-sign-up` | Sign Up | auth | P1 | guest | `/sign-up` |
| `auth-google-login` | Google OAuth Login | auth | P2 | guest | `/sign-in`, `/sign-up` |
| `auth-forgot-password` | Forgot Password | auth | P2 | guest | `/forgot-password` |
| `auth-sign-out` | Sign Out | auth | P2 | user | `/dashboard` |
| `auth-session-persistence` | Session Persistence | auth | P2 | user | any protected route |
| `public-home` | Home Page | public | P2 | guest | `/` |
| `public-navigation` | Site Navigation | public | P3 | guest | all pages |
| `public-catalog-browse` | Browse Catalog | public | P2 | guest | `/catalog` |
| `public-peluch-detail` | Peluch Detail | public | P2 | guest | `/peluches/[slug]` |
| `public-blogs-browse` | Browse Blogs | public | P3 | guest | `/blogs` |
| `public-blog-detail` | Blog Detail | public | P3 | guest | `/blogs/[blogId]` |
| `app-cart-add` | Add Peluch to Cart | app | P1 | guest | `/peluches/[slug]` |
| `app-cart-manage` | Manage Cart | app | P1 | guest | `/cart` |
| `app-cart-persistence` | Cart Persistence | app | P2 | guest | `/cart` |
| `app-checkout-complete` | Complete Checkout (Wompi) | app | P1 | guest | `/checkout` |
| `app-peluch-size-color` | Select Size and Color | app | P2 | guest | `/peluches/[slug]` |
| `app-peluch-huella` | Configure Huella | app | P2 | guest | `/peluches/[slug]` |
| `app-peluch-corazon` | Configure Corazón | app | P2 | guest | `/peluches/[slug]` |
| `app-peluch-audio` | Upload Audio | app | P3 | guest | `/peluches/[slug]` |
| `app-orders-list` | My Orders | app | P2 | user | `/orders` |
| `app-tracking` | Track Order | app | P2 | shared | `/tracking` |
| `app-tracking-wompi` | Auto-Track from Wompi | app | P3 | shared | `/tracking?order=...` |
| `app-dashboard` | Dashboard | app | P2 | user | `/dashboard` |
| `backoffice-users-list` | Users List | backoffice | P2 | staff | `/backoffice` |
| `backoffice-orders-list` | Orders List | backoffice | P2 | staff | `/backoffice` |
| `auth-login-success` | Successful Sign-In | auth | P1 | guest | `/sign-in` |
| `auth-registration-verify` | Email Verification | auth | P2 | guest | `/sign-up` |
| `payment-page-display` | Payment Page | payment | P1 | shared | `/payment` |
| `order-confirmed-display` | Order Confirmed | payment | P1 | shared | `/order-confirmed` |
| `review-submit` | Submit Review | reviews | P2 | user | `/peluches/[slug]` |
| `backoffice-login` | Admin Login | backoffice | P2 | staff | `/admin-login` |
| `backoffice-dashboard-display` | Backoffice Dashboard | backoffice | P2 | staff | `/backoffice` |
| `backoffice-order-management` | Order Management | backoffice | P2 | staff | `/backoffice/pedidos` |
| `backoffice-peluch-list` | Peluch List | backoffice | P3 | staff | `/backoffice/peluches` |
| `backoffice-peluch-create` | Create Peluch | backoffice | P3 | staff | `/backoffice/peluches/nuevo` |
| `backoffice-peluch-edit` | Edit Peluch | backoffice | P3 | staff | `/backoffice/peluches/[slug]` |
| `backoffice-category-management` | Category Management | backoffice | P3 | staff | `/backoffice/categorias` |
| `backoffice-user-management` | User Management | backoffice | P3 | staff | `/backoffice/usuarios` |
| `contact-page-display` | Contact Page | public | P4 | shared | `/contact` |
| `about-page-display` | About Page | public | P4 | shared | `/about` |
| `terms-page-display` | Terms Page | public | P4 | shared | `/terms` |

---

## Auth Module

### auth-sign-in

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Roles** | guest |
| **Frontend route** | `/sign-in` |
| **API endpoints** | `POST /api/sign_in/` |

**Preconditions:** User is not authenticated. A registered account exists.

**Steps:**

1. User navigates to `/sign-in`.
2. Page renders form with **Email**, **Password** fields and **Sign in** button.
3. User fills in email and password.
4. User clicks **Sign in**.
5. Frontend sends `POST /api/sign_in/` with `{ email, password }`.
6. Backend validates credentials and returns `{ access, refresh }` (HTTP 200).
7. Frontend stores tokens in cookies (`access_token`, `refresh_token`).
8. Frontend redirects to `/dashboard`.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Empty email or password | HTML `required` prevents submission |
| Email not registered | `401 { error: "Invalid credentials" }` — error below form |
| Wrong password | `401 { error: "Invalid credentials" }` — error below form |
| Account inactive | `403 { error: "Account is inactive" }` — error below form |

---

### auth-sign-up

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Roles** | guest |
| **Frontend route** | `/sign-up` |
| **API endpoints** | `POST /api/sign_up/` |

**Preconditions:** User is not authenticated.

**Steps:**

1. User navigates to `/sign-up`.
2. Page renders form: **First Name**, **Last Name**, **Email**, **Password**, **Confirm Password**, **Create account** button.
3. User fills in all fields.
4. User clicks **Create account**.
5. Frontend validates passwords match and length >= 8.
6. Frontend sends `POST /api/sign_up/` with `{ email, password, first_name, last_name }`.
7. Backend creates user and returns `{ access, refresh }` (HTTP 201).
8. Frontend stores tokens and redirects to `/dashboard`.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Passwords do not match | Client error: "Passwords do not match" — no API call |
| Password < 8 chars | Client error: "Password must be at least 8 characters" — no API call |
| Email already registered | `400 { error: "User with this email already exists" }` |
| Missing email or password | `400 { error: "Email and password are required" }` |

---

### auth-google-login

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | guest |
| **Frontend route** | `/sign-in`, `/sign-up` |
| **API endpoints** | `POST /api/google_login/` |

**Preconditions:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` env var is set. User is not authenticated.

**Steps:**

1. User navigates to `/sign-in` or `/sign-up`.
2. Google Sign-In button rendered via `@react-oauth/google`.
3. User clicks Google button and completes OAuth consent.
4. Frontend receives credential JWT, decodes `email`, `given_name`, `family_name`, `picture`.
5. Frontend sends `POST /api/google_login/` with `{ credential, email, given_name, family_name, picture }`.
6. Backend validates token via Google tokeninfo, gets or creates user.
7. Backend returns `{ access, refresh, created, google_validated }` (HTTP 200).
8. Frontend stores tokens and redirects to `/dashboard`.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` missing | "Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID" shown instead of button |
| Credential missing | `400 { error: "Google credential is required" }` |
| Invalid credential (prod) | `401 { error: "Invalid Google credential" }` |
| Audience mismatch (prod) | `401 { error: "Invalid Google client" }` |
| New user | User created with unusable password; `created: true` |
| Existing user | Matched by email; names updated if blank |

---

### auth-forgot-password

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | guest |
| **Frontend route** | `/forgot-password` |
| **API endpoints** | `POST /api/send_passcode/`, `POST /api/verify_passcode_and_reset_password/` |

**Preconditions:** User is not authenticated. A registered account exists.

**Step A — Request passcode:**

1. User navigates to `/forgot-password`.
2. Page renders email input and **Send verification code** button (step = `email`).
3. User enters email and clicks **Send verification code**.
4. Frontend sends `POST /api/send_passcode/` with `{ email }`.
5. Backend generates a `PasswordCode`, sends email with 6-digit code.
6. Success message: "Verification code sent to your email". UI transitions to step = `code`.

**Step B — Reset password:**

7. Page renders **Code** (6-digit), **New Password**, **Confirm New Password** fields and **Reset password** button.
8. User enters code and new password.
9. Frontend validates passwords match and length >= 8.
10. Frontend sends `POST /api/verify_passcode_and_reset_password/` with `{ email, code, new_password }`.
11. Backend verifies code, updates password, marks code as used. Returns HTTP 200.
12. Success message: "Password reset successfully! Redirecting..." — redirect to `/sign-in`.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Email not registered | API still returns `200 { message: "If the email exists, a code has been sent" }` (no leak) |
| Email send failure | `500 { error: "Failed to send email" }` |
| Invalid or expired code | `400 { error: "Invalid or expired code" }` |
| Passwords do not match | Client error — no API call |
| Password < 8 chars | Client error — no API call |
| "Back to email" clicked | UI returns to step A |

---

### auth-login-success

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Roles** | guest |
| **Frontend route** | `/sign-in` |
| **API endpoints** | `POST /api/sign_in/` |

**Preconditions:** User is not authenticated. A registered, active account exists.

**Steps:**

1. User navigates to `/sign-in`.
2. User fills in valid email and password.
3. User clicks **Sign in**.
4. Frontend sends `POST /api/sign_in/` → backend returns `{ access, refresh }` (HTTP 200).
5. Frontend stores tokens in cookies and redirects to home or dashboard.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Redirect param present | Frontend redirects to original protected URL |
| No redirect param | Redirects to `/` or `/dashboard` |

---

### auth-registration-verify

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | guest |
| **Frontend route** | `/sign-up` |
| **API endpoints** | `POST /api/sign_up/`, `POST /api/verify_registration/`, `POST /api/resend_verification/` |

**Preconditions:** User has just completed sign-up form.

**Steps:**

1. After successful `POST /api/sign_up/`, UI transitions to a verification code input.
2. Backend sends 6-digit code to user's email.
3. User enters code and clicks **Verify**.
4. Frontend sends `POST /api/verify_registration/` with `{ email, code }`.
5. Backend activates account and returns `{ access, refresh }`.
6. Frontend stores tokens and redirects to `/dashboard`.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Wrong code | `400 { error: "Invalid or expired code" }` |
| User clicks resend | `POST /api/resend_verification/` sends new code |

---

### auth-sign-out

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | user |
| **Frontend route** | `/dashboard` |
| **API endpoints** | None (client-side only) |

**Preconditions:** User is authenticated.

**Steps:**

1. User is on `/dashboard`.
2. User clicks **Sign out** button.
3. Frontend clears JWT tokens from cookies via `authStore.signOut()`.
4. User is redirected to `/sign-in` (or home) by the auth guard.

**Branching conditions:** None — sign-out is always client-side.

---

### auth-session-persistence

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | user |
| **Frontend route** | any protected route |
| **API endpoints** | `GET /api/validate_token/`, `POST /api/token/refresh/` |

**Preconditions:** User has valid tokens in cookies.

**Steps:**

1. User navigates to a protected route (`/dashboard`, `/backoffice`).
2. Frontend reads `access_token` from cookies.
3. Frontend sends `GET /api/validate_token/` with Bearer token.
4. Backend validates JWT and returns `{ valid: true, user: { id, email, first_name, last_name, role, is_staff } }`.
5. User is shown the protected content.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| No tokens in cookies | Redirect to `/sign-in` via `useRequireAuth` hook |
| Access token expired | Frontend calls `POST /api/token/refresh/` with refresh token |
| Refresh token expired | Redirect to `/sign-in` |

---

## Public Module

### public-home

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | guest |
| **Frontend route** | `/` |
| **API endpoints** | `GET /api/peluches/featured/` |

**Preconditions:** None.

**Steps:**

1. User navigates to `/`.
2. Page renders hero section with heading "Cada abrazo guarda un recuerdo único."
3. CTA links: **Explorar catálogo** (→ `/catalog`), **Ver catálogo completo** (→ `/catalog`).
4. Featured peluches carousel loads from `GET /api/peluches/featured/`.
5. Category grid, testimonials, and FAQ sections rendered statically.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Featured API unavailable | Carousel shows empty state |

---

### public-navigation

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Roles** | guest |
| **Frontend route** | all pages |
| **API endpoints** | None |

**Preconditions:** None.

**Steps:**

1. Every page renders a shared header with navigation links.
2. Header contains links to: Home (`/`), Catalog (`/catalog`), Blogs (`/blogs`), Sign-in (`/sign-in`).
3. Footer is present on all pages.
4. Navigation links work across page transitions.
5. Browser back/forward buttons maintain correct history.

**Branching conditions:** None — purely structural.

---

### public-catalog-browse

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | guest |
| **Frontend route** | `/catalog` |
| **API endpoints** | `GET /api/peluches/`, `GET /api/categories/`, `GET /api/sizes/` |

**Preconditions:** None.

**Steps:**

1. User navigates to `/catalog`.
2. Page fetches categories and sizes for filter sidebar.
3. Frontend fetches `GET /api/peluches/` with optional query params (category, size, min_price, max_price, sort).
4. Peluches render as a grid of `ProductCard` components (gallery_urls[0], title, min_price, badge, available_colors).
5. Each card links to `/peluches/[slug]`.
6. Changing filter controls re-fetches the list.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| API loading | Skeleton grid shown |
| API error | Error state with retry option |
| No peluches match filters | Empty state message |

---

### public-peluch-detail

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | guest |
| **Frontend route** | `/peluches/[slug]` |
| **API endpoints** | `GET /api/peluches/[slug]/`, `GET /api/peluches/[slug]/reviews/` |

**Preconditions:** Peluch with given slug exists.

**Steps:**

1. User navigates to `/peluches/[slug]`.
2. Page shows "Cargando..." while fetching.
3. Frontend fetches `peluchService.getPeluchBySlug(slug)`.
4. Page renders: gallery, title, lead_description, badge, rating.
5. Size selector from `size_prices`; price updates on selection.
6. Color selector from `available_colors`.
7. Personalization sections shown conditionally: Huella (if `has_huella`), Corazón (if `has_corazon`), Audio (if `has_audio`).
8. Total price = `size_price + personalization_costs`.
9. **Agregar** button adds `CartItem` to cart store.
10. Tabs: Descripción, Especificaciones, Cuidados.
11. Reviews loaded from `getReviews(slug)`.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Slug not found | Shows "No encontramos este peluche." |
| No size selected | Agregar button disabled |
| No color selected | Agregar button disabled |

---

### public-blogs-browse

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Roles** | guest |
| **Frontend route** | `/blogs` |
| **API endpoints** | `GET /api/blogs-data/` |

**Preconditions:** None.

**Steps:**

1. User navigates to `/blogs`.
2. Page displays heading "Blogs" with loading skeleton.
3. Frontend fetches `GET /api/blogs-data/` via `blogStore.fetchBlogs()`.
4. Blogs render as a grid of `BlogCard` components.
5. Each card links to `/blogs/[blogId]`.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| API loading | Skeleton grid (9 placeholders) shown |
| API error | "Blogs unavailable" message with **Retry** button |
| No blogs in DB | "No blogs yet" dashed-border message |

---

### public-blog-detail

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Roles** | guest |
| **Frontend route** | `/blogs/[blogId]` |
| **API endpoints** | `GET /api/blogs-data/[blogId]/` |

**Preconditions:** Blog with given ID exists.

**Steps:**

1. User navigates to `/blogs/[blogId]`.
2. Frontend fetches blog detail data.
3. Page renders blog title, content, and associated media.
4. User can navigate back to `/blogs` via browser back button.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Blog not found | Loading state or fallback |

---

## App Module

### app-cart-add

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Roles** | guest |
| **Frontend route** | `/peluches/[slug]` |
| **API endpoints** | None (client-side state via Zustand + localStorage) |

**Preconditions:** User is on a peluch detail page with a size and color selected.

**Steps:**

1. User views a peluch on `/peluches/[slug]`.
2. User selects size and color.
3. User clicks **Agregar** button.
4. `cartStore.addToCart(cartItem)` adds a `CartItem` keyed by `peluch_id+size_id+color_id`.
5. Cart state persists to `localStorage`.
6. User can navigate to `/cart` to see the item.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Same peluch+size+color already in cart | Quantity incremented |
| Same peluch but different size or color | New separate entry added |

---

### app-cart-manage

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Roles** | guest |
| **Frontend route** | `/cart` |
| **API endpoints** | None (client-side state) |

**Preconditions:** User has at least one item in cart.

**Steps:**

1. User navigates to `/cart`.
2. Cart displays each item: image, title, size/color, quantity input, **Eliminar** button, line total.
3. **Update quantity:** User changes the number input → `cartStore.updateQuantity(key, qty)`.
4. **Remove item:** User clicks **Eliminar** → `cartStore.removeFromCart(key)`.
5. **Subtotal** recalculates: `sum of (unit_price + personalization_cost) * quantity` per item.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Cart is empty | "Tu carrito está vacío." message |
| Single item removed | If last item, shows empty cart message |
| Quantity set to 0 or negative | Minimum enforced by `min={1}` on input |

---

### app-cart-persistence

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | guest |
| **Frontend route** | `/cart` |
| **API endpoints** | None |

**Preconditions:** User has items in cart.

**Steps:**

1. User adds products to cart (see `app-cart-add`).
2. User reloads the page or navigates away and returns.
3. Cart state is restored from `localStorage` via Zustand persist middleware.
4. All items, quantities, and subtotal remain intact.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| localStorage cleared | Cart resets to empty |
| Corrupt localStorage data | Cart may reset to empty (Zustand default) |

---

### app-checkout-complete

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Roles** | guest |
| **Frontend route** | `/checkout` |
| **API endpoints** | `POST /api/orders/` |

**Preconditions:** User has at least one item in cart.

**Steps:**

1. User navigates to `/checkout` with items in cart.
2. Form shows: **Nombre completo**, **Correo electrónico**, **Celular**, **Departamento** (select), **Ciudad** (select), **Código postal**, **Dirección completa**, **Notas** (optional).
3. Wompi info panel: "Serás redirigido a Wompi para pagar el abono del 50%."
4. Order summary shows items + Subtotal + Abono (50%) + Saldo al recibir.
5. User accepts terms checkbox.
6. **Ir a pagar** button becomes enabled (requires non-empty cart + terms accepted).
7. User clicks **Ir a pagar**.
8. Frontend sends `POST /api/orders/` with `{ customer_name, customer_email, customer_phone, address, city, department, postal_code, notes, items[] }`.
9. Backend creates order + Wompi payment link. Returns `{ order_number, checkout_url, deposit_amount, balance_amount, total_amount }`.
10. Frontend calls `clearCart()`.
11. Frontend sets `window.location.href = checkout_url` (Wompi redirect).

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Cart is empty | **Ir a pagar** button disabled |
| Terms not accepted | **Ir a pagar** button disabled |
| API failure | Error message from `err.response.data.detail` |
| Button loading | Shows "Procesando..." during submission |
| No `checkout_url` in response | Router pushes to `/orders/track/[order_number]` |

---

### app-dashboard

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | user |
| **Frontend route** | `/dashboard` |
| **API endpoints** | `GET /api/validate_token/` (via auth guard) |

**Preconditions:** User is authenticated with valid JWT.

**Steps:**

1. User navigates to `/dashboard`.
2. `useRequireAuth()` hook validates the token.
3. If authenticated, page renders: heading "Dashboard", link to **Backoffice**, **Sign out** button.
4. User can click **Backoffice** to navigate to `/backoffice`.
5. User can click **Sign out** to clear session (see `auth-sign-out`).

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Not authenticated | Redirect to `/sign-in` |
| Token expired | Attempt refresh; if fail, redirect to `/sign-in` |

---

## Backoffice Module

### backoffice-users-list

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | staff |
| **Frontend route** | `/backoffice` |
| **API endpoints** | `GET /api/users/` |

**Preconditions:** User is authenticated with `is_staff = true`.

**Steps:**

1. User navigates to `/backoffice`.
2. `useRequireAuth()` hook validates the token.
3. Frontend fetches `GET /api/users/` with Bearer token.
4. Users table renders columns: **Email**, **Role**, **Staff**, **Active**.
5. Each row shows user data.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Not authenticated | Redirect to `/sign-in` |
| Not staff | `403` error — "Could not load backoffice data. Make sure you are signed in with a staff user." |
| No users | "No data" row shown |

---

### backoffice-orders-list

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | staff |
| **Frontend route** | `/backoffice` |
| **API endpoints** | `GET /api/orders/list/` |

**Preconditions:** User is authenticated with `is_staff = true`.

**Steps:**

1. User navigates to `/backoffice`.
2. Frontend fetches `GET /api/orders/list/` with Bearer token.
3. Orders table renders: **order_number**, **customer_name**, **status** (badge), **total_amount**, **deposit_amount**, **created_at**.
4. Admin can change order status via dropdown → `PATCH /api/orders/[number]/status/`.
5. Admin can enter tracking number → `PATCH /api/orders/[number]/tracking/`.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Not staff | `403` error |
| No orders | "No data" row shown |

---

## App Module — Peluchelandia Extensions

### app-peluch-size-color

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | guest |
| **Frontend route** | `/peluches/[slug]` |
| **API endpoints** | None (data from peluch detail response) |

**Steps:**

1. User is on peluch detail page.
2. User clicks a size button from `size_prices` → price updates to that size's price.
3. User clicks a color swatch from `available_colors`.
4. Total price display updates immediately.

---

### app-peluch-huella

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | guest |
| **Frontend route** | `/peluches/[slug]` |
| **API endpoints** | `POST /api/media/upload/` (if image type) |

**Preconditions:** Peluch has `has_huella = true`.

**Steps:**

1. Huella section rendered with `huella_extra_cost` shown.
2. User selects huella type: `name` | `date` | `letter` | `image`.
3. For text types: user enters text in input.
4. For image type: user uploads file → `mediaService.uploadImage()` → `media_id` stored.
5. `personalization_cost` increases by `huella_extra_cost`.

---

### app-peluch-corazon

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | guest |
| **Frontend route** | `/peluches/[slug]` |
| **API endpoints** | None |

**Preconditions:** Peluch has `has_corazon = true`.

**Steps:**

1. Corazón section rendered with `corazon_extra_cost` shown.
2. User enters a phrase (max 50 characters).
3. `personalization_cost` increases by `corazon_extra_cost`.

---

### app-orders-list

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | user |
| **Frontend route** | `/orders` |
| **API endpoints** | `GET /api/orders/my/` |

**Preconditions:** User is authenticated.

**Steps:**

1. User navigates to `/orders`.
2. If not authenticated → redirect to `/sign-in`.
3. Frontend fetches `GET /api/orders/my/`.
4. Orders render as expandable cards: order_number, status badge, total_amount, created_at.
5. Expanding card shows items with title, size, color, quantity, line_total.

**Status badge mapping:**

| Status | Label | Color |
|--------|-------|-------|
| `pending_payment` | Pendiente de pago | yellow |
| `payment_confirmed` | Pago confirmado | blue |
| `in_production` | En producción | purple |
| `shipped` | Despachado | orange |
| `delivered` | Entregado | green |
| `cancelled` | Cancelado | red |

---

### app-tracking

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | shared |
| **Frontend route** | `/tracking` |
| **API endpoints** | `GET /api/orders/track/[order_number]/` |

**Steps:**

1. User navigates to `/tracking`.
2. User enters order number in input and clicks **Buscar**.
3. Frontend fetches `GET /api/orders/track/[order_number]/`.
4. Timeline renders with current status highlighted.
5. If `tracking_number` available, carrier and guide shown.

---

### app-tracking-wompi

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Roles** | shared |
| **Frontend route** | `/tracking?order=PELUCH-XXXX-XXXX` |
| **API endpoints** | `GET /api/orders/track/[order_number]/` |

**Steps:**

1. Wompi redirects user to `/tracking?order=PELUCH-XXXX-XXXX` after payment.
2. Page reads `?order` query param on mount.
3. Auto-calls `orderService.trackOrder(orderNumber)`.
4. Timeline shown immediately without manual search.

---

---

## Payment Module

### payment-page-display

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Roles** | shared |
| **Frontend route** | `/payment` |
| **API endpoints** | `GET /payment/info/{orderNumber}/`, `GET /payment/pse-banks/` |

**Preconditions:** Order has been created (order_number available, typically from Wompi redirect or direct navigation).

**Steps:**

1. User lands on `/payment` (with order_number in query params or state).
2. Page fetches `GET /payment/info/{orderNumber}/` to load order totals and Wompi acceptance tokens.
3. Page renders payment method tabs: **Tarjeta**, **Nequi**, **PSE**, **Bancolombia**.
4. User selects a payment method and fills in the required fields.
5. On submission, frontend calls the appropriate `paymentService` method (processCard, processNequi, processPse, processBancolombia).
6. On success, frontend navigates to `/order-confirmed`.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| No order number | Redirect back to `/checkout` |
| API error on load | Error state with retry option |
| Payment declined | Error message with option to retry |
| PSE selected | Additional `GET /payment/pse-banks/` call populates bank dropdown |

---

### order-confirmed-display

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Roles** | shared |
| **Frontend route** | `/order-confirmed` |
| **API endpoints** | None (reads state or URL params) |

**Preconditions:** Payment was processed successfully; order_number is available.

**Steps:**

1. After successful payment, frontend navigates to `/order-confirmed`.
2. Page displays order confirmation: order_number, success message, total paid.
3. Links to `/orders` (view my orders) and `/tracking` (track this order) shown.
4. Cart is cleared at this point.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| No order info in state | Shows generic success message |
| User clicks Track Order | Navigates to `/tracking?order={orderNumber}` |

---

## Reviews Module

### review-submit

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | user |
| **Frontend route** | `/peluches/[slug]` |
| **API endpoints** | `POST /api/peluches/{slug}/reviews/` |

**Preconditions:** User is authenticated. User has a delivered order containing this peluch.

**Steps:**

1. User navigates to `/peluches/[slug]`.
2. Reviews section is visible below product details.
3. Authenticated user sees a **Write a review** form: star rating (1–5) and comment textarea.
4. User selects rating and enters comment.
5. User clicks **Submit**.
6. Frontend sends `POST /api/peluches/{slug}/reviews/` with `{ rating, comment, order_id? }`.
7. Backend validates user has a delivered order for this peluch and creates review (is_approved = false).
8. Success message: "Tu reseña ha sido enviada y está pendiente de aprobación."

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Not authenticated | Review form not shown; prompt to sign in |
| No delivered order | `403` — "Solo puedes reseñar productos que hayas recibido" |
| Review already submitted | `400 { error: "Ya enviaste una reseña para este producto" }` |
| Comment too short | Client-side validation before submission |

---

## Backoffice Module (Extended)

### backoffice-login

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | staff |
| **Frontend route** | `/admin-login` |
| **API endpoints** | `POST /api/sign_in/` |

**Preconditions:** User has a staff account (`is_staff = true`).

**Steps:**

1. User navigates to `/admin-login`.
2. Page renders email and password form.
3. User enters credentials and clicks **Sign in**.
4. Frontend sends `POST /api/sign_in/` → backend returns tokens.
5. Frontend stores tokens and redirects to `/backoffice`.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Invalid credentials | `401` error shown below form |
| Valid but non-staff user | Redirects to `/backoffice`, which then shows 403 on data fetch |

---

### backoffice-dashboard-display

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | staff |
| **Frontend route** | `/backoffice` |
| **API endpoints** | `GET /api/analytics/dashboard/`, `GET /api/orders/list/`, `GET /api/users/` |

**Preconditions:** User is authenticated with `is_staff = true`.

**Steps:**

1. User navigates to `/backoffice`.
2. `useRequireAuth()` validates token.
3. Frontend fetches analytics dashboard data.
4. Dashboard renders KPI widgets: total orders, revenue, top peluches, device types, traffic sources.
5. Admin sidebar allows navigation to orders, peluches, categories, and users sections.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| Not staff | `403` — "Make sure you are signed in with a staff user." |
| Not authenticated | Redirect to `/sign-in` |

---

### backoffice-order-management

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Roles** | staff |
| **Frontend route** | `/backoffice/pedidos` |
| **API endpoints** | `GET /api/orders/list/`, `PATCH /api/orders/{number}/status/`, `PATCH /api/orders/{number}/tracking/` |

**Preconditions:** User is authenticated with `is_staff = true`.

**Steps:**

1. User navigates to `/backoffice/pedidos`.
2. Frontend fetches `GET /api/orders/list/` (with optional status/city filters).
3. Orders render in a table: order_number, customer_name, status badge, total_amount, created_at.
4. Staff clicks a status dropdown on a row → `PATCH /api/orders/{number}/status/` updates the status.
5. Staff enters a tracking number → `PATCH /api/orders/{number}/tracking/` saves carrier + guide.

**Branching conditions:**

| Condition | Behavior |
|-----------|----------|
| No orders | "No data" empty row |
| Status update fails | Error toast |

---

### backoffice-peluch-list

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Roles** | staff |
| **Frontend route** | `/backoffice/peluches` |
| **API endpoints** | `GET /api/peluches/` |

**Steps:**

1. User navigates to `/backoffice/peluches`.
2. Frontend fetches all peluches via `peluchAdminService.listAll()`.
3. Table shows: title, category, is_active, is_featured, display_order.
4. **Nuevo** button links to `/backoffice/peluches/nuevo`.
5. Clicking a row links to `/backoffice/peluches/[slug]`.

---

### backoffice-peluch-create

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Roles** | staff |
| **Frontend route** | `/backoffice/peluches/nuevo` |
| **API endpoints** | `POST /api/peluches/`, `POST /api/peluches/{slug}/color-image/{color}/`, `POST /api/peluches/{slug}/gallery/` |

**Steps:**

1. Staff navigates to `/backoffice/peluches/nuevo`.
2. `PeluchForm` renders all fields: title, slug, category, lead_description, description (JSON), specifications (JSON), size_prices, available_colors, personalization toggles, etc.
3. Staff fills form and clicks **Guardar**.
4. Frontend sends `POST /api/peluches/` → peluch created.
5. Staff may upload gallery images and color images in subsequent steps.
6. On success, redirect to `/backoffice/peluches`.

---

### backoffice-peluch-edit

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Roles** | staff |
| **Frontend route** | `/backoffice/peluches/[slug]` |
| **API endpoints** | `GET /api/peluches/{slug}/`, `PATCH /api/peluches/{slug}/`, gallery/color-image endpoints |

**Steps:**

1. Staff navigates to `/backoffice/peluches/[slug]`.
2. Page fetches existing peluch data and pre-fills `PeluchForm`.
3. Staff edits fields and clicks **Guardar**.
4. Frontend sends `PATCH /api/peluches/{slug}/` with changed fields.
5. Staff can upload/delete gallery images and color-specific images.

---

### backoffice-category-management

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Roles** | staff |
| **Frontend route** | `/backoffice/categorias` |
| **API endpoints** | `POST /api/categories/`, `PATCH /api/categories/{id}/`, `DELETE /api/categories/{id}/` |

**Steps:**

1. Staff navigates to `/backoffice/categorias`.
2. Frontend fetches `GET /api/categories/` and renders categories in a table.
3. **Create:** Staff fills name/slug/description and clicks **Crear** → `POST /api/categories/`.
4. **Edit:** Staff changes fields inline and confirms → `PATCH /api/categories/{id}/`.
5. **Delete:** Staff clicks delete icon and confirms → `DELETE /api/categories/{id}/`.

---

### backoffice-user-management

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Roles** | staff |
| **Frontend route** | `/backoffice/usuarios` |
| **API endpoints** | `GET /api/users/`, `PATCH /api/users/{id}/` |

**Steps:**

1. Staff navigates to `/backoffice/usuarios`.
2. Frontend fetches `GET /api/users/` and renders users table: email, role, is_staff, is_active.
3. Staff updates a user's role, is_staff, or is_active via inline controls → `PATCH /api/users/{id}/`.

---

## Public Module (Extended)

### contact-page-display

| Field | Value |
|-------|-------|
| **Priority** | P4 |
| **Roles** | shared |
| **Frontend route** | `/contact` |
| **API endpoints** | `GET /api/content/contact_info/` (optional) |

**Steps:**

1. User navigates to `/contact`.
2. Page renders contact information or a contact form.
3. Content may be loaded from `contentService.get('contact_info')`.

---

### about-page-display

| Field | Value |
|-------|-------|
| **Priority** | P4 |
| **Roles** | shared |
| **Frontend route** | `/about` |
| **API endpoints** | `GET /api/content/history/` (optional) |

**Steps:**

1. User navigates to `/about`.
2. Page renders brand history, artisan story, and values.
3. Content may be loaded from `contentService.get('history')`.

---

### terms-page-display

| Field | Value |
|-------|-------|
| **Priority** | P4 |
| **Roles** | shared |
| **Frontend route** | `/terms` |
| **API endpoints** | `GET /api/content/terms/` (optional) |

**Steps:**

1. User navigates to `/terms`.
2. Page renders terms and conditions content.
3. Content may be loaded from `contentService.get('terms')`.

---

## Cross-Reference

| Artifact | Path | Purpose |
|----------|------|---------|
| Flow Definitions (JSON) | `e2e/flow-definitions.json` | Machine-readable flow registry for the E2E reporter |
| Flow Tag Constants | `e2e/helpers/flow-tags.ts` | Reusable tag arrays for Playwright tests |
| E2E Spec Files | `e2e/<module>/*.spec.ts` | Playwright test implementations per module |
| Flow Coverage Report | `e2e-results/flow-coverage.json` | Auto-generated coverage status per flow |
| Architecture Standard | `docs/DJANGO_REACT_ARCHITECTURE_STANDARD.md` | Sections 3.7.5–3.7.10 define the flow methodology |
| E2E Flow Coverage Standard | `docs/E2E_FLOW_COVERAGE_REPORT_STANDARD.md` | Reporter implementation and JSON schema |

### Maintenance Rules

- **Adding a new flow:** Add entry here with full steps/branches, then add to `e2e/flow-definitions.json`, then create E2E tests.
- **Modifying a flow:** Update steps and branches in this document first, then update tests accordingly.
- **Removing a flow:** Remove from this document, `e2e/flow-definitions.json`, and all `@flow:` tags in specs.
- **Bump `Version` and `Last Updated`** on every change.
