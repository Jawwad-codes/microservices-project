<!-- @format -->

# ShopFlow — E-Commerce Microservices Platform

A full-stack e-commerce platform built with a microservices architecture. Every service is fully independent with its **own dedicated PostgreSQL database**, connected through an API Gateway. The frontend is a production-quality React + Vite + Tailwind CSS application.

---

## Architecture Overview

```
Browser (React frontend, :3000)
        │
        ▼
  API Gateway (:8080)
   ├── /api/auth/*            → user-service        (:4001)
   ├── /api/users/*           → user-service        (:4001)
   ├── /api/products/*        → product-service     (:4002)
   ├── /api/orders/*          → order-service       (:4003)
   ├── /api/payments/*        → payment-service     (:4004)
   └── /api/notifications/*   → notification-service(:4005)

order-service orchestrates internally (server-to-server, bypasses gateway):
  order-service → product-service   (validate stock, decrement stock)
  order-service → payment-service   (process payment)
  order-service → notification-service (send confirmation email)
```

---

## Services & Databases

Every service has its own isolated PostgreSQL database. No service shares a database with another.

```
Service                  Port   Database              Tech
────────────────────────────────────────────────────────────────────────
api-gateway              8080   —                     Express + http-proxy-middleware
user-service             4001   user_db               Express + Prisma + bcryptjs + JWT
product-service          4002   product_db            Express + Prisma + Zod
order-service            4003   order_db              Express + Prisma + Axios + Zod
payment-service          4004   payment_db            Express + Prisma + Zod
notification-service     4005   notification_db       Express + Prisma
frontend                 3000   —                     React 18 + Vite + Tailwind CSS
```

---

## Prerequisites

- **Node.js 20+** and npm
- **PostgreSQL** running locally on port `5432`
- A PostgreSQL user with permission to create databases (default: `postgres`)

---

## Step 1 — Create Databases

Each service needs its own database. Create all five:

```sql
CREATE DATABASE user_db;
CREATE DATABASE product_db;
CREATE DATABASE order_db;
CREATE DATABASE payment_db;
CREATE DATABASE notification_db;
```

Using `psql`:

```bash
psql -U postgres -h localhost -c "CREATE DATABASE user_db;"
psql -U postgres -h localhost -c "CREATE DATABASE product_db;"
psql -U postgres -h localhost -c "CREATE DATABASE order_db;"
psql -U postgres -h localhost -c "CREATE DATABASE payment_db;"
psql -U postgres -h localhost -c "CREATE DATABASE notification_db;"
```

Or use **pgAdmin** — right-click Databases → Create → Database.

---

## Step 2 — Environment Variables

Each service has a `.env` file. Copy from `.env.example` if needed and fill in your values.

### user-service — `Services/user-service/.env`

```env
PORT=4001
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/user_db?schema=public"
JWT_SECRET=your_shared_jwt_secret_change_me
```

### product-service — `Services/product-service/.env`

```env
PORT=4002
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/product_db?schema=public"
JWT_SECRET=your_shared_jwt_secret_change_me
```

### order-service — `Services/order-service/.env`

```env
PORT=4003
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/order_db?schema=public"
JWT_SECRET=your_shared_jwt_secret_change_me
PRODUCT_SERVICE_URL=http://localhost:4002
PAYMENT_SERVICE_URL=http://localhost:4004
NOTIFICATION_SERVICE_URL=http://localhost:4005
```

### payment-service — `Services/payment-service/.env`

```env
PORT=4004
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/payment_db?schema=public"

# Toggle payment methods (set to "false" to disable)
ENABLE_CARD=true
ENABLE_JAZZCASH=true
ENABLE_COD=true
```

### notification-service — `Services/notification-service/.env`

```env
PORT=4005
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/notification_db?schema=public"

# Optional SMTP (leave blank to use console-log mode)
# MAIL_HOST=smtp.example.com
# MAIL_PORT=587
# MAIL_USER=your_email@example.com
# MAIL_PASS=your_password
# MAIL_FROM="ShopFlow <no-reply@shopflow.com>"
```

