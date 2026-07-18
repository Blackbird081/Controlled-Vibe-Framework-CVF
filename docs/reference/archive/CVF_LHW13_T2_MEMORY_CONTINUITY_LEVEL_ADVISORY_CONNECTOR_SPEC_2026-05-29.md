# CVF LHW13-T2 Memory Continuity Level Advisory Connector Spec

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

Wave: LHW13 CLOSED_PASS_BOUNDED

docType: connector_spec

Date: 2026-05-29

---

## Purpose

This connector maps LHW8-T1 `memorySnapshotAdvisoryType` × connector-normalized
`canReinject=false` × `memoryContextSeedDecayAdvisoryType` into a named
`memoryContinuityLevelAdvisoryType` (L0/L1/L2/L3) advisory.

## Scope / Applies To

Applies to: CVF memory continuity level advisory surface. Documentation-only
connector. No runtime enforcement, no memory reinjection, no L2/L3 activation.

---

## S1 — Purpose and Gap Citation

Source gap: CVF 25.05 Gop_y.md Gap 4 — CVF is at L0/L1 memory. No connector
maps existing snapshot and decay advisories into a named L0-L3 taxonomy advisory.
The 4-level taxonomy (L0 receipt-only, L1 session summary, L2 governed
reinjection, L3 cross-workflow) makes the boundary visible and explicit for
Orchestrators.

Source family: LH1 `tolaria` — PARTIALLY_ABSORBED; trigger: "Governed memory
snapshot packaging or graph context readout."

T1 gate: `docs/reviews/CVF_LHW13_T1_AGENT_READING_PROTOCOL_GOVERNANCE_CONNECTOR_COMPLETION_2026-05-29.md`
— Status: CLOSED_PASS_BOUNDED. T1 gap closure confirmed T2 is unblocked.

Key invariants for this connector:

- Source `canReinject` is a boolean field, not a source-proven false invariant.
- Connector-normalized `canReinject=false` applies to this planning packet only.
- L2 (governed reinjection) and L3 (cross-workflow) are NOT currently claimed by CVF.
- `memoryContinuityLevelAdvisoryType` is a governance planning record, not a runtime assertion.
- `runtimeExecutionAuthorized=false`.

