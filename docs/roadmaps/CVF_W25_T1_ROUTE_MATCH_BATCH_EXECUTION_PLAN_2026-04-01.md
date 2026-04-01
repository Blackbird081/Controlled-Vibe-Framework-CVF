# CVF W25-T1 Execution Plan — RouteMatchBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-01
> Tranche: W25-T1 — RouteMatchBatchContract (REALIZATION class)
> Lane: CP1 Full Lane
> Authorization anchor: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W25_T1_ROUTE_MATCH_BATCH_2026-04-01.md`

---

## Objective

Implement `RouteMatchBatchContract` batching `RouteMatchContract.match(request, routes)` across a list of `GatewayProcessedRequest` items against a shared `RouteDefinition[]`, closing the W1-T7 `RouteMatchContract.match()` batch surface.

---

## Execution Steps

### CP1 — Full Lane Implementation

1. Create `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/route.match.batch.contract.ts`
   - Define `DominantGatewayAction = GatewayAction | "NONE"`
   - Define `RouteMatchBatch` type with all required fields
   - Implement `resolveDominantGatewayAction()` helper: highest count wins; ties broken by `REJECT > REROUTE > FORWARD > PASSTHROUGH`; returns `"NONE"` for empty batch
   - Implement `RouteMatchBatchContract.batch(requests, routes, contract)` method
   - Implement `createRouteMatchBatchContract()` factory

2. Create `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/route.match.batch.contract.test.ts`
   - ~27 tests covering: empty batch, count accuracy per action, matched/unmatched counts, dominant resolution (4 types + 3 tie-break pairs + empty NONE), determinism, output shape, factory

3. Add W25-T1 barrel exports to `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`

4. Run CPF test suite — verify 0 failures

5. Create CP1 governance artifacts:
   - `docs/audits/CVF_W25_T1_CP1_ROUTE_MATCH_BATCH_AUDIT_2026-04-01.md`
   - `docs/reviews/CVF_GC019_W25_T1_CP1_ROUTE_MATCH_BATCH_REVIEW_2026-04-01.md`
   - `docs/baselines/CVF_W25_T1_CP1_ROUTE_MATCH_BATCH_DELTA_2026-04-01.md`
   - `docs/baselines/CVF_GC026_TRACKER_SYNC_W25_T1_CP1_DONE_2026-04-01.md`

6. Update tracker + AGENT_HANDOFF, commit, push

### CP2 — Tranche Closure

7. Create `docs/reviews/CVF_W25_T1_TRANCHE_CLOSURE_REVIEW_2026-04-01.md`
8. Create `docs/baselines/CVF_GC026_TRACKER_SYNC_W25_T1_CLOSED_2026-04-01.md`
9. Update tracker + AGENT_HANDOFF, commit, push

---

## Pass Conditions

| # | Condition |
|---|---|
| 1 | `RouteMatchBatchContract` class exported from barrel |
| 2 | `batch()` calls `contract.match(request, routes)` on each request |
| 3 | forwardCount, rejectCount, rerouteCount, passthroughCount, matchedCount, unmatchedCount accurate |
| 4 | dominantGatewayAction REJECT > REROUTE > FORWARD > PASSTHROUGH; NONE on empty batch |
| 5 | batchHash/batchId distinct, deterministic, W25-T1 domain salts |
| 6 | ~27 tests, 0 failures |
| 7 | No regressions in full CPF suite |

---

## Key Implementation Values

| Key | Value |
|---|---|
| Batch hash salt | `"w25-t1-cp1-route-match-batch"` |
| Batch ID salt | `"w25-t1-cp1-route-match-batch-id"` |
| Dominant precedence | `REJECT > REROUTE > FORWARD > PASSTHROUGH` |
| Empty batch sentinel | `"NONE"` |
| Fixed test timestamp | `"2026-04-01T00:00:00.000Z"` |
