// __tests__/risk.classifier.test.ts
import { riskClassifier } from "../02_TOOLKIT_CORE/risk.classifier"

describe("Risk Classifier", () => {

    describe("classify()", () => {

        it("should classify R1 for low-risk skill with matching capability", () => {
            const result = riskClassifier.classify({
                skillId: "data-lookup",
                skillBaseRisk: "R1",
                capabilityLevel: "C1",
                domain: "general",
                operatorRole: "ANALYST",
                environment: "dev"
            })
            expect(result.riskLevel).toBe("R1")
            expect(result.requiresApproval).toBe(false)
        })

        it("should classify R4 for critical-risk skill", () => {
            const result = riskClassifier.classify({
                skillId: "trade-executor",
                skillBaseRisk: "R4",
                capabilityLevel: "C4",
                domain: "financial",
                operatorRole: "ADMIN",
                environment: "dev"
            })
            expect(result.riskLevel).toBe("R4")
            expect(result.requiresApproval).toBe(true)
            expect(result.requiresUAT).toBe(true)
            expect(result.requiresFreeze).toBe(true)
        })

        it("should not escalate when capability exceeds base risk", () => {
            const result = riskClassifier.classify({
                skillId: "analysis-tool",
                skillBaseRisk: "R1",
                capabilityLevel: "C3",
                domain: "general",
                operatorRole: "REVIEWER",
                environment: "dev"
            })
            // C3 allows up to R3 — R1 is within limits, so no escalation
            expect(result.riskLevel).toBe("R1")
        })

        it("should apply financial domain minimum risk", () => {
            const result = riskClassifier.classify({
                skillId: "portfolio-view",
                skillBaseRisk: "R1",
                capabilityLevel: "C1",
                domain: "financial",
                operatorRole: "ANALYST",
                environment: "dev"
            })
            // Financial domain has minimum R2
            expect(["R2", "R3", "R4"]).toContain(result.riskLevel)
        })

        it("should cap risk based on environment", () => {
            const result = riskClassifier.classify({
                skillId: "high-risk-skill",
                skillBaseRisk: "R4",
                capabilityLevel: "C4",
                domain: "general",
                operatorRole: "ADMIN",
                environment: "staging"
            })
            // Staging caps at R2
            expect(result.environmentCapExceeded).toBe(true)
        })
    })
})
