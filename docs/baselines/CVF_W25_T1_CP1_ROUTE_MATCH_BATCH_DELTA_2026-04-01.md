# CVF W25-T1 CP1 Delta — RouteMatchBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-01
> Tranche: W25-T1 — RouteMatchBatchContract (REALIZATION class)
> Checkpoint: CP1 Full Lane

---

## Files Added

| File | Type | Description |
|---|---|---|
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/route.match.batch.contract.ts` | Source | RouteMatchBatchContract implementation |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/route.match.batch.contract.test.ts` | Tests | 27 tests, 27 pass |

## Files Modified

| File | Change |
|---|---|
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` | W25-T1 barrel exports added |

---

## CPF Test Delta

| Metric | Before | After | Delta |
|---|---|---|---|
| Total tests | 2413 | 2440 | +27 |
| Failures | 0 | 0 | 0 |

---

## Key Implementation Values

| Key | Value |
|---|---|
| Batch hash salt | `"w25-t1-cp1-route-match-batch"` |
| Batch ID salt | `"w25-t1-cp1-route-match-batch-id"` |
| Dominant precedence | `REJECT > REROUTE > FORWARD > PASSTHROUGH` |
| Empty batch sentinel | `NONE` |
| Fixed test timestamp | `"2026-04-01T00:00:00.000Z"` |
