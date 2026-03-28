---
tranche: W7-T5
checkpoint: CP2
title: Spec Inference Integration Contract
date: 2026-03-28
status: DELIVERED
gate: P8
---

# W7-T5 / CP2 — Spec Inference Integration Contract

Memory class: FULL_RECORD

> Lane: Full Lane (GC-019)
> Gate delivered: P8 — SATISFIED (by isolation design)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T5_SPEC_INFERENCE_AUTONOMY_LOCK_2026-03-28.md`
> Integration decision: GO WITH FIXES (Review 16 — Spec Inference + Spec Policy only)

---

## 1. StructuredSpec Schema

A `StructuredSpec` is the canonical CVF representation of an inferred specification artifact.

```
StructuredSpec {
  id: string                       // deterministic hash from (name + sourceRef + inferredAt)
  name: string                     // normalized spec name (kebab-case, max 80 chars)
  intent: string                   // what this spec is intended to achieve (max 300 chars)
  constraints: string[]            // explicit constraints on the spec (max 10 items)
  inferredAt: string               // ISO 8601 timestamp (DESIGN phase only)
  phase: 'DESIGN'                  // hard-locked — inference cannot occur outside DESIGN
  confidence: 'high' | 'medium' | 'low'
  riskLevel: W7RiskLevel           // R0 | R1 | R2 | R3 (from W7-T2 risk contract)
  guardPreset: SpecGuardPreset     // P-12 | P-13 | P-14 | P-15
  sourceRef: string                // conversation artifact ref (read-only input)
  status: 'draft' | 'proposed' | 'approved' | 'retired'
  policyGateRef?: string           // EPF policy gate receipt ref (required when riskLevel >= R2)
}
```

Phase hard-constraint: `phase: 'DESIGN'` prevents Spec Inference from being invoked at BUILD or REVIEW phase.

---

## 2. Spec Inference Protocol

### Phase Constraint (non-negotiable — P8 isolation)

Spec Inference MAY ONLY occur during the **DESIGN** phase.

```
INTAKE → DESIGN ← inference window → BUILD → REVIEW → FREEZE
```

Inference at BUILD or REVIEW phase is a G4 (BOUNDARY_CROSSING_GUARD) violation.

### Isolation Boundaries (P8)

Spec Inference is isolated from Runtime and Model components by the following hard constraints:

| Boundary | Rule | Violation Guard |
|---|---|---|
| Runtime access | Spec Inference has NO read access to EPF Runtime internal state | G4 BOUNDARY_CROSSING |
| Model mutation | Spec Inference CANNOT mutate any model component | G4 BOUNDARY_CROSSING |
| Execution trigger | Spec confidence CANNOT directly trigger execution | G5 AUTONOMY_LOCK (P6) |
| Planner access | Spec Inference reads conversation artifacts only — not Planner internal state | G4 BOUNDARY_CROSSING |

### Inference Trigger Conditions

Inference is triggered when:
1. Current workflow phase is DESIGN
2. A conversation artifact contains a repeated, structured requirement pattern
3. The pattern has not been previously captured in an existing `StructuredSpec`
4. Human or authorized agent initiates inference (no autonomous initiation)

### Inference Output

```
SpecInferenceOutput {
  spec: StructuredSpec              // the inferred spec
  inferredBy: string                // agent or human identifier
  sourceArtifactRef: string         // conversation artifact that triggered inference
  proposedAction: 'draft' | 'propose'  // 'propose' only if confidence='high' + R0/R1
  requiresHumanReview: boolean      // always true for R2+; for R0/R1 if confidence < 'high'
}
```

---

## 3. Policy Enforcement

| Guard Preset | Scenario | Guards Active | Enforcement |
|---|---|---|---|
| P-12 | Read/view StructuredSpec | G3 | GEF governance checkpoint |
| P-13 | Draft inference from artifact | G1, G3 | LPF observability advisory |
| P-14 | Propose/approve spec mutation | G1, G2, G3 | EPF `policy.gate.contract.ts` |
| P-15 | Spec used for any autonomous action | G1, G2, G3, G5 | EPF policy gate + G5 hard block (P6) |

Spec confidence does NOT bypass policy enforcement. A `confidence: 'high'` spec at R2 still requires EPF policy gate PASS (P-14) before any mutation.

---

## 4. Spec Lifecycle

```
draft → proposed → approved → retired
```

| Transition | Permitted By | Guard Preset |
|---|---|---|
| (new) → draft | Any DESIGN-phase inference | P-13 |
| draft → proposed | Agent/human with R1 authorization | P-13 |
| proposed → approved | Policy gate PASS (R2 + human checkpoint) | P-14 |
| approved → retired | Policy gate PASS (R2) | P-14 |
| Any → autonomous use | P6 all preconditions (P-15) | P-15 |

---

## 5. Review 16 Accept/Fix Matrix (Spec Inference Proposals)

| Proposal (Review 16) | Decision | Fix Applied |
|---|---|---|
| Spec Inference at any workflow phase | REJECT | DESIGN-phase only hard-locked |
| Spec confidence triggers execution directly | REJECT | Spec confidence → proposal only; execution requires P6 preconditions |
| Parallel policy engine for spec enforcement | REJECT | Policy routes through existing EPF policy.gate + GEF; no new engine |
| StructuredSpec reads Runtime internal state | REJECT | P8 isolation: G4 violation if Runtime internal state is accessed |
| Spec schema with open metadata fields | FIX | Schema constrained to StructuredSpec fields above |
| Spec confidence as a trust signal for autonomy | FIX | Confidence is a proposal-enabler (draft→propose), not an autonomy-unlocker |
| Spec versioning | ACCEPT | `status` lifecycle supports draft→proposed→approved→retired |
| Source artifact tracking | ACCEPT | `sourceRef` captures provenance |
| Human review for R2+ specs | ACCEPT | `requiresHumanReview: true` for all R2+ inference outputs |
| Spec Inference scoped to Review 16 only | ACCEPT | P8: integrated as isolated candidate, separate from Runtime/Model |

---

## 6. P8 Isolation Proof

The following constraints together satisfy P8 ("Spec Inference may be integrated as a separate candidate if isolated from overlapping runtime/model components"):

1. `phase: 'DESIGN'` hard-locks inference away from BUILD (Runtime phase)
2. G4 BOUNDARY_CROSSING_GUARD blocks any Runtime internal state access
3. No model mutation permitted (read-only from conversation artifacts)
4. Execution cannot be triggered by spec confidence (G5 + P6 required)
5. Policy enforcement routes through existing EPF/GEF — no new overlapping enforcement stack

**P8 SATISFIED** — Spec Inference is fully isolated from Runtime and Model components.
