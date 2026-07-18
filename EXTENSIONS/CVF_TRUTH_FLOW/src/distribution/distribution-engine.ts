import type { KernelAuthorityBoundary } from "../kernel-reference/kernel-authority.js";
import type { AcknowledgementState, DistributionPackage } from "../types/distribution-package.js";
import type { IdFactory } from "../deps.js";
import { isAllowedAcknowledgementTransition } from "../lifecycle/lifecycle-transitions.js";
import { validateRoutingScope } from "../routing/routing-engine.js";
import { validateDose } from "./dose-engine.js";

export type DistributionRejectionReason =
  | "EMPTY_TRUTH_REFERENCES"
  | "REFERENCE_NOT_CURRENTLY_ACTIVE"
  | "PACKAGE_NOT_FOUND"
  | "PACKAGE_NOT_ACTIONABLE"
  | "INCOMPLETE_ROUTING_SCOPE"
  | "INVALID_DOSE_OR_EXPIRY"
  | "PACKAGE_EXPIRED"
  | "PACKAGE_CONSUMER_BINDING_MISMATCH";

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
 * The exact consumer identity a caller asserts when reading/consuming a
 * package (A4). Every field is compared against the package's own immutable
 * routing fields; dose is compared for exact equality because A4's product
 * consumer always requests the single dose it was granted (no partial-dose
 * consumption semantics exist). A mismatch on any field returns
 * `PACKAGE_CONSUMER_BINDING_MISMATCH` before any lifecycle/expiry/reference
 * check runs, so a wrong-binding caller never learns lifecycle state.
 */
export interface DistributionConsumptionBinding {
  recipient: string;
  role: string;
  task: string;
  phase: string;
  dose: string;
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
export class DistributionEngine {
  private readonly packages = new Map<string, DistributionPackage>();

  constructor(
    private readonly authority: KernelAuthorityBoundary,
    private readonly ids: IdFactory,
  ) {}

  private resolveAllActive(referenceIds: string[], actionTimeUtcIso: string): boolean {
    return referenceIds.every((referenceId) => this.authority.isCurrentlyActive(referenceId, actionTimeUtcIso));
  }

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
  }): DistributionCreationResult {
    if (!validateRoutingScope(input).valid) return { created: false, reasons: ["INCOMPLETE_ROUTING_SCOPE"] };
    if (!validateDose(input.dose, input.expiryUtc, input.actionTimeUtcIso).valid) return { created: false, reasons: ["INVALID_DOSE_OR_EXPIRY"] };
    if (input.truthReferences.length === 0) {
      return { created: false, reasons: ["EMPTY_TRUTH_REFERENCES"] };
    }
    if (!this.resolveAllActive(input.truthReferences, input.actionTimeUtcIso)) {
      return { created: false, reasons: ["REFERENCE_NOT_CURRENTLY_ACTIVE"] };
    }

    const packageId = this.ids.nextId("DPKG");
    const distributionPackage: DistributionPackage = {
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

  get(packageId: string): DistributionPackage | undefined {
    const found = this.packages.get(packageId);
    return found ? { ...found } : undefined;
  }

  private reResolveOrReject(
    packageId: string,
    targetState: AcknowledgementState,
    actionTimeUtcIso: string,
  ): { pkg: DistributionPackage } | { reasons: DistributionRejectionReason[] } {
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

  private isReadActionable(pkg: DistributionPackage): boolean {
    return pkg.acknowledgement_state === "PENDING_ACKNOWLEDGEMENT";
  }

  private isExpired(pkg: DistributionPackage, actionTimeUtcIso: string): boolean {
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
  deliverOrConsume(packageId: string, actionTimeUtcIso: string): DistributionActionResult {
    const pkg = this.packages.get(packageId);
    if (!pkg) {
      return { succeeded: false, reasons: ["PACKAGE_NOT_FOUND"] };
    }
    if (!this.isReadActionable(pkg)) {
      return { succeeded: false, reasons: ["PACKAGE_NOT_ACTIONABLE"] };
    }
    if (this.isExpired(pkg, actionTimeUtcIso)) return { succeeded: false, reasons: ["PACKAGE_EXPIRED"] };
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
  consumeFor(
    packageId: string,
    binding: DistributionConsumptionBinding,
    actionTimeUtcIso: string,
  ): DistributionActionResult {
    const pkg = this.packages.get(packageId);
    if (!pkg) {
      return { succeeded: false, reasons: ["PACKAGE_NOT_FOUND"] };
    }
    const bindingMatches =
      pkg.recipient === binding.recipient &&
      pkg.role === binding.role &&
      pkg.task === binding.task &&
      pkg.phase === binding.phase &&
      pkg.dose === binding.dose;
    if (!bindingMatches) {
      return { succeeded: false, reasons: ["PACKAGE_CONSUMER_BINDING_MISMATCH"] };
    }
    return this.deliverOrConsume(packageId, actionTimeUtcIso);
  }

  acknowledge(packageId: string, actionTimeUtcIso: string): DistributionActionResult {
    const current = this.packages.get(packageId);
    if (current && this.isExpired(current, actionTimeUtcIso)) return { succeeded: false, reasons: ["PACKAGE_EXPIRED"] };
    const outcome = this.reResolveOrReject(packageId, "ACKNOWLEDGED", actionTimeUtcIso);
    if ("reasons" in outcome) {
      return { succeeded: false, reasons: outcome.reasons };
    }
    const updated: DistributionPackage = { ...outcome.pkg, acknowledgement_state: "ACKNOWLEDGED" };
    this.packages.set(packageId, updated);
    return { succeeded: true, distributionPackage: { ...updated }, reasons: [] };
  }

  /**
   * Marks a PENDING_ACKNOWLEDGEMENT package EXPIRED when actionTimeUtcIso
   * has passed expiry_utc. This is a Flow-local lifecycle transition on
   * the DistributionPackage record only; it never alters the underlying
   * Kernel-owned authority records.
   */
  expireIfPastDeadline(packageId: string, actionTimeUtcIso: string): DistributionActionResult {
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
    const updated: DistributionPackage = { ...pkg, acknowledgement_state: "EXPIRED" };
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
  withdraw(packageId: string): DistributionActionResult {
    const pkg = this.packages.get(packageId);
    if (!pkg) {
      return { succeeded: false, reasons: ["PACKAGE_NOT_FOUND"] };
    }
    if (!isAllowedAcknowledgementTransition(pkg.acknowledgement_state, "WITHDRAWN")) {
      return { succeeded: false, reasons: ["PACKAGE_NOT_ACTIONABLE"] };
    }
    const updated: DistributionPackage = { ...pkg, acknowledgement_state: "WITHDRAWN" };
    this.packages.set(packageId, updated);
    return { succeeded: true, distributionPackage: { ...updated }, reasons: [] };
  }
}
