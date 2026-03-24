# CVF W3-T6 Execution Plan — Governance Consensus Consumer Bridge

Memory class: SUMMARY_RECORD

> Tranche: W3-T6 — Governance Consensus Consumer Bridge
> Date: 2026-03-24
> Authorization: GC-018 GRANTED (10/10)

---

## Objective

Deliver a cross-plane consumer bridge in GEF that chains
`GovernanceConsensusContract` (W3-T4) through
`ControlPlaneConsumerPipelineContract` (CPF W1-T13) to expose a deterministic,
governed `ControlPlaneConsumerPackage` from `GovernanceAuditSignal[]` inputs.

---

## Control Points

| CP | Contract | Lane | Target tests |
|---|---|---|---|
| CP1 | `GovernanceConsensusConsumerPipelineContract` | Full Lane | ~17 |
| CP2 | `GovernanceConsensusConsumerPipelineBatchContract` | Fast Lane (GC-021) | ~10 |
| CP3 | Tranche closure review | — | — |

---

## CP1 — Full Lane

### Contract: `GovernanceConsensusConsumerPipelineContract`

**File:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/governance.consensus.consumer.pipeline.contract.ts`

**Internal chain:**
```
GovernanceAuditSignal[]
  → GovernanceConsensusContract.decide(signals)  → ConsensusDecision
  → ControlPlaneConsumerPipelineContract.execute(...)  → ControlPlaneConsumerPackage
```

**Query derivation:**
```
"${verdict} consensus — score: ${consensusScore}, critical: ${criticalCount}/${totalSignals}"
  .slice(0, 120)
```

**ContextId:** `consensusDecision.decisionId`

**Warnings:**
- `ESCALATE` → `[consensus] escalation verdict — governance review required`
- `PAUSE` → `[consensus] pause verdict — audit recommended`
- `PROCEED` → no warnings

**Determinism:** `now` injected; propagated to `GovernanceConsensusContract` and `ControlPlaneConsumerPipelineContract`

**Hash key:** `"w3-t6-cp1-consensus-consumer-pipeline"`

**Artifacts:** audit, review, delta, exec plan update, test log update, commit

---

## CP2 — Fast Lane (GC-021)

### Contract: `GovernanceConsensusConsumerPipelineBatchContract`

**File:** `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/governance.consensus.consumer.pipeline.batch.contract.ts`

**Pattern:**
- `dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
- empty batch → `dominantTokenBudget = 0`, valid hash
- `batchId ≠ batchHash`
- `escalationCount` = results with `ESCALATE` verdict
- `pauseCount` = results with `PAUSE` verdict

**GC-021 eligibility:** additive only, no restructuring, inside authorized tranche, no new module, no boundary change

**Artifacts:** Fast Lane audit, review, delta, exec plan update, test log update, commit

---

## CP3 — Closure

**Artifacts:** closure review, GC-026 closure sync, progress tracker update, AGENT_HANDOFF update, commit

---

## Test Governance (GC-023 / GC-024)

- New dedicated test files (not appended to `tests/index.test.ts`)
- GEF `tests/index.test.ts` pre-flight: check line count before any modification
- 2 new partition entries in `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`

---

## CP Status

| CP | Status |
|---|---|
| CP1 | DELIVERED — 18 tests (GEF 226 total) |
| CP2 | DELIVERED — 10 tests (GEF 236 total) |
| CP3 | DELIVERED — closure committed |
