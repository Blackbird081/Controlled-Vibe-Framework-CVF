import { describe, expect, it } from "vitest";
import {
  POLICY_ENGINE_COORDINATION,
  PolicyCompiler,
  TemplateEngine,
  resetCompilerCounters,
  resetTemplateCounters,
} from "../src/index";

describe("CVF_POLICY_ENGINE", () => {
  it("re-exports NL policy compilation utilities", () => {
    resetCompilerCounters();
    const compiler = new PolicyCompiler();
    const policy = compiler.compile(
      "Never let any agent spend more than $500 per day. Require approval for payment action."
    );

    expect(policy.rules.length).toBeGreaterThan(0);
    expect(policy.rules[0]?.intentDomain).toBe("finance");
  });

  it("publishes lineage metadata for the Python governance source", () => {
    resetTemplateCounters();
    const templates = new TemplateEngine();
    const doc = templates.instantiate("financial_governance", { max_daily_spend: 500 });

    expect(doc.name).toBe("Financial Governance");
    expect(POLICY_ENGINE_COORDINATION.executionClass).toBe("coordination package");
    expect(POLICY_ENGINE_COORDINATION.pythonGovernanceEngine).toContain("CVF_v1.6.1_GOVERNANCE_ENGINE");
  });
});
