# CVF W6-T1 Streaming Execution Slice — Tranche Execution Plan

Memory class: FULL_RECORD

> Date: `2026-03-23`
> Tranche: `W6-T1 — Streaming Execution Slice`
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W6_T1_2026-03-23.md` (14/15 — AUTHORIZED)

---

## Objective

Deliver the first governed streaming execution surface in CVF. Closes the last W2-T3 explicit defer ("async, streaming, multi-agent — streaming and multi-agent deferred"). Connects `CommandRuntimeResult` (W2-T3 CP1) to a chunk-based streaming output model, distinct from the ticket-based async model delivered in W2-T7.

---

## Consumer Path

```
CommandRuntimeResult           (W2-T3 CP1)
    ↓ StreamingExecutionContract   (W6-T1 CP1)
StreamingExecutionChunk[]
    ↓ StreamingExecutionAggregatorContract  (W6-T1 CP2, Fast Lane)
StreamingExecutionSummary
```

---

## Control Points

| CP | Lane | Contract | Deliverable |
|---|---|---|---|
| CP1 | Full Lane | `StreamingExecutionContract` | First streaming chunk surface in CVF |
| CP2 | Fast Lane (GC-021) | `StreamingExecutionAggregatorContract` | Aggregation of streaming chunks |
| CP3 | Full Lane | Tranche Closure | Governance artifact chain |

---

## Streaming Chunk Model

`StreamingChunkStatus`: `"STREAMED" | "SKIPPED" | "FAILED"`

Mapping from `RuntimeExecutionStatus` (W2-T3):
- `"EXECUTED"` → `"STREAMED"`
- `"DELEGATED_TO_SANDBOX"` → `"STREAMED"` (sandbox execution also streams)
- `"SKIPPED_DENIED" | "SKIPPED_REVIEW_REQUIRED" | "SKIPPED_PENDING"` → `"SKIPPED"`
- `"EXECUTION_FAILED"` → `"FAILED"`

Dominant chunk status for aggregator: `FAILED > SKIPPED > STREAMED` (severity-first).

---

## Package

`EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION` (EPF)
Tests: +16; EPF: 143 → 159
