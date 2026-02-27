import { describe, it, expect } from "vitest"
import { LLMAdapter } from "../runtime/llm_adapter"
import { KernelRuntimeEntrypoint } from "../runtime/kernel_runtime_entrypoint"

describe("Kernel runtime entrypoint enforcement", () => {
  it("blocks direct LLM adapter calls without kernel token", async () => {
    const adapter = new LLMAdapter()

    await expect(adapter.generate({ message: "test" })).rejects.toThrow(
      "Direct LLM access blocked"
    )
  })

  it("executes through mandatory entrypoint with selected policy version", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      policyVersion: "v1",
      llmProvider: async () => "Safe informational response",
    })

    const output = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "Need summary",
    })

    expect(output).toBe("Safe informational response")
    expect(runtime.getPolicyVersion()).toBe("v1")
  })

  it("returns default fallback response when adapter gets empty message with valid token", async () => {
    const token = Symbol("test-token")
    const adapter = new LLMAdapter(undefined, token)

    const output = await adapter.generate({}, token)
    expect(output).toBe("CVF response generated.")
  })
})
