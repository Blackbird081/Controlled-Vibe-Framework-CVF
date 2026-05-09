import { describe, it, expect } from "vitest"
import { ContractRuntimeEngine } from "../kernel/02_contract_runtime/contract_runtime_engine"

describe("ContractRuntimeEngine", () => {
  it("blocks unauthorized consumer", () => {
    const engine = new ContractRuntimeEngine()

    expect(() =>
      engine.execute("ok", {
        ioContract: {
          contract_id: "io-allow-assistant",
          domain_id: "informational",
          expected_output_format: "text",
          max_tokens: 128,
          allow_external_links: true,
          allow_code_blocks: true,
          allowed_consumers: ["assistant"],
        },
        consumerRole: "user",
        declaredDomain: "informational",
      })
    ).toThrow("consumer 'user' not allowed")
  })

  it("blocks forbidden transformation", () => {
    const engine = new ContractRuntimeEngine()

    expect(() =>
      engine.execute("ok", {
        ioContract: {
          contract_id: "io-no-transform",
          domain_id: "informational",
          expected_output_format: "text",
          max_tokens: 128,
          allow_external_links: true,
          allow_code_blocks: true,
          allow_transform: false,
        },
        transformRequested: true,
        declaredDomain: "informational",
      })
    ).toThrow("transformation is disabled")
  })

  it("allows valid contract runtime path", () => {
    const engine = new ContractRuntimeEngine()

    const output = engine.execute("safe output", {
      ioContract: {
        contract_id: "io-ok",
        domain_id: "informational",
        expected_output_format: "text",
        max_tokens: 128,
        allow_external_links: true,
        allow_code_blocks: true,
      },
      consumerRole: "assistant",
      declaredDomain: "informational",
    })

    expect(output).toBe("safe output")
  })
})
