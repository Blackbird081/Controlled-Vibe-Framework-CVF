# CVF Agent Handoff — 2026-03-25

> Branch: `cvf-next`
> Last push: `W2-T23-CP3 → cvf-next`
> State: **NO ACTIVE TRANCHE** — last canonical closure W2-T23

---

## Current State

### Test Counts (last verified clean)
- CPF (Control Plane Foundation): **856 tests, 0 failures**
- EPF (Execution Plane Foundation): **870 tests, 0 failures**
- GEF (Governance Expansion Foundation): **557 tests, 0 failures**

### Last Three Tranches Closed
| Tranche | Description | Commits | Tests |
|---------|-------------|---------|-------|
| W2-T21 | Async Execution Status Consumer Bridge | CP1, CP2, CP3 | 807 EPF |
| W2-T22 | Execution Pipeline Consumer Bridge | CP1, CP2, CP3 | 838 EPF |
| W2-T23 | PolicyGate Consumer Pipeline Bridge | CP1, CP2, CP3 | 870 EPF |

### Key Contracts Delivered (last 3 tranches)
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/policy.gate.consumer.pipeline.contract.ts` — PolicyGateConsumerPipelineContract (W2-T23)
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/policy.gate.consumer.pipeline.batch.contract.ts` — PolicyGateConsumerPipelineBatchContract (W2-T23)
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.pipeline.consumer.pipeline.contract.ts` — ExecutionPipelineConsumerPipelineContract (W2-T22)
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.pipeline.consumer.pipeline.batch.contract.ts` — ExecutionPipelineConsumerPipelineBatchContract (W2-T22)
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.async.status.consumer.pipeline.contract.ts` — AsyncExecutionStatusConsumerPipelineContract (W2-T21)
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.async.status.consumer.pipeline.batch.contract.ts` — AsyncExecutionStatusConsumerPipelineBatchContract (W2-T21)

---

## Immediate Next Action Required

**Must issue a fresh GC-018 before any implementation work.**

Current guidance:
- no tranche is currently active
- `W2-T23` is now closed and no longer a candidate
- next move should favor the highest-value capability gap under `GC-018` stop-boundary rules

**Remaining EPF unbridged contracts (surveyed 2026-03-25, post W2-T23):**
- `FeedbackRoutingContract.route(ExecutionFeedbackSignal) → FeedbackRoutingDecision` — routes feedback signals by class (ACCEPT/RETRY/ESCALATE/REJECT) and priority (critical/high/medium/low); no consumer bridge exists — nominated as W2-T24

**W2-T24 recommended**: `FeedbackRoutingDecision` consumer bridge
- Input: single `ExecutionFeedbackSignal` → `FeedbackRoutingContract.route()` → `FeedbackRoutingDecision`
- Query: `` `[feedback-routing] action:${routingAction} priority:${routingPriority}`.slice(0, 120) ``
- contextId: `routingDecision.decisionId`
- Warnings: `routingAction === "REJECT"` → "[feedback] rejection decision — immediate intervention required"; `routingAction === "ESCALATE"` → "[feedback] escalation decision — human review required"
- Batch fields: `rejectedResultCount` (routingDecision.routingAction === "REJECT"), `escalatedResultCount` (routingDecision.routingAction === "ESCALATE")

Any future tranche still requires: `GC-018 authorization → execution plan → CP1 Full Lane → CP2 Fast Lane → CP3 Closure`

---

## Governance Rules (must follow strictly)

### Tranche Protocol
1. **GC-018** (10/10 audit score) → commits roadmap + tracker + GC-026 sync + execution plan
2. **Per CP**: Full Lane = new concept/module/cross-plane; Fast Lane (GC-021) = additive batch/summary
3. **Per CP artifacts**: audit doc + review doc + delta doc + exec plan update + test log update + commit
4. **No implementation without GC-018 authorization**
5. **No push to main** — work on `cvf-next` only

### Fast Lane (GC-021) — eligible when:
- additive only, no restructuring
- inside already-authorized tranche
- no new module creation, no ownership transfer, no boundary change

