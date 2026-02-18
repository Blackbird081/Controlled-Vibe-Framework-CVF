# AGT-030: Cloud Deployment Strategist

## Governance Metadata
- **ID:** AGT-030
- **Name:** Cloud Deployment Strategist
- **Version:** 1.0.0
- **Risk Level:** R2 — Supervised (infrastructure changes, cost implications)
- **Authority:** Orchestrator, DevOps Builder
- **Phase:** Deployment, Operations
- **Dependencies:** AGT-025 (API Architecture), AGT-026 (Testing — CI gates), AGT-027 (Security)
- **Provenance:** Extracted from claudekit-skills/devops (Cloudflare/Docker/GCP/K8s patterns), rewritten to CVF governance

---

## Purpose

Comprehensive deployment methodology covering **platform selection**, **containerization**, **orchestration**, and **GitOps workflows**. Provides decision trees for choosing the right infrastructure and deployment patterns for any application.

---

## Platform Selection Decision Tree

```
Need sub-50ms global latency? ──Yes──→ Cloudflare Workers (Edge)
         │No
Stateless HTTP service? ──Yes──→ Cloud Run (Serverless containers)
         │No
Need container orchestration? ──Yes──→ Kubernetes (GKE/EKS/AKS)
         │No
Static site + API? ──Yes──→ Cloudflare Pages + Workers
         │No
Simple containerized app? ──Yes──→ Docker Compose (VPS/VM)
         │No
Managed database needed? ──Yes──→ Cloud SQL / RDS
         │No
Key-value/cache? ──Yes──→ Cloudflare KV / Redis
```

---

## Platform Comparison Matrix

| Need | Platform | Latency | Cost Model | Scaling |
|------|----------|---------|-----------|---------|
| Edge compute | Cloudflare Workers | <50ms global | Per-request | Automatic |
| Large file storage | Cloudflare R2 | Medium | Zero egress | Automatic |
| SQL at edge | Cloudflare D1 | Low | Per-query | Automatic |
| Containerized workloads | Docker + Cloud Run | Medium | Per-second | Auto 0→N |
| Enterprise K8s | GKE/EKS | Configurable | Node-based | HPA/VPA |
| Managed relational DB | Cloud SQL/RDS | Low-Medium | Instance-based | Vertical/Read replicas |
| Static site + API | Cloudflare Pages | <50ms | Free tier generous | Automatic |
| Package management (K8s) | Helm | N/A | Free | N/A |

---

## Containerization Strategy

### Dockerfile Decision Tree
```
Is it a Node.js/Python app?
├─ Yes → Multi-stage build (builder + runtime)
│        Use slim/alpine base image
│        Non-root user (USER node / USER appuser)
│        .dockerignore for node_modules, .git, .env
└─ No (Go/Rust) → Multi-stage with scratch/distroless final

Need system deps?
├─ Yes → Use debian-slim, install in builder stage
└─ No  → Use alpine or distroless
```

### Multi-Stage Build Pattern (Node.js)
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules /prod_modules
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
COPY --from=builder /prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json .
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

### Docker Security Checklist
- [ ] Non-root user in final stage
- [ ] No secrets in image layers (use runtime env vars)
- [ ] Pin base image versions (e.g., `node:20.11-alpine`)
- [ ] Scan with `docker scout` or `trivy`
- [ ] Read-only filesystem where possible
- [ ] Resource limits defined (CPU, memory)

---

## Kubernetes Deployment Patterns

### Deployment Strategy Selection
| Strategy | When | Risk | Rollback |
|----------|------|------|----------|
| **Rolling Update** | Default, most apps | Low | Automatic |
| **Blue-Green** | Zero-downtime required | Medium | Instant switch |
| **Canary** | High-risk changes, gradual validation | Low | Stop canary |
| **Recreate** | Non-critical, accepts downtime | High | Manual redeploy |

### Essential K8s Resources
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: my-app
  template:
    spec:
      containers:
      - name: my-app
        image: registry/my-app:v1.2.3
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
```

---

## GitOps Workflow

### GitOps Decision Tree
```
Team size > 5 developers? ──Yes──→ ArgoCD (UI, RBAC, multi-cluster)
         │No
Simple single-cluster? ──Yes──→ Flux (lightweight, Git-native)
         │No
Need approval gates? ──Yes──→ ArgoCD with sync policies
```

### GitOps Repository Structure
```
infra/
├── base/                    # Base manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── dev/                 # Dev overrides
│   │   ├── replicas-patch.yaml
│   │   └── kustomization.yaml
│   ├── staging/             # Staging overrides
│   │   ├── replicas-patch.yaml
│   │   └── kustomization.yaml
│   └── prod/                # Production overrides
│       ├── replicas-patch.yaml
│       ├── hpa.yaml
│       └── kustomization.yaml
└── argocd/
    └── application.yaml     # ArgoCD app definition
```

---

## CI/CD Pipeline Integration

### Pipeline Stages
```
Code Push → Lint → Test → Build Image → Scan → Push Registry → Update Manifest → Deploy
           Gate 1   Gate 2   Gate 3      Gate 4                  Gate 5           Gate 6
```

| Gate | Check | Blocks |
|------|-------|--------|
| Gate 1 | Lint + type check pass | Build |
| Gate 2 | Tests pass (AGT-026 pyramid) | Image build |
| Gate 3 | Dockerfile builds successfully | Security scan |
| Gate 4 | No critical/high CVEs | Registry push |
| Gate 5 | Image pushed, tag immutable | Manifest update |
| Gate 6 | Health check passes in target env | Traffic switch |

---

## Edge Deployment (Cloudflare Workers)

### Worker Pattern
```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Route handling
    if (url.pathname === '/api/data') {
      // Check KV cache first
      const cached = await env.CACHE.get('data-key');
      if (cached) return new Response(cached, { headers: { 'Content-Type': 'application/json' } });

      // Fetch from origin, cache in KV
      const data = await fetchOrigin(env);
      await env.CACHE.put('data-key', JSON.stringify(data), { expirationTtl: 3600 });
      return new Response(JSON.stringify(data));
    }

    return new Response('Not Found', { status: 404 });
  }
};
```

---

## Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Store secrets in Dockerfile/image | Use runtime env vars or secret managers |
| Use `latest` tag in production | Pin specific version tags (v1.2.3) |
| Deploy directly from CI without staging | Progressive: dev → staging → prod |
| Skip health checks | Always define liveness + readiness probes |
| Single replica in production | Minimum 2 replicas with PDB |
| Manual kubectl apply in prod | GitOps with automated sync |

---

## Implementation Checklist

- [ ] Choose platform based on decision tree
- [ ] Create multi-stage Dockerfile with security best practices
- [ ] Define resource requests/limits
- [ ] Set up health check endpoints (/health, /ready)
- [ ] Configure deployment strategy (rolling/blue-green/canary)
- [ ] Set up GitOps repository structure
- [ ] Define CI/CD pipeline with quality gates
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation
- [ ] Document rollback procedures
- [ ] Test disaster recovery plan

---

## Constraints
- Infrastructure changes MUST be reviewed by Orchestrator (R2)
- Production deployments require passing ALL CI gates
- Cost implications must be estimated before scaling decisions
- Secrets must NEVER be committed to Git or baked into images
