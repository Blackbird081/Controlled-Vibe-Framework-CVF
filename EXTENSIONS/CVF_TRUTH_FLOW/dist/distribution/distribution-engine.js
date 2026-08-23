import { isAllowedAcknowledgementTransition } from "../lifecycle/lifecycle-transitions.js";
import { validateRoutingScope } from "../routing/routing-engine.js";
import { validateDose } from "./dose-engine.js";
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
        if (!validateRoutingScope(input).valid)
            return { created: false, reasons: ["INCOMPLETE_ROUTING_SCOPE"] };
        if (!validateDose(input.dose, input.expiryUtc, input.actionTimeUtcIso).valid)
            return { created: false, reasons: ["INVALID_DOSE_OR_EXPIRY"] };
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
    isExpired(pkg, actionTimeUtcIso) {
        const actionMs = Date.parse(actionTimeUtcIso);
        const expiryMs = Date.parse(pkg.expiry_utc);
        return Number.isNaN(actionMs) || Number.isNaN(expiryMs) || actionMs >= expiryMs;
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
        if (this.isExpired(pkg, actionTimeUtcIso))
            return { succeeded: false, reasons: ["PACKAGE_EXPIRED"] };
        if (!this.resolveAllActive(pkg.truth_references, actionTimeUtcIso)) {
            return { succeeded: false, reasons: ["REFERENCE_NOT_CURRENTLY_ACTIVE"] };
        }
        return { succeeded: true, distributionPackage: { ...pkg }, reasons: [] };
    }
    /**
     * Strict consumption-time binding check (A4). Compares the caller-asserted
     * `binding` against the package's own immutable recipient/role/task/phase/
     * dose fields before applying every existing `deliverOrConsume` check
     * (read-actionable lifecycle state, expiry, and fresh Kernel reference
     * resolution). A binding mismatch returns
     * `PACKAGE_CONSUMER_BINDING_MISMATCH` and never mutates state or reveals
     * lifecycle/expiry detail for a caller that does not match the package's
     * own routing scope. Existing `deliverOrConsume` behavior for a correctly
     * bound caller is unchanged: this method delegates to it once binding
     * passes, so actionable/expiry/current-reference checks are not
     * duplicated or weakened.
     */
    consumeFor(packageId, binding, actionTimeUtcIso) {
        const pkg = this.packages.get(packageId);
        if (!pkg) {
            return { succeeded: false, reasons: ["PACKAGE_NOT_FOUND"] };
        }
        const bindingMatches = pkg.recipient === binding.recipient &&
            pkg.role === binding.role &&
            pkg.task === binding.task &&
            pkg.phase === binding.phase &&
            pkg.dose === binding.dose;
        if (!bindingMatches) {
            return { succeeded: false, reasons: ["PACKAGE_CONSUMER_BINDING_MISMATCH"] };
        }
        return this.deliverOrConsume(packageId, actionTimeUtcIso);
    }
    acknowledge(packageId, actionTimeUtcIso) {
        const current = this.packages.get(packageId);
        if (current && this.isExpired(current, actionTimeUtcIso))
            return { succeeded: false, reasons: ["PACKAGE_EXPIRED"] };
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
