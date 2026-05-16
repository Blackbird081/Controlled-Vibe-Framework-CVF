import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export type OpenSpecArtifactKind =
  | "proposal.md"
  | "design.md"
  | "tasks.md"
  | "apply"
  | "verify"
  | "archive"
  | "sync";

export type CvfPhase = "INTAKE" | "DESIGN" | "BUILD" | "REVIEW" | "FREEZE";
export type OpenSpecDeltaKind = "ADDED" | "MODIFIED" | "REMOVED" | "RENAMED";
export type OpenSpecAdapterDecision =
  | "accepted_as_packet"
  | "review_required"
  | "blocked_direct_authority";

export interface OpenSpecChangeArtifact {
  kind: OpenSpecArtifactKind;
  path: string;
  content: string;
}

export interface OpenSpecDeltaSpec {
  kind: OpenSpecDeltaKind;
  summary: string;
  riskImpact?: string;
  policyImpact?: string;
  approvalImpact?: string;
  dlpImpact?: string;
  rollbackNote?: string;
  evidenceRequired?: string;
  renamedFrom?: string;
  renamedTo?: string;
}

export interface OpenSpecChangePacketInput {
  changeId: string;
  requestedBy: string;
  artifacts: OpenSpecChangeArtifact[];
  deltas: OpenSpecDeltaSpec[];
  allowDirectApply?: boolean;
  allowCanonicalOverwrite?: boolean;
}

export interface OpenSpecPhaseMapping {
  artifactKind: OpenSpecArtifactKind;
  cvfPhases: CvfPhase[];
  authority: "input_only" | "governed_request" | "evidence_input" | "archive_candidate" | "sync_candidate";
  directExecutionAllowed: boolean;
}

export interface OpenSpecDeltaValidation {
  deltaKind: OpenSpecDeltaKind;
  valid: boolean;
  missingGovernanceFields: string[];
  violations: string[];
}

export interface OpenSpecArchiveSyncBoundary {
  archiveCandidateOnly: boolean;
  syncCandidateOnly: boolean;
  canonicalOverwriteAllowed: boolean;
  freezeRequired: boolean;
  receiptRequired: boolean;
  blockedReasons: string[];
}

export interface GovernedOpenSpecChangePacket {
  packetId: string;
  changeId: string;
  requestedBy: string;
  createdAt: string;
  mappings: OpenSpecPhaseMapping[];
  deltaValidations: OpenSpecDeltaValidation[];
  archiveSyncBoundary: OpenSpecArchiveSyncBoundary;
  decision: OpenSpecAdapterDecision;
  requiredCvfPhases: CvfPhase[];
  evidenceRequired: string[];
  violations: string[];
}

export interface OpenSpecChangeAdapterContractDependencies {
  now?: () => string;
}

const REQUIRED_GOVERNANCE_FIELDS: Array<keyof OpenSpecDeltaSpec> = [
  "riskImpact",
  "policyImpact",
  "approvalImpact",
  "dlpImpact",
  "rollbackNote",
  "evidenceRequired",
];

const PHASE_MAPPING: Record<OpenSpecArtifactKind, Omit<OpenSpecPhaseMapping, "artifactKind">> = {
  "proposal.md": {
    cvfPhases: ["INTAKE", "DESIGN"],
    authority: "input_only",
    directExecutionAllowed: false,
  },
  "design.md": {
    cvfPhases: ["DESIGN", "BUILD"],
    authority: "input_only",
    directExecutionAllowed: false,
  },
  "tasks.md": {
    cvfPhases: ["BUILD"],
    authority: "input_only",
    directExecutionAllowed: false,
  },
  apply: {
    cvfPhases: ["BUILD"],
    authority: "governed_request",
    directExecutionAllowed: false,
  },
  verify: {
    cvfPhases: ["REVIEW"],
    authority: "evidence_input",
    directExecutionAllowed: false,
  },
  archive: {
    cvfPhases: ["FREEZE"],
    authority: "archive_candidate",
    directExecutionAllowed: false,
  },
  sync: {
    cvfPhases: ["REVIEW", "FREEZE"],
    authority: "sync_candidate",
    directExecutionAllowed: false,
  },
};

function normalizeText(value: string | undefined, fieldName: string): string {
  const normalized = (value ?? "").trim();
  if (normalized.length === 0) {
    throw new Error(`OpenSpecChangeAdapter requires ${fieldName}`);
  }
  return normalized;
}

function uniquePhases(mappings: OpenSpecPhaseMapping[]): CvfPhase[] {
  const phases = new Set<CvfPhase>();
  for (const mapping of mappings) {
    for (const phase of mapping.cvfPhases) phases.add(phase);
  }
  return [...phases];
}

export class OpenSpecChangeAdapterContract {
  private readonly now: () => string;

