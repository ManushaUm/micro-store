# System Architecture 🏛️

The Micro Shop platform utilizes a highly decoupled, event-driven architecture designed to handle e-commerce traffic at scale.

## 1. High-Level Communication Flow

We use a hybrid communication approach:

- **Synchronous (HTTP/REST)**: Used for client-to-service and service-to-service data fetching (e.g., retrieving products, verifying auth tokens).
- **Asynchronous (AMQP)**: Used for eventual consistency and background processing (e.g., sending emails after checkout, updating inventory).

```mermaid
graph TD
    Client[Browser/Next.js] -->|HTTP| LoadBalancer[Azure Load Balancer]
    LoadBalancer --> Nginx[API Gateway]

    Nginx -->|/auth| Auth[Auth Service]
    Nginx -->|/products| Catalog[Catalog Service]
    Nginx -->|/cart| Cart[Cart Service]
    Nginx -->|/checkout| Checkout[Checkout Service]

    Checkout -->|Publish 'order.placed'| RMQ[RabbitMQ Event Bus]
    RMQ -->|Consume| Email[Email Service]

    Auth --> Postgres[(Postgres - Users)]
    Checkout --> Postgres[(Postgres - Orders)]
    Catalog --> MongoDB[(MongoDB)]
    Cart --> Redis[(Azure Redis)]
```

## 2. Database Strategy (Polyglot Persistence)

Each microservice owns its own data. There are no shared databases, preventing tight coupling and single points of failure.

| Service      | Datastore             | Rationale                                                            |
| :----------- | :-------------------- | :------------------------------------------------------------------- |
| **Auth**     | PostgreSQL            | Relational integrity needed for user profiles and credentials.       |
| **Catalog**  | MongoDB Atlas         | Document structure allows flexible, unstructured product attributes. |
| **Cart**     | Azure Cache for Redis | High read/write throughput required; data is ephemeral.              |
| **Checkout** | PostgreSQL            | ACID transactions required for financial integrity.                  |

### Database Architecture Diagram

```mermaid
graph LR
    Auth["🔐 Auth Service"]
    Catalog["📦 Catalog Service"]
    Cart["🛒 Cart Service"]
    Checkout["💳 Checkout Service"]

    Auth -->|Users Table| PG1["🐘 PostgreSQL<br/>Host: postgres<br/>DB: shopping_site"]
    Checkout -->|Orders Table| PG1

    Catalog -->|Products Collection| Mongo["🍃 MongoDB Atlas<br/>Catalog DB"]

    Cart -->|Session Data<br/>TTL: 24h| Redis["📍 Azure Redis<br/>Port: 6380<br/>SSL: Enabled"]

    style PG1 fill:#336791,stroke:#fff,color:#fff
    style Mongo fill:#47A248,stroke:#fff,color:#fff
    style Redis fill:#DC382D,stroke:#fff,color:#fff
```

## 3. Event-Driven Workflows

When a user completes a purchase, the **Checkout Service** validates payment with Stripe and saves the order to PostgreSQL. Instead of waiting for the email to send before responding to the user, the service fires an asynchronous event.

1. **Exchange**: `shopping_exchange` (Topic Exchange)
2. **Routing Key**: `order.placed`
3. **Queue**: `email_queue`

The **Email Service** listens on this queue, parses the message, and uses Nodemailer to dispatch a confirmation email. If SMTP fails, the message is Negative-Acknowledged (`nack`) and requeued.

