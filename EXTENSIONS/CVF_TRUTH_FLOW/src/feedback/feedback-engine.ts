import type { FeedbackProposal, FeedbackReviewStatus } from "../types/feedback-proposal.js";
import type { IdFactory } from "../deps.js";

export type FeedbackRejectionReason = "PROPOSAL_NOT_FOUND" | "PROPOSAL_NOT_REVIEWABLE";

export interface FeedbackSubmissionResult {
  submitted: boolean;
  proposal?: FeedbackProposal;
}

export interface FeedbackActionResult {
  succeeded: boolean;
  proposal?: FeedbackProposal;
  reasons: FeedbackRejectionReason[];
}

const ALLOWED_REVIEW_TRANSITIONS: Readonly<Record<FeedbackReviewStatus, readonly FeedbackReviewStatus[]>> = {
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
};

/**
 * Proposal-only feedback path (T2 contract chain section 8; T2 Invariant
 * 9; NC-12). This engine exposes no function that writes to a
 * Kernel-owned authority record, evidence record, or source score.
 * `no_direct_mutation_flag` is always `true` on every produced proposal.
 * An `ACCEPTED` proposal is terminal within this package: any separate
 * governed mutation action it may trigger is explicitly outside this
 * package's scope and is not implemented here.
 */
export class FeedbackEngine {
  private readonly proposals = new Map<string, FeedbackProposal>();

  constructor(private readonly ids: IdFactory) {}

  submit(input: {
    observation: string;
    targetReference: string;
    proposedChange: string;
    evidenceRefs: string[];
    proposer: string;
  }): FeedbackSubmissionResult {
    const proposalId = this.ids.nextId("FBP");
    const proposal: FeedbackProposal = {
      proposal_id: proposalId,
      observation: input.observation,
      target_reference: input.targetReference,
      proposed_change: input.proposedChange,
      evidence_refs: [...input.evidenceRefs],
      proposer: input.proposer,
      review_status: "SUBMITTED",
      no_direct_mutation_flag: true,
    };
    this.proposals.set(proposalId, proposal);
    return { submitted: true, proposal };
  }

  get(proposalId: string): FeedbackProposal | undefined {
    const found = this.proposals.get(proposalId);
    return found ? { ...found } : undefined;
  }

  private transition(proposalId: string, target: FeedbackReviewStatus): FeedbackActionResult {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return { succeeded: false, reasons: ["PROPOSAL_NOT_FOUND"] };
    }
    if (!ALLOWED_REVIEW_TRANSITIONS[proposal.review_status].includes(target)) {
      return { succeeded: false, reasons: ["PROPOSAL_NOT_REVIEWABLE"] };
    }
    const updated: FeedbackProposal = { ...proposal, review_status: target };
    this.proposals.set(proposalId, updated);
    return { succeeded: true, proposal: { ...updated }, reasons: [] };
  }

  startReview(proposalId: string): FeedbackActionResult {
    return this.transition(proposalId, "UNDER_REVIEW");
  }

  accept(proposalId: string): FeedbackActionResult {
    return this.transition(proposalId, "ACCEPTED");
  }

  reject(proposalId: string): FeedbackActionResult {
    return this.transition(proposalId, "REJECTED");
  }
}
