# CVF GC-018 Continuation Candidate — W4-T4 Learning Plane Governance Signal Bridge

Memory class: FULL_RECORD

> Governance control: `GC-018`
> Date: `2026-03-22`
> Proposed tranche: `W4-T4 — Learning Plane Governance Signal Bridge`
> Prerequisite: `W4-T3 — Learning Plane Evaluation Engine Slice (CLOSED DELIVERED)`

---

## GC-018 Depth Audit

| Criterion | Score | Rationale |
|---|---|---|
| Risk reduction | 2/3 | Governance signal bridge closes the risk of evaluation results being orphaned with no governance consumer; ThresholdAssessment is produced but not yet consumed by any governance surface |
| Decision value | 3/3 | `GovernanceSignal` (ESCALATE \| TRIGGER_REVIEW \| MONITOR \| NO_ACTION) is the first cross-plane signal from the learning plane to governance; closes the W4→governance link that W4-T3 left open; first actionable governance recommendation derived from learning state |
| Machine enforceability | 3/3 | Pure TypeScript contracts with injectable signal logic and time; 100% testable |
| Operational efficiency | 3/3 | Closes the "governance action surface" explicitly named in W4's deferred scope; natural W4-T3 successor; no scope creep |
| Portfolio priority | 2/3 | W4 momentum strong (T1–T3 closed); W4-T4 is the explicitly deferred governance action surface; no other candidate scores higher |
| **Total** | **13/15** | **AUTHORIZED** |

---

## Proposed Scope

`W4-T4` delivers a two-contract governance signal chain:

**`ThresholdAssessment → GovernanceSignal` (CP1, Full Lane)**

`GovernanceSignalContract.signal(assessment)` classifies a `ThresholdAssessment` into a `GovernanceSignal` with:
- `signalType`: ESCALATE | TRIGGER_REVIEW | MONITOR | NO_ACTION
- `urgency`: CRITICAL | HIGH | NORMAL | LOW
- `recommendation`: human-readable governance action recommendation
- Signal logic: FAILING → ESCALATE (CRITICAL) → WARNING → TRIGGER_REVIEW (HIGH) → INSUFFICIENT_DATA → MONITOR (LOW) → PASSING → NO_ACTION (LOW)

**`GovernanceSignal[] → GovernanceSignalLog` (CP2, Fast Lane)**

`GovernanceSignalLogContract.log(signals)` aggregates governance signals into a `GovernanceSignalLog` with:
- `dominantSignalType`: most severe signal present (priority: ESCALATE > TRIGGER_REVIEW > MONITOR > NO_ACTION)
- per-signal-type counts
- deterministic hash

---

## Consumer Path

```
PatternInsight[] → TruthModel                    (W4-T2 CP1)
TruthModel + PatternInsight → TruthModel         (W4-T2 CP2)
                    ↓
TruthModel → EvaluationResult                    (W4-T3 CP1)
EvaluationResult[] → ThresholdAssessment         (W4-T3 CP2)
                    ↓
ThresholdAssessment → GovernanceSignal            (W4-T4 CP1)
GovernanceSignal[] → GovernanceSignalLog          (W4-T4 CP2)
```

---

## Authorization Boundary

- CP1: Full Lane — new `GovernanceSignalContract` baseline in `CVF_LEARNING_PLANE_FOUNDATION`
- CP2: Fast Lane (GC-021) — additive-only `GovernanceSignalLogContract`
- CP3: Full Lane — tranche closure review

---

## Decision

**AUTHORIZED — Score 13/15**

W4-T4 may proceed immediately. The governance signal bridge is the explicitly deferred W4 deliverable that connects the learning-plane evaluation chain to governance action surfaces.
