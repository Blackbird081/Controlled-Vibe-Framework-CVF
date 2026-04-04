# CVF W10-T1 CP1 Delta — Reputation Signal Contract

Memory class: SUMMARY_RECORD

> Tranche: W10-T1 CP1
> Date: 2026-03-29
> Lane: Full Lane (GC-019)

---

## Files Added

- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/reputation.signal.contract.ts` — NEW LPF surface
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/reputation.signal.contract.test.ts` — 43 tests

## Files Modified

- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/index.ts` — W10-T1 CP1 barrel exports added
- `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` — LPF Reputation Signal (W10-T1 CP1) entry added
- `docs/CVF_INCREMENTAL_TEST_LOG.md` — CP1 batch appended
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` — W10-T1 row updated to CP1 DONE
- `AGENT_HANDOFF.md` — W10-T1 CP1 DONE state
- `docs/roadmaps/CVF_W10_T1_REPUTATION_TASK_MARKETPLACE_EXECUTION_PLAN_2026-03-29.md` — CP1 status DONE

## Test Delta

- LPF: 1333 → 1376 tests (+43, 0 failures)
- New dedicated file: `tests/reputation.signal.contract.test.ts`

## New Surfaces

- `ReputationSignalContract` (W10-T1 CP1) — IN_SCOPE (new LPF surface)
- All four upstream types (TruthScore, FeedbackLedger, EvaluationResult, GovernanceSignal) — FIXED_INPUT

## Scoring Model

| Dimension | Source | Weight | Range |
|---|---|---|---|
| truthContribution | TruthScore.compositeScore × 0.40 | 40% | 0–40 |
| feedbackContribution | acceptCount/totalRecords × 35 | 35% | 0–35 |
| evaluationContribution | verdict (PASS→15, WARN→8, INCONCLUSIVE→5, FAIL→0) | 15% | 0–15 |
| governanceContribution | signalType (NO_ACTION→10, MONITOR→7, TRIGGER_REVIEW→3, ESCALATE→0) | 10% | 0–10 |

Class thresholds: TRUSTED ≥ 80 · RELIABLE ≥ 55 · PROVISIONAL ≥ 30 · UNTRUSTED < 30
