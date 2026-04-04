# CVF W6-T5 Checkpoint-Driven Control Reintake Slice — Tranche Execution Plan

Memory class: SUMMARY_RECORD
> Date: `2026-03-23`
> Tranche: `W6-T5 — Checkpoint-Driven Control Reintake Slice`
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W6_T5_2026-03-23.md` (14/15 — AUTHORIZED)

---

## Objective

Deliver the mechanical follow-through for `GovernanceCheckpointDecision` (W6-T4). A HALT or ESCALATE checkpoint without a concrete re-intake trigger is advisory-only. This tranche closes that gap by producing a `CheckpointReintakeRequest` with a governed `ReintakeTrigger` and `ReintakeScope`, plus a batch summary for aggregated checkpoints.

Mirrors the W2-T6 (ExecutionReintakeContract) pattern at the governance→control boundary.

---

## Consumer Path

```
GovernanceCheckpointDecision  (W6-T4 CP1 — GPF)
    ↓ GovernanceCheckpointReintakeContract   (W6-T5 CP1)
CheckpointReintakeRequest
    ↓ GovernanceCheckpointReintakeSummaryContract  (W6-T5 CP2, Fast Lane)
CheckpointReintakeSummary
```

---

## Control Points

| CP | Lane | Contract | Deliverable |
|---|---|---|---|
| CP1 | Full Lane | `GovernanceCheckpointReintakeContract` | Translates checkpoint action into governed re-intake trigger |
| CP2 | Fast Lane (GC-021) | `GovernanceCheckpointReintakeSummaryContract` | Aggregates re-intake requests into a governed summary |
| CP3 | Full Lane | Tranche Closure | Governance artifact chain |

---

## ReintakeTrigger / ReintakeScope Model

| CheckpointAction (input) | ReintakeTrigger | ReintakeScope |
|---|---|---|
| `ESCALATE` | `ESCALATION_REQUIRED` | `IMMEDIATE` |
| `HALT` | `HALT_REVIEW_PENDING` | `DEFERRED` |
| `PROCEED` | `NO_REINTAKE` | `NONE` |

Dominant scope for summary (severity-first): `IMMEDIATE > DEFERRED > NONE`

---

## Package

`EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION` (GPF)

### GC-023 Pre-flight

| File | Current Lines | Limit | New Lines | Result |
|---|---|---|---|---|
| `governance.checkpoint.reintake.contract.ts` | new | 700 (hard) | ~85 | PASS |
| `governance.checkpoint.reintake.summary.contract.ts` | new | 700 (hard) | ~65 | PASS |
| `src/index.ts` | 255 | 700 (hard) | ~20 | PASS (~275) |
| `governance.checkpoint.reintake.test.ts` | new (dedicated) | 1200 (hard) | ~220 | PASS |

Tests: +16; dedicated file mandatory (GC-023 pattern)
