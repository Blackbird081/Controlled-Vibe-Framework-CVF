import { describe, it, expect, beforeEach } from "vitest"
import {
    guardProposal,
    registerTokenUsage,
    resetTokenUsage,
    registerProviderBudget,
    guardBudget,
} from "../adapters/openclaw/safety.guard"

function makeProposal(overrides: Record<string, unknown> = {}) {
    return {
        id: "test-id",
        source: "openclaw" as const,
        action: "deploy",
        payload: {},
        createdAt: Date.now(),
        confidence: 1,
        riskLevel: "low" as const,
        ...overrides,
    }
}

describe("guardProposal", () => {
    it("should allow normal proposals", () => {
        const result = guardProposal(makeProposal())
        expect(result.allowed).toBe(true)
    })

    it("should block proposals with dangerous actions", () => {
        const result = guardProposal(makeProposal({ action: "delete_database" }))
        expect(result.allowed).toBe(false)
        expect(result.reason).toBe("Blocked high-risk action")
    })

    it("should block shutdown_system action", () => {
        const result = guardProposal(makeProposal({ action: "shutdown_system" }))
        expect(result.allowed).toBe(false)
    })

    it("should block transfer_funds action", () => {
        const result = guardProposal(makeProposal({ action: "transfer_funds" }))
        expect(result.allowed).toBe(false)
    })

    it("should escalate risk for low confidence", () => {
        const result = guardProposal(makeProposal({ confidence: 0.2 }))
        expect(result.allowed).toBe(true)
        expect(result.escalatedRisk).toBe("high")
    })
})

describe("token usage tracking", () => {
    beforeEach(() => {
        resetTokenUsage()
    })

    it("should track global token usage", () => {
        registerTokenUsage("openai", 100)
        registerTokenUsage("openai", 200)
        expect(guardBudget("openai")).toBe(true)
    })

    it("should respect provider budget limits", () => {
        registerProviderBudget("testProvider", 50)
        registerTokenUsage("testProvider", 30)
        expect(guardBudget("testProvider")).toBe(true)
        registerTokenUsage("testProvider", 25)
        expect(guardBudget("testProvider")).toBe(false)
    })

    it("should reset token usage", () => {
        registerProviderBudget("test", 100)
        registerTokenUsage("test", 80)
        resetTokenUsage()
        expect(guardBudget("test")).toBe(true)
    })
})
