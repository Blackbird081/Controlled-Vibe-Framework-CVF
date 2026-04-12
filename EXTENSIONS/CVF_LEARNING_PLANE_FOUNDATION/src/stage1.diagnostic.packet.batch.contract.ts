import type { Stage1DiagnosticPacket } from "./stage1.diagnostic.packet.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export interface Stage1DiagnosticPacketBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalPackets: number;
  reducedAmbiguityCount: number;
  clarifyInputCount: number;
  tightenTriggerCount: number;
  fixAssetProfileCount: number;
  reviewRuntimeProviderCount: number;
  collectMoreEvidenceCount: number;
  packets: Stage1DiagnosticPacket[];
}

export interface Stage1DiagnosticPacketBatchContractDependencies {
  now?: () => string;
}

export class Stage1DiagnosticPacketBatchContract {
  private readonly now: () => string;

  constructor(
    dependencies: Stage1DiagnosticPacketBatchContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  batch(
    packets: Stage1DiagnosticPacket[],
  ): Stage1DiagnosticPacketBatchResult {
    const createdAt = this.now();

    const countByMove = (
      move: Stage1DiagnosticPacket["recommendedNextMove"],
    ) => packets.filter((packet) => packet.recommendedNextMove === move).length;

    const batchHash = computeDeterministicHash(
      "stage1-diagnostic-packet-batch",
      ...packets.map((packet) => packet.packetHash),
      createdAt,
    );

    const batchId = computeDeterministicHash(
      "stage1-diagnostic-packet-batch-id",
      batchHash,
    );

    return {
      batchId,
      batchHash,
      createdAt,
      totalPackets: packets.length,
      reducedAmbiguityCount: packets.filter((packet) => packet.stage1ReducedAmbiguity).length,
      clarifyInputCount: countByMove("CLARIFY_INPUT"),
      tightenTriggerCount: countByMove("TIGHTEN_TRIGGER"),
      fixAssetProfileCount: countByMove("FIX_ASSET_PROFILE"),
      reviewRuntimeProviderCount: countByMove("REVIEW_RUNTIME_PROVIDER"),
      collectMoreEvidenceCount: countByMove("COLLECT_MORE_EVIDENCE"),
      packets,
    };
  }
}

export function createStage1DiagnosticPacketBatchContract(
  dependencies?: Stage1DiagnosticPacketBatchContractDependencies,
): Stage1DiagnosticPacketBatchContract {
  return new Stage1DiagnosticPacketBatchContract(dependencies);
}
