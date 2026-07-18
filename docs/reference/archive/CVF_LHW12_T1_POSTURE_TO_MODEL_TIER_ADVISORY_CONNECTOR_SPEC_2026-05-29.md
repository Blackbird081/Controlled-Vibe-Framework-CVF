# CVF LHW12-T1 Posture-to-Model Tier Advisory Connector Spec

Memory class: FULL_RECORD

docType: connector_spec

Contract version: `cvf.modelTierAdvisory.lhw12.t1.v1`

Date: 2026-05-29

Status: ACTIVE

---

## Purpose

This connector binds LHW11-T1 `sessionGovernancePostureType` (3 values) × CB1 `budgetTier` (3 values) × G1 `cvfRole` into a posture-to-model tier planning advisory.

## Scope / Applies To

Applies to: CVF posture-to-model planning advisory surface. Target: documentation-only connector spec. No runtime enforcement.

---

## S1 — Purpose and Claim Boundary

### Purpose

This connector binds LHW11-T1 `sessionGovernancePostureType` (3 values) × CB1 `budgetTier` (3 values) × G1 `cvfRole` into a posture-to-model tier planning advisory.

The connector maps input combinations → a named `modelTierAdvisoryType` + `recommendedModelTier` plain-language guidance.

This closes the gap where no standard maps posture aggregates, context budget constraints, and active identity roles into a recommended model assignment advisory.

### Claim Boundary

This connector is a documentation-only normalization artifact. It does not select or dispatch models, mutate provider routing, or change provider execution configurations.

`runtimeExecutionAuthorized=false`

---

## S2 — Posture-to-Model Tier Advisory Mapping

Input: LHW11-T1 `sessionGovernancePostureType` × CB1 `budgetTier` × G1 `cvfRole` → `modelTierAdvisoryType` + `recommendedModelTier`.

| `sessionGovernancePostureType` | `budgetTier` | gateway `cvfRole` | `modelTierAdvisoryType` | `recommendedModelTier` |
| --- | --- | --- | --- | --- |
| `posture_blocked` | any | any | `model_tier_premium_required` | `premium` |
| `posture_hold` | `expanded` | any | `model_tier_standard_or_premium` | `standard` |
| `posture_hold` | `standard` | any | `model_tier_standard` | `standard` |
| `posture_hold` | `minimal` | any | `model_tier_eco_with_hold_note` | `eco` |
| `posture_clear` | `expanded` | any | `model_tier_standard` | `standard` |
| `posture_clear` | `standard` | any | `model_tier_eco_or_standard` | `eco` |
| `posture_clear` | `minimal` | any | `model_tier_eco` | `eco` |

If `highestRiskAdvisory` (LHW11-T1) is active, the derived advisory adds the `highestRiskAdvisory` string verbatim to its metadata payload for additional Orchestrator visibility.

---

## S3 — Posture-to-Model Tier Advisory Packet Minimum Fields

A posture-to-model tier advisory packet must include:

- `contractVersion`: `cvf.modelTierAdvisory.lhw12.t1.v1`
- `sessionGovernancePostureType`: from LHW11-T1 (3 values)
- `highestRiskAdvisory`: from LHW11-T1
- `budgetTier`: from CB1 (`minimal`/`standard`/`expanded`)
- `cvfRole`: from G1 `CVFRole`
- `modelTierAdvisoryType`: derived from S2 mapping (new doc-only field)
- `recommendedModelTier`: derived plain recommendation (new doc-only field)
- `runtimeExecutionAuthorized`: `false` (literal invariant)
- `boundaries`: array of explicit boundary statements

Example packet:

```json
{
  "contractVersion": "cvf.modelTierAdvisory.lhw12.t1.v1",
  "sessionGovernancePostureType": "posture_hold",
  "highestRiskAdvisory": "transition_enforcement_active",
  "budgetTier": "standard",
  "cvfRole": "OPERATOR",
  "modelTierAdvisoryType": "model_tier_standard",
  "recommendedModelTier": "standard",
  "runtimeExecutionAuthorized": false,
  "boundaries": [
    "This connector does not dispatch model selection or route provider requests.",
    "The recommended model tier is for planning and advisory purposes only."
  ]
}
```

