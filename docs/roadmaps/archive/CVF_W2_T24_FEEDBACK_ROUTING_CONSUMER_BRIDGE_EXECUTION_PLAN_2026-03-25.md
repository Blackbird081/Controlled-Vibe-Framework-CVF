# CVF W2-T24 Execution Plan — FeedbackRouting Consumer Pipeline Bridge

Memory class: SUMMARY_RECORD
> Tranche: W2-T24
> Date: 2026-03-25
> Branch: `cvf-next`

---

## Tranche Goal

Bridge `FeedbackRoutingContract` into the CPF consumer pipeline, closing the last EPF consumer visibility gap for the W2 wave — routing decisions (REJECT/ESCALATE/RETRY/ACCEPT) will gain governed consumer-enriched output.

---

## CP1 — Full Lane

### Artifacts
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/feedback.routing.consumer.pipeline.contract.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/feedback.routing.consumer.pipeline.test.ts`
- `docs/audits/CVF_W2_T24_CP1_FEEDBACK_ROUTING_CONSUMER_BRIDGE_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC019_W2_T24_CP1_FEEDBACK_ROUTING_CONSUMER_BRIDGE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W2_T24_CP1_FEEDBACK_ROUTING_CONSUMER_BRIDGE_DELTA_2026-03-25.md`
- EPF `src/index.ts` barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Contract Design

```
Input: ExecutionFeedbackSignal (single)
  → FeedbackRoutingContract.route(signal) → FeedbackRoutingDecision
  → query = `[feedback-routing] action:${routingAction} priority:${routingPriority}`.slice(0, 120)
  → contextId = routingDecision.decisionId
  → ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
  → pipelineHash = hash("w2-t24-cp1-feedback-routing-consumer-pipeline", routingDecision.decisionHash, consumerPackage.pipelineHash, createdAt)
  → resultId = hash("w2-t24-cp1-result-id", pipelineHash)
  → warnings: routingAction === "REJECT" → "[feedback] rejection decision — immediate intervention required"
              routingAction === "ESCALATE" → "[feedback] escalation decision — human review required"
```

---

## CP2 — Fast Lane (GC-021)

### Artifacts
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/feedback.routing.consumer.pipeline.batch.contract.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/feedback.routing.consumer.pipeline.batch.test.ts`
- `docs/audits/CVF_W2_T24_CP2_FEEDBACK_ROUTING_CONSUMER_BRIDGE_BATCH_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC021_W2_T24_CP2_FEEDBACK_ROUTING_CONSUMER_BRIDGE_BATCH_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W2_T24_CP2_FEEDBACK_ROUTING_CONSUMER_BRIDGE_BATCH_DELTA_2026-03-25.md`
- EPF `src/index.ts` batch barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Batch Design

```
Batch fields: rejectedResultCount, escalatedResultCount, dominantTokenBudget
rejectedResultCount  = results.filter(r => r.routingDecision.routingAction === "REJECT").length
escalatedResultCount = results.filter(r => r.routingDecision.routingAction === "ESCALATE").length
dominantTokenBudget  = Math.max(...estimatedTokens) or 0 for empty
batchHash = hash("w2-t24-cp2-feedback-routing-consumer-pipeline-batch", ...pipelineHashes, createdAt)
batchId = hash("w2-t24-cp2-batch-id", batchHash)
```

---

## CP3 — Closure

### Artifacts
- `docs/reviews/CVF_W2_T24_TRANCHE_CLOSURE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W2_T24_CLOSURE_2026-03-25.md`
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
