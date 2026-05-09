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
    expect(MODEL_GATEWAY_WRAPPER.executionClass).toBe("wrapper/re-export merge");
    expect(MODEL_GATEWAY_WRAPPER.runtimeAdapterHub).toContain("CVF_v1.7.3_RUNTIME_ADAPTER_HUB");
    expect(MODEL_GATEWAY_WRAPPER.externalIntegration).toContain("CVF_v1.2.1_EXTERNAL_INTEGRATION");
    expect(MODEL_GATEWAY_WRAPPER.preservesRiskModelAssets).toBe(true);
  });
});
