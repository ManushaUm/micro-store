# Checkout Service 💳

## Overview

The **Checkout Service** handles the complete order processing workflow, including payment processing via Stripe, order persistence, transaction management, and event publication for downstream services like email notifications.

## Purpose

- **Payment Processing**: Secure Stripe payment integration
- **Order Management**: Create, retrieve, and manage orders
- **Transaction Handling**: ACID transactions for consistency
- **Event Publishing**: Publish order events to message queue
- **Order Validation**: Verify order details before processing
- **Audit Trail**: Log all financial transactions

## Architecture

```
Frontend (Checkout)
        │
        ▼
┌──────────────────────┐
│ Checkout Service     │
│ (Node/Express)       │
│    :3004             │
└────────┬─────────────┘
         │
    ┌────┴─────────┐
    │              │
    ▼              ▼
[PostgreSQL]  [Stripe API]
(Orders)      (Payments)
    │              │
    └────┬─────────┘
         │
         ▼
  [RabbitMQ Events]
  (order.placed)
         │
         ▼
  [Email Service]
```

## Deployment Information

### Port

- **Container Port**: 3004
- **Service Port**: 3004 (Kubernetes ClusterIP)
- **Health Endpoint**: `/health`

### Docker Image

- **Registry**: Azure Container Registry (ACR)
- **Image**: `microstoreacr2026.azurecr.io/manushau/checkout-service`
- **Tag**: Latest (overridden by CI/CD with commit SHA)

## API Endpoints

### Process Payment

```http
POST /checkout/process

Headers:
  Authorization: Bearer jwt_token
  Content-Type: application/json

Body:
{
  "userId": "user-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 1,
      "price": 999.99
    }
  ],
  "totalAmount": 999.99,
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "stripeToken": "tok_visa"
}

Response (201):
{
  "orderId": "order-uuid",
  "status": "completed",
  "totalAmount": 999.99,
  "stripeChargeId": "ch_1234567890",
  "createdAt": "2024-01-15T10:30:00Z",
  "message": "Order placed successfully"
}

Response (400):
{
  "error": "Invalid payment method"
}

Response (402):
{
  "error": "Insufficient funds",
  "stripeError": "Your card was declined"
}
```

### Get Order Details

```http
GET /orders/:orderId

Headers:
  Authorization: Bearer jwt_token

Response (200):
{
  "orderId": "order-uuid",
  "userId": "user-uuid",
  "status": "completed",
  "items": [
    {
      "productId": "product-uuid",
      "name": "Laptop",
      "quantity": 1,
      "price": 999.99,
      "subtotal": 999.99
    }
  ],
  "totalAmount": 999.99,
  "shippingAddress": {...},
  "billingAddress": {...},
  "stripeChargeId": "ch_1234567890",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:31:00Z"
}
```

### List User's Orders

```http
GET /orders/user/:userId?page=1&limit=10

Headers:
  Authorization: Bearer jwt_token

Response (200):
{
  "orders": [
    {
      "orderId": "order-uuid",
      "status": "completed",
      "totalAmount": 999.99,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

### Cancel Order

```http
PUT /orders/:orderId/cancel

Headers:
  Authorization: Bearer jwt_token
  Content-Type: application/json

Response (200):
{
  "message": "Order cancelled",
  "orderId": "order-uuid",
  "status": "cancelled",
  "refundAmount": 999.99
}

Response (400):
{
  "error": "Cannot cancel completed order"
}
```

### Get Order Status

```http
GET /orders/:orderId/status

Headers:
  Authorization: Bearer jwt_token

Response (200):
{
  "orderId": "order-uuid",
  "status": "completed",
  "statusHistory": [
    {
      "status": "pending",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "status": "processing",
      "timestamp": "2024-01-15T10:30:05Z"
    },
    {
      "status": "completed",
      "timestamp": "2024-01-15T10:30:10Z"
    }
  ]
}
```

### Health Check

```http
GET /health

Response (200):
{
  "status": "healthy",
  "service": "checkout-service",
  "database": "connected",
  "stripe": "connected"
}
```

## Environment Variables

```env
# Server Configuration
PORT=3004
NODE_ENV=development|production

# Database (PostgreSQL)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=adminuser
POSTGRES_PASSWORD=P@ssw0rd123!
POSTGRES_DB=shopping_site

# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_test_xxxxxx OR sk_live_xxxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxxx OR pk_live_xxxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxx

# Message Queue (RabbitMQ)
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# Authentication
JWT_SECRET=your_jwt_secret_key

# Logging
LOG_LEVEL=debug|info|warn|error

# Orders
ORDER_PREFIX=ORD-  # Order ID prefix
```

## Database Schema (PostgreSQL)

### Orders Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  stripe_charge_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

### Order Items Table

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### Order Status History Table

```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  status VARCHAR(20) NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_order_id ON order_status_history(order_id);
```

### Transactions Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  type VARCHAR(20),  -- 'charge', 'refund'
  amount DECIMAL(10, 2) NOT NULL,
  stripe_transaction_id VARCHAR(255) UNIQUE,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_order_id ON transactions(order_id);
```

## Kubernetes Deployment

### Helm Values

