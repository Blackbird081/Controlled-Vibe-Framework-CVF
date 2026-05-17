import { describe, expect, it } from "vitest";
import {
  applyContextProfile,
  type ContextProfile,
} from "../src/context.profile.contract";

const profile = (overrides: Partial<ContextProfile> = {}): ContextProfile => ({
  sessionId: "session-001",
  profileVersion: "2026-05-17",
  budgetHints: {
    maxTokens: 4096,
    maxSources: 3,
    compressionAllowed: true,
  },
  sourceRelevance: [
    { sourceId: "canon-a", relevanceScore: 0.9, freshnessTag: "canon" },
    { sourceId: "recent-b", relevanceScore: 0.7, freshnessTag: "recent" },
  ],
  reinjectionEligibility: [
    { sourceId: "canon-a", eligibleFromPhase: "DESIGN", requiresApproval: false },
  ],
  evidenceSensitivity: "standard",
  ...overrides,
});

describe("ContextProfile", () => {
  it("round-trips a valid profile with all fields", () => {
    const subject = profile({ evidenceSensitivity: "redacted" });
    expect(JSON.parse(JSON.stringify(subject))).toEqual(subject);
  });

  it("does not crash when budgetHints is missing at runtime", () => {
    const { budgetHints: _budgetHints, ...subject } = profile();

    expect(applyContextProfile(subject as ContextProfile, ["canon-a"])).toMatchObject({
      rankedSources: ["canon-a"],
      compressionAllowed: true,
      sensitivityLevel: "standard",
    });
  });

  it("ranks sources by descending relevance score", () => {
    const result = applyContextProfile(
      profile({
        sourceRelevance: [
          { sourceId: "b", relevanceScore: 0.2, freshnessTag: "recent" },
          { sourceId: "a", relevanceScore: 0.95, freshnessTag: "canon" },
          { sourceId: "c", relevanceScore: 0.6, freshnessTag: "stale" },
        ],
      }),
      ["a", "b", "c"],
    );

    expect(result.rankedSources).toEqual(["a", "c", "b"]);
  });

  it("excludes rejected sources from ranked output", () => {
    const result = applyContextProfile(
      profile({
        sourceRelevance: [
          { sourceId: "bad", relevanceScore: 1, freshnessTag: "rejected" },
          { sourceId: "good", relevanceScore: 0.1, freshnessTag: "recent" },
        ],
      }),
      ["bad", "good"],
    );

    expect(result.rankedSources).toEqual(["good"]);
  });

  it("preserves compressionAllowed false", () => {
    const result = applyContextProfile(
      profile({ budgetHints: { compressionAllowed: false } }),
      ["canon-a"],
    );

    expect(result.compressionAllowed).toBe(false);
  });

  it("marks restricted sensitivity for policy validation", () => {
    const result = applyContextProfile(
      profile({ evidenceSensitivity: "restricted" }),
      ["canon-a"],
    );

    expect(result.sensitivityLevel).toBe("restricted");
    expect(result.requiresPolicyValidation).toBe(true);
  });

  it("does not mark standard sensitivity for policy validation", () => {
    const result = applyContextProfile(
      profile({ evidenceSensitivity: "standard" }),
      ["canon-a"],
    );

    expect(result.requiresPolicyValidation).toBe(false);
  });

  it("tags reinjection entries that require approval", () => {
    const result = applyContextProfile(
      profile({
        reinjectionEligibility: [
          { sourceId: "canon-a", eligibleFromPhase: "BUILD", requiresApproval: true },
          { sourceId: "recent-b", eligibleFromPhase: "REVIEW", requiresApproval: false },
        ],
      }),
      ["canon-a", "recent-b"],
    );

    expect(result.reinjectionApprovalsRequired).toEqual(["canon-a"]);
  });

  it("returns empty ranked sources for empty sourceRelevance", () => {
    expect(
      applyContextProfile(profile({ sourceRelevance: [] }), ["canon-a"]).rankedSources,
    ).toEqual([]);
  });

  it("skips unknown source IDs gracefully", () => {
    const result = applyContextProfile(
      profile({
        sourceRelevance: [
          { sourceId: "missing", relevanceScore: 1, freshnessTag: "canon" },
          { sourceId: "known", relevanceScore: 0.5, freshnessTag: "recent" },
        ],
      }),
      ["known"],
    );

    expect(result.rankedSources).toEqual(["known"]);
  });

  it("applies maxSources as a ranked output limit", () => {
    const result = applyContextProfile(
      profile({
        budgetHints: { maxSources: 1, compressionAllowed: true },
        sourceRelevance: [
          { sourceId: "a", relevanceScore: 0.9, freshnessTag: "canon" },
          { sourceId: "b", relevanceScore: 0.8, freshnessTag: "recent" },
        ],
      }),
      ["a", "b"],
    );

    expect(result.rankedSources).toEqual(["a"]);
  });

  it("ignores negative maxSources instead of crashing", () => {
    const result = applyContextProfile(
      profile({ budgetHints: { maxSources: -1, compressionAllowed: true } }),
      ["canon-a", "recent-b"],
    );

    expect(result.rankedSources).toEqual(["canon-a", "recent-b"]);
  });

  it("floors fractional maxSources", () => {
    const result = applyContextProfile(
      profile({ budgetHints: { maxSources: 1.9, compressionAllowed: true } }),
      ["canon-a", "recent-b"],
    );

    expect(result.rankedSources).toEqual(["canon-a"]);
  });

  it("preserves valid maxTokens as an integer", () => {
    const result = applyContextProfile(
      profile({ budgetHints: { maxTokens: 2000.9, compressionAllowed: true } }),
      ["canon-a"],
    );

    expect(result.maxTokens).toBe(2000);
  });

  it("omits negative maxTokens", () => {
    const result = applyContextProfile(
      profile({ budgetHints: { maxTokens: -1, compressionAllowed: true } }),
      ["canon-a"],
    );

    expect(result.maxTokens).toBeUndefined();
  });

  it("skips non-finite relevance scores", () => {
    const result = applyContextProfile(
      profile({
        sourceRelevance: [
          { sourceId: "bad", relevanceScore: Number.NaN, freshnessTag: "canon" },
          { sourceId: "good", relevanceScore: 0.5, freshnessTag: "recent" },
        ],
      }),
      ["bad", "good"],
    );

    expect(result.rankedSources).toEqual(["good"]);
  });

  it("allows scores outside the 0 to 1 advisory range without crashing", () => {
    const result = applyContextProfile(
      profile({
        sourceRelevance: [
          { sourceId: "high", relevanceScore: 2, freshnessTag: "canon" },
          { sourceId: "low", relevanceScore: -1, freshnessTag: "recent" },
        ],
      }),
      ["high", "low"],
    );

    expect(result.rankedSources).toEqual(["high", "low"]);
  });

  it("defaults missing evidenceSensitivity to standard", () => {
    const subject = profile();
    delete subject.evidenceSensitivity;

    expect(applyContextProfile(subject, ["canon-a"]).sensitivityLevel).toBe("standard");
  });

  it("skips approval tags for unknown reinjection sources", () => {
    const result = applyContextProfile(
      profile({
        reinjectionEligibility: [
          { sourceId: "missing", eligibleFromPhase: "BUILD", requiresApproval: true },
        ],
      }),
      ["canon-a"],
    );

    expect(result.reinjectionApprovalsRequired).toEqual([]);
  });

  it("handles an empty source registry without crashing", () => {
    const result = applyContextProfile(profile(), []);

    expect(result.rankedSources).toEqual([]);
    expect(result.reinjectionApprovalsRequired).toEqual([]);
  });

  it("keeps stale sources unless they are explicitly rejected", () => {
    const result = applyContextProfile(
      profile({
        sourceRelevance: [
          { sourceId: "stale-source", relevanceScore: 0.4, freshnessTag: "stale" },
        ],
      }),
      ["stale-source"],
    );

    expect(result.rankedSources).toEqual(["stale-source"]);
  });
});