### api-gateway — `Services/api-gateway/.env`

```env
PORT=8080
USER_SERVICE_URL=http://localhost:4001
PRODUCT_SERVICE_URL=http://localhost:4002
ORDER_SERVICE_URL=http://localhost:4003
PAYMENT_SERVICE_URL=http://localhost:4004
NOTIFICATION_SERVICE_URL=http://localhost:4005
```

### frontend — `frontend/.env`

```env
VITE_GATEWAY_URL=http://localhost:8080
```

> **Important:** `JWT_SECRET` must be **identical** across `user-service`, `product-service`, and `order-service` — they all verify the same token.

---

## Step 3 — Install Dependencies & Run Migrations

Run these from the project root:

```bash
# user-service
cd Services/user-service
npm install
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
cd ../..

# product-service
cd Services/product-service
npm install
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
cd ../..

# order-service
cd Services/order-service
npm install
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
cd ../..

# payment-service
cd Services/payment-service
npm install
npx prisma generate --schema=./src/prisma/schema.prisma
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
cd ../..

# notification-service
cd Services/notification-service
npm install
npx prisma generate --schema=./src/prisma/schema.prisma
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
cd ../..

# api-gateway
cd Services/api-gateway
npm install
cd ../..

# frontend
cd frontend
npm install
cd ..
```

---

## Step 4 — Run Everything

Open **7 terminals** (or use a process manager like `pm2`):

