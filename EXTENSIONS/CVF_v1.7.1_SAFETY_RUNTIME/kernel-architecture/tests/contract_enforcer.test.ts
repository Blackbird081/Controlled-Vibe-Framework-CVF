import { describe, it, expect } from "vitest"
import { ContractEnforcer } from "../kernel/02_contract_runtime/contract_enforcer"

describe("ContractEnforcer", () => {
  it("blocks missing required fields in input", () => {
    const enforcer = new ContractEnforcer()

    expect(() =>
      enforcer.validateInput(
        { domain: "informational", type: "question" },
        { requiredFields: ["message"], allowedTypes: ["question"] }
      )
    ).toThrow("missing field 'message'")
  })

  it("blocks output with external links when contract disallows links", () => {
    const enforcer = new ContractEnforcer()

    expect(() =>
      enforcer.enforce("Visit http://example.com", {
        contract_id: "io-1",
        domain_id: "informational",
        expected_output_format: "text",
        max_tokens: 256,
        allow_external_links: false,
        allow_code_blocks: true,
      })
    ).toThrow("output failed IO contract")
  })
})
