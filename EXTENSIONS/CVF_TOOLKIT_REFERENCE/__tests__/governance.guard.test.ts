// __tests__/governance.guard.test.ts
import { enforceGovernance } from "../02_TOOLKIT_CORE/governance.guard"
import { skillRegistry } from "../02_TOOLKIT_CORE/skill.registry"

describe("Governance Guard", () => {

    beforeAll(() => {
        // Register test skills
        try {
            skillRegistry.register({
                id: "test-data-fetch",
                name: "Test Data Fetch",
                version: "1.0.0",
                description: "Low-risk data retrieval",
                riskLevel: "R1",
                domain: "general",
                requiredPhase: 1,
                requiresApproval: false,
                allowedRoles: ["ANALYST", "REVIEWER", "APPROVER", "ADMIN"],
                allowedEnvironments: ["dev", "staging", "prod"],
                requiresUAT: false,
                freezeOnRelease: false
            })
        } catch {
            // Already registered
        }

        try {
            skillRegistry.register({
                id: "test-high-risk",
                name: "Test High Risk",
                version: "1.0.0",
                description: "High-risk operation (R2 base, escalates to R3 in prod)",
                riskLevel: "R2",
                domain: "financial",
                requiredPhase: 3,
                requiresApproval: true,
                allowedRoles: ["APPROVER", "ADMIN"],
                allowedEnvironments: ["dev", "staging", "prod"],
                requiresUAT: true,
                freezeOnRelease: true
            })
        } catch {
            // Already registered
        }
    })

    describe("enforceGovernance()", () => {

        it("should allow R1 skill with valid operator", async () => {
            const result = await enforceGovernance({
                operatorId: "analyst-001",
                operatorRole: "ANALYST",
                skillId: "test-data-fetch",
                skillVersion: "1.0.0",
                environment: "dev",
                requestedPhase: "P1_BUILD"
            })
            expect(result.allowed).toBe(true)
            expect(result.riskLevel).toBe("R1")
        })

        it("should block unknown skill", async () => {
            await expect(
                enforceGovernance({
                    operatorId: "analyst-001",
                    operatorRole: "ANALYST",
                    skillId: "nonexistent-skill",
                    skillVersion: "1.0.0",
                    environment: "dev",
                    requestedPhase: "P1_BUILD"
                })
            ).rejects.toThrow()
        })

        it("should require approval for R3-escalated skill in prod", async () => {
            // R2 base risk + prod environment → affectsProduction → escalates to R3
            const result = await enforceGovernance({
                operatorId: "approver-001",
                operatorRole: "APPROVER",
                skillId: "test-high-risk",
                skillVersion: "1.0.0",
                environment: "prod",
                requestedPhase: "P3_UAT"
            })
            expect(result.riskLevel).toBe("R3")
            expect(result.requiresApproval).toBe(true)
            expect(result.requiresUAT).toBe(true)
        })
    })
})
