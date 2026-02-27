export interface CostUsageSnapshot {
  tokensUsed: number
  generationTimeMs: number
  filesGenerated: number
}

export interface CostPolicyLimits {
  maxTokensPerProposal: number
  maxTokensPerUserPerDay: number
  maxTokensPerOrgPerDay: number
  maxGenerationTimeMs: number
  maxFilesPerProposal: number
}

export interface CostAccumulatedUsage {
  userDailyTokens: number
  orgDailyTokens: number
}

export interface CostValidationInput {
  snapshot: CostUsageSnapshot
  limits: CostPolicyLimits
  accumulated: CostAccumulatedUsage
}

export type CostLevel = "OK" | "WARNING" | "LIMIT_EXCEEDED"

export interface CostValidationResult {
  level: CostLevel
  reasons: string[]
}

export class CostGuard {
  static validate(input: CostValidationInput): CostValidationResult {
    const reasons: string[] = []
    let level: CostLevel = "OK"

    const { snapshot, limits, accumulated } = input

    // Proposal token limit
    if (snapshot.tokensUsed > limits.maxTokensPerProposal) {
      level = "LIMIT_EXCEEDED"
      reasons.push("Proposal token limit exceeded")
    }

    // File count limit
    if (snapshot.filesGenerated > limits.maxFilesPerProposal) {
      level = "LIMIT_EXCEEDED"
      reasons.push("File generation limit exceeded")
    }

    // Generation time limit
    if (snapshot.generationTimeMs > limits.maxGenerationTimeMs) {
      level = "LIMIT_EXCEEDED"
      reasons.push("Generation time exceeded limit")
    }

    // User daily token limit
    if (
      accumulated.userDailyTokens + snapshot.tokensUsed >
      limits.maxTokensPerUserPerDay
    ) {
      level = "LIMIT_EXCEEDED"
      reasons.push("User daily token budget exceeded")
    }

    // Org daily token limit
    if (accumulated.orgDailyTokens + snapshot.tokensUsed > limits.maxTokensPerOrgPerDay) {
      level = "LIMIT_EXCEEDED"
      reasons.push("Organization daily token budget exceeded")
    }

    // Warning threshold (80%)
    if (level === "OK") {
      if (snapshot.tokensUsed > limits.maxTokensPerProposal * 0.8) {
        level = "WARNING"
        reasons.push("Proposal nearing token limit")
      }
    }

    return {
      level,
      reasons,
    }
  }
}
