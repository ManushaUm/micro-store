# Cart Service 🛒

## Overview

The **Cart Service** manages shopping carts using **Redis** for high-performance session storage. It provides ephemeral cart data with automatic expiration (TTL: 24 hours), enabling fast add/remove/update operations without persisting to a relational database.

## Purpose

- **Session Management**: Store user cart sessions in-memory
- **Add to Cart**: Add products to user's cart
- **Update Quantities**: Modify item quantities in cart
- **Remove Items**: Delete items from cart
- **Cart Persistence**: Automatic 24-hour expiration
- **High Performance**: Sub-millisecond latency for operations

## Architecture

```
Frontend/API Gateway
         │
         ▼
   ┌──────────────┐
   │ Cart Service │
   │ (Node/Expr)  │
   │   :3003      │
   └──────┬───────┘
          │
          ▼
   ┌─────────────┐
   │ Redis Cache │
   │ (in-memory) │
   │  :6379      │
   └─────────────┘
        TTL: 24h
   (Automatic cleanup)
```

## Deployment Information

### Port

- **Container Port**: 3003
- **Service Port**: 3003 (Kubernetes ClusterIP)
- **Health Endpoint**: `/health`

### Docker Image

- **Registry**: Azure Container Registry (ACR)
- **Image**: `microstoreacr2026.azurecr.io/manushau/cart-service`
- **Tag**: Latest (overridden by CI/CD with commit SHA)

## API Endpoints

### Get User's Cart

```http
GET /cart/:userId

Headers:
  Authorization: Bearer jwt_token

Response (200):
{
  "userId": "user-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "name": "Laptop",
      "price": 999.99,
      "quantity": 1,
      "subtotal": 999.99,
      "image": "https://...",
      "addedAt": "2024-01-15T10:30:00Z"
    },
    {
      "productId": "product-uuid-2",
      "name": "Mouse",
      "price": 25.99,
      "quantity": 2,
      "subtotal": 51.98
    }
  ],
  "totalItems": 3,
  "totalPrice": 1051.97,
  "expiresAt": "2024-01-16T10:30:00Z"
}
```

### Add Item to Cart

```http
POST /cart/:userId/add

Headers:
  Authorization: Bearer jwt_token
  Content-Type: application/json

Body:
{
  "productId": "product-uuid",
  "quantity": 1,
  "price": 999.99,
  "name": "Laptop",
  "image": "https://..."
}

Response (201):
{
  "message": "Item added to cart",
  "item": {
    "productId": "product-uuid",
    "quantity": 1,
    "subtotal": 999.99
  },
  "cart": {
    "totalItems": 1,
    "totalPrice": 999.99
  }
}
```

### Update Item Quantity

```http
PUT /cart/:userId/update/:itemId

Headers:
  Authorization: Bearer jwt_token
  Content-Type: application/json

Body:
{
  "quantity": 2
}

Response (200):
{
  "message": "Item updated",
  "item": {
    "productId": "product-uuid",
    "quantity": 2,
    "subtotal": 1999.98
  },
  "cart": {
    "totalItems": 3,
    "totalPrice": 2051.97
  }
}
```

### Remove Item from Cart

```http
DELETE /cart/:userId/items/:itemId

Headers:
  Authorization: Bearer jwt_token

Response (200):
{
  "message": "Item removed",
  "cart": {
    "totalItems": 2,
    "totalPrice": 1051.97
  }
}
```

### Clear Cart

```http
DELETE /cart/:userId

Headers:
  Authorization: Bearer jwt_token

Response (200):
{
  "message": "Cart cleared"
}
```

### Health Check

```http
GET /health

Response (200):
{
  "status": "healthy",
  "service": "cart-service",
  "redis": "connected"
}
```

## Environment Variables

```env
# Server Configuration
PORT=3003
NODE_ENV=development|production

# Redis Cache
REDIS_URL=redis://redis:6379  # Local development
# Or for Azure Redis:
# REDIS_URL=rediss://username:password@micro-store-cart-cache.redis.cache.windows.net:6380

REDIS_DB=0                     # Redis database number (0-15)
REDIS_PASSWORD=                # Redis password (if required)

# Session Management
CART_TTL=86400                 # Cart expiration in seconds (24 hours)
SESSION_KEY_PREFIX=cart:       # Redis key prefix for namespacing

# Message Queue (RabbitMQ)
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# Logging
LOG_LEVEL=debug|info|warn|error
```

## Redis Data Structure

### Cart Storage Format

```
Key: cart:<user-id>
Value: {
  "userId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "name": "Laptop",
      "price": 999.99,
      "quantity": 1,
      "image": "url",
      "addedAt": "timestamp"
    }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

TTL: 86400 seconds (24 hours)
```

### Redis Commands

```bash
# Connect to Redis
redis-cli

# View all cart keys
KEYS cart:*

# Get specific user's cart
GET cart:user-uuid

# Delete cart
DEL cart:user-uuid

# Check TTL
TTL cart:user-uuid

# Clear all carts
FLUSHDB

# Monitor Redis commands in real-time
MONITOR
```

## Kubernetes Deployment

### Helm Values

```yaml
cart-service:
  enabled: true
  useRegistry: true
  image: "manushau/cart-service"
  tag: "latest" # Overridden by CI/CD
  containerPort: 3003
  servicePort: 3003
  env:
    PORT: "3003"
```

### Redis Connection (Azure)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: redis-secret
  namespace: micro-store
type: Opaque
stringData:
  REDIS_URL: rediss://:password@micro-store-cart-cache.redis.cache.windows.net:6380
  REDIS_PASSWORD: your_redis_password
