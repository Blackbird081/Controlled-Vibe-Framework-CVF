# CVF WCE-W2 MA1 CLI Serialization Connector Spec

Memory class: FULL_RECORD

Status: CLOSED_PASS

docType: connector_spec

Date: 2026-05-29

---

## Purpose

This connector is a documentation-only Phase A artifact.

## Scope / Applies To

Applies to: CVF WCE-W2 MA1 CLI serialization. Maps MA1 standard packet
sections to CLI JSON field names so `buildMa1Packet()` (Phase B) has a
verified schema to implement against. Phase B runtime implementation is
HOLD_UNTIL_W1_AND_W3_PASS.

---

## S1 — Purpose and Gap Citation

Source gap: MA1 standard (`docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md`,
contract `cvf.internalMultiAgentTransfer.ma1.v1`) defines 13 required packet
sections as Markdown prose. No CLI JSON schema exists. `cvf workflow` (WCE-W1)
can emit structured output, but the format is not yet MA1-conformant.

This connector maps each of the 13 MA1 required sections →
`Ma1CliPacket` JSON field name + type for the CLI runtime.

Key invariants:
- `runtimeExecutionAuthorized=false` for this Phase A spec.
- Phase B runtime wiring is DEMAND_GATED pending W1+W3 CLOSED_PASS.
- This connector does not modify any source file.

Authority chain:
- WCE roadmap: `docs/roadmaps/CVF_WCE_WORKFLOW_CHAIN_EXECUTION_ROADMAP_2026-05-29.md`
- WCE GC-018: `docs/baselines/CVF_GC018_WCE_WORKFLOW_CHAIN_EXECUTION_2026-05-29.md`
- MA1 standard: `docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md`

---

## S2 — MA1 Section → CLI Field Mapping

All 13 MA1 required sections mapped to `Ma1CliPacket` JSON fields:

| MA1 section | `Ma1CliPacket` field | Type | Notes |
| --- | --- | --- | --- |
| Contract version | `contractVersion` | `string` | Literal `cvf.ma1CliSerialization.wce.w2.v1` |
| MA1 contract version reference | `ma1ContractVersion` | `string` | Literal `cvf.internalMultiAgentTransfer.ma1.v1` |
| Date | `date` | `string` | ISO 8601 date at packet creation |
| Topic | `topic` | `string` | Human-readable description of the work being transferred |
| Surface Fidelity Gate | `surfaceFidelityGate` | `object` | `{ passed: boolean; notes: string }` |
| Authority Chain | `authorityChain` | `string[]` | Array of file paths or contract refs that authorize this transfer |
| Source Packet | `sourcePacket` | `object` | `{ role: string; output: string; receiptId?: string }` — output from previous step |
| Role Assignment | `roleAssignment` | `object` | `{ targetRole: string; provider?: string; model?: string }` |
| Execution Instructions | `executionInstructions` | `string` | Plain-language task description for the receiving agent |
| Role Output Schema | `roleOutputSchema` | `string` | Expected output format description |
| Dissent Ledger | `dissentLedger` | `string[]` | Array of dissent notes from prior agents (empty if none) |
| Integration Decision | `integrationDecision` | `object` | `{ decision: 'proceed' \| 'hold' \| 'escalate'; reason: string }` |
| Completion Evidence | `completionEvidence` | `object \| null` | `{ receiptId: string; decision: string }` or null when not yet complete |
| Claim Boundary | `claimBoundary` | `string` | What this packet does NOT claim |

Additional CLI-specific fields (not in MA1 standard):

| Field | Type | Purpose |
| --- | --- | --- |
| `workflowContractVersion` | `string` | WCE-W1 contract version: `cvf.workflowChainExecution.wce.w1.v1` |
| `stepIndex` | `number` | Zero-based index of the step in the pipeline |
| `templateKey` | `string` | Workflow template key (e.g. `fullCycle`) |

---

## S3 — Invariants and Boundary

1. `runtimeExecutionAuthorized=false` for this Phase A spec.
2. `Ma1CliPacket` is a **typed planning record** emitted by `cvf workflow --receipt`.
   It does not authorize or trigger any agent action.
3. The `surfaceFidelityGate.passed` field must be `true` before a packet is
   forwarded to the next agent — this is the CLI-side equivalent of the MA1
   Surface Fidelity Gate check.
4. `dissentLedger` accumulates across pipeline steps — each step appends its
   dissent notes rather than resetting.
5. Source `canReinject` from AIF-C is not exposed in MA1 CLI packets —
   memory reinjection remains governed separately.

---

## S4 — Non-Goals

- Modifying MA1 standard document
- Runtime MA1 enforcement on Reviewer/Auditor behavior
- Memory reinjection or `canReinject=true`
- Receipt envelope extension
- Provider behavior changes
- Hosted readiness, production readiness, or public release readiness
- Phase B runtime wiring without W1+W3 CLOSED_PASS confirmation

---

## S5 — Source Verification Table

| Verified symbol | Source file | Line/section | Disposition |
| --- | --- | --- | --- |
| `cvf.internalMultiAgentTransfer.ma1.v1` | `docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | Contract version field | ACCEPT |
| MA1 required 13 sections | `docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | Required Packet Structure section | ACCEPT |
| `WORKFLOW_CHAIN_CONTRACT` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/workflow.client.ts` | `cvf.workflowChainExecution.wce.w1.v1` | ACCEPT |
| `WorkflowStepResult` interface | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/workflow.client.ts` | `WorkflowStepResult` | ACCEPT |

New doc-only fields (no runtime claim until Phase B):

| New field | Purpose | Runtime claim blocked? |
| --- | --- | --- |
| `Ma1CliPacket` type | JSON schema for MA1-conformant CLI packet | Yes — Phase A only |
| `buildMa1Packet()` | Factory function described but not yet implemented | Yes — Phase B |
| `cvf.ma1CliSerialization.wce.w2.v1` | Contract version for CLI MA1 serialization | Yes — Phase A |

---

## Claim Boundary

This Phase A spec defines the JSON schema mapping. It does not implement
`buildMa1Packet()`, emit MA1 packets in `cvf workflow`, modify the MA1
standard, or claim memory reinjection, runtime enforcement, hosted readiness,
production readiness, or public release readiness.

Phase B runtime implementation is gated on W1 and W3 CLOSED_PASS evidence.

## Owner / Source

Owner: CVF public documentation surface.

Source: public-safe export from the CVF 28.05 public-sync capability batch.

## Protocol / Contract / Requirements

This artifact is retained as a bounded public reference. It must be read with
`docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md` before
using it as catalog evidence.

## Enforcement / Verification

Public verification is limited to the exported source, tests, and reference
paths in the public-sync repository. This artifact does not authorize broader
runtime, hosted, production, or provider-parity claims.

## Related Artifacts

- `docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`
- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`