  constructor(dependencies: OpenSpecChangeAdapterContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  adapt(input: OpenSpecChangePacketInput): GovernedOpenSpecChangePacket {
    const changeId = normalizeText(input.changeId, "changeId");
    const requestedBy = normalizeText(input.requestedBy, "requestedBy");
    if (input.artifacts.length === 0) {
      throw new Error("OpenSpecChangeAdapter requires at least one artifact");
    }
    if (input.deltas.length === 0) {
      throw new Error("OpenSpecChangeAdapter requires at least one delta");
    }

    const mappings = input.artifacts.map((artifact) => this.mapArtifact(artifact));
    const deltaValidations = input.deltas.map((delta) => this.validateDelta(delta));
    const archiveSyncBoundary = this.evaluateArchiveSyncBoundary(input, mappings);
    const violations = [
      ...deltaValidations.flatMap((validation) => validation.violations),
      ...archiveSyncBoundary.blockedReasons,
    ];
    const decision = this.decide(violations, mappings);
    const evidenceRequired = input.deltas
      .map((delta) => delta.evidenceRequired?.trim())
      .filter((value): value is string => Boolean(value));
    const createdAt = this.now();
    const packetId = computeDeterministicHash(
      "cvf-openspec-change-adapter",
      changeId,
      requestedBy,
      createdAt,
      JSON.stringify(mappings),
      JSON.stringify(deltaValidations),
    );

    return {
      packetId,
      changeId,
      requestedBy,
      createdAt,
      mappings,
      deltaValidations,
      archiveSyncBoundary,
      decision,
      requiredCvfPhases: uniquePhases(mappings),
      evidenceRequired,
      violations,
    };
  }

  private mapArtifact(artifact: OpenSpecChangeArtifact): OpenSpecPhaseMapping {
    normalizeText(artifact.path, "artifact.path");
    normalizeText(artifact.content, "artifact.content");
    return {
      artifactKind: artifact.kind,
      ...PHASE_MAPPING[artifact.kind],
    };
  }

  private validateDelta(delta: OpenSpecDeltaSpec): OpenSpecDeltaValidation {
    const violations: string[] = [];
    const summary = normalizeText(delta.summary, "delta.summary");
    const missingGovernanceFields = REQUIRED_GOVERNANCE_FIELDS.filter((field) => {
      const value = delta[field];
      return typeof value !== "string" || value.trim().length === 0;
    }).map((field) => field.toString());

    if (delta.kind === "RENAMED") {
      if (!delta.renamedFrom?.trim() || !delta.renamedTo?.trim()) {
        violations.push("RENAMED delta requires renamedFrom and renamedTo");
      }
      if (/behavior|logic|policy|approval/i.test(summary)) {
        violations.push("RENAMED delta must not hide behavior changes");
      }
    }
    if (delta.kind === "REMOVED" && !/rollback|deprecat|remove|disable/i.test(delta.rollbackNote ?? "")) {
      violations.push("REMOVED delta requires explicit rollback or deprecation note");
    }
    if (missingGovernanceFields.length > 0) {
      violations.push(`missing governance fields: ${missingGovernanceFields.join(", ")}`);
    }

    return {
      deltaKind: delta.kind,
      valid: violations.length === 0,
      missingGovernanceFields,
      violations,
    };
  }

  private evaluateArchiveSyncBoundary(
    input: OpenSpecChangePacketInput,
    mappings: OpenSpecPhaseMapping[],
  ): OpenSpecArchiveSyncBoundary {
    const hasArchive = mappings.some((mapping) => mapping.artifactKind === "archive");
    const hasSync = mappings.some((mapping) => mapping.artifactKind === "sync");
    const hasApply = mappings.some((mapping) => mapping.artifactKind === "apply");
    const blockedReasons: string[] = [];

    if (hasApply && input.allowDirectApply) {
      blockedReasons.push("OpenSpec apply cannot bypass CVF governed execution");
    }
    if ((hasArchive || hasSync) && input.allowCanonicalOverwrite) {
      blockedReasons.push("OpenSpec archive/sync cannot overwrite canonical CVF truth");
    }

    return {
      archiveCandidateOnly: hasArchive,
      syncCandidateOnly: hasSync,
      canonicalOverwriteAllowed: false,
      freezeRequired: hasArchive || hasSync,
      receiptRequired: hasArchive || hasSync || hasApply,
      blockedReasons,
    };
  }

  private decide(violations: string[], mappings: OpenSpecPhaseMapping[]): OpenSpecAdapterDecision {
    if (violations.some((violation) => /bypass|overwrite/.test(violation))) {
      return "blocked_direct_authority";
    }
    if (violations.length > 0 || mappings.some((mapping) => mapping.artifactKind === "archive" || mapping.artifactKind === "sync")) {
      return "review_required";
    }
    return "accepted_as_packet";
  }
}

export function createOpenSpecChangeAdapterContract(
  dependencies?: OpenSpecChangeAdapterContractDependencies,
): OpenSpecChangeAdapterContract {
  return new OpenSpecChangeAdapterContract(dependencies);
}
