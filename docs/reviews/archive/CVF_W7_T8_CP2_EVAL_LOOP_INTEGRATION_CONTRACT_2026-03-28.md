---
tranche: W7-T8
checkpoint: CP2
title: Eval Loop Integration Contract
date: 2026-03-28
status: DELIVERED
---

# W7-T8 / CP2 — Eval Loop Integration Contract

Memory class: FULL_RECORD

> Lane: Full Lane (GC-019)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T8_AGENT_BUILDER_EVAL_LOOP_2026-03-28.md`
> Dependency: W7DecisionRecord (status: resolved) must exist — G7 blocking condition

---

## 1. W7EvalRecord Schema

```
W7EvalRecord {
  id: string                          // deterministic hash from (decisionRef + evaledAt + evaluatorId)
  decisionRef: string                 // parent W7DecisionRecord ID (required — G7 blocking condition)
  traceRef: string                    // W7TraceRecord from the originating execution
  evaluatorId: string                 // agent or process identifier
  evaledAt: string                    // ISO 8601
  riskLevel: W7RiskLevel              // inherited from W7DecisionRecord.riskLevel
  outcomes: W7EvalOutcome[]           // per-action evaluation results
  overallScore: 'pass' | 'partial' | 'fail'
  learningSignals: W7LearningSignal[] // signals emitted to LPF
  status: 'evaluating' | 'complete' | 'archived'
  lpfRef?: string                     // LPF consumer pipeline receipt (populated after LPF consumes)
}

W7EvalOutcome {
  actionId: string                    // W7PlannedAction.actionId being evaluated
  result: 'success' | 'partial' | 'failure' | 'blocked'
  riskObserved: W7RiskLevel          // actual risk observed during execution (may differ from planned)
  rationale: string                   // max 200 chars
}

W7LearningSignal {
  signalType: 'skill_effectiveness' | 'guard_trigger' | 'risk_reclassification' | 'autonomy_boundary'
  payload: string                     // max 300 chars, structured description
  confidence: 'high' | 'medium' | 'low'
  targetRef?: string                  // SkillFormationRecord or StructuredSpec ID if signal is concept-specific
}
```

---

## 2. Eval Loop Input Protocol

The Eval Loop activates ONLY after a `W7DecisionRecord` with `status: resolved` exists (G7 blocking condition at Decision→Eval transition).

```
Eval Loop input path:
  W7DecisionRecord (status: resolved, outcome: APPROVED | MODIFIED)
    + W7TraceRecord (originating trace — for execution evidence)
    → Eval Loop evaluates each approved W7PlannedAction
    → Produces W7EvalRecord with outcomes + learning signals
    → LPF consumer pipeline receives learning signals
```

**No fake-learning path**: The Eval Loop MUST NOT be activated without a real `W7DecisionRecord` with `status: resolved`. Synthetic or mock Decision records are a G7 violation.

---

## 3. LPF Feed Protocol

```
W7EvalRecord.learningSignals
  → LPF Learning Consumer Pipeline (existing LPF contract)
    → learning.observability.snapshot.consumer.pipeline (skill_effectiveness signals)
    → learning.storage.consumer.pipeline (risk_reclassification + autonomy_boundary signals)
    → W7EvalRecord.lpfRef populated on receipt
```

Learning signals are advisory to LPF — they do not trigger immediate policy changes. LPF processes them according to its own learning cycle (W7-T9 Memory Loop governs activation).

Signal types and their LPF consumers:
| Signal Type | LPF Consumer | Purpose |
|---|---|---|
| skill_effectiveness | observability snapshot | Track which skills produce good outcomes |
| guard_trigger | observability snapshot | Record when guards fired during execution |
| risk_reclassification | storage | Update risk model if observed risk differs from planned |
| autonomy_boundary | storage | Record P6 boundary events for autonomy tuning |

---

## 4. Guard Binding

- G6 (TRACE_EXISTENCE_GUARD): W7EvalRecord requires `traceRef` — evaluation without a trace is a G6 violation
- G7 (DEPENDENCY_ORDER_GUARD): Eval cannot activate without `W7DecisionRecord.status: resolved`
- G1 (RISK_CLASSIFICATION_GUARD): `riskObserved` field must be populated per outcome — actual vs planned risk tracked
- No G5 (AUTONOMY_LOCK_GUARD): Eval Loop is an observational process; it does not invoke actions

---

## 5. No Fake Learning Invariants

The following are hard invariants enforced at Eval Loop activation:

1. `decisionRef` must point to a `W7DecisionRecord` with `status: resolved` (not `escalated` or `deciding`)
2. `traceRef` must point to a `W7TraceRecord` with `status: emitted` or `consumed` (not synthetic)
3. `W7EvalOutcome.result` values are derived from actual execution evidence — not inferred from plan alone
4. `learningSignals` emitted to LPF are marked with `confidence` — LPF weighs accordingly
5. `overallScore: 'fail'` does NOT suppress LPF signals — failure evidence is equally valuable for learning
