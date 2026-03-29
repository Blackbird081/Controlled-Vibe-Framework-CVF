import { AIGatewayContract, createAIGatewayContract } from "./ai.gateway.contract";
import type {
  GatewaySignalRequest,
  GatewayProcessedRequest,
  AIGatewayContractDependencies,
} from "./ai.gateway.contract";
import { ControlPlaneIntakeContract, createControlPlaneIntakeContract } from "./intake.contract";
import type {
  ControlPlaneIntakeContractDependencies,
  ControlPlaneIntakeResult,
} from "./intake.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type GatewayConsumptionStage =
  | "SIGNAL_PROCESSED"
  | "INTAKE_EXECUTED"
  | "RECEIPT_ISSUED";

export interface GatewayConsumptionStageEntry {
  stage: GatewayConsumptionStage;
  completedAt: string;
  notes?: string;
}

export interface GatewayConsumptionReceipt {
  receiptId: string;
  createdAt: string;
  consumerId?: string;
  sessionId?: string;
  gatewayRequest: GatewayProcessedRequest;
  intakeResult: ControlPlaneIntakeResult;
  stages: GatewayConsumptionStageEntry[];
  consumptionHash: string;
  warnings: string[];
}

export interface GatewayConsumerContractDependencies {
  gateway?: AIGatewayContract;
  gatewayDependencies?: AIGatewayContractDependencies;
  intake?: ControlPlaneIntakeContract;
  intakeDependencies?: ControlPlaneIntakeContractDependencies;
  now?: () => string;
}

// --- Contract ---

export class GatewayConsumerContract {
  private readonly gateway: AIGatewayContract;
  private readonly intake: ControlPlaneIntakeContract;
  private readonly now: () => string;

  constructor(dependencies: GatewayConsumerContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.gateway = dependencies.gateway
      ?? createAIGatewayContract({
        ...dependencies.gatewayDependencies,
        now: dependencies.gatewayDependencies?.now ?? this.now,
      });
    this.intake = dependencies.intake
      ?? createControlPlaneIntakeContract({
        ...dependencies.intakeDependencies,
        now: dependencies.intakeDependencies?.now ?? this.now,
      });
  }

  consume(signal: GatewaySignalRequest): GatewayConsumptionReceipt {
    const createdAt = this.now();
    const stages: GatewayConsumptionStageEntry[] = [];

    // Stage 1: Process signal through gateway
    const gatewayRequest = this.gateway.process(signal);
    stages.push({
      stage: "SIGNAL_PROCESSED",
      completedAt: createdAt,
      notes: `Signal processed — type: ${gatewayRequest.signalType}, privacy masked: ${gatewayRequest.privacyReport.maskedTokenCount} token(s)`,
    });

    // Stage 2: Execute intake with normalized signal
    const intakeResult = this.intake.execute({
      vibe: gatewayRequest.normalizedSignal || gatewayRequest.rawSignal || "(empty signal)",
      consumerId: signal.consumerId,
    });
    stages.push({
      stage: "INTAKE_EXECUTED",
      completedAt: createdAt,
      notes: `Intake executed — ${intakeResult.retrieval.chunkCount} chunk(s) retrieved, context packaged`,
    });

    // Aggregate warnings
    const warnings = [
      ...gatewayRequest.warnings.map((w) => `[gateway] ${w}`),
      ...intakeResult.warnings.map((w) => `[intake] ${w}`),
    ];

    // Stage 3: Issue receipt
    const consumptionHash = computeDeterministicHash(
      "w1-t4-cp2-gateway-consumer",
      `${createdAt}:${signal.consumerId ?? "anonymous"}`,
      `gateway:${gatewayRequest.gatewayId}`,
      `intake:${intakeResult.requestId}`,
    );

    const receiptId = computeDeterministicHash(
      "w1-t4-cp2-receipt-id",
      consumptionHash,
      createdAt,
    );

    stages.push({
      stage: "RECEIPT_ISSUED",
      completedAt: createdAt,
      notes: `Receipt ${receiptId} issued — EXTERNAL SIGNAL → GATEWAY → INTAKE path provable`,
    });

    return {
      receiptId,
      createdAt,
      consumerId: signal.consumerId,
      sessionId: signal.sessionId,
      gatewayRequest,
      intakeResult,
      stages,
      consumptionHash,
      warnings,
    };
  }
}

export function createGatewayConsumerContract(
  dependencies?: GatewayConsumerContractDependencies,
): GatewayConsumerContract {
  return new GatewayConsumerContract(dependencies);
}
