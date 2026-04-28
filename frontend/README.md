# Frontend Application 🎨

## Overview

The **Frontend** is a modern Next.js 16 web application providing a complete e-commerce user interface. It includes server-side rendering (SSR), Google OAuth 2.0 integration, Stripe payment processing, and responsive design for optimal user experience across devices.

## Purpose

- **User Interface**: Interactive shopping experience
- **Product Browsing**: View products, search, and filter
- **Cart Management**: Add/remove items from shopping cart
- **User Authentication**: Login, registration, and OAuth
- **Checkout**: Order placement with Stripe integration
- **Order History**: Track previous orders
- **Admin Dashboard**: Manage products (admin users)
- **Server-Side Rendering**: Improved SEO and performance

## Technology Stack

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS (responsive design)
- **HTTP Client**: Axios
- **Authentication**: JWT (stored in secure cookies)
- **OAuth**: Google Sign-In (@react-oauth/google)
- **Payments**: Stripe (@stripe/react-stripe-js)
- **State Management**: React Context API (AppContext)
- **Build Tool**: Next.js built-in bundler

## Quick Start

### Local Development

```bash
# Install dependencies
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with API endpoint and keys

# Start development server
npm run dev

# Open browser: http://localhost:3000
```

### Docker Compose

```bash
# Start frontend with all dependencies
docker compose up frontend

# Frontend will be available at: http://localhost:3000
```

## Environment Variables

```env
# Build-Time Variables (Public)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Runtime Variables (Server-Side)
NODE_ENV=development|production
```

## Pages & Routes

### Public Pages

- `/` - Home page
- `/products` - Product listing
- `/products/[id]` - Product details
- `/login` - User login
- `/register` - User registration

### Protected Pages (Authentication Required)

- `/cart` - Shopping cart
- `/checkout` - Order checkout
- `/order-confirmation/[id]` - Order confirmation
- `/profile` - User profile
- `/admin` - Admin dashboard

## Kubernetes Deployment

### Helm Values

```yaml
frontend:
  enabled: true
  useRegistry: true
  image: "manushau/frontend"
  tag: "latest"
  containerPort: 3000
  servicePort: 3000
  healthCheck: "/"
  env:
    NEXT_PUBLIC_API_BASE_URL: "http://prod.48.216.152.209.nip.io"
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_xxx"
```

### Docker Build Args

```dockerfile
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
```

## API Client Integration

### API Helper (`src/lib/api.js`)

```javascript
import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## State Management (AppContext)

```javascript
{
  user: {
    id: 'uuid',
    email: 'user@example.com',
    isAuthenticated: true
  },
  cart: {
    items: [...],
    totalPrice: 999.99
  },
  loading: false,
  error: null
}
```

## Authentication Flow

### Login

1. User enters credentials
2. Submit to `/auth/login`
3. Receive JWT token
4. Store token in secure cookie
5. Set user in AppContext
6. Redirect to home

### Google OAuth

1. User clicks "Sign in with Google"
2. Google OAuth dialog appears
3. User grants permissions
4. Receive Google ID token
5. Send token to `/auth/google`
6. Receive JWT token and redirect

## Stripe Integration

### Setup

```javascript
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

export function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
```

### Test Cards

| Card                | Behavior             |
| ------------------- | -------------------- |
| 4242 4242 4242 4242 | Successful charge    |
| 4000 0000 0000 0002 | Declined             |
| 5555 5555 5555 4444 | Mastercard (success) |

## Testing

```bash
# Unit tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests (optional)
npm run cypress:run
```

## Build & Deployment

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Docker build
docker build -t frontend:latest .
```

## Troubleshooting

### CORS Error

```
Error: Access to XMLHttpRequest blocked by CORS
```

- Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- Check API Gateway CORS configuration

### Stripe Error

```
Error: Uncaught SyntaxError: Unexpected token '<'
```

- Use `pk_test_` prefix (NOT `sk_test_`)
- Verify public key in environment variables

### Google OAuth Error

```
Error: popup_closed_by_user
```

- User cancelled dialog - no action needed
- Verify Google Client ID is correct

## Performance Optimization

- **SSR**: Server-side rendering for SEO
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Dynamic imports
- **Caching**: Static generation with revalidation

## Security Best Practices

✅ **Implemented:**

- JWT in secure, HTTP-only cookies
- HTTPS/TLS encryption
- XSS protection via React escaping
- Environment variables for secrets

⚠️ **Recommendations:**

- Enable Content Security Policy (CSP)
- Implement rate limiting
- Regular security audits
- Keep dependencies updated
- Add error boundaries

## Related Services

- 🌐 [API Gateway](../api-gateway/README.md)
- 🔐 [Auth Service](../auth-service/README.md)
- 📦 [Catalog Service](../catalog-service/README.md)
- 🛒 [Cart Service](../cart-service/README.md)
- 💳 [Checkout Service](../checkout-service/README.md)
- 📧 [Email Service](../email-service/README.md)

## Version History

| Version | Date       | Changes                     |
| ------- | ---------- | --------------------------- |
| 1.0.0   | 2024-01-15 | Initial release             |
| 1.1.0   | 2024-02-10 | Added Google OAuth          |
| 1.2.0   | 2024-03-15 | Improved Stripe integration |

## Documentation

- **Source Code**: `frontend/src/`
- **Configuration**: `frontend/next.config.mjs`
- **Components**: `frontend/src/components/`
- **Pages**: `frontend/src/app/`
- **Context**: `frontend/src/context/`
- **Main README**: [../README.md](../README.md)