---

## S4 — Boundary Table

| Boundary | Rationale | Enforcement |
| --- | --- | --- |
| No runtime model routing | Doc-only advisory | `runtimeExecutionAuthorized=false` explicit |
| No provider dispatch changes | Invariant stated in S1 | Spec examples and S3 packet |
| Planning-only posture | Advisory only | `modelTierAdvisoryType` doc-only |

---

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `sessionGovernancePostureType` field | `docs/reference/CVF_LHW11_T1_SESSION_GOVERNANCE_POSTURE_AGGREGATOR_CONNECTOR_SPEC_2026-05-28.md` | S3 field list | `sessionGovernancePostureType` | LHW11-T1 doc-only field | ACCEPT |
| `posture_clear` value | `docs/reference/CVF_LHW11_T1_SESSION_GOVERNANCE_POSTURE_AGGREGATOR_CONNECTOR_SPEC_2026-05-28.md` | S3 line 55 | `sessionGovernancePostureType` | LHW11-T1 S3 | ACCEPT |
| `posture_hold` value | `docs/reference/CVF_LHW11_T1_SESSION_GOVERNANCE_POSTURE_AGGREGATOR_CONNECTOR_SPEC_2026-05-28.md` | S3 line 55 | `sessionGovernancePostureType` | LHW11-T1 S3 | ACCEPT |
| `posture_blocked` value | `docs/reference/CVF_LHW11_T1_SESSION_GOVERNANCE_POSTURE_AGGREGATOR_CONNECTOR_SPEC_2026-05-28.md` | S3 line 56 | `sessionGovernancePostureType` | LHW11-T1 S3 | ACCEPT |
| `highestRiskAdvisory` field | `docs/reference/CVF_LHW11_T1_SESSION_GOVERNANCE_POSTURE_AGGREGATOR_CONNECTOR_SPEC_2026-05-28.md` | S3 field list | `highestRiskAdvisory` | LHW11-T1 doc-only field | ACCEPT |
| `RouteRequestContextBudgetTier` type | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-request-context-readout.ts` | line 6 | `RouteRequestContextBudgetTier` | CB1 runtime type | ACCEPT |
| `minimal` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-request-context-readout.ts` | line 6 | `RouteRequestContextBudgetTier` | CB1 runtime type | ACCEPT |
| `standard` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-request-context-readout.ts` | line 6 | `RouteRequestContextBudgetTier` | CB1 runtime type | ACCEPT |
| `expanded` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-request-context-readout.ts` | line 6 | `RouteRequestContextBudgetTier` | CB1 runtime type | ACCEPT |
| `budgetTier` field | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-request-context-readout.ts` | line 16 | `budgetTier` | `RouteRequestContextReadout` | ACCEPT |
| `CVFRole` type | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 1 import | `CVFRole` | `ExecutionIdentityDecision` | ACCEPT |
| `cvfRole` field | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 29 | `cvfRole` | `ExecutionIdentityDecision` | ACCEPT |

## New Doc-Only Fields

| Field | Definition surface | Runtime/source status | Dispatch disposition |
| --- | --- | --- | --- |
| `modelTierAdvisoryType` | S2 mapping and S3 packet | New documentation-only connector field | Defined by this connector spec; not source-verified as existing runtime |
| `recommendedModelTier` | S2 mapping and S3 packet | New documentation-only connector field | Defined by this connector spec; not source-verified as existing runtime |

---

## Claim Boundary

This connector is a documentation-only normalization artifact. It does not perform model selection, provider routing, runtime model dispatching, or execute workflow routing rules.

`runtimeExecutionAuthorized=false`
