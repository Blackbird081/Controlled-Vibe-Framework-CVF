import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { describe, it, expect } from "vitest"
import {
  RefusalPolicy,
  RefusalPolicyContext,
} from "../kernel/04_refusal_router/refusal_policy"
import { CVFRiskLevel } from "../kernel/03_contamination_guard/risk.types"

interface GoldenCase {
  id: string
  policyVersion: string
  riskLevel: CVFRiskLevel
  context?: RefusalPolicyContext
  expectedAction: "allow" | "clarify" | "needs_approval" | "block"
}

function loadGoldenCases(): GoldenCase[] {
  const fileUrl = new URL("./golden/refusal-policy.v1.json", import.meta.url)
  const content = readFileSync(fileURLToPath(fileUrl), "utf8")
  return JSON.parse(content) as GoldenCase[]
}

describe("Refusal policy golden dataset", () => {
  it("matches all expected decisions in golden cases", () => {
    const cases = loadGoldenCases()

    for (const c of cases) {
      const policy = new RefusalPolicy(c.policyVersion)
      const action = policy.decide(c.riskLevel, c.context)
      expect(action, `golden case failed: ${c.id}`).toBe(c.expectedAction)
    }
  })
})
