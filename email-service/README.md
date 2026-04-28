# Email Service 📧

## Overview

The **Email Service** is an asynchronous event listener that consumes messages from RabbitMQ and sends email notifications. It does not expose HTTP endpoints and runs as a background process, listening for order-related events and triggering email delivery.

## Purpose

- **Event Consumption**: Listen for order.placed events from RabbitMQ
- **Email Rendering**: Generate formatted email templates
- **SMTP Integration**: Send emails via configured SMTP server
- **Async Processing**: Non-blocking email delivery
- **Retry Mechanism**: Automatic retry on delivery failure
- **Logging**: Track email delivery status and errors

## Architecture

```
┌─────────────────────┐
│  Checkout Service   │
│  (publishes event)  │
└──────────┬──────────┘
           │ order.placed
           ▼
    ┌─────────────────┐
    │  RabbitMQ       │
    │  ┌────────────┐ │
    │  │ shopping   │ │
    │  │ exchange   │ │
    │  └─────┬──────┘ │
    │        │        │
    │   ┌────▼──────┐ │
    │   │ email     │ │
    │   │ queue     │ │
    │   └──────┬────┘ │
    └──────────┼───────┘
               │
               ▼
    ┌──────────────────┐
    │ Email Service    │
    │ (Listener)       │
    └──────────┬───────┘
               │
               ▼
    ┌──────────────────┐
    │  SMTP Server     │
    │ (mail.gmail.com) │
    └──────────────────┘
               │
               ▼
    ┌──────────────────┐
    │  User Inbox      │
    │  (email)         │
    └──────────────────┘
```

## Deployment Information

### Port

- **No HTTP Port** - Background service only
- **Message Queue**: RabbitMQ (port 5672)
- **Health Endpoint**: None (check logs for status)

### Docker Image

- **Registry**: Azure Container Registry (ACR)
- **Image**: `microstoreacr2026.azurecr.io/manushau/email-service`
- **Tag**: Latest (overridden by CI/CD with commit SHA)

## Event Consumption

### Subscribed Events

**Event Type**: `order.placed`

```json
{
  "orderId": "order-uuid",
  "userId": "user-uuid",
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "totalAmount": 999.99,
  "items": [
    {
      "name": "Laptop",
      "quantity": 1,
      "price": 999.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### RabbitMQ Configuration

```yaml
Exchange: shopping_exchange
Type: topic
Durable: true
Queue: email_queue
Binding: *.placed  (matches order.placed)
Consumer: email-service
```

## Environment Variables

```env
# Service Configuration
NODE_ENV=development|production

# Message Queue (RabbitMQ)
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE=email_queue
RABBITMQ_EXCHANGE=shopping_exchange

# SMTP Configuration (Email Server)
SMTP_HOST=smtp.gmail.com          # SMTP server hostname
SMTP_PORT=587                     # SMTP port (usually 587 for TLS)
SMTP_SECURE=true                  # Use TLS/SSL
SMTP_USER=noreply@microshop.com   # SMTP authentication user
SMTP_PASSWORD=your_app_password   # SMTP authentication password
SMTP_FROM_ADDRESS=noreply@microshop.com  # From email address
SMTP_FROM_NAME="MicroShop"        # From display name

# Email Configuration
EMAIL_TEMPLATE_DIR=./templates    # Directory with email templates
EMAIL_RETRY_ATTEMPTS=3            # Number of retries on failure
EMAIL_RETRY_DELAY=5000            # Delay between retries (ms)

