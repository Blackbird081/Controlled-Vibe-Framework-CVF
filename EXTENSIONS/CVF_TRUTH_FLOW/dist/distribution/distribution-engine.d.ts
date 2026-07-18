import type { KernelAuthorityBoundary } from "../kernel-reference/kernel-authority.js";
import type { DistributionPackage } from "../types/distribution-package.js";
import type { IdFactory } from "../deps.js";
export type DistributionRejectionReason = "EMPTY_TRUTH_REFERENCES" | "REFERENCE_NOT_CURRENTLY_ACTIVE" | "PACKAGE_NOT_FOUND" | "PACKAGE_NOT_ACTIONABLE";
export interface DistributionCreationResult {
    created: boolean;
    distributionPackage?: DistributionPackage;
    reasons: DistributionRejectionReason[];
}
export interface DistributionActionResult {
    succeeded: boolean;
    distributionPackage?: DistributionPackage;
    reasons: DistributionRejectionReason[];
}
/**
 * Creates and transitions DistributionPackage records. routing_decision is
 * always computed internally from a fresh Kernel authority resolution; it
 * is never accepted as a constructor input, so no caller-supplied boolean
 * or string ID can substitute for a bound Kernel-resolved reference (T2
 * Invariant 7, NC-11). Every creation and every subsequent action
 * re-resolves all bound references at the supplied action time and fails
 * closed unless every effective state is ACTIVE (T5 Required Invariant 7);
 * a creation-time ACTIVE result is never reused as later authority.
 */
export declare class DistributionEngine {
    private readonly authority;
    private readonly ids;
    private readonly packages;
    constructor(authority: KernelAuthorityBoundary, ids: IdFactory);
    private resolveAllActive;
    create(input: {
        recipient: string;
        role: string;
        task: string;
        phase: string;
        truthReferences: string[];
        dose: string;
        restrictions: string[];
        expiryUtc: string;
        actionTimeUtcIso: string;
    }): DistributionCreationResult;
    get(packageId: string): DistributionPackage | undefined;
    private reResolveOrReject;
    private isReadActionable;
    /**
     * Delivers/consumes the package. Re-resolves every bound reference at
     * actionTimeUtcIso; does not mutate acknowledgement_state (delivery and
     * consumption are read actions distinct from acknowledgement, allowed
     * only while the package remains PENDING_ACKNOWLEDGEMENT).
     */
    deliverOrConsume(packageId: string, actionTimeUtcIso: string): DistributionActionResult;
    acknowledge(packageId: string, actionTimeUtcIso: string): DistributionActionResult;
    /**
     * Marks a PENDING_ACKNOWLEDGEMENT package EXPIRED when actionTimeUtcIso
     * has passed expiry_utc. This is a Flow-local lifecycle transition on
     * the DistributionPackage record only; it never alters the underlying
     * Kernel-owned authority records.
     */
    expireIfPastDeadline(packageId: string, actionTimeUtcIso: string): DistributionActionResult;
    /**
     * Recall/retirement: the sole T2-valid PENDING_ACKNOWLEDGEMENT ->
     * WITHDRAWN transition (T2 Invariant 8 class; T5 Required Invariant 8).
     * ACKNOWLEDGED, EXPIRED, and WITHDRAWN are terminal; no post-
     * acknowledgement recall state exists, and this never mutates the
     * underlying Kernel record.
     */
    withdraw(packageId: string): DistributionActionResult;
}
