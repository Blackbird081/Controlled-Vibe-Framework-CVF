<!-- Memory class: FULL_RECORD -->
# CVF 5-Minute RC Setup

Date: 2026-05-08

Status: RC2-A2 guided first-run path

## Boundary

This guide is for Windows RC setup. It is not a GA installer and does not claim
zero friction across every environment.

## 1. Clone

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF
```

## 2. Run The Doctor

```bash
python scripts/cvf_doctor.py --json
```

Fix any `BLOCKED` result before continuing. `WARNING` usually means a provider
key or local dependency is still missing.

## 3. Create Local Env

```bash
python scripts/cvf_setup.py --write-env --json
```

Then edit:

```bash
EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.local
```

Add only the provider keys you intend to use. Never commit `.env.local`.

## 4. Check Provider Readiness

Secret-safe key presence check:

```bash
python scripts/cvf_provider_check.py --provider alibaba --json
```

Optional live validation:

```bash
python scripts/cvf_provider_check.py --provider alibaba --live --json
```

DeepSeek can be checked with:

```bash
python scripts/cvf_provider_check.py --provider deepseek --json
```

## 5. Install And Start Web

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Release-Quality Governance Proof

For claims that CVF controls AI/governance behavior, run:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

That command requires live provider evidence. UI mock checks are not governance
proof.
