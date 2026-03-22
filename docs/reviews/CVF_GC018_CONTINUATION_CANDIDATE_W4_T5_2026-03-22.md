# CVF GC-018 Continuation Candidate — W4-T5 Learning Plane Re-injection Loop

Memory class: FULL_RECORD

> Governance control: `GC-018`
> Date: `2026-03-22`
> Proposed tranche: `W4-T5 — Learning Plane Re-injection Loop`
> Prerequisite: `W4-T4 — Learning Plane Governance Signal Bridge (CLOSED DELIVERED)`

---

## GC-018 Depth Audit

| Criterion | Score | Rationale |
|---|---|---|
| Risk reduction | 2/3 | Re-injection contract closes the risk of GovernanceSignal being a terminal output with no learning-plane feedback path; without it the learning plane has no self-correction cycle |
| Decision value | 3/3 | `GovernanceSignal → LearningFeedbackInput` is the last explicitly-named W4 deferred scope item ("feedback re-injection"); once delivered the full learning loop closes: `LearningFeedbackInput → ... → GovernanceSignal → LearningFeedbackInput` |
| Machine enforceability | 3/3 | Pure TypeScript contracts with injectable mapping and time; 100% testable |
| Operational efficiency | 3/3 | Closes the "feedback re-injection" explicitly listed in W4 deferred scope; natural W4-T4 successor; no scope creep |
| Portfolio priority | 2/3 | W4 momentum strong (T1–T4 closed); W4-T5 is the final W4 deferred deliverable; completes the learning-plane architecture loop |
| **Total** | **13/15** | **AUTHORIZED** |

---

## Proposed Scope

`W4-T5` delivers a two-contract re-injection chain:

**`GovernanceSignal → LearningFeedbackInput` (CP1, Full Lane)**

`LearningReinjectionContract.reinject(signal)` maps a `GovernanceSignal` back to a `LearningFeedbackInput` with:
- Signal mapping: ESCALATE→REJECT, TRIGGER_REVIEW→ESCALATE, MONITOR→RETRY, NO_ACTION→ACCEPT
- `priority`: REJECT/ESCALATE→critical, RETRY/ACCEPT→low
- `confidenceBoost`: REJECT→0, ESCALATE→0, RETRY→0.05, ACCEPT→0.1
- Deterministic `reinjectionHash` + `reinjectionId`

**`GovernanceSignal[] → LearningLoopSummary` (CP2, Fast Lane)**

`LearningLoopContract.summarize(signals)` aggregates re-injection results into a `LearningLoopSummary` with:
- `dominantFeedbackClass`: most severe re-injected class (REJECT > ESCALATE > RETRY > ACCEPT)
- per-class counts (`rejectCount`, `escalateCount`, `retryCount`, `acceptCount`)
- deterministic hash

---

## Consumer Path (Full Loop Closed)

```
LearningFeedbackInput[] → FeedbackLedger → PatternInsight   (W4-T1)
PatternInsight[] → TruthModel                               (W4-T2 CP1)
TruthModel + PatternInsight → TruthModel                    (W4-T2 CP2)
TruthModel → EvaluationResult                               (W4-T3 CP1)
EvaluationResult[] → ThresholdAssessment                    (W4-T3 CP2)
ThresholdAssessment → GovernanceSignal                      (W4-T4 CP1)
GovernanceSignal[] → GovernanceSignalLog                    (W4-T4 CP2)
GovernanceSignal → LearningFeedbackInput                    (W4-T5 CP1)  ← LOOP CLOSES
GovernanceSignal[] → LearningLoopSummary                    (W4-T5 CP2)
```

---

## Authorization Boundary

- CP1: Full Lane — new `LearningReinjectionContract` baseline in `CVF_LEARNING_PLANE_FOUNDATION`
- CP2: Fast Lane (GC-021) — additive-only `LearningLoopContract`
- CP3: Full Lane — tranche closure review

---

## Decision

**AUTHORIZED — Score 13/15**

W4-T5 may proceed immediately. The re-injection loop is the last explicitly-deferred W4 deliverable and closes the complete learning-plane architecture cycle.
