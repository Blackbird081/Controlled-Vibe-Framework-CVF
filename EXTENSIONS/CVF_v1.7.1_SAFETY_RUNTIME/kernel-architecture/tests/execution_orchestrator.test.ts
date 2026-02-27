import { describe, it, expect } from "vitest"
import { KernelRuntimeEntrypoint } from "../runtime/kernel_runtime_entrypoint"
import { ExecutionOrchestrator } from "../runtime/execution_orchestrator"

describe("ExecutionOrchestrator", () => {
  it("blocks request when domain declaration is missing", async () => {
    const runtime = new KernelRuntimeEntrypoint()

    await expect(
      runtime.execute({
        type: "question",
        message: "What is CVF?",
      } as any)
    ).rejects.toThrow("Domain violation")
  })

  it("blocks unauthorized execution capability request", async () => {
    const runtime = new KernelRuntimeEntrypoint()

    await expect(
      runtime.execute({
        domain: "informational",
        type: "question",
        message: "What is CVF?",
        capabilityRequest: {
          capability: "execute",
          source: "user",
        },
      })
    ).rejects.toThrow("Capability denied")
  })

  it("routes to refusal on critical risk output", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmProvider: async () => "I want to kill myself",
    })

    const result = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "What should I do?",
    })

    expect(result.message).toMatch(/blocked|withheld/i)
    expect(result.risk).toBe("R4")
  })

  it("allows medium risk output in governance-compatible path", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmProvider: async () => "Provide investment planning overview",
    })

    const result = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "Need help",
    })

    expect(result).toBe("Provide investment planning overview")
    const telemetry = runtime.getTelemetry()
    expect(telemetry.session.risk).toBe("R2")
  })

  it("enforces output IO contract", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmProvider: async () => "See http://example.com",
    })

    const result = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "Tell me more",
      ioContract: {
        contract_id: "io-output",
        domain_id: "informational",
        expected_output_format: "text",
        max_tokens: 256,
        allow_external_links: false,
        allow_code_blocks: false,
      },
    })

    expect(result.errorCode).toBe("PIPELINE_ERROR")
    expect(result.message).toMatch(/withheld/i)
    expect(result.risk).toBe("R4")
  })

  it("records telemetry for successful request", async () => {
    const runtime = new KernelRuntimeEntrypoint()
    const output = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "CVF là gì?",
    })

    expect(output).toBe("CVF response: CVF là gì?")
    const telemetry = runtime.getTelemetry()
    expect(telemetry.session.domain).toBe("informational")
    expect(telemetry.lineage.length).toBeGreaterThanOrEqual(2)
    expect(telemetry.boundarySnapshots.length).toBeGreaterThan(0)
    expect(telemetry.trace.events.length).toBeGreaterThan(0)
    expect(telemetry.policyVersion).toBe("v1")
    expect(telemetry.lineage[0].requestId).toBeDefined()
    expect(telemetry.lineage[0].traceHash).toBeDefined()
  })

  it("blocks domain mismatch in preflight lock", async () => {
    const runtime = new KernelRuntimeEntrypoint()

    await expect(
      runtime.execute({
        domain: "informational",
        type: "question",
        message: "viết truyện ngắn cho tôi",
      })
    ).rejects.toThrow("Domain Lock: Declared domain")
  })

  it("blocks direct orchestrator construction", () => {
    expect(() => new (ExecutionOrchestrator as any)()).toThrow(
      "Direct orchestrator construction blocked"
    )
  })

  it("blocks empty message at runtime invariant gate", async () => {
    const runtime = new KernelRuntimeEntrypoint()
    await expect(
      runtime.execute({
        domain: "informational",
        type: "question",
        message: "   ",
      })
    ).rejects.toThrow("message is required")
  })

  it("returns approval-required refusal for R3 output", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmProvider: async () => "This request needs legal advice guidance",
    })

    const result = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "Can you help?",
    })

    expect(result.message).toMatch(/requires human approval/i)
    expect(result.policyVersion).toBe("v1")
  })

  it("returns clarification refusal when policy receives R2 with clarification signals", async () => {
    const orchestrator = ExecutionOrchestrator.create({
      llmProvider: async () => "Safe informational response",
    })

    ;(orchestrator as any).risk = {
      score: () => ({
        level: "medium",
        cvfRiskLevel: "R2",
        score: 55,
        reasons: ["mock_r2"],
      }),
    }
    ;(orchestrator as any).assumptionTracker = {
      track: () => ["implicit_assumption"],
    }
    ;(orchestrator as any).driftDetector = {
      detect: () => ({ detected: false, reasons: [] }),
    }
    ;(orchestrator as any).riskPropagation = {
      propagate: () => ({
        level: "medium",
        cvfRiskLevel: "R2",
        score: 60,
        reasons: ["mock_r2", "implicit_assumption"],
        assumptions: ["implicit_assumption"],
        driftDetected: false,
      }),
    }

    const result = await orchestrator.execute({
      domain: "informational",
      type: "question",
      message: "Need a plan",
    })

    expect(result.message).toMatch(/clarify/i)
    expect(result.risk).toBe("R2")
  })

  it("enables creative expansion when domain and risk allow", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmProvider: async () => "viết truyện ngắn an toàn",
    })

    const result = await runtime.execute({
      domain: "creative",
      type: "prompt",
      message: "viết truyện ngắn giúp tôi",
      creativeMode: true,
    })

    expect(result).toContain("[creative:controlled]")
    expect(result).toContain("(creative variation enabled)")
  })

  it("degrades safely when llm call exceeds timeout", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmTimeoutMs: 20,
      llmProvider: async () => {
        await new Promise((resolve) => setTimeout(resolve, 80))
        return "late response"
      },
    })

    const result = await runtime.execute({
      domain: "informational",
      type: "question",
      message: "Need safe answer",
    })

    expect(result.message).toMatch(/withheld/i)
    expect(result.errorCode).toBe("LLM_TIMEOUT")
    expect(result.risk).toBe("R3")
  })

  it("degrades safely when a pipeline component throws unexpectedly", async () => {
    const orchestrator = ExecutionOrchestrator.create({
      llmProvider: async () => "Safe informational response",
    })

    ;(orchestrator as any).risk = {
      score: () => {
        throw new Error("Injected scorer failure")
      },
    }

    const result = await orchestrator.execute({
      domain: "informational",
      type: "question",
      message: "Need a plan",
    })

    expect(result.message).toMatch(/runtime safety failure/i)
    expect(result.errorCode).toBe("PIPELINE_ERROR")
    expect(result.risk).toBe("R4")
  })
})
