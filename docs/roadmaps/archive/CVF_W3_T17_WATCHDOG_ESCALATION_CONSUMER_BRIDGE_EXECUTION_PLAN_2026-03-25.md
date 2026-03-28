# CVF W3-T17 Execution Plan — WatchdogEscalation Consumer Pipeline Bridge

Memory class: SUMMARY_RECORD
> Tranche: W3-T17
> Date: 2026-03-25
> Branch: `cvf-next`

---

## Tranche Goal

Bridge `WatchdogEscalationContract` into the CPF consumer pipeline, closing the GEF consumer visibility gap for watchdog escalation decisions (ESCALATE/MONITOR/CLEAR). The escalation verdict is the primary actionable signal in the watchdog chain.

---

## CP1 — Full Lane

### Artifacts
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/watchdog.escalation.consumer.pipeline.contract.ts`
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/watchdog.escalation.consumer.pipeline.test.ts`
- `docs/audits/CVF_W3_T17_CP1_WATCHDOG_ESCALATION_CONSUMER_BRIDGE_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC019_W3_T17_CP1_WATCHDOG_ESCALATION_CONSUMER_BRIDGE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W3_T17_CP1_WATCHDOG_ESCALATION_CONSUMER_BRIDGE_DELTA_2026-03-25.md`
- GEF `src/index.ts` barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Contract Design

```
Input: WatchdogAlertLog (single)
  → WatchdogEscalationContract.evaluate(alertLog) → WatchdogEscalationDecision
  → query = `[watchdog-escalation] action:${action} dominant:${dominantStatus}`.slice(0, 120)
  → contextId = escalationDecision.decisionId
  → ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
  → pipelineHash = hash("w3-t17-cp1-watchdog-escalation-consumer-pipeline", decision.decisionHash, consumerPackage.pipelineHash, createdAt)
  → resultId = hash("w3-t17-cp1-result-id", pipelineHash)
  → warning: action === "ESCALATE" → "[watchdog] escalation triggered — immediate governance checkpoint required"
```

---

## CP2 — Fast Lane (GC-021)

### Artifacts
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/watchdog.escalation.consumer.pipeline.batch.contract.ts`
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/watchdog.escalation.consumer.pipeline.batch.test.ts`
- `docs/audits/CVF_W3_T17_CP2_WATCHDOG_ESCALATION_CONSUMER_BRIDGE_BATCH_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC021_W3_T17_CP2_WATCHDOG_ESCALATION_CONSUMER_BRIDGE_BATCH_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W3_T17_CP2_WATCHDOG_ESCALATION_CONSUMER_BRIDGE_BATCH_DELTA_2026-03-25.md`
- GEF `src/index.ts` batch barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Batch Design

```
Batch fields: escalationActiveCount, dominantTokenBudget
escalationActiveCount = results.filter(r => r.escalationDecision.action === "ESCALATE").length
dominantTokenBudget   = Math.max(...estimatedTokens) or 0 for empty
batchHash = hash("w3-t17-cp2-watchdog-escalation-consumer-pipeline-batch", ...pipelineHashes, createdAt)
batchId = hash("w3-t17-cp2-batch-id", batchHash)
```

---

## CP3 — Closure

### Artifacts
- `docs/reviews/CVF_W3_T17_TRANCHE_CLOSURE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W3_T17_CLOSURE_2026-03-25.md`
- `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` updated
- `AGENT_HANDOFF.md` updated

---

## Status Log

| CP | Status |
|---|---|
| GC-018 + GC-026 auth | DONE |
| CP1 | IN PROGRESS |
| CP2 | PENDING |
| CP3 | PENDING |
