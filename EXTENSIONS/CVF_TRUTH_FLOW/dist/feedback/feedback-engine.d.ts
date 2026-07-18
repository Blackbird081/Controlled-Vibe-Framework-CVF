import type { FeedbackProposal } from "../types/feedback-proposal.js";
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
/**
 * Proposal-only feedback path (T2 contract chain section 8; T2 Invariant
 * 9; NC-12). This engine exposes no function that writes to a
 * Kernel-owned authority record, evidence record, or source score.
 * `no_direct_mutation_flag` is always `true` on every produced proposal.
 * An `ACCEPTED` proposal is terminal within this package: any separate
 * governed mutation action it may trigger is explicitly outside this
 * package's scope and is not implemented here.
 */
export declare class FeedbackEngine {
    private readonly ids;
    private readonly proposals;
    constructor(ids: IdFactory);
    submit(input: {
        observation: string;
        targetReference: string;
        proposedChange: string;
        evidenceRefs: string[];
        proposer: string;
    }): FeedbackSubmissionResult;
    get(proposalId: string): FeedbackProposal | undefined;
    private transition;
    startReview(proposalId: string): FeedbackActionResult;
    accept(proposalId: string): FeedbackActionResult;
    reject(proposalId: string): FeedbackActionResult;
}
