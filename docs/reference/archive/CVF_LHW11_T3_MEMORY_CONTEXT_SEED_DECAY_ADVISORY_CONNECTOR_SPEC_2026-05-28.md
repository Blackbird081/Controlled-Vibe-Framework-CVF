# CVF LHW11-T3 Memory Context Seed Decay Advisory Connector Spec

Memory class: FULL_RECORD

docType: connector_spec

Contract version: `cvf.memoryContextSeedDecayAdvisory.lhw11.t3.v1`

Date: 2026-05-28

Status: ACTIVE

---

## Purpose

This connector binds LHW8-T1 `memorySnapshotAdvisoryType` (6 values) × LHW7-T2 `contaminationRiskAfterSeed` (`low`/`medium`/`high`) × AIF-C `MemoryGatewayDecision.decision` (6 values) into a memory context seed decay advisory packet.

## Scope / Applies To

Applies to: CVF memory context seed decay advisory surface. Target: documentation-only connector spec. No runtime enforcement.

---

## S1 — Purpose and Claim Boundary

### Purpose

This connector binds LHW8-T1 `memorySnapshotAdvisoryType` (6 values) × LHW7-T2 `contaminationRiskAfterSeed` (`low`/`medium`/`high`) × AIF-C `MemoryGatewayDecision.decision` (6 values) into a memory context seed decay advisory packet.

The connector maps input combinations → a named `memoryContextSeedDecayAdvisoryType` + `promotionGateRecommendation` plain-language guidance.

This closes the gap where no standard maps memory snapshot posture, context seeding risk, and memory gateway policy outcome into a named context decay advisory.

### Claim Boundary

This connector is a documentation-only normalization artifact. It does not execute memory operations, authorize memory reinjection, or release raw memory.

`runtimeExecutionAuthorized=false`

`canReinject=false` (connector-normalized; AIF-C exposes a boolean field, and
this doc-only connector forbids reinjection)

`rawMemoryReleased=false` (preserved from W2/AIF-C/LHW8-T1)

`promotionEligible=false` (preserved from LHW8-T1; this connector does not grant promotion authority)

---

## S2 — Memory Context Seed Decay Advisory Mapping

Input: LHW8-T1 `memorySnapshotAdvisoryType` × LHW7-T2 `contaminationRiskAfterSeed` × AIF-C `MemoryGatewayDecision.decision` → `memoryContextSeedDecayAdvisoryType` + `promotionGateRecommendation`.

| `memorySnapshotAdvisoryType` | `contaminationRiskAfterSeed` | gateway `decision` | `memoryContextSeedDecayAdvisoryType` | `promotionGateRecommendation` |
| --- | --- | --- | --- | --- |
| `snapshot_full_capture` | `low` | `allow` | `memory_context_healthy_eligible_for_review` | Request operator review for promotion. Context healthy and complete. |
| `snapshot_summary_only` | `medium` | `allow_summary_only` | `memory_context_partial_promotion_gated` | Promotion blocked: only summary captured. Full capture required. |
| `snapshot_redacted_capture` | `high` | `allow_redacted` | `memory_context_contaminated_promotion_blocked` | Promotion blocked: high contamination risk. Redaction audit required. |
| `snapshot_denied` | any | `deny` | `memory_context_capture_denied_no_promotion` | No capture; no promotion path. Decay confirmed. |
| `snapshot_approval_pending` | any | `require_human_approval` | `memory_context_pending_human_approval` | Promotion suspended pending human approval of capture. |
| any | `high` | any | `memory_context_high_contamination_hold` | High contamination risk. Hold all promotion requests. |

If `signalsStillMissing` (LHW7-T2) is non-empty, the derived advisory has `missing_signals_present=true` added to its metadata.

---

## S3 — Memory Context Seed Decay Advisory Packet Minimum Fields

A memory context seed decay advisory packet must include:

- `contractVersion`: `cvf.memoryContextSeedDecayAdvisory.lhw11.t3.v1`
- `memorySnapshotAdvisoryType`: from LHW8-T1 (6 values)
- `contaminationRiskAfterSeed`: from LHW7-T2 (`low`/`medium`/`high`/`none`)
- `gatewayDecision`: from AIF-C `MemoryGatewayDecision.decision` (6 values)
- `signalsStillMissing`: from LHW7-T2
- `memoryContextSeedDecayAdvisoryType`: derived from S2 mapping (new doc-only field)
- `promotionGateRecommendation`: derived plain-language guidance (new doc-only field)
- `canReinject`: `false` (connector-normalized invariant)
- `rawMemoryReleased`: `false` (literal invariant)
- `promotionEligible`: `false` (literal invariant)
- `runtimeExecutionAuthorized`: `false` (literal invariant)
- `boundaries`: array of explicit boundary statements

Example packet:

```json
{
  "contractVersion": "cvf.memoryContextSeedDecayAdvisory.lhw11.t3.v1",
  "memorySnapshotAdvisoryType": "snapshot_full_capture",
  "contaminationRiskAfterSeed": "low",
  "gatewayDecision": "allow",
  "memoryContextSeedDecayAdvisoryType": "memory_context_healthy_eligible_for_review",
  "promotionGateRecommendation": "Request operator review for promotion. Context healthy and complete.",
  "canReinject": false,
  "rawMemoryReleased": false,
  "promotionEligible": false,
  "runtimeExecutionAuthorized": false,
  "boundaries": [
    "This connector does not perform memory operations or authorize memory reinjection.",
    "This connector does not grant promotion authority; promotionEligible remains false."
  ]
}
```

