# CVF LHW6 Project Memory Readout Connector Spec

Memory class: FULL_RECORD

docType: reference

Contract version: `cvf.projectMemoryReadoutConnector.lhw6.t3.v1`

Date: 2026-05-28

Status: CLOSED_PASS_BOUNDED

---

## Scope

Applies to: Orchestrator agents and documentation consumers reading project
durable memory (M1), memory gateway decisions (AIF-C), and workflow recovery
checkpoints (WR1). Documentation-only; no runtime enforcement, code
modification, or public sync.

## Purpose and Claim Boundary

This connector is a normative documentation standard tying M1
`DurableMemoryReceipt` tier state → AIF-C `MemoryGatewayDecision.memoryIdsAffected`
→ WR1 `lastRestorableCheckpoint` + `recoveryAction` into a project-memory readout
packet for Orchestrator session-resume planning.

It closes the LH1 ledger `Review CVF_1.md` trigger gap: M1 holds durable `skill`
and `long-term` memory receipts, WR1 supplies the `lastRestorableCheckpoint`, and
AIF-C provides `MemoryGatewayDecision.memoryIdsAffected` — but no connector defined
the project-memory readout packet that an Orchestrator can read when resuming a
session or workflow to understand where memory stands and what recovery path exists.

T1 gate confirmed: `docs/reviews/CVF_LHW6_T1_TOOL_RUNTIME_BRIDGE_ADVISORY_CONNECTOR_COMPLETION_2026-05-28.md`
— Status: CLOSED_PASS_BOUNDED.

T2 gate confirmed: `docs/reviews/CVF_LHW6_T2_CLI_TOOL_ONBOARDING_GOVERNANCE_CONNECTOR_COMPLETION_2026-05-28.md`
— Status: CLOSED_PASS_BOUNDED.

What this connector is not:

- Not an M1, AIF-C, or WR1 runtime extension.
- Not a memory reinjection authority.
- Not a new memory tier.

Explicit statement: "`canReinject=false` and `rawMemoryReleased=false` are preserved
from M1 and AIF-C boundaries. This connector does not relax either constraint. The
project-memory readout packet is a governance summary record; it does not grant
memory reinjection or raw memory release. LHW4-T1 snapshot receipt is the evidence
anchor."

---

## S2 — M1 Tier + AIF-C Decision + WR1 Checkpoint Readout Mapping

Column definitions: `M1 tier present` | `AIF-C gateway decision` |
`WR1 recoveryAction` | `Project memory state` | `Orchestrator guidance`

| M1 tier present | AIF-C gateway decision | WR1 recoveryAction | Project memory state | Orchestrator guidance |
| --- | --- | --- | --- | --- |
| `skill` tier readable; `canReinject=false` | `allowed=true`; `memoryIdsAffected` populated | `resume_from_checkpoint` | `skill_memory_available` | Skill-tier memory available. Resume from last restorable checkpoint. |
| `long-term` tier readable; `canReinject=false` | `allowed=true`; `memoryIdsAffected` populated | `resume_from_checkpoint` | `long_term_memory_available` | Long-term memory available. Resume from last restorable checkpoint. |
| either tier readable; `canReinject=false` | `allowed=false`; `decision=deny` or `require_human_approval` | `hold_for_reviewer_gate` | `memory_gated_pending_review` | Memory gateway denied access. Hold for reviewer gate before resuming. |
| either tier readable; `canReinject=false` | `allowed=false`; `decision=deny` | `escalate_to_governance` | `memory_gated_escalate` | Memory gateway denied; invalid transition detected. Escalate to governance before resuming. |
| neither tier readable; `lastRestorableCheckpoint=null` | N/A — no gateway query | `request_human_review` | `no_memory_state` | No durable memory available. Request human review or begin fresh session. |

Use M1, AIF-C, and WR1 field names verbatim. `canReinject=false` and
`rawMemoryReleased=false` are invariant in every row.

---

## S3 — Project Memory Readout Packet Minimum Fields

Every project memory readout packet must contain the following fields. These are
documentation-only minimum requirements. `canReinject=false` and
`rawMemoryReleased=false` are invariant. The packet does not extend
`GovernanceEvidenceReceipt` or any existing receipt envelope. It uses LHW4-T1
snapshot receipt as its evidence anchor.

