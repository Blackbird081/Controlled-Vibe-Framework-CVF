# CVF ERH-DUR1 Durable Evidence And Policy Snapshot Workflow Chain

Memory class: FULL_RECORD

docType: reference

Date: 2026-06-05

ERH_DUR1_DECISION: DUR2_NOT_NEEDED_NOW

CVF_DURABLE_EVIDENCE_VERSION: 2026-06-05

CVF_POLICY_SNAPSHOT_REGISTRY_VERSION: 2026-06-05

ERH_DUR1_MARKER: DURABLE_EVIDENCE_STORE_ACTIVE

Status: CLOSED_PASS_BOUNDED

## Purpose

This document records the ERH-DUR1 durable evidence and policy snapshot workflow chain.
DUR1 converts two ERH-RS1 section 4.4 architectural findings into a bounded local
runtime workflow chain:

1. **Durable local event store default**: moves `control-plane-events.ts` default path
   from `os.tmpdir()` to a repo/app-local `.cvf/runtime/control-plane-events.json` path
   while preserving the `CVF_CONTROL_PLANE_EVENTS_PATH` env override.

2. **Reconstructable policy snapshot id**: introduces `policy-snapshot-registry.ts` as
   the owner of `generatePolicySnapshotId()`, which persists a bounded secret-safe
   snapshot record alongside each generated id, making the id traceable to a stored
   record even after process restart.

## Scope

**Allowed scope**: `control-plane-events.ts` default path change; new
`policy-snapshot-registry.ts` owner; `web-governance-envelope.ts` delegation to
registry; focused tests; DUR1 checker and tests; hook/autorun/GC-052 wiring;
workflow-chain reference, ledger, and completion review; ERH roadmap update.

**Forbidden scope**: package manifests, lockfiles, auth runtime, provider routing,
rate limiter, Redis/database adapters, public-sync, `.env*`, broad `/api/execute`
refactor, raw prompt/output/secret/private-memory persistence, live provider proof,
hosted-readiness, production-readiness, or production-grade durability claims.

## Applies To

| Surface | Owner module |
| --- | --- |
| Control-plane event store default path | `control-plane-events.ts` |
| Policy snapshot id generation and persistence | `policy-snapshot-registry.ts` |
| Governance envelope policySnapshotId | `web-governance-envelope.ts` (delegates to registry) |
| DUR1 checker enforcement | `governance/compat/check_erh_durable_evidence_policy_snapshot.py` |
| GC-052 interlock | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` |

## Components

### Durable Local Event Store (`control-plane-events.ts`)

- **Before**: `path.join(os.tmpdir(), '.cvf-data', 'control-plane-events.json')` —
  resets on every OS session or tmp clean.
- **After**: `path.join(process.cwd(), '.cvf', 'runtime', 'control-plane-events.json')` —
  local to the project working directory, survives process restarts.
- **Env override preserved**: `CVF_CONTROL_PLANE_EVENTS_PATH` continues to override
  the default to any absolute path.
- **Compatibility**: `appendAuditEvent`, `appendCostEvent`, `readAuditEvents`,
  `readCostEvents`, `exportAuditEventsToCsv`, corruption repair remain unchanged.
- **Markers**: `ERH_DUR1_MARKER: DURABLE_EVIDENCE_STORE_ACTIVE` and
  `CVF_DURABLE_EVIDENCE_VERSION: 2026-06-05`.

### Policy Snapshot Registry (`policy-snapshot-registry.ts`)

- New owner module with `CVF_POLICY_SNAPSHOT_REGISTRY_VERSION: 2026-06-05` marker.
- **`buildPolicySnapshot(input)`**: creates a bounded secret-safe `PolicySnapshotRecord`
  containing only `id`, `createdAt`, `policyDate`, `evidenceClass: BOUNDED_LOCAL`, and
  `bounded: true`. No raw prompts, outputs, secrets, or private memory.
- **`persistPolicySnapshot(record)`**: async fire-and-forget persist to
  `.cvf/runtime/policy-snapshots/${id}.json` with `CVF_POLICY_SNAPSHOT_DIR` env override.
- **`readPolicySnapshot(id)`**: async lookup by id, returns `null` if not found.
- **`generatePolicySnapshotId()`**: increments a module-level counter, formats id as
  `pol-YYYYMMDD-NNNN`, persists a snapshot record asynchronously, and returns the id.
  Preserves the existing `^pol-\d{8}-\d{4}$` format expected by consumers.

### Governance Envelope Delegation (`web-governance-envelope.ts`)

- Removes process-local `_policyCounter` and local `generatePolicySnapshotId` definition.
- Imports `generatePolicySnapshotId` from `@/lib/policy-snapshot-registry`.
- Re-exports `generatePolicySnapshotId` from `@/lib/policy-snapshot-registry` to
  preserve backward compatibility for existing consumers and tests.
- `buildGovernanceEnvelope()` behavior is unchanged; it calls the same
  `generatePolicySnapshotId()` function.

## DUR1 Checker

Machine checker: `governance/compat/check_erh_durable_evidence_policy_snapshot.py`

Verifies:
- `ERH_DUR1_MARKER` present in `control-plane-events.ts`
- `CVF_DURABLE_EVIDENCE_VERSION` present in `control-plane-events.ts`
- `os.tmpdir()` NOT present as default in `control-plane-events.ts`
- `.cvf/runtime` style path present in `control-plane-events.ts`
- `CVF_CONTROL_PLANE_EVENTS_PATH` env override present
- `policy-snapshot-registry.ts` exists with `CVF_POLICY_SNAPSHOT_REGISTRY_VERSION`
- `generatePolicySnapshotId`, `buildPolicySnapshot`, `readPolicySnapshot` exported
- `web-governance-envelope.ts` no longer has `_policyCounter`
- `web-governance-envelope.ts` re-exports `generatePolicySnapshotId` from registry
- Durable event test and policy snapshot test files exist
- Workflow-chain reference doc has `ERH_DUR1_DECISION` marker
- Ledger doc has `ERH_DUR1_LEDGER_VERSION` marker

## GC-052 Interlock

Connection: `erh-dur1-durable-evidence-policy-snapshot-workflow-chain`

Upstream: `ERH_SAF2_OUTPUT_SAFETY_WORKFLOW_CHAIN`

Downstream: `ERH_DUR2_OR_RESIDUAL`

Routing rule: DUR1 must verify `ERH_DUR1_MARKER` in `control-plane-events.ts` and
`CVF_POLICY_SNAPSHOT_REGISTRY_VERSION` in `policy-snapshot-registry.ts` before any
downstream DUR2 or external storage work is dispatched.

## Verification

| Check | Result |
| --- | --- |
| TypeScript check (`npm run check`) | PASS |
| Durable event tests (9/9) | PASS |
| Policy snapshot tests (10/10) | PASS |
| Envelope tests (18/18) | PASS |
| DUR1 checker (`--enforce`) | PASS — 0 violations |
| Checker tests (pytest) | PASS |
| Markdown structural completeness | PASS |
| GC-052 interlock | PASS |

## Claim Boundary

DUR1 proves bounded local durable evidence and reconstructable policy snapshot
workflow hardening. It does not claim production database persistence, Redis,
distributed instances, external policy service, tamper-proof audit, hosted readiness,
public readiness, production-grade durability, or complete external-review gap
remediation.

DUR2 decision: `DUR2_NOT_NEEDED_NOW` — DUR1 closes the currently handleable local
durability gap; external storage (Redis, production DB, distributed instances) remains
documented as a strategic residual requiring a separate operator storage architecture
decision and fresh GC-018.
