# CVF W10-T1 Execution Plan — Reputation Signal and Task Marketplace Learning Expansion

Memory class: SUMMARY_RECORD

> Tranche: W10-T1
> Candidate: W10-T1-CANDIDATE-D (P5 Candidate D)
> Authorization: GC-018 AUTHORIZED 2026-03-29 — depth audit 7/10 CONTINUE
> Branch: `cvf-next`
> Date: 2026-03-29

---

## 1. Tranche Summary

Deliver two new LPF surfaces that complete the P5 learning-plane expansion:

- **ReputationSignalContract** — composites TruthScore + FeedbackLedger + EvaluationResult + GovernanceSignal into a single governed reputation score (0–100) with a four-class label.
- **TaskMarketplaceContract** — routes task allocation decisions based on reputation class and agent capacity, producing a deterministic TaskAllocationRecord.

All four upstream contracts (TruthScore, FeedbackLedger, EvaluationEngine, GovernanceSignal) are FIXED INPUT. No LPF restructuring. W7 chain impact is READ_ONLY / ADDITIVE only.

---

## 2. Control Points

| CP | Deliverable | Lane | Status |
|---|---|---|---|
| `CP1` | ReputationSignalContract — core + tests + audit + review + delta | Full Lane (GC-019) | PENDING |
| `CP2` | TaskMarketplaceContract — core + tests + audit + review + delta | Full Lane (GC-019) | PENDING |
| `CP3` | ReputationSignal batch + TaskMarketplace batch contracts + tests | Fast Lane (GC-021) | PENDING |
| `CP4` | Tranche Closure Review + GC-026 closed sync + tracker/handoff update | Closure | PENDING |

---

## 3. CP1 — ReputationSignalContract (Full Lane)

### Scope

New LPF surface. Composites four existing LPF outputs (FIXED INPUT) into a governed reputation signal.

### Deliverables

- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/reputation.signal.contract.ts`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/reputation.signal.contract.test.ts` (dedicated, GC-023)
- `docs/audits/CVF_W10_T1_CP1_REPUTATION_SIGNAL_AUDIT_2026-03-29.md` (FULL_RECORD)
- `docs/reviews/CVF_W10_T1_CP1_REPUTATION_SIGNAL_REVIEW_2026-03-29.md` (FULL_RECORD)
- `docs/baselines/CVF_W10_T1_CP1_REPUTATION_SIGNAL_DELTA_2026-03-29.md` (SUMMARY_RECORD)
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W10_T1_CP1_DONE_2026-03-29.md` (SUMMARY_RECORD)
- LPF `index.ts` barrel export update
- `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry
- `docs/CVF_INCREMENTAL_TEST_LOG.md` append

### Interface Design

- Input: `ReputationSignalInput { agentId, truthScore: TruthScore, feedbackLedger: FeedbackLedger, evaluationResult: EvaluationResult, governanceSignal: GovernanceSignal }`
- Output: `ReputationSignal { signalId, computedAt, agentId, compositeReputationScore (0–100), reputationClass (TRUSTED/RELIABLE/PROVISIONAL/UNTRUSTED), dimensions, rationale, reputationHash }`

### Scoring Model

| Dimension | Input | Max | Rule |
|---|---|---|---|
| `truthContribution` | TruthScore.compositeScore (0–100) | 40 | `round(compositeScore × 0.40)` |
| `feedbackContribution` | FeedbackLedger: acceptCount / totalRecords | 35 | `totalRecords=0 → 0; else round((acceptCount/totalRecords) × 35)` |
| `evaluationContribution` | EvaluationResult.verdict | 15 | PASS→15, WARN→8, INCONCLUSIVE→5, FAIL→0 |
| `governanceContribution` | GovernanceSignal.signalType | 10 | NO_ACTION→10, MONITOR→7, TRIGGER_REVIEW→3, ESCALATE→0 |

Class thresholds: TRUSTED ≥ 80 · RELIABLE ≥ 55 · PROVISIONAL ≥ 30 · UNTRUSTED < 30

---

## 4. CP2 — TaskMarketplaceContract (Full Lane)

### Scope

New LPF surface. Routes task allocation decisions based on ReputationSignal output (FIXED INPUT from CP1) and declared agent capacity.

### Deliverables

- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/task.marketplace.contract.ts`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/task.marketplace.contract.test.ts` (dedicated, GC-023)
- `docs/audits/CVF_W10_T1_CP2_TASK_MARKETPLACE_AUDIT_2026-03-29.md` (FULL_RECORD)
- `docs/reviews/CVF_W10_T1_CP2_TASK_MARKETPLACE_REVIEW_2026-03-29.md` (FULL_RECORD)
- `docs/baselines/CVF_W10_T1_CP2_TASK_MARKETPLACE_DELTA_2026-03-29.md` (SUMMARY_RECORD)
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W10_T1_CP2_DONE_2026-03-29.md` (SUMMARY_RECORD)
- LPF `index.ts` barrel export update
- `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry
- `docs/CVF_INCREMENTAL_TEST_LOG.md` append

### Interface Design

- Input: `TaskAllocationRequest { requestId, agentId, reputationSignal: ReputationSignal, taskPriority: TaskPriority, declaredCapacity: number (0–1) }`
- Output: `TaskAllocationRecord { recordId, allocatedAt, requestId, agentId, allocationDecision (ASSIGN/DEFER/REJECT), assignedPriorityCeiling, rationale, allocationHash }`

### Allocation Rules

| Reputation class | Capacity | Decision |
|---|---|---|
| TRUSTED | any | ASSIGN |
| RELIABLE | ≥ 0.3 | ASSIGN |
| RELIABLE | < 0.3 | DEFER |
| PROVISIONAL | ≥ 0.5 | DEFER |
| PROVISIONAL | < 0.5 | REJECT |
| UNTRUSTED | any | REJECT |

Priority ceiling: TRUSTED→critical · RELIABLE→high · PROVISIONAL→medium · UNTRUSTED→none

---

## 5. CP3 — Batch Contracts (Fast Lane)

### Scope

Batch aggregation wrappers for CP1 and CP2 outputs. Low-risk, no new governance authority.

### Deliverables

- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/reputation.signal.batch.contract.ts`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/reputation.signal.batch.contract.test.ts`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/task.marketplace.batch.contract.ts`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/task.marketplace.batch.contract.test.ts`
- Fast Lane audit + review docs
- LPF `index.ts` barrel export updates
- Test partition registry entries
- Test log append
- GC-026 CP3 sync

---

## 6. CP4 — Tranche Closure

### Scope

Final governance closure artifacts.

### Deliverables

- `docs/reviews/CVF_W10_T1_TRANCHE_CLOSURE_REVIEW_2026-03-29.md` (FULL_RECORD)
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W10_T1_CLOSED_DELIVERED_2026-03-29.md` (SUMMARY_RECORD)
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` updated to CLOSED DELIVERED
- `AGENT_HANDOFF.md` updated

### Pass Conditions

1. ReputationSignalContract produces deterministic reputationHash for identical inputs
2. TaskMarketplaceContract routing rules are deterministically enforced across all four reputation classes
3. All new contracts have dedicated test files (GC-023)
4. LPF barrel export complete — no broken imports
5. Test partition registry updated for all new test files
6. Incremental test log updated at each CP
7. GC-026 sync note present for each posture-changing commit
