import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  ExternalAssetExecutionEnvironment,
  ExternalAssetIntakeValidationResult,
  ExternalAssetSourceKind,
  ExternalAssetSourceQuality,
  W7CandidateAssetType,
} from "./external.asset.intake.profile.contract";

export type W7RoutingPhaseHint =
  | "INTAKE"
  | "DESIGN"
  | "BUILD"
  | "REVIEW"
  | "RUN";

export interface W7NormalizedAssetCandidateHeader {
  name: string;
  description: string;
  version_hint: string;
}

export interface W7NormalizedAssetCandidateRoutingMetadata {
  triggers: string[];
  domain: string;
  phase_hints: W7RoutingPhaseHint[];
}

export interface W7NormalizedAssetInstructionPayload {
  description_or_trigger: string;
  instruction_body: string;
  provenance_notes: string;
  source_kind: ExternalAssetSourceKind;
  source_quality: ExternalAssetSourceQuality;
}

// W72-T6 — Palace vocabulary as optional enrichment fields
export interface W7PalaceVocabulary {
  wing?: string;
  hall?: string;
  room?: string;
  drawer?: string;
  closet_summary?: string;
  tunnel_links?: string[];
  contradiction_flag?: boolean;
}

export interface W7NormalizedAssetCandidateEnrichment {
  references: string[];
  examples: string[];
  tools: string[];
  templates: string[];
  execution_environment?: ExternalAssetExecutionEnvironment;
  // W72-T6 — Palace vocabulary (all optional, candidate-layer only)
  wing?: string;
  hall?: string;
  room?: string;
  drawer?: string;
  closet_summary?: string;
  tunnel_links?: string[];
  contradiction_flag?: boolean;
}

export interface W7NormalizedAssetCandidate {
  stage: "w7_normalized_asset_candidate";
  candidate_id: string;
  source_ref: string;
  candidate_asset_type: W7CandidateAssetType;
  normalized_header: W7NormalizedAssetCandidateHeader;
  routing_metadata: W7NormalizedAssetCandidateRoutingMetadata;
  body: {
    instruction_payload: W7NormalizedAssetInstructionPayload;
  };
  enrichment: W7NormalizedAssetCandidateEnrichment;
}

export interface W7NormalizedAssetCandidateCompileIssue {
  field: string;
  code: "STAGE1_INVALID" | "REQUIRED";
  message: string;
}

export interface W7NormalizedAssetCandidateCompileRequest {
  intakeValidation: ExternalAssetIntakeValidationResult;
  nameHint?: string;
  versionHint?: string;
  triggers?: string[];
  domain?: string;
  phaseHints?: W7RoutingPhaseHint[];
  palaceVocabulary?: W7PalaceVocabulary;
}

export interface W7NormalizedAssetCandidateCompileResult {
  stage: "w7_normalized_asset_candidate";
  valid: boolean;
  issues: W7NormalizedAssetCandidateCompileIssue[];
  normalizedCandidate?: W7NormalizedAssetCandidate;
}

export interface W7NormalizedAssetCandidateContractDependencies {
  now?: () => string;
}

const DEFAULT_PHASE_HINTS: Record<W7CandidateAssetType, W7RoutingPhaseHint[]> = {
  W7CommandAsset: ["INTAKE", "DESIGN"],
  W7PolicyAsset: ["INTAKE", "REVIEW"],
  W7ContextAsset: ["INTAKE", "DESIGN"],
  W7SkillAsset: ["BUILD", "REVIEW", "RUN"],
  W7AgentAsset: ["DESIGN", "BUILD", "REVIEW"],
  W7PlannerAsset: ["DESIGN", "BUILD"],
  W7ToolAsset: ["BUILD", "REVIEW", "RUN"],
  W7LearningAsset: ["REVIEW"],
};

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

function normalizePhaseHints(
  value: W7RoutingPhaseHint[] | undefined,
  assetType: W7CandidateAssetType,
): W7RoutingPhaseHint[] {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_PHASE_HINTS[assetType];
  }

  return Array.from(new Set(value));
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s._/-]+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function deriveName(sourceRef: string, descriptionOrTrigger: string): string {
  const sourceTail = sourceRef.split(/[\\/]/).at(-1) ?? sourceRef;
  const withoutExtension = sourceTail.replace(/\.[^.]+$/, "");
  const normalizedSource = toTitleCase(withoutExtension);

  if (normalizedSource.length > 0) {
    return normalizedSource;
  }

  return toTitleCase(descriptionOrTrigger).slice(0, 80);
}

