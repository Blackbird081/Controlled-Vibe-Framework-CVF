import { describe, it, expect } from "vitest"
import { executePolicy } from "../policy/policy.executor"
import { registerPolicy, getPolicy } from "../policy/policy.registry"
import type { PolicyRule, ProposalPayload } from "../types/index"

describe("executePolicy", () => {
  const version = `test-${Date.now()}`

  const rules: PolicyRule[] = [
    {
      id: "block-high-cost",
      description: "Block proposals with cost > 1000",
      evaluate: (proposal: ProposalPayload) => {
        const cost = proposal["estimatedCost"]
        return typeof cost === "number" && cost > 1000 ? "rejected" : null
      },
    },
    {
      id: "require-review-medium",
      description: "Require review for medium risk",
      evaluate: (proposal: ProposalPayload) => {
        return proposal["riskLevel"] === "medium" ? "pending" : null
      },
    },
  ]

  // Register the policy before tests
  registerPolicy(version, rules)

  it("should return pending for proposals matching no rules (safe default)", () => {
    const result = executePolicy({ estimatedCost: 100, riskLevel: "low" }, version)
    expect(result).toBe("pending")
  })

  it("should reject proposals matching reject rule", () => {
    const result = executePolicy({ estimatedCost: 2000, riskLevel: "low" }, version)
    expect(result).toBe("rejected")
  })

  it("should return pending for medium risk proposals", () => {
    const result = executePolicy({ estimatedCost: 100, riskLevel: "medium" }, version)
    expect(result).toBe("pending")
  })

  it("should apply first matching rule (reject before pending)", () => {
    const result = executePolicy({ estimatedCost: 2000, riskLevel: "medium" }, version)
    expect(result).toBe("rejected")
  })
})

describe("policy registry", () => {
  it("should throw when registering duplicate version", () => {
    const v = `dup-${Date.now()}`
    registerPolicy(v, [])
    expect(() => registerPolicy(v, [])).toThrow("already exists")
  })

  it("should throw when getting non-existent version", () => {
    expect(() => getPolicy("non-existent")).toThrow("not found")
  })

  it("should return correct policy", () => {
    const v = `get-${Date.now()}`
    registerPolicy(v, [{ id: "r1", description: "test", evaluate: () => null }])
    const policy = getPolicy(v)
    expect(policy.version).toBe(v)
    expect(policy.rules).toHaveLength(1)
    expect(policy.hash).toMatch(/^[a-f0-9]{64}$/)
  })
})