### Memory Governance (GC-022)
- `docs/audits/`, `docs/reviews/` → `Memory class: FULL_RECORD`
- `docs/baselines/`, `docs/roadmaps/` → `Memory class: SUMMARY_RECORD`
- `docs/reference/`, `docs/INDEX.md` → `Memory class: POINTER_RECORD`

### Test Governance (GC-024)
- Each new contract gets a **dedicated test file** (not added to `tests/index.test.ts`)
- Add partition entry to `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`

### Determinism Pattern (all contracts must follow)
- inject `now?: () => string` in `ContractDependencies`
- default: `() => new Date().toISOString()`
- propagate to all sub-contracts via `now: this.now`
- hash IDs with `computeDeterministicHash()` from `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
- **Critical**: when inner contracts create their own sub-contracts (e.g. `ExecutionPipelineContract` creates `CommandRuntimeContract` internally), thread `now` explicitly into `commandRuntimeDependencies.now` from the consumer bridge constructor

### Batch Contract Pattern
- `dominantTokenBudget` = `Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
- empty batch → `dominantTokenBudget = 0`, valid hash
- `batchId` ≠ `batchHash` (batchId = hash of batchHash only)

### WatchdogObservabilityInput / WatchdogExecutionInput (correct field names)
- `WatchdogObservabilityInput`: `snapshotId`, `dominantHealth` ("HEALTHY"|"DEGRADED"|"CRITICAL"|"UNKNOWN"), `criticalCount`, `degradedCount`
- `WatchdogExecutionInput`: `summaryId`, `dominantStatus` ("PENDING"|"RUNNING"|"COMPLETED"|"FAILED"), `failedCount`, `runningCount`
- CRITICAL triggers when: `dominantHealth === "CRITICAL"` OR `dominantStatus === "FAILED"`

---

## Key File Paths

| Purpose | Path |
|---------|------|
| Progress tracker | `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` |
| Completion roadmap | `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` |
| Test log | `docs/CVF_INCREMENTAL_TEST_LOG.md` |
| Test partition registry | `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` |
| CPF barrel exports | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` |
| EPF barrel exports | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts` |
| GEF barrel exports | `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/index.ts` |
| Deterministic hash util | `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash.ts` |
| Fast lane audit template | `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md` |
| Fast lane review template | `docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md` |
| GC-026 tracker sync template | `docs/reference/CVF_GC026_PROGRESS_TRACKER_SYNC_TEMPLATE.md` |

---

## Doc Naming Conventions

- GC-018 auth: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W{W}_T{T}_{SLUG}_{DATE}.md`
- GC-026 auth sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W{W}_T{T}_AUTHORIZATION_{DATE}.md`
- GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W{W}_T{T}_CLOSURE_{DATE}.md`
- Execution plan: `docs/roadmaps/CVF_W{W}_T{T}_{SLUG}_EXECUTION_PLAN_{DATE}.md`
- Full Lane audit: `docs/audits/CVF_W{W}_T{T}_CP{N}_{SLUG}_AUDIT_{DATE}.md`
- Full Lane review: `docs/reviews/CVF_GC019_W{W}_T{T}_CP{N}_{SLUG}_REVIEW_{DATE}.md`
- Fast Lane audit: `docs/audits/CVF_W{W}_T{T}_CP{N}_{SLUG}_AUDIT_{DATE}.md`
- Fast Lane review: `docs/reviews/CVF_GC021_W{W}_T{T}_CP{N}_{SLUG}_REVIEW_{DATE}.md`
- Delta: `docs/baselines/CVF_W{W}_T{T}_CP{N}_{SLUG}_DELTA_{DATE}.md`
- Closure review: `docs/reviews/CVF_W{W}_T{T}_TRANCHE_CLOSURE_REVIEW_{DATE}.md`

---

## Test Commands

```bash
# CPF tests
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm test

# EPF tests
cd EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION && npm test

# GEF tests
cd EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION && npm test
```

---

## Commit Format

```
<type>(W{W}-T{T}/CP{N}): <short description> — <Lane>

Tranche: W{W}-T{T} — <Tranche Name>
Control point: CP{N} — <ContractName>
Lane: Full Lane | Fast Lane (GC-021)

Contract: <what it does>
Tests: <N> new (<total> <module> total, 0 failures)
Governance artifacts: <list of docs>
```
