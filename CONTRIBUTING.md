# Contributing

CVF welcomes technical contributions that improve the governance control plane.

## Public-Surface Rule

Do not add internal operating artifacts to this public repository.

Blocked by default:

- handoff files
- rebuttals and counter-reviews
- raw wave plans
- raw logs and browser traces
- uncurated audits and baselines
- `.env` files and runtime state

If a file is useful publicly, turn it into a durable technical summary and add
it to `governance/public-surface-manifest.json`.

## Before Opening A PR

Run:

```bash
python scripts/check_public_surface.py
```

For web changes:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci
npm run build
```

For governance-behavior claims:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

The last command requires a live provider key and may incur provider cost.

