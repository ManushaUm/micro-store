# Catalog Service 📦

## Overview

The **Catalog Service** manages the product catalog, including product information, inventory, categories, and product images stored in Azure Blob Storage. It uses MongoDB for flexible document-based storage and integrates with Azure Cloud Storage for image management.

## Purpose

- **Product Management**: CRUD operations for products
- **Category Management**: Organize products by categories
- **Inventory Tracking**: Monitor stock levels
- **Image Storage**: Upload and retrieve product images from Azure Blob Storage
- **Search & Filter**: Query products with flexible criteria
- **Event Publishing**: Publish inventory update events

## Architecture

```
Frontend/API Gateway
         │
         ▼
   ┌─────────────────┐
   │ Catalog Service │
   │ (Node/Express)  │
   │    :3002        │
   └────────┬────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
[MongoDB]    [Azure Storage]
 (Catalog)    (Images Blob)
    │               │
    └───────────────┘
         │
         ▼
   [RabbitMQ Events]
   (inventory.updated)
```

## Deployment Information

### Port

- **Container Port**: 3002
- **Service Port**: 3002 (Kubernetes ClusterIP)
- **Health Endpoint**: `/health`

### Docker Image

- **Registry**: Azure Container Registry (ACR)
- **Image**: `microstoreacr2026.azurecr.io/manushau/catalog-service`
- **Tag**: Latest (overridden by CI/CD with commit SHA)

## API Endpoints

### List All Products

```http
GET /products?page=1&limit=10&category=electronics&search=laptop

Query Parameters:
  page: Page number (default: 1)
  limit: Results per page (default: 10)
  category: Filter by category (optional)
  search: Search in product name/description (optional)

Response (200):
{
  "products": [
    {
      "id": "product-uuid",
      "name": "Laptop",
      "description": "High-performance laptop",
      "price": 999.99,
      "category": "electronics",
      "inventory": {
        "quantity": 50,
        "sku": "LAP-001"
      },
      "image": "https://microstoreprodimages.blob.core.windows.net/product-images/lap-001.jpg",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

### Get Product Details

```http
GET /products/:id

