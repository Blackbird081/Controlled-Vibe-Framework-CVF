# CVF Memory Record Classification

Memory class: POINTER_RECORD

Status: canonical reference for how CVF stores durable memory evidence without wasting token cost.

## Purpose

- define the memory classes used by CVF memory governance
- align memory granularity with `docs/` storage taxonomy
- reduce over-recording while preserving durable truth

## Canonical Classes

### `FULL_RECORD`

Use when later workers must be able to reconstruct the event, decision, or verdict in durable detail.

Typical examples:

- `docs/assessments/`
- `docs/audits/`
- `docs/reviews/`

### `SUMMARY_RECORD`

Use when later workers need the outcome, change summary, verification result, and pointers to canonical evidence, but not every intermediate detail.

Typical examples:

- `docs/baselines/`
- `docs/roadmaps/`
- `docs/logs/`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`

### `POINTER_RECORD`

Use when the document's main role is navigation, canonical indexing, or directing later context loading to the right evidence source.

Typical examples:

- `docs/INDEX.md`
- `docs/reference/README.md`
- most files in `docs/reference/`

## Default Mapping

| Location | Default memory class | Why |
|---|---|---|
| `docs/assessments/` | `FULL_RECORD` | assessments are verdict-bearing durable evidence |
| `docs/audits/` | `FULL_RECORD` | audit packets must preserve detailed rationale |
| `docs/reviews/` | `FULL_RECORD` | review verdicts must remain reconstructable |
| `docs/baselines/` | `SUMMARY_RECORD` | deltas should summarize what changed and where truth lives |
| `docs/roadmaps/` | `SUMMARY_RECORD` | roadmaps should carry status and next steps, not duplicate every packet |
| `docs/logs/` | `SUMMARY_RECORD` | logs preserve an active summary window, not all source detail |
| `docs/reference/` | `POINTER_RECORD` by default | reference docs route readers to canonical truth and stable models |
| `docs/CVF_INCREMENTAL_TEST_LOG.md` | `SUMMARY_RECORD` | active testing memory should stay concise and evidence-linked |
| `docs/INDEX.md` | `POINTER_RECORD` | index exists to route, not to duplicate |
| `docs/reference/README.md` | `POINTER_RECORD` | README exists to route, not to duplicate |

## Relationship To GC-021 Fast Lane

`GC-021` and `GC-022` are related, but they do not do the same job.

- `GC-021` decides the governance lane and the minimum artifact burden for one change
- `GC-022` decides the durable memory class of the resulting artifacts

So:

- `Fast Lane` does not automatically mean `SUMMARY_RECORD`
- `Full Lane` does not automatically mean every artifact becomes `FULL_RECORD`

The durable memory class follows artifact role, not lane name.

### Common Crosswalk

| Artifact type | Typical lane | Default memory class |
|---|---|---|
| audit | fast lane or full lane | `FULL_RECORD` |
| independent review | fast lane or full lane | `FULL_RECORD` |
| approval or closure review | fast lane or full lane | `FULL_RECORD` |
| implementation delta | fast lane or full lane | `SUMMARY_RECORD` |
| planning delta | fast lane or full lane | `SUMMARY_RECORD` |
| execution plan update | fast lane or full lane | `SUMMARY_RECORD` |
| test log entry | fast lane or full lane | `SUMMARY_RECORD` |
| index / reference README / navigation page | any | `POINTER_RECORD` |

This crosswalk exists to prevent hidden token cost caused by confusing process simplification with memory-storage class.

## Relationship To Context Continuity

This classification supplies the durable-memory side of the CVF context continuity model:

- memory keeps durable facts, history, and evidence
- handoff compresses transition truth
- context loading retrieves only the bounded material needed for the current phase

## Related References

- `governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md`
- `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- `docs/INDEX.md`
