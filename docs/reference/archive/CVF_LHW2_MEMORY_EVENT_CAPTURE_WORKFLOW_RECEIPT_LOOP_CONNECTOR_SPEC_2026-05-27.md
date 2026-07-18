# CVF LHW2 Memory Event Capture Workflow Receipt Loop Connector — Specification

Memory class: FULL_RECORD

docType: reference

Status: ACTIVE

Contract version: `cvf.memoryEventCaptureWorkflowReceiptLoopConnector.lhw2.t1.v1`

Date: 2026-05-27

Authority: `docs/work_orders/CVF_WO_LHW2_T1_MEMORY_EVENT_CAPTURE_WORKFLOW_RECEIPT_LOOP_CONNECTOR_2026-05-27.md`

---

## Purpose

A normative document binding W2 memory event hook decision classes to VI3
agent memory capture record fields and the controlled-memory receipt used by
the audit-memory route into a traceable loop. Closes the gap where W2, VI3,
and M1 each exist as proven runtime pieces but no connector standard ties them
into a coherent handoff chain.

## Scope

Applies to all CVF governed memory events evaluated by the W2 hook classifier
(`evaluateMemoryEventHook`) and subsequently captured via the VI3
`AgentMemoryCaptureRecord` under the M1 durable memory boundary.

Source authority:

- W2: `docs/reviews/CVF_W2_MEMORY_EVENT_HOOKS_CONTEXT_PACKAGER_COMPLETION_2026-05-24.md`
- VI3: `docs/reviews/archive/CVF_VI3_AGENTMEMORY_CAPTURE_RECORD_READOUT_COMPLETION_2026-05-25.md`
- M1: `docs/reviews/CVF_M1_DURABLE_CROSS_SESSION_MEMORY_COMPLETION_2026-05-24.md`
- LHW2 roadmap: `docs/roadmaps/CVF_LHW2_WORKFLOW_CONNECTOR_COMPLETION_ROADMAP_2026-05-27.md`

---

## S1 — Purpose and Claim Boundary

This connector is a documentation artifact. It does not modify
`memory-event-hooks.ts`, `audit-memory-receipt.ts`, or any other source file.

What this connector is: a normative doc binding W2 event hook decision classes
to VI3 capture record fields and controlled-memory receipt fields.

What this connector is not: not a W2/VI3 runtime extension; not a new memory
tier; not a reinjection path; not an M1 persistence change.

"`canReinject: false` and `rawMemoryReleased: false` are preserved from W2,
VI3, M1, and M2 boundaries. This connector does not relax either constraint."

---

## S2 — Event Hook Class to Capture Record Field Mapping

