import type { AcknowledgementState } from "../types/distribution-package.js";
/**
 * Exhaustive DistributionPackage.acknowledgement_state transition table
 * (T2 contract chain section 7; T5 Required Invariant 8). Only four
 * states exist and no Flow-local "VERIFIED"-equivalent token is
 * reachable. Recall and retirement both use the sole T2-valid
 * PENDING_ACKNOWLEDGEMENT -> WITHDRAWN transition; ACKNOWLEDGED, EXPIRED,
 * and WITHDRAWN are terminal (no outgoing transitions).
 */
export declare const ALLOWED_ACKNOWLEDGEMENT_TRANSITIONS: Readonly<Record<AcknowledgementState, readonly AcknowledgementState[]>>;
export declare function isAllowedAcknowledgementTransition(from: AcknowledgementState, to: AcknowledgementState): boolean;