function deriveVersionHint(sourceQuality: ExternalAssetSourceQuality): string {
  switch (sourceQuality) {
    case "internal_design_draft":
      return "draft";
    case "community_analysis":
      return "community-derived";
    case "official_external":
      return "verified-external";
    case "mixed":
      return "mixed-intake";
  }
}

export class W7NormalizedAssetCandidateContract {
  constructor(
    _dependencies: W7NormalizedAssetCandidateContractDependencies = {},
  ) {}

  compile(
    request: W7NormalizedAssetCandidateCompileRequest,
  ): W7NormalizedAssetCandidateCompileResult {
    const issues: W7NormalizedAssetCandidateCompileIssue[] = [];
    const normalizedProfile = request.intakeValidation.normalizedProfile;

    if (!request.intakeValidation.valid) {
      issues.push({
        field: "intakeValidation",
        code: "STAGE1_INVALID",
        message:
          "A valid external_intake_profile is required before W7 normalization can proceed.",
      });
    }

    const name =
      normalizeText(request.nameHint) ||
      deriveName(
        normalizedProfile.source_ref,
        normalizedProfile.description_or_trigger,
      );
    const versionHint =
      normalizeText(request.versionHint) ||
      deriveVersionHint(normalizedProfile.source_quality);
    const triggers =
      normalizeList(request.triggers).length > 0
        ? normalizeList(request.triggers)
        : [normalizedProfile.description_or_trigger];
    const domain = normalizeText(request.domain) || "external_asset";
    const phaseHints = normalizePhaseHints(
      request.phaseHints,
      normalizedProfile.candidate_asset_type,
    );

    if (name.length === 0) {
      issues.push({
        field: "normalized_header.name",
        code: "REQUIRED",
        message: "A normalized candidate name is required.",
      });
    }

    if (versionHint.length === 0) {
      issues.push({
        field: "normalized_header.version_hint",
        code: "REQUIRED",
        message: "A version_hint is required for W7 normalized candidates.",
      });
    }

    if (triggers.length === 0) {
      issues.push({
        field: "routing_metadata.triggers",
        code: "REQUIRED",
        message: "At least one routing trigger is required.",
      });
    }

    if (domain.length === 0) {
      issues.push({
        field: "routing_metadata.domain",
        code: "REQUIRED",
        message: "A routing domain is required.",
      });
    }

    if (issues.length > 0) {
      return {
        stage: "w7_normalized_asset_candidate",
        valid: false,
        issues,
      };
    }

    const candidate_id = computeDeterministicHash(
      "w7-normalized-asset-candidate",
      normalizedProfile.source_ref,
      normalizedProfile.candidate_asset_type,
      name,
      versionHint,
      domain,
      triggers.join("|"),
    );

    return {
      stage: "w7_normalized_asset_candidate",
      valid: true,
      issues: [],
      normalizedCandidate: {
        stage: "w7_normalized_asset_candidate",
        candidate_id,
        source_ref: normalizedProfile.source_ref,
        candidate_asset_type: normalizedProfile.candidate_asset_type,
        normalized_header: {
          name,
          description: normalizedProfile.description_or_trigger,
          version_hint: versionHint,
        },
        routing_metadata: {
          triggers,
          domain,
          phase_hints: phaseHints,
        },
        body: {
          instruction_payload: {
            description_or_trigger: normalizedProfile.description_or_trigger,
            instruction_body: normalizedProfile.instruction_body,
            provenance_notes: normalizedProfile.provenance_notes,
            source_kind: normalizedProfile.source_kind,
            source_quality: normalizedProfile.source_quality,
          },
        },
        enrichment: {
          references: normalizedProfile.references,
          examples: normalizedProfile.examples,
          tools: normalizedProfile.tools,
          templates: normalizedProfile.templates,
          execution_environment: normalizedProfile.execution_environment,
          ...(request.palaceVocabulary ?? {}),
        },
      },
    };
  }
}

export function createW7NormalizedAssetCandidateContract(
  dependencies?: W7NormalizedAssetCandidateContractDependencies,
): W7NormalizedAssetCandidateContract {
  return new W7NormalizedAssetCandidateContract(dependencies);
}