Source-verified from
`EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts`
(`MemoryEventHookDecision`) and
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts`
(`AgentMemoryCaptureRecord`). See S6 for full Source Verification Table.

| W2 hook decision | Trigger condition | VI3 captureRecord field | Propagation rule |
|---|---|---|---|
| `allow_capture` | Standard event, no sensitive data, not a context event | `captureDecision` | Include in receipt; event ids added to `memoryIds` |
| `allow_redacted_capture` | `containsSensitiveData=true` on hook input | `privacyFilters` | Redacted summary only; raw value not passed downstream |
| `allow_context_read` | `memory_retrieval_request` or `memory_context_packaged` with non-empty `memoryIds` | `memoryIds` | Evidence ids propagated to receipt `memoryIds` |
| `deny` | Disallowed hook type, policy gate denied, or missing required field | `captureDecision` | Excluded; denial reason recorded in `captureDecision` |
| `require_human_approval` | `policyDecision=require_human_approval` or `riskLevel=R3` | `policyContext` | Hold; human approval required before capture proceeds |

---

## S3 — Capture Record to Controlled Memory Receipt Binding

Uses existing `ControlledMemoryReceipt` fields in the `audit-memory-receipt`
path. `GovernanceEvidenceReceipt` is a separate `/api/execute` evidence type;
this connector does not claim those two receipt shapes are equivalent and does
not define new receipt envelope fields.

| VI3 captureRecord field | ControlledMemoryReceipt field | Binding rule | Current status |
|---|---|---|---|
| `captureDecision` | `decision` | Capture decision string maps to receipt `decision` token | RUNTIME_PROVEN (VI3: `captureDecision: receipt.decision` wired in route) |
| `privacyFilters` | `reason` | Privacy filter label recorded as redaction reason in receipt | DOC_ONLY |
| `memoryIds` | `memoryIds` | Memory event ids propagate into receipt `memoryIds` array | RUNTIME_PROVEN (VI3: `memoryIds: receipt.memoryIds` wired in route) |
| `rawMemoryReleased: false` (W2 hook receipt boundary) | *(no controlled-memory receipt field)* | Enforced at W2 hook level; `MemoryEventHookReceipt.rawMemoryReleased: false` literal; receipt confirms by absence | RUNTIME_PROVEN (W2 LPF: literal in `MemoryEventHookReceipt`) |
| `policyContext.canReinject: false` | `provenanceRequired: true` | `canReinject: false` enforced in `AgentMemoryCaptureRecord.policyContext`; receipt signals `provenanceRequired: true` as boundary indicator | DOC_ONLY binding |

---

## S4 — Loop Completion Standard

When a memory event completes the full loop (hook → capture → receipt), the
expected evidence trail at each stage is:

**At hook evaluation:** `evaluateMemoryEventHook` returns a
`MemoryEventHookEvaluation` with `decision` (one of the five W2 classes) and
a `MemoryEventHookReceipt` with `rawMemoryReleased: false` and `canReinject: false`.

**At capture record:** `AgentMemoryCaptureRecord` is populated with
`captureDecision` (= hook receipt `decision`), `memoryIds` (= hook receipt
`memoryIds`), `privacyFilters` (when `allow_redacted_capture`), and
`policyContext.canReinject: false`.

**At controlled-memory receipt:** `ControlledMemoryReceipt` carries `decision` (= captureDecision),
`memoryIds` (= captureRecord.memoryIds), and `provenanceRequired: true`.

"The loop is traceable when a receipt contains the memory ids from
`captureRecord.memoryIds` and `rawMemoryReleased: false` is confirmed in the
W2 hook receipt for the same event."

---

## S5 — Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
|---|---|---|
| W2 event hook classification (`evaluateMemoryEventHook`) | Runtime (LPF) | Stable |
| VI3 capture record readout (`AgentMemoryCaptureRecord`) | Runtime (cvf-web route) | Stable |
| M1 durable memory read/write | Runtime (LPF) | Stable |
| Hook-to-capture-record binding | Document-only | Future: LPF wire-up |
| Capture-to-receipt binding | Document-only | Future: receipt field extension tranche |
| Loop completion verification | Document-only | Future: loop-trace validator |

---

## S6 — Source Verification Table

| Claimed field | Source file | Verified field path | Owning interface/function | Disposition |
|---|---|---|---|---|
| `allow_capture` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | `MemoryEventHookDecision = 'allow_capture'` | `MemoryEventHookDecision` type | ACCEPT |
| `allow_redacted_capture` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | `MemoryEventHookDecision = 'allow_redacted_capture'` | `MemoryEventHookDecision` type | ACCEPT |
| `allow_context_read` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | `MemoryEventHookDecision = 'allow_context_read'` | `MemoryEventHookDecision` type | ACCEPT |
| `deny` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | `MemoryEventHookDecision = 'deny'` | `MemoryEventHookDecision` type | ACCEPT |
| `require_human_approval` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | `MemoryEventHookDecision = 'require_human_approval'` | `MemoryEventHookDecision` type | ACCEPT |
| `rawMemoryReleased` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | `MemoryEventHookReceipt.rawMemoryReleased: false` | `MemoryEventHookReceipt` interface | ACCEPT |
| `canReinject` (hook) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | `MemoryEventHookReceipt.canReinject: false` | `MemoryEventHookReceipt` interface | ACCEPT |
| `captureDecision` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | `AgentMemoryCaptureRecord.captureDecision` | `AgentMemoryCaptureRecord` interface | ACCEPT |
| `privacyFilters` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | `AgentMemoryCaptureRecord.privacyFilters` | `AgentMemoryCaptureRecord` interface | ACCEPT |
| `memoryIds` (capture) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | `AgentMemoryCaptureRecord.memoryIds` | `AgentMemoryCaptureRecord` interface | ACCEPT |
| `policyContext.canReinject` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | `AgentMemoryCaptureRecord.policyContext.canReinject: false` | `AgentMemoryCaptureRecord` interface | ACCEPT |
| `decision` (receipt) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts` | `ControlledMemoryReceipt.decision` | `ControlledMemoryReceipt` interface | ACCEPT |
| `reason` (receipt) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts` | `ControlledMemoryReceipt.reason` | `ControlledMemoryReceipt` interface | ACCEPT |
| `memoryIds` (receipt) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts` | `ControlledMemoryReceipt.memoryIds` | `ControlledMemoryReceipt` interface | ACCEPT |
| `provenanceRequired` (receipt) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts` | `ControlledMemoryReceipt.provenanceRequired` | `ControlledMemoryReceipt` interface | ACCEPT |

---

## Claim Boundary

This connector is a documentation artifact only. It does not claim W2/VI3
runtime extension, new memory tiers, memory reinjection, receipt envelope
extension, provider behavior, hosted readiness, production readiness, or
public release readiness.

Contract version: `cvf.memoryEventCaptureWorkflowReceiptLoopConnector.lhw2.t1.v1`.
