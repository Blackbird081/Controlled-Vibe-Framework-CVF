# CVF LHW8-T1 Memory Event Hook Governance Snapshot Connector Spec

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

Contract version: `cvf.memoryEventHookGovernanceSnapshot.lhw8.t1.v1`

docType: connector_spec

Date: 2026-05-28

---

## Purpose

This connector spec normalizes how W2 `MemoryEventHookDecision`, AIF-C
`MemoryGatewayDecision`, and VI3 `AgentMemoryCaptureRecord` are combined into
a governance snapshot advisory packet. It closes the gap where no standard
maps these three surfaces into a named `memorySnapshotAdvisoryType` with
explicit promotion eligibility.

LH1 triggers addressed: `agentmemory` (PARTIALLY_ABSORBED — reopen for
capture/read packaging improvements), `tolaria` (PARTIALLY_ABSORBED — reopen
for governed memory snapshot packaging).

## Scope / Applies To

Documentation-only connector. Applies to any CVF session where a memory event
hook evaluation, gateway decision, and capture record co-occur and an agent
must describe the combined capture posture. Does not apply to runtime memory
execution, memory injection, or prompt seeding from captured memory.

---

## S1 — Purpose and Claim Boundary

**Gap addressed:** W2 `MemoryEventHookDecision` defines what a hook event
yields; AIF-C `MemoryGatewayDecision.decision` defines the gateway policy
outcome; VI3 `AgentMemoryCaptureRecord.captureDecision` records what was
actually stored. No standard combines these into a single advisory type that
names the snapshot posture and states whether the record is eligible for
promotion.

**This connector does not re-execute memory operations.** The snapshot
advisory packet is a non-blocking governance record describing the combined
capture posture. It does not inject memory into the prompt, grant
`canReinject=true`, release raw memory, or extend W2/AIF-C/VI3 runtime
behavior.

**Invariants:**

- `runtimeExecutionAuthorized=false`
- `canReinject=false` (preserved from W2 `MemoryEventHookReceipt`; connector
  packet normalizes AIF-C `MemoryGatewayDecision.canReinject` to false for
  this advisory and must not represent an authorized reinjection path)
- `rawMemoryReleased=false` (preserved from W2 `MemoryEventHookReceipt` and
  AIF-C `MemoryGatewayDecision`)

## S2 — Memory Hook → Snapshot Advisory Mapping

Session-Resume Snapshot Advisory Map:

| W2 `MemoryEventHookDecision` | AIF-C `MemoryGatewayDecision.decision` | VI3 `AgentMemoryCaptureRecord.captureDecision` | `memorySnapshotAdvisoryType` | `promotionEligible` | Notes |
| --- | --- | --- | --- | --- | --- |
| `allow_capture` | `allow` | captured | `snapshot_full_capture` | `false` | Captured; not automatically promotion-eligible. Manual review required before promotion. |
| `allow_capture` | `allow_summary_only` | captured_summary | `snapshot_summary_only` | `false` | Only summary captured; raw omitted; not promotion-eligible without full capture proof. |
| `allow_context_read` | `allow` | context_read | `snapshot_context_read_only` | `false` | Read without capture; no stored record; advisory only. |
| `allow_redacted_capture` | `allow_redacted` | captured_redacted | `snapshot_redacted_capture` | `false` | Redacted capture; promotion blocked until redaction audit complete. |
| `deny` | `deny` | skipped | `snapshot_denied` | `false` | No capture; no stored record; advisory notes denial reason. |
| `require_human_approval` | `require_human_approval` | pending | `snapshot_approval_pending` | `false` | Awaiting human approval; no capture until approved. |

Key invariant: Prior `captureDecision` does not automatically promote to
long-term or organizational memory. Promotion requires explicit operator
review and a fresh governance record.

## S3 — Snapshot Advisory Packet Minimum Fields

All fields are documentation-only advisory fields unless marked
Runtime-proven.

| Field | Source | Invariant | Notes |
| --- | --- | --- | --- |
| `hookEventId` | W2 `MemoryEventHookInput.eventId` | — | Links advisory to W2 event |
| `hookEventType` | W2 `MemoryEventHookType` | — | Named event type from W2 |
| `hookDecision` | W2 `MemoryEventHookDecision` | — | One of 5 W2 values verbatim |
| `gatewayOperation` | AIF-C `MemoryGatewayDecision.operation` | — | Named gateway operation |
| `gatewayDecision` | AIF-C `MemoryGatewayDecision.decision` | — | AIF-C policy outcome |
| `gatewayCanReinject` | AIF-C `MemoryGatewayDecision.canReinject` | connector-normalized `=false` | Source field is boolean; this advisory packet requires false |
| `gatewayRawMemoryReleased` | AIF-C `MemoryGatewayDecision.rawMemoryReleased` | `=false` | Preserved invariant |
| `captureDecision` | VI3 `AgentMemoryCaptureRecord.captureDecision` | — | Actual capture outcome |
| `policyContext` | VI3 `AgentMemoryCaptureRecord.policyContext` | — | Actor/scope/canReinject context |
| `privacyFilters` | VI3 `AgentMemoryCaptureRecord.privacyFilters` | — | Applied privacy filters |
| `memorySnapshotAdvisoryType` | N/A — new doc-only | — | Advisory type from S2 mapping |
| `captureDecisionSummary` | N/A — new doc-only | — | One-sentence human-readable summary |
| `promotionEligible` | N/A — new doc-only | `=false` | Always false; promotion requires explicit operator review |
| `runtimeExecutionAuthorized` | N/A — new doc-only | `=false` | Connector invariant |

