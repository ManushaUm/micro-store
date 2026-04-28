# API Gateway 🌐

## Overview

The **API Gateway** is the single entry point for all client requests. It's built with **Nginx** and provides request routing, load balancing, CORS policy enforcement, and SSL/TLS termination.

## Purpose

- **Request Routing**: Routes incoming requests to appropriate microservices
- **Load Balancing**: Distributes traffic across service instances
- **CORS Management**: Enforces cross-origin resource sharing policies
- **SSL/TLS Termination**: Handles encryption/decryption at the edge
- **Health Checking**: Provides gateway health status

## Architecture

```
Internet Request
      │
      ▼
┌──────────────────────┐
│  Azure Load Balancer │
│  (TCP 80/443)        │
└──────────┬───────────┘
           │
      ▼ ▼ ▼ ▼ (HTTPS/TLS)
┌──────────────────────┐
│   API Gateway        │
│   (Nginx:8080)       │
└──────────────────────┘
      │ │ │ │
      ├─┼─┼─┼─────────────────────────┐
      │ │ │ │                         │
      ▼ ▼ ▼ ▼                         ▼
   [Auth] [Catalog] [Cart] [Checkout] [Frontend]
   :3001  :3002    :3003   :3004     :3000
```

## Deployment Information

### Port

- **External**: Port 80 (HTTP) / 443 (HTTPS) via Azure Load Balancer
- **Internal**: Port 8080 (container port)
- **Container**: Nginx

### Docker Image

- **Registry**: Azure Container Registry (ACR)
- **Image**: `microstoreacr2026.azurecr.io/manushau/api-gateway`
- **Tag**: Latest (overridden by CI/CD with commit SHA)

### Health Endpoint

```
GET /gateway/health
Response: 200 OK (plain text or JSON)
```

## API Routes

### Frontend

```
GET / → Frontend (Next.js)
GET /page.js → Frontend pages
```

**Domain**: `http://48.216.152.209.nip.io` or `http://staging.48.216.152.209.nip.io`

### Authentication Service

```
POST   /auth/register       → Register new user
POST   /auth/login          → User login
POST   /auth/google         → Google OAuth callback
GET    /auth/verify         → Verify JWT token
GET    /auth/user/:id       → Get user details
GET    /auth/health         → Auth service health
```

**Internal Proxy**: `http://auth-service:3001`

### Catalog Service

```
GET    /products            → List all products
GET    /products/:id        → Get product details
POST   /products            → Create product (admin)
PUT    /products/:id        → Update product (admin)
DELETE /products/:id        → Delete product (admin)
GET    /categories          → List categories
GET    /catalog/health      → Catalog service health
```

**Internal Proxy**: `http://catalog-service:3002`

### Cart Service

```
GET    /cart/:userId        → Get user's cart
POST   /cart/:userId/add    → Add item to cart
PUT    /cart/:userId/update/:itemId    → Update item quantity
DELETE /cart/:userId/items/:itemId     → Remove item
DELETE /cart/:userId       → Clear cart
GET    /cart/health         → Cart service health
```

**Internal Proxy**: `http://cart-service:3003`

### Checkout Service

```
POST   /checkout/process    → Process payment
GET    /orders/:orderId     → Get order details
GET    /orders/user/:userId → List user's orders
PUT    /orders/:orderId/cancel → Cancel order
GET    /checkout/health     → Checkout service health
```

**Internal Proxy**: `http://checkout-service:3004`

## Configuration

### Nginx Configuration File

**Location**: `api-gateway/nginx.conf`

### Key Settings

```nginx
# Request size limit
client_max_body_size 10M;

# Timeouts
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# CORS Headers (if enabled)
add_header 'Access-Control-Allow-Origin' '*';
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
```

### Environment Variables

The API Gateway itself doesn't require environment variables but reads from `nginx.conf`:

```env
# Container Port
PORT=8080

# Optional monitoring/logging
NGINX_LOG_LEVEL=info
```

## Kubernetes Deployment

### Helm Values

```yaml
api-gateway:
  enabled: true
  useRegistry: true
  image: "manushau/api-gateway"
  tag: "latest" # Overridden by CI/CD
  containerPort: 8080
  servicePort: 8080
  healthCheck: "/gateway/health"
```

### Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: micro-store
spec:
  type: LoadBalancer # Or ClusterIP with Ingress
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
  selector:
    app: api-gateway
```

### Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-gateway-ingress
spec:
  rules:
    - host: "48.216.152.209.nip.io"
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 8080
```

## Deployment Guide

### Local Development (Docker Compose)

```bash
# Start API Gateway with dependencies
docker compose up api-gateway

# Test gateway health
curl http://localhost:8080/gateway/health

# Test routing to auth service
curl http://localhost:8080/auth/health
```

### Cloud Deployment (Kubernetes/Helm)

