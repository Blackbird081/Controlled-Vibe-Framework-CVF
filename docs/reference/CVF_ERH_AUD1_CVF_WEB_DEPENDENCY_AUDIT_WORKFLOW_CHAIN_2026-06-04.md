# CVF ERH-AUD1 CVF-Web Dependency Audit Workflow Chain

Memory class: FULL_RECORD

Status: REVIEW_READY

docType: reference

Date: 2026-06-04

Work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_ERH_AUD1_CVF_WEB_DEPENDENCY_AUDIT_REMEDIATION_FOR_CLAUDE_2026-06-04.md`

GC-018: `docs/baselines/CVF_GC018_ERH_AUD1_CVF_WEB_DEPENDENCY_AUDIT_REMEDIATION_2026-06-04.md`

## Purpose

Define a repeatable workflow chain for remediating `cvf-web` npm audit findings
within bounded scope: no semver-major framework migrations, no auth runtime
changes, no `next-auth` migration.

## Scope / Target / Owner Boundary

Target: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web` npm audit posture.

Boundary: this workflow chain records audit remediation evidence. It does not
claim production security readiness, hosted freshness, or public readiness.

## Workflow Chain Steps

### Step 1 — Before Audit Snapshot

Run `npm audit --json` and record the before state.

| Severity | Before (AUD1 start) |
| --- | --- |
| critical | 3 |
| high | 7 |
| moderate | 4 |
| total | 14 |

Direct vulnerable packages at start: `jspdf ^4.1.0`, `next 16.1.6` (pinned),
`vitest ^4.0.18`, `@vitest/coverage-v8 ^4.0.18`.

### Step 2 — Package Metadata Verification

| Package | Before | Latest non-major | Action |
| --- | --- | --- | --- |
| `jspdf` | `^4.1.0` | `4.2.1` | Bump to `^4.2.1` |
| `next` | `16.1.6` (pinned) | `16.2.7` | Bump to `16.2.7` (same major) |
| `eslint-config-next` | `16.1.6` | `16.2.7` | Align with `next` |
| `vitest` | `^4.0.18` | `4.1.8` | Bump to `^4.1.0` |
| `@vitest/coverage-v8` | `^4.0.18` | `4.1.8` | Bump to `^4.1.0` |
| `next-auth` | `^5.0.0-beta.30` | beta only | **UNCHANGED — ERH-DEP1 scope** |

### Step 3 — Remediation Applied

`package.json` changes:

```diff
-  "jspdf": "^4.1.0",
+  "jspdf": "^4.2.1",
-  "next": "16.1.6",
+  "next": "16.2.7",
-  "@vitest/coverage-v8": "^4.0.18",
+  "@vitest/coverage-v8": "^4.1.0",
-  "eslint-config-next": "16.1.6",
+  "eslint-config-next": "16.2.7",
-  "vitest": "^4.0.18"
+  "vitest": "^4.1.0"
```

`npm install` and `npm audit fix` (non-breaking) applied. `package-lock.json`
regenerated.

### Step 4 — After Audit Snapshot

| Severity | After (AUD1 end) |
| --- | --- |
| critical | 0 |
| high | 0 |
| moderate | 3 |
| total | 3 |

Residual 3 moderate vulnerabilities:

| Package | Fix path | Classification |
| --- | --- | --- |
| `next` | requires `next@9.3.3` — semver-major downgrade | BLOCKED_MAJOR — outside AUD1 scope |
| `next-auth` | requires `next-auth@3.29.10` — semver-major downgrade | BLOCKED_MAJOR — outside AUD1 and DEP1 scope |
| `postcss` | fix gated on `next` major | BLOCKED_MAJOR — follows `next` decision |

These 3 residuals are not cleared by bounded non-semver-major remediation and
require a separate major-version decision. They do not represent a new audit
regression introduced by AUD1.

### Step 5 — Verification Results

| Check | Result |
| --- | --- |
| `npm run check` (tsc --noEmit) | PASS (after `.next` cache clear) |
| `npm run build` | PASS |
| `npm run test:run` | 3020/3021 PASS, 1 fail = `route.dlp.live.test.ts` (pre-existing live test, not related to AUD1) |

### Step 6 — Decision

**Decision: `AUDIT_REDUCED_WITH_RESIDUALS`**

Rationale:

- Critical: 3 → 0 (eliminated)
- High: 7 → 0 (eliminated)
- Moderate: 4 → 3 (1 eliminated; 3 residuals all gated on semver-major)
- All residuals require `next@9` major downgrade or `next-auth@3` major
  downgrade — both blocked by AUD1 scope and ERH-DEP1 constraints.
- Verification PASS on build and TypeScript; live test failure is pre-existing.

### Step 7 — Machine Check Gate

The checker `governance/compat/check_erh_cvf_web_dependency_audit_workflow.py`
verifies:

1. This workflow chain reference exists with a valid `Decision:` line.
2. The remediation ledger exists with an `ERH_AUD1_DECISION:` machine marker.
3. `package.json` still contains the `next-auth` beta range (not migrated).

## GC-052 System-Loop Connection

Connection ID: `erh-cvf-web-dependency-audit-workflow`

Route: `ERH-AUD1-audit-remediation` → `check_erh_cvf_web_dependency_audit_workflow`
→ `AUDIT_CLEAN_PASS | AUDIT_REDUCED_WITH_RESIDUALS | AUDIT_BLOCKED_MAJOR_OR_RUNTIME | AUDIT_BLOCKED_REGISTRY_OR_TESTS`

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance audit remediation record.

## Claim Boundary

This reference records bounded audit remediation evidence. It does not prove
production security hardening, full CVE clearance, hosted freshness, or
public security readiness.
