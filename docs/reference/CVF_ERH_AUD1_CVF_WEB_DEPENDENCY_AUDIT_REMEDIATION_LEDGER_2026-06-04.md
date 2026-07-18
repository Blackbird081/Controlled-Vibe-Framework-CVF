# CVF ERH-AUD1 CVF-Web Dependency Audit Remediation Ledger

Memory class: FULL_RECORD

Status: REVIEW_READY

docType: reference

Date: 2026-06-04

## Purpose

Machine-readable ledger of ERH-AUD1 audit remediation evidence. Consumed by
`check_erh_cvf_web_dependency_audit_workflow.py`.

## Scope / Target / Owner Boundary

Target: `cvf-web` npm audit posture after bounded non-semver-major remediation.

## Before Snapshot

Date: 2026-06-04

| Severity | Count |
| --- | --- |
| critical | 3 |
| high | 7 |
| moderate | 4 |
| total | 14 |

## Package Changes Applied

| Package | Before | After | Change class |
| --- | --- | --- | --- |
| `jspdf` | `^4.1.0` | `^4.2.1` | patch/minor bump |
| `next` | `16.1.6` (pinned) | `16.2.7` | minor bump (same major) |
| `eslint-config-next` | `16.1.6` | `16.2.7` | align with next |
| `vitest` | `^4.0.18` | `^4.1.0` | minor bump |
| `@vitest/coverage-v8` | `^4.0.18` | `^4.1.0` | minor bump |
| `next-auth` | `^5.0.0-beta.30` | `^5.0.0-beta.30` | UNCHANGED |

## After Snapshot

Date: 2026-06-04

| Severity | Count |
| --- | --- |
| critical | 0 |
| high | 0 |
| moderate | 3 |
| total | 3 |

## Residual Classification

| Package | Residual severity | Fix path | Classification | Next action |
| --- | --- | --- | --- | --- |
| `next` | moderate | requires next@9.3.3 (semver-major downgrade) | BLOCKED_MAJOR | separate next upgrade work order if operator approves major |
| `next-auth` | moderate | requires next-auth@3.29.10 (semver-major + version downgrade) | BLOCKED_MAJOR + BLOCKED_DEP1 | blocked by ERH-DEP1 boundary; defer to DEP2 |
| `postcss` | moderate | fix gated on next@9 | BLOCKED_MAJOR | follows `next` decision above |

## Verification Summary

| Check | Result |
| --- | --- |
| `npm run check` | PASS |
| `npm run build` | PASS |
| `npm run test:run` | 3020/3021 PASS; 1 live test pre-existing fail (`route.dlp.live.test.ts`) |
| `next-auth` unchanged | CONFIRMED — still `^5.0.0-beta.30` |
| Auth runtime files unchanged | CONFIRMED |

## Checker Marker

```
ERH_AUD1_DECISION: AUDIT_REDUCED_WITH_RESIDUALS
ERH_AUD1_LEDGER_VERSION: 2026-06-04
```

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

## Claim Boundary

This ledger records bounded audit remediation evidence. It does not prove
production security, hosted freshness, full CVE clearance, or public security
readiness.