```bash
# Deploy via Helm (automatically included with micro-store chart)
helm install micro-store ./helm/micro-store \
  --namespace micro-store \
  --set services.api-gateway.tag=v1.2.3

# Verify deployment
kubectl get pods -n micro-store | grep api-gateway
kubectl logs -f deployment/api-gateway -n micro-store
```

### Update Configuration

To update Nginx configuration:

1. Edit `api-gateway/nginx.conf`
2. Rebuild Docker image: `docker build -t api-gateway:v1 .`
3. Push to ACR: `docker push microstoreacr2026.azurecr.io/manushau/api-gateway:v1`
4. Redeploy: `helm upgrade micro-store ./helm/micro-store --set services.api-gateway.tag=v1`

## Monitoring & Troubleshooting

### Check Gateway Status

```bash
# Local
curl http://localhost:8080/gateway/health

# Kubernetes
kubectl exec -it deployment/api-gateway -n micro-store -- sh
  $ curl http://localhost:8080/gateway/health
```

### View Logs

```bash
# Local
docker logs api-gateway

# Kubernetes
kubectl logs -f deployment/api-gateway -n micro-store

# Stream with timestamps
kubectl logs -f deployment/api-gateway -n micro-store --timestamps=true
```

### Common Issues

**Issue**: 502 Bad Gateway

- **Cause**: Upstream service (auth, catalog, etc.) is unavailable
- **Solution**: Check if backend services are running
  ```bash
  kubectl get pods -n micro-store
  kubectl logs -f deployment/auth-service -n micro-store
  ```

**Issue**: Connection timeout

- **Cause**: Backend service not responding within timeout period
- **Solution**: Increase proxy timeouts in `nginx.conf`
  ```nginx
  proxy_connect_timeout 120s;
  proxy_read_timeout 120s;
  ```

**Issue**: CORS errors in browser

- **Cause**: CORS headers not configured
- **Solution**: Verify CORS settings in `nginx.conf`
  ```bash
  curl -I -H "Origin: http://localhost:3000" http://localhost:8080/auth/health
  ```

**Issue**: 404 on routes

- **Cause**: Nginx route not configured
- **Solution**: Check `nginx.conf` for all required upstream blocks
  ```bash
  curl -v http://localhost:8080/products
  ```

## Testing

### Manual Testing

```bash
# Test gateway health
curl http://localhost:8080/gateway/health

# Test routing to auth service
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Test routing to catalog service
curl http://localhost:8080/products

# Test with authentication header
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/cart/123
```

### Load Testing

```bash
# Using k6 (if available)
k6 run k6-load-test.js

# Using Apache Bench
ab -n 1000 -c 100 http://localhost:8080/gateway/health
```

## Performance Optimization

### Configuration Tips

1. **Connection Pool Size**: Tune for expected concurrent connections

   ```nginx
   keepalive_requests 100;
   keepalive_timeout 65s;
   ```

2. **Buffer Settings**: Adjust for request/response sizes

   ```nginx
   proxy_buffer_size 128k;
   proxy_buffers 4 256k;
   ```

3. **Caching**: Enable caching for static responses
   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
   ```

## Security Considerations

- ✅ SSL/TLS termination at load balancer
- ✅ Request size limits (10MB)
- ✅ CORS policy enforcement
- ✅ No credential storage in gateway
- ⚠️ Ensure backend services are not directly accessible from internet
- ⚠️ Rate limiting not yet implemented (recommended for production)

## Scaling

### Horizontal Scaling

```bash
# Scale to 3 replicas
kubectl scale deployment api-gateway --replicas=3 -n micro-store

# Or via Helm
helm upgrade micro-store ./helm/micro-store \
  --set common.replicaCount=3 \
  -n micro-store
```

### Load Distribution

- Azure Load Balancer distributes traffic to all gateway pods
- Each pod can handle ~1000 concurrent connections
- Auto-scaling based on CPU/memory usage (if HPA configured)

## Version History

| Version | Date       | Changes            |
| ------- | ---------- | ------------------ |
| 1.0.0   | 2024-01-15 | Initial release    |
| 1.1.0   | 2024-02-20 | Added CORS headers |
| 1.2.0   | 2024-03-10 | Optimized timeouts |

## Support & Documentation

- **Configuration**: See `nginx.conf`
- **Issues**: Check logs: `kubectl logs -f deployment/api-gateway -n micro-store`
- **Routing**: See [API Routes](#api-routes) section above
- **Main README**: See [../README.md](../README.md)

## Related Services

- 🔐 [Auth Service](../auth-service/README.md)
- 📦 [Catalog Service](../catalog-service/README.md)
- 🛒 [Cart Service](../cart-service/README.md)
- 💳 [Checkout Service](../checkout-service/README.md)
- 🎨 [Frontend](../frontend/README.md)
