import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { CVFRiskLevel } from "../../CVF_GUARD_CONTRACT/src/types";
import type {
  W7NormalizedAssetCandidate,
  W7NormalizedAssetCandidateCompileResult,
} from "./w7.normalized.asset.candidate.contract";

export type RegistryReadyApprovalState =
  | "draft"
  | "reviewed"
  | "approved"
  | "rejected";

export interface RegistryReadyGovernedAsset {
  stage: "registry_ready_governed_asset";
  asset_id: string;
  asset_type: string;
  candidate_id: string;
  source_ref: string;
  governance: {
    owner: string;
    approval_state: RegistryReadyApprovalState;
    source_quality: string;
  };
  risk_level: CVFRiskLevel;
  observability: {
    trace_required: boolean;
  };
  evaluation_profile: {
    enabled: boolean;
  };
  registry_refs: string[];
}

export interface RegistryReadyGovernedAssetIssue {
  field: string;
  code: "STAGE2_INVALID" | "REQUIRED" | "REQUIRED_WHEN";
  message: string;
}

export interface RegistryReadyGovernedAssetRequest {
  compileResult: W7NormalizedAssetCandidateCompileResult;
  governanceOwner: string;
  approvalState: RegistryReadyApprovalState;
  riskLevel: CVFRiskLevel;
  traceRequired?: boolean;
  evaluationEnabled?: boolean;
  registryRefs?: string[];
}

export interface RegistryReadyGovernedAssetResult {
  stage: "registry_ready_governed_asset";
  valid: boolean;
  issues: RegistryReadyGovernedAssetIssue[];
  governedAsset?: RegistryReadyGovernedAsset;
}

function normalizeText(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeList(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => normalizeText(value))
        .filter((value) => value.length > 0),
    ),
  );
}

function buildGovernedAsset(
  candidate: W7NormalizedAssetCandidate,
  request: RegistryReadyGovernedAssetRequest,
  registryRefs: string[],
): RegistryReadyGovernedAsset {
  const asset_id = computeDeterministicHash(
    "registry-ready-governed-asset",
    candidate.candidate_id,
    request.governanceOwner,
    request.approvalState,
    request.riskLevel,
    registryRefs.join("|"),
  );

  return {
    stage: "registry_ready_governed_asset",
    asset_id,
    asset_type: candidate.candidate_asset_type,
    candidate_id: candidate.candidate_id,
    source_ref: candidate.source_ref,
    governance: {
      owner: request.governanceOwner,
      approval_state: request.approvalState,
      source_quality: candidate.body.instruction_payload.source_quality,
    },
    risk_level: request.riskLevel,
    observability: {
      trace_required: request.traceRequired !== false,
    },
    evaluation_profile: {
      enabled: request.evaluationEnabled === true,
    },
    registry_refs: registryRefs,
  };
}

export class RegistryReadyGovernedAssetContract {
  prepare(
    request: RegistryReadyGovernedAssetRequest,
  ): RegistryReadyGovernedAssetResult {
    const issues: RegistryReadyGovernedAssetIssue[] = [];
    const candidate = request.compileResult.normalizedCandidate;
    const governanceOwner = normalizeText(request.governanceOwner);
    const registryRefs = normalizeList(request.registryRefs);
    const traceRequired = request.traceRequired !== false;

    if (!request.compileResult.valid || candidate === undefined) {
      issues.push({
        field: "compileResult",
        code: "STAGE2_INVALID",
        message:
          "A valid w7_normalized_asset_candidate is required before registry-ready governance can be prepared.",
      });
    }

    if (governanceOwner.length === 0) {
      issues.push({
        field: "governanceOwner",
        code: "REQUIRED",
        message: "governanceOwner is required.",
      });
    }

    if (request.approvalState === "approved" && registryRefs.length === 0) {
      issues.push({
        field: "registryRefs",
        code: "REQUIRED_WHEN",
        message:
          "registryRefs is required when approvalState is approved.",
      });
    }

    if (request.approvalState === "approved" && !traceRequired) {
      issues.push({
        field: "traceRequired",
        code: "REQUIRED_WHEN",
        message:
          "traceRequired must remain true when approvalState is approved.",
      });
    }

    if (issues.length > 0 || candidate === undefined) {
      return {
        stage: "registry_ready_governed_asset",
        valid: false,
        issues,
      };
    }

    return {
      stage: "registry_ready_governed_asset",
      valid: true,
      issues: [],
      governedAsset: buildGovernedAsset(candidate, request, registryRefs),
    };
  }
}

export function createRegistryReadyGovernedAssetContract(): RegistryReadyGovernedAssetContract {
  return new RegistryReadyGovernedAssetContract();
}
