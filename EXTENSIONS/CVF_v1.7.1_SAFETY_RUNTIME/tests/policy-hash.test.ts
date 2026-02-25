import { describe, it, expect } from "vitest"
import { generatePolicyHash } from "../policy/policy.hash"
import type { PolicyRule } from "../types/index"

function makeRule(id: string, description: string): PolicyRule {
    return {
        id,
        description,
        evaluate: () => null,
    }
}

describe("generatePolicyHash", () => {

    it("should produce a 64-char hex SHA-256 hash", () => {
        const hash = generatePolicyHash("v1", [makeRule("r1", "test")])
        expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it("should produce same hash for same rules", () => {
        const rules = [makeRule("r1", "desc1"), makeRule("r2", "desc2")]
        const hash1 = generatePolicyHash("v1", rules)
        const hash2 = generatePolicyHash("v1", rules)
        expect(hash1).toBe(hash2)
    })

    it("should produce different hash for different versions", () => {
        const rules = [makeRule("r1", "test")]
        const hash1 = generatePolicyHash("v1", rules)
        const hash2 = generatePolicyHash("v2", rules)
        expect(hash1).not.toBe(hash2)
    })

    it("should produce different hash when rule description changes", () => {
        const rules1 = [makeRule("r1", "original")]
        const rules2 = [makeRule("r1", "modified")]
        const hash1 = generatePolicyHash("v1", rules1)
        const hash2 = generatePolicyHash("v1", rules2)
        expect(hash1).not.toBe(hash2)
    })

    it("should produce different hash when evaluate logic changes", () => {
        const rule1: PolicyRule = {
            id: "r1",
            description: "test",
            evaluate: () => "approved",
        }
        const rule2: PolicyRule = {
            id: "r1",
            description: "test",
            evaluate: () => "rejected",
        }
        const hash1 = generatePolicyHash("v1", [rule1])
        const hash2 = generatePolicyHash("v1", [rule2])
        expect(hash1).not.toBe(hash2)
    })

    it("should produce different hash when rule order changes", () => {
        const r1 = makeRule("r1", "first")
        const r2 = makeRule("r2", "second")
        const hash1 = generatePolicyHash("v1", [r1, r2])
        const hash2 = generatePolicyHash("v1", [r2, r1])
        expect(hash1).not.toBe(hash2)
    })
})
