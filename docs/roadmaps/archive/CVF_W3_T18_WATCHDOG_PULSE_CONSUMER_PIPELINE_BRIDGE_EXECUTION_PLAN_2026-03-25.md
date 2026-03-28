# CVF W3-T18 Execution Plan — WatchdogPulse Consumer Pipeline Bridge

Memory class: SUMMARY_RECORD
> Tranche: W3-T18
> Date: 2026-03-25
> Branch: `cvf-next`

---

## Tranche Goal

Bridge `WatchdogPulseContract` into the CPF consumer pipeline, closing the last GEF consumer visibility gap. The watchdog pulse is the foundational cross-plane health signal — synthesizing `WatchdogObservabilityInput` (dominantHealth) and `WatchdogExecutionInput` (dominantStatus) into a governed `WatchdogPulse` (NOMINAL/WARNING/CRITICAL/UNKNOWN). This bridge makes the pulse signal consumer-visible and enrichable.

---

## CP1 — Full Lane

### Artifacts
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/watchdog.pulse.consumer.pipeline.contract.ts`
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/watchdog.pulse.consumer.pipeline.test.ts`
- `docs/audits/CVF_W3_T18_CP1_WATCHDOG_PULSE_CONSUMER_PIPELINE_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC019_W3_T18_CP1_WATCHDOG_PULSE_CONSUMER_PIPELINE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W3_T18_CP1_WATCHDOG_PULSE_CONSUMER_PIPELINE_DELTA_2026-03-25.md`
- GEF `src/index.ts` barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Contract Design

```
Input: WatchdogObservabilityInput + WatchdogExecutionInput
  → WatchdogPulseContract.pulse(obs, exec) → WatchdogPulse
  → query = `[watchdog-pulse] status:${pulse.watchdogStatus} obs:${obs.dominantHealth} exec:${exec.dominantStatus}`.slice(0, 120)
  → contextId = pulse.pulseId
  → ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
  → pipelineHash = hash("w3-t18-cp1-watchdog-pulse-consumer-pipeline", pulse.pulseHash, consumerPackage.pipelineHash, createdAt)
  → resultId = hash("w3-t18-cp1-result-id", pipelineHash)
  → warning: watchdogStatus === "CRITICAL" → "[watchdog-pulse] critical pulse detected — immediate governance review required"
  → warning: watchdogStatus === "WARNING" → "[watchdog-pulse] warning pulse detected — system health degraded"
```

---

## CP2 — Fast Lane (GC-021)

### Artifacts
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/watchdog.pulse.consumer.pipeline.batch.contract.ts`
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/watchdog.pulse.consumer.pipeline.batch.test.ts`
- `docs/audits/CVF_W3_T18_CP2_WATCHDOG_PULSE_CONSUMER_PIPELINE_BATCH_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC021_W3_T18_CP2_WATCHDOG_PULSE_CONSUMER_PIPELINE_BATCH_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W3_T18_CP2_WATCHDOG_PULSE_CONSUMER_PIPELINE_BATCH_DELTA_2026-03-25.md`
- GEF `src/index.ts` batch barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Batch Design

```
Batch fields: criticalPulseCount, dominantTokenBudget
criticalPulseCount  = results.filter(r => r.pulse.watchdogStatus === "CRITICAL").length
dominantTokenBudget = Math.max(...estimatedTokens) or 0 for empty
batchHash = hash("w3-t18-cp2-watchdog-pulse-consumer-pipeline-batch", ...pipelineHashes, createdAt)
batchId = hash("w3-t18-cp2-batch-id", batchHash)
```

---

## CP3 — Closure

### Artifacts
- `docs/reviews/CVF_W3_T18_TRANCHE_CLOSURE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W3_T18_CLOSURE_2026-03-25.md`
- `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` updated
- `AGENT_HANDOFF.md` updated

---

## Status Log

| CP | Status |
|---|---|
| GC-018 + GC-026 auth | DONE |
| CP1 | DONE — 22 tests, 612 GEF |
| CP2 | DONE — 13 tests, 625 GEF |
| CP3 | DONE — CLOSED DELIVERED |
