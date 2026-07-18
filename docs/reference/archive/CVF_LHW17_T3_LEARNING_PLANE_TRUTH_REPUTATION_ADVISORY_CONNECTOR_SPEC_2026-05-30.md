# CVF LHW17 T3 — Learning Plane Truth & Reputation Advisory Connector Spec

Contract ID: `cvf.learningPlaneTruthReputationAdvisory.lhw17.t3.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-30

Wave: LHW17 T3

GC-018: `docs/baselines/CVF_GC018_LHW17_CVF_IMPORTANT_ABSORPTION_WAVE_2026-05-30.md`

runtimeExecutionAuthorized: false

---

## Purpose

Establish the advisory boundary for Truth Model and Reputation Model activation against the
existing `CVF_LEARNING_PLANE_FOUNDATION` owner surface. Documents activation prerequisites
and the 8-step EA-recommended sequencing order.

## Scope / Applies To

Applies to any future CVF surface that activates Truth Model scoring or Reputation-based
routing. Does NOT authorize runtime wiring in this wave. Learning Plane activation belongs
in a separate live-proof roadmap after steps 1-5 of the activation order are frozen.

## Source

- `.private_reference/legacy/CVF_Important/ADDING_LEARNING PLANE/CVF_TRUTH_MODEL.md`
- `.private_reference/legacy/CVF_Important/ADDING_LEARNING PLANE/CVF_REPUTATION_MODEL.md`
- `.private_reference/legacy/CVF_Important/ADDING_LEARNING PLANE/CVF_LEARNING_PLANE.md`

EA finding: `EA_CROSS_CHECK_ASSESSMENT.md` — Learning Plane is the most complex and highest-risk
component; must be implemented last, after all other layers are frozen. Adaptive behavior
changes system over time — if Truth Model is wrong, Reputation is wrong, Planner routes wrong.

Prior absorption: `CVF_LEARNING_PLANE_FOUNDATION` (AIF-C Phase 2a) — foundation exists but
Truth Model and Reputation scoring are NOT yet wired into runtime.

---

## Purpose

Documents the advisory boundary for Truth Model + Reputation Model activation against the
existing `CVF_LEARNING_PLANE_FOUNDATION` owner surface. This spec establishes the activation
prerequisites and boundary conditions. This is documentation-only — no runtime wiring in this
wave.

---

## CVF Owner Surfaces

| Layer | Owner module |
| --- | --- |
| Learning Plane foundation | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/` (AIF-C Phase 2a) |
| Memory gateway | `controlled-memory-gateway.ts` + `memory-lifecycle-policy.ts` |
| Context packaging | `memory-context-packager.ts` |
| Graph knowledge | `CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/` (AIF-B Phase 1) |
| Learning signal intake | `learning-signal-intake-bridge.ts` (LHW14-era standard) |
| Task memory | T5 `taskMemoryDecision` / `taskMemoryReason` in audit-memory-receipt.ts |

---

## Advisory Type

`learningPlaneTruthReputationAdvisoryType`

---

## Truth Model — Advisory Boundary

**Source:** `CVF_TRUTH_MODEL.md` — defines how CVF validates claims, tracks claim history,
and maintains a source-of-truth registry for agent assertions.

**Current CVF state:** No Truth Model runtime exists. The concept is absorbed at doctrine level
through `CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md` (boundary-first, claims must
be bounded).

**Advisory:** Before a Truth Model can be activated in CVF runtime:
1. All existing CVF claim-boundary language must be reconciled against the Truth Model schema
2. Truth Model records must be stored in the existing `CVF_LEARNING_PLANE_FOUNDATION` memory
   tier — not a new persistence layer
3. TruthScore deltas must remain provisional (no fixed weighting doctrine) until LPF
   calibration is complete — per `CVF_ADDING_NEW_FINAL_INTEGRATION_DECISION_2026-04-12.md`
   section 3.7

**Activation prerequisite:** Learning Plane Foundation must have at least one stable
production-level live-proof session before Truth Model scoring is wired.

