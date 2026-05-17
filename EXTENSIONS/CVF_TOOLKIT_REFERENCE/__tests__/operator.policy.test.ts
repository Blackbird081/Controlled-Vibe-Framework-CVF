// __tests__/operator.policy.test.ts
import { operatorPolicy } from "../02_TOOLKIT_CORE/operator.policy"
import { OperatorContext } from "../02_TOOLKIT_CORE/interfaces"

describe("Operator Policy", () => {

    const makeOperator = (role: string, permissions?: string[]): OperatorContext => ({
        id: "test-op-001",
        name: "Test Operator",
        role: role as any,
        permissions
    })

    describe("isAuthorizedForSkill()", () => {

        it("should return true when operator role is in allowedRoles", () => {
            const op = makeOperator("ANALYST")
            expect(operatorPolicy.isAuthorizedForSkill(op, ["ANALYST", "ADMIN"])).toBe(true)
        })

        it("should return false when operator role is not in allowedRoles", () => {
            const op = makeOperator("VIEWER")
            expect(operatorPolicy.isAuthorizedForSkill(op, ["ANALYST", "ADMIN"])).toBe(false)
        })
    })

    describe("requireMinimumRole()", () => {

        it("should not throw when operator meets minimum role", () => {
            const op = makeOperator("ADMIN")
            expect(() => {
                operatorPolicy.requireMinimumRole(op, "REVIEWER")
            }).not.toThrow()
        })

        it("should not throw when operator exactly matches minimum role", () => {
            const op = makeOperator("REVIEWER")
            expect(() => {
                operatorPolicy.requireMinimumRole(op, "REVIEWER")
            }).not.toThrow()
        })

        it("should throw when operator role is below minimum", () => {
            const op = makeOperator("VIEWER")
            expect(() => {
                operatorPolicy.requireMinimumRole(op, "APPROVER")
            }).toThrow("Insufficient role")
        })

        it("should throw with correct message including roles", () => {
            const op = makeOperator("ANALYST")
            expect(() => {
                operatorPolicy.requireMinimumRole(op, "ADMIN")
            }).toThrow(/Required: ADMIN, actual: ANALYST/)
        })

        it("should allow APPROVER for minimum ANALYST", () => {
            const op = makeOperator("APPROVER")
            expect(() => {
                operatorPolicy.requireMinimumRole(op, "ANALYST")
            }).not.toThrow()
        })
    })

    describe("validateCustomPermission()", () => {

        it("should not throw when operator has the required permission", () => {
            const op = makeOperator("ADMIN", ["write", "read", "deploy"])
            expect(() => {
                operatorPolicy.validateCustomPermission(op, "deploy")
            }).not.toThrow()
        })

        it("should throw when operator lacks the required permission", () => {
            const op = makeOperator("ADMIN", ["read"])
            expect(() => {
                operatorPolicy.validateCustomPermission(op, "deploy")
            }).toThrow("Missing required permission: deploy")
        })

        it("should throw when operator has no permissions array", () => {
            const op = makeOperator("ADMIN")
            expect(() => {
                operatorPolicy.validateCustomPermission(op, "deploy")
            }).toThrow("Missing required permission: deploy")
        })

        it("should throw when operator has empty permissions array", () => {
            const op = makeOperator("ADMIN", [])
            expect(() => {
                operatorPolicy.validateCustomPermission(op, "write")
            }).toThrow("Missing required permission: write")
        })
    })
})
