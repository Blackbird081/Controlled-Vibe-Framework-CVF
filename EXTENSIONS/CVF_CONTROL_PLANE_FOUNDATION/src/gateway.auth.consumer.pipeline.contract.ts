import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  GatewayAuthContract,
  createGatewayAuthContract,
} from "./gateway.auth.contract";
import type {
  GatewayAuthRequest,
  GatewayAuthResult,
  GatewayAuthContractDependencies,
} from "./gateway.auth.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "./consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "./consumer.pipeline.contract";
import type { SegmentTypeConstraints } from "./context.packager.contract";
import type { RankableKnowledgeItem } from "./knowledge.ranking.contract";
import type { ScoringWeights } from "./knowledge.ranking.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatewayAuthConsumerPipelineRequest {
  authRequest: GatewayAuthRequest;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
}

export interface GatewayAuthConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  authResult: GatewayAuthResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface GatewayAuthConsumerPipelineContractDependencies {
  now?: () => string;
  authContractDeps?: GatewayAuthContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function deriveGatewayAuthQuery(authResult: GatewayAuthResult): string {
  const raw = `gateway-auth:${authResult.authStatus}:tenant:${authResult.tenantId}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildGatewayAuthWarnings(authResult: GatewayAuthResult): string[] {
  if (authResult.authStatus === "DENIED") {
    return ["[gateway-auth] access denied — tenant authentication failed"];
  }
  if (authResult.authStatus === "EXPIRED") {
    return ["[gateway-auth] credential expired — tenant session requires renewal"];
  }
  if (authResult.authStatus === "REVOKED") {
    return ["[gateway-auth] credential revoked — tenant access has been revoked"];
  }
  return [];
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * GatewayAuthConsumerPipelineContract (W1-T20 CP1 — Full Lane GC-019)
 * -------------------------------------------------------------------------
 * CPF-internal consumer bridge from GatewayAuthContract to CPF.
 *
 * Internal chain (single execute call):
 *   GatewayAuthContract.evaluate(authRequest)        → GatewayAuthResult
 *   ControlPlaneConsumerPipelineContract.execute(…)  → ControlPlaneConsumerPackage
 *   → GatewayAuthConsumerPipelineResult
 *
 * query     = "gateway-auth:${authStatus}:tenant:${tenantId}" (≤120 chars)
 * contextId = authResult.resultId
 * Determinism: all sub-contracts share the same injected now().
 * Warnings:
 *   DENIED  → "[gateway-auth] access denied — tenant authentication failed"
 *   EXPIRED → "[gateway-auth] credential expired — tenant session requires renewal"
 *   REVOKED → "[gateway-auth] credential revoked — tenant access has been revoked"
 */
export class GatewayAuthConsumerPipelineContract {
  private readonly now: () => string;
  private readonly authContract: GatewayAuthContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: GatewayAuthConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.authContract = createGatewayAuthContract({
      ...dependencies.authContractDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: GatewayAuthConsumerPipelineRequest,
  ): GatewayAuthConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: evaluate auth request → GatewayAuthResult
    const authResult: GatewayAuthResult =
      this.authContract.evaluate(request.authRequest);

    // Step 2: derive query and build consumer package
    const query = deriveGatewayAuthQuery(authResult);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: authResult.resultId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on auth status
    const warnings = buildGatewayAuthWarnings(authResult);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w1-t20-cp1-gateway-auth-consumer-pipeline",
      authResult.authHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w1-t20-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      authResult,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGatewayAuthConsumerPipelineContract(
  dependencies?: GatewayAuthConsumerPipelineContractDependencies,
): GatewayAuthConsumerPipelineContract {
  return new GatewayAuthConsumerPipelineContract(dependencies);
}
