export type SkillRiskClass = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SkillEvolutionTrigger =
  | "EXECUTION_FAILURE"
  | "QUALITY_DROP"
  | "USER_CORRECTION"
  | "AUDIT_DOWNGRADE"
  | "POLICY_NEAR_MISS"
  | "STALE_REFERENCE"
  | "TOKEN_COST_SPIKE"
  | "TOOL_USE_ERROR"
  | "VERIFICATION_FAILURE";

export type SkillMutationType =
  | "PATCH_EXISTING_SKILL"
  | "CREATE_NEW_SKILL"
  | "DEPRECATE_SKILL"
  | "SPLIT_SKILL"
  | "MERGE_SKILL"
  | "RESTRICT_SKILL_SCOPE"
  | "RAISE_SKILL_RISK_CLASS"
  | "LOWER_SKILL_RISK_CLASS";

export type SkillApprovalClass =
  | "AUTO_REJECT"
  | "SANDBOX_ONLY"
  | "HUMAN_REVIEW_REQUIRED"
  | "POLICY_REVIEW_REQUIRED"
  | "APPROVED_FOR_PROBATION"
  | "APPROVED_FOR_PRODUCTION";

export type SkillEvolutionStatus =
  | "NO_ACTION"
  | "PROPOSAL_CREATED"
  | "PROPOSAL_REJECTED"
  | "PROPOSAL_VERIFIED"
  | "PROPOSAL_APPROVED_FOR_PROBATION"
  | "PROPOSAL_APPROVED_FOR_PRODUCTION"
  | "PROPOSAL_REINJECTED";

export interface SkillIdentity {
  skillId: string;
  name: string;
  version: string;
  domain: string;
  riskClass: SkillRiskClass;
}

export interface SkillFailureSignal {
  signalId: string;
  skill: SkillIdentity;
  trigger: SkillEvolutionTrigger;
  occurredAt: string;
  source: "EXECUTION_PLANE" | "LEARNING_PLANE" | "AUDIT_LAYER" | "USER_FEEDBACK";
  summary: string;
  evidenceRefs: string[];
  severity: SkillRiskClass;
}

export interface SkillReflectionResult {
  reflectionId: string;
  signalId: string;
  skill: SkillIdentity;
  rootCause:
    | "MISSING_INSTRUCTION"
    | "AMBIGUOUS_SCOPE"
    | "STALE_KNOWLEDGE"
    | "WRONG_TOOL_BOUNDARY"
    | "INSUFFICIENT_PRECONDITION"
    | "UNSAFE_EXECUTION_PATH"
    | "LOW_OUTPUT_QUALITY"
    | "UNKNOWN";
  confidence: number;
  recommendation: SkillMutationType;
  rationale: string;
  evidenceRefs: string[];
}

export interface SkillMutationProposal {
  proposalId: string;
  createdAt: string;
  sourceReflectionId: string;
  skill: SkillIdentity;
  mutationType: SkillMutationType;
  proposedVersion: string;
  proposedPatch: string;
  expectedBenefit: string;
  riskImpact: SkillRiskClass;
  requiresHumanReview: boolean;
  evidenceRefs: string[];
  productionWriteAllowed: false;
}

export interface SkillVerificationInput {
  sandboxPassed: boolean;
  policyPassed: boolean;
  regressionPassed: boolean;
  securityPassed: boolean;
  positiveEvidenceRefs?: string[];
  errors?: string[];
  warnings?: string[];
}

export interface SkillVerificationResult {
  verificationId: string;
  proposalId: string;
  verifiedAt: string;
  sandboxPassed: boolean;
  policyPassed: boolean;
  regressionPassed: boolean;
  securityPassed: boolean;
  approvalClass: SkillApprovalClass;
  errors: string[];
  warnings: string[];
  evidenceRefs: string[];
}

export interface SkillReinjectionDecision {
  decisionId: string;
  proposalId: string;
  verificationId: string;
  status: SkillEvolutionStatus;
  targetPath: string;
  probationRequired: boolean;
  approvedBy: "POLICY" | "HUMAN" | "SYSTEM";
  decidedAt: string;
  notes: string;
  productionWriteAllowed: boolean;
}

export interface SkillEvolutionReceipt {
  receiptId: string;
  proposalId: string;
  skill: SkillIdentity;
  finalStatus: SkillEvolutionStatus;
  createdAt: string;
  lineage: {
    signalId: string;
    reflectionId: string;
    verificationId?: string;
    decisionId?: string;
  };
  evidenceRefs: string[];
  immutable: true;
}

export interface GovernedSkillEvolutionContractDependencies {
  now?: () => string;
  id?: (prefix: string, parts: string[]) => string;
}

const RISK_ORDER: Record<SkillRiskClass, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const GOVERNED_TARGET_PREFIXES = [
  "EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/",
  "docs/reference/",
  "governance/toolkit/",
];

function normalize(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`GovernedSkillEvolution requires ${fieldName}`);
  }
  return normalized;
}

