import { describe, expect, it } from "vitest";
import {
  MODEL_GATEWAY_WRAPPER,
  NaturalPolicyParser,
  SkillAdapter,
  SkillValidator,
} from "../src/index";

describe("CVF_MODEL_GATEWAY", () => {
  it("re-exports runtime adapter policy parsing surface", () => {
    const parser = new NaturalPolicyParser();
    const rules = parser.parse("deny shell command execution");

    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0]?.decision).toBe("deny");
  });

  it("re-exports external skill intake and validation surface", async () => {
    const draft = await SkillAdapter.transform({
      source: "manual_upload",
      format: "markdown",
      raw_content: "review deployment checklist and security audit",
      raw_content_hash: "sha256-demo",
      external_metadata: {
        title: "Deployment Review Skill",
        description: "Checks release readiness",
      },
      ingested_at: new Date().toISOString(),
      ingested_by: "system",
      ingestion_pipeline_version: "1.0.0",
    });

    const validated = await SkillValidator.validate(draft);

    expect(validated.status).toBe("validated");
    expect(validated.governance.inferred_risk_level).toBeDefined();
  });

  it("publishes wrapper lineage metadata", () => {
    expect(MODEL_GATEWAY_WRAPPER.executionClass).toBe("implementation-owner upgrade");
    expect(MODEL_GATEWAY_WRAPPER.runtimeOwnership).toBe("implementation-owner upgrade");
    expect(MODEL_GATEWAY_WRAPPER.runtimeAdapterHub).toContain("public self-contained");
    expect(MODEL_GATEWAY_WRAPPER.externalIntegration).toContain("public deterministic");
    expect(MODEL_GATEWAY_WRAPPER.preservesRiskModelAssets).toBe(true);
    expect(MODEL_GATEWAY_WRAPPER.enforcesGuardContractBeforeRouting).toBe(true);
  });
});
