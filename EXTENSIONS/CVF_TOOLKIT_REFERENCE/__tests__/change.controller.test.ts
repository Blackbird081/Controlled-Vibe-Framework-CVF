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

        it("should return false for non-existent changes", () => {
            expect(changeController.validate("CHG-NONEXISTENT-999")).toBe(false)
        })

        it("should return true for implemented changes", () => {
            changeController.register({ ...baseChange, changeId: "CHG-VAL-003" })
            changeController.submit("CHG-VAL-003")
            changeController.approve("CHG-VAL-003", "approver-001")
            changeController.markImplemented("CHG-VAL-003", "REF-001")
            expect(changeController.validate("CHG-VAL-003")).toBe(true)
        })
    })

    describe("get()", () => {

        it("should return a registered change", () => {
            changeController.register({ ...baseChange, changeId: "CHG-GET-001" })
            const change = changeController.get("CHG-GET-001")
            expect(change.changeId).toBe("CHG-GET-001")
        })

        it("should throw for non-existent change", () => {
            expect(() => {
                changeController.get("CHG-NONEXISTENT-XYZ")
            }).toThrow(/Change not found/)
        })
    })

    describe("duplicate registration", () => {

        it("should throw when registering duplicate changeId", () => {
            changeController.register({ ...baseChange, changeId: "CHG-DUP-001" })
            expect(() => {
                changeController.register({ ...baseChange, changeId: "CHG-DUP-001" })
            }).toThrow(/Change already registered/)
        })
    })

    describe("markImplemented()", () => {

        it("should transition approved change to implemented", () => {
            changeController.register({ ...baseChange, changeId: "CHG-IMP-001" })
            changeController.submit("CHG-IMP-001")
            changeController.approve("CHG-IMP-001", "approver-001")
            expect(() => {
                changeController.markImplemented("CHG-IMP-001", "commit-abc123")
            }).not.toThrow()
        })

        it("should reject implementation of non-approved change", () => {
            changeController.register({ ...baseChange, changeId: "CHG-IMP-002" })
            changeController.submit("CHG-IMP-002")
            expect(() => {
                changeController.markImplemented("CHG-IMP-002", "commit-xyz")
            }).toThrow(/Illegal change transition/)
        })
    })

    describe("freeze()", () => {

        it("should freeze an implemented change", () => {
            changeController.register({ ...baseChange, changeId: "CHG-FRZ-001" })
            changeController.submit("CHG-FRZ-001")
            changeController.approve("CHG-FRZ-001", "approver-001")
            changeController.markImplemented("CHG-FRZ-001", "ref-001")
            expect(() => {
                changeController.freeze("CHG-FRZ-001")
            }).not.toThrow()
        })

        it("should reject freezing a non-implemented change", () => {
            changeController.register({ ...baseChange, changeId: "CHG-FRZ-002" })
            changeController.submit("CHG-FRZ-002")
            changeController.approve("CHG-FRZ-002", "approver-001")
            expect(() => {
                changeController.freeze("CHG-FRZ-002")
            }).toThrow(/Illegal change transition/)
        })
    })

    describe("R4 multi-approval", () => {

        it("should not approve R4 change with only one approval", () => {
            changeController.register({
                ...baseChange,
                changeId: "CHG-R4-001",
                riskAssessment: "R4" as const,
                approvalChain: []
            })
            changeController.submit("CHG-R4-001")
            changeController.approve("CHG-R4-001", "approver-A")
            // After first approval, R4 should still not be "approved"
            const change = changeController.get("CHG-R4-001")
            expect(change.status).toBe("submitted")
        })

        it("should approve R4 change with two approvals", () => {
            changeController.register({
                ...baseChange,
                changeId: "CHG-R4-002",
                riskAssessment: "R4" as const,
                approvalChain: []
            })
            changeController.submit("CHG-R4-002")
            changeController.approve("CHG-R4-002", "approver-A")
            changeController.approve("CHG-R4-002", "approver-B")
            const change = changeController.get("CHG-R4-002")
            expect(change.status).toBe("approved")
        })
    })

    describe("illegal transitions", () => {

        it("should reject transition from rejected state", () => {
            changeController.register({ ...baseChange, changeId: "CHG-ILL-001" })
            changeController.submit("CHG-ILL-001")
            changeController.reject("CHG-ILL-001", "approver-001", "No good")
            expect(() => {
                changeController.approve("CHG-ILL-001", "approver-002")
            }).toThrow(/Illegal change transition/)
        })

        it("should reject transition from frozen state", () => {
            changeController.register({ ...baseChange, changeId: "CHG-ILL-002" })
            changeController.submit("CHG-ILL-002")
            changeController.approve("CHG-ILL-002", "approver-001")
            changeController.markImplemented("CHG-ILL-002", "ref-002")
            changeController.freeze("CHG-ILL-002")
            expect(() => {
                changeController.submit("CHG-ILL-002")
            }).toThrow(/Illegal change transition/)
        })

        it("should reject submitting a non-draft change", () => {
            changeController.register({ ...baseChange, changeId: "CHG-ILL-003" })
            changeController.submit("CHG-ILL-003")
            expect(() => {
                changeController.submit("CHG-ILL-003")
            }).toThrow(/Illegal change transition/)
        })
    })

    describe("risk-based approval flag", () => {

        it("should set requiresApproval for R2+ changes on registration", () => {
            changeController.register({
                ...baseChange,
                changeId: "CHG-RISK-001",
                riskAssessment: "R3" as const,
                requiresApproval: false
            })
            const change = changeController.get("CHG-RISK-001")
            expect(change.requiresApproval).toBe(true)
        })
    })
})
