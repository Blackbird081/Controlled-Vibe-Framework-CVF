import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { ReputationSignal } from "./reputation.signal.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReputationSignalBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalSignals: number;
  trustedCount: number;
  reliableCount: number;
  provisionalCount: number;
  untrustedCount: number;
  /** Average compositeReputationScore across all signals (0–100 rounded). 0 for empty batch. */
  averageScore: number;
}

export interface ReputationSignalBatchContractDependencies {
  now?: () => string;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ReputationSignalBatchContract (W10-T1 CP3 — Fast Lane GC-021)
 * --------------------------------------------------------------
 * Aggregates ReputationSignal[] into a governed batch summary.
 *
 * - trustedCount      = signals where reputationClass === "TRUSTED"
 * - reliableCount     = signals where reputationClass === "RELIABLE"
 * - provisionalCount  = signals where reputationClass === "PROVISIONAL"
 * - untrustedCount    = signals where reputationClass === "UNTRUSTED"
 * - averageScore      = Math.round(sum / totalSignals); 0 for empty batch
 * - batchId ≠ batchHash (batchId is hash of batchHash only)
 */
export class ReputationSignalBatchContract {
  private readonly now: () => string;

  constructor(dependencies: ReputationSignalBatchContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(signals: ReputationSignal[]): ReputationSignalBatch {
    const createdAt = this.now();

    const trustedCount = signals.filter((s) => s.reputationClass === "TRUSTED").length;
    const reliableCount = signals.filter((s) => s.reputationClass === "RELIABLE").length;
    const provisionalCount = signals.filter((s) => s.reputationClass === "PROVISIONAL").length;
    const untrustedCount = signals.filter((s) => s.reputationClass === "UNTRUSTED").length;

    const averageScore =
      signals.length === 0
        ? 0
        : Math.round(
            signals.reduce((sum, s) => sum + s.compositeReputationScore, 0) /
              signals.length,
          );

    const batchHash = computeDeterministicHash(
      "w10-t1-cp3-reputation-signal-batch",
      ...signals.map((s) => s.reputationHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "w10-t1-cp3-reputation-signal-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalSignals: signals.length,
      trustedCount,
      reliableCount,
      provisionalCount,
      untrustedCount,
      averageScore,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createReputationSignalBatchContract(
  dependencies?: ReputationSignalBatchContractDependencies,
): ReputationSignalBatchContract {
  return new ReputationSignalBatchContract(dependencies);
}