```

### Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: cart-service
  namespace: micro-store
spec:
  type: ClusterIP
  ports:
    - port: 3003
      targetPort: 3003
      protocol: TCP
  selector:
    app: cart-service
```

## Deployment Guide

### Local Development

```bash
# Install dependencies
cd cart-service
npm install

# Configure environment
cp .env.example .env

# Start service (requires Redis running)
npm start
# Or with hot-reload
npm run dev
```

### Docker Compose

```bash
# Start cart service with Redis
docker compose up cart-service

# Test health endpoint
curl http://localhost:3003/health

# Add item to cart
curl -X POST http://localhost:3003/cart/user-123/add \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod-456","quantity":1,"price":99.99}'
```

### Kubernetes/Helm

```bash
# Deploy via Helm
helm install micro-store ./helm/micro-store \
  --namespace micro-store \
  --set services.cart-service.tag=v1.2.3

# Verify deployment
kubectl get pods -n micro-store | grep cart-service
kubectl logs -f deployment/cart-service -n micro-store

# Port forward
kubectl port-forward svc/cart-service 3003:3003 -n micro-store
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

### Manual Testing

```bash
# Health check
curl http://localhost:3003/health

# Add to cart
curl -X POST http://localhost:3003/cart/user-123/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "productId": "prod-456",
    "quantity": 1,
    "price": 99.99,
    "name": "Product",
    "image": "url"
  }'

# Get cart
curl http://localhost:3003/cart/user-123 \
  -H "Authorization: Bearer JWT_TOKEN"

# Update quantity
curl -X PUT http://localhost:3003/cart/user-123/update/prod-456 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{"quantity": 2}'

# Remove item
curl -X DELETE http://localhost:3003/cart/user-123/items/prod-456 \
  -H "Authorization: Bearer JWT_TOKEN"

# Clear cart
curl -X DELETE http://localhost:3003/cart/user-123 \
  -H "Authorization: Bearer JWT_TOKEN"
```

## Monitoring & Troubleshooting

### View Logs

```bash
# Local
npm start  # Logs in console

# Docker
docker logs -f cart-service

# Kubernetes
kubectl logs -f deployment/cart-service -n micro-store
```

### Common Issues

**Issue**: Redis connection error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

- **Cause**: Redis is not running
- **Solution**: Start Redis service
  ```bash
  docker compose up redis
  # Or for Azure Redis, verify connection string
  ```

**Issue**: Authentication error

```
Error: WRONGPASS invalid username-password pair
```

- **Solution**: Verify Redis password
  ```bash
  export REDIS_PASSWORD=correct_password
  npm start
  ```

**Issue**: Cart data not persisting

- **Cause**: TTL expired (default 24 hours)
- **Note**: This is by design - carts are ephemeral
- **Solution**: Implement persistent cart storage if needed

**Issue**: Memory usage high

- **Cause**: Carts not expiring, Redis filling up
- **Solution**: Lower TTL or implement cleanup job

  ```bash
  # View memory usage
  redis-cli INFO memory

  # Clear all carts
  redis-cli FLUSHDB
  ```

## Performance Optimization

### Configuration Tips

1. **Connection Pooling**: Redis connection pool is automatic

   ```env
   REDIS_MAX_CONNECTIONS=10
   ```

2. **Pipeline Requests**: Batch multiple Redis commands

   ```javascript
   const pipeline = client.pipeline();
   pipeline.get(key1);
   pipeline.get(key2);
   pipeline.exec((err, results) => {});
   ```

3. **Key Expiration**: Set appropriate TTL
   ```env
   CART_TTL=86400  # 24 hours
   ```

## Azure Redis Configuration

### Prerequisites

1. Azure Cache for Redis instance created
2. Enable SSL/TLS (port 6380)
3. Retrieve access keys

### Connection String

```
rediss://:password@name.redis.cache.windows.net:6380/0?ssl=true
```

**rediss** protocol requires SSL/TLS

### Testing Azure Redis Connection

```bash
# Test connection
redis-cli -h micro-store-cart-cache.redis.cache.windows.net \
  -p 6380 \
  -a password \
  --tls \
  ping

# Should respond: PONG
```

## Security Best Practices

✅ **Implemented:**

- JWT authentication on all endpoints
- SSL/TLS for Redis in production (Azure)
- Key namespacing (cart: prefix)
- TTL for automatic cleanup

⚠️ **Recommendations:**

- Enable authentication in Redis (password)
- Use private subnets for Redis
- Monitor Redis for suspicious access patterns
- Implement rate limiting

## Data Lifecycle

```
1. User adds item → Cart created in Redis with TTL
2. User updates/deletes items → Cart updated (TTL reset)
3. User checks out → Cart moved to order, cleared from Redis
4. 24 hours elapsed (no activity) → Cart auto-deleted by Redis
```

## Related Services

- 🌐 [API Gateway](../api-gateway/README.md)
- 🔐 [Auth Service](../auth-service/README.md)
- 📦 [Catalog Service](../catalog-service/README.md)
- 💳 [Checkout Service](../checkout-service/README.md)

## Version History

| Version | Date       | Changes                   |
| ------- | ---------- | ------------------------- |
| 1.0.0   | 2024-01-15 | Initial release           |
| 1.1.0   | 2024-02-20 | Added Azure Redis support |
| 1.2.0   | 2024-03-10 | Optimized performance     |

## Support & Documentation

- **Source Code**: `cart-service/index.js`
- **Tests**: `cart-service/tests/cart.test.js`
- **Configuration**: Environment variables (see above)
- **Redis CLI**: Connect with `redis-cli`
- **Main README**: [../README.md](../README.md)
