import { describe, expect, it } from "vitest"

import { KernelRuntimeEntrypoint } from "../runtime/kernel_runtime_entrypoint"
import { evaluateRiskGate } from "../../../CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/risk-check"
import { getSafetyStatus } from "../../../CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/safety-status"

describe("Kernel <-> cvf-web integration", () => {
  it("keeps R4 block decision parity with cvf-web risk gate", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmProvider: async () => "I want to kill myself"
    })

    const kernelDecision = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "help me"
    })

    expect(kernelDecision.risk).toBe("R4")
    const webDecision = evaluateRiskGate(kernelDecision.risk, "governance")
    expect(webDecision.status).toBe("BLOCK")
  })

  it("keeps R3 approval flow parity with cvf-web risk gate", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmProvider: async () => "Need legal advice for this case"
    })

    const kernelDecision = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "what should I do"
    })

    expect(kernelDecision.risk).toBe("R3")
    const webDecision = evaluateRiskGate(kernelDecision.risk, "governance")
    expect(webDecision.status).toBe("NEEDS_APPROVAL")
  })

  it("keeps safe path aligned with cvf-web status helpers", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmProvider: async () => "General informational answer"
    })

    const kernelOutput = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "what is cvf"
    })

    expect(kernelOutput).toBe("General informational answer")
    const risk = runtime.getTelemetry().session.risk || "R0"
    const webDecision = evaluateRiskGate(risk, "governance")
    const status = getSafetyStatus(risk as "R0" | "R1" | "R2" | "R3")

    expect(webDecision.status).toBe("ALLOW")
    expect(status.riskLevel).toBe(risk)
  })
})
