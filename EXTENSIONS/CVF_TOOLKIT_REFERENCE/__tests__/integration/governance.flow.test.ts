// __tests__/integration/governance.flow.test.ts
// Integration test: Full governance flow from skill → provider

import { skillRegistry } from "../../02_TOOLKIT_CORE/skill.registry"
import { enforceGovernance } from "../../02_TOOLKIT_CORE/governance.guard"
import { auditLogger } from "../../02_TOOLKIT_CORE/audit.logger"

describe("Integration: Governance Flow", () => {

    beforeAll(() => {
        try {
            skillRegistry.register({
                id: "int-test-skill",
                name: "Integration Test Skill",
                version: "1.0.0",
                description: "Skill for integration testing",
                riskLevel: "R2",
                domain: "general",
                requiredPhase: 2,
                requiresApproval: false,
                allowedRoles: ["REVIEWER", "APPROVER", "ADMIN"],
                allowedEnvironments: ["dev", "staging"],
                requiresUAT: true,
                freezeOnRelease: false
            })
        } catch {
            // Already registered
        }
    })

    it("should complete full governance flow: skill → governance → audit", async () => {
        // 1. Verify skill exists
        const skill = skillRegistry.get("int-test-skill")
        expect(skill).toBeDefined()
        expect(skill.riskLevel).toBe("R2")

        // 2. Run governance check
        const decision = await enforceGovernance({
            operatorId: "reviewer-001",
            operatorRole: "REVIEWER",
            skillId: "int-test-skill",
            skillVersion: "1.0.0",
            environment: "dev",
            requestedPhase: "P2_INTERNAL_VALIDATION"
        })

        expect(decision.allowed).toBe(true)
        expect(decision.requiresUAT).toBe(true)

        // 3. Verify audit trail exists — governance.guard logs PHASE_VALIDATION events
        const logs = auditLogger.getAll()
        const governanceLogs = logs.filter(l =>
            l.eventType === "PHASE_VALIDATION"
        )
        expect(governanceLogs.length).toBeGreaterThan(0)
    })

    it("should block incorrect operator role", async () => {
        await expect(
            enforceGovernance({
                operatorId: "analyst-001",
                operatorRole: "ANALYST",  // Not in allowedRoles ["REVIEWER", "APPROVER", "ADMIN"]
                skillId: "int-test-skill",
                skillVersion: "1.0.0",
                environment: "dev",
                requestedPhase: "P2_INTERNAL_VALIDATION"
            })
        ).rejects.toThrow()
    })
})
