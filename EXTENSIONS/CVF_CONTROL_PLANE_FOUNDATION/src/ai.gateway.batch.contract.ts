import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { GatewaySignalRequest, GatewayProcessedRequest } from "./ai.gateway.contract";
import { AIGatewayContract } from "./ai.gateway.contract";

// --- Types ---

export type AIGatewayBatchDominantSignalType =
  | "vibe"
  | "command"
  | "query"
  | "event"
  | "EMPTY";

export interface AIGatewayBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalSignals: number;
  vibeCount: number;
  commandCount: number;
  queryCount: number;
  eventCount: number;
  filteredCount: number;
  warningCount: number;
  dominantSignalType: AIGatewayBatchDominantSignalType;
  results: GatewayProcessedRequest[];
}

export interface AIGatewayBatchContractDependencies {
  now?: () => string;
}

// --- Dominant Signal Type Resolution ---

/*
 * Resolves the dominant signal type by highest count.
 * Tie-breaking precedence: event > command > query > vibe
 * Returns "EMPTY" when batch is empty.
 *
 * Precedence reflects most-governed wins:
 *   event   — system-triggered, highest governance weight
 *   command — explicit instruction, high governance weight
 *   query   — information request, medium governance weight
 *   vibe    — open-ended, lowest governance weight
 */
function resolveDominantSignalType(
  vibeCount: number,
  commandCount: number,
  queryCount: number,
  eventCount: number,
): AIGatewayBatchDominantSignalType {
  const total = vibeCount + commandCount + queryCount + eventCount;
  if (total === 0) return "EMPTY";

  const maxCount = Math.max(vibeCount, commandCount, queryCount, eventCount);

  // Tie-breaking: event > command > query > vibe
  if (eventCount === maxCount) return "event";
  if (commandCount === maxCount) return "command";
  if (queryCount === maxCount) return "query";
  return "vibe";
}

// --- Contract ---

export class AIGatewayBatchContract {
  private readonly now: () => string;

  constructor(dependencies: AIGatewayBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    signals: GatewaySignalRequest[],
    gateway: AIGatewayContract,
  ): AIGatewayBatch {
    const createdAt = this.now();
    const results: GatewayProcessedRequest[] = [];

    for (const signal of signals) {
      results.push(gateway.process(signal));
    }

    const vibeCount = results.filter(
      (r) => r.signalType === "vibe",
    ).length;
    const commandCount = results.filter(
      (r) => r.signalType === "command",
    ).length;
    const queryCount = results.filter(
      (r) => r.signalType === "query",
    ).length;
    const eventCount = results.filter(
      (r) => r.signalType === "event",
    ).length;

    const filteredCount = results.filter(
      (r) => r.privacyReport.filtered === true,
    ).length;

    const warningCount = results.reduce(
      (sum, r) => sum + r.warnings.length,
      0,
    );

    const dominantSignalType = resolveDominantSignalType(
      vibeCount,
      commandCount,
      queryCount,
      eventCount,
    );

    const batchHash = computeDeterministicHash(
      "w23-t1-cp1-ai-gateway-batch",
      ...results.map((r) => r.gatewayHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w23-t1-cp1-ai-gateway-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalSignals: results.length,
      vibeCount,
      commandCount,
      queryCount,
      eventCount,
      filteredCount,
      warningCount,
      dominantSignalType,
      results,
    };
  }
}

export function createAIGatewayBatchContract(
  dependencies?: AIGatewayBatchContractDependencies,
): AIGatewayBatchContract {
  return new AIGatewayBatchContract(dependencies);
}
