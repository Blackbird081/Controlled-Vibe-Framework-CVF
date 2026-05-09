/**
 * ContextEnrichmentContract — Tests (W6-T3)
 * ===========================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   addSystemSegment:
 *     - SYSTEM segment is prepended at index 0
 *     - original segments follow in order
 *     - totalSegments, estimatedTokens updated correctly
 *     - original package not mutated
 *     - packageHash and packageId are deterministic (same input → same output)
 *
 *   merge:
 *     - merges two packages, segments from first then second
 *     - deduplicates by segmentId (first-occurrence wins)
 *     - respects maxTokens budget (drops segments exceeding cap)
 *     - empty input returns empty-segment package
 *     - single package → identical segment list
 *     - contextId and query taken from first package
 *
 *   validate:
 *     - VALID when all constraints satisfied
 *     - INVALID with minSegments violation
 *     - INVALID with maxTokens violation
 *     - INVALID with missing requiredSegmentType
 *     - multiple violations reported individually
 *     - no constraints → always VALID
 *
 *   factory:
 *     - createContextEnrichmentContract returns working instance
 */

import { describe, it, expect } from "vitest";
import {
  ContextEnrichmentContract,
  createContextEnrichmentContract,
} from "../src/context.enrichment.contract";
import type { ContextPackage, ContextSegment } from "../src/context.build.contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-23T00:00:00.000Z";
const fixedNow = () => FIXED_NOW;
const fixedTokens = (content: string) => content.length; // 1 char = 1 token

function makeSegment(
  id: string,
  type: ContextSegment["segmentType"],
  content: string,
  tokens = content.length,
): ContextSegment {
  return { segmentId: id, segmentType: type, content, tokenEstimate: tokens };
}

function makePackage(overrides: Partial<ContextPackage> & { packageId: string }): ContextPackage {
  const segments = overrides.segments ?? [];
  return {
    packageId: overrides.packageId,
    builtAt: FIXED_NOW,
    contextId: overrides.contextId ?? "ctx-1",
    query: overrides.query ?? "test query",
    segments,
    totalSegments: segments.length,
    estimatedTokens: overrides.estimatedTokens ?? segments.reduce((s, x) => s + x.tokenEstimate, 0),
    packageHash: overrides.packageHash ?? `hash-${overrides.packageId}`,
  };
}

function makeContract() {
  return new ContextEnrichmentContract({ now: fixedNow, estimateTokens: fixedTokens });
}

// ─── addSystemSegment ─────────────────────────────────────────────────────────

describe("ContextEnrichmentContract.addSystemSegment", () => {
  it("prepends a SYSTEM segment at index 0", () => {
    const contract = makeContract();
    const seg = makeSegment("seg-1", "QUERY", "hello world");
    const pkg = makePackage({ packageId: "p1", segments: [seg] });

    const result = contract.addSystemSegment(pkg, "You are a governance assistant.");

    expect(result.segments[0].segmentType).toBe("SYSTEM");
    expect(result.segments[0].content).toBe("You are a governance assistant.");
  });

  it("original segments follow the SYSTEM segment in original order", () => {
    const contract = makeContract();
    const s1 = makeSegment("seg-1", "QUERY", "query");
    const s2 = makeSegment("seg-2", "KNOWLEDGE", "knowledge");
    const pkg = makePackage({ packageId: "p1", segments: [s1, s2] });

    const result = contract.addSystemSegment(pkg, "sys");

    expect(result.segments).toHaveLength(3);
    expect(result.segments[1].segmentId).toBe("seg-1");
    expect(result.segments[2].segmentId).toBe("seg-2");
  });

  it("updates totalSegments correctly", () => {
    const contract = makeContract();
    const pkg = makePackage({ packageId: "p1", segments: [makeSegment("s1", "QUERY", "q")] });
    const result = contract.addSystemSegment(pkg, "sys");
    expect(result.totalSegments).toBe(2);
  });

  it("updates estimatedTokens to include SYSTEM segment tokens", () => {
    const contract = makeContract();
    const pkg = makePackage({
      packageId: "p1",
      segments: [makeSegment("s1", "QUERY", "abcd", 4)],
      estimatedTokens: 4,
    });
    const result = contract.addSystemSegment(pkg, "xyz"); // 3 tokens with fixedTokens
    expect(result.estimatedTokens).toBe(7);
  });

  it("does not mutate the original package", () => {
    const contract = makeContract();
    const seg = makeSegment("seg-1", "QUERY", "query");
    const pkg = makePackage({ packageId: "p1", segments: [seg] });
    const originalLength = pkg.segments.length;

    contract.addSystemSegment(pkg, "sys");

    expect(pkg.segments).toHaveLength(originalLength);
    expect(pkg.totalSegments).toBe(originalLength);
  });

  it("produces deterministic packageHash for same input", () => {
    const contract = makeContract();
    const pkg = makePackage({ packageId: "p1", segments: [makeSegment("s1", "QUERY", "q")] });

    const r1 = contract.addSystemSegment(pkg, "same system content");
    const r2 = contract.addSystemSegment(pkg, "same system content");

    expect(r1.packageHash).toBe(r2.packageHash);
    expect(r1.packageId).toBe(r2.packageId);
  });

  it("produces different packageHash for different system content", () => {
    const contract = makeContract();
    const pkg = makePackage({ packageId: "p1", segments: [makeSegment("s1", "QUERY", "q")] });

    const r1 = contract.addSystemSegment(pkg, "system A");
    const r2 = contract.addSystemSegment(pkg, "system B");

    expect(r1.packageHash).not.toBe(r2.packageHash);
  });
});

