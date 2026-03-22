# CVF GC-018 Continuation Candidate — W2-T5 Execution Feedback Routing

Memory class: FULL_RECORD

> Governance control: `GC-018`
> Date: `2026-03-22`
> Proposed tranche: `W2-T5 — Execution Feedback Routing Slice`
> Prerequisite: `W2-T4 — Execution Observer Slice (CLOSED DELIVERED)`

---

## GC-018 Depth Audit

| Criterion | Score | Rationale |
|---|---|---|
| Risk reduction | 3/3 | Closes the execution self-correction loop — `ExecutionFeedbackSignal` is currently produced but never acted upon; without a routing contract, execution failures have no governed response path |
| Decision value | 3/3 | First surface in the execution plane that ACTS on a feedback signal rather than only observing it; `FeedbackRoutingDecision` is the direct governance response to execution outcomes |
| Machine enforceability | 3/3 | Pure TypeScript contracts with injectable dependencies; 100% testable; no I/O required |
| Operational efficiency | 3/3 | Very high — the W2-T4 observer/feedback chain ends at `ExecutionFeedbackSignal` with no consumer; this tranche is the minimum viable close of that chain |
| Portfolio priority | 2/3 | W2 is deep (T1–T4 closed) but execution feedback routing closes a critical architectural gap; W4 has momentum but W2's orphaned signal is the more urgent open item |
| **Total** | **14/15** | **AUTHORIZED** |

---

## Proposed Scope

`W2-T5` delivers a two-contract execution feedback routing chain:

**`ExecutionFeedbackSignal → FeedbackRoutingDecision` (CP1, Full Lane)**

`FeedbackRoutingContract.route(signal)` maps the `feedbackClass` of an `ExecutionFeedbackSignal` to a governed `FeedbackRoutingDecision` with:
- `routingAction`: same as `feedbackClass` (ACCEPT | RETRY | ESCALATE | REJECT)
- `routingPriority`: REJECT → critical; ESCALATE → high; RETRY + `confidenceBoost=0` → high, `confidenceBoost>0` → medium; ACCEPT → low
- `rationale`: human-readable routing justification
- `decisionHash`: deterministic

**`FeedbackRoutingDecision[] → FeedbackResolutionSummary` (CP2, Fast Lane)**

`FeedbackResolutionContract.resolve(decisions)` aggregates multiple routing decisions into a `FeedbackResolutionSummary` with per-class counts and an `urgencyLevel`:
- CRITICAL: any REJECT or ESCALATE
- HIGH: any RETRY (and no CRITICAL)
- NORMAL: all ACCEPT or empty

---

## Consumer Path

```
ExecutionPipelineReceipt → ExecutionObservation → ExecutionFeedbackSignal  (W2-T4)
                                                          ↓
ExecutionFeedbackSignal → FeedbackRoutingDecision          (W2-T5 CP1)
FeedbackRoutingDecision[] → FeedbackResolutionSummary      (W2-T5 CP2)
```

---

## Authorization Boundary

- CP1: Full Lane — new `FeedbackRoutingContract` baseline in `CVF_EXECUTION_PLANE_FOUNDATION`
- CP2: Fast Lane (GC-021) — additive-only `FeedbackResolutionContract`
- CP3: Full Lane — tranche closure review

---

## Decision

**AUTHORIZED — Score 14/15**

W2-T5 may proceed immediately. The execution feedback routing chain closes the highest-priority open gap in the W2 plane.
