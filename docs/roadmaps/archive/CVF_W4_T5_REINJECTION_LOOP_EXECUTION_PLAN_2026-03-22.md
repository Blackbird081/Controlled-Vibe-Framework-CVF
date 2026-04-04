# CVF W4-T5 Re-injection Loop — Tranche Execution Plan

Memory class: SUMMARY_RECORD
> Date: `2026-03-22`
> Tranche: `W4-T5 — Learning Plane Re-injection Loop`
> Package: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/`
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W4_T5_2026-03-22.md` (13/15)

---

## Goal

Close the complete W4 learning loop by delivering `GovernanceSignal → LearningFeedbackInput` re-injection, the last explicitly-deferred W4 scope item.

---

## Control Points

| CP | Title | Lane | Deliverable |
|----|-------|------|-------------|
| CP1 | Learning Re-injection Contract | Full | `src/learning.reinjection.contract.ts` + 9 new tests |
| CP2 | Learning Loop Contract | Fast | `src/learning.loop.contract.ts` + 7 new tests |
| CP3 | Tranche Closure Review | Full | all governance artifacts |

---

## CP1 — Learning Re-injection Contract (Full Lane)

**Signal mapping (GovernanceSignalType → FeedbackClass):**
- ESCALATE → REJECT (priority: critical, confidenceBoost: 0)
- TRIGGER_REVIEW → ESCALATE (priority: critical, confidenceBoost: 0)
- MONITOR → RETRY (priority: low, confidenceBoost: 0.05)
- NO_ACTION → ACCEPT (priority: low, confidenceBoost: 0.1)

**Output:** `LearningFeedbackInput` (existing type from W4-T1)

---

## CP2 — Learning Loop Contract (Fast Lane, GC-021)

**Types:**
- `LearningLoopSummary`: `{ summaryId, createdAt, totalSignals, rejectCount, escalateCount, retryCount, acceptCount, dominantFeedbackClass, summary, summaryHash }`

**dominantFeedbackClass priority:** REJECT > ESCALATE > RETRY > ACCEPT; ACCEPT if empty.

---

## Test Target

- CP1: 9 new tests
- CP2: 7 new tests
- **Total new: 16 — LPF total: 68 → 84**
