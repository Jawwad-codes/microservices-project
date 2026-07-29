# 🚀 ShopFlow — Cloud-Native Microservices Platform on AWS EKS

> A production-inspired e-commerce microservices platform deployed on **Amazon EKS**, provisioned with **Terraform**, and delivered through **CloudFront**, **NGINX Ingress**, and **GitHub Actions CI/CD**.

![AWS](https://img.shields.io/badge/AWS-EKS-orange?logo=amazonaws)
![Terraform](https://img.shields.io/badge/Terraform-IaC-623CE4?logo=terraform)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestration-326CE5?logo=kubernetes)
![Docker](https://img.shields.io/badge/Docker-Containers-2496ED?logo=docker)
![GitHub Actions](https://img.shields.io/badge/GitHub-Actions-2088FF?logo=githubactions)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-RDS-336791?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![cert--manager](https://img.shields.io/badge/cert--manager-Let's%20Encrypt-2fa4e7)

**Live domains:** `jawwad.online` (frontend) · `api.jawwad.online` (API gateway)

---

## 📌 Overview

ShopFlow is a database-per-service e-commerce backend running on Amazon EKS, paired with a React frontend served from S3 through CloudFront. Six independent services communicate over HTTP behind an API Gateway, each owning its own PostgreSQL database on a single shared Amazon RDS instance. TLS is issued automatically by cert-manager using Let's Encrypt, and the entire cloud footprint — networking, compute, database, CDN, and registry — is defined as code in Terraform.

---

## 🏗 System Architecture

![AWS Architecture](./microservices-architecture.png)

```text
Browser ──► jawwad.online ──► CloudFront (ACM SSL) ──► S3 (private, OAC-only)

Browser ──► api.jawwad.online ──► AWS Load Balancer ──► NGINX Ingress ──► API Gateway
                                                                              │
                     ┌───────────────┬───────────────┬───────────────┬───────┴────────────┐
                     ▼               ▼               ▼               ▼                    ▼
              user-service    product-service   order-service   payment-service   notification-service
                     │               │               │               │                    │
                     └───────────────┴───────┬───────┴───────────────┴────────────────────┘
                                              ▼
                                   Amazon RDS PostgreSQL
                          (user_db · product_db · order_db · payment_db · notification_db)
```

`order-service` orchestrates checkout server-to-server, bypassing the gateway:
```
order-service → product-service    (validate + decrement stock)
order-service → payment-service    (process payment)
order-service → notification-service (send confirmation email)
```

---

## ✨ Features

- ✅ Infrastructure as Code with Terraform (11 modules, see below)
- ✅ Amazon EKS with managed node group, coredns / kube-proxy / vpc-cni add-ons
- ✅ Database-per-service on a single Amazon RDS PostgreSQL instance
- ✅ Prisma ORM with per-service migrations
- ✅ NGINX Ingress Controller + AWS Load Balancer
- ✅ Automatic TLS via cert-manager + Let's Encrypt (HTTP-01 challenge)
- ✅ Frontend on S3 + CloudFront with Origin Access Control (no public bucket)
- ✅ Amazon ECR image registry with lifecycle policy
- ✅ GitHub Actions CI/CD — build, scan, push, migrate, deploy
- ✅ Kubernetes Secrets & ConfigMaps per service
- ✅ Fully private RDS and worker nodes (no public subnet exposure)

---

## ☁ AWS Infrastructure (Terraform modules)

| Module | Resources |
|---|---|
| `vpc` | VPC, public/private subnets, IGW, NAT Gateway + EIP, route tables & associations |
| `iam` | EKS cluster role, EKS node role, policy attachments (CNI, ECR, SSM, worker node) |
| `eks` | EKS cluster, managed node group, coredns / kube-proxy / vpc-cni add-ons |
| `eks_cluster_sg` / `eks_node_sg` | Security groups for control plane and worker nodes |
| `rds` | PostgreSQL instance, DB subnet group (private subnets only) |
| `rds_sg` | Security group — inbound 5432 restricted to EKS node security group |
| `alb_sgs` | Security group for the load balancer fronting NGINX Ingress |
| `s3` | Frontend bucket, versioning, SSE encryption, public access block |
| `cloudfront` | Distribution, Origin Access Control, S3 bucket policy, IAM policy document |
| `ecr` | Container registry per service, lifecycle policy |

Full dependency graph: [`terraform-graph.dot`](./terraform-graph.dot)

---

## 📂 Project Structure

```
microservices-project
│
├── frontend/                     React 18 + Vite + Tailwind CSS
│
├── Services/
│   ├── api-gateway/               Express + http-proxy-middleware
│   ├── user-service/               Express + Prisma + bcryptjs + JWT
│   ├── product-service/            Express + Prisma + Zod
│   ├── order-service/              Express + Prisma + Axios + Zod
│   ├── payment-service/            Express + Prisma + Zod
│   └── notification-service/       Express + Prisma
│
├── terraform/
│   ├── modules/                   vpc, iam, eks, rds, s3, cloudfront, ecr, security groups
│   └── environments/
│       └── dev/
│
├── k8s/
│   ├── ingress/                   api-gateway-ingress + cert-manager ClusterIssuer
│   ├── namespace/
│   ├── jobs/                      Prisma migration jobs
│   ├── configmaps/
│   ├── user-service/
│   ├── product-service/
│   ├── order-service/
│   ├── payment-service/
│   └── notification-service/
│
└── .github/
    └── workflows/
```

---

## 🛠 Technology Stack

| Category | Technologies |
|---|---|
| Cloud | AWS (EKS, RDS, S3, CloudFront, ALB/NLB, ECR, IAM, VPC) |
| IaC | Terraform |
| Containers | Docker |
| Orchestration | Kubernetes (Amazon EKS) |
| Ingress / TLS | NGINX Ingress Controller, cert-manager, Let's Encrypt |
| CI/CD | GitHub Actions |
| Database | PostgreSQL (Amazon RDS) |
| ORM | Prisma |
| Backend | Node.js 20 + Express |
| Frontend | React 18 + Vite + Tailwind CSS |
| CDN | CloudFront |
| DNS | Hostinger (CNAME → CloudFront / ALB) |

---

## ☸ Services & Databases

Every service owns an isolated PostgreSQL database — no shared tables, no cross-database joins. Services only talk to each other over HTTP.

| Service | Port | Database | Notes |
|---|---|---|---|
| api-gateway | 8080 | — | Thin reverse proxy, no body parsing |
| user-service | 4001 | `user_db` | bcryptjs + JWT auth |
| product-service | 4002 | `product_db` | Zod validation |
| order-service | 4003 | `order_db` | Orchestrates payment + stock + notification |
| payment-service | 4004 | `payment_db` | Card / JazzCash / COD, toggleable via env |
| notification-service | 4005 | `notification_db` | Console-log mode or SMTP |
| frontend | 3000 | — | React + Vite + Tailwind |

### Order status lifecycle

```
pending → paid → (cancelled)
        ↘ payment_failed
        ↘ paid_stock_update_failed   (paid but stock sync failed — needs reconciliation)
```

- Only `pending`, `paid`, and `paid_stock_update_failed` orders can be cancelled
- Only `pending`, `payment_failed`, and `cancelled` orders can be hard-deleted
- Cancelling a `paid` order restores stock automatically
- Deleting an order also deletes its payment record from `payment_db`

---

## 🔄 CI/CD Pipeline (GitHub Actions)

```text
Push to main
    │
    ▼
Build & test
    │
    ▼
Trivy vulnerability scan
    │
    ▼
Push image → Amazon ECR
    │
    ▼
Run Prisma migration Job on EKS
    │
    ▼
kubectl apply — ConfigMaps, Secrets, Deployments
    │
    ▼
Rolling update (zero downtime)
```

---

## 🔐 Security & Networking

- **Private RDS** — no public accessibility, single security group (`rds-sg`) allowing inbound `5432` only from the EKS node security group
- **Private worker nodes** — EKS node group lives in private subnets, egress via NAT Gateway
- **Private S3 bucket** — public access fully blocked; CloudFront reaches it only via Origin Access Control (OAC) and a scoped bucket policy
- **HTTPS end-to-end** — CloudFront terminates TLS via ACM for the frontend; cert-manager + Let's Encrypt issues TLS for `api.jawwad.online` via HTTP-01 challenge on the NGINX Ingress
- **Kubernetes Secrets** — per-service `DATABASE_URL` and `JWT_SECRET`, never committed to source control
- **IAM least privilege** — separate roles for the EKS cluster and node group, scoped policy attachments (CNI, ECR pull, SSM, worker node policy)

---

## 🚀 Deployment

### 1. Provision infrastructure

```bash
cd terraform/environments/dev
terraform init
terraform fmt
terraform plan
terraform apply
```

### 2. Point DNS (Hostinger)

| Record | Type | Target |
|---|---|---|
| `@` / `www` | CNAME / ALIAS | CloudFront distribution domain |
| `api` | CNAME | AWS Load Balancer hostname (`kubectl get svc -n ingress-nginx`) |

### 3. Deploy the Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/aws/deploy.yaml
```

### 4. Install cert-manager and issue TLS

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.1/cert-manager.yaml
kubectl apply -f k8s/ingress/cluster-issuer.yaml
```

### 5. Deploy application resources

```bash
kubectl apply -f k8s/namespace/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/jobs/          # Prisma migrations
kubectl apply -f k8s/
```

### 6. Verify

```bash
curl https://api.jawwad.online/health/all
```

Expected response:
```json
{"status":"ok","service":"api-gateway","services":{"user-service":"up","product-service":"up","order-service":"up","payment-service":"up","notification-service":"up"}}
```

---

## 🧪 Local Development

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL running locally on port `5432`
- A PostgreSQL user with permission to create databases (default: `postgres`)

### Create databases

```bash
psql -U postgres -h localhost -c "CREATE DATABASE user_db;"
psql -U postgres -h localhost -c "CREATE DATABASE product_db;"
psql -U postgres -h localhost -c "CREATE DATABASE order_db;"
psql -U postgres -h localhost -c "CREATE DATABASE payment_db;"
psql -U postgres -h localhost -c "CREATE DATABASE notification_db;"
```

### Environment variables

Each service reads its own `.env`. `JWT_SECRET` must be identical across `user-service`, `product-service`, and `order-service`.

```env
# Services/user-service/.env
PORT=4001
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/user_db?schema=public"
JWT_SECRET=your_shared_jwt_secret_change_me
```

> Passwords containing `$`, `#`, `@`, or other reserved characters must be URL-encoded in `DATABASE_URL` (e.g. `$` → `%24`), and quoted in shells that treat `$` as a variable expansion.

### Install & migrate

```bash
cd Services/user-service && npm install && npx prisma migrate deploy --schema=./src/prisma/schema.prisma && cd ../..
cd Services/product-service && npm install && npx prisma migrate deploy --schema=./src/prisma/schema.prisma && cd ../..
cd Services/order-service && npm install && npx prisma migrate deploy --schema=./src/prisma/schema.prisma && cd ../..
cd Services/payment-service && npm install && npx prisma generate --schema=./src/prisma/schema.prisma && npx prisma migrate deploy --schema=./src/prisma/schema.prisma && cd ../..
cd Services/notification-service && npm install && npx prisma generate --schema=./src/prisma/schema.prisma && npx prisma migrate deploy --schema=./src/prisma/schema.prisma && cd ../..
cd Services/api-gateway && npm install && cd ../..
cd frontend && npm install && cd ..
```

### Run everything (7 terminals, or use `pm2`)

```bash
cd Services/user-service && npm run dev
cd Services/product-service && npm run dev
cd Services/order-service && npm run dev
cd Services/payment-service && npm run dev
cd Services/notification-service && npm run dev
cd Services/api-gateway && npm run dev      # start after services 1–5
cd frontend && npm run dev
```

Open **http://localhost:3000**.

---

## 📖 API Reference

### User Service (`/api/auth`, `/api/users`)

| Method | Path | Auth | Description |
|---|---|:---:|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/users/:id` | No | Get user profile |

### Product Service (`/api/products`)

| Method | Path | Auth | Description |
|---|---|:---:|---|
| GET | `/api/products` | No | List all products |
| GET | `/api/products/:id` | No | Get product by ID |
| POST | `/api/products` | Yes | Create product |
| PUT | `/api/products/:id` | Yes | Update product |
| DELETE | `/api/products/:id` | Yes | Delete product |
| PATCH | `/api/products/:id/stock` | Internal | Adjust stock |

### Order Service (`/api/orders`)

| Method | Path | Auth | Description |
|---|---|:---:|---|
| GET | `/api/orders` | Yes | List my orders |
| POST | `/api/orders` | Yes | Create order (calls product + payment + notification) |
| GET | `/api/orders/:id` | Yes | Get single order |
| PATCH | `/api/orders/:id` | Yes | Cancel order |
| DELETE | `/api/orders/:id` | Yes | Delete order + payment record |

### Payment Service (`/api/payments`)

| Method | Path | Auth | Description |
|---|---|:---:|---|
| POST | `/api/payments/pay` | Internal | Process payment |
| GET | `/api/payments/payments` | No | List all payments |
| GET | `/api/payments/payments/methods` | No | List enabled payment methods |
| GET | `/api/payments/payments/order/:orderId` | No | Get payment by order ID |
| DELETE | `/api/payments/payments/order/:orderId` | Internal | Delete payment |

### Notification Service (`/api/notifications`)

| Method | Path | Auth | Description |
|---|---|:---:|---|
| POST | `/api/notifications/notify` | Internal | Send and store notification |
| GET | `/api/notifications/notifications` | No | List all notifications |
| GET | `/api/notifications/notifications/email/:email` | No | Get notifications by email |

---

## 🧪 Testing

Backend tests use Jest + Supertest (Prisma and Axios mocked). Frontend tests use Vitest + React Testing Library.

```bash
cd Services/user-service && npm test
cd Services/product-service && npm test
cd Services/order-service && npm test
cd Services/payment-service && npm test
cd Services/notification-service && npm test
cd frontend && npm test
cd frontend && npm run test:coverage
```

---

## 📈 Future Improvements

- ArgoCD GitOps
- Helm charts
- Prometheus + Grafana + Loki observability stack
- Distributed tracing
- AWS WAF in front of CloudFront and the ALB
- Horizontal Pod Autoscaler / KEDA
- Multi-AZ RDS with automated failover
- Istio service mesh

---

## 👨‍💻 Author

**Jawwad Nadeem**
Software Engineering Student · Aspiring DevOps & Cloud Engineer

AWS · Kubernetes · Terraform · Docker · GitHub Actions · Node.js

---

⭐ If you found this project useful, please consider giving it a star!