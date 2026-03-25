# CVF W1-T20 Execution Plan — GatewayAuth Consumer Pipeline Bridge

Memory class: SUMMARY_RECORD

> Tranche: W1-T20
> Date: 2026-03-25
> Branch: `cvf-next`

---

## Tranche Goal

Bridge `GatewayAuthContract` into the CPF consumer pipeline, closing the highest-value remaining CPF consumer visibility gap. The gateway auth contract is the governance-critical tenant authentication decision point — evaluating credentials and producing `GatewayAuthResult` with `authStatus` (AUTHENTICATED/DENIED/EXPIRED/REVOKED). This bridge makes auth decisions consumer-visible and enrichable for downstream governance workflows.

---

## CP1 — Full Lane

### Artifacts
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.consumer.pipeline.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.auth.consumer.pipeline.test.ts`
- `docs/audits/CVF_W1_T20_CP1_GATEWAY_AUTH_CONSUMER_PIPELINE_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC019_W1_T20_CP1_GATEWAY_AUTH_CONSUMER_PIPELINE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W1_T20_CP1_GATEWAY_AUTH_CONSUMER_PIPELINE_DELTA_2026-03-25.md`
- CPF `src/index.ts` barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Contract Design

```
Input:   GatewayAuthRequest (tenantId, credentials, scope)
Step 1:  GatewayAuthContract.evaluate(request) → GatewayAuthResult
Step 2:  query = `gateway-auth:${authResult.authStatus}:tenant:${authResult.tenantId}`.slice(0, 120)
         contextId = authResult.resultId
Step 3:  ControlPlaneConsumerPipelineContract.execute({ rankingRequest: { query, contextId, ... } })
Step 4:  warnings:
           DENIED  → "[gateway-auth] access denied — tenant authentication failed"
           EXPIRED → "[gateway-auth] credential expired — tenant session requires renewal"
           REVOKED → "[gateway-auth] credential revoked — tenant access has been revoked"
Output:  GatewayAuthConsumerPipelineResult { resultId, createdAt, consumerId?, authResult, consumerPackage, pipelineHash, warnings }
```

---

## CP2 — Fast Lane (GC-021)

### Artifacts
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.consumer.pipeline.batch.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.auth.consumer.pipeline.batch.test.ts`
- `docs/audits/CVF_W1_T20_CP2_GATEWAY_AUTH_CONSUMER_PIPELINE_BATCH_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC021_W1_T20_CP2_GATEWAY_AUTH_CONSUMER_PIPELINE_BATCH_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W1_T20_CP2_GATEWAY_AUTH_CONSUMER_PIPELINE_BATCH_DELTA_2026-03-25.md`
- CPF `src/index.ts` barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Contract Design

```
Input:   GatewayAuthConsumerPipelineResult[]
Fields:  nonAuthenticatedCount = results where authResult.authenticated === false
         dominantTokenBudget = Math.max(typedContextPackage.estimatedTokens); 0 for empty
         batchId = hash(batchHash); batchId !== batchHash
Output:  GatewayAuthConsumerPipelineBatch { batchId, createdAt, results, totalResults, dominantTokenBudget, nonAuthenticatedCount, batchHash }
```

---

## CP3 — Closure

### Artifacts
- `docs/reviews/CVF_W1_T20_TRANCHE_CLOSURE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W1_T20_CLOSURE_2026-03-25.md`
- `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` updated
- `AGENT_HANDOFF.md` updated

---

## Status Log

| CP | Status |
|---|---|
| GC-018 + GC-026 auth | DONE |
| CP1 | PENDING |
| CP2 | PENDING |
| CP3 | PENDING |