// ─── merge ────────────────────────────────────────────────────────────────────

describe("ContextEnrichmentContract.merge", () => {
  it("merges two packages: segments from first then second", () => {
    const contract = makeContract();
    const s1 = makeSegment("s1", "QUERY", "query", 5);
    const s2 = makeSegment("s2", "KNOWLEDGE", "knowledge", 9);
    const p1 = makePackage({ packageId: "p1", segments: [s1] });
    const p2 = makePackage({ packageId: "p2", contextId: "ctx-2", segments: [s2] });

    const result = contract.merge([p1, p2]);

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].segmentId).toBe("s1");
    expect(result.segments[1].segmentId).toBe("s2");
  });

  it("deduplicates by segmentId — first occurrence wins", () => {
    const contract = makeContract();
    const shared = makeSegment("shared-id", "QUERY", "shared", 6);
    const other = makeSegment("other-id", "KNOWLEDGE", "other", 5);
    const p1 = makePackage({ packageId: "p1", segments: [shared] });
    const p2 = makePackage({ packageId: "p2", segments: [shared, other] });

    const result = contract.merge([p1, p2]);

    expect(result.segments).toHaveLength(2); // shared only once
    expect(result.segments.map((s) => s.segmentId)).toEqual(["shared-id", "other-id"]);
  });

  it("respects maxTokens — drops segments that would exceed the budget", () => {
    const contract = makeContract();
    const s1 = makeSegment("s1", "QUERY", "aaaaa", 5);
    const s2 = makeSegment("s2", "KNOWLEDGE", "bbbbb", 5);
    const s3 = makeSegment("s3", "METADATA", "ccccc", 5);
    const p1 = makePackage({ packageId: "p1", segments: [s1, s2, s3] });

    const result = contract.merge([p1], 8); // only s1 + s2 = 10, exceeds; only s1 fits

    // s1=5 fits; s2 would make 10 > 8 → dropped; s3 also dropped
    expect(result.totalSegments).toBe(1);
    expect(result.segments[0].segmentId).toBe("s1");
  });

  it("empty input returns empty-segment package", () => {
    const contract = makeContract();
    const result = contract.merge([]);
    expect(result.segments).toHaveLength(0);
    expect(result.totalSegments).toBe(0);
    expect(result.estimatedTokens).toBe(0);
    expect(result.contextId).toBe("merged");
  });

  it("single package produces identical segment list", () => {
    const contract = makeContract();
    const s1 = makeSegment("s1", "QUERY", "q", 1);
    const s2 = makeSegment("s2", "KNOWLEDGE", "k", 1);
    const pkg = makePackage({ packageId: "p1", segments: [s1, s2] });

    const result = contract.merge([pkg]);

    expect(result.segments).toHaveLength(2);
    expect(result.segments.map((s) => s.segmentId)).toEqual(["s1", "s2"]);
  });

  it("contextId and query taken from first package", () => {
    const contract = makeContract();
    const p1 = makePackage({ packageId: "p1", contextId: "ctx-A", query: "query-A" });
    const p2 = makePackage({ packageId: "p2", contextId: "ctx-B", query: "query-B" });

    const result = contract.merge([p1, p2]);

    expect(result.contextId).toBe("ctx-A");
    expect(result.query).toBe("query-A");
  });

  it("estimatedTokens sums all included segment tokens", () => {
    const contract = makeContract();
    const s1 = makeSegment("s1", "QUERY", "qq", 2);
    const s2 = makeSegment("s2", "KNOWLEDGE", "kkkk", 4);
    const pkg = makePackage({ packageId: "p1", segments: [s1, s2] });

    const result = contract.merge([pkg]);
    expect(result.estimatedTokens).toBe(6);
  });
});

