# CVF W3-T12 Execution Plan — Watchdog Escalation Pipeline Consumer Bridge

Memory class: SUMMARY_RECORD
> Tranche: W3-T12 — Watchdog Escalation Pipeline Consumer Bridge
> Date: 2026-03-24
> Branch: `cvf-next`
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W3_T12_WATCHDOG_ESCALATION_PIPELINE_CONSUMER_BRIDGE_2026-03-24.md`
> GC-018 score: 10/10 — CONTINUE

---

## Objective

Close the W3-T5 implied gap: `WatchdogEscalationPipelineResult` has no governed consumer-visible enriched output path.

Deliver a single governed entry point that runs the full watchdog escalation pipeline and wraps the result into a `ControlPlaneConsumerPackage`.

---

## Control Points

### CP1 — WatchdogEscalationPipelineConsumerPipelineContract (Full Lane)

**Contract:**
- File: `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/watchdog.escalation.pipeline.consumer.pipeline.contract.ts`
- Class: `WatchdogEscalationPipelineConsumerPipelineContract`
- Input: `WatchdogEscalationPipelineRequest` (observabilityInput, executionInput, policy?, candidateItems?, scoringWeights?, segmentTypeConstraints?, consumerId?)
- Internal chain:
  1. `WatchdogEscalationPipelineContract.execute(request)` → `WatchdogEscalationPipelineResult`
  2. `query = pipelineResult.escalationLog.summary.slice(0, 120)`
  3. `contextId = pipelineResult.resultId`
  4. `ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})` → `ControlPlaneConsumerPackage`
- Output: `WatchdogEscalationPipelineConsumerPipelineResult`
  - `resultId`, `createdAt`, `consumerId?`, `pipelineResult`, `consumerPackage`, `pipelineHash`, `warnings`
- Warnings:
  - `ESCALATE` → `[watchdog-escalation-pipeline] active escalation — immediate pipeline intervention required`
  - `MONITOR` → `[watchdog-escalation-pipeline] monitor active — pipeline monitoring in progress`
- Determinism: `now` injected; `computeDeterministicHash` for hash + resultId

**Test file:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/watchdog.escalation.pipeline.consumer.pipeline.test.ts`

**Governance artifacts:**
- Audit: `docs/audits/CVF_W3_T12_CP1_WATCHDOG_ESCALATION_PIPELINE_CONSUMER_BRIDGE_AUDIT_2026-03-24.md`
- Review: `docs/reviews/CVF_GC019_W3_T12_CP1_WATCHDOG_ESCALATION_PIPELINE_CONSUMER_BRIDGE_REVIEW_2026-03-24.md`
- Delta: `docs/baselines/CVF_W3_T12_CP1_WATCHDOG_ESCALATION_PIPELINE_CONSUMER_BRIDGE_DELTA_2026-03-24.md`

---

### CP2 — WatchdogEscalationPipelineConsumerPipelineBatchContract (Fast Lane GC-021)

**Contract:**
- File: `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/watchdog.escalation.pipeline.consumer.pipeline.batch.contract.ts`
- Class: `WatchdogEscalationPipelineConsumerPipelineBatchContract`
- Input: `WatchdogEscalationPipelineConsumerPipelineResult[]`
- Output: `WatchdogEscalationPipelineConsumerPipelineBatch`
  - `batchId`, `createdAt`, `results`, `totalResults`, `dominantTokenBudget`, `escalationActiveResultCount`, `batchHash`
- Pattern:
  - `dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
  - empty batch → `dominantTokenBudget = 0`, valid hash
  - `batchId ≠ batchHash` (batchId = hash of batchHash only)
  - `escalationActiveResultCount` = count of results where `pipelineResult.escalationActive === true`

**Test file:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/watchdog.escalation.pipeline.consumer.pipeline.batch.test.ts`

**Governance artifacts:**
- Audit: `docs/audits/CVF_W3_T12_CP2_WATCHDOG_ESCALATION_PIPELINE_CONSUMER_BRIDGE_BATCH_AUDIT_2026-03-24.md`
- Review: `docs/reviews/CVF_GC021_W3_T12_CP2_WATCHDOG_ESCALATION_PIPELINE_CONSUMER_BRIDGE_BATCH_REVIEW_2026-03-24.md`
- Delta: `docs/baselines/CVF_W3_T12_CP2_WATCHDOG_ESCALATION_PIPELINE_CONSUMER_BRIDGE_BATCH_DELTA_2026-03-24.md`

---

### CP3 — Tranche Closure

**Artifacts:**
- Closure review: `docs/reviews/CVF_W3_T12_TRANCHE_CLOSURE_REVIEW_2026-03-24.md`
- GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W3_T12_CLOSURE_2026-03-24.md`
- GEF barrel exports: `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/index.ts` (prepend W3-T12 block)
- Test partition registry: `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` (2 new entries)
- Progress tracker: `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` (W3-T12 DONE)
- Roadmap: `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` (post-cycle closure record)
- Test log: `docs/CVF_INCREMENTAL_TEST_LOG.md`
- AGENT_HANDOFF.md (update state)

---

## Definition of Done

- `WatchdogEscalationPipelineConsumerPipelineContract` + `WatchdogEscalationPipelineConsumerPipelineBatchContract` committed to `cvf-next`
- All GEF tests green (target: ~428 total)
- Dedicated test files registered in partition registry
- GEF index.ts barrel exports updated
- All governance artifacts committed
- Tranche marked `DONE` in progress tracker
