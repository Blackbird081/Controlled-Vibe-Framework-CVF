import type { ExecutionPipelineReceipt } from "./execution.pipeline.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type OutcomeClass =
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED"
  | "GATED"
  | "SANDBOXED";

export type ObservationCategory =
  | "execution_result"
  | "risk_signal"
  | "gate_signal"
  | "warning_signal";

export interface ObservationNote {
  noteId: string;
  category: ObservationCategory;
  message: string;
}

export interface ExecutionObservation {
  observationId: string;
  createdAt: string;
  sourcePipelineId: string;
  outcomeClass: OutcomeClass;
  confidenceSignal: number;
  totalEntries: number;
  executedCount: number;
  failedCount: number;
  sandboxedCount: number;
  skippedCount: number;
  notes: ObservationNote[];
  observationHash: string;
}

export interface ExecutionObserverContractDependencies {
  classifyOutcome?: (receipt: ExecutionPipelineReceipt) => OutcomeClass;
  now?: () => string;
}

// --- Outcome Classification ---

function defaultClassifyOutcome(receipt: ExecutionPipelineReceipt): OutcomeClass {
  if (receipt.failedCount > 0) {
    return "FAILED";
  }
  if (receipt.sandboxedCount > 0 && receipt.executedCount === 0) {
    return "SANDBOXED";
  }
  if (receipt.executedCount === 0 && receipt.skippedCount > 0) {
    return "GATED";
  }
  if (
    receipt.executedCount > 0 &&
    (receipt.skippedCount > 0 || receipt.sandboxedCount > 0)
  ) {
    return "PARTIAL";
  }
  if (receipt.sandboxedCount > 0) {
    return "SANDBOXED";
  }
  return "SUCCESS";
}

// --- Confidence Signal ---

function computeConfidenceSignal(
  receipt: ExecutionPipelineReceipt,
  outcomeClass: OutcomeClass,
): number {
  if (outcomeClass === "SUCCESS") {
    return receipt.warnings.length === 0 ? 1.0 : 0.8;
  }
  if (outcomeClass === "PARTIAL") {
    const executedRatio =
      receipt.totalEntries > 0
        ? receipt.executedCount / receipt.totalEntries
        : 0;
    return Math.max(0.1, executedRatio * 0.7);
  }
  if (outcomeClass === "SANDBOXED") {
    return 0.5;
  }
  if (outcomeClass === "GATED") {
    return 0.3;
  }
  return 0.0; // FAILED
}

// --- Note Building ---

function buildNotes(
  receipt: ExecutionPipelineReceipt,
  outcomeClass: OutcomeClass,
  sourcePipelineId: string,
): ObservationNote[] {
  const notes: ObservationNote[] = [];

  notes.push({
    noteId: computeDeterministicHash(
      "w2-t4-cp1-obs-note",
      sourcePipelineId,
      "execution_result",
      `${outcomeClass}:${receipt.executedCount}:${receipt.totalEntries}`,
    ),
    category: "execution_result",
    message: `Pipeline ${sourcePipelineId.slice(0, 8)}… classified as ${outcomeClass} — ${receipt.executedCount}/${receipt.totalEntries} entries executed.`,
  });

  if (receipt.failedCount > 0) {
    notes.push({
      noteId: computeDeterministicHash(
        "w2-t4-cp1-obs-note",
        sourcePipelineId,
        "risk_signal",
        `failed:${receipt.failedCount}`,
      ),
      category: "risk_signal",
      message: `${receipt.failedCount} execution(s) failed — review command runtime records.`,
    });
  }

  if (receipt.sandboxedCount > 0) {
    notes.push({
      noteId: computeDeterministicHash(
        "w2-t4-cp1-obs-note",
        sourcePipelineId,
        "gate_signal",
        `sandboxed:${receipt.sandboxedCount}`,
      ),
      category: "gate_signal",
      message: `${receipt.sandboxedCount} execution(s) delegated to sandbox — elevated risk flagged by policy gate.`,
    });
  }

  if (receipt.skippedCount > 0) {
    notes.push({
      noteId: computeDeterministicHash(
        "w2-t4-cp1-obs-note",
        sourcePipelineId,
        "gate_signal",
        `skipped:${receipt.skippedCount}`,
      ),
      category: "gate_signal",
      message: `${receipt.skippedCount} entry(s) skipped by policy gate (denied, review required, or pending).`,
    });
  }

  if (receipt.warnings.length > 0) {
    notes.push({
      noteId: computeDeterministicHash(
        "w2-t4-cp1-obs-note",
        sourcePipelineId,
        "warning_signal",
        `warnings:${receipt.warnings.length}`,
      ),
      category: "warning_signal",
      message: `${receipt.warnings.length} pipeline warning(s) carried into observation.`,
    });
  }

  return notes;
}

// --- Contract ---

export class ExecutionObserverContract {
  private readonly classifyOutcome: (
    receipt: ExecutionPipelineReceipt,
  ) => OutcomeClass;
  private readonly now: () => string;

  constructor(dependencies: ExecutionObserverContractDependencies = {}) {
    this.classifyOutcome =
      dependencies.classifyOutcome ?? defaultClassifyOutcome;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  observe(receipt: ExecutionPipelineReceipt): ExecutionObservation {
    const createdAt = this.now();
    const outcomeClass = this.classifyOutcome(receipt);
    const confidenceSignal = computeConfidenceSignal(receipt, outcomeClass);
    const notes = buildNotes(receipt, outcomeClass, receipt.pipelineReceiptId);

    const observationHash = computeDeterministicHash(
      "w2-t4-cp1-execution-observer",
      `${createdAt}:${receipt.pipelineReceiptId}`,
      `outcome:${outcomeClass}:confidence:${confidenceSignal.toFixed(2)}`,
      `executed:${receipt.executedCount}:failed:${receipt.failedCount}`,
    );

    const observationId = computeDeterministicHash(
      "w2-t4-cp1-observation-id",
      observationHash,
      createdAt,
    );

    return {
      observationId,
      createdAt,
      sourcePipelineId: receipt.pipelineReceiptId,
      outcomeClass,
      confidenceSignal,
      totalEntries: receipt.totalEntries,
      executedCount: receipt.executedCount,
      failedCount: receipt.failedCount,
      sandboxedCount: receipt.sandboxedCount,
      skippedCount: receipt.skippedCount,
      notes,
      observationHash,
    };
  }
}

export function createExecutionObserverContract(
  dependencies?: ExecutionObserverContractDependencies,
): ExecutionObserverContract {
  return new ExecutionObserverContract(dependencies);
}
