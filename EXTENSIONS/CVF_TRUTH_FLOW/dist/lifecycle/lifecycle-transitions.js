/**
 * Exhaustive DistributionPackage.acknowledgement_state transition table
 * (T2 contract chain section 7; T5 Required Invariant 8). Only four
 * states exist and no Flow-local "VERIFIED"-equivalent token is
 * reachable. Recall and retirement both use the sole T2-valid
 * PENDING_ACKNOWLEDGEMENT -> WITHDRAWN transition; ACKNOWLEDGED, EXPIRED,
 * and WITHDRAWN are terminal (no outgoing transitions).
 */
export const ALLOWED_ACKNOWLEDGEMENT_TRANSITIONS = {
    PENDING_ACKNOWLEDGEMENT: ["ACKNOWLEDGED", "EXPIRED", "WITHDRAWN"],
    ACKNOWLEDGED: [],
    EXPIRED: [],
    WITHDRAWN: [],
};
export function isAllowedAcknowledgementTransition(from, to) {
    return ALLOWED_ACKNOWLEDGEMENT_TRANSITIONS[from].includes(to);
}