---

## S4 — Boundary Table

| Boundary | Rationale | Enforcement |
| --- | --- | --- |
| No memory reinjection | `canReinject=false` connector-normalized | `canReinject=false` explicit |
| No raw memory release | `rawMemoryReleased=false` preserved | `rawMemoryReleased=false` explicit |
| No promotion authority | `promotionEligible=false` preserved | `promotionEligible=false` explicit |
| `runtimeExecutionAuthorized=false` | Literal invariant | S3 example packet |

---

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `memorySnapshotAdvisoryType` field | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S3 line 94 | `memorySnapshotAdvisoryType` | LHW8-T1 doc-only field | ACCEPT |
| `snapshot_full_capture` value | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 66 | `memorySnapshotAdvisoryType` | LHW8-T1 S2 mapping | ACCEPT |
| `snapshot_summary_only` value | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 67 | `memorySnapshotAdvisoryType` | LHW8-T1 S2 mapping | ACCEPT |
| `snapshot_context_read_only` value | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 68 | `memorySnapshotAdvisoryType` | LHW8-T1 S2 mapping | ACCEPT |
| `snapshot_redacted_capture` value | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 69 | `memorySnapshotAdvisoryType` | LHW8-T1 S2 mapping | ACCEPT |
| `snapshot_denied` value | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 70 | `memorySnapshotAdvisoryType` | LHW8-T1 S2 mapping | ACCEPT |
| `snapshot_approval_pending` value | `docs/reference/CVF_LHW8_T1_MEMORY_EVENT_HOOK_GOVERNANCE_SNAPSHOT_CONNECTOR_SPEC_2026-05-28.md` | S2 line 71 | `memorySnapshotAdvisoryType` | LHW8-T1 S2 mapping | ACCEPT |
| `signalsStillMissing` field | `docs/reference/CVF_LHW7_T2_PROJECT_MEMORY_CONTEXT_BUDGET_HANDOFF_CONNECTOR_SPEC_2026-05-28.md` | S3 line 114 | `signalsStillMissing` | LHW7-T2 doc-only field | ACCEPT |
| `contaminationRiskAfterSeed` field | `docs/reference/CVF_LHW7_T2_PROJECT_MEMORY_CONTEXT_BUDGET_HANDOFF_CONNECTOR_SPEC_2026-05-28.md` | S3 line 116 | `contaminationRiskAfterSeed` | LHW7-T2 doc-only field | ACCEPT |
| `low` value | `docs/reference/CVF_LHW7_T2_PROJECT_MEMORY_CONTEXT_BUDGET_HANDOFF_CONNECTOR_SPEC_2026-05-28.md` | S3 line 116 | `contaminationRiskAfterSeed` | LHW7-T2 doc-only field | ACCEPT |
| `medium` value | `docs/reference/CVF_LHW7_T2_PROJECT_MEMORY_CONTEXT_BUDGET_HANDOFF_CONNECTOR_SPEC_2026-05-28.md` | S3 line 116 | `contaminationRiskAfterSeed` | LHW7-T2 doc-only field | ACCEPT |
| `high` value | `docs/reference/CVF_LHW7_T2_PROJECT_MEMORY_CONTEXT_BUDGET_HANDOFF_CONNECTOR_SPEC_2026-05-28.md` | S3 line 116 | `contaminationRiskAfterSeed` | LHW7-T2 doc-only field | ACCEPT |
| `MemoryGatewayPolicyDecision` type | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 15 | `MemoryGatewayPolicyDecision` | `MemoryGatewayPolicyDecision` | ACCEPT |
| `allow` value | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 16 | `MemoryGatewayPolicyDecision` | `MemoryGatewayPolicyDecision` | ACCEPT |
| `allow_summary_only` value | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 19 | `MemoryGatewayPolicyDecision` | `MemoryGatewayPolicyDecision` | ACCEPT |
| `allow_redacted` value | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 18 | `MemoryGatewayPolicyDecision` | `MemoryGatewayPolicyDecision` | ACCEPT |
| `deny` value (MemoryGatewayPolicyDecision) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 20 | `MemoryGatewayPolicyDecision` | `MemoryGatewayPolicyDecision` | ACCEPT |
| `require_human_approval` value (MemoryGatewayPolicyDecision) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 21 | `MemoryGatewayPolicyDecision` | `MemoryGatewayPolicyDecision` | ACCEPT |
| `MemoryGatewayDecision.decision` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 44 | `decision` | `MemoryGatewayDecision` | ACCEPT |
| `MemoryGatewayDecision.canReinject` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 49 | `canReinject` | `MemoryGatewayDecision` | ACCEPT |
| `MemoryGatewayDecision.rawMemoryReleased` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | line 50 | `rawMemoryReleased` | `MemoryGatewayDecision` | ACCEPT |
| `memoryContextSeedDecayAdvisoryType` field | N/A — new doc-only field | S3 new fields | `memoryContextSeedDecayAdvisoryType` | new doc-only field | ACCEPT |
| `promotionGateRecommendation` field | N/A — new doc-only field | S3 new fields | `promotionGateRecommendation` | new doc-only field | ACCEPT |

---

## Claim Boundary

This connector is a documentation-only normalization artifact. It does not perform memory operations, raw memory release, memory reinjection, or grant promotion authority.

`runtimeExecutionAuthorized=false`

`canReinject=false` (connector-normalized)

`rawMemoryReleased=false`

`promotionEligible=false`
