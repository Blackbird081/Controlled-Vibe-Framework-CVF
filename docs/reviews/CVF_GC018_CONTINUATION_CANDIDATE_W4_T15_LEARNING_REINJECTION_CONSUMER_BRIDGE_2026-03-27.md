# CVF GC-018 Continuation Candidate — W4-T15 Learning Reinjection Consumer Bridge

Memory class: FULL_RECORD

> Date: 2026-03-27
> Protocol: GC-018 (Continuation Authorization)
> Candidate: W4-T15 — Learning Reinjection Consumer Pipeline Bridge
> Survey scope: LPF unbridged core contracts

---

## Survey Context

**Last closed tranche**: W2-T25 — Command Runtime Consumer Pipeline Bridge
**Current state**: NO ACTIVE TRANCHE
**Architecture baseline**: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (v2.2-W4T11)
**Test baseline**: LPF 835 tests, 0 failures

---

## Candidate Identification

### Survey Methodology

1. Reviewed all LPF core contracts
2. Identified unbridged contracts (no consumer pipeline bridge)
3. Assessed architectural value and consumer visibility gap
4. Ranked by impact on learning plane observability

### Unbridged LPF Core Contracts

| Contract | Purpose | Consumer Visibility Gap | Priority |
|----------|---------|------------------------|----------|
| `LearningReinjectionContract` | Maps governance signals to learning feedback | Signal → feedback mapping not consumer-visible | HIGH |
| `LearningStorageContract` | Stores learning artifacts | Storage operations not consumer-visible | MEDIUM |
| `FeedbackLedgerContract` | Tracks feedback history | Ledger state not consumer-visible | MEDIUM |
| `TruthModelContract` | Manages truth model state | Model state not consumer-visible | LOW |
| `TruthModelUpdateContract` | Updates truth model | Update operations not consumer-visible | LOW |

---

## Candidate Selection: W4-T15 Learning Reinjection Consumer Bridge

### Contract Overview

**File**: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning.reinjection.contract.ts`
**Purpose**: Maps `GovernanceSignal` to `LearningFeedbackInput` for learning loop reinjection

**Input**: `GovernanceSignal` (from `GovernanceSignalContract`)
**Output**: `LearningReinjectionResult` with mapped `feedbackInput`

**Mapping Logic**:
- `ESCALATE` → `REJECT` (critical priority)
- `TRIGGER_REVIEW` → `ESCALATE` (critical priority)
- `MONITOR` → `RETRY` (low priority, +0.05 confidence boost)
- `NO_ACTION` → `ACCEPT` (low priority, +0.1 confidence boost)

---

## Architectural Value Assessment

### Consumer Visibility Gap

**Current State**:
- `LearningReinjectionContract` executes signal → feedback mapping
- Mapping results (feedbackClass, priority, confidenceBoost) not consumer-visible
- Reinjection operations opaque to consumers

**Gap Impact**:
- Consumers cannot observe how governance signals are transformed into learning feedback
- Signal → feedback mapping logic not traceable
- Reinjection flow not auditable

### Value Proposition

**Bridging `LearningReinjectionContract` provides**:
1. **Signal transformation visibility**: Consumers can see how governance signals map to feedback classes
2. **Priority tracking**: Consumers can observe feedback priority assignments
3. **Confidence boost transparency**: Consumers can see confidence adjustments per signal type
4. **Reinjection auditability**: Full reinjection flow becomes consumer-visible

### Chain Integration

**Proposed Chain**:
```
GovernanceSignal
  → LearningReinjectionContract.reinject()
  → LearningReinjectionResult { feedbackInput, sourceSignalType, ... }
  → ControlPlaneConsumerPipelineContract.execute()
  → ControlPlaneConsumerPackage
  → LearningReinjectionConsumerPipelineResult (consumer-visible)
