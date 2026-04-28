# Micro Shop - Enterprise Cloud Architecture 🚀

[![Build Status](https://github.com/ManushaUm/micro-store/actions/workflows/ci-cd.yaml/badge.svg)](https://github.com/ManushaUm/micro-store/actions/workflows/ci-cd.yaml)
![Architecture Diagram](https://img.shields.io/badge/Architecture-Microservices-blue)
![Platform](https://img.shields.io/badge/Platform-Azure_AKS-0078D4)
![IAC](https://img.shields.io/badge/IAC-Terraform-623CE4)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF)
![Deployment](https://img.shields.io/badge/Deployment-Helm-0F1689)
![Frontend](https://img.shields.io/badge/Frontend-Next.js_16-black)
![Database](https://img.shields.io/badge/Database-Polyglot_Persistence-green)
![Container Registry](https://img.shields.io/badge/Registry-Azure_ACR-0078D4)

A modern, full-stack microservices e-commerce platform designed for high availability, zero-downtime deployments, and cloud-native scalability. Built with containerized microservices, Kubernetes orchestration, and Infrastructure-as-Code principles.

## 📑 Table of Contents

- [Quick Start](#-quick-start)
- [System Architecture](#-system-architecture)
- [Database Architecture](#-database-architecture)
- [Cloud Infrastructure](#-cloud-infrastructure)
- [CI/CD & DevOps Pipeline](#-cicd--devops-pipeline)
- [Environment Management](#-environment-management)
- [Infrastructure as Code (IaC)](#-infrastructure-as-code-iac)
- [Local Development](#-local-development-docker-compose)
- [Deployment Guide](#-deployment-guide)
- [Microservices Documentation](#-microservices-documentation)
- [Monitoring & Troubleshooting](#-monitoring--troubleshooting)
- [Contributing](#-contributing)

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (for local development)
- Kubernetes 1.28+ (for cluster deployments)
- Helm 3.x (for deployments)
- Terraform 1.3+ (for infrastructure provisioning)
- Azure CLI (for cloud operations)
- Node.js 18+ (for local service development)

### Option 1: Local Development (Docker Compose)

```bash
# Clone repository
git clone <repo-url>
cd microservices-demo

# Setup environment variables
cp .env.example .env

# Start all services
docker compose up --build

# Access the application
# Frontend: http://localhost:3000
# API Gateway: http://localhost:8080
# RabbitMQ Management: http://localhost:15672 (guest/guest)
```

### Option 2: Cloud Deployment

See [Infrastructure as Code (IaC)](#-infrastructure-as-code-iac) section for Azure deployment instructions.

### Option 3: Kubernetes (After Infrastructure Setup)

```bash
# Configure kubectl context
export KUBECONFIG=$(pwd)/terraform/aks_kubeconfig.yaml

# Deploy via Helm
helm install micro-store ./helm/micro-store \
  --namespace micro-store \
  --create-namespace \
  --set global.environment=production
```

---

## 🏗️ System Architecture

### Application-Level Architecture

The platform follows a **microservices architecture** with event-driven workflows:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Next.js 16 Frontend (SSR/Client)              │   │
│  │  • Google OAuth 2.0 Integration                         │   │
│  │  • Stripe Payment UI Integration                        │   │
│  │  • Real-time Cart Updates via API                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────┬───────────────────────────────────────────────┘
                   │ HTTPS/TLS
┌──────────────────▼───────────────────────────────────────────────┐
│                  API GATEWAY LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Nginx Reverse Proxy (8080)                 │   │
│  │  • Request Routing & Load Balancing                     │   │
│  │  • CORS Policy Enforcement                             │   │
│  │  • SSL/TLS Termination (Azure LoadBalancer)            │   │
│  │  • Health Check: /gateway/health                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────┬──────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────┐
        │             │             │              │
        ▼             ▼             ▼              ▼
┌───────────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────┐
│ Auth Service  │ │ Catalog Svc  │ │ Cart Svc   │ │ Checkout S. │
│ (3001)        │ │ (3002)       │ │ (3003)     │ │ (3004)      │
│               │ │              │ │            │ │             │
│ • JWT Token   │ │ • Products   │ │ • Session  │ │ • Orders    │
│   Generation  │ │ • Inventory  │ │   mgmt     │ │ • Payments  │
│ • OAuth Flows │ │ • Categories │ │ • Caching  │ │ • Stripe    │
│ • User Auth   │ │ • Image CDN  │ │            │ │   Integration
└───────────────┘ │              │ └────────────┘ └─────────────┘
                   │ (Seed Data)  │
                   └──────────────┘
                           │ Sync & Async
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐   ┌──────────────┐
│ Email Svc    │  │ RabbitMQ     │   │ Event Bus    │
│ (Listener)   │  │ Event Bus    │   │              │
│              │  │              │   │ • order.    │
│ • SMTP Relay │  │ • Topic Exch │   │   placed    │
│ • Async Jobs │  │ • Durable    │   │ • inventory │
│              │  │   Queues     │   │   updated   │
└──────────────┘  └──────────────┘   └──────────────┘
```

### Service Communication Patterns

**Synchronous (HTTP/REST)**

- Client → API Gateway → Microservices
- Service-to-Service queries (Auth verification, catalog lookups)
- Real-time request/response operations

**Asynchronous (AMQP/RabbitMQ)**

- Event-driven workflows (order placement → email notification)
- Background job processing
- Decoupled service interactions
- At-least-once delivery guarantee

### Communication Flow Example: Checkout Process

1. **User Places Order** → Frontend sends cart data to Checkout Service
2. **Checkout Service** validates order and processes Stripe payment
3. **Order Saved** to PostgreSQL (order repository)
4. **Event Published** → `shopping_exchange` with routing key `order.placed`
5. **Email Service Consumes** event from `email_queue`
6. **Confirmation Email Sent** asynchronously (doesn't block checkout response)

---

## 🗄️ Database Architecture

### Polyglot Persistence Strategy

This project uses a **polyglot persistence** model where each microservice owns its data store optimized for its use case:

| Service      | Database          | Type         | Rationale                                                                       | Capacity      |
| ------------ | ----------------- | ------------ | ------------------------------------------------------------------------------- | ------------- |
| **Auth**     | PostgreSQL        | Relational   | ACID transactions, normalized user schema, relational integrity                 | 5GB initial   |
| **Catalog**  | MongoDB Atlas     | Document     | Flexible product attributes, unstructured data, horizontal scalability          | 10GB sharded  |
| **Cart**     | Azure Redis Cache | In-Memory KV | Ephemeral session data, sub-millisecond latency, automatic expiration           | 1GB (Premium) |
| **Checkout** | PostgreSQL        | Relational   | Financial transactions, strong consistency, audit trails, referential integrity | 10GB initial  |

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Requests
┌────────────────────▼────────────────────────────────────────┐
│                  API GATEWAY (Nginx)                        │
└─┬──────────────────┬─────────────┬────────────────┬─────────┘
  │                  │             │                │
  ▼                  ▼             ▼                ▼
[Auth Svc]      [Catalog Svc]  [Cart Svc]    [Checkout Svc]
  │                  │             │                │
  ▼                  ▼             ▼                ▼
[PostgreSQL]    [MongoDB]       [Redis]        [PostgreSQL]
  │                  │             │                │
  ├─ users          ├─ products   ├─ sessions     ├─ orders
  ├─ sessions       ├─ categories │ (TTL: 24h)    ├─ transactions
  └─ oauth_tokens   └─ attributes └─ cart_items   └─ audit_logs
```

### Database Connection Details

**PostgreSQL (Auth & Checkout)**

- Host: `postgres-service.micro-store.svc.cluster.local` (Kubernetes)
- Port: 5432
- Database: `shopping_site`
- SSL Mode: `prefer` (for production)

**MongoDB (Catalog)**

- Connection String: `mongodb+srv://user:pass@cluster.mongodb.net/catalog`
- Authentication: SCRAM-SHA-256
- Replication: 3-node replica set

**Redis (Cart)**

- Host: `micro-store-cart-cache.redis.cache.windows.net` (Azure)
- Port: 6380 (SSL enabled)
- Key Prefix: `cart:` for namespacing

### Database Backup & Recovery

- **PostgreSQL**: Daily automated snapshots (via Azure Backup)
- **MongoDB**: Continuous backup with point-in-time recovery (24 hours)
- **Redis**: RDB snapshots every 6 hours + AOF for durability

---

## ☁️ Cloud Infrastructure

### Azure Resources Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE SUBSCRIPTION                           │
├─────────────────────────────────────────────────────────────────┤
│ Resource Group: micro-store-rg (East US)                       │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ NETWORK LAYER                                              ││
│  │ ├─ Virtual Network (10.0.0.0/16)                           ││
│  │ │  └─ AKS Subnet (10.0.1.0/24)                             ││
│  │ ├─ Public IP: 48.216.152.209                               ││
│  │ ├─ Azure Load Balancer (Layer 4)                           ││
│  │ └─ Network Security Groups (Firewall Rules)                ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ CONTAINER ORCHESTRATION                                    ││
│  │ ├─ AKS Cluster (Standard_DC2s_v3)                          ││
│  │ │  ├─ Production Namespace (micro-store)                   ││
│  │ │  ├─ Staging Namespace (staging)                          ││
│  │ │  └─ System Services (ingress-nginx, kube-system)         ││
│  │ ├─ Azure Container Registry (microstoreacr2026)            ││
│  │ │  └─ Private registry for all microservice images         ││
│  │ └─ Managed Kubernetes (1.28+)                              ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ STORAGE & DATA                                             ││
│  │ ├─ Azure Storage Account (Product Images CDN)             ││
│  │ │  └─ Blob Container: product-images                       ││
│  │ ├─ Azure Cache for Redis (Premium, 1GB)                    ││
│  │ │  └─ Endpoint: micro-store-cart-cache.redis.cache...      ││
│  │ ├─ PostgreSQL Database Server (flexible server)            ││
│  │ │  └─ Databases: shopping_site (Auth + Checkout)           ││
│  │ └─ MongoDB Atlas (Cloud-Hosted)                            ││
│  │    └─ Catalog database with replication                    ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ MONITORING & LOGGING                                       ││
│  │ ├─ Azure Monitor                                            ││
│  │ ├─ Log Analytics Workspace                                  ││
│  │ ├─ Application Insights                                     ││
│  │ ├─ Prometheus (Container Insights)                          ││
│  │ └─ Grafana (Visualization)                                  ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### High-Level Infrastructure Flow

```
    Internet Traffic
          │
          ▼
    Azure Public IP
    (48.216.152.209)
          │
          ▼
    Azure Load Balancer
    (TCP/443 → Ingress)
          │
          ▼
    ┌─────────────────────────────┐
    │    AKS Cluster              │
    │  ┌───────────────────────┐  │
    │  │ Nginx Ingress         │  │
    │  │ (nip.io routing)      │  │
    │  └─────┬─────────────────┘  │
    │        │                    │
    │   ┌────┴───────┬────────┐   │
    │   │            │        │   │
    │   ▼            ▼        ▼   │
    │ Prod NS   Staging NS  System│
    │   │            │            │
    │   └─pods...─┘  └─pods...─┘  │
    └─────────────────────────────┘
          │
          ├─► Azure Container Registry (Image Pull)
          ├─► Azure Cache for Redis (Cart Service)
          ├─► PostgreSQL (Auth/Checkout Service)
          ├─► MongoDB Atlas (Catalog Service)
          └─► Azure Storage Blob (Product Images)
```

### Azure Service Tiers & Sizing

| Service    | SKU      | Size                               | Rationale                                              |
| ---------- | -------- | ---------------------------------- | ------------------------------------------------------ |
| AKS        | Standard | Standard_DC2s_v3 (2 vCPU, 8GB RAM) | Production-grade compute with DCv3 for security        |
| ACR        | Premium  | Premium                            | Geo-replication, webhook triggers, advanced networking |
| Redis      | Premium  | 1GB, 1 shard                       | SSL support, persistence, cluster mode disabled        |
| Storage    | Standard | LRS                                | Cost-effective for product images, CDN enabled         |
| PostgreSQL | Standard | B1ms (burstable)                   | Cost-optimized for moderate workloads                  |

---

## 🔄 CI/CD & DevOps Pipeline

### Pipeline Architecture

```
┌─────────────────┐
│   Git Push      │
│   to main       │
└────────┬────────┘
         │ GitHub Webhook
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              GitHub Actions Workflow                            │
│  (.github/workflows/ci-cd.yaml)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Stage 1: TEST ─────────────────────────────────────────┐  │
│  │                                                          │  │
│  │ Matrix Strategy (Parallel):                             │  │
│  │  • auth-service     ──npm test──►  ✓                    │  │
│  │  • cart-service     ──npm test──►  ✓                    │  │
│  │  • catalog-service  ──npm test──►  ✓                    │  │
│  │  • checkout-service ──npm test──►  ✓                    │  │
│  │                                                          │  │
│  │ All tests must PASS before proceeding                   │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │ All tests passed
│  ┌─ Stage 2: BUILD & PUSH ──────────────────────────────────┐ │
│  │                                                          │ │
│  │ Matrix Strategy (Parallel):                             │ │
│  │  • api-gateway      ──docker build──►  ACR               │ │
│  │  • auth-service     ──docker build──►  ACR               │ │
│  │  • cart-service     ──docker build──►  ACR               │ │
│  │  • catalog-service  ──docker build──►  ACR               │ │
│  │  • checkout-service ──docker build──►  ACR               │ │
│  │  • email-service    ──docker build──►  ACR               │ │
│  │  • frontend         ──docker build──►  ACR               │ │
│  │                                                          │ │
│  │ Tags: github.sha (commit hash) + latest                 │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │ All images pushed
│  ┌─ Stage 3: DEPLOY TO STAGING ────────────────────────────┐ │
│  │                                                          │ │
│  │ 1. Authenticate to AKS                                  │ │
│  │ 2. Create ACR image pull secret                         │ │
│  │ 3. Helm Upgrade Install:                                │ │
│  │    - Namespace: staging                                 │ │
│  │    - Environment: staging                               │ │
│  │    - Image Tag: github.sha                              │ │
│  │                                                          │ │
│  │ Verify at: http://staging.48.216.152.209.nip.io         │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │ Manual approval (optional) OR auto
│  ┌─ Stage 4: DEPLOY TO PRODUCTION ─────────────────────────┐ │
│  │                                                          │ │
│  │ 1. Authenticate to AKS                                  │ │
│  │ 2. Create ACR image pull secret (prod namespace)        │ │
│  │ 3. Helm Upgrade Install:                                │ │
│  │    - Namespace: micro-store                             │ │
│  │    - Environment: production                            │ │
│  │    - Image Tag: github.sha                              │ │
│  │    - Domain: 48.216.152.209.nip.io                       │ │
│  │    - RollingUpdate strategy                             │ │
│  │                                                          │ │
│  │ Verify at: http://prod.48.216.152.209.nip.io            │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │ Deployment Complete
│                   ▼
│              ✓ DONE
│
└─────────────────────────────────────────────────────────────────┘
```

### Workflow File Location & Triggers

**File**: `.github/workflows/ci-cd.yaml`

**Triggers**:

- On: `push` to `main` branch
- Manual trigger: `workflow_dispatch` (GitHub UI)

**Environment Variables**:

```yaml
REGISTRY: ${{ secrets.ACR_LOGIN_SERVER }} # microstoreacr2026.azurecr.io
```

### Required GitHub Secrets

| Secret Name              | Description                                       |
| ------------------------ | ------------------------------------------------- |
| `ACR_LOGIN_SERVER`       | Azure Container Registry login server             |
| `ACR_NAME`               | ACR resource name (microstoreacr2026)             |
| `AZURE_CREDENTIALS`      | Azure Service Principal credentials (JSON format) |
| `GOOGLE_CLIENT_ID`       | Google OAuth 2.0 Client ID                        |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public API key                             |

### Deployment Strategy

**Staging Environment**

- Namespace: `staging`
- Runs on every push to `main`
- Automatic deployment (no approval needed)
- Used for testing new features before production

**Production Environment**

- Namespace: `micro-store`
- Requires staging deployment to succeed
- Optional: Manual approval via GitHub environment protection rules
- Rolling update (zero-downtime deployments)

### Failed Build Recovery

If tests fail:

1. Build is stopped immediately
2. GitHub notifies commit author
3. Pull request shows failed status
4. Fix required before merge

If ACR push fails:

1. Staging deployment is skipped
2. Manual intervention required
3. Check ACR credentials in GitHub secrets

If Helm deployment fails:

1. Previous release remains active
2. Error logs available in GitHub Actions
3. Manual rollback: `helm rollback micro-store -n micro-store`

---

## 🌍 Environment Management

### Multi-Environment Setup

The platform supports multiple deployment environments with different configurations:

#### Production Environment

- **Namespace**: `micro-store`
- **Domain**: `prod.48.216.152.209.nip.io`
- **Replicas**: 2-3 per service (high availability)
- **Resource Limits**: Strict CPU/memory quotas
- **Image Pull Policy**: `Always`
- **Health Checks**: Enabled (liveness + readiness probes)
- **Logging Level**: `info`
- **Features**: All enabled, feature flags set to stable

**ConfigMap**: `micro-store-config` in `micro-store` namespace

#### Staging Environment

- **Namespace**: `staging`
- **Domain**: `staging.48.216.152.209.nip.io`
- **Replicas**: 1 per service (cost-optimized)
- **Resource Limits**: Relaxed for testing
- **Image Pull Policy**: `Always`
- **Health Checks**: Enabled
- **Logging Level**: `debug`
- **Features**: All enabled, allows beta features
- **Data**: Copy of production data (optional)

**ConfigMap**: `micro-store-config-staging` in `staging` namespace

#### Development Environment (Local)

- **Deployment**: Docker Compose
- **Port**: `localhost:8080` (API Gateway)
- **Environment Variables**: `.env` file (git-ignored)
- **Logging**: Console output (colorized)
- **Features**: All enabled
- **Hot Reload**: Enabled (nodemon for Node.js, next dev for frontend)

### Environment Variables Hierarchy

```
System Env Variables (lowest priority)
        ↓
.env file (.env.example as template)
        ↓
Kubernetes ConfigMap/Secrets
        ↓
Helm values.yaml (--set flags)
        ↓
Runtime overrides (highest priority)
```

### Secrets Management

**Local Development** (`.env.example` → `.env`)

```env
# Database
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
POSTGRES_DB=shopping_site
MONGO_URI=mongodb://...

# Authentication
JWT_SECRET=supersecretjwtkey
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
STRIPE_SECRET_KEY=sk_test_xxx

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=microstoreprodimages
AZURE_STORAGE_ACCOUNT_KEY=xxxxx
AZURE_CONTAINER_NAME=product-images

# Environment
NODE_ENV=development
```

**Kubernetes Secrets** (`k8s/secrets.yaml`)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: micro-store-secrets
  namespace: micro-store
type: Opaque
data:
  JWT_SECRET: <base64>
  STRIPE_SECRET_KEY: <base64>
  MONGO_URI: <base64>
  POSTGRES_PASSWORD: <base64>
  # ... additional secrets
```

### Namespacing & Isolation

```
Kubernetes Cluster
├─ micro-store (Production)
│  ├─ ConfigMap: micro-store-config
│  ├─ Secret: micro-store-secrets
│  ├─ Deployment: frontend, api-gateway, auth-service, ...
│  ├─ Service: ClusterIP/LoadBalancer
│  └─ Ingress: *.48.216.152.209.nip.io
│
├─ staging (Staging/QA)
│  ├─ ConfigMap: micro-store-config-staging
│  ├─ Secret: micro-store-secrets-staging
│  ├─ Deployment: (same services)
│  └─ Ingress: staging.*.nip.io
│
└─ kube-system (System Services)
   ├─ ingress-nginx
   ├─ metrics-server
   └─ coredns
```

### Environment-Specific Features

| Feature             | Development  | Staging     | Production          |
| ------------------- | ------------ | ----------- | ------------------- |
| Debug Logging       | ✅ Enabled   | ⚠️ Optional | ❌ Disabled         |
| Hot Reload          | ✅ Yes       | ❌ No       | ❌ No               |
| Database Seeding    | ✅ Automatic | ⚠️ Manual   | ❌ Never            |
| API Rate Limiting   | ❌ Disabled  | ⚠️ Lenient  | ✅ Strict           |
| CORS Origins        | `*`          | `staging.*` | `prod.*`            |
| Cache TTL           | 5 min        | 30 min      | 1 hour              |
| Email Notifications | ❌ Mock SMTP | ⚠️ Real     | ✅ Real             |
| Stripe Mode         | Test         | Test        | Live (configurable) |

---

## 🛠️ Infrastructure as Code (IaC)

### Terraform Architecture

The entire cloud infrastructure is defined and managed using **Terraform**. This ensures reproducibility, version control, and infrastructure consistency.

**Location**: `terraform/` directory

### Terraform Files Structure

```
terraform/
├── main.tf                  # Primary resource definitions
├── variables.tf             # Input variables with defaults
├── outputs.tf               # Output values (credentials, endpoints)
├── terraform.tfvars         # Variable values (sensitive, git-ignored)
├── terraform.tfstate        # Current infrastructure state
├── terraform.tfstate.backup # Previous state backup
├── aks_kubeconfig.yaml      # Generated Kubernetes config
└── tf_error.txt             # Error logs (if any)
```

### Key Infrastructure Resources

**Resource Group**

```hcl
resource_group_name = "micro-store-rg"
location            = "eastus"
environment_tag     = "production" | "staging" | "dev"
```

**Networking**

```hcl
Virtual Network: 10.0.0.0/16
├─ AKS Subnet: 10.0.1.0/24
└─ Additional Subnets: (reserved for future use)

Public IP:      48.216.152.209
Load Balancer:  Standard_LB (Layer 4)
Network Rules:  Ingress 80/443, Egress all
```

**Container Orchestration**

```hcl
AKS Cluster:
  name:               micro-store-aks
  vm_size:            Standard_DC2s_v3 (2 vCPU, 8GB RAM)
  node_count:         1-3 (auto-scaling enabled)
  kubernetes_version: 1.28.x (latest)
  network_plugin:     azure (CNI)
  load_balancer_sku:  standard
```

**Container Registry**

```hcl
ACR:
  name:               microstoreacr2026
  sku:                Premium
  admin_enabled:      true
  geo_replication:    eastus (primary)
```

**Data Storage**

```hcl
Azure Storage Account (Product Images):
  account_tier:       Standard
  replication_type:   LRS (Locally Redundant)
  blob_cors:          All origins, methods: GET/PUT/POST/DELETE

Azure Cache for Redis (Cart Service):
  capacity:           1 (GB)
  family:             C (Premium)
  enable_ssl:         true
  minimum_tls_version: 1.2

PostgreSQL Database:
  server_version:     15
  backup_retention:   7 days
  geo_redundancy:     disabled (can enable)

MongoDB Atlas:
  (External, managed separately)
  Replication:        3-node replica set
  Backup:             Continuous
```

### Infrastructure Setup Instructions

#### Step 1: Prerequisites

```bash
# Install Terraform
# macOS: brew install terraform
# Windows: choco install terraform
# Linux: Download from terraform.io

# Install Azure CLI
# macOS: brew install azure-cli
# Windows: choco install azure-cli
# Linux: apt-get install azure-cli

# Verify installations
terraform --version
az --version
```

#### Step 2: Azure Authentication

```bash
# Login to Azure
az login

# Set default subscription
az account set --subscription <subscription-id>

# Create Service Principal for CI/CD
az ad sp create-for-rbac \
  --name micro-store-sp \
  --role Contributor \
  --scopes /subscriptions/<subscription-id>

# Output will contain: appId, password, tenant
```

#### Step 3: Configure Terraform Variables

```bash
cd terraform

# Create terraform.tfvars (copy from tfvars.example if available)
cat > terraform.tfvars << EOF
subscription_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
client_id       = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
client_secret   = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
tenant_id       = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

resource_group_name  = "micro-store-rg"
location             = "eastus"
environment          = "production"
storage_account_name = "microstoreprodimages"
container_name       = "product-images"
redis_capacity       = 1
EOF
```

#### Step 4: Initialize & Plan

```bash
# Initialize Terraform (downloads Azure provider plugin)
terraform init

# Generate execution plan (dry-run)
terraform plan -out=tfplan

# Review the plan output
# Ensures resources will be created as expected
```

#### Step 5: Apply Infrastructure

```bash
# Apply the infrastructure
terraform apply tfplan

# Terraform will:
# 1. Create Resource Group
# 2. Create Virtual Network & Subnets
# 3. Create AKS Cluster (takes 5-10 minutes)
# 4. Create Azure Storage Account
# 5. Create Azure Cache for Redis
# 6. Create Azure Container Registry
# 7. Configure networking & security groups
# 8. Generate kubeconfig file
```

#### Step 6: Retrieve Outputs

```bash
# Get important outputs
terraform output

# Example outputs:
# aks_cluster_name = "micro-store-aks"
# acr_login_server = "microstoreacr2026.azurecr.io"
# redis_hostname = "micro-store-cart-cache.redis.cache.windows.net"
# storage_account_name = "microstoreprodimages"
```

#### Step 7: Configure kubectl Access

```bash
# Get kubeconfig (already generated by Terraform)
# Windows:
$env:KUBECONFIG=(Resolve-Path .\aks_kubeconfig.yaml).Path

# macOS/Linux:
export KUBECONFIG=$(pwd)/aks_kubeconfig.yaml

# Test access
kubectl get nodes
kubectl get pods -A
```

### Terraform Useful Commands

```bash
# Plan and save to file
terraform plan -out=tfplan

# Apply saved plan
terraform apply tfplan

# Destroy all infrastructure (careful!)
terraform destroy -auto-approve

# Validate Terraform files
terraform validate

# Format Terraform files
terraform fmt -recursive

# State management
terraform state list                    # List all resources
terraform state show azurerm_aks.main  # Show specific resource details
terraform state rm resource_name        # Remove from state (doesn't delete in Azure)

# Debug
terraform console  # Interactive console for testing expressions
TF_LOG=DEBUG terraform plan  # Enable debug logging
```

### State Management Best Practices

- **Backend**: Store state in Azure Storage Account (not local)
- **Encryption**: Enable encryption-at-rest for state files
- **Access Control**: Restrict access via IAM roles
- **Backup**: Automated snapshots via Terraform Cloud or Storage Account
- **Versioning**: Enable blob versioning in Storage Account

### Scaling Infrastructure with Terraform

To scale resources (e.g., increase Redis capacity, add database replicas):

```bash
# Edit terraform.tfvars or use -var flag
terraform apply -var="redis_capacity=2"

# For major changes, review plan first
terraform plan -var="redis_capacity=2" -out=tfplan
terraform apply tfplan
```

---

## ☸️ Helm & Kubernetes Deployment

### Helm Chart Structure

**Location**: `helm/micro-store/`

```
helm/micro-store/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default configuration values
├── templates/
│   ├── deployment.yaml     # Deployment template (all services)
│   ├── service.yaml        # Service definitions
│   └── ingress.yaml        # Ingress rules for routing
└── README.md               # Chart documentation
```

### Helm Values Configuration

**Key Configuration Sections** (from `values.yaml`):

```yaml
common:
  replicaCount: 1 # Pods per service
  imagePullPolicy: Always # Always pull latest image
  serviceType: ClusterIP # Service exposure type

global:
  imageRegistry: microstoreacr2026.azurecr.io
  imagePullSecret: acr-secret # Azure Container Registry credentials
  environment: production
  domain: 48.216.152.209.nip.io # Base domain for routing

services:
  frontend:
    enabled: true
    image: manushau/frontend
    tag: latest # Overridden by CI/CD with github.sha
    containerPort: 3000
    healthCheck: /
    env:
      NEXT_PUBLIC_API_BASE_URL: http://48.216.152.209.nip.io

  api-gateway:
    enabled: true
    image: manushau/api-gateway
    tag: latest
    containerPort: 8080
    healthCheck: /gateway/health

  auth-service:
    enabled: true
    image: manushau/auth-service
    tag: latest
    containerPort: 3001
    env:
      PORT: 3001
      POSTGRES_PORT: 5432

  # ... additional services (catalog, cart, checkout, email)
```

### Deploying via Helm

#### Manual Installation

```bash
# Install new release
helm install micro-store ./helm/micro-store \
  --namespace micro-store \
  --create-namespace \
  --set global.environment=production

# Verify deployment
helm status micro-store -n micro-store
kubectl get pods -n micro-store
```

#### Updating Existing Deployment

```bash
# Upgrade existing release
helm upgrade micro-store ./helm/micro-store \
  --namespace micro-store \
  --set global.environment=production \
  --set services.frontend.tag=v1.2.3 \
  --set services.api-gateway.tag=v1.2.3

# Check release history
helm history micro-store -n micro-store

# Rollback to previous version
helm rollback micro-store 1 -n micro-store
```

#### Environment-Specific Deployments

```bash
# Deploy to Staging
helm install micro-store ./helm/micro-store \
  --namespace staging \
  --create-namespace \
  --set global.environment=staging \
  --set global.domain=staging.48.216.152.209.nip.io \
  --values values-staging.yaml

# Deploy to Production
helm install micro-store ./helm/micro-store \
  --namespace micro-store \
  --create-namespace \
  --set global.environment=production \
  --set global.domain=prod.48.216.152.209.nip.io \
  --values values-production.yaml
```

### Helm Template Generation (Dry-Run)

```bash
# Generate Kubernetes manifests without applying
helm template micro-store ./helm/micro-store \
  --namespace micro-store \
  --set global.environment=production \
  > manifests.yaml

# Review the generated manifests
cat manifests.yaml | less
```

### Health Checks & Probes

Each microservice includes health check endpoints:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

**Behavior**:

- **Liveness Probe**: If fails 3 times → Pod is restarted
- **Readiness Probe**: If fails → Pod removed from service load balancing

---

## 🎯 Pod Creation: Helm Templates & Kubernetes Orchestration

### How Pods are Created: Complete Workflow

Deploy the micro-store application using Helm, a sophisticated multi-stage process transforms simple YAML values into running Kubernetes pods. Understanding this workflow is crucial for troubleshooting, scaling, and debugging.

#### Stage 1: Helm Template Rendering

**The Process:**

1. User runs: `helm install micro-store ./helm/micro-store --set global.environment=production`
2. Helm reads `values.yaml` and user-provided `--set` overrides
3. Helm processes template files in `templates/` directory
4. Template engine replaces placeholders with actual values
5. Kubernetes-ready YAML manifests are generated

**Value Input:**

```yaml
# values.yaml (input)
common:
  replicaCount: 2
  imagePullPolicy: Always

services:
  auth-service:
    image: manushau/auth-service
    tag: latest
    containerPort: 3001
    env:
      PORT: 3001
      NODE_ENV: production
```

**Template File** (`templates/deployment.yaml`):

```yaml
{{- range $name, $service := .Values.services }}
{{- if $service.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ $name }}
  namespace: {{ $.Release.Namespace }}
spec:
  replicas: {{ $.Values.common.replicaCount }}
  template:
    spec:
      containers:
      - name: {{ $name }}
        image: "{{ $.Values.global.imageRegistry }}/{{ $service.image }}:{{ $service.tag }}"
        ports:
        - containerPort: {{ $service.containerPort }}
        env:
        {{- range $key, $value := $service.env }}
        - name: {{ $key }}
          value: {{ $value | quote }}
        {{- end }}
{{- end }}
{{- end }}
```

**Generated Kubernetes Manifest** (output):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: micro-store
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: auth-service
          image: "microstoreacr2026.azurecr.io/manushau/auth-service:latest"
          ports:
            - containerPort: 3001
          env:
            - name: PORT
              value: "3001"
            - name: NODE_ENV
              value: "production"
```

#### Stage 2: Kubernetes Deployment Processing

Once Helm generates the Kubernetes manifests, the Kubernetes API server processes them:

```
┌─────────────────────────────────────────────────────────────┐
│          Kubernetes Deployment Lifecycle                     │
└─────────────────────────────────────────────────────────────┘

1. Apply Manifest
   └─► kubectl apply -f deployment.yaml (Applied via Helm)
   └─► Kubernetes API validates manifest syntax & schema

2. Deployment Controller Observes
   └─► Sees desired state: replicas: 2
   └─► Compares with current state: 0 running pods
   └─► Calculates difference: need 2 new pods

3. ReplicaSet Creation
   └─► Deployment creates ReplicaSet: auth-service-5d4c7f8b
   └─► ReplicaSet becomes Pod parent/owner
   └─► ReplicaSet will ensure desired pod count

4. Pod Scheduling
   └─► ReplicaSet requests pod creation from Scheduler
   └─► Scheduler evaluates available nodes
   └─► Scheduler assigns pods to nodes (resource placement)
   └─► Creates PodSpec template with all container info

5. Pod Creation on Node
   └─► Kubelet on assigned node receives pod definition
   └─► Kubelet extracts container image details
   └─► Kubelet requests image pull from ACR
   └─► Docker runtime pulls image: microstoreacr2026.azurecr.io/manushau/auth-service:latest
   └─► Docker runtime creates container from image
   └─► Container starts with environment variables & port config

6. Pod Initialization
   └─► Kubernetes initializes volume mounts
   └─► Kubernetes injects secrets & configmaps as env vars
   └─► Container startup scripts execute (if any)

7. Health Check Initiation
   └─► Kubernetes waits 30s (initialDelaySeconds)
   └─► Sends first readiness probe: GET http://pod-ip:3001/health
   └─► If 200 OK → marks pod as "Ready"
   └─► If fails → retries every 5s, max 2 failures
   └─► Once Ready → pod added to service load balancer

8. Running State
   └─► Pod is now fully operational
   └─► Actively receiving requests from service
   └─► Liveness probe runs every 10s to ensure health
```

#### Stage 3: Mapping Values to Pod Creation

Here's exactly how `values.yaml` settings become running pod resources:

| values.yaml Setting                            | Maps To                       | Pod Effect                                              |
| ---------------------------------------------- | ----------------------------- | ------------------------------------------------------- |
| `common.replicaCount: 2`                       | `spec.replicas: 2`            | Creates 2 identical pods                                |
| `services.auth-service.tag: github.sha`        | `image:` tag in container     | Pulls specific Docker image version                     |
| `global.imagePullSecret: acr-secret`           | `imagePullSecrets[0].name`    | Uses credentials to pull from private ACR               |
| `global.domain: staging.48.216.152.209.nip.io` | Ingress rule in templates     | Routes traffic to pod based on subdomain                |
| `services.auth-service.env.NODE_ENV`           | `env[].value` in container    | Passed to container process as env var                  |
| `services.auth-service.containerPort: 3001`    | `ports[].containerPort`       | Pod listens on this port internally                     |
| Health check settings                          | `readinessProbe.httpGet.path` | Kubernetes calls `/health` endpoint to verify readiness |

#### Stage 4: Environment-Specific Pod Creation

The same Helm chart creates **different pods** for different environments by using different values:

**Production Deployment Command:**

```bash
helm install micro-store ./helm/micro-store \
  --namespace micro-store \
  --set global.environment=production \
  --set common.replicaCount=3 \
  --set services.auth-service.tag=v1.2.3
```

**Generated Production Pods:**

- 3 replicas of auth-service (high availability)
- Image tag: `v1.2.3` (specific stable version)
- In namespace: `micro-store`
- Namespace domain: `prod.48.216.152.209.nip.io`

**Staging Deployment Command:**

```bash
helm install micro-store ./helm/micro-store \
  --namespace staging \
  --set global.environment=staging \
  --set common.replicaCount=1 \
  --set services.auth-service.tag=main-abc123def
```

**Generated Staging Pods:**

- 1 replica of auth-service (cost optimization)
- Image tag: `main-abc123def` (latest dev build)
- In namespace: `staging`
- Namespace domain: `staging.48.216.152.209.nip.io`

**Result**: Same Helm chart, different pod configurations per environment ✅

### Pod Lifecycle in Detail

```
┌──────────────────────────────────────────────────────────────────┐
│              Kubernetes Pod Lifecycle Events                      │
└──────────────────────────────────────────────────────────────────┘

1. PENDING
   └─ Pod created, waiting for resources
   └─ Image pull in progress
   └─ Duration: ~10-30 seconds

2. INIT
   └─ Init containers running (setup tasks)
   └─ Wait for volumes to mount
   └─ Duration: Variable

3. RUNNING (with readiness checks)
   └─ Container process started
   └─ Readiness probe failing initially
   └─ Once /health endpoint responds → Ready
   └─ Pod added to service endpoints
   └─ Container ready to receive traffic
   └─ Duration: Until termination

4. TERMINATING (on update/delete)
   └─ Received termination signal (SIGTERM)
   └─ Process has 30s graceful shutdown period
   └─ After 30s → forceful termination (SIGKILL)
   └─ Pod removed from service endpoints immediately
   └─ New pod starts to replace (rolling update)

5. SUCCEEDED / FAILED / UNKNOWN
   └─ Pod exited (normally or with error)
   └─ Kubelet detects exit code
   └─ If configured to restart → pod restarts (backoff strategy)
   └─ If liveness probe fails → pod is restarted
```

### Helm Template Variables Explained

When Helm renders templates, it has access to multiple variable types:

**Helm Built-in Variables** (`.` context):

```yaml
{{ .Release.Name }}              # "micro-store" (from helm install)
{{ .Release.Namespace }}         # "micro-store" or "staging"
{{ .Chart.Name }}                # "micro-store" (from Chart.yaml)
{{ .Chart.Version }}             # "0.1.0" (from Chart.yaml)
```

**User-Provided Values** (`.Values` object):

```yaml
{{ .Values.common.replicaCount }}           # 1, 2, 3, etc.
{{ .Values.global.environment }}            # "production" or "staging"
{{ .Values.services.auth-service.image }}   # "manushau/auth-service"
```

**Template Functions & Filters**:

```yaml
{{ $value | quote }}        # Wraps value in quotes (for YAML strings)
{{ $value | default "foo" }}  # Use "foo" if $value is empty
{{ include "template" . }}   # Include other template
{{ range .Values.services }}  # Loop over services
{{- if $service.enabled }}    # Conditional (- removes whitespace)
```

### Viewing Generated Kubernetes Manifests

Before applying Helm chart, you can see exactly what manifests will be generated:

```bash
# Generate manifests without applying (dry-run)
helm template micro-store ./helm/micro-store \
  --namespace micro-store \
  --set global.environment=production \
  > generated-manifests.yaml

# View the generated file
cat generated-manifests.yaml | less

# Or directly into kubectl (test without applying)
helm template micro-store ./helm/micro-store \
  --namespace micro-store \
  --set global.environment=production \
  | kubectl apply --dry-run=client -f -
```

**Output Example** (excerpt from generated manifests):

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: micro-store-config
  namespace: micro-store
data:
  NODE_ENV: production
---
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
    metadata:
      labels:
        app: auth-service
    spec:
      imagePullSecrets:
        - name: acr-secret
      containers:
        - name: auth-service
          image: microstoreacr2026.azurecr.io/manushau/auth-service:v1.2.3
          imagePullPolicy: Always
          ports:
            - containerPort: 3001
          env:
            - name: PORT
              value: "3001"
            - name: NODE_ENV
              valueFrom:
                secretKeyRef:
                  name: micro-store-secrets
                  key: NODE_ENV
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: micro-store
spec:
  selector:
    app: auth-service
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP
```

### Pod-to-Pod Communication via Kubernetes DNS

Once pods are running, they communicate using Kubernetes DNS service discovery:

```
┌─────────────────────────────────────────────────────┐
│  Frontend Pod (namespace: micro-store)              │
│                                                     │
│  await fetch("http://api-gateway:8080/products")   │
└──────────────────┬──────────────────────────────────┘
                   │ DNS Lookup
                   ▼
        ┌──────────────────────┐
        │  kube-dns Service    │
        │  (coredns in AKS)    │
        └──────────┬───────────┘
                   │ Returns cluster IP
                   ▼
        ┌──────────────────────┐
        │ api-gateway Service  │
        │ (ClusterIP: 10.x.x.x)│
        └──────────┬───────────┘
                   │ Load balances to
                   ▼
        ┌──────────────────────────────────┐
        │  Pod 1: api-gateway (Nginx)      │
        │  Labels: app=api-gateway         │
        └──────────────────────────────────┘
```

**DNS Format in Kubernetes:**

```
<service-name>.<namespace>.svc.cluster.local:<port>

Examples:
- auth-service.micro-store.svc.cluster.local:3001
- api-gateway.micro-store.svc.cluster.local:8080
- postgres-service.micro-store.svc.cluster.local:5432
```

### Practical: Debugging Pod Creation Issues

**Check if pods are being created:**

```bash
# Watch pods being created in real-time
kubectl get pods -n micro-store -w

# See detailed pod status
kubectl describe pod auth-service-5d4c7f8b -n micro-store

# View pod creation events
kubectl get events -n micro-store --sort-by='.lastTimestamp' | tail -20
```

**Troubleshoot pod startup failures:**

```bash
# Pod stuck in Pending?
kubectl describe pod <pod-name> -n micro-store
# Look for: "Insufficient memory" or "No nodes available"

# Pod failing readiness probe?
kubectl logs pod/<pod-name> -n micro-store
# Check service logs for errors during startup

# Image pull error?
kubectl describe pod <pod-name> -n micro-store
# Look for: "ImagePullBackOff" → check ACR credentials
```

**View Helm release status:**

```bash
# Check if Helm release is deployed
helm list -n micro-store

# Get current Helm release values
helm get values micro-store -n micro-store

# Compare with default values
helm get values micro-store -n micro-store --all

# Check release history
helm history micro-store -n micro-store
```

---

## 🖥️ Local Development (Docker Compose)

### Getting Started

```bash
# Clone repository
git clone <repo-url>
cd microservices-demo

# Copy environment template
cp .env.example .env

# Edit .env with your values
# Important keys to configure:
# - GOOGLE_CLIENT_ID
# - STRIPE_PUBLISHABLE_KEY
# - MONGO_URI
# - AZURE_STORAGE_* (optional for local testing)
```

### Starting Services

```bash
# Start all services (builds images if not present)
docker compose up --build

# Services will be available at:
# Frontend: http://localhost:3000
# API Gateway: http://localhost:8080
# RabbitMQ Management: http://localhost:15672 (guest/guest)
```

### Individual Service Development

```bash
# Terminal 1: Start infrastructure (database, cache, message queue)
docker compose up rabbitmq postgres redis

# Terminal 2: Develop auth-service with hot-reload
cd auth-service
npm install
npm run dev

# Terminal 3: Develop catalog-service
cd catalog-service
npm install
npm run dev

# Terminal 4: Develop frontend
cd frontend
npm install
npm run dev
```

### Running Tests Locally

```bash
# Auth Service tests
cd auth-service
npm install
npm test

# Catalog Service tests
cd catalog-service
npm install
npm test

# Checkout Service tests
cd checkout-service
npm install
npm test

# Cart Service tests
cd cart-service
npm install
npm test
```

### Docker Compose Services

| Service          | Image                 | Port        | Purpose                      |
| ---------------- | --------------------- | ----------- | ---------------------------- |
| rabbitmq         | rabbitmq:3-management | 5672, 15672 | Event bus, message queue     |
| postgres         | postgres:15           | 5432        | User & order database        |
| redis            | redis:7               | 6379        | Cart session cache           |
| api-gateway      | ./api-gateway         | 8080        | Entry point, request routing |
| auth-service     | ./auth-service        | 3001        | Authentication, JWT tokens   |
| catalog-service  | ./catalog-service     | 3002        | Product catalog              |
| cart-service     | ./cart-service        | 3003        | Shopping cart management     |
| checkout-service | ./checkout-service    | 3004        | Order processing, payments   |
| email-service    | ./email-service       | (internal)  | Email notifications          |
| frontend         | ./frontend            | 3000        | Next.js web application      |

### Environment Configuration

**Local .env File** (git-ignored)

```env
# Node Environment
NODE_ENV=development

# PostgreSQL
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
POSTGRES_DB=shopping_site

# MongoDB (required for catalog-service)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/catalog

# RabbitMQ
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest

# Auth & Security
JWT_SECRET=supersecretjwtkey
GOOGLE_CLIENT_ID=your_google_client_id_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# Azure Storage (optional for local dev)
AZURE_STORAGE_ACCOUNT_NAME=microstoreprodimages
AZURE_STORAGE_ACCOUNT_KEY=your_access_key
AZURE_CONTAINER_NAME=product-images

# Frontend Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Troubleshooting Local Development

**Issue**: Port already in use

```bash
# Find process using port (e.g., 8080)
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill process or change port in docker-compose.yml
```

**Issue**: Services can't communicate

```bash
# Check Docker network
docker network ls
docker network inspect microservices-demo_default

# Verify service connectivity
docker exec api-gateway curl http://auth-service:3001/health
```

**Issue**: Database connection errors

```bash
# Check PostgreSQL is running
docker exec postgres psql -U admin -d shopping_site -c "\dt"

# Check MongoDB connection
docker logs catalog-service

# Check Redis
docker exec redis redis-cli ping
```

---

## 🚀 Deployment Guide

### Prerequisites for Cloud Deployment

1. **Azure Account** with active subscription
2. **Terraform 1.3+** installed and configured
3. **Azure CLI** installed and authenticated
4. **Kubectl** configured with AKS cluster access
5. **Helm 3+** installed
6. **GitHub** repository with CI/CD workflow

### Full Deployment Workflow

#### Phase 1: Infrastructure Setup (Terraform)

```bash
cd terraform

# 1. Initialize
terraform init

# 2. Plan
terraform plan -out=tfplan

# 3. Review changes
# Ensure all resources are as expected

# 4. Apply
terraform apply tfplan

# 5. Extract outputs
terraform output > outputs.json
```

#### Phase 2: Configure Kubernetes

```bash
# 1. Get kubeconfig
# (Already generated by Terraform and available as aks_kubeconfig.yaml)

# 2. Set kubeconfig
export KUBECONFIG=$(pwd)/terraform/aks_kubeconfig.yaml

# 3. Verify cluster access
kubectl get nodes

# 4. Create namespaces
kubectl apply -f k8s/namespaces.yaml

# 5. Create secrets
kubectl apply -f k8s/secrets.yaml -n micro-store

# 6. Create ConfigMap
kubectl apply -f k8s/configmap.yaml -n micro-store
```

#### Phase 3: Deploy via Helm

```bash
# 1. Add Helm repository (if using external charts)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 2. Install micro-store chart
helm install micro-store ./helm/micro-store \
  --namespace micro-store \
  --create-namespace \
  --set global.environment=production

# 3. Verify deployment
helm status micro-store -n micro-store
kubectl get pods -n micro-store
kubectl get services -n micro-store

# 4. Test endpoint
kubectl port-forward svc/api-gateway 8080:8080 -n micro-store
# Then: curl http://localhost:8080/gateway/health
```

#### Phase 4: Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n micro-store

# Check services
kubectl get svc -n micro-store

# Check ingress
kubectl get ingress -n micro-store

# View logs
kubectl logs -f deployment/frontend -n micro-store

# Test application
# Production: http://prod.48.216.152.209.nip.io
# Staging: http://staging.48.216.152.209.nip.io
```

### Zero-Downtime Deployments

The platform uses **RollingUpdate** strategy for zero-downtime deployments:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1 # 1 additional pod during update
    maxUnavailable: 0 # 0 pods can be unavailable
```

**During Update**:

1. Kubernetes creates new pod with updated image
2. New pod must pass readiness probe
3. Old pod continues serving traffic
4. Once new pod is ready, traffic shifts
5. Old pod is terminated
6. Process repeats for each pod

### Scaling Deployments

```bash
# Manual scaling
kubectl scale deployment frontend --replicas=3 -n micro-store

# Horizontal Pod Autoscaling
kubectl autoscale deployment frontend --min=2 --max=5 --cpu-percent=80 -n micro-store

# View HPA status
kubectl get hpa -n micro-store
```

---

## 📊 Microservices Documentation

### Service Details

#### Frontend (Next.js 16)

**Port**: 3000 (internal), exposed via Ingress

**Endpoints**:

- `/` - Home page
- `/login` - User login page
- `/register` - User registration page
- `/products` - Product catalog
- `/products/[id]` - Product details
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/order-confirmation/[id]` - Order confirmation
- `/profile` - User profile
- `/admin` - Admin dashboard

**Environment Variables**:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080  # API Gateway URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Stripe public key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

**Features**:

- Server-side rendering (SSR)
- Google OAuth 2.0 integration
- Stripe payment integration
- Responsive design with Tailwind CSS
- Real-time cart updates

---

#### API Gateway (Nginx)

**Port**: 8080

**Health Endpoint**: `/gateway/health`

**Routing Rules**:

```
/auth/*              → http://auth-service:3001/*
/products/*          → http://catalog-service:3002/*
/cart/*              → http://cart-service:3003/*
/checkout/*          → http://checkout-service:3004/*
/gateway/health      → Returns 200 OK
```

**Configuration**: `api-gateway/nginx.conf`

**Security**:

- CORS enabled for frontend domain
- Request size limit: 10MB
- Timeout: 60s

---

#### Auth Service (Node.js/Express)

**Port**: 3001

**Health Endpoint**: `/health`

**Database**: PostgreSQL

**Endpoints**:

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login (returns JWT)
- `POST /auth/google` - Google OAuth callback
- `GET /auth/verify` - Verify JWT token
- `GET /auth/user/:id` - Get user details
- `GET /health` - Health check

**Environment Variables**:

```env
PORT=3001
POSTGRES_HOST=postgres  # Database host
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
POSTGRES_DB=shopping_site
JWT_SECRET=supersecretjwtkey
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
NODE_ENV=development
```

**Test Coverage**: `tests/auth.test.js`

- User registration
- Login functionality
- Google OAuth flow
- JWT token validation

---

#### Catalog Service (Node.js/Express + MongoDB)

**Port**: 3002

**Health Endpoint**: `/health`

**Database**: MongoDB

**Endpoints**:

- `GET /products` - List all products
- `GET /products/:id` - Get product details
- `POST /products` - Create product (admin)
- `PUT /products/:id` - Update product (admin)
- `DELETE /products/:id` - Delete product (admin)
- `GET /categories` - List categories
- `GET /health` - Health check

**Environment Variables**:

```env
PORT=3002
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/catalog
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
AZURE_STORAGE_ACCOUNT_NAME=microstoreprodimages
AZURE_STORAGE_ACCOUNT_KEY=xxxxx
AZURE_CONTAINER_NAME=product-images
NODE_ENV=development
```

**Features**:

- Product image storage in Azure Blob Storage
- Inventory tracking
- Category management
- Event publishing for inventory updates

**Test Coverage**: `tests/catalog.test.js`

- Product CRUD operations
- Category listing
- Inventory validation

---

#### Cart Service (Node.js/Express + Redis)

**Port**: 3003

**Health Endpoint**: `/health`

**Database**: Redis (in-memory, session-based)

**Endpoints**:

- `GET /cart/:userId` - Get user's cart
- `POST /cart/:userId/add` - Add item to cart
- `PUT /cart/:userId/update/:itemId` - Update item quantity
- `DELETE /cart/:userId/items/:itemId` - Remove item
- `DELETE /cart/:userId` - Clear cart
- `GET /health` - Health check

**Environment Variables**:

```env
PORT=3003
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
NODE_ENV=development
```

**Features**:

- Session-based cart storage
- TTL: 24 hours
- High-performance KV operations
- Automatic cleanup of expired sessions

**Test Coverage**: `tests/cart.test.js`

- Add/remove items
- Cart persistence
- Session management

---

#### Checkout Service (Node.js/Express + PostgreSQL + Stripe)

**Port**: 3004

**Health Endpoint**: `/health`

**Database**: PostgreSQL

**Endpoints**:

- `POST /checkout/process` - Process payment
- `GET /orders/:orderId` - Get order details
- `GET /orders/user/:userId` - List user's orders
- `PUT /orders/:orderId/cancel` - Cancel order
- `GET /health` - Health check

**Environment Variables**:

```env
PORT=3004
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
POSTGRES_DB=shopping_site
STRIPE_SECRET_KEY=sk_test_xxxxx
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
JWT_SECRET=supersecretjwtkey
NODE_ENV=development
```

**Features**:

- Stripe payment processing
- Order persistence
- Event publishing (order.placed)
- Payment confirmation

**Test Coverage**: `tests/checkout.test.js`

- Payment processing
- Order creation
- Transaction validation

---

#### Email Service (Node.js/Express + RabbitMQ)

**Port**: Listener only (no HTTP endpoints)

**Health**: N/A

**Event Consumer**:

- Listens on: `shopping_exchange` → `email_queue`
- Routing Key: `order.placed`

**Functionality**:

- Consumes order.placed events
- Sends order confirmation emails via SMTP
- Handles email delivery errors
- Retry mechanism on failure

**Environment Variables**:

```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
SMTP_HOST=smtp.gmail.com (or configured SMTP server)
SMTP_PORT=587
SMTP_USER=noreply@microshop.com
SMTP_PASSWORD=xxxxx
NODE_ENV=development
```

**Test Coverage**: `tests/email.test.js` (if available)

- Event consumption
- Email formatting
- Error handling

---

### Microservice Port Mapping

```
External Access (via Ingress/LoadBalancer):
  - http://localhost:8080 → API Gateway (Nginx)
  - http://localhost:3000 → Frontend (Next.js)

Internal Service-to-Service (via DNS within Kubernetes):
  - auth-service:3001         (Authentication)
  - catalog-service:3002      (Product Catalog)
  - cart-service:3003         (Shopping Cart)
  - checkout-service:3004     (Order Processing)
  - email-service:(internal)  (Event Listener)

Backing Services:
  - rabbitmq:5672             (AMQP)
  - postgres:5432             (SQL Database)
  - redis:6379                (In-Memory Cache)
```

---

## 🔍 Monitoring & Troubleshooting

### Azure Monitoring

**Azure Monitor Components**:

- **Application Insights**: App performance metrics
- **Log Analytics**: Centralized logging
- **Azure Monitor Alerts**: Threshold-based notifications
- **Container Insights**: Kubernetes cluster monitoring

**Accessing Dashboards**:

```bash
# Navigate to Azure Portal
# Resource Groups → micro-store-rg → micro-store-aks → Insights
```

### Prometheus & Grafana

**Port**: Grafana runs on `http://localhost:3090` (if deployed locally)

**Metrics Collected**:

- Pod CPU usage, memory usage
- Network I/O
- Container restart counts
- API request latency
- Error rates

### Kubernetes Monitoring

```bash
# View pod status
kubectl get pods -n micro-store

# Check pod logs
kubectl logs -f deployment/frontend -n micro-store

# Describe pod for events
kubectl describe pod <pod-name> -n micro-store

# Check resource usage
kubectl top nodes
kubectl top pods -n micro-store

# View events
kubectl get events -n micro-store --sort-by='.lastTimestamp'
```

### Common Issues & Resolution

**Issue**: Pod stuck in pending state

```bash
# Check node resources
kubectl describe nodes

# Check resource requests/limits
kubectl describe pod <pod-name> -n micro-store

# May need to scale cluster or adjust resource requests
```

**Issue**: Service unreachable

```bash
# Check service exists
kubectl get svc -n micro-store

# Check ingress rules
kubectl get ingress -n micro-store

# Test connectivity from within cluster
kubectl run -it --rm debug --image=busybox -- sh
# Inside pod: wget http://api-gateway:8080/gateway/health
```

**Issue**: Database connection errors

```bash
# Verify secrets are created
kubectl get secrets -n micro-store

# Check database credentials
kubectl get secret micro-store-secrets -n micro-store -o yaml

# Test PostgreSQL connection
kubectl run -it --rm postgres-client --image=postgres -- psql \
  -h postgres-service -U admin -d shopping_site
```

**Issue**: Helm deployment fails

```bash
# Check previous deployments
helm history micro-store -n micro-store

# Rollback to working version
helm rollback micro-store 1 -n micro-store

# Check Helm chart syntax
helm lint ./helm/micro-store

# Dry-run to see what would be deployed
helm install micro-store ./helm/micro-store --namespace micro-store --dry-run
```

---

## 👥 Contributing

Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

### Quick Contributing Guide

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature
   ```

2. **Develop & Test**

   ```bash
   npm install && npm test
   ```

3. **Commit with descriptive message**

   ```bash
   git commit -m "feat: add new feature"
   ```

4. **Push & Create Pull Request**

   ```bash
   git push origin feature/your-feature
   ```

5. **CI/CD Pipeline runs automatically**
   - Tests execute
   - Docker images build
   - Staging deployment
   - Production deployment (upon approval)

---

## 📚 Additional Resources

- [System Architecture Deep Dive](ARCHITECTURE.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Terraform Documentation](terraform/README.md)
- [Helm Chart Documentation](helm/micro-store/README.md)
- [Frontend Setup](frontend/README.md)

---

## 🔒 Security Considerations

- **Secrets**: All sensitive data stored in Kubernetes Secrets, never in ConfigMaps
- **Network Policies**: Restrict inter-pod communication to necessary paths only
- **RBAC**: Role-based access control for Kubernetes cluster operations
- **SSL/TLS**: All external traffic encrypted via Azure Load Balancer
- **Image Scanning**: ACR scans images for CVE vulnerabilities
- **Backup**: Automated backups for PostgreSQL and MongoDB

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🤝 Support

For issues, feature requests, or questions:

1. Check existing GitHub Issues
2. Create a new Issue with detailed information
3. Contact the team through project communication channels

---

**Last Updated**: April 28, 2026
**Version**: 2.0
**Maintained By**: Cloud Engineering Team
**Status**: Production Ready ✅

```bash
helm upgrade --install micro-store ./helm/micro-store \
  --namespace micro-store \
  --create-namespace \
  --set global.environment=production
```

---

## 🧪 Local Development (Docker Compose)

For quick local testing without Azure:

1. Populate the root `.env` file using `.env.example` as a reference.
2. Spin up the stack:
   ```bash
   docker compose up --build
   ```
3. Access services:
   - Frontend: `http://localhost:3000`
   - Gateway: `http://localhost:8080`
   - RabbitMQ UI: `http://localhost:15672` (guest/guest)

---

## 📚 Documentation Directory

For deeper technical insights, please review the following documents:

- [ARCHITECTURE.md](./ARCHITECTURE.md): Deep dive into data flow, event-driven architecture, and database schemas.
- [CONTRIBUTING.md](./CONTRIBUTING.md): Guidelines for branching, testing, and triggering CI/CD.

---

_Maintained by the Cloud Engineering Team_
