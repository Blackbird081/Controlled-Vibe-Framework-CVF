# 🚀 Deployment

**CVF v1.5 — Web Interface Implementation**

---

## Deployment Options

| Platform | Pros | Cons | Cost |
|----------|------|------|------|
| **Vercel** | Easy, auto-deploy | Limited backend | Free tier |
| **Netlify** | Similar to Vercel | Limited backend | Free tier |
| **Railway** | Full backend | More complex | Pay-as-you-go |
| **Docker** | Full control | Self-managed | Self-hosted |

---

## Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd cvf-web
vercel

# Production
vercel --prod
```

**Environment Variables:**
```
Settings → Environment Variables
→ CVF_SDK_URL = https://api.cvf.example.com
→ CVF_API_KEY = xxx
```

---

## Docker

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  cvf-web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - CVF_SDK_URL=http://cvf-sdk:8000
      - CVF_API_KEY=${CVF_API_KEY}
```

---

## CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          vercel-args: '--prod'
```

---

## Domain Setup

1. Add custom domain in Vercel/Netlify
2. Update DNS records
3. Enable HTTPS (automatic)

---

## Monitoring

| Tool | Purpose |
|------|---------|
| Vercel Analytics | Usage metrics |
| Sentry | Error tracking |
| Posthog | User analytics |

---

*Deployment — CVF v1.5 Web Interface*
