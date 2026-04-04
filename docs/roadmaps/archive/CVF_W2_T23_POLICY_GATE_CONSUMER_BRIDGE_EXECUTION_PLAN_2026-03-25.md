# CVF W2-T23 Execution Plan — PolicyGate Consumer Pipeline Bridge

Memory class: SUMMARY_RECORD
> Tranche: W2-T23
> Date: 2026-03-25
> Branch: `cvf-next`

---

## Tranche Goal

Bridge `PolicyGateContract` into the CPF consumer pipeline, closing the EPF consumer visibility gap for policy gate evaluation results (the per-assignment allow/deny/review/sandbox governance decision record).

---

## CP1 — Full Lane

### Artifacts
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/policy.gate.consumer.pipeline.contract.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/policy.gate.consumer.pipeline.test.ts`
- `docs/audits/CVF_W2_T23_CP1_POLICY_GATE_CONSUMER_BRIDGE_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC019_W2_T23_CP1_POLICY_GATE_CONSUMER_BRIDGE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W2_T23_CP1_POLICY_GATE_CONSUMER_BRIDGE_DELTA_2026-03-25.md`
- EPF `src/index.ts` barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Contract Design

```
Input: DispatchResult (single)
  → PolicyGateContract.evaluate(dispatchResult) → PolicyGateResult
  → query = `[policy-gate] denied:${deniedCount} review:${reviewRequiredCount} sandbox:${sandboxedCount} total:${entries.length}`.slice(0, 120)
  → contextId = gateResult.gateId
  → ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
  → pipelineHash = hash("w2-t23-cp1-policy-gate-consumer-pipeline", gateResult.gateHash, consumerPackage.pipelineHash, createdAt)
  → resultId = hash("w2-t23-cp1-result-id", pipelineHash)
  → warnings: deniedCount > 0 → "policy gate denials detected — review required"
              reviewRequiredCount > 0 → "policy gate reviews pending — human review required"
```

---

## CP2 — Fast Lane (GC-021)

### Artifacts
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/policy.gate.consumer.pipeline.batch.contract.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/policy.gate.consumer.pipeline.batch.test.ts`
- `docs/audits/CVF_W2_T23_CP2_POLICY_GATE_CONSUMER_BRIDGE_BATCH_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC021_W2_T23_CP2_POLICY_GATE_CONSUMER_BRIDGE_BATCH_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W2_T23_CP2_POLICY_GATE_CONSUMER_BRIDGE_BATCH_DELTA_2026-03-25.md`
- EPF `src/index.ts` batch barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Batch Design

```
Batch fields: deniedResultCount, reviewResultCount, dominantTokenBudget
deniedResultCount  = results.filter(r => r.gateResult.deniedCount > 0).length
reviewResultCount  = results.filter(r => r.gateResult.reviewRequiredCount > 0).length
dominantTokenBudget = Math.max(...estimatedTokens) or 0 for empty
batchHash = hash("w2-t23-cp2-policy-gate-consumer-pipeline-batch", ...pipelineHashes, createdAt)
batchId = hash("w2-t23-cp2-batch-id", batchHash)
```

---

## CP3 — Closure

### Artifacts
- `docs/reviews/CVF_W2_T23_TRANCHE_CLOSURE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W2_T23_CLOSURE_2026-03-25.md`
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
