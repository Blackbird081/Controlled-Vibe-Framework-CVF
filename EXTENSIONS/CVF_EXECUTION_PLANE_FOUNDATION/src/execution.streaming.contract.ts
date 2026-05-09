import type { CommandRuntimeResult, RuntimeExecutionStatus } from "./command.runtime.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type StreamingChunkStatus = "STREAMED" | "SKIPPED" | "FAILED";

export interface StreamingExecutionChunk {
  chunkId: string;
  issuedAt: string;
  sourceRuntimeId: string;
  sequenceNumber: number;
  assignmentId: string;
  taskId: string;
  chunkStatus: StreamingChunkStatus;
  recordStatus: RuntimeExecutionStatus;
  payload: string;
  chunkHash: string;
}

export interface StreamingExecutionContractDependencies {
  now?: () => string;
}

// --- Status mapping ---

function toChunkStatus(recordStatus: RuntimeExecutionStatus): StreamingChunkStatus {
  switch (recordStatus) {
    case "EXECUTED":
    case "DELEGATED_TO_SANDBOX":
      return "STREAMED";
    case "SKIPPED_DENIED":
    case "SKIPPED_REVIEW_REQUIRED":
    case "SKIPPED_PENDING":
      return "SKIPPED";
    case "EXECUTION_FAILED":
      return "FAILED";
  }
}

// --- Contract ---

export class StreamingExecutionContract {
  private readonly now: () => string;

  constructor(dependencies: StreamingExecutionContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  stream(result: CommandRuntimeResult): StreamingExecutionChunk[] {
    const issuedAt = this.now();
    return result.records.map((record, index) => {
      const chunkStatus = toChunkStatus(record.status);
      const chunkHash = computeDeterministicHash(
        "w6-t1-cp1-streaming-chunk",
        `${issuedAt}:${result.runtimeId}`,
        `seq:${index}:${record.assignmentId}:${record.status}:${chunkStatus}`,
      );
      const chunkId = computeDeterministicHash(
        "w6-t1-cp1-chunk-id",
        chunkHash,
        String(index),
      );
      return {
        chunkId,
        issuedAt,
        sourceRuntimeId: result.runtimeId,
        sequenceNumber: index,
        assignmentId: record.assignmentId,
        taskId: record.taskId,
        chunkStatus,
        recordStatus: record.status,
        payload: record.notes,
        chunkHash,
      };
    });
  }
}

export function createStreamingExecutionContract(
  dependencies?: StreamingExecutionContractDependencies,
): StreamingExecutionContract {
  return new StreamingExecutionContract(dependencies);
}
