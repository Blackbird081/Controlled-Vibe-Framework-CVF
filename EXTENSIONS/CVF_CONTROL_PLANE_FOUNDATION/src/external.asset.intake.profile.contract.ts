export type ExternalAssetSourceKind =
  | "repo"
  | "folder"
  | "archive"
  | "document_bundle";

export type ExternalAssetSourceQuality =
  | "internal_design_draft"
  | "community_analysis"
  | "official_external"
  | "mixed";

export type W7CandidateAssetType =
  | "W7CommandAsset"
  | "W7PolicyAsset"
  | "W7ContextAsset"
  | "W7SkillAsset"
  | "W7AgentAsset"
  | "W7PlannerAsset"
  | "W7ToolAsset"
  | "W7LearningAsset";

export type ExecutionEnvironmentOS = "windows" | "linux" | "macos";

export type ExecutionEnvironmentShell =
  | "powershell"
  | "bash"
  | "zsh"
  | "sh";

export type ExecutionEnvironmentScriptType =
  | "ps1"
  | "sh"
  | "zsh"
  | "cmd"
  | "bat";

export type ExecutionEnvironmentCompatibility = "native" | "cross-platform";

export interface ExternalAssetExecutionEnvironment {
  os: ExecutionEnvironmentOS;
  shell: ExecutionEnvironmentShell;
  shell_version: string;
  script_type: ExecutionEnvironmentScriptType;
  compatibility: ExecutionEnvironmentCompatibility;
}

export interface ExternalAssetIntakeProfile {
  source_ref: string;
  source_kind: ExternalAssetSourceKind;
  source_quality: ExternalAssetSourceQuality;
  officially_verified: boolean;
  provenance_notes: string;
  candidate_asset_type: W7CandidateAssetType;
  description_or_trigger: string;
  instruction_body: string;
  references?: string[];
  examples?: string[];
  tools?: string[];
  templates?: string[];
  execution_environment?: ExternalAssetExecutionEnvironment;
}

export interface ExternalAssetIntakeValidationIssue {
  field: string;
  code: "REQUIRED" | "REQUIRED_WHEN" | "INVALID_COMBINATION";
  message: string;
}

export interface ValidatedExternalAssetIntakeProfile
  extends ExternalAssetIntakeProfile {
  references: string[];
  examples: string[];
  tools: string[];
  templates: string[];
  execution_environment?: ExternalAssetExecutionEnvironment;
}

export interface ExternalAssetIntakeValidationResult {
  stage: "external_intake_profile";
  valid: boolean;
  issues: ExternalAssetIntakeValidationIssue[];
  normalizedProfile: ValidatedExternalAssetIntakeProfile;
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

function normalizeExecutionEnvironment(
  environment: ExternalAssetExecutionEnvironment | undefined,
): ExternalAssetExecutionEnvironment | undefined {
  if (environment === undefined) {
    return undefined;
  }

  return {
    os: environment.os,
    shell: environment.shell,
    shell_version: normalizeText(environment.shell_version),
    script_type: environment.script_type,
    compatibility: environment.compatibility,
  };
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function hasExecutableCodeBlocks(value: string): boolean {
  const fencedCodeBlockPattern = /```([a-zA-Z0-9_+-]*)\s*\n[\s\S]*?```/g;
  const executableLanguages = new Set([
    "powershell",
    "pwsh",
    "ps1",
    "bash",
    "sh",
    "zsh",
    "shell",
    "cmd",
    "bat",
    "batch",
  ]);

  for (const match of value.matchAll(fencedCodeBlockPattern)) {
    const language = normalizeText(match[1]);
    if (executableLanguages.has(language)) {
      return true;
    }
  }

  return false;
}

export class ExternalAssetIntakeProfileContract {
  validate(
    profile: ExternalAssetIntakeProfile,
  ): ExternalAssetIntakeValidationResult {
    const normalizedProfile: ValidatedExternalAssetIntakeProfile = {
      source_ref: normalizeText(profile.source_ref),
      source_kind: profile.source_kind,
      source_quality: profile.source_quality,
      officially_verified: profile.officially_verified,
      provenance_notes: normalizeText(profile.provenance_notes),
      candidate_asset_type: profile.candidate_asset_type,
      description_or_trigger: normalizeText(profile.description_or_trigger),
      instruction_body: normalizeText(profile.instruction_body),
      references: normalizeList(profile.references),
      examples: normalizeList(profile.examples),
      tools: normalizeList(profile.tools),
      templates: normalizeList(profile.templates),
      execution_environment: normalizeExecutionEnvironment(
        profile.execution_environment,
      ),
    };

    const issues: ExternalAssetIntakeValidationIssue[] = [];

    const requiredTextFields: Array<
      keyof Pick<
        ValidatedExternalAssetIntakeProfile,
        | "source_ref"
        | "provenance_notes"
        | "description_or_trigger"
        | "instruction_body"
      >
    > = [
      "source_ref",
      "provenance_notes",
      "description_or_trigger",
      "instruction_body",
    ];

    for (const field of requiredTextFields) {
      if (!isNonEmpty(normalizedProfile[field])) {
        issues.push({
          field,
          code: "REQUIRED",
          message: `${field} is required for external_intake_profile.`,
        });
      }
    }

    if (
      normalizedProfile.source_quality === "official_external" &&
      normalizedProfile.officially_verified !== true
    ) {
      issues.push({
        field: "officially_verified",
        code: "INVALID_COMBINATION",
        message:
          "officially_verified must be true when source_quality is official_external.",
      });
    }

    if (
      normalizedProfile.candidate_asset_type === "W7ToolAsset" &&
      normalizedProfile.tools.length === 0
    ) {
      issues.push({
        field: "tools",
        code: "REQUIRED_WHEN",
        message:
          "tools is required when candidate_asset_type is W7ToolAsset.",
      });
    }

    if (normalizedProfile.execution_environment !== undefined) {
      const requiredExecutionEnvironmentTextFields: Array<
        keyof Pick<ExternalAssetExecutionEnvironment, "shell_version">
      > = ["shell_version"];

      for (const field of requiredExecutionEnvironmentTextFields) {
        if (!isNonEmpty(normalizedProfile.execution_environment[field])) {
          issues.push({
            field: `execution_environment.${field}`,
            code: "REQUIRED",
            message: `${field} is required when execution_environment is declared.`,
          });
        }
      }
    }

    const requiresExecutionEnvironment =
      normalizedProfile.candidate_asset_type === "W7SkillAsset" &&
      hasExecutableCodeBlocks(
        [
          normalizedProfile.instruction_body,
          ...normalizedProfile.examples,
          ...normalizedProfile.templates,
        ].join("\n"),
      );

    if (
      requiresExecutionEnvironment &&
      normalizedProfile.execution_environment === undefined
    ) {
      issues.push({
        field: "execution_environment",
        code: "REQUIRED_WHEN",
        message:
          "execution_environment is required when candidate_asset_type is W7SkillAsset and executable code blocks are present.",
      });
    }

    return {
      stage: "external_intake_profile",
      valid: issues.length === 0,
      issues,
      normalizedProfile,
    };
  }
}

export function createExternalAssetIntakeProfileContract(): ExternalAssetIntakeProfileContract {
  return new ExternalAssetIntakeProfileContract();
}
