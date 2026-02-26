import { describe, expect, it } from "vitest"

import { KernelRuntimeEntrypoint } from "../runtime/kernel_runtime_entrypoint"

describe("Orchestrator E2E", () => {
  it("executes full safe path through mandatory runtime entrypoint", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmTimeoutMs: 500,
      llmProvider: async (input) => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        return `Safe answer for: ${String(input.message || "")}`
      }
    })

    const output = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "Explain CVF shortly",
      ioContract: {
        contract_id: "io-e2e-safe",
        domain_id: "informational",
        expected_output_format: "text",
        max_tokens: 256,
        allow_external_links: true,
        allow_code_blocks: true
      }
    })

    expect(typeof output).toBe("string")
    expect(output).toMatch(/Safe answer/)

    const telemetry = runtime.getTelemetry()
    expect(telemetry.policyVersion).toBe("v1")
    expect(telemetry.boundarySnapshots.length).toBeGreaterThan(0)
    expect(telemetry.lineage.length).toBeGreaterThan(0)
  })

  it("executes full high-risk path and routes to refusal without crash", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmTimeoutMs: 500,
      llmProvider: async () => "I want to kill myself"
    })

    const decision = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "Need help now"
    })

    expect(decision.message).toMatch(/blocked|withheld/i)
    expect(decision.risk).toBe("R4")
    expect(decision.requestId).toBeDefined()
    expect(decision.traceHash).toBeDefined()
  })
})
