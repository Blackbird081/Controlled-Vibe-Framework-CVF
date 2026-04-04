# CVF W3-T8 Execution Plan — Governance Checkpoint Reintake Consumer Bridge

Memory class: SUMMARY_RECORD
> Tranche: W3-T8 — Governance Checkpoint Reintake Consumer Bridge
> Plane: Governance Expansion (GEF → CPF cross-plane bridge)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W3_T8_CHECKPOINT_REINTAKE_CONSUMER_BRIDGE_2026-03-24.md`
> Date: 2026-03-24

---

## Gap Being Closed

`GovernanceCheckpointReintakeContract.reintake(decision)` produces a `CheckpointReintakeRequest`
carrying critical governance signals (ESCALATION_REQUIRED, HALT_REVIEW_PENDING, NO_REINTAKE).
This result had no governed consumer-visible output path to the Control Plane — W3-T8 closes
the implied W3-T5 gap.

---

## CP1 — GovernanceCheckpointReintakeConsumerPipelineContract (Full Lane)

**File:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/governance.checkpoint.reintake.consumer.pipeline.contract.ts`

**Chain:**
```
GovernanceCheckpointDecision
  → GovernanceCheckpointReintakeContract.reintake(decision)
  → CheckpointReintakeRequest
  → query derivation
  → ControlPlaneConsumerPipelineContract.execute(...)
  → ControlPlaneConsumerPackage
  → GovernanceCheckpointReintakeConsumerPipelineResult
```

**Query derivation:**
```
query = `${reintakeTrigger}:scope:${reintakeScope}:src:${sourceCheckpointId}`.slice(0, 120)
```

**contextId:** `reintakeRequest.reintakeId`

**Warnings:**
- `ESCALATION_REQUIRED` → `[reintake] governance escalation required — immediate control re-intake triggered`
- `HALT_REVIEW_PENDING` → `[reintake] governance halt — deferred control re-intake pending review`

**Tests:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/governance.checkpoint.reintake.consumer.pipeline.test.ts`
Target: ≥16 tests

**Governance artifacts:**
- `docs/audits/CVF_W3_T8_CP1_CHECKPOINT_REINTAKE_CONSUMER_PIPELINE_AUDIT_2026-03-24.md`
- `docs/reviews/CVF_GC019_W3_T8_CP1_CHECKPOINT_REINTAKE_CONSUMER_PIPELINE_REVIEW_2026-03-24.md`
- `docs/baselines/CVF_W3_T8_CP1_CHECKPOINT_REINTAKE_CONSUMER_PIPELINE_DELTA_2026-03-24.md`

---

## CP2 — GovernanceCheckpointReintakeConsumerPipelineBatchContract (Fast Lane GC-021)

**File:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/governance.checkpoint.reintake.consumer.pipeline.batch.contract.ts`

**Aggregation:**
- `immediateCount` = results with reintakeTrigger === ESCALATION_REQUIRED
- `deferredCount` = results with reintakeTrigger === HALT_REVIEW_PENDING
- `noReintakeCount` = results with reintakeTrigger === NO_REINTAKE
- `dominantTokenBudget` = `Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
- empty batch → `dominantTokenBudget = 0`
- `batchId` ≠ `batchHash`

**Tests:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/governance.checkpoint.reintake.consumer.pipeline.batch.test.ts`
Target: ≥10 tests

**Governance artifacts:**
- `docs/audits/CVF_W3_T8_CP2_CHECKPOINT_REINTAKE_CONSUMER_PIPELINE_BATCH_AUDIT_2026-03-24.md`
- `docs/reviews/CVF_GC021_W3_T8_CP2_CHECKPOINT_REINTAKE_CONSUMER_PIPELINE_BATCH_REVIEW_2026-03-24.md`
- `docs/baselines/CVF_W3_T8_CP2_CHECKPOINT_REINTAKE_CONSUMER_PIPELINE_BATCH_DELTA_2026-03-24.md`

---

## CP3 — Tranche Closure

- `docs/reviews/CVF_W3_T8_TRANCHE_CLOSURE_REVIEW_2026-03-24.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W3_T8_CLOSURE_2026-03-24.md`
- Update: `docs/CVF_INCREMENTAL_TEST_LOG.md`, `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`, `AGENT_HANDOFF.md`, `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`

---

## GEF Test Baseline

| Before W3-T8 | After CP1 | After CP2 |
|---|---|---|
| 265 | ~281 | ~291 |
