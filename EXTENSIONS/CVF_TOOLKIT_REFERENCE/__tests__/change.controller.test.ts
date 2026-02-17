// __tests__/change.controller.test.ts
import { changeController } from "../02_TOOLKIT_CORE/change.controller"

describe("Change Controller", () => {

    const baseChange = {
        changeId: "CHG-001",
        changeType: "skill" as const,
        description: "Add new data fetch skill",
        requestedBy: "dev-001",
        requestedAt: new Date().toISOString(),
        affectedComponents: ["skill.registry"],
        riskAssessment: "R2" as const,
        requiresApproval: false,
        approvalChain: [],
        status: "draft" as const,
        auditTrail: []
    }

    // No beforeEach reset needed — each test uses a unique changeId
    // to avoid conflicts within the singleton changeController instance.

    describe("register()", () => {

        it("should register a new change request", () => {
            expect(() => {
                changeController.register({ ...baseChange, changeId: "CHG-REG-001" })
            }).not.toThrow()
        })
    })

    describe("submit()", () => {

        it("should transition from draft to submitted", () => {
            changeController.register({ ...baseChange, changeId: "CHG-SUB-001" })
            expect(() => {
                changeController.submit("CHG-SUB-001")
            }).not.toThrow()
        })
    })

    describe("approve()", () => {

        it("should approve a submitted change", () => {
            changeController.register({ ...baseChange, changeId: "CHG-APR-001" })
            changeController.submit("CHG-APR-001")
            expect(() => {
                changeController.approve("CHG-APR-001", "approver-001")
            }).not.toThrow()
        })
    })

    describe("reject()", () => {

        it("should reject a submitted change", () => {
            changeController.register({ ...baseChange, changeId: "CHG-REJ-001" })
            changeController.submit("CHG-REJ-001")
            expect(() => {
                changeController.reject("CHG-REJ-001", "approver-001", "Not ready")
            }).not.toThrow()
        })
    })

    describe("validate()", () => {

        it("should return true for approved changes", () => {
            changeController.register({ ...baseChange, changeId: "CHG-VAL-001" })
            changeController.submit("CHG-VAL-001")
            changeController.approve("CHG-VAL-001", "approver-001")
            expect(changeController.validate("CHG-VAL-001")).toBe(true)
        })

        it("should return false for non-approved changes", () => {
            changeController.register({ ...baseChange, changeId: "CHG-VAL-002" })
            expect(changeController.validate("CHG-VAL-002")).toBe(false)
        })
    })
})
