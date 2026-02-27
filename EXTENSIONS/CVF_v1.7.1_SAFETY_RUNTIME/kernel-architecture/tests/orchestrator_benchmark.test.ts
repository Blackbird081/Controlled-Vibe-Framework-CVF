import { describe, expect, it } from "vitest"

import { KernelRuntimeEntrypoint } from "../runtime/kernel_runtime_entrypoint"

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

describe("Orchestrator benchmark", () => {
  it("records average and p95 latency for full pipeline", async () => {
    const runtime = new KernelRuntimeEntrypoint({
      llmTimeoutMs: 500,
      llmProvider: async () => "General informational answer",
    })

    const runs = 40
    const timings: number[] = []

    for (let i = 0; i < runs; i++) {
      const start = Date.now()
      await runtime.execute({
        domain: "informational",
        type: "question",
        message: `Benchmark request ${i + 1}`,
      })
      timings.push(Date.now() - start)
    }

    const avg = timings.reduce((sum, v) => sum + v, 0) / timings.length
    const p95 = percentile(timings, 95)

    console.log(
      `[benchmark] runs=${runs} avg_ms=${avg.toFixed(2)} p95_ms=${p95.toFixed(2)}`
    )

    // Stability threshold for local CI/sandbox runs.
    expect(avg).toBeLessThan(200)
    expect(p95).toBeLessThan(300)
  })
})