- `projectMemoryReadoutId`: unique token for this readout record (doc-only)
- `durableTierSummary`: list of M1 `DurableMemoryTier` values present with `summaryOnly=true` and `memoryIds`
- `gatewayMemoryIds`: from AIF-C `MemoryGatewayDecision.memoryIdsAffected`
- `canReinject`: always `false`
- `rawMemoryReleased`: always `false`
- `recoveryAnchor`: from WR1 `lastRestorableCheckpoint` (or `null` if none)
- `recoveryAction`: from WR1 `WorkflowRecoveryAction`
- `projectMemoryReadoutBoundary`: one of `skill_memory_available` | `long_term_memory_available` | `memory_gated_pending_review` | `memory_gated_escalate` | `no_memory_state` (doc-only)
- `projectMemoryCanResume`: `true` only when `projectMemoryReadoutBoundary` is `skill_memory_available` or `long_term_memory_available` and `recoveryAction=resume_from_checkpoint` (doc-only)

---

## S4 — Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
| --- | --- | --- |
| M1 durable memory read | Runtime (M1 LPF `durable-memory-store.ts`) | Stable |
| AIF-C memory gateway retrieval | Runtime (AIF-C LPF `controlled-memory-gateway.ts`) | Stable |
| WR1 workflow recovery readout | Runtime (cvf-web `workflow-resolver.ts`) | Stable |
| LHW4-T1 snapshot receipt (evidence anchor) | Document-only (LHW4-T1) | Future: snapshot assembler service |
| Project memory readout packet composition | Document-only | Future: session-resume readout engine |
| Automated session-resume decision | Document-only | Future: Orchestrator session-resume gate |

No doc-only row is labeled Runtime. Composition and session-resume automation remain
advisory documentation only.

---

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| M1 `DurableMemoryTier` values `skill`, `long-term` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | line 13 | `Extract<MemoryTier, "skill" \| "long-term">` | `DurableMemoryTier` | ACCEPT |
| M1 `DurableMemoryReceipt` fields: `summaryOnly`, `canReinject`, `rawMemoryReleased`, `memoryIds`, `tier`, `receiptId` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | lines 35–49 | `summaryOnly: true`, `canReinject: false`, `rawMemoryReleased: false`, `memoryIds`, `tier`, `receiptId` | `DurableMemoryReceipt` | ACCEPT |
| AIF-C `MemoryGatewayDecision.memoryIdsAffected` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | lines 40–51 | `memoryIdsAffected: readonly string[]` | `MemoryGatewayDecision` | ACCEPT |
| AIF-C `MemoryGatewayDecision.allowed` and `decision` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | lines 44–46 | `decision: MemoryGatewayPolicyDecision`, `allowed: boolean` | `MemoryGatewayDecision` | ACCEPT |
| AIF-C `rawMemoryReleased: false` hardcoded | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 50 | `rawMemoryReleased: false` | `MemoryGatewayDecision` | ACCEPT |
| WR1 `WorkflowRecoveryReadout` fields: `lastRestorableCheckpoint`, `recoveryAction`, `recommendedNextAction` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | lines 85–96 | `lastRestorableCheckpoint: WorkflowRecoveryCheckpoint \| null`, `recoveryAction: WorkflowRecoveryAction`, `recommendedNextAction: string` | `WorkflowRecoveryReadout` | ACCEPT |
| WR1 `WorkflowRecoveryAction` values: `resume_from_checkpoint`, `hold_for_reviewer_gate`, `escalate_to_governance`, `request_human_review` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | lines 50–54 | `WorkflowRecoveryAction` | `WorkflowRecoveryAction` | ACCEPT |
| Doc-only fields `projectMemoryReadoutId`, `durableTierSummary`, `gatewayMemoryIds`, `recoveryAnchor`, `projectMemoryReadoutBoundary`, `projectMemoryCanResume` | N/A — new doc-only fields proposed by LHW6-T3 work order | work order S3 new doc-only fields block | doc-only; no runtime source | LHW6-T3 readout packet | ACCEPT |

No `BLOCKED_SOURCE_NOT_FOUND` rows. All claimed runtime/source items are ACCEPT.

---

## Claim Boundary

This connector is documentation-only. It does not claim M1, AIF-C, or WR1 runtime
extension, memory reinjection, new memory tiers, raw memory release, receipt
envelope extension, provider behavior, hosted readiness, production readiness, or
public release readiness.
