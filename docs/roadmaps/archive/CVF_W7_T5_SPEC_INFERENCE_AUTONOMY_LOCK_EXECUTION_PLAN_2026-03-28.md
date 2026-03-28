---
tranche: W7-T5
title: Execution Plan — Autonomy Lock Policy (P6) + Review 16 Spec Inference Integration
date: 2026-03-28
status: IN EXECUTION
authorization: CVF_GC018_CONTINUATION_CANDIDATE_W7_T5_SPEC_INFERENCE_AUTONOMY_LOCK_2026-03-28.md
---

# W7-T5 Execution Plan — Autonomy Lock + Spec Inference Integration

Memory class: SUMMARY_RECORD

> Gates required: P2 ✓, P3 ✓, P6 (CP1 delivers), P8 (satisfied by CP2 isolation design)
> Integration decision: GO WITH FIXES (Review 16 — Spec Inference + Spec Policy only)

---

## 1. Scope

Two deliverables in one tranche:

**CP1 — Autonomy Lock Policy (P6 gate)**
Defines the canonical CVF autonomy lock: what "assisted mode" means, what conditions must pass before autonomous mode is permitted, and how G5 (AUTONOMY_LOCK_GUARD) maps to the policy gate + confidence + escalation requirements across all W7 concepts.

**CP2 — Spec Inference Integration Contract (P8 satisfied by design)**
Integrates Review 16 Spec Inference as an isolated layer. `StructuredSpec` (schema, inference protocol, policy enforcement) is kept strictly separate from Runtime and Model components per the P8 constraint.

GO WITH FIXES corrections from Review 16:
1. Spec Inference must NOT touch Runtime internals — isolated read-only access to conversation artifacts
2. Policy enforcement routes through existing EPF/GEF — no parallel policy engine
3. StructuredSpec is a DESIGN-phase artifact, not a BUILD-phase executor
4. Spec confidence does not directly trigger execution — must route through policy gate

---

## 2. Checkpoints

| CP | Lane | Deliverable | Gate |
|---|---|---|---|
| CP1 | Full Lane | Autonomy Lock Policy | P6 SATISFIED |
| CP2 | Full Lane | Spec Inference Integration Contract | P8 SATISFIED (by design) |
| CP3 | — | Closure review + GC-026 sync + roadmap update | — |

---

## 3. CP1 — Autonomy Lock Policy (Full Lane)

Artifacts:
- `docs/reviews/CVF_W7_T5_CP1_AUTONOMY_LOCK_POLICY_2026-03-28.md`
  - Assisted mode definition: what "assisted" means per concept (Skill/Capability/Spec/PlannedAction)
  - Autonomous mode preconditions: confidence threshold, policy gate PASS, human checkpoint, G5 release
  - Escalation protocol: G5 trigger → EPF hard block → GEF watchdog escalation → human confirmation
  - Autonomy level matrix: R0→passthrough, R1→advisory, R2→soft block, R3→hard block + escalation
- `docs/reviews/CVF_GC019_W7_T5_CP1_AUTONOMY_LOCK_POLICY_REVIEW_2026-03-28.md`

---

## 4. CP2 — Spec Inference Integration Contract (Full Lane)

Artifacts:
- `docs/reviews/CVF_W7_T5_CP2_SPEC_INFERENCE_INTEGRATION_CONTRACT_2026-03-28.md`
  - StructuredSpec schema (id, name, intent, constraints, inferredAt, confidence, riskLevel, guardPreset)
  - Inference protocol: DESIGN-phase only, read-only artifact access, no runtime touch
  - Policy enforcement: R2+ routes through EPF policy gate; spec confidence alone does not trigger execution
  - Isolation proof: P8 boundary conditions (no Runtime field access, no Model mutation)
  - Review 16 accept/fix matrix for Spec Inference proposals
- `docs/reviews/CVF_GC019_W7_T5_CP2_SPEC_INFERENCE_INTEGRATION_CONTRACT_REVIEW_2026-03-28.md`

---

## 5. Risk Assessment

| Risk | Level | Mitigation |
|---|---|---|
| Spec Inference accessing Runtime internals | R2 | P8 isolation constraint + G4 BOUNDARY_CROSSING_GUARD |
| Autonomous mode triggered by spec confidence alone | R3 | G5 hard block; P6 policy explicitly prohibits confidence-only trigger |
| Spec schema overlap with Skill schema | R1 | Canonical ownership map (W7-T1) already resolves; different phase (DESIGN vs REVIEW) |
| Parallel policy engine introduced | R2 | GO WITH FIXES: policy enforcement through existing EPF/GEF only |
