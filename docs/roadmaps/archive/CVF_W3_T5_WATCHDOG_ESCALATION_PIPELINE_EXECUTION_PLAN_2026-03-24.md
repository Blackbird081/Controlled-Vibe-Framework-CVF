# CVF W3-T5 Watchdog Escalation Pipeline — Execution Plan

Memory class: SUMMARY_RECORD
> Date: `2026-03-24`
> Tranche: `W3-T5 — Watchdog Escalation Pipeline Slice`
> Authorization: `GC-018 10/10 — docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W3_T5_WATCHDOG_ESCALATION_PIPELINE_2026-03-24.md`
> Extension: `CVF_GOVERNANCE_EXPANSION_FOUNDATION`

---

## Control Points

### CP1 — WatchdogEscalationPipelineContract (Full Lane)

**Scope:**

New contract `WatchdogEscalationPipelineContract` in GEF that chains the full watchdog
escalation flow into a single governed pipeline.

Input/output chain:
- Input: `WatchdogEscalationPipelineRequest { observabilityInput, executionInput, policy? }`
- Step 1: `WatchdogPulseContract.pulse(obs, exec)` → `WatchdogPulse`
- Step 2: `WatchdogAlertLogContract.log([pulse])` → `WatchdogAlertLog`
- Step 3: `WatchdogEscalationContract.evaluate(alertLog)` → `WatchdogEscalationDecision`
- Step 4: `WatchdogEscalationLogContract.log([decision])` → `WatchdogEscalationLog`
- Output: `WatchdogEscalationPipelineResult { resultId, createdAt, pulse, alertLog, escalationDecision, escalationLog, escalationActive, dominantAction, pipelineHash }`

Determinism rules:
- `pipelineHash` = `computeDeterministicHash("w3-t5-cp1-pipeline", pulseHash, logHash, decisionHash, escalationLogHash, createdAt)`
- `resultId` = `computeDeterministicHash("w3-t5-cp1-result-id", pipelineHash)`
- `now()` injected via `WatchdogEscalationPipelineContractDependencies` and propagated to all sub-contracts

**Files:**
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/watchdog.escalation.pipeline.contract.ts` (new)
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/index.ts` (barrel export update)
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/watchdog.escalation.pipeline.test.ts` (new, ~11 tests)
- `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` (new GEF partition entry)

**Governance artifacts:**
- `docs/audits/CVF_W3_T5_CP1_WATCHDOG_ESCALATION_PIPELINE_AUDIT_2026-03-24.md`
- `docs/reviews/CVF_GC019_W3_T5_CP1_WATCHDOG_ESCALATION_PIPELINE_REVIEW_2026-03-24.md`
- `docs/baselines/CVF_W3_T5_CP1_WATCHDOG_ESCALATION_PIPELINE_DELTA_2026-03-24.md`

---

### CP2 — WatchdogEscalationPipelineBatchContract (Fast Lane — GC-021)

**Scope:**

New contract `WatchdogEscalationPipelineBatchContract` that aggregates
`WatchdogEscalationPipelineResult[]` → `WatchdogEscalationPipelineBatch`.

Output fields:
- `batchId`, `createdAt`, `totalResults`, `results`
- `dominantAction` = severity-first across all results (`ESCALATE > MONITOR > CLEAR`)
- `escalationActiveCount` = count of results where `escalationActive === true`
- `batchHash` deterministic from total + dominant + escalationActiveCount + createdAt

**Files:**
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/watchdog.escalation.pipeline.batch.contract.ts` (new)
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/index.ts` (barrel export update)
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/watchdog.escalation.pipeline.batch.test.ts` (new, ~8 tests)
- `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` (new batch partition entry)

**Governance artifacts:**
- `docs/audits/CVF_W3_T5_CP2_WATCHDOG_ESCALATION_PIPELINE_BATCH_AUDIT_2026-03-24.md`
- `docs/reviews/CVF_GC021_W3_T5_CP2_WATCHDOG_ESCALATION_PIPELINE_BATCH_REVIEW_2026-03-24.md`
- `docs/baselines/CVF_W3_T5_CP2_WATCHDOG_ESCALATION_PIPELINE_BATCH_DELTA_2026-03-24.md`

---

### CP3 — Tranche Closure Review (Full Lane)

**Scope:**
- Verify all CP1 + CP2 artifacts committed
- Confirm GEF tests pass with 0 failures
- Close W3-T5 and update progress tracker

**Governance artifacts:**
- `docs/reviews/CVF_W3_T5_TRANCHE_CLOSURE_REVIEW_2026-03-24.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W3_T5_CLOSURE_2026-03-24.md`

---

## Deferred Scope

- No changes to `WatchdogPulseContract`, `WatchdogAlertLogContract`,
  `WatchdogEscalationContract`, or `WatchdogEscalationLogContract` internals
- Multi-pulse pipeline (multiple obs/exec inputs per pipeline run) deferred to future tranche
- Cross-plane governance escalation integration deferred
