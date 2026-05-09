import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  PolicyGateContract,
  createPolicyGateContract,
} from "./policy.gate.contract";
import type {
  PolicyGateResult,
  PolicyGateContractDependencies,
} from "./policy.gate.contract";
import type { DispatchResult } from "./dispatch.contract";
import {
  ControlPlaneConsumerPipelineContract,
  createControlPlaneConsumerPipelineContract,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type {
  ControlPlaneConsumerPackage,
  ControlPlaneConsumerPipelineContractDependencies,
} from "../../CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.contract";
import type { RankableKnowledgeItem, ScoringWeights } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.contract";
import type { SegmentTypeConstraints } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PolicyGateConsumerPipelineRequest {
  dispatchResult: DispatchResult;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

export interface PolicyGateConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  consumerId?: string;
  gateResult: PolicyGateResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
}

export interface PolicyGateConsumerPipelineContractDependencies {
  now?: () => string;
  policyGateDeps?: PolicyGateContractDependencies;
  consumerPipelineDeps?: ControlPlaneConsumerPipelineContractDependencies;
}

// ─── Query Derivation ─────────────────────────────────────────────────────────

function derivePolicyGateQuery(gateResult: PolicyGateResult): string {
  const raw = `[policy-gate] denied:${gateResult.deniedCount} review:${gateResult.reviewRequiredCount} sandbox:${gateResult.sandboxedCount} total:${gateResult.entries.length}`;
  return raw.slice(0, 120);
}

// ─── Warning Builder ──────────────────────────────────────────────────────────

function buildPolicyGateWarnings(gateResult: PolicyGateResult): string[] {
  const warnings: string[] = [];
  if (gateResult.deniedCount > 0) {
    warnings.push("policy gate denials detected — review required");
  }
  if (gateResult.reviewRequiredCount > 0) {
    warnings.push("policy gate reviews pending — human review required");
  }
  return warnings;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * PolicyGateConsumerPipelineContract (W2-T23 CP1)
 * -------------------------------------------------------
 * Cross-plane consumer bridge: EPF → CPF (policy gate evaluation result).
 *
 * Internal chain (single execute call):
 *   PolicyGateContract.evaluate(dispatchResult)  → PolicyGateResult
 *   query = `[policy-gate] denied:${deniedCount} review:${reviewRequiredCount} sandbox:${sandboxedCount} total:${entries.length}`.slice(0, 120)
 *   contextId = gateResult.gateId
 *   ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
 *   → ControlPlaneConsumerPackage
 *   → PolicyGateConsumerPipelineResult
 *
 * Determinism: all sub-contracts share the same injected now().
 * Warnings: deniedCount > 0 → denials detected; reviewRequiredCount > 0 → reviews pending.
 * Gap closed: PolicyGateContract had no governed consumer-visible enriched output path.
 */
export class PolicyGateConsumerPipelineContract {
  private readonly now: () => string;
  private readonly policyGate: PolicyGateContract;
  private readonly consumerPipeline: ControlPlaneConsumerPipelineContract;

  constructor(
    dependencies: PolicyGateConsumerPipelineContractDependencies = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.policyGate = createPolicyGateContract({
      ...dependencies.policyGateDeps,
      now: this.now,
    });
    this.consumerPipeline = createControlPlaneConsumerPipelineContract({
      ...dependencies.consumerPipelineDeps,
      now: this.now,
    });
  }

  execute(
    request: PolicyGateConsumerPipelineRequest,
  ): PolicyGateConsumerPipelineResult {
    const createdAt = this.now();

    // Step 1: evaluate dispatch result through policy gate → PolicyGateResult
    const gateResult: PolicyGateResult =
      this.policyGate.evaluate(request.dispatchResult);

    // Step 2: derive query and build consumer package
    const query = derivePolicyGateQuery(gateResult);
    const consumerPackage: ControlPlaneConsumerPackage =
      this.consumerPipeline.execute({
        rankingRequest: {
          query,
          contextId: gateResult.gateId,
          candidateItems: request.candidateItems ?? [],
          scoringWeights: request.scoringWeights,
        },
        segmentTypeConstraints: request.segmentTypeConstraints,
      });

    // Step 3: build warnings based on deniedCount and reviewRequiredCount
    const warnings = buildPolicyGateWarnings(gateResult);

    // Step 4: deterministic hash + resultId
    const pipelineHash = computeDeterministicHash(
      "w2-t23-cp1-policy-gate-consumer-pipeline",
      gateResult.gateHash,
      consumerPackage.pipelineHash,
      createdAt,
    );

    const resultId = computeDeterministicHash(
      "w2-t23-cp1-result-id",
      pipelineHash,
    );

    return {
      resultId,
      createdAt,
      consumerId: request.consumerId,
      gateResult,
      consumerPackage,
      pipelineHash,
      warnings,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createPolicyGateConsumerPipelineContract(
  dependencies?: PolicyGateConsumerPipelineContractDependencies,
): PolicyGateConsumerPipelineContract {
  return new PolicyGateConsumerPipelineContract(dependencies);
}
