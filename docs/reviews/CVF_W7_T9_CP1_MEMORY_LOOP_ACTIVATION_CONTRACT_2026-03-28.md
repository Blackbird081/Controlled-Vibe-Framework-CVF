---
tranche: W7-T9
checkpoint: CP1
title: Memory Loop Activation Contract
date: 2026-03-28
status: DELIVERED
---

# W7-T9 / CP1 — Memory Loop Activation Contract

Memory class: FULL_RECORD

> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T9_MEMORY_LOOP_2026-03-28.md`

---

## 1. W7MemoryRecord Schema

```typescript
interface W7MemoryRecord {
  // Identity
  id: string;                          // computeDeterministicHash(evalRef, memorizationAt, memoryEngineId)
  evalRef: string;                     // required — W7EvalRecord.id
  traceRef: string;                    // propagated from W7EvalRecord.traceRef
  decisionRef: string;                 // propagated from W7EvalRecord.decisionRef
  memoryEngineId: string;

  // Timing
  memorizationAt: string;              // ISO timestamp

  // Risk + Guard
  riskLevel: 'R0' | 'R1' | 'R2' | 'R3';
  guardPreset: 'M-01' | 'M-02' | 'M-03' | 'M-04';

  // Content
  learningSignals: W7LearningSignal[]; // from W7EvalRecord — non-empty required
  memoryEntries: W7MemoryEntry[];

  // Status
  status: 'pending' | 'stored' | 'failed';
  lpfRef?: string;                     // populated on LPF receipt
}
```

---

## 2. W7MemoryEntry Schema

```typescript
interface W7MemoryEntry {
  entryId: string;
  signalType: 'skill_effectiveness' | 'guard_trigger' | 'risk_reclassification' | 'autonomy_boundary';
  sourceRef: string;                   // W7LearningSignal reference
  targetRef: string;                   // Skill/Guard/Policy record in GEF or EPF
  memoryAction: 'reinforce' | 'deprecate' | 'flag_review' | 'no_change';
  confidence: number;                  // propagated from W7LearningSignal.confidence (must be > 0)
  rationale: string;
}
```

---

## 3. Guard Presets (M-01 → M-04)

| Preset | Risk | Guards Active | Behavior |
|---|---|---|---|
| M-01 | R0 | G6, G7 | Passthrough — trace + eval required; no policy gate |
| M-02 | R1 | G1, G6, G7 | Advisory — risk classification logged; no block |
| M-03 | R2 | G1, G2, G6, G7 | Policy gate soft block — policyGateRef required |
| M-04 | R3 | G1, G2, G5, G6, G7 | Hard block — G5 escalation required; no autonomous memory write |

**G7 is mandatory on all Memory presets**: `W7EvalRecord.status: 'complete'` required before any Memory activation. G7 violation = Memory loop blocked entirely.

**G6 is mandatory on all Memory presets**: `traceRef` (propagated from W7EvalRecord) must be present. Traceless eval cannot seed Memory.

**G3 enforced on all presets**: W7MemoryRecord writes only to LPF storage. No write access to EPF (Runtime/Artifact/Trace) or CPF (Planner/Decision) records.

---

## 4. No-Fake-Learning Invariants (5)

1. `evalRef` must resolve to a real W7EvalRecord with `status: 'complete'` — pending or failed eval = G7 violation; Memory activation blocked.
2. W7EvalRecord.decisionRef must resolve to W7DecisionRecord with `status: 'resolved'` — unresolved decision chain = G7 violation.
3. `learningSignals` from W7EvalRecord must be non-empty — zero signals = Memory activation blocked; W7MemoryRecord.status set to `'failed'`.
4. All W7LearningSignal entries contributing to memoryEntries must have `confidence > 0` — zero-confidence signals are ineligible for memory entry creation.
5. Synthetic or mock W7EvalRecord (traceRef absent or empty) = G7 + G6 violation; traceless eval cannot seed Memory regardless of other field values.

---

## 5. Activation Conditions

Memory Loop activates only when ALL of the following hold:

| Condition | Check | Failure |
|---|---|---|
| W7EvalRecord.status = 'complete' | G7 blocking check | status → 'failed' |
| W7EvalRecord.decisionRef → W7DecisionRecord.status = 'resolved' | G7 chain check | status → 'failed' |
| W7EvalRecord.learningSignals non-empty | invariant 3 | status → 'failed' |
| W7EvalRecord.traceRef present | G6 check | status → 'failed' |

Any missing condition: W7MemoryRecord.status = `'failed'`; G7 violation logged; Memory Loop does not proceed.

---

## 6. Deterministic ID

```
id = computeDeterministicHash(evalRef, memorizationAt, memoryEngineId)
```

`evalRef` anchors memory to a specific real evaluation. `memorizationAt` + `memoryEngineId` provide uniqueness across retry attempts on the same eval.

---

## 7. Architecture Placement

- **Owned by**: LPF (Learning Plane Foundation) — `governance/memory/` in GEF
- **Reads from**: W7EvalRecord (LPF output layer)
- **Writes to**: LPF storage layer only
- **Prohibited writes**: EPF (Runtime/Artifact/Trace), CPF (Planner/Decision) — G3 enforced
- **Guards mandatory**: G7 (eval dependency), G6 (trace existence via propagated traceRef), G3 (ownership boundary), G1 (risk classification)
- **G5 required at R3 (M-04)**: no autonomous memory write permitted without escalation release
