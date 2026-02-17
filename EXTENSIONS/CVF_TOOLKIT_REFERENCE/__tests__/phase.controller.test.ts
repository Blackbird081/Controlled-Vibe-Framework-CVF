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

        it("should allow sequential transition P1 → P2", () => {
            const state: PhaseState = { ...baseState, currentPhase: "P1_BUILD" }
            const result = phaseController.transitionPhase(state, "P2_INTERNAL_VALIDATION")
            expect(result.currentPhase).toBe("P2_INTERNAL_VALIDATION")
        })

        it("should allow sequential transition P2 → P3", () => {
            const state: PhaseState = { ...baseState, currentPhase: "P2_INTERNAL_VALIDATION" }
            const result = phaseController.transitionPhase(state, "P3_UAT")
            expect(result.currentPhase).toBe("P3_UAT")
        })

        it("should allow P3 → P4 when approval granted and UAT passed for R3", () => {
            const state: PhaseState = {
                ...baseState,
                currentPhase: "P3_UAT",
                riskLevel: "R3",
                approvalGranted: true,
                uatPassed: true
            }
            const result = phaseController.transitionPhase(state, "P4_APPROVED")
            expect(result.currentPhase).toBe("P4_APPROVED")
        })

        it("should reject P3 → P4 when approval not granted for R3", () => {
            const state: PhaseState = {
                ...baseState,
                currentPhase: "P3_UAT",
                riskLevel: "R3",
                approvalGranted: false,
                uatPassed: true
            }
            expect(() => {
                phaseController.transitionPhase(state, "P4_APPROVED")
            }).toThrow(/Approval required/)
        })

        it("should reject P3 → P4 when UAT not passed", () => {
            const state: PhaseState = {
                ...baseState,
                currentPhase: "P3_UAT",
                riskLevel: "R3",
                approvalGranted: true,
                uatPassed: false
            }
            expect(() => {
                phaseController.transitionPhase(state, "P4_APPROVED")
            }).toThrow(/UAT must pass/)
        })

        it("should allow P4 → P5 when approval granted and UAT passed", () => {
            const state: PhaseState = {
                ...baseState,
                currentPhase: "P4_APPROVED",
                riskLevel: "R2",
                approvalGranted: true,
                uatPassed: true
            }
            const result = phaseController.transitionPhase(state, "P5_PRODUCTION")
            expect(result.currentPhase).toBe("P5_PRODUCTION")
        })

        it("should reject P4 → P5 without approval", () => {
            const state: PhaseState = {
                ...baseState,
                currentPhase: "P4_APPROVED",
                riskLevel: "R2",
                approvalGranted: false,
                uatPassed: true
            }
            expect(() => {
                phaseController.transitionPhase(state, "P5_PRODUCTION")
            }).toThrow(/Approval must be granted/)
        })

        it("should reject P4 → P5 without UAT passing", () => {
            const state: PhaseState = {
                ...baseState,
                currentPhase: "P4_APPROVED",
                riskLevel: "R2",
                approvalGranted: true,
                uatPassed: false
            }
            expect(() => {
                phaseController.transitionPhase(state, "P5_PRODUCTION")
            }).toThrow(/UAT must pass/)
        })

        it("should allow P5 → P6", () => {
            const state: PhaseState = {
                ...baseState,
                currentPhase: "P5_PRODUCTION",
                approvalGranted: true,
                uatPassed: true
            }
            const result = phaseController.transitionPhase(state, "P6_FROZEN")
            expect(result.currentPhase).toBe("P6_FROZEN")
        })

        it("should reject R4 advancing to P4 without both approval and UAT", () => {
            const state: PhaseState = {
                ...baseState,
                currentPhase: "P3_UAT",
                riskLevel: "R4",
                approvalGranted: false,
                uatPassed: false
            }
            expect(() => {
                phaseController.transitionPhase(state, "P4_APPROVED")
            }).toThrow()
        })

        it("should reject R4 advancing to P5 without approval and UAT", () => {
            const state: PhaseState = {
                ...baseState,
                currentPhase: "P4_APPROVED",
                riskLevel: "R4",
                approvalGranted: false,
                uatPassed: false
            }
            expect(() => {
                phaseController.transitionPhase(state, "P5_PRODUCTION")
            }).toThrow()
        })

        it("should reject backward transition P1 → P0", () => {
            const state: PhaseState = { ...baseState, currentPhase: "P1_BUILD" }
            expect(() => {
                phaseController.transitionPhase(state, "P0_DESIGN")
            }).toThrow(/Illegal transition/)
        })
    })

    describe("activateFreeze()", () => {

        it("should freeze and move to P6_FROZEN", () => {
            const result = phaseController.activateFreeze(baseState)
            expect(result.freezeActive).toBe(true)
            expect(result.currentPhase).toBe("P6_FROZEN")
        })

        it("should freeze even for low-risk levels", () => {
            const lowRiskState: PhaseState = { ...baseState, riskLevel: "R1" }
            const result = phaseController.activateFreeze(lowRiskState)
            expect(result.freezeActive).toBe(true)
            expect(result.currentPhase).toBe("P6_FROZEN")
        })

        it("should freeze for R3+ risk levels", () => {
            const highRiskState: PhaseState = { ...baseState, riskLevel: "R3" }
            const result = phaseController.activateFreeze(highRiskState)
            expect(result.freezeActive).toBe(true)
            expect(result.currentPhase).toBe("P6_FROZEN")
        })
    })
})
