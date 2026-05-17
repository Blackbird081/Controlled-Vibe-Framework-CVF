<!-- Memory class: FULL_RECORD -->
# CVF Deploy Guide

> Status: canonical deploy guide
> Date: 2026-05-08
> Scope: public-release packaging, WPR-2

This guide explains how to run or host the CVF web app without weakening the
governance proof boundary.

CVF's web app lives at:

```bash
EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
```

## Live Key Rule

Never commit provider keys. Use host environment variables or local
`.env.local` files that stay untracked.

Release-quality governance proof requires a live DashScope-compatible key:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Accepted Alibaba/DashScope variables:

- `DASHSCOPE_API_KEY`
- `ALIBABA_API_KEY`
- `CVF_ALIBABA_API_KEY`
- `CVF_BENCHMARK_ALIBABA_KEY`

DeepSeek uses:

- `DEEPSEEK_API_KEY`

`NEXT_PUBLIC_CVF_MOCK_AI=1` is UI-demo only. It is not governance proof.

## Local Development

From a fresh clone:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci
npm run dev
```

Open:

```bash
http://localhost:3000
```

Use `.env.example` as the shape reference for `.env.local`. Do not commit
`.env.local`.

## Local Production Build

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci
npm run build
npm run start
```

The checked-in app currently uses Next.js and builds to `.next`.

## Netlify

Netlify is the canonical checked-in host config.

Root config:

```bash
netlify.toml
```

Package config:

```bash
EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/netlify.toml
```

Current config values:

| Setting | Value |
|---|---|
| Base directory | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web` |
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node version | `20` |
| Plugin | `@netlify/plugin-nextjs` |

Configure provider keys in Netlify environment variables, not in the repo.

After deploy, run the release gate from a local checkout with live keys before
publishing any governance claim about that deployed build.

## Vercel

Vercel has a package-local config:

```bash
EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/vercel.json
```

Current config values:

| Setting | Value |
|---|---|
| Framework | `nextjs` |
| Build command | `npm run build` |
| Dev command | `npm run dev` |
| Install command | `npm install` |
| Output directory | `.next` |

Set Vercel root directory to:

```bash
EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
```

Configure provider keys in Vercel Project Settings. Do not add them to Git.

## Docker

No Dockerfile is currently committed for the CVF web app. Docker is therefore
not a canonical deploy target in the current RC posture.

A future Docker tranche may add a reviewed Dockerfile. Until then, treat Docker
instructions as local experimentation only and keep any Dockerfile changes out
of release claims unless they are separately authorized and verified.

## Post-Deploy Verification

For UI structure:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm run build
```

For governance claims:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

The second command must pass with live provider evidence before a public claim
can say CVF controls AI behavior on that path.

## Related References

- `README.md`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.example`
- `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md`
- `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md`
- `docs/reference/CVF_EXTENSION_AUTHOR_BOUNDARY.md`
