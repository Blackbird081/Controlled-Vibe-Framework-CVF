import { describe, it, expect } from "vitest"
import {
  validate,
  ProposalEnvelopeSchema,
  LoginRequestSchema,
  AISettingsSchema,
  OpenClawMessageSchema,
  LifecycleInputSchema,
} from "../validation/schemas"

describe("ProposalEnvelopeSchema", () => {
  const validProposal = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    source: "openclaw",
    action: "deploy",
    payload: { target: "staging" },
    createdAt: Date.now(),
    confidence: 0.9,
    riskLevel: "low",
  }

  it("should accept valid proposals", () => {
    const result = validate(ProposalEnvelopeSchema, validProposal)
    expect(result.success).toBe(true)
  })

  it("should reject invalid UUID", () => {
    const result = validate(ProposalEnvelopeSchema, {
      ...validProposal,
      id: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })

  it("should reject invalid source", () => {
    const result = validate(ProposalEnvelopeSchema, {
      ...validProposal,
      source: "unknown",
    })
    expect(result.success).toBe(false)
  })

  it("should reject confidence > 1", () => {
    const result = validate(ProposalEnvelopeSchema, { ...validProposal, confidence: 1.5 })
    expect(result.success).toBe(false)
  })

  it("should reject empty action", () => {
    const result = validate(ProposalEnvelopeSchema, { ...validProposal, action: "" })
    expect(result.success).toBe(false)
  })
})

describe("LoginRequestSchema", () => {
  it("should accept valid login", () => {
    const result = validate(LoginRequestSchema, {
      username: "admin",
      password: "secureP@ss1",
    })
    expect(result.success).toBe(true)
  })

  it("should reject short password", () => {
    const result = validate(LoginRequestSchema, { username: "admin", password: "short" })
    expect(result.success).toBe(false)
  })

  it("should reject short username", () => {
    const result = validate(LoginRequestSchema, {
      username: "ab",
      password: "secureP@ss1",
    })
    expect(result.success).toBe(false)
  })
})

describe("AISettingsSchema", () => {
  it("should accept valid settings", () => {
    const result = validate(AISettingsSchema, { provider: "openai", maxTokens: 4000 })
    expect(result.success).toBe(true)
  })

  it("should reject temperature > 2", () => {
    const result = validate(AISettingsSchema, { provider: "openai", temperature: 3 })
    expect(result.success).toBe(false)
  })
})

describe("OpenClawMessageSchema", () => {
  it("should accept valid message", () => {
    const result = validate(OpenClawMessageSchema, { userId: "u1", message: "Hello" })
    expect(result.success).toBe(true)
  })

  it("should reject empty message", () => {
    const result = validate(OpenClawMessageSchema, { userId: "u1", message: "" })
    expect(result.success).toBe(false)
  })
})

describe("LifecycleInputSchema", () => {
  it("should accept valid input with defaults", () => {
    const result = validate(LifecycleInputSchema, {
      id: "550e8400-e29b-41d4-a716-446655440000",
      payload: {},
      policyVersion: "v1",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.simulateOnly).toBe(false)
    }
  })
})
