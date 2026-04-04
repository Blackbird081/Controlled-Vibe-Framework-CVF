import { describe, expect, it } from "vitest";
import {
  AGENT_DEFINITION_COORDINATION,
  IdentityManager,
  resetAgentCounter,
  resetCredCounter,
} from "../src/index";

describe("CVF_AGENT_DEFINITION", () => {
  it("re-exports the runtime identity manager", () => {
    resetAgentCounter();
    resetCredCounter();
    const identity = new IdentityManager();
    const { agent, credential } = identity.registerAgent({
      name: "Ops-Bot",
      role: "executor",
      domains: ["operations"],
    });

    const verification = identity.verify(agent.agentId, credential.value);
    expect(verification.verified).toBe(true);
    expect(verification.trustLevel).toBe("basic");
  });

  it("publishes lineage metadata for the capability baseline", () => {
    expect(AGENT_DEFINITION_COORDINATION.executionClass).toBe("coordination package");
    expect(AGENT_DEFINITION_COORDINATION.runtimeIdentityModule).toContain("CVF_ECO_v2.3_AGENT_IDENTITY");
    expect(AGENT_DEFINITION_COORDINATION.capabilityBaselineModule).toContain("CVF_v1.2_CAPABILITY_EXTENSION");
    expect(AGENT_DEFINITION_COORDINATION.linkedCapabilityDocs).toContain("CAPABILITY_RISK_MODEL.md");
  });
});
