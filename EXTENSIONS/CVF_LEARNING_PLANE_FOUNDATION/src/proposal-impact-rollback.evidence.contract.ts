import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export const PROPOSAL_IMPACT_ROLLBACK_EVIDENCE_VERSION =
  "cvf.proposal-impact-rollback-evidence.v1" as const;

export type ProposalImpactDecision =
  | "ACCEPT_CANDIDATE_EVIDENCE"
  | "REJECT_AND_ROLLBACK";

export type ProposalImpactIssueCode =
  | "MISSING_IDENTITY"
  | "MISSING_EVIDENCE_HASH"
  | "INVALID_SCORE"
  | "ACTIVE_INCUMBENT_MISMATCH"
  | "CANDIDATE_EQUALS_INCUMBENT";

export interface ProposalImpactRollbackEvidenceInput {
  proposalId: string;
  evaluatedAt: string;
  sourcePin: string;
  proposalDiffHash: string;
  rawEvidenceHash: string;
  persistentKnowledgeHash: string;
  incumbentSkillHash: string;
  candidateSkillHash: string;
  currentActiveSkillHash: string;
  incumbentScore: number;
  candidateScore: number;
}

export interface ProposalRollbackImpact {
  required: boolean;
  targetActiveSkillHash: string;
  rawEvidenceHashBefore: string;
  rawEvidenceHashAfter: string;
  persistentKnowledgeHashBefore: string;
  persistentKnowledgeHashAfter: string;
}

export interface ProposalImpactRollbackReceipt {
  schemaVersion: typeof PROPOSAL_IMPACT_ROLLBACK_EVIDENCE_VERSION;
  proposalId: string;
  evaluatedAt: string;
  sourcePin: string;
  proposalDiffHash: string;
  incumbentSkillHash: string;
  candidateSkillHash: string;
  incumbentScore: number;
  candidateScore: number;
  improvementDelta: number;
  strictImprovement: boolean;
  decision: ProposalImpactDecision;
  judgmentAuthority: "EVIDENCE_ONLY";
  activeSkillHash: string;
  proposedActiveSkillHash: string | null;
  rollbackImpact: ProposalRollbackImpact;
  receiptHash: string;
}

export interface ProposalImpactFailure {
  ok: false;
  issues: readonly ProposalImpactIssueCode[];
}

export interface ProposalImpactSuccess {
  ok: true;
  receipt: ProposalImpactRollbackReceipt;
}

export type ProposalImpactRollbackResult =
  | ProposalImpactFailure
  | ProposalImpactSuccess;

function present(value: string): boolean {
  return value.trim().length > 0;
}

export function evaluateProposalImpactRollback(
  input: ProposalImpactRollbackEvidenceInput,
): ProposalImpactRollbackResult {
  const issues: ProposalImpactIssueCode[] = [];
  if (!present(input.proposalId) || !present(input.evaluatedAt) || !present(input.sourcePin)) {
    issues.push("MISSING_IDENTITY");
  }
  if (
    !present(input.proposalDiffHash) ||
    !present(input.rawEvidenceHash) ||
    !present(input.persistentKnowledgeHash) ||
    !present(input.incumbentSkillHash) ||
    !present(input.candidateSkillHash) ||
    !present(input.currentActiveSkillHash)
  ) {
    issues.push("MISSING_EVIDENCE_HASH");
  }
  if (!Number.isFinite(input.incumbentScore) || !Number.isFinite(input.candidateScore)) {
    issues.push("INVALID_SCORE");
  }
  if (input.currentActiveSkillHash !== input.incumbentSkillHash) {
    issues.push("ACTIVE_INCUMBENT_MISMATCH");
  }
  if (input.candidateSkillHash === input.incumbentSkillHash) {
    issues.push("CANDIDATE_EQUALS_INCUMBENT");
  }
  if (issues.length > 0) return { ok: false, issues };

  const improvementDelta = input.candidateScore - input.incumbentScore;
  const strictImprovement = improvementDelta > 0;
  const decision: ProposalImpactDecision = strictImprovement
    ? "ACCEPT_CANDIDATE_EVIDENCE"
    : "REJECT_AND_ROLLBACK";
  const proposedActiveSkillHash = strictImprovement ? input.candidateSkillHash : null;

  const rollbackImpact: ProposalRollbackImpact = {
    required: !strictImprovement,
    targetActiveSkillHash: input.incumbentSkillHash,
    rawEvidenceHashBefore: input.rawEvidenceHash,
    rawEvidenceHashAfter: input.rawEvidenceHash,
    persistentKnowledgeHashBefore: input.persistentKnowledgeHash,
    persistentKnowledgeHashAfter: input.persistentKnowledgeHash,
  };

  const receiptHash = computeDeterministicHash(
    PROPOSAL_IMPACT_ROLLBACK_EVIDENCE_VERSION,
    input.proposalId,
    input.evaluatedAt,
    input.sourcePin,
    input.proposalDiffHash,
    input.rawEvidenceHash,
    input.persistentKnowledgeHash,
    input.incumbentSkillHash,
    input.candidateSkillHash,
    `${input.incumbentScore}`,
    `${input.candidateScore}`,
    decision,
  );

  return {
    ok: true,
    receipt: {
      schemaVersion: PROPOSAL_IMPACT_ROLLBACK_EVIDENCE_VERSION,
      proposalId: input.proposalId,
      evaluatedAt: input.evaluatedAt,
      sourcePin: input.sourcePin,
      proposalDiffHash: input.proposalDiffHash,
      incumbentSkillHash: input.incumbentSkillHash,
      candidateSkillHash: input.candidateSkillHash,
      incumbentScore: input.incumbentScore,
      candidateScore: input.candidateScore,
      improvementDelta,
      strictImprovement,
      decision,
      judgmentAuthority: "EVIDENCE_ONLY",
      activeSkillHash: input.incumbentSkillHash,
      proposedActiveSkillHash,
      rollbackImpact,
      receiptHash,
    },
  };
}
