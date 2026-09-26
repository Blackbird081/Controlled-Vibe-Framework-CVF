import { describe, expect, it } from "vitest";
import {
  evaluateProposalImpactRollback,
  type ProposalImpactRollbackEvidenceInput,
} from "../src/proposal-impact-rollback.evidence.contract";

const baseInput = (): ProposalImpactRollbackEvidenceInput => ({
  proposalId: "wiki-proposal-001",
  evaluatedAt: "2026-09-25T00:00:00.000Z",
  sourcePin: "03633345829c452680d18a17004afd33eee729da",
  proposalDiffHash: "diff-sha256",
  rawEvidenceHash: "raw-trace-sha256",
  persistentKnowledgeHash: "knowledge-sha256",
  incumbentSkillHash: "skill-incumbent-sha256",
  candidateSkillHash: "skill-candidate-sha256",
  currentActiveSkillHash: "skill-incumbent-sha256",
  incumbentScore: 0.5,
  candidateScore: 0.75,
});

describe("proposal impact and rollback evidence", () => {
  it("accepts only strict improvement as candidate evidence", () => {
    const result = evaluateProposalImpactRollback(baseInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.decision).toBe("ACCEPT_CANDIDATE_EVIDENCE");
    expect(result.receipt.strictImprovement).toBe(true);
    expect(result.receipt.improvementDelta).toBeCloseTo(0.25);
    expect(result.receipt.proposedActiveSkillHash).toBe("skill-candidate-sha256");
  });

  it("keeps accepted evidence non-authoritative and does not activate the candidate", () => {
    const result = evaluateProposalImpactRollback(baseInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.judgmentAuthority).toBe("EVIDENCE_ONLY");
    expect(result.receipt.activeSkillHash).toBe("skill-incumbent-sha256");
  });

  it("rejects a tied score and rolls active skill back to the incumbent", () => {
    const result = evaluateProposalImpactRollback({
      ...baseInput(),
      candidateScore: 0.5,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.decision).toBe("REJECT_AND_ROLLBACK");
    expect(result.receipt.rollbackImpact.required).toBe(true);
    expect(result.receipt.rollbackImpact.targetActiveSkillHash).toBe("skill-incumbent-sha256");
  });

  it("rejects regression and preserves raw evidence and persistent knowledge", () => {
    const input = { ...baseInput(), candidateScore: 0.25 };
    const result = evaluateProposalImpactRollback(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.rollbackImpact.rawEvidenceHashAfter).toBe(input.rawEvidenceHash);
    expect(result.receipt.rollbackImpact.persistentKnowledgeHashAfter).toBe(
      input.persistentKnowledgeHash,
    );
    expect(result.receipt.proposedActiveSkillHash).toBeNull();
  });

  it("fails closed when the evaluated incumbent is not the active skill", () => {
    const result = evaluateProposalImpactRollback({
      ...baseInput(),
      currentActiveSkillHash: "different-active-skill",
    });
    expect(result).toEqual({ ok: false, issues: ["ACTIVE_INCUMBENT_MISMATCH"] });
  });

  it("fails closed when the proposal has no exact diff hash", () => {
    const result = evaluateProposalImpactRollback({ ...baseInput(), proposalDiffHash: "" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContain("MISSING_EVIDENCE_HASH");
  });

  it("fails closed for non-finite scores", () => {
    const result = evaluateProposalImpactRollback({ ...baseInput(), candidateScore: Number.NaN });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContain("INVALID_SCORE");
  });

  it("produces a deterministic receipt for the same proposal evidence", () => {
    const first = evaluateProposalImpactRollback(baseInput());
    const second = evaluateProposalImpactRollback(baseInput());
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.receipt.receiptHash).toBe(second.receipt.receiptHash);
  });
});