Authority chain:
- LHW13 roadmap: `docs/roadmaps/CVF_LHW13_WORKFLOW_CONNECTOR_WAVE13_ROADMAP_2026-05-29.md`
- LHW13 GC-018: `docs/baselines/CVF_GC018_LHW13_WORKFLOW_CONNECTOR_WAVE13_2026-05-29.md`
- LHW8-T1 spec: `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md`
- LHW11-T3 spec: `docs/reference/CVF_LHW11_T3_MEMORY_CONTEXT_SEED_DECAY_ADVISORY_CONNECTOR_SPEC_2026-05-28.md`
- AIF-C source: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts`
- LH1 ledger `tolaria` trigger: `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` line 129

---

## S2 — Connector Design

### Memory Continuity Level Taxonomy (doc-only)

| Level | Name | CVF current status | Description |
| --- | --- | --- | --- |
| L0 | Receipt-only | ACTIVE in CVF | Governance receipt issued; no session capture or reinjection |
| L1 | Session summary | ACTIVE in CVF | Summary-level session capture; no raw memory release |
| L2 | Governed reinjection | NOT CLAIMED | Connector-normalized `canReinject=false`; not claimed |
| L3 | Cross-workflow | NOT CLAIMED | No cross-workflow memory; not claimed |

### Output Advisory Mapping

`memorySnapshotAdvisoryType` × connector-normalized `canReinject=false` ×
`memoryContextSeedDecayAdvisoryType` → `memoryContinuityLevelAdvisoryType` +
`continuityLevelBoundaryNote`:

| `memorySnapshotAdvisoryType` | `canReinject` | decay advisory | `memoryContinuityLevelAdvisoryType` | `continuityLevelBoundaryNote` |
| --- | --- | --- | --- | --- |
| `snapshot_full_capture` | `false` | `memory_context_healthy_eligible_for_review` | `L1_session_summary` | L1: full session capture; summary-level continuity; no reinjection |
| `snapshot_summary_only` | `false` | `memory_context_partial_promotion_gated` | `L1_summary_partial` | L1: summary-only capture; partial continuity; no raw reinjection |
| `snapshot_context_read_only` | `false` | any | `L0_receipt_only` | L0: context read, no capture; receipt-only evidence |
| `snapshot_redacted_capture` | `false` | `memory_context_contaminated_promotion_blocked` | `L0_receipt_redacted` | L0: redacted capture; evidence incomplete; no continuity claim |
| `snapshot_denied` | `false` | any | `L0_no_capture` | L0: no capture; receipt-only; no continuity |
| `snapshot_approval_pending` | `false` | any | `L0_pending_approval` | L0: approval pending; no continuity until capture approved |
| any | `false` | `memory_context_high_contamination_hold` | `L0_contamination_hold` | L0: contamination hold; all continuity claims suspended |
| N/A — L2 | N/A | N/A | `L2_governed_reinjection_not_claimed` | L2 NOT claimed by CVF; connector-normalized `canReinject=false` applies |
| N/A — L3 | N/A | N/A | `L3_cross_workflow_not_claimed` | L3 NOT claimed by CVF; no cross-workflow memory |

---

## S3 — Invariants and Boundary

1. `runtimeExecutionAuthorized=false` — this connector does not execute memory
   operations or enforce memory behavior at runtime.
2. Connector-normalized `canReinject=false` applies to this planning packet.
   The source `MemoryGatewayDecision.canReinject` is a boolean field at line 49
   of `controlled-memory-gateway.ts`; it is NOT cited as a source-proven false
   invariant. The connector normalizes it to false for this advisory context.
3. L2 (`L2_governed_reinjection_not_claimed`) and L3
   (`L3_cross_workflow_not_claimed`) are explicitly NOT active CVF claims.
   They are included in the taxonomy to define the boundary, not to assert
   current capability.
4. `rawMemoryReleased=false` is a literal invariant sourced from
   `MemoryGatewayDecision.rawMemoryReleased` at line 50.
5. `memoryContinuityLevelAdvisoryType` is a governance planning record only;
   Orchestrators apply their own judgment based on the advisory output.

---

## S4 — Non-Goals

- Memory reinjection or `canReinject=true` activation
- L2 or L3 memory level activation
- Cross-workflow memory storage
- Raw memory release
- Receipt envelope extension
- Provider behavior changes
- Runtime memory enforcement or blocking
- Hosted readiness, production readiness, or public release readiness
- Any tranche beyond T2 without T2 completion confirmation

---

## S5 — Source Verification Table

| Verified symbol | Source file | Line/section | Disposition |
| --- | --- | --- | --- |
| `memorySnapshotAdvisoryType` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S3 line 94 | ACCEPT |
| `snapshot_full_capture` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 66 | ACCEPT |
| `snapshot_summary_only` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 67 | ACCEPT |
| `snapshot_context_read_only` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 68 | ACCEPT |
| `snapshot_redacted_capture` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 69 | ACCEPT |
| `snapshot_denied` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 70 | ACCEPT |
| `snapshot_approval_pending` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 71 | ACCEPT |
| `memoryContextSeedDecayAdvisoryType` | `docs/reference/CVF_LHW11_T3_MEMORY_CONTEXT_SEED_DECAY_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S3 field list | ACCEPT |
| `canReinject` (boolean field, not invariant) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 49 | ACCEPT |
| `rawMemoryReleased` (literal `false`) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 50 | ACCEPT |
| LH1 `tolaria` trigger | `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` | line 129 | ACCEPT |

New doc-only fields (no runtime claim):

| New field | Purpose | Runtime claim blocked? |
| --- | --- | --- |
| `memoryContinuityLevelAdvisoryType` | Names the L0-L3 continuity planning advisory | Yes |
| `continuityLevelBoundaryNote` | Records memory continuity boundary in plain language | Yes |
| connector-normalized `canReinject=false` | Blocks this connector from treating source boolean as reinjection authority | Yes |

---

## Claim Boundary

This connector produces a documentation planning record. It does not claim
memory reinjection, active `canReinject=true`, L2/L3 memory levels, receipt
envelope extension, provider behavior, hosted readiness, production readiness,
or public release readiness.

T3 gate answer: YES — T2 memory level mapping reveals that while AIF-B graph
modules exist (`GraphKnowledgeService` in `graph-schema.ts`), no connector maps
their boundary status × current text-retrieval posture → a named
`graphContextResolverBoundaryAdvisoryType` defining which resolution mode is
active. T3 closes that gap.
