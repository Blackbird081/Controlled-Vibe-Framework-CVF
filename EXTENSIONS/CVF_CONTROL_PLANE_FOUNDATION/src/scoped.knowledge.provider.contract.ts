import type { ContextProfile } from "./context.profile.contract";
import type { VaultAssetType } from "./knowledge.vault.intake.types";

export type ScopedKnowledgeProviderClass =
  | "code-graph"
  | "cortex"
  | "source-map"
  | "indexed-reference";

export type ScopedKnowledgeSourceClass =
  | "canon"
  | "reference"
  | "example"
  | "rejected";

export type ScopedKnowledgeFreshness = "live" | "cached" | "stale";

export interface ScopedKnowledgeProvider {
  providerId: string;
  providerClass: ScopedKnowledgeProviderClass;
  scope: {
    repoPaths: string[];
    excludePaths: string[];
    languageFilter?: string[];
  };
  metadata: {
    sourceClass: ScopedKnowledgeSourceClass;
    freshness: ScopedKnowledgeFreshness;
    confidence: number;
    lastSync: string;
  };
  queryContract: {
    readOnly: true;
    maxResultsPerQuery: number;
    cachingPolicy: string;
  };
  blockedFromActing: true;
}

export interface ScopedKnowledgeProviderValidation {
  valid: boolean;
  violations: string[];
}

export function queryProvider(
  provider: ScopedKnowledgeProvider,
  query: { path: string; maxResults: number },
): { results: string[]; source: string; freshness: string } {
  if (provider.metadata.sourceClass === "rejected") {
    return { results: [], source: provider.providerId, freshness: provider.metadata.freshness };
  }

  const queryPath = normalizePath(query.path);
  const maxResults = Math.max(
    0,
    Math.min(query.maxResults, provider.queryContract.maxResultsPerQuery),
  );

  const results = provider.scope.repoPaths
    .map(normalizePath)
    .filter((path) => !isExcluded(path, provider.scope.excludePaths))
    .filter((path) => !queryPath || pathWithin(path, queryPath) || path.includes(queryPath))
    .filter((path) => matchesLanguage(path, provider.scope.languageFilter))
    .slice(0, maxResults);

  return {
    results,
    source: provider.providerId,
    freshness: provider.metadata.freshness,
  };
}

export function guardProviderAction(
  provider: ScopedKnowledgeProvider,
  proposedAction: string,
): { allowed: false; reason: string } {
  return {
    allowed: false,
    reason: `Scoped knowledge provider ${provider.providerId} is read-only and cannot ${proposedAction}`,
  };
}

export function validateScopedKnowledgeProvider(
  provider: Partial<ScopedKnowledgeProvider>,
): ScopedKnowledgeProviderValidation {
  const violations: string[] = [];

  if (!isNonEmptyString(provider.providerId)) {
    violations.push("providerId must be non-empty");
  }
  if (!isProviderClass(provider.providerClass)) {
    violations.push("providerClass is invalid");
  }
  if (!provider.scope) {
    violations.push("scope is required");
  }
  if (!provider.metadata) {
    violations.push("metadata is required");
  } else {
    if (!isSourceClass(provider.metadata.sourceClass)) {
      violations.push("metadata.sourceClass is invalid");
    }
    if (!isFreshness(provider.metadata.freshness)) {
      violations.push("metadata.freshness is invalid");
    }
    if (provider.metadata.confidence < 0 || provider.metadata.confidence > 1) {
      violations.push("metadata.confidence must be between 0 and 1");
    }
  }
  if (!provider.queryContract) {
    violations.push("queryContract is required");
  } else {
    if (provider.queryContract.readOnly !== true) {
      violations.push("queryContract.readOnly must be true");
    }
    if (
      !Number.isInteger(provider.queryContract.maxResultsPerQuery) ||
      provider.queryContract.maxResultsPerQuery < 0
    ) {
      violations.push("queryContract.maxResultsPerQuery must be a non-negative integer");
    }
  }
  if (provider.blockedFromActing !== true) {
    violations.push("blockedFromActing must be true");
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

export function providerToContextProfileSourceRelevance(
  provider: ScopedKnowledgeProvider,
): ContextProfile["sourceRelevance"][number] {
  return {
    sourceId: provider.providerId,
    relevanceScore: provider.metadata.confidence,
    freshnessTag: mapFreshness(provider),
  };
}

export function providerToKnowledgeVaultAssetType(
  provider: ScopedKnowledgeProvider,
): VaultAssetType {
  void provider;
  return "external_reference";
}

function mapFreshness(provider: ScopedKnowledgeProvider): ContextProfile["sourceRelevance"][number]["freshnessTag"] {
  if (provider.metadata.sourceClass === "rejected") {
    return "rejected";
  }
  if (provider.metadata.sourceClass === "canon") {
    return "canon";
  }
  return provider.metadata.freshness === "stale" ? "stale" : "recent";
}

function matchesLanguage(path: string, languageFilter?: string[]): boolean {
  if (!languageFilter || languageFilter.length === 0) {
    return true;
  }
  const extension = path.split(".").pop()?.toLowerCase();
  return extension ? languageFilter.map((value) => value.toLowerCase()).includes(extension) : false;
}

function isExcluded(path: string, excludePaths: string[]): boolean {
  return excludePaths.map(normalizePath).some((excludePath) => pathWithin(path, excludePath));
}

function pathWithin(path: string, directory: string): boolean {
  const normalizedDirectory = normalizePath(directory).replace(/\/+$/, "");
  return path === normalizedDirectory || path.startsWith(`${normalizedDirectory}/`);
}

function normalizePath(path: string): string {
  return path.trim().replace(/\\/g, "/").replace(/^\.\/+/, "");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isProviderClass(value: unknown): value is ScopedKnowledgeProviderClass {
  return (
    value === "code-graph" ||
    value === "cortex" ||
    value === "source-map" ||
    value === "indexed-reference"
  );
}

function isSourceClass(value: unknown): value is ScopedKnowledgeSourceClass {
  return value === "canon" || value === "reference" || value === "example" || value === "rejected";
}

function isFreshness(value: unknown): value is ScopedKnowledgeFreshness {
  return value === "live" || value === "cached" || value === "stale";
}
