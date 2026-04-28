# Auth Service 🔐

## Overview

The **Auth Service** is responsible for user authentication, JWT token generation, OAuth integration (Google), and user account management. It provides secure authentication mechanisms with bcrypt password hashing and JWT-based authorization.

## Purpose

- **User Registration**: Create new user accounts with bcrypt password hashing
- **User Login**: Authenticate users and issue JWT tokens
- **OAuth Integration**: Google OAuth 2.0 login support
- **JWT Verification**: Validate and verify JWT tokens for other services
- **User Management**: Retrieve and manage user information

## Architecture

```
Frontend (OAuth Flow)
      │
      ├──────────────┐
      │              │
      ▼              ▼
  [Google OAuth]  [Email/Password]
      │              │
      └──────┬───────┘
             │
             ▼
      ┌─────────────────┐
      │  Auth Service   │
      │  (Node/Express) │
      │   :3001         │
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │  PostgreSQL     │
      │  (shopping_site)│
      │  :5432          │
      └─────────────────┘
               │
         (users table)
```

## Deployment Information

### Port

- **Container Port**: 3001
- **Service Port**: 3001 (Kubernetes ClusterIP)
- **Health Endpoint**: `/health`

### Docker Image

- **Registry**: Azure Container Registry (ACR)
- **Image**: `microstoreacr2026.azurecr.io/manushau/auth-service`
- **Tag**: Latest (overridden by CI/CD with commit SHA)

## API Endpoints

### User Registration

```http
POST /auth/register

Headers:
  Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response (201):
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}

Response (400):
{
  "error": "Email already exists"
}
```

### User Login

```http
POST /auth/login

Headers:
  Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}

Response (401):
{
  "error": "Invalid credentials"
}
```

### Google OAuth

```http
POST /auth/google

Headers:
  Content-Type: application/json

Body:
{
  "googleToken": "google_id_token_here"
}

Response (200):
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com"
  }
}
```

### Verify JWT Token

```http
GET /auth/verify

Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200):
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}

Response (401):
{
  "error": "Invalid token"
}
```

### Get User Details

```http
GET /auth/user/:id

Headers:
  Authorization: Bearer jwt_token_here

Response (200):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Health Check

```http
GET /health

Response (200):
{
  "status": "healthy",
  "service": "auth-service",
  "database": "connected"
}
```

## Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development|production

# Database (PostgreSQL)
POSTGRES_HOST=postgres          # Database hostname
POSTGRES_PORT=5432             # Database port
POSTGRES_USER=adminuser         # Database user
POSTGRES_PASSWORD=P@ssw0rd123! # Database password
POSTGRES_DB=shopping_site       # Database name

# Authentication
JWT_SECRET=your_super_secret_jwt_key  # Secret key for JWT signing
JWT_EXPIRE=7d                          # Token expiration time

# OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_secret

# Message Queue (RabbitMQ)
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# Logging
LOG_LEVEL=debug|info|warn|error
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  oauth_provider VARCHAR(50),  -- 'google', 'local', etc.
  oauth_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
```

### Sessions Table (Optional)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Kubernetes Deployment

### Helm Values

```yaml
auth-service:
  enabled: true
  useRegistry: true
  image: "manushau/auth-service"
  tag: "latest" # Overridden by CI/CD
  containerPort: 3001
  servicePort: 3001
  env:
    PORT: "3001"
    POSTGRES_PORT: "5432"
```

### Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: micro-store
spec:
  type: ClusterIP
  ports:
    - port: 3001
      targetPort: 3001
      protocol: TCP
  selector:
    app: auth-service
```

### Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: micro-store
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth-service
  template:
    spec:
      containers:
        - name: auth-service
          image: microstoreacr2026.azurecr.io/manushau/auth-service:latest
          ports:
            - containerPort: 3001
          env:
            - name: POSTGRES_HOST
              value: "postgres-service"
          envFrom:
            - secretRef:
                name: micro-store-secrets
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
```

## Deployment Guide

### Local Development

```bash
# Install dependencies
cd auth-service
npm install

# Configure .env file
cp .env.example .env
# Edit .env with database credentials and JWT secret

# Start service
npm start
# Or with hot-reload
npm run dev
```

