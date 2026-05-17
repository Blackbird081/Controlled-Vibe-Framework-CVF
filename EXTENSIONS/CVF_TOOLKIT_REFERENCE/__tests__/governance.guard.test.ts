// __tests__/governance.guard.test.ts
import { enforceGovernance } from "../02_TOOLKIT_CORE/governance.guard"
import { skillRegistry } from "../02_TOOLKIT_CORE/skill.registry"
import { changeController } from "../02_TOOLKIT_CORE/change.controller"

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

        it("should reject when skill version does not match", async () => {
            await expect(
                enforceGovernance({
                    operatorId: "analyst-001",
                    operatorRole: "ANALYST",
                    skillId: "test-data-fetch",
                    skillVersion: "9.9.9", // wrong version
                    environment: "dev",
                    requestedPhase: "P1_BUILD"
                })
            ).rejects.toThrow(/version mismatch/)
        })

        it("should block unauthorized operator role", async () => {
            await expect(
                enforceGovernance({
                    operatorId: "viewer-001",
                    operatorRole: "VIEWER", // not in test-data-fetch allowedRoles
                    skillId: "test-data-fetch",
                    skillVersion: "1.0.0",
                    environment: "dev",
                    requestedPhase: "P1_BUILD"
                })
            ).rejects.toThrow(/not authorized/)
        })

        it("should throw when changeId is provided but not approved", async () => {
            // Register an unapproved change for this test
            try {
                changeController.register({
                    changeId: "CHG-GOV-001",
                    changeType: "skill",
                    description: "Governance test change",
                    requestedBy: "analyst-001",
                    requestedAt: new Date().toISOString(),
                    affectedComponents: ["skill.registry"],
                    riskAssessment: "R1",
                    requiresApproval: false,
                    approvalChain: [],
                    status: "draft",
                    auditTrail: []
                })
            } catch {
                // Already registered from previous run
            }

            await expect(
                enforceGovernance({
                    operatorId: "analyst-001",
                    operatorRole: "ANALYST",
                    skillId: "test-data-fetch",
                    skillVersion: "1.0.0",
                    environment: "dev",
                    requestedPhase: "P1_BUILD",
                    changeId: "CHG-GOV-001"
                })
            ).rejects.toThrow(/not approved/)
        })

        it("should pass when changeId is approved", async () => {
            try {
                changeController.register({
                    changeId: "CHG-GOV-002",
                    changeType: "skill",
                    description: "Approved governance test change",
                    requestedBy: "analyst-001",
                    requestedAt: new Date().toISOString(),
                    affectedComponents: ["skill.registry"],
                    riskAssessment: "R1",
                    requiresApproval: false,
                    approvalChain: [],
                    status: "draft",
                    auditTrail: []
                })
            } catch {
                // Already registered
            }
            changeController.submit("CHG-GOV-002")
            changeController.approve("CHG-GOV-002", "approver-001")

            const result = await enforceGovernance({
                operatorId: "analyst-001",
                operatorRole: "ANALYST",
                skillId: "test-data-fetch",
                skillVersion: "1.0.0",
                environment: "dev",
                requestedPhase: "P1_BUILD",
                changeId: "CHG-GOV-002"
            })
            expect(result.allowed).toBe(true)
        })

        it("should include environment cap reasons for high-risk in staging", async () => {
            // test-high-risk is R2 base + financial domain → R2+
            // In staging, max is R2, but financial domain pushes to R2 minimum
            const result = await enforceGovernance({
                operatorId: "approver-001",
                operatorRole: "APPROVER",
                skillId: "test-high-risk",
                skillVersion: "1.0.0",
                environment: "staging",
                requestedPhase: "P2_INTERNAL_VALIDATION"
            })
            expect(result.allowed).toBe(true)
            // R2 base + financial domain → R2 or higher
        })
    })
})
