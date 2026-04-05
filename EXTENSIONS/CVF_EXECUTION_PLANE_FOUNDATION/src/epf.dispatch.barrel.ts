// EPF Dispatch Family Barrel — W49-T1 (extracted from index.ts to resolve line-limit constraint)

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
