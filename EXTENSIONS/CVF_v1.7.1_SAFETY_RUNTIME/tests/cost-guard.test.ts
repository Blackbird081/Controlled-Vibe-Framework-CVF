import { describe, it, expect } from "vitest"
import { CostGuard } from "../policy/cost.guard"
import type { CostValidationInput } from "../policy/cost.guard"

function makeInput(overrides: Partial<{
    tokensUsed: number
    generationTimeMs: number
    filesGenerated: number
    userDailyTokens: number
    orgDailyTokens: number
}>): CostValidationInput {
    return {
        snapshot: {
            tokensUsed: overrides.tokensUsed ?? 100,
            generationTimeMs: overrides.generationTimeMs ?? 500,
            filesGenerated: overrides.filesGenerated ?? 1,
        },
        limits: {
            maxTokensPerProposal: 1000,
            maxTokensPerUserPerDay: 5000,
            maxTokensPerOrgPerDay: 20000,
            maxGenerationTimeMs: 10000,
            maxFilesPerProposal: 10,
        },
        accumulated: {
            userDailyTokens: overrides.userDailyTokens ?? 0,
            orgDailyTokens: overrides.orgDailyTokens ?? 0,
        },
    }
}

describe("CostGuard", () => {
    it("should return OK for within-limits usage", () => {
        const result = CostGuard.validate(makeInput({}))
        expect(result.level).toBe("OK")
        expect(result.reasons).toHaveLength(0)
    })

    it("should LIMIT_EXCEEDED when tokens exceed per-proposal max", () => {
        const result = CostGuard.validate(makeInput({ tokensUsed: 2000 }))
        expect(result.level).toBe("LIMIT_EXCEEDED")
        expect(result.reasons).toContain("Proposal token limit exceeded")
    })

    it("should LIMIT_EXCEEDED when files exceed per-proposal max", () => {
        const result = CostGuard.validate(makeInput({ filesGenerated: 15 }))
        expect(result.level).toBe("LIMIT_EXCEEDED")
        expect(result.reasons).toContain("File generation limit exceeded")
    })

    it("should LIMIT_EXCEEDED when generation time exceeds max", () => {
        const result = CostGuard.validate(makeInput({ generationTimeMs: 15000 }))
        expect(result.level).toBe("LIMIT_EXCEEDED")
        expect(result.reasons).toContain("Generation time exceeded limit")
    })

    it("should LIMIT_EXCEEDED when user daily tokens are over budget", () => {
        const result = CostGuard.validate(makeInput({ tokensUsed: 500, userDailyTokens: 4800 }))
        expect(result.level).toBe("LIMIT_EXCEEDED")
        expect(result.reasons).toContain("User daily token budget exceeded")
    })

    it("should LIMIT_EXCEEDED when org daily tokens are over budget", () => {
        const result = CostGuard.validate(makeInput({ tokensUsed: 500, orgDailyTokens: 19800 }))
        expect(result.level).toBe("LIMIT_EXCEEDED")
        expect(result.reasons).toContain("Organization daily token budget exceeded")
    })

    it("should WARNING when tokens are > 80% of limit", () => {
        const result = CostGuard.validate(makeInput({ tokensUsed: 850 }))
        expect(result.level).toBe("WARNING")
        expect(result.reasons).toContain("Proposal nearing token limit")
    })

    it("should not warn if already LIMIT_EXCEEDED", () => {
        const result = CostGuard.validate(makeInput({ tokensUsed: 2000 }))
        expect(result.level).toBe("LIMIT_EXCEEDED")
        // Should NOT also contain warning
        expect(result.reasons).not.toContain("Proposal nearing token limit")
    })
})