---

## Reputation Model — Advisory Boundary

**Source:** `CVF_REPUTATION_MODEL.md` — defines per-agent reputation scoring based on
task completion, review pass rate, and governance compliance history.

**Current CVF state:** `CVF_ECO_v3.1_REPUTATION` module exists as partial foundation.
Reputation scoring is not wired into provider routing or task assignment.

**Advisory:** Reputation Model activation requires:
1. At least 3 distinct agent sessions with governance evidence receipts as calibration data
2. Reputation score must feed into `resolveProviderForRole()` (WCE W3) as an advisory
   signal — not a hard gate — until calibration is proven stable
3. Reputation degradation (negative scoring) must trigger an `R2`-level governance review,
   not an automatic capability reduction
4. `CVF_ECO_v3.1_REPUTATION` must be the owner surface; no new reputation module should
   be created

**Activation prerequisite:** Truth Model advisory boundary must be documented first (this
spec, T3). Reputation scoring may not be activated before Truth Model calibration has
at least one live proof.

---

## EA Sequencing Advisory

Per EA recommendation (Learning Plane = highest risk, implement last):

```
Activation Order:
1. Constitutional / Policy Layer   → already absorbed (CVF_v1.6.1_GOVERNANCE_ENGINE)
2. Trust & Isolation hardening     → T1 (this wave)
3. Model Gateway unification       → T2 (this wave)
4. Context Control + RAG           → future wave
5. Agent Definition + RBAC         → future wave
6. Learning Plane Truth Model      → future wave (after steps 1-5 frozen)
7. Learning Plane Reputation       → future wave (after Truth Model calibrated)
8. Simulation Environment          → last; after Reputation stable
```

This spec documents the advisory boundary for steps 6 and 7. No implementation is
authorized in this wave.

---

## Advisory Readout Fields

When a future runtime surface absorbs this spec, the governance evidence receipt SHOULD surface:

```typescript
learningPlaneTruthReputationAdvisoryType: "cvf.learningPlaneTruthReputationAdvisory.lhw17.t3.v1"
learningPlaneAdvisory: {
  truthModelStatus: "ADVISORY_ONLY" | "CALIBRATING" | "ACTIVE"
  reputationModelStatus: "ADVISORY_ONLY" | "CALIBRATING" | "ACTIVE"
  activationPrerequisitesMet: boolean
  advisoryNote: string   // boundary note
}
```

---

## LH1 / LHW Scope Note

This spec closes the Learning Plane (Review 6) for the doc-only LHW17 wave scope only.
Runtime activation of Truth Model and Reputation scoring is `rejected from this LHW wave
(doc-only scope) - requires live route; eligible for separate live-proof roadmap post-LHW`.

---

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW17_CVF_IMPORTANT_ABSORPTION_WAVE_2026-05-30.md`
- Source: `.private_reference/legacy/CVF_Important/ADDING_LEARNING PLANE/`
- EA finding: `.private_reference/legacy/CVF_Important/REVIEW FOLDER/EA_CROSS_CHECK_ASSESSMENT.md`
- 2026-04-12 decision: `.private_reference/legacy/CVF_Important/REVIEW FOLDER/CVF_ADDING_NEW_FINAL_INTEGRATION_DECISION_2026-04-12.md`
- LPF foundation: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/`

## Claim Boundary

This spec is documentation-only advisory. It does not prove Truth Model or Reputation runtime
activation, hosted readiness, production readiness, or public release readiness. Activation
requires a separate governed tranche after prerequisite steps 1-5 are frozen.

## Invariants

- `runtimeExecutionAuthorized=false`
- Risk model: R0-R3 (L0-L4 must NOT appear)
- No route.ts change
- No receipt-envelope extension
- No new persistence layer (Truth/Reputation records must use existing LPF memory tier)
- No fixed TruthScore weighting doctrine (provisional only, per 2026-04-12 decision)
- No public release readiness claim
