import { describe, it, expect } from "vitest"
import { signToken, verifyToken, hashPassword, comparePassword, hasPermission, requirePermission } from "../security/auth"

describe("JWT signing & verification", () => {
    const payload = { userId: "u1", role: "admin" as const }

    it("should sign and verify a token", () => {
        const { token } = signToken(payload)
        const decoded = verifyToken(token)
        expect(decoded.userId).toBe("u1")
        expect(decoded.role).toBe("admin")
    })

    it("should reject tampered tokens", () => {
        const { token } = signToken(payload)
        const tampered = token.slice(0, -5) + "XXXXX"
        expect(() => verifyToken(tampered)).toThrow("Invalid token signature")
    })

    it("should reject malformed tokens", () => {
        expect(() => verifyToken("not.a.valid.token")).toThrow()
    })

    it("should reject expired tokens", () => {
        const { token } = signToken(payload, -1) // already expired
        expect(() => verifyToken(token)).toThrow("Token expired")
    })
})

describe("Password hashing", () => {
    it("should hash and compare correctly", async () => {
        const hash = await hashPassword("mypassword")
        const match = await comparePassword("mypassword", hash)
        expect(match).toBe(true)
    })

    it("should reject wrong password", async () => {
        const hash = await hashPassword("correct")
        const match = await comparePassword("wrong", hash)
        expect(match).toBe(false)
    })

    it("should produce different hashes for same password", async () => {
        const hash1 = await hashPassword("same")
        const hash2 = await hashPassword("same")
        expect(hash1).not.toBe(hash2) // different salts
    })
})

describe("RBAC", () => {
    it("admin should have all permissions", () => {
        expect(hasPermission("admin", "proposal:create")).toBe(true)
        expect(hasPermission("admin", "policy:update")).toBe(true)
        expect(hasPermission("admin", "user:manage")).toBe(true)
    })

    it("viewer should only have read permissions", () => {
        expect(hasPermission("viewer", "proposal:read")).toBe(true)
        expect(hasPermission("viewer", "proposal:create")).toBe(false)
        expect(hasPermission("viewer", "settings:update")).toBe(false)
    })

    it("requirePermission should throw for unauthorized role", () => {
        expect(() => requirePermission("viewer", "proposal:create")).toThrow("Forbidden")
    })

    it("requirePermission should not throw for authorized role", () => {
        expect(() => requirePermission("admin", "proposal:create")).not.toThrow()
    })
})
