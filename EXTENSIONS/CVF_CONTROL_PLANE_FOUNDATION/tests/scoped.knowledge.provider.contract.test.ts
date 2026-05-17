import { describe, expect, it } from "vitest";
import {
  guardProviderAction,
  providerToKnowledgeVaultAssetType,
  providerToContextProfileSourceRelevance,
  queryProvider,
  validateScopedKnowledgeProvider,
  type ScopedKnowledgeProvider,
} from "../src/scoped.knowledge.provider.contract";

const provider = (
  overrides: Partial<ScopedKnowledgeProvider> = {},
): ScopedKnowledgeProvider => ({
  providerId: "provider-code-graph",
  providerClass: "code-graph",
  scope: {
    repoPaths: [
      "src/app.ts",
      "src/lib/util.ts",
      "src/lib/util.test.ts",
      "docs/guide.md",
      "private/secret.ts",
    ],
    excludePaths: ["private"],
    languageFilter: ["ts"],
  },
  metadata: {
    sourceClass: "reference",
    freshness: "live",
    confidence: 0.8,
    lastSync: "2026-05-17T00:00:00.000Z",
  },
  queryContract: {
    readOnly: true,
    maxResultsPerQuery: 2,
    cachingPolicy: "session",
  },
  blockedFromActing: true,
  ...overrides,
});

describe("ScopedKnowledgeProvider", () => {
  it("validates a provider with all fields", () => {
    expect(validateScopedKnowledgeProvider(provider()).valid).toBe(true);
  });

  it("returns query results within maxResultsPerQuery", () => {
    expect(queryProvider(provider(), { path: "src", maxResults: 10 }).results).toHaveLength(2);
  });

  it("respects query maxResults below provider limit", () => {
    expect(queryProvider(provider(), { path: "src", maxResults: 1 }).results).toHaveLength(1);
  });

  it("respects excludePaths", () => {
    expect(queryProvider(provider(), { path: "", maxResults: 10 }).results).not.toContain(
      "private/secret.ts",
    );
  });

  it("respects languageFilter", () => {
    expect(queryProvider(provider(), { path: "", maxResults: 10 }).results).toEqual([
      "src/app.ts",
      "src/lib/util.ts",
    ]);
  });

  it("allows missing languageFilter", () => {
    const result = queryProvider(
      provider({
        scope: { ...provider().scope, languageFilter: undefined },
        queryContract: { ...provider().queryContract, maxResultsPerQuery: 10 },
      }),
      { path: "", maxResults: 10 },
    );

    expect(result.results).toContain("docs/guide.md");
  });

  it("always blocks provider actions", () => {
    expect(guardProviderAction(provider(), "classify risk")).toMatchObject({
      allowed: false,
    });
  });

  it("skips rejected providers during query", () => {
    const result = queryProvider(
      provider({ metadata: { ...provider().metadata, sourceClass: "rejected" } }),
      { path: "", maxResults: 10 },
    );

    expect(result.results).toEqual([]);
  });

  it("keeps stale providers valid and tagged", () => {
    const stale = provider({ metadata: { ...provider().metadata, freshness: "stale" } });
    expect(validateScopedKnowledgeProvider(stale).valid).toBe(true);
    expect(queryProvider(stale, { path: "", maxResults: 1 }).freshness).toBe("stale");
  });

  it("enforces blockedFromActing true at type level", () => {
    const subject: ScopedKnowledgeProvider = provider({ blockedFromActing: true });
    expect(subject.blockedFromActing).toBe(true);
  });

  it("maps provider output into ContextProfile sourceRelevance", () => {
    expect(providerToContextProfileSourceRelevance(provider())).toEqual({
      sourceId: "provider-code-graph",
      relevanceScore: 0.8,
      freshnessTag: "recent",
    });
  });

  it("maps all scoped providers to the knowledge vault external_reference intake class", () => {
    expect(providerToKnowledgeVaultAssetType(provider())).toBe("external_reference");
    expect(providerToKnowledgeVaultAssetType(provider({ providerClass: "cortex" }))).toBe(
      "external_reference",
    );
  });

  it("maps canon providers to canon freshness tag", () => {
    expect(
      providerToContextProfileSourceRelevance(
        provider({ metadata: { ...provider().metadata, sourceClass: "canon" } }),
      ).freshnessTag,
    ).toBe("canon");
  });

  it("maps rejected providers to rejected freshness tag", () => {
    expect(
      providerToContextProfileSourceRelevance(
        provider({ metadata: { ...provider().metadata, sourceClass: "rejected" } }),
      ).freshnessTag,
    ).toBe("rejected");
  });

  it("returns empty results when repoPaths is empty", () => {
    expect(
      queryProvider(provider({ scope: { ...provider().scope, repoPaths: [] } }), {
        path: "",
        maxResults: 10,
      }).results,
    ).toEqual([]);
  });

  it("allows confidence 0", () => {
    expect(
      validateScopedKnowledgeProvider(
        provider({ metadata: { ...provider().metadata, confidence: 0 } }),
      ).valid,
    ).toBe(true);
  });

  it("allows confidence 1", () => {
    expect(
      validateScopedKnowledgeProvider(
        provider({ metadata: { ...provider().metadata, confidence: 1 } }),
      ).valid,
    ).toBe(true);
  });

  it("rejects confidence below 0", () => {
    expect(
      validateScopedKnowledgeProvider(
        provider({ metadata: { ...provider().metadata, confidence: -0.1 } }),
      ).valid,
    ).toBe(false);
  });

  it("rejects confidence above 1", () => {
    expect(
      validateScopedKnowledgeProvider(
        provider({ metadata: { ...provider().metadata, confidence: 1.1 } }),
      ).violations,
    ).toContain("metadata.confidence must be between 0 and 1");
  });

  it("rejects readOnly false at validation boundary", () => {
    const subject = provider() as Partial<ScopedKnowledgeProvider>;
    subject.queryContract = {
      ...provider().queryContract,
      readOnly: false as ScopedKnowledgeProvider["queryContract"]["readOnly"],
    };

    expect(validateScopedKnowledgeProvider(subject).valid).toBe(false);
  });

  it("rejects blockedFromActing false at validation boundary", () => {
    const subject = provider() as Partial<ScopedKnowledgeProvider>;
    subject.blockedFromActing = false as ScopedKnowledgeProvider["blockedFromActing"];

    expect(validateScopedKnowledgeProvider(subject).valid).toBe(false);
  });

  it("rejects negative maxResultsPerQuery", () => {
    expect(
      validateScopedKnowledgeProvider(
        provider({ queryContract: { ...provider().queryContract, maxResultsPerQuery: -1 } }),
      ).valid,
    ).toBe(false);
  });

  it("supports multi-language filters", () => {
    const result = queryProvider(
      provider({
        scope: { ...provider().scope, languageFilter: ["ts", "md"] },
        queryContract: { ...provider().queryContract, maxResultsPerQuery: 10 },
      }),
      { path: "", maxResults: 10 },
    );

    expect(result.results).toContain("docs/guide.md");
  });

  it("blocks policy override attempts", () => {
    expect(guardProviderAction(provider(), "override governance decision").reason).toContain(
      "read-only",
    );
  });

  it("flags missing provider identity", () => {
    expect(validateScopedKnowledgeProvider(provider({ providerId: "" })).valid).toBe(false);
  });

  it("flags invalid provider class", () => {
    expect(
      validateScopedKnowledgeProvider(
        provider({ providerClass: "crawler" as ScopedKnowledgeProvider["providerClass"] }),
      ).violations,
    ).toContain("providerClass is invalid");
  });
});
