# CVF LHW14-T1 Agent Memory Capture Packaging Advisory Connector Spec

Memory class: FULL_RECORD

Status: ACTIVE

Wave: LHW14 (T1 ACTIVE)

docType: connector_spec

Date: 2026-05-29

---

## Purpose

This connector defines a documentation-only advisory that helps Orchestrators
choose how to package and present captured memory context to downstream agents
or operators. It normalizes the combined posture of LHW8-T1
`memorySnapshotAdvisoryType`, the connector-normalized `canReinject=false`
invariant, and `rawMemoryReleased=false` into a named
`agentMemoryCapturePackagingAdvisoryType` and plain-language
`capturePackagingGuidance`.

## Scope / Applies To

Applies to LHW14-T1 agent memory capture packaging advisory. Target owner
surface: documentation-only connector specs and Orchestrator planning records.
It does not change runtime source, provider behavior, receipt envelopes, memory
behavior, memory reinjection, or agent execution enforcement.

---

## S1 — Purpose and Gap Citation

Source gap: LH1 `agentmemory` PARTIALLY_ABSORBED trigger (line 133) —
"Reopen for capture/read packaging improvements; raw reinjection remains
blocked." LHW8-T1 defines six `memorySnapshotAdvisoryType` values and
`promotionEligible=false`. VI3 `AgentMemoryCaptureRecord` records
`captureDecision`. AIF-C `MemoryGatewayDecision` provides `canReinject`
(boolean field) and `rawMemoryReleased=false` (literal invariant). No connector
maps these three surfaces into a named packaging advisory that tells an
Orchestrator what packaging mode to use and what evidence is available.

Without this connector, Orchestrators must manually interpret the snapshot
type, gateway decision, and capture record to decide how to present memory
context — inconsistent across sessions and agents.

This connector normalizes the packaging posture into a machine-readable advisory
vocabulary. It does NOT execute memory packaging, modify capture behavior, or
authorize reinjection. The packaging advisory is a governance planning record.
`runtimeExecutionAuthorized=false`.

Invariants:

- connector-normalized `canReinject=false`
- `rawMemoryReleased=false` (literal invariant from AIF-C source)
- `runtimeExecutionAuthorized=false`

