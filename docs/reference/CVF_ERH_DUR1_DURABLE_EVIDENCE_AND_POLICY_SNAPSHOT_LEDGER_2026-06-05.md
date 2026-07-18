# CVF ERH-DUR1 Durable Evidence And Policy Snapshot Ledger

Memory class: FULL_RECORD

docType: reference

Date: 2026-06-05

ERH_DUR1_LEDGER_VERSION: 2026-06-05

Status: CLOSED_PASS_BOUNDED

## Purpose

Implementation ledger for ERH-DUR1. Records each implementation step, file size
evidence, allowed scope verification, and claim boundary. This ledger does not prove
test passage or governance gate pass — those are recorded in the completion review.

## Implementation Steps

| Step | Action | Status |
| --- | --- | --- |
| 1 | Captured execution base (HEAD: 35c468b5), git status clean | COMPLETE |
| 2 | Ran pre-implementation autorun gate `--base 1beda1b2 --head HEAD` | COMPLETE |
| 3 | Updated `control-plane-events.ts`: removed `os` import, changed default path from `os.tmpdir()` to `process.cwd()/.cvf/runtime/control-plane-events.json`, added `ERH_DUR1_MARKER` and `CVF_DURABLE_EVIDENCE_VERSION` markers | COMPLETE |
| 4 | Created `policy-snapshot-registry.ts`: new owner module with `CVF_POLICY_SNAPSHOT_REGISTRY_VERSION`, `buildPolicySnapshot`, `persistPolicySnapshot`, `readPolicySnapshot`, `generatePolicySnapshotId`, `CVF_POLICY_SNAPSHOT_DIR` env override | COMPLETE |
| 5 | Updated `web-governance-envelope.ts`: removed `_policyCounter` and local `generatePolicySnapshotId`, imported and re-exported from `policy-snapshot-registry` | COMPLETE |
| 6 | Created `control-plane-events.durable.test.ts` with `ERH_DUR1_MARKER` (9 tests) | COMPLETE |
| 7 | Created `policy-snapshot-registry.test.ts` (10 tests) | COMPLETE |
| 8 | Created `check_erh_durable_evidence_policy_snapshot.py` (15-check machine verifier) | COMPLETE |
| 9 | Created `test_check_erh_durable_evidence_policy_snapshot.py` checker unit tests | COMPLETE |
| 10 | Updated `run_local_governance_hook_chain.py` with DUR1 checker after SAF2 entry | COMPLETE |
| 11 | Updated `run_agent_autorun_workflow_gate.py` with DUR1 GateCommand after SAF2 entry | COMPLETE |
| 12 | Added `erh-dur1-durable-evidence-policy-snapshot-workflow-chain` to GC-052 interlock registry | COMPLETE |
| 13 | Created workflow-chain reference doc with `ERH_DUR1_DECISION` marker | COMPLETE |
| 14 | Created this ledger doc | COMPLETE |
| 15 | Created completion review with DUR2 decision | COMPLETE |
| 16 | Updated ERH roadmap DUR1 row to `CLOSED_PASS_BOUNDED` | COMPLETE |
| 17 | Reviewer remediation: added recursive `.cvf/runtime/` and `.cvf/config/` ignore patterns to prevent local durable runtime output from becoming untracked source | COMPLETE |

## File Size Evidence

| File | Lines before | Lines after | Hard limit |
| --- | --- | --- | --- |
| `control-plane-events.ts` | 366 | 372 | N/A (advisory 700) |
| `web-governance-envelope.ts` | 283 | 272 | N/A (advisory 700) |
| `route.ts` | 874 | 874 (unchanged) | 1000 |
| `policy-snapshot-registry.ts` | N/A (new) | 93 | N/A |

All files remain within governed limits.

## Scope

This ledger applies to the ERH-DUR1 Durable Evidence And Policy Snapshot work order
execution. All paths changed are within the Allowed scope defined in the work order.
No package manifests, lockfiles, auth runtime, provider router, rate limiter,
Redis/database adapters, public-sync, `.env*`, or unrelated source files are modified.

## Allowed Scope Verification

Changed paths are all within the work order Allowed scope:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.ts` ✓
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/policy-snapshot-registry.ts` ✓
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/web-governance-envelope.ts` ✓
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.durable.test.ts` ✓
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/policy-snapshot-registry.test.ts` ✓
- `governance/compat/check_erh_durable_evidence_policy_snapshot.py` ✓
- `governance/compat/test_check_erh_durable_evidence_policy_snapshot.py` ✓
- `governance/compat/run_local_governance_hook_chain.py` ✓
- `governance/compat/run_agent_autorun_workflow_gate.py` ✓
- `.gitignore` ✓
- `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` ✓
- `docs/reference/CVF_ERH_DUR1_DURABLE_EVIDENCE_AND_POLICY_SNAPSHOT_WORKFLOW_CHAIN_2026-06-05.md` ✓
- `docs/reference/CVF_ERH_DUR1_DURABLE_EVIDENCE_AND_POLICY_SNAPSHOT_LEDGER_2026-06-05.md` ✓
- `docs/reviews/CVF_ERH_DUR1_DURABLE_EVIDENCE_AND_POLICY_SNAPSHOT_COMPLETION_2026-06-05.md` ✓
- `docs/roadmaps/CVF_ERH_EXTERNAL_REVIEW_HARDENING_ROADMAP_2026-06-04.md` ✓

No changes to: package manifests, lockfiles, auth runtime, provider router, rate limiter,
Redis/database adapters, public-sync clone, `.env*`, or unrelated source files.

## Claim Boundary

This ledger records implementation steps only. It does not prove TypeScript compilation,
test passage, build success, or governance gate pass for completed verification steps —
those are recorded in the completion review.

DUR2 residual: external DB/Redis/distributed retention and production-grade durability
remain as a strategic residual. DUR1 closes only the local durable default gap.
