import type { TruthKernel } from "cvf-truth-kernel";
/**
 * Read-only Kernel authority boundary (T5 Required Invariant 5, 7).
 *
 * Flow never evaluates trust, never derives revocation/supersession/expiry
 * itself, and never accepts a substitute resolver: it always calls the
 * actual injected TruthKernel instance's public ID-only
 * `referenceState(referenceId, nowUtcIso)` method. The raw issuance
 * snapshot (`TruthReference.reference_state` as stored at issuance) is
 * never trusted as current authority; only a fresh call at the action
 * evaluation time is authoritative (T4R1 Required Invariant 6).
 *
 * This module contains no revocation, supersession, or expiry logic of
 * its own; it is a thin, typed pass-through to the Kernel's own resolver.
 */
export declare class KernelAuthorityBoundary {
    private readonly kernel;
    constructor(kernel: TruthKernel);
    /**
     * Returns true only when the Kernel's own resolver reports the
     * reference's effective state as ACTIVE at the supplied action time.
     * Any resolution failure (missing reference, missing bound receipt,
     * invalid timestamp) or any non-ACTIVE effective state returns false;
     * there is no default-true path.
     */
    isCurrentlyActive(referenceId: string, actionTimeUtcIso: string): boolean;
    /**
     * Returns the Kernel's raw typed resolution result for the caller to
     * record as evidence (for example, a rejection reason). Never
     * post-processes or reinterprets the Kernel's own precedence decision.
     */
    resolve(referenceId: string, actionTimeUtcIso: string): ReturnType<TruthKernel["referenceState"]>;
}
