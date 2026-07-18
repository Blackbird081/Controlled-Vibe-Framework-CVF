# CVF LHW20 T3 — Adaptation Policy Engine Advisory Connector Spec

Contract ID: `cvf.adaptationPolicyAdvisory.lhw20.t3.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW20 T3

GC-018: `docs/baselines/CVF_GC018_LHW20_CVF_IMPORTANT_DEEP_SCAN_WAVE_2026-05-31.md`

runtimeExecutionAuthorized: false

---

## Purpose

Document the Adaptation Policy Engine from `CVF_ADAPTATION_POLICY.md` — the **safety stabilizer** that governs when and how the Learning Plane is allowed to change the system. This spec is a prerequisite for safe Learning Plane activation (step 6 in the LHW17 T3 8-step activation order).

Without an Adaptation Policy Engine, activating the Truth Model + Reputation scoring (LHW17 T3) is dangerous — the system could overreact to noise, create oscillation, or corrupt agent authority from limited data.

## Scope / Applies To

Any future CVF surface that activates Truth Model scoring, Reputation routing, or agent promotion/demotion. This spec must be absorbed before LHW17 T3 runtime activation is authorized.

## CVF Owner Surfaces

| Concept | Current CVF owner |
| --- | --- |
| Learning Plane foundation | `CVF_LEARNING_PLANE_FOUNDATION` (AIF-C) |
| Reputation model (foundation) | `CVF_ECO_v3.1_REPUTATION` |
| Policy engine | `CVF_v1.6.1_GOVERNANCE_ENGINE` |
| Agent role governance | `CVFRole` + `AuthorityGateGuard` |

---

## Advisory Type

`adaptationPolicyAdvisoryType`

---

## Core Principle

> **Controlled Evolution over Raw Optimization.**
> The system must NOT blindly promote high-scoring agents or aggressively remove low-performing agents. It must balance improvement with stability and respect uncertainty.

This is the stabilizer that prevents the Learning Plane from becoming self-destructive.

---

## 6 Mandatory Adaptation Constraints (Advisory)

### A1 — Risk Budget per Cycle

**Advisory:** Per adaptation cycle, the system must limit:
- Max 10% agent role changes
- Max 5% new agent spawns
- Max 5% agent retirements

**Purpose:** Prevents system instability from cascading changes. One bad signal should not restructure the entire system.

**CVF gap:** No adaptation budget enforced. Any future Reputation scoring change must include a risk budget gate.

---

### A2 — Confidence Gating (NO action without sufficient evidence)

**Advisory:**
- High score + low confidence → NO promotion
- Low score + low confidence → NO demotion
- Only high confidence signals (based on sufficient sample_size) trigger strong actions

**CVF gap:** LHW17 T3 advisory states TruthScore must be provisional. This constraint formalizes why: low confidence must block adaptation.

**Owner:** `CVF_ECO_v3.1_REPUTATION` — confidence field must be checked before any routing change.

---

### A3 — Multi-Signal Requirement (NO adaptation from single signal)

**Advisory:** No adaptation decision may be based on:
- A single evaluation metric
- Self-reported agent data alone
- One execution's outcome

Minimum: multiple consistent signals across ≥ N tasks.

**CVF gap:** OFB-1 `orchestratorFeedback` provides multi-signal aggregation. But no rule preventing single-signal decisions exists.

---

### A4 — Cooldown Period (prevent oscillation)

**Advisory:** After an adaptation action (promote/demote/spawn/retire), the affected agent enters a cooldown period. No further changes allowed until:
- N executions complete in the new state
- Stability confirmed (no immediate reversal trigger)

**Purpose:** Prevents promote → demote → promote oscillation.

**CVF gap:** No cooldown mechanism. This must be added to any Reputation scoring tranche.

---

### A5 — Tiered Authority System (Tier 0-3)

**Advisory:** Agents operate in authority tiers:
- **Tier 0:** Experimental (low trust, low-risk tasks only)
- **Tier 1:** Validated (standard tasks, monitored)
- **Tier 2:** Trusted (complex tasks, less oversight)
- **Tier 3:** Critical (cannot be demoted without strong evidence)

Rules:
- Tier 3 cannot be demoted without ≥ N confirmed failures across ≥ M time periods
- Tier 0 cannot be promoted quickly (requires sustained evidence)

**CVF gap:** `CVFRole` has OBSERVER/ANALYST/BUILDER/REVIEWER/GOVERNOR but no tiered authority with stability rules. Tier system maps loosely to CVFRole but needs explicit tier constraints.

---

### A6 — Rollback Mechanism

**Advisory:** The system must support reverting adaptation changes when:
- Performance degrades after adaptation
- Unexpected failure spike detected (via OFB-1 `overallSignal: ESCALATE`)

**CVF gap:** No rollback for reputation or routing changes. OFB-1 `ESCALATE` signal surfaces the trigger but no rollback action exists.

**Owner:** `CVF_LEARNING_PLANE_FOUNDATION` (future rollback module).

---

## Adaptation Trigger Types (Advisory)

Adaptation must NOT happen continuously. Valid triggers only:

| Trigger | Type | CVF surface |
| --- | --- | --- |
| Score crosses threshold | Threshold-based | OFB-1 `reviewerRejectionSignal` |
| Sustained degradation | Trend-based | OFB-1 `overallSignal: CAUTION` |
| Critical failure | Event-based | OFB-1 `overallSignal: ESCALATE` |
| Domain shift | Event-based | NOT in CVF |
| Periodic review | Time-based | NOT in CVF |

---

## Activation Prerequisite (from LHW17 T3 Activation Order)

LHW17 T3 defined 8-step activation order. This spec formalizes **Step 5 (Adaptation Policy documented)** as a prerequisite for **Step 6 (Truth Model activation)**:

```
Step 5 (THIS SPEC): Adaptation Policy advisory documented ← LHW20 T3
Step 6 (FUTURE):    Truth Model calibration begins
Step 7 (FUTURE):    Reputation Model advisory signal wired
Step 8 (FUTURE):    Simulation Environment validated
```

No implementation of Truth Model or Reputation scoring should proceed without an Adaptation Policy Engine tranche that implements A1-A6 above.

---

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW20_CVF_IMPORTANT_DEEP_SCAN_WAVE_2026-05-31.md`
- LHW17 T3: `docs/reference/archive/CVF_LHW17_T3_LEARNING_PLANE_TRUTH_REPUTATION_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- Source: `.private_reference/legacy/CVF_Important/ADDING_LEARNING PLANE/CVF_ADAPTATION_POLICY.md`
- Source: `.private_reference/legacy/CVF_Important/ADDING_LEARNING PLANE/CVF_LEARNING_PLANE.md`
- OFB-1: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/orchestrator-feedback-bus.ts`

## Claim Boundary

Advisory only. Documents 6 mandatory constraints (A1-A6) as advisory boundary for future Adaptation Policy Engine implementation. No runtime adaptation logic authorized in this wave. A1-A6 must be implemented in a separate governed tranche before Learning Plane runtime activation.

## Invariants

- `runtimeExecutionAuthorized=false`
- R0-R3 preserved
- No route.ts change
- No Learning Plane runtime change
- LHW17 T3 advisory boundary still applies: Truth Model activation requires A1-A6 implemented first