Response (200):
{
  "id": "product-uuid",
  "name": "Laptop",
  "description": "Detailed description",
  "price": 999.99,
  "category": "electronics",
  "inventory": {
    "quantity": 50,
    "sku": "LAP-001",
    "warehouseLocation": "A-10-5"
  },
  "images": [
    "https://microstoreprodimages.blob.core.windows.net/product-images/lap-001.jpg",
    "https://microstoreprodimages.blob.core.windows.net/product-images/lap-002.jpg"
  ],
  "specifications": {
    "processor": "Intel i7",
    "ram": "16GB",
    "storage": "512GB SSD"
  },
  "reviews": [],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Create Product (Admin)

```http
POST /products

Headers:
  Authorization: Bearer admin_jwt_token
  Content-Type: application/json

Body:
{
  "name": "New Laptop",
  "description": "High-performance laptop",
  "price": 1299.99,
  "category": "electronics",
  "inventory": {
    "quantity": 100,
    "sku": "LAP-002"
  },
  "specifications": {
    "processor": "Intel i9",
    "ram": "32GB"
  }
}

Response (201):
{
  "id": "new-product-uuid",
  "name": "New Laptop",
  "price": 1299.99
}
```

### Update Product (Admin)

```http
PUT /products/:id

Headers:
  Authorization: Bearer admin_jwt_token
  Content-Type: application/json

Body:
{
  "price": 1199.99,
  "inventory": {
    "quantity": 75
  }
}

Response (200):
{
  "message": "Product updated"
}
```

### Delete Product (Admin)

```http
DELETE /products/:id

Headers:
  Authorization: Bearer admin_jwt_token

Response (200):
{
  "message": "Product deleted"
}
```

### Upload Product Image

```http
POST /products/:id/image

Headers:
  Authorization: Bearer admin_jwt_token
  Content-Type: multipart/form-data

Body:
  file: <binary image file>

Response (200):
{
  "imageUrl": "https://microstoreprodimages.blob.core.windows.net/product-images/lap-001-uuid.jpg"
}
```

### List Categories

```http
GET /categories

Response (200):
{
  "categories": [
    {
      "id": "category-uuid",
      "name": "Electronics",
      "description": "Electronic products",
      "productCount": 42
    },
    {
      "id": "category-uuid-2",
      "name": "Clothing",
      "description": "Apparel and accessories",
      "productCount": 156
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
  "service": "catalog-service",
  "mongodb": "connected",
  "azureStorage": "connected"
}
```

## Environment Variables

```env
# Server Configuration
PORT=3002
NODE_ENV=development|production

# MongoDB (Document Database)
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/catalog

# Azure Storage (Product Images)
AZURE_STORAGE_ACCOUNT_NAME=microstoreprodimages
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key
AZURE_CONTAINER_NAME=product-images

# Message Queue (RabbitMQ)
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# Pagination
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100

# File Upload
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp

# Logging
LOG_LEVEL=debug|info|warn|error
```

## Database Schema (MongoDB)

### Products Collection

```javascript
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "price", "category", "inventory"],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string", minLength: 3 },
        description: { bsonType: "string" },
        price: { bsonType: "decimal", minimum: 0 },
        category: {
          bsonType: "objectId",
          description: "Reference to category",
        },
        inventory: {
          bsonType: "object",
          properties: {
            quantity: { bsonType: "int", minimum: 0 },
            sku: { bsonType: "string" },
            warehouseLocation: { bsonType: "string" },
          },
        },
        images: { bsonType: "array", items: { bsonType: "string" } },
        specifications: { bsonType: "object" },
        rating: { bsonType: "decimal", minimum: 0, maximum: 5 },
        reviews: { bsonType: "array" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
});

// Create indexes
db.products.createIndex({ name: "text", description: "text" });
db.products.createIndex({ category: 1 });
db.products.createIndex({ "inventory.sku": 1 }, { unique: true });
db.products.createIndex({ createdAt: -1 });
```

### Categories Collection

```javascript
db.createCollection("categories", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name"],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string", minLength: 3 },
        description: { bsonType: "string" },
        parentCategory: { bsonType: "objectId" },
        createdAt: { bsonType: "date" },
      },
    },
  },
});

db.categories.createIndex({ name: 1 }, { unique: true });
```

## Kubernetes Deployment

### Helm Values

```yaml
catalog-service:
  enabled: true
  useRegistry: true
  image: "manushau/catalog-service"
  tag: "latest" # Overridden by CI/CD
  containerPort: 3002
  servicePort: 3002
  env:
    PORT: "3002"
    AZURE_CONTAINER_NAME: "product-images"
```

### Secrets Configuration

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: catalog-secrets
  namespace: micro-store
type: Opaque
stringData:
  MONGO_URI: mongodb+srv://user:pass@cluster.mongodb.net/catalog
  AZURE_STORAGE_ACCOUNT_KEY: your_key_here
  RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
```

## Deployment Guide

### Local Development

```bash
# Install dependencies
cd catalog-service
npm install

# Configure environment
cp .env.example .env
# Edit .env with MongoDB URI and Azure credentials

# Seed initial data (optional)
npm run seed

# Start service
npm start
# Or with hot-reload
npm run dev
```

### Docker Compose

```bash
# Start catalog service with MongoDB
docker compose up catalog-service

# Test health endpoint
curl http://localhost:3002/health

# Get all products
curl http://localhost:3002/products
```

### Kubernetes/Helm

```bash
# Deploy via Helm
helm install micro-store ./helm/micro-store \
  --namespace micro-store \
  --set services.catalog-service.tag=v1.2.3

# Verify deployment
kubectl get pods -n micro-store | grep catalog-service
kubectl logs -f deployment/catalog-service -n micro-store

# Port forward for testing
kubectl port-forward svc/catalog-service 3002:3002 -n micro-store
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
curl http://localhost:3002/health

# List products
curl http://localhost:3002/products

# Get product details
curl http://localhost:3002/products/product-id

# List categories
curl http://localhost:3002/categories

# Create product (requires admin token)
curl -X POST http://localhost:3002/products \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Product","price":99.99,"category":"id"}'

# Upload image
curl -X POST http://localhost:3002/products/id/image \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "file=@image.jpg"
```

## Monitoring & Troubleshooting

### View Logs

```bash
# Local
npm start  # Logs in console

# Docker
docker logs -f catalog-service

# Kubernetes
kubectl logs -f deployment/catalog-service -n micro-store
```

### Common Issues

**Issue**: MongoDB connection error

```
Error: MongoServerError: connect ECONNREFUSED
```

- **Solution**: Verify MongoDB URI and MongoDB is running
  ```bash
  docker compose up mongodb
  # Or check MongoDB Atlas connection
  ```

**Issue**: Azure Storage authentication error

```
Error: AuthorizationPermissionMismatch
```

- **Solution**: Verify Azure storage credentials
  ```bash
  export AZURE_STORAGE_ACCOUNT_KEY=correct_key
  npm start
  ```

**Issue**: Image upload fails

```
Error: Container not found
```

- **Solution**: Ensure Azure storage container exists
  ```bash
  az storage container exists --name product-images --account-name microstoreprodimages
  ```

## Seeding Data

```bash
# Seed sample products and categories
npm run seed

# Or manually insert sample data
node scripts/seed.js
```

## Performance Optimization

- **Indexing**: Ensure all frequently searched fields are indexed
- **Pagination**: Use limit/offset for large result sets
- **Caching**: Cache category list (changes infrequently)
- **Image Optimization**: Resize/compress images before upload

## Azure Blob Storage Integration

### Configuration

1. Create storage account: `microstoreprodimages`
2. Create container: `product-images`
3. Set CORS policy to allow image access from frontend

### Image URL Format

```
https://<storage-account>.blob.core.windows.net/<container>/<blob-name>
https://microstoreprodimages.blob.core.windows.net/product-images/laptop-001.jpg
```

### Cleanup Old Images

```bash
# Manual cleanup script
npm run cleanup:images

# Or via Azure CLI
az storage blob delete-batch \
  --source product-images \
  --account-name microstoreprodimages \
  --filter "*.jpg" \
  --auth-mode login
```

## Related Services

- 🌐 [API Gateway](../api-gateway/README.md)
- 🔐 [Auth Service](../auth-service/README.md)
- 🛒 [Cart Service](../cart-service/README.md)
- 💳 [Checkout Service](../checkout-service/README.md)

## Version History

| Version | Date       | Changes                     |
| ------- | ---------- | --------------------------- |
| 1.0.0   | 2024-01-15 | Initial release             |
| 1.1.0   | 2024-02-10 | Added Azure Blob Storage    |
| 1.2.0   | 2024-03-15 | Improved search & filtering |

## Support & Documentation

- **Source Code**: `catalog-service/index.js`, `catalog-service/Product.js`
- **Tests**: `catalog-service/tests/catalog.test.js`
- **Seeding**: `catalog-service/seed.js`
- **Main README**: [../README.md](../README.md)
