# CVF W3-T10 Execution Plan — Watchdog Alert Log Consumer Bridge

Memory class: SUMMARY_RECORD

> Tranche: W3-T10 — Watchdog Alert Log Consumer Bridge
> Authorized: 2026-03-24 (GC-018 score: 10/10)
> Branch: `cvf-next`

---

## Objective

Close the gap: `WatchdogAlertLog` produced by `WatchdogAlertLogContract.log(pulses[])` has no governed consumer output path to CPF. W3-T10 adds `WatchdogAlertLogConsumerPipelineContract` (CP1) and `WatchdogAlertLogConsumerPipelineBatchContract` (CP2) as the canonical GEF→CPF bridge for watchdog alert data.

---

## CP1 — Full Lane: WatchdogAlertLogConsumerPipelineContract

**File:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/watchdog.alert.log.consumer.pipeline.contract.ts`

**Chain:**
```
WatchdogPulse[]
  → WatchdogAlertLogContract.log(pulses)
  → WatchdogAlertLog
  → query: ${dominantStatus}:alert:${alertActive}:pulses:${totalPulses} (≤120 chars)
  → contextId: alertLog.logId
  → ControlPlaneConsumerPipelineContract
  → ControlPlaneConsumerPackage
```

**Warnings:**
- `CRITICAL` → `[watchdog] critical alert — immediate escalation required`
- `WARNING` → `[watchdog] warning alert — watchdog alert log review required`

**Hash seeds:** `"w3-t10-cp1-watchdog-alert-log-consumer-pipeline"`, `"w3-t10-cp1-result-id"`

**Tests:** ≥16 tests covering all 4 status variants, empty input, determinism, query bounds, contextId, consumerId passthrough, warnings

**Governance artifacts:** audit doc, GC-019 review doc, delta doc, barrel export, partition registry entry

---

## CP2 — Fast Lane (GC-021): WatchdogAlertLogConsumerPipelineBatchContract

**File:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/watchdog.alert.log.consumer.pipeline.batch.contract.ts`

**Aggregation:**
- `criticalAlertResultCount` = results where `alertLog.dominantStatus === "CRITICAL"`
- `warningAlertResultCount` = results where `alertLog.dominantStatus === "WARNING"`
- `dominantTokenBudget` = `Math.max(estimatedTokens)`, 0 for empty
- `batchId ≠ batchHash`

**Hash seeds:** `"w3-t10-cp2-watchdog-alert-log-consumer-pipeline-batch"`, `"w3-t10-cp2-batch-id"`

**Tests:** ≥10 tests covering counts, empty batch, budget, determinism, hash invariants

**Governance artifacts:** fast-lane audit doc, GC-021 review doc, delta doc, barrel export, partition registry entry

---

## CP3 — Tranche Closure

- Closure review: `docs/reviews/CVF_W3_T10_TRANCHE_CLOSURE_REVIEW_2026-03-24.md`
- GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W3_T10_CLOSURE_2026-03-24.md`
- Update: progress tracker, roadmap, AGENT_HANDOFF, incremental test log
- Commit and push to `cvf-next`

---

## Gap Closed

W3-T1/T2 implied — `WatchdogAlertLog` (upstream governance signal aggregator) had no governed consumer-visible output path to CPF. The watchdog alert log is foundational: it feeds `GovernanceAuditSignalContract` which feeds `GovernanceAuditLogContract`.
