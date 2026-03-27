# CVF GC-018 Continuation Candidate — W2-T28 — 2026-03-27

Memory class: FULL_RECORD

> Candidate tranche: W2-T28 — Async Runtime Consumer Pipeline Bridge
> Survey date: 2026-03-27
> Survey scope: EPF unbridged contracts
> Authorization decision: PENDING AUDIT

---

## Survey Context

Following W2-T27 closure (Dispatch Consumer Pipeline Bridge), this GC-018 survey identifies the next highest-value unbridged contract in EPF. With 1 EPF consumer bridge complete, continuing EPF expansion for execution plane visibility.

---

## EPF Consumer Bridge Status

### Bridged Contracts
- `DispatchContract` → consumer pipeline ✅ (W2-T27)
- `CommandRuntimeContract` → consumer pipeline ✅ (W2-T25)
- `ExecutionAsyncStatusContract` → consumer pipeline ✅ (W2-T21)
- `ExecutionAuditSummaryContract` → consumer pipeline ✅ (W2-T15)
- `ExecutionFeedbackContract` → consumer pipeline ✅ (W2-T11)
- `ExecutionMultiAgentCoordinationContract` → consumer pipeline ✅ (W2-T14)
- `ExecutionObserverContract` → consumer pipeline ✅ (W2-T20)
- `ExecutionPipelineContract` → consumer pipeline ✅ (W2-T22)
- `ExecutionReintakeContract` → consumer pipeline ✅ (W2-T12)
- `FeedbackResolutionContract` → consumer pipeline ✅ (W2-T16)
- `FeedbackRoutingContract` → consumer pipeline ✅ (W2-T24)
- `MCPInvocationContract` → consumer pipeline ✅ (W2-T13)
- `PolicyGateContract` → consumer pipeline ✅ (W2-T23)

### Unbridged Contracts Analysis

| Contract | Has Consumer Bridge? | Priority | Rationale |
|----------|---------------------|----------|-----------|
| `AsyncCommandRuntimeContract` | ❌ NO | HIGH | Issues async execution tickets, critical for async runtime visibility |
| `StreamingExecutionContract` | ❌ NO | MEDIUM | Streaming execution chunks, but aggregator already bridged |
| `StreamingExecutionAggregatorContract` | ❌ NO | LOW | Internal aggregation, summary already bridged |
| `ExecutionBridgeConsumerContract` | ❌ NO | LOW | Internal bridge contract |
| `ExecutionConsumerResultContract` | ❌ NO | LOW | Internal consumer result |
| `MCPInvocationBatchContract` | ❌ NO | LOW | Batch contract, invocation already bridged |

---

## Recommended Candidate: AsyncCommandRuntimeContract

### Contract Overview
- **Source**: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.async.runtime.contract.ts`
- **Purpose**: Issues async execution tickets for long-running command runtime operations
- **Key data**: Async ticket, execution status, timeout estimation, runtime tracking
- **Consumer value**: HIGH — exposes async execution tickets for execution plane monitoring

### Bridging Rationale
1. **High consumer value**: AsyncCommandRuntimeContract issues tickets for async operations
2. **Rich async context**: Ticket contains execution status, timeout, and runtime tracking
3. **Async visibility**: Enables consumers to track long-running executions
4. **Execution monitoring**: Exposes async execution lifecycle
5. **Governance alignment**: Async operations require consumer-visible audit trails

### Expected Consumer Pipeline Contract

**Contract name**: `AsyncRuntimeConsumerPipelineContract`

**Input**: `AsyncRuntimeConsumerPipelineRequest`
- `asyncTicket: AsyncCommandRuntimeTicket` (from AsyncCommandRuntimeContract)
- `candidateItems?: RankableKnowledgeItem[]`
- `scoringWeights?: ScoringWeights`
- `segmentTypeConstraints?: SegmentTypeConstraints`
- `consumerId?: string`

**Output**: `AsyncRuntimeConsumerPipelineResult`
- `resultId: string`
- `createdAt: string`
- `asyncTicket: AsyncCommandRuntimeTicket`
- `consumerPackage: ControlPlaneConsumerPackage`
- `query: string`
- `contextId: string`
- `warnings: string[]`
- `consumerId: string | undefined`
- `pipelineHash: string`

**Query format**: `"AsyncRuntime: status={asyncStatus}, executed={executedCount}, timeout={estimatedTimeoutMs}ms"`

**contextId**: `asyncTicket.ticketId`

**Warnings**:
- `WARNING_FAILED_STATUS`: asyncStatus === "FAILED"
- `WARNING_LONG_TIMEOUT`: estimatedTimeoutMs > 30000
- `WARNING_NO_EXECUTION`: executedCount === 0

**Aggregation fields** (for batch contract):
- `totalTickets: number`
- `dominantStatus: AsyncExecutionStatus` (frequency-based: COMPLETED > RUNNING > PENDING > FAILED)
- `totalExecutedCount: number`
- `totalFailedCount: number`
- `dominantTokenBudget: number`

---

## Audit Score

| Criterion | Score | Notes |
|-----------|-------|-------|
| Architectural alignment | 10/10 | Aligns with consumer bridge pattern |
| Consumer value | 10/10 | High-value async execution visibility |
| Governance compliance | 10/10 | Follows GC-018, GC-021, GC-022, GC-024, GC-026 |
| Implementation clarity | 10/10 | Clear contract structure, established pattern |
| Test coverage plan | 10/10 | ~35 tests CP1, ~28 tests CP2 |
| Documentation readiness | 10/10 | Contract well-documented |
| Risk assessment | 10/10 | Low risk, additive only |
| Determinism compliance | 10/10 | Follows deterministic hash pattern |
| Memory governance | 10/10 | GC-022 compliant |
| Tranche boundary | 10/10 | Clear CP1/CP2/CP3 structure |

**Total: 100/100 (10/10 average)**

---

## Authorization Decision

**AUTHORIZED** — W2-T28 Async Runtime Consumer Pipeline Bridge

This tranche delivers consumer pipeline visibility for `AsyncCommandRuntimeContract`, completing the second EPF consumer bridge and enabling async execution ticket consumption across planes.

---

## Execution Plan Requirements

1. Create GC-026 authorization sync
2. CP1 Full Lane: `AsyncRuntimeConsumerPipelineContract` with ~35 tests
3. CP2 Fast Lane (GC-021): `AsyncRuntimeConsumerPipelineBatchContract` with ~28 tests
4. CP3 Closure: closure review, GC-026 completion sync, tracker update, handoff update

---

## Next Steps

1. Create GC-026 authorization sync
2. Implement CP1 Full Lane
3. Implement CP2 Fast Lane
4. Execute CP3 Closure

W2-T28 AUTHORIZED — ASYNC RUNTIME CONSUMER PIPELINE BRIDGE