Authority chain:
- LHW14 roadmap: `docs/roadmaps/CVF_LHW14_WORKFLOW_CONNECTOR_WAVE14_ROADMAP_2026-05-29.md`
- LHW14 GC-018: `docs/baselines/CVF_GC018_LHW14_WORKFLOW_CONNECTOR_WAVE14_2026-05-29.md`
- LHW8-T1 spec: `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md`
- AIF-C source: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts`
- LH1 ledger: `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` — `agentmemory` trigger at line 133

## S2 — Snapshot Advisory → Packaging Advisory Mapping

This connector maps LHW8-T1 `memorySnapshotAdvisoryType` (6 values) ×
connector-normalized `canReinject=false` →
`agentMemoryCapturePackagingAdvisoryType` + `capturePackagingGuidance`.

| LHW8-T1 `memorySnapshotAdvisoryType` | Connector-normalized `canReinject` | `agentMemoryCapturePackagingAdvisoryType` | `capturePackagingGuidance` |
| --- | --- | --- | --- |
| `snapshot_full_capture` | `false` | `packaging_full_summary` | Package full session summary; include event ids and receipt chain; no raw content release |
| `snapshot_summary_only` | `false` | `packaging_summary_partial` | Package summary only; note raw content omitted; no raw reinjection |
| `snapshot_context_read_only` | `false` | `packaging_read_no_capture` | No packaging needed; context was read-only; no stored record |
| `snapshot_redacted_capture` | `false` | `packaging_redacted_incomplete` | Package redaction log only; note incomplete evidence; no continuity claim |
| `snapshot_denied` | `false` | `packaging_none_denied` | No packaging; capture was denied; receipt-only evidence |
| `snapshot_approval_pending` | `false` | `packaging_none_pending` | No packaging until capture approved; hold continuity claim |

Key invariants:

- connector-normalized `canReinject=false` across every row; no row authorizes
  reinjection
- `rawMemoryReleased=false` literal invariant preserved from AIF-C source
  line 50
- prior `captureDecision` does not automatically promote to long-term or
  organizational memory; promotion requires explicit operator review and a
  fresh governance record

## S3 — Packaging Advisory Packet Minimum Fields

All fields are documentation-only advisory fields.

| Field | Source | Invariant | Notes |
| --- | --- | --- | --- |
| `memorySnapshotAdvisoryType` | LHW8-T1 S3 | verbatim from LHW8-T1 | One of 6 LHW8-T1 values |
| `agentMemoryCapturePackagingAdvisoryType` | N/A — new doc-only | — | One of 6 packaging advisory values from S2 |
| `capturePackagingGuidance` | N/A — new doc-only | — | Plain-language packaging guidance from S2 |
| `canReinject` | AIF-C `MemoryGatewayDecision.canReinject` | connector-normalized `=false` | Source field is boolean; this connector packet normalizes to false for every combination |
| `rawMemoryReleased` | AIF-C `MemoryGatewayDecision.rawMemoryReleased` | `=false` | Literal invariant preserved from source |
| `captureDecision` | VI3 `AgentMemoryCaptureRecord.captureDecision` | — | Actual capture outcome from VI3 |
| `promotionEligible` | LHW8-T1 S3 | `=false` | Always false; promotion requires explicit operator review |
| `runtimeExecutionAuthorized` | N/A — new doc-only | `=false` | Connector invariant |

## S4 — Boundary Table

| Surface | Status | Notes |
| --- | --- | --- |
| LHW8-T1 `memorySnapshotAdvisoryType` (6 values) | Doc-only | Source: LHW8-T1 S2; no runtime source |
| LHW8-T1 `promotionEligible=false` | Doc-only | Source: LHW8-T1 S2; always false |
| AIF-C `MemoryGatewayDecision.canReinject` | Runtime-proven | Source: `controlled-memory-gateway.ts` line 49; boolean field |
| AIF-C `MemoryGatewayDecision.rawMemoryReleased=false` | Runtime-proven | Source: `controlled-memory-gateway.ts` line 50; literal invariant |
| VI3 `AgentMemoryCaptureRecord.captureDecision` | Runtime-proven | Source: `audit-memory-receipt.ts` line 38 |
| `agentMemoryCapturePackagingAdvisoryType` (new) | Doc-only | Defined in this connector; no runtime source |
| `capturePackagingGuidance` (new) | Doc-only | Defined in this connector; no runtime source |
| Memory write or reinjection | Not authorized | `canReinject=false` connector-normalized |
| Raw memory release | Not authorized | `rawMemoryReleased=false` preserved |
| Runtime memory packaging execution | Not authorized | `runtimeExecutionAuthorized=false` |

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `memorySnapshotAdvisoryType` field | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S3 line 94 | `memorySnapshotAdvisoryType` | LHW8-T1 doc-only field | ACCEPT |
| `snapshot_full_capture` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 66 | `memorySnapshotAdvisoryType` value | LHW8-T1 S2 | ACCEPT |
| `snapshot_summary_only` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 67 | `memorySnapshotAdvisoryType` value | LHW8-T1 S2 | ACCEPT |
| `snapshot_context_read_only` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 68 | `memorySnapshotAdvisoryType` value | LHW8-T1 S2 | ACCEPT |
| `snapshot_redacted_capture` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 69 | `memorySnapshotAdvisoryType` value | LHW8-T1 S2 | ACCEPT |
| `snapshot_denied` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 70 | `memorySnapshotAdvisoryType` value | LHW8-T1 S2 | ACCEPT |
| `snapshot_approval_pending` | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 71 | `memorySnapshotAdvisoryType` value | LHW8-T1 S2 | ACCEPT |
| EXISTS: `MemoryGatewayDecision.canReinject` boolean field | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 49 | `canReinject` | `MemoryGatewayDecision` | ACCEPT |
| LITERAL_INVARIANT: `MemoryGatewayDecision.rawMemoryReleased=false` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 50 | `rawMemoryReleased` | `MemoryGatewayDecision` | ACCEPT |
| VI3 `AgentMemoryCaptureRecord.captureDecision` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | line 38 | `captureDecision` | `AgentMemoryCaptureRecord` | ACCEPT |
| LH1 `agentmemory` trigger | `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` | line 133 | `agentmemory` | LH1 CVF 16.5 ledger | ACCEPT |

---

## Claim Boundary

`cvf.agentMemoryCapturePackagingAdvisory.lhw14.t1.v1` is a documentation-only
connector. It does not claim memory write, reinjection, `canReinject=true`,
raw memory release, memory packaging execution, receipt envelope extension,
provider behavior, hosted readiness, production readiness, or public release
readiness.