```yaml
checkout-service:
  enabled: true
  useRegistry: true
  image: "manushau/checkout-service"
  tag: "latest" # Overridden by CI/CD
  containerPort: 3004
  servicePort: 3004
  env:
    PORT: "3004"
    POSTGRES_PORT: "5432"
```

### Secrets Configuration

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: stripe-secret
  namespace: micro-store
type: Opaque
stringData:
  STRIPE_SECRET_KEY: sk_live_xxxxx
  STRIPE_WEBHOOK_SECRET: whsec_xxxxx
```

## Deployment Guide

### Local Development

```bash
# Install dependencies
cd checkout-service
npm install

# Configure environment
cp .env.example .env
# Edit .env with Stripe keys and database credentials

# Start service
npm start
# Or with hot-reload
npm run dev
```

### Docker Compose

```bash
# Start checkout service with PostgreSQL
docker compose up checkout-service

# Test health endpoint
curl http://localhost:3004/health

# Process a payment (requires JWT token)
curl -X POST http://localhost:3004/checkout/process \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @order.json
```

### Kubernetes/Helm

```bash
# Deploy via Helm
helm install micro-store ./helm/micro-store \
  --namespace micro-store \
  --set services.checkout-service.tag=v1.2.3

# Verify deployment
kubectl get pods -n micro-store | grep checkout-service
kubectl logs -f deployment/checkout-service -n micro-store

# Port forward
kubectl port-forward svc/checkout-service 3004:3004 -n micro-store
```

## Testing

### Unit Tests

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Manual Testing with Stripe

```bash
# Get JWT token (from auth service)
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.token')

# Use Stripe test card
# Card: 4242 4242 4242 4242
# Exp: 12/25
# CVC: 123

# Process payment
curl -X POST http://localhost:3004/checkout/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "items": [
      {"productId": "prod-1", "quantity": 1, "price": 99.99}
    ],
    "totalAmount": 99.99,
    "stripeToken": "tok_visa"
  }'
```

## Monitoring & Troubleshooting

### View Logs

```bash
# Local
npm start  # Logs in console

# Docker
docker logs -f checkout-service

# Kubernetes
kubectl logs -f deployment/checkout-service -n micro-store
```

### Common Issues

**Issue**: Stripe connection error

```
Error: Invalid API key provided
```

- **Solution**: Verify Stripe secret key
  ```bash
  echo $STRIPE_SECRET_KEY
  # Should start with sk_test_ or sk_live_
  ```

**Issue**: Payment declined

```
Error: Your card was declined
```

- **Cause**: Card validation failed
- **Solution**: Use Stripe test cards
  ```
  4242 4242 4242 4242 - Success
  4000 0000 0000 0002 - Declined
  4000 0025 0000 3155 - Expired
  ```

**Issue**: Database connection error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

- **Solution**: Verify PostgreSQL is running
  ```bash
  docker compose up postgres
  ```

## Stripe Integration

### Test vs Live Mode

```env
# Test Mode (development)
STRIPE_SECRET_KEY=sk_test_xxxxxx

# Live Mode (production)
STRIPE_SECRET_KEY=sk_live_xxxxxx
```

### Webhook Setup

Configure Stripe webhooks for:

- `charge.succeeded` - Order confirmation
- `charge.failed` - Payment failure notification
- `charge.refunded` - Refund processing

### Test Payment Methods

| Card                | Behavior                  |
| ------------------- | ------------------------- |
| 4242 4242 4242 4242 | Successful charge         |
| 4000 0000 0000 0002 | Generic decline           |
| 5555 5555 5555 4444 | Always works (Mastercard) |
| 378282246310005     | Always works (Amex)       |

## Security Best Practices

✅ **Implemented:**

- Stripe handles sensitive card data (PCI compliance)
- No card information stored in our database
- JWT authentication on all endpoints
- ACID transactions for financial operations

⚠️ **Recommendations:**

- Enable Stripe webhook verification
- Implement idempotency keys for payment processing
- Regular audit logs for financial transactions
- Rate limiting on payment endpoints
- Implement fraud detection
- Use HTTPS/TLS for all communications

## Performance Optimization

1. **Database Indexing**: Orders indexed by user_id and status
2. **Connection Pooling**: PostgreSQL connection pool configured
3. **Caching**: Cache recent orders (5 minute TTL)
4. **Async Processing**: Event publishing is non-blocking

## Related Services

- 🌐 [API Gateway](../api-gateway/README.md)
- 🔐 [Auth Service](../auth-service/README.md)
- 📦 [Catalog Service](../catalog-service/README.md)
- 🛒 [Cart Service](../cart-service/README.md)
- 📧 [Email Service](../email-service/README.md)

## Version History

| Version | Date       | Changes                    |
| ------- | ---------- | -------------------------- |
| 1.0.0   | 2024-01-15 | Initial release            |
| 1.1.0   | 2024-02-15 | Added order tracking       |
| 1.2.0   | 2024-03-20 | Stripe webhook integration |

## Support & Documentation

- **Source Code**: `checkout-service/index.js`
- **Tests**: `checkout-service/tests/checkout.test.js`
- **Stripe Docs**: https://stripe.com/docs
- **Main README**: [../README.md](../README.md)
