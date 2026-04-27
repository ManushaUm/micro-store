# Micro Shop - Enterprise Cloud Architecture 🚀

[![Build Status](https://github.com/ManushaUm/micro-store/actions/workflows/ci-cd.yaml/badge.svg)](https://github.com/ManushaUm/micro-store/actions/workflows/ci-cd.yaml)
![Architecture Diagram](https://img.shields.io/badge/Architecture-Microservices-blue)
![Platform](https://img.shields.io/badge/Platform-Azure_AKS-0078D4)
![IAC](https://img.shields.io/badge/IAC-Terraform-623CE4)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF)
![Deployment](https://img.shields.io/badge/Deployment-Helm-0F1689)
![Frontend](https://img.shields.io/badge/Frontend-Next.js_15-black)

A modern, full-stack microservices e-commerce platform designed for high availability, zero-downtime deployments, and cloud-native scalability. 

## 📑 Table of Contents
- [Cloud Architecture](#-cloud-architecture)
- [CI/CD & DevOps Pipeline](#-cicd--devops-pipeline)
- [Live Access](#-live-access-current-deployment)
- [Infrastructure as Code (Terraform)](#-infrastructure-as-code)
- [Helm & Kubernetes Deployment](#-helm--kubernetes-deployment)
- [Local Development](#-local-development-docker-compose)
- [Documentation Directory](#-documentation-directory)

---

## 🏗️ Cloud Architecture

This application utilizes a robust Azure-native ecosystem combined with open-source container orchestration.

### Infrastructure (Azure)
- **AKS Cluster**: Managed Kubernetes cluster (`Standard_DC2s_v3`) in `eastus`.
- **Azure Container Registry (ACR)**: Secure, private Docker registry for hosting all microservice images.
- **Azure Cache for Redis**: High-performance managed cache for real-time Cart management.
- **Azure Blob Storage**: Scalable object storage for product image hosting.
- **Monitoring**: Azure Monitor for Containers (Prometheus & Grafana integrated).

### Microservices
- **Frontend** (Next.js 15): SSR/Client app exposed via Public Load Balancer.
- **API Gateway** (Nginx): Central entry point for all API traffic, handling routing and CORS.
- **Auth Service** (Postgres): JWT-based authentication and Google OAuth 2.0 integration.
- **Catalog Service** (MongoDB): Manages products, categories, and inventory.
- **Cart Service** (Redis): Low-latency shopping cart state management.
- **Checkout Service** (Postgres + Stripe): Handles secure payments and order processing.
- **Email Service** (SMTP + RabbitMQ): Async order confirmations triggered via event bus.

---

## 🔄 CI/CD & DevOps Pipeline

We employ a strict GitOps methodology powered by **GitHub Actions** (`.github/workflows/ci-cd.yaml`).

1. **Automated Testing**: Every push triggers `npm test` across all Node.js microservices (Jest).
2. **ACR Build & Push**: Docker images are built and pushed to Azure Container Registry using the Git commit hash as the tag.
3. **Staging Rollout**: Images are automatically deployed to the `staging` namespace in AKS using Helm.
4. **Production Rollout**: Upon staging verification, Helm upgrades the `micro-store` production namespace.
5. **Zero-Downtime**: Our dynamic Helm templates enforce `RollingUpdate` strategies with strict `readinessProbes` and `livenessProbes`.

---

## 🚀 Live Access (Current Deployment)

The application is currently live on AKS across two environments.

- **Production Storefront**: [http://prod.48.216.152.209.nip.io](http://prod.48.216.152.209.nip.io)
- **Staging Storefront**: [http://staging.48.216.152.209.nip.io](http://staging.48.216.152.209.nip.io)
- **API Gateway**: Handled automatically via host-based routing (no separate IP needed).

---

## 🛠️ Infrastructure as Code

The entire cloud environment is provisioned using **Terraform**.

### Setup Instructions
1. Navigate to the terraform directory:
   ```bash
   cd terraform
   ```
2. Initialize and apply:
   ```bash
   terraform init
   terraform apply -var-file="terraform.tfvars"
   ```
3. Retrieve the kubeconfig to manage the cluster:
   ```bash
   $env:KUBECONFIG=(Resolve-Path .\aks_kubeconfig.yaml).Path
   ```

---

## ☸️ Helm & Kubernetes Deployment

We manage all Kubernetes resources dynamically via Helm. Static manifests (`/k8s`) are deprecated in favor of our centralized chart.

### Deploying Locally/Manually
1. Setup Secrets (Use the template provided):
   ```bash
   cp k8s/secrets.example.yaml k8s/secrets.yaml
   # Edit secrets.yaml with your actual keys
   kubectl apply -f k8s/secrets.yaml -n micro-store
   ```
2. Install via Helm:
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
*Maintained by the Cloud Engineering Team*
