export type ContextProfileFreshnessTag =
  | "canon"
  | "recent"
  | "stale"
  | "rejected";

export type ContextProfileEvidenceSensitivity =
  | "standard"
  | "redacted"
  | "restricted";

export interface ContextProfile {
  sessionId: string;
  profileVersion: string;
  budgetHints: {
    maxTokens?: number;
    maxSources?: number;
    compressionAllowed: boolean;
  };
  sourceRelevance: Array<{
    sourceId: string;
    relevanceScore: number;
    freshnessTag: ContextProfileFreshnessTag;
  }>;
  reinjectionEligibility: Array<{
    sourceId: string;
    eligibleFromPhase: string;
    requiresApproval: boolean;
  }>;
  evidenceSensitivity?: ContextProfileEvidenceSensitivity;
}

export interface AppliedContextProfile {
  rankedSources: string[];
  compressionAllowed: boolean;
  sensitivityLevel: ContextProfileEvidenceSensitivity;
  requiresPolicyValidation: boolean;
  reinjectionApprovalsRequired: string[];
  maxTokens?: number;
}

export function applyContextProfile(
  profile: ContextProfile,
  sources: string[],
): AppliedContextProfile {
  const sourceSet = new Set(sources);
  const budgetHints = profile.budgetHints;
  const maxSources =
    typeof budgetHints?.maxSources === "number" && budgetHints.maxSources >= 0
      ? Math.floor(budgetHints.maxSources)
      : undefined;
  const rankedSources = profile.sourceRelevance
    .filter((entry) => sourceSet.has(entry.sourceId))
    .filter((entry) => entry.freshnessTag !== "rejected")
    .filter((entry) => Number.isFinite(entry.relevanceScore))
    .sort((left, right) => right.relevanceScore - left.relevanceScore)
    .map((entry) => entry.sourceId)
    .slice(0, maxSources);
  const sensitivityLevel = profile.evidenceSensitivity ?? "standard";

  return {
    rankedSources,
    compressionAllowed: budgetHints?.compressionAllowed ?? true,
    sensitivityLevel,
    requiresPolicyValidation: sensitivityLevel === "restricted",
    reinjectionApprovalsRequired: profile.reinjectionEligibility
      .filter((entry) => sourceSet.has(entry.sourceId))
      .filter((entry) => entry.requiresApproval)
      .map((entry) => entry.sourceId),
    ...(typeof budgetHints?.maxTokens === "number" && budgetHints.maxTokens >= 0
      ? { maxTokens: Math.floor(budgetHints.maxTokens) }
      : {}),
  };
}
