# Microservices Demo (ShopSwift)

A full-stack microservices e-commerce demo built with Node.js services, a Next.js frontend, and a message-driven workflow via RabbitMQ. It includes authentication, product catalog, cart, checkout/orders, and email notifications.

## Architecture overview

Services communicate over HTTP and publish order events to RabbitMQ for async processing (catalog stock updates, cart clearing, and email notifications).

- **Frontend** (Next.js app router)
- **Auth Service** (Postgres)
- **Catalog Service** (MongoDB)
- **Cart Service** (Redis)
- **Checkout Service** (Postgres + Stripe)
- **Email Service** (SMTP + RabbitMQ)
- **RabbitMQ** (event bus)
- **Postgres / MongoDB / Redis** (datastores)

## Quick start (Docker Compose)

1. Create or update the root `.env` file (see [Environment variables](#environment-variables)).
2. Build and start everything:

```bash
docker compose up --build
```

3. Open the app:

- Frontend: http://localhost:3000
- RabbitMQ UI: http://localhost:15672 (guest/guest)

## Services and ports

| Service          |  Port | Purpose              |
| ---------------- | ----: | -------------------- |
| frontend         |  3000 | Next.js UI           |
| auth-service     |  3001 | User auth + JWT      |
| catalog-service  |  3002 | Products catalog     |
| cart-service     |  3003 | Cart state           |
| checkout-service |  3004 | Orders + payments    |
| email-service    |   n/a | Order email consumer |
| rabbitmq         |  5672 | AMQP                 |
| rabbitmq-ui      | 15672 | Management UI        |
| postgres         |  5432 | Auth + Orders DB     |
| mongodb          | 27017 | Catalog DB           |
| redis            |  6379 | Cart cache           |

## Environment variables

Root `.env` is used by Docker Compose. These values are required for Stripe and email delivery. Example:

```dotenv
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
RECEIVER_EMAIL=you@example.com
```

Docker Compose also injects these defaults into containers:

- `POSTGRES_USER=admin`
- `POSTGRES_PASSWORD=password`
- `POSTGRES_DB=shopping_site`
- `POSTGRES_HOST=postgres`
- `MONGO_URI=mongodb://mongodb:27017/shopping_site`
- `REDIS_URL=redis://redis:6379`
- `RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672`
- `JWT_SECRET=supersecretjwtkey`
- `SMTP_HOST` defaults to `smtp.gmail.com`
- `SMTP_PORT` defaults to `587`

## Service APIs

### Auth Service (http://localhost:3001)

- `GET /health`
- `POST /auth/register` — body: `{ email, password, role? }`
- `POST /auth/login` — body: `{ email, password }`
- `GET /auth/verify` — requires `Authorization: Bearer <token>`

### Catalog Service (http://localhost:3002)

- `GET /health`
- `GET /products`
- `GET /products/:id`
- `POST /products` — admin only, requires `x-user-role: admin`
- `PUT /products/:id/stock` — admin only, requires `x-user-role: admin`
- `POST /products/seed` — seed sample products

### Cart Service (http://localhost:3003)

All cart endpoints require `x-user-id` header.

- `GET /health`
- `GET /cart`
- `POST /cart/items` — body: `{ productId, name, price, quantity, imageUrl }`
- `DELETE /cart/items/:productId`
- `DELETE /cart` — clear cart

### Checkout Service (http://localhost:3004)

User routes require `x-user-id` header. Admin routes require `x-user-role: admin`.

- `GET /health`
- `POST /checkout` — body: `{ items, total, deliveryDetails, paymentMethod, email }`
- `GET /orders` — user orders
- `PUT /orders/:id/cancel`
- `GET /admin/orders` — admin only
- `PUT /admin/orders/:id/status` — body: `{ status }`

### Email Service

Consumes RabbitMQ events from `shopping_exchange` with routing key `order.placed` and sends email via SMTP. If SMTP credentials are missing, it falls back to a simulation log.

## Frontend notes

The frontend uses Axios and injects auth headers for API calls:

- `Authorization: Bearer <token>`
- `x-user-id` and `x-user-role` from `localStorage`

API endpoints are hardcoded to `http://localhost:3001-3004` in [frontend/src/lib/api.js](frontend/src/lib/api.js).

## Local development (no Docker)

You can run services locally, but you must provide your own Postgres, MongoDB, Redis, and RabbitMQ instances.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend services

Each service is a simple Express app with a `Dockerfile` and `index.js`. For local dev:

```bash
cd auth-service
npm install
node index.js
```

Repeat for `catalog-service`, `cart-service`, `checkout-service`, and `email-service`.

## Data initialization

- Auth Service creates the `users` table on startup.
- Checkout Service creates the `orders` table on startup.
- Catalog Service can seed products via `POST /products/seed`.

## Event flow

1. Checkout creates an order and publishes `order.placed`.
2. Catalog Service reduces product stock.
3. Cart Service clears the user cart.
4. Email Service sends an order confirmation.

## Troubleshooting

- **Stripe errors**: ensure `STRIPE_SECRET_KEY` is set. If not, the checkout service will warn and Stripe payments will fail.
- **Email not sending**: set `SMTP_USER` and `SMTP_PASS`. Without them, email is simulated.
- **Auth headers missing**: cart and checkout routes require `x-user-id`.

## Project structure

```
.
├── auth-service/
├── cart-service/
├── catalog-service/
├── checkout-service/
├── email-service/
├── frontend/
└── docker-compose.yml
```
