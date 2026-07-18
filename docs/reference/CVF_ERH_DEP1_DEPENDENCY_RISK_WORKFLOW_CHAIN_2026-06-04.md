# CVF ERH-DEP1 Dependency Risk Workflow Chain

Memory class: FULL_RECORD

Status: REVIEW_READY

docType: reference

Date: 2026-06-04

Work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_ERH_DEP1_DEPENDENCY_RISK_WORKFLOW_CHAIN_FOR_CLAUDE_2026-06-04.md`

GC-018: `docs/baselines/CVF_GC018_ERH_DEP1_DEPENDENCY_RISK_WORKFLOW_CHAIN_2026-06-04.md`

## Purpose

Define a repeatable workflow chain for assessing `next-auth` beta dependency
risk in the CVF web platform. This chain answers an external evaluator's
dependency-risk question without hiding the beta posture or prematurely
migrating auth runtime.

## Scope / Target / Owner Boundary

Target: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web` dependency posture for
the `next-auth` package.

Boundary: this workflow chain records risk classification and creates a machine
check. It does not migrate the dependency, change auth runtime behavior, export
public docs, or prove hosted/production readiness.

## Workflow Chain Steps

### Step 1 — Declared Dependency Verification

Verify that `package.json` declares the dependency and `package-lock.json` resolves it.

| Item | Source | Evidence |
| --- | --- | --- |
| Package declaration | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package.json` line 30 | `"next-auth": "^5.0.0-beta.30"` |
| Lock resolution | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package-lock.json` line 8641 | `node_modules/next-auth` entry |

### Step 2 — Upstream Metadata Snapshot

Refresh `npm view next-auth version dist-tags --json` and record the result.

Fresh result recorded on 2026-06-04:

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

Observation: the declared range `^5.0.0-beta.30` resolves to `beta` tag
`5.0.0-beta.31`. The `latest` stable tag is `4.24.14` (v4 series), which is
a major version difference. A move from beta v5 to stable v4 would be a
**downgrade**, not an upgrade; v5 beta and v4 stable are API-incompatible.
Migration to a stable v5 is not yet available.

### Step 3 — Audit Surface Snapshot

Run `npm audit --json` from cvf-web and classify results.

Result recorded on 2026-06-04:

| Severity | Count | Fix available |
| --- | --- | --- |
| critical | 3 | all |
| high | 7 | partial (2 gated by `next` semver major) |
| moderate | 4 | partial (2 gated by `next` semver major) |
| total | 14 | — |

Critical packages: `@vitest/coverage-v8`, `jspdf`, `vitest` — all dev/test
dependencies with available fixes.

High-severity packages: `flatted`, `minimatch`, `next`, `picomatch`, `rollup`,
`undici`, `vite`. Two entries (`next` and `postcss`) have fix available only via
a semver-major `next` upgrade. The `next-auth` beta package itself does not
appear directly in the audit vulnerability list; the auth risk is a stability
and API-stability risk, not a published CVE.

Classification: audit vulnerabilities are primarily dev/build toolchain (test
runner, PDF export, bundler). Auth beta risk is a **stability-class** risk, not
a CVE-class risk in the current audit snapshot.

### Step 4 — Auth Touchpoint Map

Map all source files that directly import or depend on `next-auth`.

| Touchpoint | Path | Import / Usage | Migration regression scope |
| --- | --- | --- | --- |
| Auth config | `src/auth.ts` lines 1-6 | `NextAuth`, `CredentialsProvider`, `GitHubProvider`, `GoogleProvider`, `NextAuthConfig` | Full auth config re-test required |
| Middleware | `middleware.ts` line 1 | `auth` from `@/auth` | All route protection logic |
| Session verification | `src/lib/middleware-auth.ts` line 76 | `auth()` call via `verifySessionCookie` | ~10 API routes that import `verifySessionCookie` |
| Middleware auth tests | `src/lib/middleware-auth.test.ts` lines 19, 22-23 | `verifySessionCookie` | Focused auth test coverage |

Migration regression boundary: any migration requires re-testing all four
touchpoints plus the ~10 downstream API routes. This is a non-trivial effort
that must be a separate governed work order (DEP2 or equivalent).

### Step 5 — Risk Classification

Apply the ERH-DEP1 decision matrix.

| Factor | Observation | Risk weight |
| --- | --- | --- |
| Stable v5 available | No — `latest` is v4; v5 remains beta-only | HIGH |
| CVE exposure from next-auth itself | None in current audit | LOW |
| Stability risk from beta API | Yes — beta API can change before stable | MEDIUM |
| Migration complexity | High — 4 touchpoints + ~10 downstream routes | HIGH |
| Current scope | Private/prototype, not hosted production | MITIGATES |
| Public claim posture | Beta posture must be disclosed in public docs | REQUIRED |

**Decision: `ACCEPT_WITH_CAVEAT`**

Rationale:
- No stable v5 exists to migrate to; downgrading to v4 would break the app.
- Current scope is private/prototype, not hosted production or enterprise.
- The beta dependency must be disclosed in public docs (ERH-T4 baseline and
  ERH-T1B public caveat).
- A separate DEP2 work order must be opened if and when stable v5 ships or
  when a hosted/production auth claim is made.

### Step 6 — Machine Check Gate

The checker `governance/compat/check_erh_dependency_risk_workflow.py` verifies:

1. `docs/reference/CVF_ERH_DEP1_DEPENDENCY_RISK_WORKFLOW_CHAIN_2026-06-04.md`
   exists and contains a `Decision:` line with one of the four allowed values.
2. `docs/reference/CVF_ERH_DEP1_DEPENDENCY_RISK_LEDGER_2026-06-04.md` exists.
3. `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package.json` has not been
   modified (next-auth line still present as a beta range marker).
4. No `package-lock.json` removal or silent replacement occurred.

The checker is wired into `run_local_governance_hook_chain.py` and
`run_agent_autorun_workflow_gate.py`.

## GC-052 System-Loop Connection

Connection ID: `erh-dependency-risk-workflow-chain`

Route: `ERH-DEP1-risk-check` → `check_erh_dependency_risk_workflow` →
`ACCEPT_WITH_CAVEAT | PUBLIC_CAVEAT_ONLY | MIGRATION_REQUIRED_DEP2 | BLOCKED_NEEDS_OPERATOR`

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this reference is private provenance evidence. Public caveat wording
is deferred to the ERH-T1B public-sync work order.

## Claim Boundary

This reference records workflow-chain steps and a bounded risk decision. It
does not prove auth security, hosted freshness, production readiness, stable
dependency posture, dependency migration completion, or live governance proof.
