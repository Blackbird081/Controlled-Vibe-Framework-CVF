# CVF ERH-DEP1 Dependency Risk Ledger

Memory class: FULL_RECORD

Status: REVIEW_READY

docType: reference

Date: 2026-06-04

## Purpose

Machine-readable ledger of the ERH-DEP1 dependency risk assessment results.
This ledger is the evidence record consumed by `check_erh_dependency_risk_workflow.py`.

## Scope / Target / Owner Boundary

Target: `next-auth` beta dependency in `cvf-web`.

Boundary: evidence record only. No migration, runtime change, public-sync
export, or production claim.

## Step 1 — Declared Dependency

| Field | Value |
| --- | --- |
| Package | `next-auth` |
| Declared range | `^5.0.0-beta.30` |
| Source file | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package.json` line 30 |
| Lock entry | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package-lock.json` line 8641 |
| Lock resolves to | `5.0.0-beta.31` |

## Step 2 — Upstream Metadata Snapshot

Command: `npm view next-auth version dist-tags --json`

Captured: 2026-06-04

```json
{
  "version": "4.24.14",
  "dist-tags": {
    "canary": "3.24.0-canary.0",
    "next": "4.0.0-next.26",
    "next-auth-3": "3.29.10",
    "experimental": "0.0.0-manual.2824fa11",
    "beta": "5.0.0-beta.31",
    "latest": "4.24.14"
  }
}
```

| Observation | Value |
| --- | --- |
| Stable v5 available | NO |
| Current beta tag | `5.0.0-beta.31` |
| Latest stable | `4.24.14` (v4 major — API incompatible with v5) |
| Migration path to stable | BLOCKED until stable v5 ships |

## Step 3 — Audit Surface Snapshot

Command: `npm audit --json` from `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`

Captured: 2026-06-04

| Severity | Count | next-auth involved |
| --- | --- | --- |
| critical | 3 | NO |
| high | 7 | NO (2 gated by `next` semver-major upgrade) |
| moderate | 4 | NO (2 gated by `next` semver-major upgrade) |
| total | 14 | 0 |

Critical packages (all dev/test toolchain):
- `@vitest/coverage-v8` — test coverage reporter
- `jspdf` — PDF export (dev usage)
- `vitest` — test runner

High packages:
- `flatted`, `minimatch`, `picomatch`, `rollup`, `undici`, `vite` — build/test toolchain
- `next` — framework, fix gated on semver-major upgrade

Moderate packages:
- `ajv`, `brace-expansion` — build toolchain
- `dompurify` — sanitization utility
- `postcss` — CSS processing, fix gated on `next` semver-major

Auth-specific CVE count: **0**

Classification: all audit vulnerabilities are toolchain or framework (next.js)
scope. The `next-auth` beta risk is a **stability-class** risk, not a published
CVE. The `next` high/moderate findings require operator decision on semver-major
upgrade separately.

## Step 4 — Auth Touchpoint Map

| Touchpoint | Path | Migration scope |
| --- | --- | --- |
| Auth config | `src/auth.ts` | Full re-test — config, providers, session shape |
| Middleware wrapper | `middleware.ts` | All route protection logic |
| Session helper | `src/lib/middleware-auth.ts` | `verifySessionCookie` → ~10 API consumers |
| Auth tests | `src/lib/middleware-auth.test.ts` | Focused auth test suite |

## Step 5 — Decision Record

| Decision | `ACCEPT_WITH_CAVEAT` |
| --- | --- |
| Reasoning | No stable v5 available; downgrade to v4 breaks app; current scope is private/prototype |
| Public caveat required | YES — ERH-T4 baseline and ERH-T1B public-sync work order |
| Migration trigger | Open DEP2 when stable v5 ships or hosted/production auth claim is made |

## Checker Marker

```
ERH_DEP1_DECISION: ACCEPT_WITH_CAVEAT
ERH_DEP1_LEDGER_VERSION: 2026-06-04
```

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private evidence ledger. No public-sync commit or public claim.

## Claim Boundary

This ledger records raw evidence for the ERH-DEP1 decision. It does not prove
auth security, hosted readiness, production stability, or dependency migration.
