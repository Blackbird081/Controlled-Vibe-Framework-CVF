# CVF W1-T17 Execution Plan — Reverse Prompting Consumer Bridge

Memory class: SUMMARY_RECORD
> Tranche: W1-T17 — Reverse Prompting Consumer Bridge
> Date: 2026-03-24
> Authorization: GC-018 GRANTED (10/10)

---

## Objective

Deliver a CPF-internal consumer bridge that chains
`ReversePromptingContract` (W1-T5) through
`ControlPlaneConsumerPipelineContract` (CPF W1-T13) to expose a deterministic,
governed `ControlPlaneConsumerPackage` from `ControlPlaneIntakeResult` input.

---

## Control Points

| CP | Contract | Lane | Target tests |
|---|---|---|---|
| CP1 | `ReversePromptingConsumerPipelineContract` | Full Lane | ~18 |
| CP2 | `ReversePromptingConsumerPipelineBatchContract` | Fast Lane (GC-021) | ~10 |
| CP3 | Tranche closure review | — | — |

---

## CP1 — Full Lane

### Contract: `ReversePromptingConsumerPipelineContract`

**File:** `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/reverse.prompting.consumer.pipeline.contract.ts`

**Internal chain:**
```
ControlPlaneIntakeResult
  → ReversePromptingContract.generate(intakeResult)  → ReversePromptPacket
  → ControlPlaneConsumerPipelineContract.execute(...)  → ControlPlaneConsumerPackage
```

**Query derivation:**
```
`reverse-prompting: ${packet.totalQuestions} question(s), ${packet.highPriorityCount} high-priority — domain: ${packet.signalAnalysis.domainDetected}`.slice(0, 120)
```

**ContextId:** `packet.packetId`

**Warnings:**
- `highPriorityCount > 0` → `[reverse-prompting] high-priority clarification questions require response`
- `highPriorityCount === 0` → no warnings

**Determinism:** `now` injected; propagated to both sub-contracts

**Hash key:** `"w1-t17-cp1-reverse-prompting-consumer-pipeline"`

**Artifacts:** audit, review, delta, exec plan update, test log update, commit

---

## CP2 — Fast Lane (GC-021)

### Contract: `ReversePromptingConsumerPipelineBatchContract`

**File:** `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/reverse.prompting.consumer.pipeline.batch.contract.ts`

**Pattern:**
- `dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
- empty batch → `dominantTokenBudget = 0`, valid hash
- `batchId ≠ batchHash`
- `highPriorityResultCount` = results where `reversePromptPacket.highPriorityCount > 0`
- `totalQuestionsCount` = sum of `reversePromptPacket.totalQuestions` across all results

**GC-021 eligibility:** additive only, no restructuring, inside authorized tranche

**Artifacts:** Fast Lane audit, review, delta, exec plan update, test log update, commit

---

## CP3 — Closure

**Artifacts:** closure review, GC-026 closure sync, progress tracker update, AGENT_HANDOFF update, commit

---

## CP Status

| CP | Status |
|---|---|
| CP1 | PENDING |
| CP2 | PENDING |
| CP3 | PENDING |