```bash
# Terminal 1 — User Service
cd Services/user-service && npm run dev

# Terminal 2 — Product Service
cd Services/product-service && npm run dev

# Terminal 3 — Order Service
cd Services/order-service && npm run dev

# Terminal 4 — Payment Service
cd Services/payment-service && npm run dev

# Terminal 5 — Notification Service
cd Services/notification-service && npm run dev

# Terminal 6 — API Gateway (start AFTER services 1–5 are running)
cd Services/api-gateway && npm run dev

# Terminal 7 — React Frontend
cd frontend && npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Step 5 — Full User Flow

1. **Register** at `/auth` → enter name, email, password
2. **Sign in** → JWT stored in `localStorage`
3. **Add a product** at `/products` (requires auth) → set name, price, stock
4. **Place an order** at `/orders`:
   - Select product + quantity + payment method (Card / JazzCash / COD)
   - order-service checks stock → calls payment-service → decrements stock → sends notification
5. **View payments** at `/payments` — every processed payment is recorded with method and status
6. **View notifications** at `/notifications` — every email (order confirmed, cancelled) stored in DB
7. **Cancel an order** — stock is automatically restored
8. **Delete an order** — payment record is automatically deleted too

---

## Frontend Pages

| Page          | Route            | Auth Required | Description                                       |
| ------------- | ---------------- | :-----------: | ------------------------------------------------- |
| Dashboard     | `/`              |      No       | Stats overview, recent orders, service health     |
| Auth          | `/auth`          |      No       | Register / Sign in                                |
| Products      | `/products`      |   No (read)   | Browse catalog; add, edit, delete products (auth) |
| Orders        | `/orders`        |      Yes      | Order history, place order, cancel, delete        |
| Payments      | `/payments`      |      Yes      | Payment history, enabled methods, total collected |
| Notifications | `/notifications` |      Yes      | Email notifications by type with expandable body  |
| Profile       | `/profile`       |      Yes      | Account info, order stats, sign out               |
| Services      | `/services`      |      No       | Real-time health of all 6 services + request flow |

---

## API Reference

### User Service (via gateway `/api/auth`, `/api/users`)

| Method | Path                 | Auth | Description        |
| ------ | -------------------- | :--: | ------------------ |
| POST   | `/api/auth/register` |  No  | Register new user  |
| POST   | `/api/auth/login`    |  No  | Login, returns JWT |
| GET    | `/api/users/:id`     |  No  | Get user profile   |

### Product Service (via gateway `/api/products`)

| Method | Path                      | Auth | Description             |
| ------ | ------------------------- | :--: | ----------------------- |
| GET    | `/api/products`           |  No  | List all products       |
| GET    | `/api/products/:id`       |  No  | Get product by ID       |
| POST   | `/api/products`           | Yes  | Create product          |
| PUT    | `/api/products/:id`       | Yes  | Update product          |
| DELETE | `/api/products/:id`       | Yes  | Delete product          |
| PATCH  | `/api/products/:id/stock` | No\* | Adjust stock (internal) |

### Order Service (via gateway `/api/orders`)

| Method | Path              | Auth | Description                                |
| ------ | ----------------- | :--: | ------------------------------------------ |
| GET    | `/api/orders`     | Yes  | List my orders                             |
| POST   | `/api/orders`     | Yes  | Create order (calls product+payment+notif) |
| GET    | `/api/orders/:id` | Yes  | Get single order                           |
| PATCH  | `/api/orders/:id` | Yes  | Cancel order (`{ "status": "cancelled" }`) |
| DELETE | `/api/orders/:id` | Yes  | Delete order + payment record              |

### Payment Service (via gateway `/api/payments`)

| Method | Path                                    | Auth | Description                  |
| ------ | --------------------------------------- | :--: | ---------------------------- |
| POST   | `/api/payments/pay`                     | No\* | Process payment (internal)   |
| GET    | `/api/payments/payments`                |  No  | List all payments            |
| GET    | `/api/payments/payments/methods`        |  No  | List enabled payment methods |
| GET    | `/api/payments/payments/order/:orderId` |  No  | Get payment by order ID      |
| DELETE | `/api/payments/payments/order/:orderId` | No\* | Delete payment (internal)    |

### Notification Service (via gateway `/api/notifications`)

| Method | Path                                            | Auth | Description                 |
| ------ | ----------------------------------------------- | :--: | --------------------------- |
| POST   | `/api/notifications/notify`                     | No\* | Send and store notification |
| GET    | `/api/notifications/notifications`              |  No  | List all notifications      |
| GET    | `/api/notifications/notifications/email/:email` |  No  | Get notifications by email  |

> \* Internal routes — called server-to-server by order-service, not from the browser.

---

## Order Status Lifecycle

```
pending → paid → (cancelled)
        ↘ payment_failed
        ↘ paid_stock_update_failed  (paid but stock sync failed — needs reconciliation)
```

- Only `pending`, `paid`, and `paid_stock_update_failed` orders can be cancelled
- Only `pending`, `payment_failed`, and `cancelled` orders can be hard-deleted
- Cancelling a `paid` order restores stock automatically
- Deleting any order also deletes its payment record from `payment_db`

---

## Database Schema

### user_db — User

| Column    | Type     | Notes         |
| --------- | -------- | ------------- |
| id        | String   | UUID, PK      |
| name      | String   |               |
| email     | String   | Unique        |
| password  | String   | bcrypt hashed |
| createdAt | DateTime |               |

### product_db — Product

| Column      | Type     | Notes     |
| ----------- | -------- | --------- |
| id          | String   | UUID, PK  |
| name        | String   |           |
| description | String?  | Optional  |
| price       | Float    |           |
| stock       | Int      | Default 0 |
| createdAt   | DateTime |           |

### order_db — Order

| Column     | Type     | Notes                                  |
| ---------- | -------- | -------------------------------------- |
| id         | String   | UUID, PK                               |
| userId     | String   | References user (no FK — separate DB)  |
| productId  | String   | References product (no FK)             |
| quantity   | Int      |                                        |
| totalPrice | Float    |                                        |
| status     | String   | pending / paid / payment_failed / etc. |
| createdAt  | DateTime |                                        |

### payment_db — Payment

| Column    | Type     | Notes                          |
| --------- | -------- | ------------------------------ |
| id        | String   | UUID, PK                       |
| orderId   | String   | Unique — one payment per order |
| amount    | Float    |                                |
| method    | String   | card / jazzcash / cod          |
| status    | String   | success / failed / refunded    |
| createdAt | DateTime |                                |

### notification_db — Notification

| Column    | Type     | Notes                                                 |
| --------- | -------- | ----------------------------------------------------- |
| id        | String   | UUID, PK                                              |
| email     | String   |                                                       |
| type      | String   | order_confirmation / order_cancelled / payment_failed |
| subject   | String   |                                                       |
| body      | String   | Full rendered email body                              |
| status    | String   | sent / failed                                         |
| createdAt | DateTime |                                                       |

---

## Running Tests

All backend tests use **Jest + Supertest** with Prisma and Axios mocked — no real database or network calls needed.

Frontend tests use **Vitest + React Testing Library** with all API calls mocked.

```bash
# Backend — run from each service directory
cd Services/user-service        && npm test
cd Services/product-service     && npm test
cd Services/order-service       && npm test
cd Services/payment-service     && npm test
cd Services/notification-service && npm test

