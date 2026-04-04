---
tranche: W7-T2
checkpoint: CP1
title: Unified Risk Contract — R0-R3 Schema and Enforcement Behavior
date: 2026-03-28
status: DELIVERED
gate: P3
---

# W7-T2 / CP1 — Unified Risk Contract (R0-R3)

Memory class: FULL_RECORD

> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T2_UNIFIED_RISK_CONTRACT_2026-03-28.md`
> Execution plan: `docs/roadmaps/CVF_W7_T2_UNIFIED_RISK_CONTRACT_EXECUTION_PLAN_2026-03-28.md`

---

## 1. Canonical Risk Level Definitions

These definitions are authoritative across all W7 integration concepts. Any contract from Review 14/15/16 that carries a risk classification MUST use exactly these four levels.

| Level | Label | Meaning | Guard Activation |
|---|---|---|---|
| `R0` | SAFE | No risk — read-only, informational, no side effects, no state mutation | None — pass through |
| `R1` | LOW | Low risk — scoped operation, bounded side effects, no cross-boundary impact | Advisory signal only — logged, not blocked |
| `R2` | MEDIUM | Medium risk — state-modifying, multi-step, or involves external state | Soft block — guard review required; operator can approve |
| `R3` | HIGH | High / Dangerous — autonomous execution, cross-boundary, irreversible, or multi-agent coordination without human checkpoint | Hard block — escalation required; policy gate must pass; explicit approval needed |

### Immutable Rules

1. **No contract may bypass risk classification.** Every W7 concept surface must declare a risk level.
2. **Risk levels may not be downgraded at runtime.** A contract declared R2 may not execute as R0 without a new tranche.
3. **R3 requires explicit policy gate passage.** The existing EPF `policy.gate.contract.ts` is the sole enforcement point.
4. **R0 and R1 do not block execution.** R1 emits an advisory signal to the observability surface only.

---

## 2. Required Risk Fields Per Concept

Every W7 concept surface must carry the following risk fields in its contract schema:

```typescript
interface W7RiskFields {
  riskLevel: "R0" | "R1" | "R2" | "R3";
  riskRationale: string;          // why this risk level was assigned
  escalationPath?: string;        // required when riskLevel === "R3"
  policyGateRequired: boolean;    // true when riskLevel >= "R2"
}
```

This interface is not yet implemented in code (W7-T4+ scope). This document is the canonical schema reference.

---

## 3. Risk Classification Per Concept

### Skill (Review 14 — Skill Formation)

| Scenario | Risk Level | Rationale |
|---|---|---|
| Skill definition / `.skill.md` read | R0 | Read-only governance artifact |
| Skill extraction from conversation | R1 | Scoped write; bounded to skill registry |
| Skill applied to new input | R1 | Bounded execution; no cross-plane state |
| Skill modifying governance registry | R2 | State mutation in Governance Layer |
| Skill enabling autonomous agent action | R3 | Cross-boundary; requires policy gate |

**Default risk level**: R1

### Capability (Review 14/15 overlap)

| Scenario | Risk Level | Rationale |
|---|---|---|
| Capability definition / schema read | R0 | Read-only |
| Capability invocation (scoped) | R1 | Bounded single-plane execution |
| Capability with side effects | R2 | State mutation; guard review required |
| Capability enabling multi-agent coordination | R3 | Cross-boundary; autonomous path |

**Default risk level**: R1

### PlannedAction (Review 15 — Planner)

| Scenario | Risk Level | Rationale |
|---|---|---|
| Plan definition / design-time only | R0 | No execution — DESIGN phase artifact |
| Single-step plan execution | R1 | Bounded, reversible |
| Multi-step plan execution | R2 | State-modifying; requires guard review |
| Autonomous multi-step plan without human checkpoint | R3 | Hard block; escalation required |

**Default risk level**: R1 (when in DESIGN phase: R0)

### StructuredSpec (Review 16 — Spec Inference)

| Scenario | Risk Level | Rationale |
|---|---|---|
| Spec definition / schema read | R0 | Read-only |
| Spec with external dependency resolution | R1 | Bounded, no state mutation |
| Spec with policy enforcement rules | R2 | Governance-layer side effects |
| Spec enabling autonomous code generation | R3 | Hard block; policy gate required; P6 gate |

**Default risk level**: R1

---

## 4. Enforcement Behavior Matrix

| Risk Level | Execution Path | Guard Behavior | Logging | Escalation |
|---|---|---|---|---|
| R0 | Pass through | No guard activated | Observability signal optional | None |
| R1 | Pass through | Advisory signal emitted to LPF observability | Logged via `learning.observability.contract.ts` | None |
| R2 | Soft block | Guard review triggered; operator approval window opens | Logged via GEF `governance.audit.signal.contract.ts` | Operator notified |
| R3 | Hard block | EPF `policy.gate.contract.ts` must pass; if DENY → execution stopped | Logged via GEF `watchdog.escalation.contract.ts` | Full escalation path required |

### R3 Hard Block Detail

An R3 classification triggers the following chain (using existing CVF contracts):

```
R3 detected
  → EPF policy.gate.contract.ts evaluated
    → if DENY: execution STOPPED, GEF watchdog.escalation.contract.ts emits
    → if PASS: execution continues with audit trail via GEF governance.audit.log.contract.ts
```

No parallel enforcement stack is created. All R3 enforcement routes through the existing EPF/GEF contract chain.

---

## 5. P3 Gate Satisfaction

Gate P3 (Unified risk contract complete — Skill/Capability/PlannedAction/StructuredSpec all carry R0-R3 fields + enforcement behavior) is **SATISFIED** by this document.

All four concepts have:
- per-scenario risk classifications
- default risk levels
- required contract fields (`W7RiskFields`)
- enforcement behavior routed through existing EPF/GEF contracts

No parallel enforcement stack is introduced.
