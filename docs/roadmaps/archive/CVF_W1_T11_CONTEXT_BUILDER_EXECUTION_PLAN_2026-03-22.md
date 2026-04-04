# CVF W1-T11 Execution Plan — Context Builder Foundation Slice

Memory class: SUMMARY_RECORD
> Date: `2026-03-22`
> Tranche: `W1-T11 — Context Builder Foundation Slice`
> Authorization: GC-018 (14/15 — AUTHORIZED)

---

## Objective

Deliver the first governed Context Builder contract. Closes the last major W1 PARTIAL gap with no prior operational deliverable. Connects knowledge retrieval (W1-T10) to context packaging for downstream intake/design pipeline.

---

## Consumer Path

```
ContextBuildRequest { query, contextId, knowledgeItems?, metadata?, maxTokens? }
    ↓ ContextBuildContract (W1-T11 CP1)
ContextPackage { packageId, segments[], totalSegments, estimatedTokens, packageHash }
    ↓ ContextBuildBatchContract (W1-T11 CP2, Fast Lane)
ContextBuildBatch { batchId, totalPackages, totalSegments, avgSegmentsPerPackage, batchHash }
```

---

## Control Points

| CP | Lane | Contract | Deliverable |
|---|---|---|---|
| CP1 | Full Lane | `ContextBuildContract` | First context packaging surface in CVF |
| CP2 | Fast Lane (GC-021) | `ContextBuildBatchContract` | Aggregation of context packages |
| CP3 | Full Lane | Tranche Closure | Governance artifact chain |

---

## Segment Type Model

`ContextSegmentType`: `"QUERY" | "KNOWLEDGE" | "METADATA" | "SYSTEM"`

Assembly order: QUERY (always 1st) → KNOWLEDGE (one per item) → METADATA (one per entry) → capped by `maxTokens`

---

## Package

`EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION` (CPF)
Tests: +17 tranche-local tests; CPF: 196 → 213