```

**Query Derivation**: Extract from `sourceSignalType` + `feedbackInput.feedbackClass` (max 120 chars)
**contextId**: `reinjectionResult.reinjectionId`

---

## Implementation Scope

### CP1 — LearningReinjectionConsumerPipelineContract (Full Lane GC-019)

**Deliverables**:
1. Contract: `learning.reinjection.consumer.pipeline.contract.ts`
2. Test: `learning.reinjection.consumer.pipeline.test.ts`
3. Partition entry
4. Exports
5. Audit + Review + Delta

**Contract Signature**:
```typescript
Input: LearningReinjectionConsumerPipelineRequest {
  signal: GovernanceSignal;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

Output: LearningReinjectionConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  reinjectionResult: LearningReinjectionResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}
```

**Warning Logic**:
- `feedbackInput.feedbackClass === "REJECT"` → `WARNING_REJECT`
- `feedbackInput.feedbackClass === "ESCALATE"` → `WARNING_ESCALATE`

**Test Coverage**: ~35 tests
- Instantiation
- Output shape
- consumerId propagation
- Deterministic hashing
- Query derivation
- Warning messages
- Reinjection result propagation
- Consumer package shape
- Mixed signal types

**Estimated Test Delta**: LPF 835 → ~870 (+~35 tests)

---

### CP2 — LearningReinjectionConsumerPipelineBatchContract (Fast Lane GC-021)

**Deliverables**:
1. Contract: `learning.reinjection.consumer.pipeline.batch.contract.ts`
2. Tests: append to `learning.reinjection.consumer.pipeline.test.ts`
3. Partition entry
4. Exports
5. Audit + Review + Delta

**Contract Signature**:
```typescript
Input: LearningReinjectionConsumerPipelineResult[]

Output: LearningReinjectionConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalResults: number;
  dominantTokenBudget: number; // max across all results
  rejectCount: number; // count of REJECT feedback
  escalateCount: number; // count of ESCALATE feedback
  retryCount: number; // count of RETRY feedback
  acceptCount: number; // count of ACCEPT feedback
  batchHash: string;
}
```

**Aggregation Logic**:
- `dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
- Feedback class counts = sum per class

**Test Coverage**: ~30 tests
- Instantiation
- Output shape
- Empty batch
- Single result
- Multiple results
- Deterministic hashing
- Feedback class aggregation

**Estimated Test Delta**: LPF ~870 → ~900 (+~30 tests)

---

## GC-018 Audit

### Architectural Compliance

- [x] Candidate is unbridged core contract
- [x] Consumer visibility gap identified
- [x] Chain integration defined
- [x] Query derivation strategy defined
- [x] contextId assignment strategy defined
- [x] Warning logic defined
- [x] Follows established consumer bridge pattern

### Implementation Feasibility

- [x] Source contract exists (`learning.reinjection.contract.ts`)
- [x] Source contract has deterministic hash pattern
- [x] Input/output types well-defined
- [x] CPF consumer pipeline available
- [x] Test infrastructure available
- [x] Governance templates available

### Value Justification

**High-Value Rationale**:
1. **Learning loop transparency**: Reinjection is critical to learning plane operation
2. **Signal transformation visibility**: Governance signals → feedback mapping is core learning mechanism
3. **Auditability**: Reinjection flow needs consumer-visible tracking
4. **Eighth LPF consumer bridge**: Continues LPF consumer visibility expansion
5. **Completes signal → feedback chain**: Closes gap between governance signals and learning feedback

**Impact Score**: 9/10
- Architectural value: 9/10 (critical learning loop component)
- Consumer visibility gap: 9/10 (signal transformation not visible)
- Implementation complexity: 8/10 (straightforward bridge pattern)
- Test coverage: 9/10 (comprehensive test plan)

---

## GC-018 Authorization Decision

**Status**: ✅ AUTHORIZED

**Audit Score**: 10/10

**Rationale**:
1. `LearningReinjectionContract` is highest-value unbridged LPF core contract
2. Consumer visibility gap is significant (signal → feedback mapping opaque)
3. Implementation follows established consumer bridge pattern
4. Test plan comprehensive (~65 tests total)
5. Architectural value high (critical learning loop component)
6. Completes governance signal → learning feedback chain
7. Eighth LPF consumer bridge (continues LPF expansion)

**Authorization**: GRANTED for W4-T15 — Learning Reinjection Consumer Pipeline Bridge

**Next Steps**:
1. Create execution plan
2. Create GC-026 authorization sync
3. Update progress tracker
4. Execute CP1 (Full Lane GC-019)
5. Execute CP2 (Fast Lane GC-021)
6. Execute CP3 (Tranche Closure)

---

## Risk Assessment

### Identified Risks

1. **Query derivation**: Need to combine sourceSignalType + feedbackClass into meaningful query
   - **Mitigation**: Use template like "Reinjection: {signalType} → {feedbackClass}"
   - **Status**: LOW RISK

2. **Warning logic**: Need to determine which feedback classes warrant warnings
   - **Mitigation**: REJECT and ESCALATE are critical, warrant warnings
   - **Status**: LOW RISK

3. **Batch aggregation**: Need to aggregate feedback class counts
   - **Mitigation**: Simple count per class (REJECT, ESCALATE, RETRY, ACCEPT)
   - **Status**: LOW RISK

### Residual Risks

None identified.

---

**GC-018 survey completed**: 2026-03-27
**Authorization**: GRANTED (10/10)
**Next step**: Create execution plan
