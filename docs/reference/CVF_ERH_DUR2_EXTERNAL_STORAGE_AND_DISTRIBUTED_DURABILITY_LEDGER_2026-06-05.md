# CVF ERH-DUR2 External Storage And Distributed Durability Ledger

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED
Date: 2026-06-05
ERH_DUR2_LEDGER_VERSION: 2026-06-05

## Scope

Implementation ledger for ERH-DUR2 pluggable storage adapter workflow chain.
Records all artifacts created or modified, file sizes, allowed-scope evidence,
and claim boundary.

## Applies To

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.ts` (NEW)
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.ts` (MODIFIED)
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/policy-snapshot-registry.ts` (MODIFIED)
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.test.ts` (NEW)
- `governance/compat/check_erh_external_storage_adapter.py` (NEW)
- `governance/compat/test_check_erh_external_storage_adapter.py` (NEW)
- `governance/compat/run_local_governance_hook_chain.py` (MODIFIED)
- `governance/compat/run_agent_autorun_workflow_gate.py` (MODIFIED)
- `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` (MODIFIED)
- `docs/reference/CVF_ERH_DUR2_EXTERNAL_STORAGE_AND_DISTRIBUTED_DURABILITY_WORKFLOW_CHAIN_2026-06-05.md` (NEW)
- `docs/reference/CVF_ERH_DUR2_EXTERNAL_STORAGE_AND_DISTRIBUTED_DURABILITY_LEDGER_2026-06-05.md` (NEW — this file)
- `docs/reviews/CVF_ERH_DUR2_EXTERNAL_STORAGE_AND_DISTRIBUTED_DURABILITY_COMPLETION_2026-06-05.md` (NEW)
- `docs/roadmaps/CVF_ERH_EXTERNAL_REVIEW_HARDENING_ROADMAP_2026-06-04.md` (MODIFIED)

## Purpose

Records evidence of DUR2 implementation steps, file sizes, test results, and
gate outcomes for audit reconstructability.

## 2026-06-06 SQLite Addendum

Operator authorized GAP 5A/B follow-up work on 2026-06-06. The bounded GAP5B
change keeps the DUR2 adapter contract and default `file` behavior intact while
adding:

- `SQLiteEventListAdapter`
- `SQLiteKeyValueAdapter`
- `CVF_STORAGE_ADAPTER_TYPE=sqlite` selector
- focused SQLite round-trip tests
- machine-check coverage for SQLite classes and selector

Claim boundary: local SQLite backend only. This addendum does not claim
production database readiness, external storage service, distributed durability,
multi-instance consensus, tamper-proof audit, hosted readiness, or public
readiness.

## Implementation Steps

| Step | Artifact | Action | Notes |
|------|----------|--------|-------|
| 1 | Pre-flight capture | executionBaseHead=`6befe0b3`; gates PASS | — |
| 2 | `storage-adapter.ts` | CREATED | 215 lines; interfaces, File/Redis classes, factories |
| 3 | `control-plane-events.ts` | MODIFIED | Removed file I/O; added adapter delegation; DUR2 marker |
| 4 | `policy-snapshot-registry.ts` | MODIFIED | Removed file I/O; added adapter delegation; DUR2 marker |
| 5 | `storage-adapter.test.ts` | CREATED | 35 Vitest tests; all PASS |
| 6 | `check_erh_external_storage_adapter.py` | CREATED | 18-point checker |
| 6 | `test_check_erh_external_storage_adapter.py` | CREATED | Checker unit tests |
| 6 | `run_local_governance_hook_chain.py` | MODIFIED | Added DUR2 entry after DUR1 |
| 6 | `run_agent_autorun_workflow_gate.py` | MODIFIED | Added DUR2 GateCommand after DUR1 |
| 6 | `CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | MODIFIED | Added DUR2 connection |
| 7 | Workflow chain reference, ledger, completion review | CREATED | This ledger |
| 7 | ERH roadmap | MODIFIED | DUR2 row → CLOSED_PASS_BOUNDED |

## Pre-Implementation File Counts

| File | Lines (pre-DUR2) |
|------|-----------------|
| `control-plane-events.ts` | 320 |
| `policy-snapshot-registry.ts` | 79 (post-DUR1) |
| `route.ts` | 874 |
| `web-governance-envelope.ts` | 246 |

## Test Evidence

| Test Suite | Count | Result |
|------------|-------|--------|
| `storage-adapter.test.ts` | 35 | PASS |
| `control-plane-events.durable.test.ts` | 9 | PASS |
| `policy-snapshot-registry.test.ts` | 10 | PASS |
| `web-governance-envelope.test.ts` | 18 | PASS |

## Allowed-Scope Verification

Allowed paths per work order:
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.ts` ✓
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.ts` ✓
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/policy-snapshot-registry.ts` ✓
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.test.ts` ✓
- `governance/compat/check_erh_external_storage_adapter.py` ✓
- `governance/compat/test_check_erh_external_storage_adapter.py` ✓
- `governance/compat/run_local_governance_hook_chain.py` ✓
- `governance/compat/run_agent_autorun_workflow_gate.py` ✓
- `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` ✓
- `docs/reference/CVF_ERH_DUR2_*` ✓
- `docs/reviews/CVF_ERH_DUR2_*` ✓
- `docs/roadmaps/CVF_ERH_EXTERNAL_REVIEW_HARDENING_ROADMAP_2026-06-04.md` ✓

Forbidden paths (not touched): `package.json`, `package-lock.json`, auth/provider/rate-limiter, `.env*`, public-sync.

## Claim Boundary

This ledger proves DUR2 implementation scope and test evidence only.
It does not prove production database, live Redis, distributed durability,
hosted readiness, public readiness, production-grade retention, or DUR3 consensus.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY — provenance workspace only; no public-sync performed.