### Event Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as 🎨 Frontend
    participant Checkout as 💳 Checkout Service
    participant Stripe as 💰 Stripe API
    participant RabbitMQ as 🐰 RabbitMQ
    participant Email as 📧 Email Service
    participant SMTP as 📬 SMTP Server

    User->>Frontend: Click "Place Order"
    Frontend->>Checkout: POST /checkout/process<br/>(stripeToken, items, address)

    Checkout->>Stripe: Create charge (amount, token)
    Stripe-->>Checkout: Charge ID + Status

    Checkout->>Checkout: Save Order to PostgreSQL<br/>(ACID transaction)
    Checkout-->>Frontend: 200 OK (orderId, status)
    Frontend-->>User: ✅ Order Confirmation

    Checkout->>RabbitMQ: Publish event:<br/>order.placed<br/>(orderId, email, items, total)

    RabbitMQ->>Email: Consume from email_queue
    Email->>Email: Render email template<br/>(handlebars)
    Email->>SMTP: Send email
    SMTP-->>Email: 250 OK
    Email->>RabbitMQ: ACK (message consumed)

    Note over User,SMTP: Order confirmed & email sent<br/>(user doesn't wait for email)
```

## 4. Security & Authentication

- **API Gateway**: Nginx terminates SSL/TLS (via LoadBalancer) and handles global CORS policies.
- **JWT**: The Auth service issues JSON Web Tokens. Downstream services (Cart, Checkout) decode these tokens from the `Authorization` header to identify users (`x-user-id`).
- **Google OAuth**: Integrated natively on the Next.js frontend. The frontend exchanges the Google token with our Auth service for a local JWT.

### Authentication & Authorization Flow

```mermaid
graph TD
    A["🎨 Frontend"] -->|1. POST /auth/login<br/>email + password| B["🔐 Auth Service"]
    A -->|OR 1. Google OAuth Token| B

    B -->|2. Verify credentials<br/>+ bcrypt check| C["🐘 PostgreSQL<br/>Users Table"]
    C -->|Hash match| B

    B -->|3. Sign JWT| D["🔑 JWT Token<br/>exp: 7 days<br/>aud: micro-shop"]
    D -->|4. Return token| A

    A -->|5. Store in secure<br/>HTTP-only cookie| E["🍪 Cookie Storage"]

    A -->|6. Include in Authorization<br/>header| F["🌐 API Gateway<br/>nginx"]
    F -->|7. Forward request| G["🛒 Cart/Checkout<br/>Services"]

    G -->|8. Decode JWT<br/>Extract user_id| H["🔍 JWT Middleware"]
    H -->|Valid| I["✅ Allow Request<br/>Set x-user-id header"]
    H -->|Invalid/Expired| J["❌ Reject<br/>401 Unauthorized"]

    I -->|9. Process<br/>user-specific action| K["✨ Service Logic"]
    J -->|Redirect| A

    style D fill:#FFD700,stroke:#333,color:#000
    style E fill:#4CAF50,stroke:#fff,color:#fff
    style H fill:#FF6B6B,stroke:#fff,color:#fff
    style I fill:#4CAF50,stroke:#fff,color:#fff
    style J fill:#FF6B6B,stroke:#fff,color:#fff
```

## 5. Kubernetes & Helm

Our infrastructure relies on Kubernetes for self-healing and scaling.

- **Helm**: We use a dynamic chart (`helm/micro-store`) to enforce zero-downtime rollouts.
- **Probes**: Every service has `readinessProbe` and `livenessProbe` endpoints (`/health`). If a pod deadlocks, Kubernetes will automatically restart it. Traffic is only routed to pods that pass readiness checks.

### Kubernetes Deployment Architecture

```mermaid
graph TB
    subgraph "Azure AKS Cluster (East US)"
        subgraph "Ingress & Load Balancing"
            LB["☁️ Azure Load Balancer<br/>Public IP: 48.216.152.209"]
            Ingress["🚪 Kubernetes Ingress<br/>prod.48.216.152.209.nip.io"]
        end

        subgraph "Production Namespace (micro-store)"
            direction TB
            GW["🌐 API Gateway Pod<br/>Replicas: 2<br/>Port: 8080"]
            Auth["🔐 Auth Pod<br/>Replicas: 2<br/>Port: 3001"]
            Catalog["📦 Catalog Pod<br/>Replicas: 3<br/>Port: 3002"]
            Cart["🛒 Cart Pod<br/>Replicas: 2<br/>Port: 3003"]
            Checkout["💳 Checkout Pod<br/>Replicas: 2<br/>Port: 3004"]
            Email["📧 Email Pod<br/>Replicas: 1<br/>Port: N/A"]
            Frontend["🎨 Frontend Pod<br/>Replicas: 2<br/>Port: 3000"]
        end

        subgraph "Staging Namespace (staging)"
            StagingGW["🌐 Gateway (1 replica)"]
            StagingAuth["🔐 Auth (1 replica)"]
            StagingCatalog["📦 Catalog (1 replica)"]
        end

        subgraph "External Services"
            PG["🐘 PostgreSQL<br/>(External)"]
            Mongo["🍃 MongoDB Atlas"]
            Redis["📍 Azure Redis<br/>Port: 6380 SSL"]
            RMQ["🐰 RabbitMQ<br/>(In-cluster or external)"]
        end
    end

    Client["👥 Users<br/>Internet"]

    Client -->|HTTPS| LB
    LB --> Ingress
    Ingress -->|Route traffic| GW

    GW --> Auth
    GW --> Catalog
    GW --> Cart
    GW --> Checkout
    GW --> Frontend

    Email -->|Consume events| RMQ
    Checkout -->|Publish events| RMQ

    Auth --> PG
    Checkout --> PG
    Catalog --> Mongo
    Cart --> Redis

    style LB fill:#0078D4,stroke:#fff,color:#fff
    style GW fill:#FFD700,stroke:#333,color:#000
    style Auth fill:#4CAF50,stroke:#fff,color:#fff
    style Catalog fill:#2196F3,stroke:#fff,color:#fff
    style Cart fill:#FF9800,stroke:#fff,color:#fff
    style Checkout fill:#9C27B0,stroke:#fff,color:#fff
    style Email fill:#F44336,stroke:#fff,color:#fff
    style Frontend fill:#00BCD4,stroke:#fff,color:#fff
```

### Pod Lifecycle & Health Checks

```mermaid
stateDiagram-v2
    [*] --> Pending: Pod scheduled
    Pending --> Init: Execute init containers
    Init --> ContainerCreating: Pull image
    ContainerCreating --> Running: Container started

    Running --> Running: ✅ Readiness = Pass<br/>Traffic routed
    Running --> Unready: ❌ Readiness = Fail<br/>No traffic
    Unready --> Running: ✅ Recovered
    Unready --> Restarting: Liveness = Fail<br/>Pod deadlock

    Restarting --> Terminating: Kill pod
    Running --> Terminating: Graceful shutdown
    Running --> Terminating: Eviction/Scale-down

    Terminating --> Terminated: Container stopped
    Terminated --> [*]

    note right of Running
        Continuously check:
        - readinessProbe: /health
        - livenessProbe: /health
        - Interval: 10s
        - Timeout: 5s
    end
```

### Helm Template Rendering Pipeline

```mermaid
graph LR
    Values["📝 values.yaml<br/>Prod replicas: 3<br/>Staging replicas: 1"]
    Helm["🎯 Helm Command<br/>helm upgrade --install"]
    Template["📄 deployment.yaml<br/>Template"]
    Rendered["✨ Rendered YAML<br/>Deployment/Service<br/>ConfigMap/Secret"]
    KubeAPI["☸️ Kubernetes API<br/>apply manifest"]
    Pods["🐳 Pods Created<br/>with config"]

    Values -->|merge| Helm
    Helm -->|render with vars| Template
    Template -->|substitute .Values| Rendered
    Rendered -->|kubectl apply| KubeAPI
    KubeAPI -->|schedule & launch| Pods

    style Values fill:#FFC107,stroke:#333,color:#000
    style Helm fill:#FF6B6B,stroke:#fff,color:#fff
    style Template fill:#4ECDC4,stroke:#fff,color:#fff
    style Rendered fill:#95E1D3,stroke:#333,color:#000
    style KubeAPI fill:#0078D4,stroke:#fff,color:#fff
    style Pods fill:#4CAF50,stroke:#fff,color:#fff
```
