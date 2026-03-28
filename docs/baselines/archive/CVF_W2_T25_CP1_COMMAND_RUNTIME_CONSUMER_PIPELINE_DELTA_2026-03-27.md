# CVF W2-T25 CP1 Command Runtime Consumer Pipeline — Delta

Memory class: SUMMARY_RECORD
> Date: 2026-03-27
> Tranche: W2-T25 — Command Runtime Consumer Pipeline Bridge
> Control Point: CP1 — CommandRuntimeConsumerPipelineContract
> Lane: Full Lane (GC-019)

---

## Delta Summary

**Baseline**: EPF 902 tests, 0 failures
**Target**: EPF 941 tests, 0 failures
**Actual**: EPF 941 tests, 0 failures ✅

**Test Delta**: +39 tests
**Failure Delta**: 0 failures

---

## Files Added

1. `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/command.runtime.consumer.pipeline.contract.ts` (164 lines)
2. `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/command.runtime.consumer.pipeline.test.ts` (318 lines)
3. `docs/audits/CVF_W2_T25_CP1_COMMAND_RUNTIME_CONSUMER_PIPELINE_AUDIT_2026-03-27.md`
4. `docs/reviews/CVF_GC019_W2_T25_CP1_COMMAND_RUNTIME_CONSUMER_PIPELINE_REVIEW_2026-03-27.md`
5. `docs/baselines/CVF_W2_T25_CP1_COMMAND_RUNTIME_CONSUMER_PIPELINE_DELTA_2026-03-27.md`

---

## Files Modified

1. `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts` — added exports:
   - `CommandRuntimeConsumerPipelineContract`
   - `createCommandRuntimeConsumerPipelineContract`
   - `CommandRuntimeConsumerPipelineRequest`
   - `CommandRuntimeConsumerPipelineResult`
   - `CommandRuntimeConsumerPipelineContractDependencies`

2. `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` — added partition:
   - Scope: "EPF CommandRuntime Consumer Pipeline (W2-T25 CP1)"
   - Canonical file: `tests/command.runtime.consumer.pipeline.test.ts`

---

## Contract Signature

```typescript
Input: CommandRuntimeConsumerPipelineRequest {
  policyGateResult: PolicyGateResult;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

Output: CommandRuntimeConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  runtimeResult: CommandRuntimeResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}
```

---

## Test Breakdown

| Category | Count |
|----------|-------|
| Instantiation | 3 |
| Output shape | 7 |
| consumerId propagation | 3 |
| Deterministic hashing | 4 |
| Query derivation | 3 |
| Warning messages | 5 |
| runtimeResult propagation | 7 |
| consumerPackage shape | 4 |
| Mixed gate decisions | 3 |
| **Total** | **39** |

---

## Architecture Impact

- First EPF core runtime consumer bridge delivered
- `CommandRuntimeContract` now consumer-visible via CPF pipeline
- Query derivation: `runtimeResult.summary.slice(0, 120)`
- contextId: `runtimeResult.runtimeId`
- Warnings: `failedCount > 0` → `WARNING_FAILED`, `sandboxedCount > 0` → `WARNING_SANDBOXED`

---

## Governance Artifacts

- Audit: `docs/audits/CVF_W2_T25_CP1_COMMAND_RUNTIME_CONSUMER_PIPELINE_AUDIT_2026-03-27.md` (APPROVED)
- Review: `docs/reviews/CVF_GC019_W2_T25_CP1_COMMAND_RUNTIME_CONSUMER_PIPELINE_REVIEW_2026-03-27.md` (APPROVED)
- Delta: `docs/baselines/CVF_W2_T25_CP1_COMMAND_RUNTIME_CONSUMER_PIPELINE_DELTA_2026-03-27.md` (this file)

---

## Status

**CP1**: ✅ COMPLETE — ready for commit
**Next**: CP2 — CommandRuntimeConsumerPipelineBatchContract (Fast Lane GC-021)

---

**Delta recorded**: 2026-03-27
