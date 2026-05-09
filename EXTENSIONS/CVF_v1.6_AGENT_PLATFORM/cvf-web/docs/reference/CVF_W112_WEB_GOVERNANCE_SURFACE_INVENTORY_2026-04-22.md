# CVF Web Governance Surface Inventory

> Date: 2026-04-22
> Tranche: W112-T1 (CP6)
> Memory class: POINTER_RECORD
> Status: DELIVERED

## Purpose

This inventory classifies every web API route by its governance relevance.
Each surface is assigned:

- **Class** — type of governance involvement
- **Control envelope** — what controls are expected
- **Evidence mode** — how governance claims are proven

## Surface Classification Key

| Class | Meaning |
|---|---|
| `governance-execution` | Route executes governed AI or agent actions |
| `policy-mutation` | Route creates or modifies policy-bearing state |
| `evidence-read` | Route reads governance audit or evidence artifacts |
| `ui-support` | Route supports UI but has no direct governance surface |
| `out-of-scope` | Route does not intersect CVF governance claims |

## Surface Inventory

### `/api/execute` — Governed AI Execution

| Field | Value |
|---|---|
| Class | `governance-execution` |
| Evidence mode | `live` (real provider API call required) |
| Control envelope | DLP filter → safety filter → quota check → enforcement gate → guard pipeline → provider router → AI execution → output bypass detection |
| Policy snapshot | `policySnapshotId` attached since W112-T1 |
| Audit events | DLP_REDACTION_APPLIED, QUOTA_HARD_CAP_BLOCKED, KNOWLEDGE_SCOPE_FILTER_APPLIED |
| Governance envelope | `WebGovernanceEnvelope` attached since W112-T1 |
| Live test | `route.front-door-rewrite.alibaba.live.test.ts`, `pvv.nc.benchmark.test.ts` |

---

### `/api/approvals` (POST, GET) — Approval Submission and List

| Field | Value |
|---|---|
| Class | `governance-execution` |
| Evidence mode | `live` (approval records are governance artifacts) |
| Control envelope | Auth → approval record creation → expiry enforcement |
| Policy snapshot | `approvalPolicySnapshotId` attached since W112-T1 |
| Audit events | APPROVAL_EXPIRED |
| Governance envelope | Partial — approval id + submitter captured |
| Notes | Approval record now includes `requestContext` and `blockReason` since W112-T1 |

---

### `/api/approvals/[id]` (GET, PATCH) — Approval Review

| Field | Value |
|---|---|
| Class | `governance-execution` |
| Evidence mode | `live` |
| Control envelope | Auth (admin-only for PATCH) → status transition → audit event |
| Audit events | APPROVAL_DECIDED |
| Governance envelope | Admin reviewer id captured |

---

### `/api/governance/evaluate` — Governance Evaluate

| Field | Value |
|---|---|
| Class | `governance-execution` |
| Evidence mode | `live` |
| Control envelope | Auth → enforcement evaluation → result |
| Governance envelope | `WebGovernanceEnvelope` expected (W112-T1 uplift candidate) |

---

### `/api/governance/simulate` — Governance Simulate

| Field | Value |
|---|---|
| Class | `governance-execution` |
| Evidence mode | `live` (simulation of real governance logic) |
| Control envelope | Auth → enforcement simulation → result |
| Notes | Mock output not permitted as governance evidence |

---

### `/api/governance/knowledge/*` (compile, maintain, refactor) — Knowledge Governance

| Field | Value |
|---|---|
| Class | `policy-mutation` |
| Evidence mode | `live` |
| Control envelope | Auth → knowledge compile/review/refactor → governed output |
| Governance envelope | `WebGovernanceEnvelope` expected (W112-T1 uplift candidate) |
| Live test | `e2e.workflow.test.ts` (7 scenarios) |

---

### `/api/admin/audit` — Audit Feed Read

| Field | Value |
|---|---|
| Class | `evidence-read` |
| Evidence mode | `static` (reads audit log, does not call provider) |
| Control envelope | Auth (admin-only) → paginated audit log |

---

### `/api/admin/dlp/policy` — DLP Policy Mutation

| Field | Value |
|---|---|
| Class | `policy-mutation` |
| Evidence mode | `static` |
| Control envelope | Auth (admin-only) → policy update → before/after identifiers |
| Policy snapshot | Before/after policy ids expected (W112-T1 uplift) |

---

### `/api/admin/quota/policy` — Quota Policy Mutation

| Field | Value |
|---|---|
| Class | `policy-mutation` |
| Evidence mode | `static` |
| Control envelope | Auth (admin-only) → quota policy update |
| Policy snapshot | Before/after expected (W112-T1 uplift) |

---

### `/api/admin/tool-registry/*` — Tool Registry Management

| Field | Value |
|---|---|
| Class | `policy-mutation` |
| Evidence mode | `static` |
| Control envelope | Auth (admin-only) → registry mutation |

---

### `/api/admin/siem` — SIEM Event Read

| Field | Value |
|---|---|
| Class | `evidence-read` |
| Evidence mode | `static` |
| Control envelope | Auth (admin-only) → event stream read |

---

### `/api/admin/finops` — FinOps Read

| Field | Value |
|---|---|
| Class | `evidence-read` |
| Evidence mode | `static` |
| Control envelope | Auth (admin-only) → cost/budget read |

---

### `/api/admin/impersonate` — Admin Impersonation

| Field | Value |
|---|---|
| Class | `policy-mutation` |
| Evidence mode | `static` |
| Control envelope | Auth (super-admin) → session override |

---

### `/api/auth/*` — Authentication

| Field | Value |
|---|---|
| Class | `ui-support` |
| Evidence mode | `none` |
| Control envelope | NextAuth session management — not a CVF governance surface |

---

### All other `/api/*` routes not listed above

| Field | Value |
|---|---|
| Class | `out-of-scope` |
| Notes | Routes that serve UI state, health checks, or non-governance data are not CVF governance surfaces |

## Non-Claims

The following are **not** CVF Web governance surfaces and must not be claimed as such:

- Physical sandbox isolation (Web does not execute untrusted code)
- Full CVF runtime inheritance across all modules
- Agent workspace enforcement (workspace enforcement is Lane A / downstream project concern)
- Model training or fine-tuning control
- Infrastructure-level isolation

## Claim Boundary

> CVF Web is **governance-inherited and live-proven** on the active governed AI execution path (`/api/execute`).
> It is **not** the full CVF runtime. Physical sandbox, agent workspace isolation, and full module inheritance
> remain out of scope unless Web begins executing untrusted code or plugin workloads.

---

*Source of truth: CVF W112-T1 Roadmap CP6*
*Template: docs/reference/ (POINTER_RECORD class)*