function stableId(prefix: string, parts: string[]): string {
  let hash = 2166136261;
  for (const char of `${prefix}:${parts.join("|")}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class GovernedSkillEvolutionContract {
  private readonly now: () => string;
  private readonly id: (prefix: string, parts: string[]) => string;

  constructor(dependencies: GovernedSkillEvolutionContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.id = dependencies.id ?? stableId;
  }

  reflect(signal: SkillFailureSignal): SkillReflectionResult {
    this.validateSignal(signal);
    const rootCause = this.inferRootCause(signal);
    const recommendation = this.recommendMutation(signal, rootCause);
    const reflectionId = this.id("skill-reflection", [signal.signalId, rootCause, recommendation]);
    return {
      reflectionId,
      signalId: signal.signalId,
      skill: signal.skill,
      rootCause,
      confidence: rootCause === "UNKNOWN" ? 0.45 : 0.8,
      recommendation,
      rationale: `Trigger ${signal.trigger} mapped to ${rootCause}; propose ${recommendation}.`,
      evidenceRefs: [...signal.evidenceRefs],
    };
  }

  planMutation(reflection: SkillReflectionResult, proposedPatch: string): SkillMutationProposal {
    normalize(reflection.reflectionId, "reflectionId");
    const patch = normalize(proposedPatch, "proposedPatch");
    const createdAt = this.now();
    const riskImpact = this.mutationRisk(reflection.skill.riskClass, reflection.recommendation);
    const proposalId = this.id("skill-proposal", [
      reflection.reflectionId,
      reflection.skill.skillId,
      reflection.recommendation,
      patch,
      createdAt,
    ]);
    return {
      proposalId,
      createdAt,
      sourceReflectionId: reflection.reflectionId,
      skill: reflection.skill,
      mutationType: reflection.recommendation,
      proposedVersion: this.nextVersion(reflection.skill.version),
      proposedPatch: patch,
      expectedBenefit: reflection.rationale,
      riskImpact,
      requiresHumanReview: riskImpact === "HIGH" || riskImpact === "CRITICAL",
      evidenceRefs: [...reflection.evidenceRefs],
      productionWriteAllowed: false,
    };
  }

  verifyProposal(
    proposal: SkillMutationProposal,
    input: SkillVerificationInput,
  ): SkillVerificationResult {
    const errors = [...(input.errors ?? [])];
    const warnings = [...(input.warnings ?? [])];
    if (!input.sandboxPassed) errors.push("sandbox verification failed");
    if (!input.policyPassed) errors.push("policy verification failed");
    if (!input.regressionPassed) errors.push("regression verification failed");
    if (!input.securityPassed) errors.push("security verification failed");
    if (
      proposal.mutationType === "LOWER_SKILL_RISK_CLASS" &&
      (input.positiveEvidenceRefs ?? []).length === 0
    ) {
      errors.push("risk lowering requires positive evidence");
    }

    const hardPassed = errors.length === 0;
    const approvalClass = this.approvalClass(proposal, hardPassed);
    return {
      verificationId: this.id("skill-verification", [proposal.proposalId, approvalClass, this.now()]),
      proposalId: proposal.proposalId,
      verifiedAt: this.now(),
      sandboxPassed: input.sandboxPassed,
      policyPassed: input.policyPassed,
      regressionPassed: input.regressionPassed,
      securityPassed: input.securityPassed,
      approvalClass,
      errors,
      warnings,
      evidenceRefs: [...proposal.evidenceRefs, ...(input.positiveEvidenceRefs ?? [])],
    };
  }

  decideReinjection(
    proposal: SkillMutationProposal,
    verification: SkillVerificationResult,
    targetPath: string,
    approvedBy: "POLICY" | "HUMAN" | "SYSTEM",
  ): SkillReinjectionDecision {
    const target = normalize(targetPath, "targetPath");
    const pathAllowed = GOVERNED_TARGET_PREFIXES.some((prefix) => target.startsWith(prefix));
    const errors: string[] = [];
    if (verification.proposalId !== proposal.proposalId) errors.push("verification/proposal mismatch");
    if (!pathAllowed) errors.push("target path is not governed");
    if (verification.approvalClass === "AUTO_REJECT" || verification.errors.length > 0) {
      errors.push("verification did not pass");
    }
    if (proposal.requiresHumanReview && approvedBy !== "HUMAN") {
      errors.push("human approval required");
    }

    const canReinject = errors.length === 0 &&
      (verification.approvalClass === "APPROVED_FOR_PROBATION" ||
        verification.approvalClass === "APPROVED_FOR_PRODUCTION");
    const status: SkillEvolutionStatus = canReinject
      ? verification.approvalClass === "APPROVED_FOR_PRODUCTION"
        ? "PROPOSAL_APPROVED_FOR_PRODUCTION"
        : "PROPOSAL_APPROVED_FOR_PROBATION"
      : "PROPOSAL_REJECTED";

    return {
      decisionId: this.id("skill-decision", [proposal.proposalId, verification.verificationId, target, status]),
      proposalId: proposal.proposalId,
      verificationId: verification.verificationId,
      status,
      targetPath: target,
      probationRequired: status === "PROPOSAL_APPROVED_FOR_PROBATION",
      approvedBy,
      decidedAt: this.now(),
      notes: errors.length > 0 ? errors.join("; ") : "governed reinjection approved",
      productionWriteAllowed: status === "PROPOSAL_APPROVED_FOR_PRODUCTION",
    };
  }

  issueReceipt(
    signal: SkillFailureSignal,
    reflection: SkillReflectionResult,
    proposal: SkillMutationProposal,
    verification?: SkillVerificationResult,
    decision?: SkillReinjectionDecision,
  ): SkillEvolutionReceipt {
    return {
      receiptId: this.id("skill-receipt", [
        signal.signalId,
        reflection.reflectionId,
        proposal.proposalId,
        verification?.verificationId ?? "no-verification",
        decision?.decisionId ?? "no-decision",
      ]),
      proposalId: proposal.proposalId,
      skill: proposal.skill,
      finalStatus: decision?.status ?? (verification ? "PROPOSAL_VERIFIED" : "PROPOSAL_CREATED"),
      createdAt: this.now(),
      lineage: {
        signalId: signal.signalId,
        reflectionId: reflection.reflectionId,
        verificationId: verification?.verificationId,
        decisionId: decision?.decisionId,
      },
      evidenceRefs: [
        ...signal.evidenceRefs,
        ...reflection.evidenceRefs,
        ...proposal.evidenceRefs,
        ...(verification?.evidenceRefs ?? []),
      ],
      immutable: true,
    };
  }

  private validateSignal(signal: SkillFailureSignal): void {
    normalize(signal.signalId, "signalId");
    normalize(signal.skill.skillId, "skill.skillId");
    normalize(signal.skill.name, "skill.name");
    normalize(signal.summary, "summary");
    if (signal.evidenceRefs.length === 0) {
      throw new Error("GovernedSkillEvolution requires evidenceRefs");
    }
  }

  private inferRootCause(signal: SkillFailureSignal): SkillReflectionResult["rootCause"] {
    const text = `${signal.trigger} ${signal.summary}`.toLowerCase();
    if (text.includes("stale")) return "STALE_KNOWLEDGE";
    if (text.includes("tool")) return "WRONG_TOOL_BOUNDARY";
    if (text.includes("unsafe") || text.includes("policy")) return "UNSAFE_EXECUTION_PATH";
    if (text.includes("quality")) return "LOW_OUTPUT_QUALITY";
    if (text.includes("precondition")) return "INSUFFICIENT_PRECONDITION";
    if (text.includes("ambiguous")) return "AMBIGUOUS_SCOPE";
    if (text.includes("missing")) return "MISSING_INSTRUCTION";
    return "UNKNOWN";
  }

  private recommendMutation(
    signal: SkillFailureSignal,
    rootCause: SkillReflectionResult["rootCause"],
  ): SkillMutationType {
    if (signal.trigger === "POLICY_NEAR_MISS" || rootCause === "UNSAFE_EXECUTION_PATH") {
      return "RESTRICT_SKILL_SCOPE";
    }
    if (signal.trigger === "STALE_REFERENCE" || rootCause === "STALE_KNOWLEDGE") {
      return "PATCH_EXISTING_SKILL";
    }
    if (rootCause === "AMBIGUOUS_SCOPE") return "SPLIT_SKILL";
    if (signal.trigger === "VERIFICATION_FAILURE") return "RAISE_SKILL_RISK_CLASS";
    return "PATCH_EXISTING_SKILL";
  }

  private mutationRisk(current: SkillRiskClass, mutation: SkillMutationType): SkillRiskClass {
    if (mutation === "LOWER_SKILL_RISK_CLASS") return current;
    if (mutation === "RAISE_SKILL_RISK_CLASS" || mutation === "RESTRICT_SKILL_SCOPE") {
      return RISK_ORDER[current] >= RISK_ORDER.HIGH ? "CRITICAL" : "HIGH";
    }
    if (mutation === "CREATE_NEW_SKILL" || mutation === "MERGE_SKILL") return "HIGH";
    return current;
  }

  private nextVersion(version: string): string {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
    if (!match) return `${version}.proposal`;
    return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
  }

  private approvalClass(proposal: SkillMutationProposal, hardPassed: boolean): SkillApprovalClass {
    if (!hardPassed) return "AUTO_REJECT";
    if (proposal.riskImpact === "CRITICAL") return "POLICY_REVIEW_REQUIRED";
    if (proposal.requiresHumanReview) return "HUMAN_REVIEW_REQUIRED";
    if (proposal.mutationType === "PATCH_EXISTING_SKILL") return "APPROVED_FOR_PRODUCTION";
    return "APPROVED_FOR_PROBATION";
  }
}

export function createGovernedSkillEvolutionContract(
  dependencies?: GovernedSkillEvolutionContractDependencies,
): GovernedSkillEvolutionContract {
  return new GovernedSkillEvolutionContract(dependencies);
}
