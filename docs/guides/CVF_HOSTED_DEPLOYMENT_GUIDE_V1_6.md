# CVF Hosted Deployment Guide v1.6

This compatibility guide keeps legacy links valid and points to current deployment documentation.

Use these canonical sources:
- Web UI setup and local run: [tutorials/web-ui-setup.md](../tutorials/web-ui-setup.md)
- Team/enterprise rollout: [guides/enterprise.md](./enterprise.md)
- Platform package and infra files: [../EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/README.md](../../EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/README.md)

Quick deployment flow:
1. Prepare `.env.local` with provider keys.
2. Run `npm install && npm run build`.
3. Deploy using your platform standard (Vercel/Netlify/Docker/self-hosted).
4. Validate governance mode and role access before production use.
