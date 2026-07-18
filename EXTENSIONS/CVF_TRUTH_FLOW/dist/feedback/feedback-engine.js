const ALLOWED_REVIEW_TRANSITIONS = {
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
    ids;
    proposals = new Map();
    constructor(ids) {
        this.ids = ids;
    }
    submit(input) {
        const proposalId = this.ids.nextId("FBP");
        const proposal = {
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
    get(proposalId) {
        const found = this.proposals.get(proposalId);
        return found ? { ...found } : undefined;
    }
    transition(proposalId, target) {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            return { succeeded: false, reasons: ["PROPOSAL_NOT_FOUND"] };
        }
        if (!ALLOWED_REVIEW_TRANSITIONS[proposal.review_status].includes(target)) {
            return { succeeded: false, reasons: ["PROPOSAL_NOT_REVIEWABLE"] };
        }
        const updated = { ...proposal, review_status: target };
        this.proposals.set(proposalId, updated);
        return { succeeded: true, proposal: { ...updated }, reasons: [] };
    }
    startReview(proposalId) {
        return this.transition(proposalId, "UNDER_REVIEW");
    }
    accept(proposalId) {
        return this.transition(proposalId, "ACCEPTED");
    }
    reject(proposalId) {
        return this.transition(proposalId, "REJECTED");
    }
}
