---
tranche: W7-T2
checkpoint: CP2
title: Risk Field Application Matrix — W7 Concepts
date: 2026-03-28
status: DELIVERED
---

# W7-T2 / CP2 — Risk Field Application Matrix

Memory class: FULL_RECORD

> Lane: Fast Lane (GC-021) — additive within W7-T2 authorized scope

---

## 1. Default Risk Classification Summary

| Concept | Default Risk | Escalation Trigger | Policy Gate Required |
|---|---|---|---|
| Skill (governance artifact) | R1 | Autonomous agent action | Yes (R3 scenario) |
| Skill (design-time read) | R0 | N/A | No |
| Capability (scoped) | R1 | Multi-agent coordination | Yes (R3 scenario) |
| PlannedAction (DESIGN phase) | R0 | Any execution | Contextual |
| PlannedAction (BUILD phase) | R1 | Multi-step autonomous | Yes (R3 scenario) |
| StructuredSpec (read) | R0 | N/A | No |
| StructuredSpec (with policy rules) | R2 | Autonomous code gen | Yes (R2+) |

---

## 2. Escalation Trigger Catalogue

Each trigger below elevates the risk level by exactly one step from the concept's default:

| Trigger | Effect | Example |
|---|---|---|
| External data source access | +1 level | Skill reads from external registry |
| Cross-plane boundary crossing | → R2 minimum | PlannedAction crosses CPF→EPF |
| Multi-agent coordination involvement | → R3 | Capability coordinates >1 agents |
| Irreversible state mutation | → R2 minimum | Skill modifies governance registry |
| Autonomous execution without checkpoint | → R3 | PlannedAction executes without human review |
| Code generation output | → R3 for StructuredSpec | Spec inference produces executable code |

---

## 3. Interaction with Existing CVF Policy Gate

The existing EPF `policy.gate.contract.ts` is the sole R3 enforcement point. The risk field application flows as:

```
Concept declares riskLevel
  R0/R1 → no gate interaction
  R2    → policyGateRequired = true → soft advisory via GEF governance.audit.signal.contract.ts
  R3    → policyGateRequired = true → EPF policy.gate.contract.ts hard enforcement
           escalationPath required in W7RiskFields
```

No new contract is needed for R0-R2 enforcement — existing GEF audit/signal contracts handle advisory and soft-block logging.

---

## 4. W7RiskFields Population Guide

For any new W7 concept contract (W7-T4+), populate `W7RiskFields` as follows:

```typescript
// R0 example — Skill read
const skillReadRisk: W7RiskFields = {
  riskLevel: "R0",
  riskRationale: "Read-only access to .skill.md governance artifact",
  policyGateRequired: false,
};

// R2 example — Skill modifying registry
const skillRegistryMutationRisk: W7RiskFields = {
  riskLevel: "R2",
  riskRationale: "Skill extraction mutates GEF governance registry state",
  policyGateRequired: true,
};

// R3 example — autonomous PlannedAction
const autonomousPlanRisk: W7RiskFields = {
  riskLevel: "R3",
  riskRationale: "Multi-step plan executes without human checkpoint",
  escalationPath: "EPF policy.gate.contract.ts → GEF watchdog.escalation.contract.ts",
  policyGateRequired: true,
};
```
