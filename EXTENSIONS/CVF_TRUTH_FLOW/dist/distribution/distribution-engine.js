import { isAllowedAcknowledgementTransition } from "../lifecycle/lifecycle-transitions.js";
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
export class DistributionEngine {
    authority;
    ids;
    packages = new Map();
    constructor(authority, ids) {
        this.authority = authority;
        this.ids = ids;
    }
    resolveAllActive(referenceIds, actionTimeUtcIso) {
        return referenceIds.every((referenceId) => this.authority.isCurrentlyActive(referenceId, actionTimeUtcIso));
    }
    create(input) {
        if (input.truthReferences.length === 0) {
            return { created: false, reasons: ["EMPTY_TRUTH_REFERENCES"] };
        }
        if (!this.resolveAllActive(input.truthReferences, input.actionTimeUtcIso)) {
            return { created: false, reasons: ["REFERENCE_NOT_CURRENTLY_ACTIVE"] };
        }
        const packageId = this.ids.nextId("DPKG");
        const distributionPackage = {
            package_id: packageId,
            recipient: input.recipient,
            role: input.role,
            task: input.task,
            phase: input.phase,
            truth_references: [...input.truthReferences],
            dose: input.dose,
            restrictions: [...input.restrictions],
            expiry_utc: input.expiryUtc,
            routing_decision: `KERNEL_RESOLVED_ACTIVE:${input.truthReferences.join(",")}`,
            acknowledgement_state: "PENDING_ACKNOWLEDGEMENT",
        };
        this.packages.set(packageId, distributionPackage);
        return { created: true, distributionPackage, reasons: [] };
    }
    get(packageId) {
        const found = this.packages.get(packageId);
        return found ? { ...found } : undefined;
    }
    reResolveOrReject(packageId, targetState, actionTimeUtcIso) {
        const pkg = this.packages.get(packageId);
        if (!pkg) {
            return { reasons: ["PACKAGE_NOT_FOUND"] };
        }
        if (!isAllowedAcknowledgementTransition(pkg.acknowledgement_state, targetState)) {
            return { reasons: ["PACKAGE_NOT_ACTIONABLE"] };
        }
        if (!this.resolveAllActive(pkg.truth_references, actionTimeUtcIso)) {
            return { reasons: ["REFERENCE_NOT_CURRENTLY_ACTIVE"] };
        }
        return { pkg };
    }
    isReadActionable(pkg) {
        return pkg.acknowledgement_state === "PENDING_ACKNOWLEDGEMENT";
    }
    /**
     * Delivers/consumes the package. Re-resolves every bound reference at
     * actionTimeUtcIso; does not mutate acknowledgement_state (delivery and
     * consumption are read actions distinct from acknowledgement, allowed
     * only while the package remains PENDING_ACKNOWLEDGEMENT).
     */
    deliverOrConsume(packageId, actionTimeUtcIso) {
        const pkg = this.packages.get(packageId);
        if (!pkg) {
            return { succeeded: false, reasons: ["PACKAGE_NOT_FOUND"] };
        }
        if (!this.isReadActionable(pkg)) {
            return { succeeded: false, reasons: ["PACKAGE_NOT_ACTIONABLE"] };
        }
        if (!this.resolveAllActive(pkg.truth_references, actionTimeUtcIso)) {
            return { succeeded: false, reasons: ["REFERENCE_NOT_CURRENTLY_ACTIVE"] };
        }
        return { succeeded: true, distributionPackage: { ...pkg }, reasons: [] };
    }
    acknowledge(packageId, actionTimeUtcIso) {
        const outcome = this.reResolveOrReject(packageId, "ACKNOWLEDGED", actionTimeUtcIso);
        if ("reasons" in outcome) {
            return { succeeded: false, reasons: outcome.reasons };
        }
        const updated = { ...outcome.pkg, acknowledgement_state: "ACKNOWLEDGED" };
        this.packages.set(packageId, updated);
        return { succeeded: true, distributionPackage: { ...updated }, reasons: [] };
    }
    /**
     * Marks a PENDING_ACKNOWLEDGEMENT package EXPIRED when actionTimeUtcIso
     * has passed expiry_utc. This is a Flow-local lifecycle transition on
     * the DistributionPackage record only; it never alters the underlying
     * Kernel-owned authority records.
     */
    expireIfPastDeadline(packageId, actionTimeUtcIso) {
        const pkg = this.packages.get(packageId);
        if (!pkg) {
            return { succeeded: false, reasons: ["PACKAGE_NOT_FOUND"] };
        }
        if (!isAllowedAcknowledgementTransition(pkg.acknowledgement_state, "EXPIRED")) {
            return { succeeded: false, reasons: ["PACKAGE_NOT_ACTIONABLE"] };
        }
        if (Date.parse(actionTimeUtcIso) < Date.parse(pkg.expiry_utc)) {
            return { succeeded: false, reasons: ["PACKAGE_NOT_ACTIONABLE"] };
        }
        const updated = { ...pkg, acknowledgement_state: "EXPIRED" };
        this.packages.set(packageId, updated);
        return { succeeded: true, distributionPackage: { ...updated }, reasons: [] };
    }
    /**
     * Recall/retirement: the sole T2-valid PENDING_ACKNOWLEDGEMENT ->
     * WITHDRAWN transition (T2 Invariant 8 class; T5 Required Invariant 8).
     * ACKNOWLEDGED, EXPIRED, and WITHDRAWN are terminal; no post-
     * acknowledgement recall state exists, and this never mutates the
     * underlying Kernel record.
     */
    withdraw(packageId) {
        const pkg = this.packages.get(packageId);
        if (!pkg) {
            return { succeeded: false, reasons: ["PACKAGE_NOT_FOUND"] };
        }
        if (!isAllowedAcknowledgementTransition(pkg.acknowledgement_state, "WITHDRAWN")) {
            return { succeeded: false, reasons: ["PACKAGE_NOT_ACTIONABLE"] };
        }
        const updated = { ...pkg, acknowledgement_state: "WITHDRAWN" };
        this.packages.set(packageId, updated);
        return { succeeded: true, distributionPackage: { ...updated }, reasons: [] };
    }
}