// ─── validate ─────────────────────────────────────────────────────────────────

describe("ContextEnrichmentContract.validate", () => {
  it("returns VALID when all constraints satisfied", () => {
    const contract = makeContract();
    const pkg = makePackage({
      packageId: "p1",
      segments: [makeSegment("s1", "QUERY", "q", 5), makeSegment("s2", "SYSTEM", "sys", 3)],
      estimatedTokens: 8,
    });

    const result = contract.validate(pkg, {
      minSegments: 2,
      maxTokens: 10,
      requiredSegmentTypes: ["QUERY", "SYSTEM"],
    });

    expect(result.status).toBe("VALID");
    expect(result.violations).toHaveLength(0);
    expect(result.packageId).toBe("p1");
  });

  it("INVALID: minSegments violation", () => {
    const contract = makeContract();
    const pkg = makePackage({ packageId: "p1", segments: [makeSegment("s1", "QUERY", "q", 1)] });

    const result = contract.validate(pkg, { minSegments: 3 });

    expect(result.status).toBe("INVALID");
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].rule).toBe("minSegments");
  });

  it("INVALID: maxTokens violation", () => {
    const contract = makeContract();
    const pkg = makePackage({
      packageId: "p1",
      segments: [makeSegment("s1", "QUERY", "q", 50)],
      estimatedTokens: 50,
    });

    const result = contract.validate(pkg, { maxTokens: 10 });

    expect(result.status).toBe("INVALID");
    expect(result.violations[0].rule).toBe("maxTokens");
  });

  it("INVALID: missing required segment type", () => {
    const contract = makeContract();
    const pkg = makePackage({
      packageId: "p1",
      segments: [makeSegment("s1", "QUERY", "q", 1)],
    });

    const result = contract.validate(pkg, { requiredSegmentTypes: ["SYSTEM"] });

    expect(result.status).toBe("INVALID");
    expect(result.violations[0].rule).toBe("requiredSegmentTypes");
    expect(result.violations[0].detail).toContain("SYSTEM");
  });

  it("reports multiple violations individually", () => {
    const contract = makeContract();
    const pkg = makePackage({
      packageId: "p1",
      segments: [],
      estimatedTokens: 100,
    });

    const result = contract.validate(pkg, {
      minSegments: 2,
      maxTokens: 10,
      requiredSegmentTypes: ["QUERY", "SYSTEM"],
    });

    expect(result.status).toBe("INVALID");
    expect(result.violations.length).toBeGreaterThanOrEqual(3);
    const rules = result.violations.map((v) => v.rule);
    expect(rules).toContain("minSegments");
    expect(rules).toContain("maxTokens");
    expect(rules).toContain("requiredSegmentTypes");
  });

  it("no constraints → always VALID", () => {
    const contract = makeContract();
    const pkg = makePackage({ packageId: "p1", segments: [] });

    const result = contract.validate(pkg, {});

    expect(result.status).toBe("VALID");
    expect(result.violations).toHaveLength(0);
  });

  it("checkedAt is set on result", () => {
    const contract = makeContract();
    const pkg = makePackage({ packageId: "p1" });
    const result = contract.validate(pkg, {});
    expect(result.checkedAt).toBe(FIXED_NOW);
  });
});

// ─── Factory ──────────────────────────────────────────────────────────────────

describe("createContextEnrichmentContract", () => {
  it("returns a working instance with default engine", () => {
    const contract = createContextEnrichmentContract();
    const pkg = makePackage({ packageId: "p1", segments: [makeSegment("s1", "QUERY", "q", 1)] });
    const result = contract.validate(pkg, {});
    expect(result.status).toBe("VALID");
  });

  it("accepts custom dependencies", () => {
    const contract = createContextEnrichmentContract({ now: fixedNow, estimateTokens: fixedTokens });
    const pkg = makePackage({ packageId: "p1" });
    const result = contract.validate(pkg, {});
    expect(result.checkedAt).toBe(FIXED_NOW);
  });
});
