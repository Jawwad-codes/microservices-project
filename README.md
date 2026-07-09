<!-- @format -->

# ShopFlow — E-Commerce Microservices Platform

A full-stack e-commerce platform built with a microservices architecture. Each service is independent with its own database, connected through an API Gateway. The frontend is a production-quality React + Vite + Tailwind CSS app.

```
Service                  Port    Database        Location
─────────────────────────────────────────────────────────────────
api-gateway              4000    —               Services/api-gateway
user-service             4001    user_db         Services/user-service
product-service          4002    product_db      Services/product-service
order-service            4003    order_db        Services/order-service
payment-service          4004    —               Services/payment-service
notification-service     4005    —               Services/notification-service
frontend (React/Vite)    3000    —               frontend/
```

```
Browser (React frontend, :3000)
        │
        ▼
  API Gateway (:4000)
   ├── /api/auth/*      → user-service (:4001)
   ├── /api/users/*     → user-service (:4001)
   ├── /api/products/*  → product-service (:4002)
   ├── /api/orders/*    → order-service (:4003)
   └── /api/payments/*  → payment-service (:4004)

order-service calls product-service, payment-service and
notification-service directly (server-to-server, bypasses gateway).
```

---

## Prerequisites

- **Node.js 20+** and npm
- **PostgreSQL** running locally (default: `postgres` / `postgres` @ `localhost:5432`)

---

## 1. Create Databases

```bash
psql -U postgres -h localhost -c "CREATE DATABASE user_db;"
psql -U postgres -h localhost -c "CREATE DATABASE product_db;"
psql -U postgres -h localhost -c "CREATE DATABASE order_db;"
```

---

## 2. Install & Migrate All Services

```bash
# Services with databases — install + migrate
cd Services/user-service && npm install && npm run prisma:migrate && cd ../..
cd Services/product-service && npm install && npm run prisma:migrate && cd ../..
cd Services/order-service && npm install && npm run prisma:migrate && cd ../..

# Services without databases — install only
cd Services/payment-service && npm install && cd ../..
cd Services/notification-service && npm install && cd ../..
cd Services/api-gateway && npm install && cd ../..

# React frontend
cd frontend && npm install && cd ..
```

---

## 3. Configure Environment Variables

Each service has a `.env` file pre-configured. The important shared value is `JWT_SECRET` — it **must be identical** across `user-service`, `product-service`, and `order-service`.

| Service              | Key variables                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| user-service         | `DATABASE_URL`, `JWT_SECRET`, `PORT=4001`                                                                           |
| product-service      | `DATABASE_URL`, `JWT_SECRET`, `PORT=4002`                                                                           |
| order-service        | `DATABASE_URL`, `JWT_SECRET`, `PORT=4003`, `PRODUCT_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `NOTIFICATION_SERVICE_URL` |
| api-gateway          | `PORT=4000`, all `*_SERVICE_URL` vars                                                                               |
| payment-service      | `PORT=4004`                                                                                                         |
| notification-service | `PORT=4005`                                                                                                         |

---

## 4. Run Everything (7 terminals)

```bash
# Terminal 1
cd Services/user-service && npm run dev

# Terminal 2
cd Services/product-service && npm run dev

# Terminal 3
cd Services/order-service && npm run dev

# Terminal 4
cd Services/payment-service && npm run dev

# Terminal 5
cd Services/notification-service && npm run dev

# Terminal 6 — start AFTER the 5 services above are running
cd Services/api-gateway && npm run dev

# Terminal 7 — React frontend
cd frontend && npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 5. Frontend Pages

| Page      | Route       | Description                                               |
| --------- | ----------- | --------------------------------------------------------- |
| Dashboard | `/`         | Overview of products, orders, service health              |
| Auth      | `/auth`     | Register / Sign in                                        |
| Products  | `/products` | Browse catalog, add products (auth required to add)       |
| Orders    | `/orders`   | Order history, place new order (auth required)            |
| Profile   | `/profile`  | Account info, stats, session token                        |
| Services  | `/services` | Real-time health of all 6 services + request flow diagram |

---

## 6. Full Flow

1. **Register** a user at `/auth`, then **Sign in** — JWT stored in localStorage
2. **Add a product** at `/products` (requires auth)
3. **Place an order** at `/orders` — order-service internally calls product → payment → notification
4. **Order history** shows live status: `pending` → `paid` / `payment_failed`

---

## 7. Run Tests

```bash
cd Services/user-service && npm test
cd Services/product-service && npm test
cd Services/order-service && npm test
cd Services/payment-service && npm test
cd Services/notification-service && npm test
```

---

## 8. Architecture Notes

- **Database-per-service**: `user_db`, `product_db`, `order_db` are separate PostgreSQL databases
- **API Gateway**: thin reverse proxy — no body parsing, just forwards headers including `Authorization`
- **Order-service as orchestrator**: calls product → payment → notification in sequence, server-to-server
- **JWT**: shared `JWT_SECRET` across user, product, order services
- **Notification & Payment**: intentional stubs (console log + fake success) for future Stripe/SMTP integration
- **Frontend**: React 18 + Vite + Tailwind CSS — full SPA with React Router, real-time health polling, localStorage auth persistence
