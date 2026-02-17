// __tests__/phase.controller.test.ts
import { phaseController } from "../02_TOOLKIT_CORE/phase.controller"
import { PhaseState } from "../02_TOOLKIT_CORE/interfaces"

describe("Phase Controller", () => {

    const baseState: PhaseState = {
        projectId: "test-project",
        currentPhase: "P0_DESIGN",
        riskLevel: "R2",
        approvalGranted: false,
        uatPassed: false,
        freezeActive: false,
        environment: "dev"
    }

    describe("transitionPhase()", () => {

        it("should allow sequential transition P0 → P1", () => {
            const result = phaseController.transitionPhase(baseState, "P1_BUILD")
            expect(result.currentPhase).toBe("P1_BUILD")
        })

        it("should reject phase skip P0 → P3", () => {
            expect(() => {
                phaseController.transitionPhase(baseState, "P3_UAT")
            }).toThrow()
        })

        it("should reject non-rollback transition when freeze is active", () => {
            const frozenState: PhaseState = {
                ...baseState,
                freezeActive: true,
                currentPhase: "P6_FROZEN"
            }
            expect(() => {
                phaseController.transitionPhase(frozenState, "P1_BUILD")
            }).toThrow()
        })

        it("should allow P6 → P0 rollback when freeze is active", () => {
            const frozenState: PhaseState = {
                ...baseState,
                freezeActive: true,
                currentPhase: "P6_FROZEN"
            }
            const result = phaseController.transitionPhase(frozenState, "P0_DESIGN")
            expect(result.currentPhase).toBe("P0_DESIGN")
            expect(result.freezeActive).toBe(false)
        })
    })

    describe("activateFreeze()", () => {

        it("should freeze and move to P6_FROZEN", () => {
            const result = phaseController.activateFreeze(baseState)
            expect(result.freezeActive).toBe(true)
            expect(result.currentPhase).toBe("P6_FROZEN")
        })
    })
})