# Logging
LOG_LEVEL=debug|info|warn|error
```

## Email Templates

### Order Confirmation Email

**Template File**: `templates/order-confirmation.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
      }
      .header {
        background-color: #f0f0f0;
        padding: 20px;
      }
      .items {
        border-collapse: collapse;
        width: 100%;
      }
      .items th,
      .items td {
        padding: 10px;
        text-align: left;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Order Confirmation</h1>
        <p>Thank you for your purchase, {{userName}}!</p>
      </div>

      <h2>Order Details</h2>
      <p><strong>Order ID:</strong> {{orderId}}</p>
      <p><strong>Order Date:</strong> {{timestamp}}</p>

      <h2>Items Ordered</h2>
      <table class="items">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>{{this.name}}</td>
            <td>{{this.quantity}}</td>
            <td>${{this.price}}</td>
            <td>${{multiply this.quantity this.price}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <h2>Order Summary</h2>
      <p><strong>Total Amount:</strong> ${{totalAmount}}</p>

      <h2>Shipping Address</h2>
      <p>
        {{shippingAddress.street}}<br />
        {{shippingAddress.city}}, {{shippingAddress.state}}
        {{shippingAddress.zip}}<br />
        {{shippingAddress.country}}
      </p>

      <p>We'll send you a tracking number once your order ships.</p>
    </div>
  </body>
</html>
```

### Template Variables

| Variable          | Type   | Description              |
| ----------------- | ------ | ------------------------ |
| `orderId`         | string | Unique order identifier  |
| `userId`          | string | User ID                  |
| `userEmail`       | string | User email address       |
| `userName`        | string | User's full name         |
| `totalAmount`     | number | Order total amount       |
| `items`           | array  | Array of ordered items   |
| `shippingAddress` | object | Shipping address details |
| `timestamp`       | string | Order timestamp          |

## Kubernetes Deployment

### Helm Values

```yaml
email-service:
  enabled: true
  useRegistry: true
  image: "manushau/email-service"
  tag: "latest" # Overridden by CI/CD
  containerPort: 80 # Not used (no HTTP)
  serviceType: ClusterIP
  healthCheckEnabled: false # No health endpoint
```

### Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: email-service
  namespace: micro-store
spec:
  replicas: 2
  selector:
    matchLabels:
      app: email-service
  template:
    spec:
      containers:
        - name: email-service
          image: microstoreacr2026.azurecr.io/manushau/email-service:latest
          imagePullPolicy: Always
          env:
            - name: RABBITMQ_URL
              valueFrom:
                secretKeyRef:
                  name: micro-store-secrets
                  key: RABBITMQ_URL
            - name: SMTP_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: email-secrets
                  key: SMTP_PASSWORD
```

## Deployment Guide

### Local Development

```bash
# Install dependencies
cd email-service
npm install

# Configure environment
cp .env.example .env
# Edit .env with RabbitMQ and SMTP credentials

# Start service (will listen for events)
npm start
# Or with hot-reload
npm run dev
```

### Docker Compose

```bash
# Start email service with RabbitMQ
docker compose up email-service

# View logs to confirm it's listening
docker logs -f email-service

# Should see: "Email service listening on queue: email_queue"
```

### Kubernetes/Helm

```bash
# Deploy via Helm
helm install micro-store ./helm/micro-store \
  --namespace micro-store \
  --set services.email-service.tag=v1.2.3

# Verify deployment
kubectl get pods -n micro-store | grep email-service
kubectl logs -f deployment/email-service -n micro-store

# Monitor logs in real-time
kubectl logs -f deployment/email-service -n micro-store --tail=100
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

### Integration Testing

```bash
# 1. Start all services
docker compose up

# 2. Register a user (auth service)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# 3. Get JWT token
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# 4. Add product to cart
curl -X POST http://localhost:3003/cart/user-123/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod-1","quantity":1,"price":99.99}'

# 5. Process checkout (this triggers order.placed event)
curl -X POST http://localhost:3004/checkout/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "items": [{"productId":"prod-1","quantity":1,"price":99.99}],
    "totalAmount": 99.99,
    "stripeToken": "tok_visa"
  }'

# 6. Check email service logs
docker logs email-service

# Should see: "Email sent to test@example.com"
```

### Manual Event Testing

```bash
# Connect to RabbitMQ and publish test event
docker exec -it rabbitmq rabbitmqctl

# Or use RabbitMQ Management UI
# http://localhost:15672 (guest/guest)

# Or publish via AMQP client
node scripts/publish-test-event.js
```

## Monitoring & Troubleshooting

### View Logs

```bash
# Local
npm start  # Logs in console

# Docker
docker logs -f email-service

# Kubernetes
kubectl logs -f deployment/email-service -n micro-store

# Stream logs with timestamps
kubectl logs -f deployment/email-service -n micro-store --timestamps=true
```

### Common Issues

**Issue**: Not receiving emails

```
Error: Service not listening on queue
```

- **Cause**: Email service not connected to RabbitMQ
- **Solution**: Verify RabbitMQ is running and RABBITMQ_URL is correct
  ```bash
  docker compose up rabbitmq
  echo $RABBITMQ_URL
  ```

**Issue**: SMTP authentication failed

```
Error: Invalid login credentials
```

- **Solution**: Verify SMTP credentials

  ```bash
  # Test SMTP connection
  npm run test:smtp

  # Or manually check:
  echo "Test" | nc -w1 smtp.gmail.com 587
  ```

**Issue**: Emails stuck in queue

```
Error: Max retries exceeded
```

- **Cause**: SMTP server unreachable
- **Solution**: Check SMTP configuration and network connectivity
  ```bash
  # Verify SMTP host is reachable
  ping smtp.gmail.com
  telnet smtp.gmail.com 587
  ```

**Issue**: Template rendering errors

```
Error: Unknown helper "multiply"
```

- **Solution**: Check template syntax and helpers are defined
  ```javascript
  handlebars.registerHelper("multiply", (a, b) => a * b);
  ```

## Performance Optimization

1. **Connection Pooling**: AMQP connection pool automatically managed
2. **Batch Processing**: Process multiple events concurrently (default: 2)
3. **Retry Strategy**: Exponential backoff on failures
4. **Template Caching**: Cache compiled templates in memory

### Configuration Tuning

```env
# Increase parallel consumers
AMQP_PREFETCH_COUNT=5

# Adjust retry settings
EMAIL_RETRY_ATTEMPTS=5
EMAIL_RETRY_DELAY=10000  # 10 seconds
```

## SMTP Configuration Examples

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

[Get Gmail App Password](https://myaccount.google.com/apppasswords)

### Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@company.com
SMTP_PASSWORD=your-password
```

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your_sendgrid_api_key
```

### AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
```

## Security Best Practices

✅ **Implemented:**

- No sensitive data in logs
- SMTP credentials stored in secrets
- TLS/SSL for SMTP connections

⚠️ **Recommendations:**

- Use dedicated email service account
- Enable DKIM/SPF/DMARC records
- Monitor email delivery failures
- Implement rate limiting to prevent spam
- Use environment-specific SMTP servers
- Regularly audit email logs

## Related Services

- 💳 [Checkout Service](../checkout-service/README.md) - Publishes order.placed events
- 🌐 [API Gateway](../api-gateway/README.md)
- 🔐 [Auth Service](../auth-service/README.md)

## Version History

| Version | Date       | Changes                  |
| ------- | ---------- | ------------------------ |
| 1.0.0   | 2024-01-15 | Initial release          |
| 1.1.0   | 2024-02-15 | Added email templates    |
| 1.2.0   | 2024-03-20 | Improved retry mechanism |

## Support & Documentation

- **Source Code**: `email-service/index.js`
- **Templates**: `email-service/templates/`
- **Configuration**: Environment variables (see above)
- **Main README**: [../README.md](../README.md)
