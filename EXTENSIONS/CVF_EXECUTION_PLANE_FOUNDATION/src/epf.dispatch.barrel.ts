// EPF Dispatch-Gate-Runtime-Async-Status Family Barrel — W49-T1 (extracted); W50-T1 (PolicyGate + PolicyGateBatch); W51-T1 (CommandRuntime + CommandRuntimeBatch); W52-T1 (AsyncCommandRuntime + AsyncCommandRuntimeBatch); W53-T1 (AsyncExecutionStatus + AsyncExecutionStatusBatch)

// W2-T27 — Dispatch Consumer Pipeline Bridge (CP1)
export {
  DispatchConsumerPipelineContract,
  createDispatchConsumerPipelineContract,
} from "./dispatch.consumer.pipeline.contract";
export type {
  DispatchConsumerPipelineRequest,
  DispatchConsumerPipelineResult,
  DispatchConsumerPipelineContractDependencies,
} from "./dispatch.consumer.pipeline.contract";

// W2-T27 — Dispatch Consumer Pipeline Batch (CP2)
export {
  DispatchConsumerPipelineBatchContract,
  createDispatchConsumerPipelineBatchContract,
} from "./dispatch.consumer.pipeline.batch.contract";
export type {
  DispatchConsumerPipelineBatchResult,
  DispatchConsumerPipelineBatchContractDependencies,
} from "./dispatch.consumer.pipeline.batch.contract";

// W2-T2 — Dispatch Contract
export {
  DispatchContract,
  createDispatchContract,
} from "./dispatch.contract";
export type {
  DispatchEntry,
  DispatchResult,
  DispatchContractDependencies,
} from "./dispatch.contract";

// W49-T1 — Dispatch Batch Contract (CP1)
export {
  DispatchBatchContract,
  createDispatchBatchContract,
} from "./dispatch.batch.contract";
export type {
  DispatchBatchInput,
  DispatchBatchResult,
  DispatchBatchContractDependencies,
} from "./dispatch.batch.contract";
export type { DispatchBatchStatus } from "./dispatch.batch.contract";

// W2-T2 — Policy Gate Contract (CP2)
export {
  PolicyGateContract,
  createPolicyGateContract,
} from "./policy.gate.contract";
export type {
  PolicyGateDecision,
  PolicyGateEntry,
  PolicyGateResult,
  PolicyGateContractDependencies,
} from "./policy.gate.contract";

// W50-T1 — Policy Gate Batch Contract (CP1)
export {
  PolicyGateBatchContract,
  createPolicyGateBatchContract,
} from "./policy.gate.batch.contract";
export type {
  PolicyGateBatchInput,
  PolicyGateBatchResult,
  PolicyGateBatchContractDependencies,
} from "./policy.gate.batch.contract";
export type { PolicyGateBatchStatus } from "./policy.gate.batch.contract";

// W2-T3 — Command Runtime Contract (Phase B barrel move from index.ts)
export {
  CommandRuntimeContract,
  createCommandRuntimeContract,
} from "./command.runtime.contract";
export type {
  RuntimeExecutionStatus,
  RuntimeExecutionRecord,
  CommandRuntimeResult,
  CommandRuntimeContractDependencies,
} from "./command.runtime.contract";

// W51-T1 — Command Runtime Batch Contract (CP1)
export {
  CommandRuntimeBatchContract,
  createCommandRuntimeBatchContract,
} from "./command.runtime.batch.contract";
export type {
  CommandRuntimeBatchInput,
  CommandRuntimeBatchResult,
  CommandRuntimeBatchContractDependencies,
} from "./command.runtime.batch.contract";
export type { CommandRuntimeBatchStatus } from "./command.runtime.batch.contract";

// W2-T7 — Async Command Runtime Contract (Phase C barrel move from index.ts)
export {
  AsyncCommandRuntimeContract,
  createAsyncCommandRuntimeContract,
} from "./execution.async.runtime.contract";
export type {
  AsyncExecutionStatus,
  AsyncCommandRuntimeTicket,
  AsyncCommandRuntimeContractDependencies,
} from "./execution.async.runtime.contract";

// W52-T1 — Async Command Runtime Batch Contract (CP1)
export {
  AsyncCommandRuntimeBatchContract,
  createAsyncCommandRuntimeBatchContract,
} from "./execution.async.runtime.batch.contract";
export type {
  AsyncCommandRuntimeBatchInput,
  AsyncCommandRuntimeBatchResult,
  AsyncCommandRuntimeBatchContractDependencies,
} from "./execution.async.runtime.batch.contract";
export type { AsyncCommandRuntimeBatchStatus } from "./execution.async.runtime.batch.contract";

// W2-T7 — Async Execution Status Contract (Phase D barrel move from index.ts)
export {
  AsyncExecutionStatusContract,
  createAsyncExecutionStatusContract,
} from "./execution.async.status.contract";
export type {
  AsyncExecutionStatusSummary,
  AsyncExecutionStatusContractDependencies,
} from "./execution.async.status.contract";

// W53-T1 — Async Execution Status Batch Contract (CP1)
export {
  AsyncExecutionStatusBatchContract,
  createAsyncExecutionStatusBatchContract,
} from "./execution.async.status.batch.contract";
export type {
  AsyncExecutionStatusBatchInput,
  AsyncExecutionStatusBatchResult,
  AsyncExecutionStatusBatchContractDependencies,
  AsyncExecutionStatusBatchDominant,
} from "./execution.async.status.batch.contract";