### Docker Compose

```bash
# Start auth service with dependencies
docker compose up auth-service

# Test health endpoint
curl http://localhost:3001/health

# Register a user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Kubernetes/Helm

```bash
# Deploy via Helm
helm install micro-store ./helm/micro-store \
  --namespace micro-store \
  --set services.auth-service.tag=v1.2.3

# Verify deployment
kubectl get pods -n micro-store | grep auth-service
kubectl logs -f deployment/auth-service -n micro-store

# Port forward for testing
kubectl port-forward svc/auth-service 3001:3001 -n micro-store
```

## Testing

### Unit Tests

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (re-run on file changes)
npm run test:watch
```

### Test File Location

`tests/auth.test.js` - Contains tests for:

- User registration
- User login
- OAuth flow
- JWT token validation
- Error handling

### Manual Testing

```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login user
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!"
  }'

# Verify token (replace TOKEN with actual JWT)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/auth/verify
```

## Monitoring & Troubleshooting

### View Logs

```bash
# Local
npm start  # Logs appear in console

# Docker
docker logs -f auth-service

# Kubernetes
kubectl logs -f deployment/auth-service -n micro-store
```

### Common Issues

**Issue**: Database connection error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

- **Cause**: PostgreSQL is not running
- **Solution**: Start PostgreSQL service
  ```bash
  docker compose up postgres
  # Or in Kubernetes
  kubectl get pods -n micro-store | grep postgres
  ```

**Issue**: Invalid JWT secret

```
Error: JWT_SECRET not set
```

- **Solution**: Set JWT_SECRET environment variable
  ```bash
  export JWT_SECRET=your_secure_secret_key
  npm start
  ```

**Issue**: Google OAuth failing

```
Error: Invalid Google token
```

- **Cause**: Invalid GOOGLE_CLIENT_ID or token expired
- **Solution**: Verify Google OAuth credentials and token is fresh

**Issue**: Password verification failing

```
Error: Invalid password
```

- **Cause**: User doesn't exist or password is incorrect
- **Solution**: Verify credentials or create new user

### Health Check

```bash
# Check service is running
curl http://localhost:3001/health

# Should return:
# {
#   "status": "healthy",
#   "service": "auth-service",
#   "database": "connected"
# }
```

## Security Best Practices

✅ **Implemented:**

- bcryptjs for password hashing (bcrypt cost: 10)
- JWT tokens with expiration (7 days default)
- Password validation requirements
- SQL injection prevention (using parameterized queries)

⚠️ **Recommendations:**

- Enable HTTPS in production
- Implement rate limiting on login endpoint
- Add CSRF protection
- Implement account lockout after failed attempts
- Add email verification for registration
- Use secure cookies for session management
- Implement token refresh mechanism

## Database Migrations

### Create Tables

```bash
# Using migration script
npm run migrate:up

# Manual SQL
npm run db:init
```

### Update Schema

```bash
npm run migrate:latest
```

## Performance Considerations

- **Connection Pooling**: Use PgBouncer for PostgreSQL connection pool
- **Caching**: Cache user lookup by ID for 5 minutes
- **Indexes**: Email and OAuth columns are indexed for fast lookup
- **JWT Size**: Keep JWT payload minimal to reduce network overhead

## Related Services

- 🌐 [API Gateway](../api-gateway/README.md)
- 📦 [Catalog Service](../catalog-service/README.md)
- 🛒 [Cart Service](../cart-service/README.md)
- 💳 [Checkout Service](../checkout-service/README.md)

## Version History

| Version | Date       | Changes                 |
| ------- | ---------- | ----------------------- |
| 1.0.0   | 2024-01-15 | Initial release         |
| 1.1.0   | 2024-02-01 | Added Google OAuth      |
| 1.2.0   | 2024-03-10 | Improved error handling |

## Support & Documentation

- **Source Code**: `auth-service/index.js`
- **Tests**: `auth-service/tests/auth.test.js`
- **Configuration**: Environment variables (see above)
- **Main README**: [../README.md](../README.md)
