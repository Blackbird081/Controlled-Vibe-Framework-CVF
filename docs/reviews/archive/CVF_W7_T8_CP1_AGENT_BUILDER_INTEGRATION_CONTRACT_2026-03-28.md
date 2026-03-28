---
tranche: W7-T8
checkpoint: CP1
title: Agent Builder Integration Contract
date: 2026-03-28
status: DELIVERED
---

# W7-T8 / CP1 — Agent Builder Integration Contract

Memory class: FULL_RECORD

> Lane: Full Lane (GC-019)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T8_AGENT_BUILDER_EVAL_LOOP_2026-03-28.md`
> Autonomy posture: ASSISTED-DEFAULT (P6 autonomy lock applies)

---

## 1. W7AgentBuilderRecord Schema

```
W7AgentBuilderRecord {
  id: string                          // deterministic hash from (sessionId + builtAt + builderId)
  sessionId: string                   // builder session identifier
  builderId: string                   // human or agent initiating the build
  builtAt: string                     // ISO 8601
  mode: 'assisted' | 'autonomous'     // 'assisted' is the hard default (P6); 'autonomous' requires all 5 preconditions
  riskLevel: W7RiskLevel              // R0 | R1 | R2 | R3
  guardPreset: BuilderGuardPreset     // derived from mode + riskLevel
  skillRefs: string[]                 // SkillFormationRecord IDs used in this build (from GEF registry)
  specRefs: string[]                  // StructuredSpec IDs referenced in this build
  decisionRef?: string                // W7DecisionRecord ID — if this build is Decision-driven
  outputAgentRef: string              // reference to the produced agent artifact
  registryAction: 'propose' | 'activate' | 'none'  // registry mutation intent
  status: 'building' | 'proposed' | 'active' | 'retired'
  policyGateRef?: string              // EPF policy gate receipt (required when riskLevel >= R2)
}
```

---

## 2. Assisted-Default Mode

Per the P6 Autonomy Lock Policy (W7-T5/CP1), Agent Builder defaults to **assisted mode** for all builds regardless of configuration.

| Condition | Mode | Enforcement |
|---|---|---|
| Default | Assisted | G5 active — proposals only; human reviews each step |
| R0/R1 + all 5 P6 preconditions pass | Autonomous permitted | G5 released for this build only |
| R2+ | Assisted (hard block on autonomous) | G5 cannot be released; policy gate required for registry mutations |
| R3 | Assisted + escalation | G5 hard block; GEF watchdog; human confirmation mandatory |

The `mode` field MUST be `'assisted'` unless all 5 P6 autonomy preconditions have been explicitly verified and logged.

---

## 3. Registry Distribution — GEF Integration

The Agent Builder's registry distribution is merged with the GEF Governance registry — no separate registry.

```
Build uses:
  skillRefs → SkillFormationRecord IDs from GEF governance/skills/ (W7-T4)
  specRefs  → StructuredSpec IDs from GEF DESIGN-phase inventory (W7-T5)

Registry mutations:
  registryAction: 'propose'   → creates draft entry; policy gate not required for R0/R1
  registryAction: 'activate'  → activates entry; EPF policy gate required for R2+
  registryAction: 'none'      → build output stored as artifact only; no registry mutation
```

Registry access is governed by G3 (OWNERSHIP_REGISTRY_GUARD) — Agent Builder can READ the GEF registry but can only WRITE via the mutation flow defined in W7-T4/CP2 (Skill Registry Mutation Protocol).

---

## 4. Guard Binding

| Mode + Risk | Preset | Guards Active |
|---|---|---|
| Assisted, R0 | B-01 | G3, G6 (trace required) |
| Assisted, R1 | B-02 | G1, G3, G6 |
| Assisted, R2 | B-03 | G1, G2, G3, G5, G6 |
| Assisted, R3 | B-04 | G1, G2, G3, G5, G6 + GEF watchdog escalation |
| Autonomous, R0/R1 only | B-05 | G1, G3, G5 (released), G6 |

G6 (TRACE_EXISTENCE_GUARD) is mandatory for all builds — every Agent Builder session must produce a trace record for LPF observability.

---

## 5. Boundary Constraints

- Agent Builder CANNOT invoke capabilities or skills directly in autonomous mode unless all P6 preconditions pass (G5)
- Agent Builder CANNOT write to W7RuntimeRecord, W7ArtifactRecord, W7TraceRecord, W7PlannerRecord, or W7DecisionRecord (G3)
- All registry mutations route through the Skill Registry Mutation Protocol (W7-T4/CP2) or equivalent for Spec registry
- `decisionRef` field links build to a `W7DecisionRecord` when the build is triggered by an approved plan — G7 confirms the Decision is `status: resolved` before build proceeds
