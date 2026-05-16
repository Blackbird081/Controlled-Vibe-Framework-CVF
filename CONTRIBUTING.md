# Contributing

Memory class: POINTER_RECORD

Status: CURRENT PUBLIC CONTRIBUTION GUIDE

CVF welcomes technical contributions that improve the governance control plane.

## Purpose

Give external contributors the minimum public-surface rules and local checks
needed before opening a CVF pull request.

## Scope

This file covers contribution hygiene for the public repo. It does not grant
ownership, release authority, or permission to publish provenance-only material.

## Claim Boundary

Public contributions must preserve the clean public surface. Internal operating
artifacts belong in provenance or local storage unless explicitly curated.

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