# Frontend
cd frontend && npm test

# Frontend with coverage
cd frontend && npm run test:coverage
```

### Test Coverage Summary

| Service              | Test File                            | Tests |
| -------------------- | ------------------------------------ | ----- |
| user-service         | tests/user.test.js                   | 12    |
| product-service      | tests/product.test.js                | 16    |
| order-service        | tests/order.test.js                  | 18    |
| payment-service      | tests/payment.test.js                | 15    |
| notification-service | tests/notification.test.js           | 12    |
| frontend — API       | src/tests/api.client.test.js         | 15    |
| frontend — Auth      | src/tests/AuthContext.test.jsx       | 6     |
| frontend — AuthPage  | src/tests/AuthPage.test.jsx          | 6     |
| frontend — Products  | src/tests/ProductsPage.test.jsx      | 11    |
| frontend — Orders    | src/tests/OrdersPage.test.jsx        | 12    |
| frontend — Payments  | src/tests/PaymentsPage.test.jsx      | 6     |
| frontend — Notifs    | src/tests/NotificationsPage.test.jsx | 8     |
| frontend — Dashboard | src/tests/Dashboard.test.jsx         | 7     |

---

## Architecture Notes

- **Database-per-service**: each of the 5 services has its own isolated PostgreSQL database (`user_db`, `product_db`, `order_db`, `payment_db`, `notification_db`). No shared tables, no cross-DB joins — services communicate only via HTTP.
- **API Gateway**: thin reverse proxy (port 8080). No body parsing — it forwards raw requests to avoid interfering with downstream JSON parsing. JWT validation happens inside each service.
- **Order-service as orchestrator**: creates the order record, calls payment-service to charge, decrements stock via product-service, and sends a notification — all synchronously. Failures at each step are handled and reflected in order status.
- **Stock management**: stock is validated before order creation (returns 400 if insufficient). Decremented after successful payment. Restored on cancellation.
- **Payment cascade delete**: deleting an order automatically deletes its payment record via `DELETE /payments/order/:orderId`.
- **JWT**: a single `JWT_SECRET` is shared across user, product, and order services. The gateway forwards the `Authorization` header as-is.
- **Notification persistence**: every notification (order confirmed, cancelled, payment failed) is stored in `notification_db` and visible in the frontend at `/notifications`.
- **Payment methods**: Card, JazzCash, and Cash on Delivery are toggleable via env vars (`ENABLE_CARD`, `ENABLE_JAZZCASH`, `ENABLE_COD`). The frontend reads enabled methods live from the service.
- **SMTP**: notification-service is ready for real email — add `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` to `.env` and uncomment the nodemailer block in `notificationController.js`.