## S4 — Boundary Table

| Surface | Status | Notes |
| --- | --- | --- |
| W2 `MemoryEventHookDecision` (5 values) | Runtime-proven | Source: `memory-event-hooks.ts` lines 32–37 |
| W2 `MemoryEventHookReceipt.canReinject=false` | Runtime-proven | Source: `memory-event-hooks.ts` line 63 |
| W2 `MemoryEventHookReceipt.rawMemoryReleased=false` | Runtime-proven | Source: `memory-event-hooks.ts` line 62 |
| AIF-C `MemoryGatewayDecision` | Runtime-proven | Source: `controlled-memory-gateway.ts` lines 40–51 |
| AIF-C `MemoryGatewayDecision.rawMemoryReleased=false` | Runtime-proven | Source: `controlled-memory-gateway.ts` line 50 |
| VI3 `AgentMemoryCaptureRecord.captureDecision` | Runtime-proven | Source: `audit-memory-receipt.ts` line 38 |
| VI3 `AgentMemoryCaptureRecord.policyContext` | Runtime-proven | Source: `audit-memory-receipt.ts` lines 28–34 |
| `memorySnapshotAdvisoryType` (new) | Doc-only | Defined in this connector; no runtime source |
| `captureDecisionSummary` (new) | Doc-only | Defined in this connector; no runtime source |
| `promotionEligible` (new) | Doc-only | Defined in this connector; always `false` |
| Memory re-execution or injection | Not authorized | `runtimeExecutionAuthorized=false` |
| Raw memory release | Not authorized | `rawMemoryReleased=false` preserved |
| `canReinject=true` relaxation | Not authorized | `canReinject=false` preserved |

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `MemoryEventHookDecision` type | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | line 32 | `MemoryEventHookDecision` | `MemoryEventHookDecision` | ACCEPT |
| `allow_capture` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | line 33 | `MemoryEventHookDecision` value | `MemoryEventHookDecision` | ACCEPT |
| `allow_context_read` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | line 34 | `MemoryEventHookDecision` value | `MemoryEventHookDecision` | ACCEPT |
| `allow_redacted_capture` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | line 35 | `MemoryEventHookDecision` value | `MemoryEventHookDecision` | ACCEPT |
| `deny` (MemoryEventHookDecision) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | line 36 | `MemoryEventHookDecision` value | `MemoryEventHookDecision` | ACCEPT |
| `require_human_approval` (MemoryEventHookDecision) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | line 37 | `MemoryEventHookDecision` value | `MemoryEventHookDecision` | ACCEPT |
| `MemoryEventHookReceipt.rawMemoryReleased=false` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | line 62 | `rawMemoryReleased` | `MemoryEventHookReceipt` | ACCEPT |
| `MemoryEventHookReceipt.canReinject=false` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | line 63 | `canReinject` | `MemoryEventHookReceipt` | ACCEPT |
| `MemoryGatewayDecision` interface | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | lines 40–51 | `MemoryGatewayDecision` | `MemoryGatewayDecision` | ACCEPT |
| `MemoryGatewayDecision.operation` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 43 | `operation` | `MemoryGatewayDecision` | ACCEPT |
| `MemoryGatewayDecision.decision` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 44 | `decision` | `MemoryGatewayDecision` | ACCEPT |
| `MemoryGatewayDecision.canReinject` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 49 | `canReinject` | `MemoryGatewayDecision` | ACCEPT |
| `MemoryGatewayDecision.rawMemoryReleased=false` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 50 | `rawMemoryReleased` | `MemoryGatewayDecision` | ACCEPT |
| `AgentMemoryCaptureRecord.captureDecision` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | line 38 | `captureDecision` | `AgentMemoryCaptureRecord` | ACCEPT |
| `AgentMemoryCaptureRecord.policyContext` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | lines 28–34 | `policyContext` | `AgentMemoryCaptureRecord` | ACCEPT |
| `AgentMemoryCaptureRecord.privacyFilters` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | line 36 | `privacyFilters` | `AgentMemoryCaptureRecord` | ACCEPT |
| New doc-only `memorySnapshotAdvisoryType` | N/A — doc-only | S3 new fields | doc-only | Snapshot advisory packet | ACCEPT |
| New doc-only `captureDecisionSummary` | N/A — doc-only | S3 new fields | doc-only | Snapshot advisory packet | ACCEPT |
| New doc-only `promotionEligible` | N/A — doc-only | S3 new fields | doc-only | Snapshot advisory packet | ACCEPT |

---

## Claim Boundary

`cvf.memoryEventHookGovernanceSnapshot.lhw8.t1.v1` is a documentation-only
connector. It does not claim W2/AIF-C/VI3 runtime extension, memory
re-execution, memory injection, prompt seeding from raw memory, raw memory
release, `canReinject=true` relaxation, receipt envelope extension, provider
behavior, hosted readiness, production readiness, or public release readiness.
