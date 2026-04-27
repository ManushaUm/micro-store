# Contributing to Micro Shop 🛠️

Thank you for your interest in contributing to the Micro Shop repository! We follow strict GitOps and automated CI/CD practices. Please adhere to the following guidelines.

## 1. Branching Strategy

We use a simplified Trunk-Based Development workflow.
- **Main Branch**: `main` is always stable and deployable.
- **Feature Branches**: Create a branch off `main` for your work. Use the format: `feature/<your-feature>` or `bugfix/<issue>`.

```bash
git checkout main
git pull origin main
git checkout -b feature/add-wishlist
```

## 2. Local Development

You do not need Kubernetes running locally to develop features.
1. Duplicate `.env.example` to `.env` and fill in the required keys.
2. Spin up the infrastructure via Docker Compose:
   ```bash
   docker compose up --build
   ```
3. Your code changes will automatically restart the Node.js services via `nodemon` and hot-reload the Next.js frontend via Turbopack.

## 3. Testing Requirements

**All new features must include unit tests.**
We use `Jest` for backend services. Before committing your code, run the tests locally to ensure you haven't broken existing functionality.

```bash
cd catalog-service
npm run test
```

## 4. The CI/CD Pipeline

When you push your feature branch and open a Pull Request (or push directly to `main`), GitHub Actions takes over.

**The pipeline will:**
1. Run `npm test` across all services. **If tests fail, the build fails.**
2. Build new Docker images and push them to Azure Container Registry (ACR).
3. Use Helm to deploy your changes to the **Staging** environment.

### Staging Verification
Once the pipeline deploys to staging, navigate to the Staging URL and verify your changes. 
If staging looks good, the code will be automatically (or manually, depending on branch protection) promoted to Production.

## 5. Adding New Dependencies

If you add an `npm` package, make sure you rebuild your Docker container locally before pushing, to verify the `Dockerfile` succeeds with the new dependency.

```bash
# Example
docker build -t test-build ./catalog-service
```
