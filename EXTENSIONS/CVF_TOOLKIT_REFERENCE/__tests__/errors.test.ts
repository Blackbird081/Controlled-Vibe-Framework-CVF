// __tests__/errors.test.ts
import {
    BaseGovernanceError,
    GovernanceViolationError,
    PhaseViolationError,
    RiskViolationError,
    OperatorViolationError,
    ChangeViolationError,
    FreezeViolationError,
    EnvironmentViolationError,
    SkillViolationError,
    SecurityException,
    ValidationError,
    ProviderError,
    CertificationError
} from "../02_TOOLKIT_CORE/errors"

describe("CVF Error Classes", () => {

    describe("BaseGovernanceError", () => {

        it("should set code, message, name, and timestamp", () => {
            const err = new BaseGovernanceError("TEST_001", "Test error")
            expect(err.code).toBe("TEST_001")
            expect(err.message).toBe("Test error")
            expect(err.name).toBe("BaseGovernanceError")
            expect(err.timestamp).toBeDefined()
            expect(typeof err.timestamp).toBe("string")
        })

        it("should be an instance of Error", () => {
            const err = new BaseGovernanceError("TEST_002", "Base check")
            expect(err).toBeInstanceOf(Error)
        })
    })

    describe("GovernanceViolationError", () => {

        it("should have code CVF_ERR_001 and join reasons", () => {
            const err = new GovernanceViolationError(["reason A", "reason B"])
            expect(err.code).toBe("CVF_ERR_001")
            expect(err.name).toBe("GovernanceViolationError")
            expect(err.message).toContain("reason A")
            expect(err.message).toContain("reason B")
            expect(err.reasons).toEqual(["reason A", "reason B"])
        })
    })

    describe("PhaseViolationError", () => {

        it("should have code CVF_ERR_002", () => {
            const err = new PhaseViolationError("Phase blocked")
            expect(err.code).toBe("CVF_ERR_002")
            expect(err.name).toBe("PhaseViolationError")
            expect(err.message).toBe("Phase blocked")
        })
    })

    describe("RiskViolationError", () => {

        it("should have code CVF_ERR_003", () => {
            const err = new RiskViolationError("Risk too high")
            expect(err.code).toBe("CVF_ERR_003")
            expect(err.name).toBe("RiskViolationError")
            expect(err.message).toBe("Risk too high")
        })
    })

    describe("OperatorViolationError", () => {

        it("should have code CVF_ERR_004", () => {
            const err = new OperatorViolationError("Unauthorized operator")
            expect(err.code).toBe("CVF_ERR_004")
            expect(err.name).toBe("OperatorViolationError")
        })
    })

    describe("ChangeViolationError", () => {

        it("should have code CVF_ERR_005", () => {
            const err = new ChangeViolationError("Change denied")
            expect(err.code).toBe("CVF_ERR_005")
            expect(err.name).toBe("ChangeViolationError")
        })
    })

    describe("FreezeViolationError", () => {

        it("should have code CVF_ERR_006", () => {
            const err = new FreezeViolationError("Frozen")
            expect(err.code).toBe("CVF_ERR_006")
            expect(err.name).toBe("FreezeViolationError")
        })
    })

    describe("EnvironmentViolationError", () => {

        it("should have code CVF_ERR_007", () => {
            const err = new EnvironmentViolationError("Env restricted")
            expect(err.code).toBe("CVF_ERR_007")
            expect(err.name).toBe("EnvironmentViolationError")
        })
    })

    describe("SkillViolationError", () => {

        it("should have code CVF_ERR_008", () => {
            const err = new SkillViolationError("Skill invalid")
            expect(err.code).toBe("CVF_ERR_008")
            expect(err.name).toBe("SkillViolationError")
        })
    })

    describe("SecurityException", () => {

        it("should have code CVF_ERR_009", () => {
            const err = new SecurityException("Bypass attempt")
            expect(err.code).toBe("CVF_ERR_009")
            expect(err.name).toBe("SecurityException")
        })
    })

    describe("ValidationError", () => {

        it("should have code CVF_ERR_010", () => {
            const err = new ValidationError("Invalid input")
            expect(err.code).toBe("CVF_ERR_010")
            expect(err.name).toBe("ValidationError")
        })
    })

    describe("ProviderError", () => {

        it("should have code CVF_ERR_011", () => {
            const err = new ProviderError("Provider failed")
            expect(err.code).toBe("CVF_ERR_011")
            expect(err.name).toBe("ProviderError")
        })
    })

    describe("CertificationError", () => {

        it("should have code CVF_ERR_012", () => {
            const err = new CertificationError("Cert missing")
            expect(err.code).toBe("CVF_ERR_012")
            expect(err.name).toBe("CertificationError")
        })
    })

    describe("Error inheritance", () => {

        it("all errors should be instances of BaseGovernanceError", () => {
            expect(new GovernanceViolationError(["x"])).toBeInstanceOf(BaseGovernanceError)
            expect(new PhaseViolationError("x")).toBeInstanceOf(BaseGovernanceError)
            expect(new RiskViolationError("x")).toBeInstanceOf(BaseGovernanceError)
            expect(new OperatorViolationError("x")).toBeInstanceOf(BaseGovernanceError)
            expect(new ChangeViolationError("x")).toBeInstanceOf(BaseGovernanceError)
            expect(new FreezeViolationError("x")).toBeInstanceOf(BaseGovernanceError)
            expect(new EnvironmentViolationError("x")).toBeInstanceOf(BaseGovernanceError)
            expect(new SkillViolationError("x")).toBeInstanceOf(BaseGovernanceError)
            expect(new SecurityException("x")).toBeInstanceOf(BaseGovernanceError)
            expect(new ValidationError("x")).toBeInstanceOf(BaseGovernanceError)
            expect(new ProviderError("x")).toBeInstanceOf(BaseGovernanceError)
            expect(new CertificationError("x")).toBeInstanceOf(BaseGovernanceError)
        })

        it("all errors should have a timestamp", () => {
            const errors = [
                new GovernanceViolationError(["x"]),
                new PhaseViolationError("x"),
                new RiskViolationError("x"),
                new OperatorViolationError("x"),
                new ChangeViolationError("x"),
                new FreezeViolationError("x"),
                new EnvironmentViolationError("x"),
                new SkillViolationError("x"),
                new SecurityException("x"),
                new ValidationError("x"),
                new ProviderError("x"),
                new CertificationError("x")
            ]
            errors.forEach(err => {
                expect(err.timestamp).toBeDefined()
                expect(typeof err.timestamp).toBe("string")
            })
        })
    })
})
