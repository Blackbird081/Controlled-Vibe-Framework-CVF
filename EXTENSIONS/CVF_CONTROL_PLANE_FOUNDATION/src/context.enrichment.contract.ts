import type { ContextPackage, ContextSegment, ContextSegmentType } from "./context.build.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Constraints used by ContextEnrichmentContract.validate().
 * All fields are optional — only provided constraints are checked.
 */
export interface ContextValidationConstraints {
  /** Minimum number of segments required */
  minSegments?: number;
  /** Maximum allowed estimated tokens */
  maxTokens?: number;
  /** Segment types that must appear at least once */
  requiredSegmentTypes?: ContextSegmentType[];
}

export type ContextValidationStatus = "VALID" | "INVALID";

export interface ContextValidationViolation {
  rule: string;
  detail: string;
}

export interface ContextValidationResult {
  packageId: string;
  status: ContextValidationStatus;
  violations: ContextValidationViolation[];
  checkedAt: string;
}

export interface ContextEnrichmentContractDependencies {
  now?: () => string;
  estimateTokens?: (content: string) => number;
}

// ─── Token estimation ─────────────────────────────────────────────────────────

function defaultEstimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

// ─── Contract ─────────────────────────────────────────────────────────────────

/**
 * ContextEnrichmentContract (W6-T3)
 * -----------------------------------
 * Richer context-packager semantics for the CVF Control Plane.
 *
 * Three operations:
 *   - addSystemSegment  — prepend a SYSTEM segment to a package
 *   - merge             — combine multiple packages into one, deduplicating segments
 *   - validate          — check a package against structural constraints
 *
 * All operations are pure and return new package/result objects.
 */
export class ContextEnrichmentContract {
  private readonly now: () => string;
  private readonly estimateTokens: (content: string) => number;

  constructor(dependencies: ContextEnrichmentContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.estimateTokens = dependencies.estimateTokens ?? defaultEstimateTokens;
  }

  // ─── addSystemSegment ──────────────────────────────────────────────────────

  /**
   * Prepend a SYSTEM segment to a ContextPackage.
   *
   * Produces a new ContextPackage with:
   *   - SYSTEM segment at index 0
   *   - all original segments following
   *   - updated totalSegments, estimatedTokens, packageHash, packageId
   *
   * The original package is not mutated.
   */
  addSystemSegment(pkg: ContextPackage, systemContent: string): ContextPackage {
    const builtAt = this.now();
    const tokens = this.estimateTokens(systemContent);

    const segId = computeDeterministicHash(
      "w6-t3-cp1-seg-system",
      pkg.contextId,
      systemContent,
    );

    const systemSegment: ContextSegment = {
      segmentId: segId,
      segmentType: "SYSTEM",
      content: systemContent,
      tokenEstimate: tokens,
    };

    const segments: ContextSegment[] = [systemSegment, ...pkg.segments];
    const estimatedTokens = segments.reduce((sum, s) => sum + s.tokenEstimate, 0);

    const packageHash = computeDeterministicHash(
      "w6-t3-cp1-enriched-package",
      `${builtAt}:${pkg.contextId}`,
      `segments:${segments.length}:tokens:${estimatedTokens}`,
      `system:${systemContent}`,
      `origin:${pkg.packageHash}`,
    );

    const packageId = computeDeterministicHash(
      "w6-t3-cp1-enriched-package-id",
      packageHash,
      builtAt,
    );

    return {
      ...pkg,
      packageId,
      builtAt,
      segments,
      totalSegments: segments.length,
      estimatedTokens,
      packageHash,
    };
  }

  // ─── merge ─────────────────────────────────────────────────────────────────

  /**
   * Merge multiple ContextPackages into one unified package.
   *
   * Deduplication: segments with the same segmentId appear only once
   * (first-occurrence wins). Ordering: packages are processed in input order.
   *
   * If maxTokens is provided, segments are added until the token budget is
   * exhausted — remaining segments are dropped (no error).
   *
   * The merged package reuses the contextId of the first package.
   * Returns an empty-segment package when the input array is empty.
   */
  merge(packages: ContextPackage[], maxTokens?: number): ContextPackage {
    const builtAt = this.now();
    const tokenCap = maxTokens && maxTokens > 0 ? maxTokens : Infinity;

    const seenIds = new Set<string>();
    const segments: ContextSegment[] = [];
    let accumulatedTokens = 0;

    for (const pkg of packages) {
      for (const seg of pkg.segments) {
        if (seenIds.has(seg.segmentId)) continue;
        if (accumulatedTokens + seg.tokenEstimate > tokenCap) continue;
        seenIds.add(seg.segmentId);
        segments.push(seg);
        accumulatedTokens += seg.tokenEstimate;
      }
    }

    const contextId = packages[0]?.contextId ?? "merged";
    const query = packages[0]?.query ?? "";
    const estimatedTokens = segments.reduce((sum, s) => sum + s.tokenEstimate, 0);

    const packageHash = computeDeterministicHash(
      "w6-t3-cp1-merged-package",
      `${builtAt}:${contextId}`,
      `segments:${segments.length}:tokens:${estimatedTokens}`,
      `sources:${packages.map((p) => p.packageHash).join(",")}`,
    );

    const packageId = computeDeterministicHash(
      "w6-t3-cp1-merged-package-id",
      packageHash,
      builtAt,
    );

    return {
      packageId,
      builtAt,
      contextId,
      query,
      segments,
      totalSegments: segments.length,
      estimatedTokens,
      packageHash,
    };
  }

  // ─── validate ──────────────────────────────────────────────────────────────

  /**
   * Validate a ContextPackage against structural constraints.
   *
   * Returns a ContextValidationResult with status VALID or INVALID.
   * All provided constraints are checked; violations are listed individually.
   */
  validate(
    pkg: ContextPackage,
    constraints: ContextValidationConstraints,
  ): ContextValidationResult {
    const checkedAt = this.now();
    const violations: ContextValidationViolation[] = [];

    if (
      constraints.minSegments !== undefined &&
      pkg.totalSegments < constraints.minSegments
    ) {
      violations.push({
        rule: "minSegments",
        detail: `Package has ${pkg.totalSegments} segment(s); minimum required is ${constraints.minSegments}.`,
      });
    }

    if (
      constraints.maxTokens !== undefined &&
      pkg.estimatedTokens > constraints.maxTokens
    ) {
      violations.push({
        rule: "maxTokens",
        detail: `Package uses ${pkg.estimatedTokens} estimated token(s); maximum allowed is ${constraints.maxTokens}.`,
      });
    }

    if (constraints.requiredSegmentTypes) {
      const presentTypes = new Set(pkg.segments.map((s) => s.segmentType));
      for (const required of constraints.requiredSegmentTypes) {
        if (!presentTypes.has(required)) {
          violations.push({
            rule: "requiredSegmentTypes",
            detail: `Required segment type "${required}" is not present in the package.`,
          });
        }
      }
    }

    return {
      packageId: pkg.packageId,
      status: violations.length === 0 ? "VALID" : "INVALID",
      violations,
      checkedAt,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createContextEnrichmentContract(
  dependencies?: ContextEnrichmentContractDependencies,
): ContextEnrichmentContract {
  return new ContextEnrichmentContract(dependencies);
}
