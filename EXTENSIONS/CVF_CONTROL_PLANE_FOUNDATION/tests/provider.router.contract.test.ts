import { describe, it, expect } from "vitest";
import {
  ProviderRouterContract,
  createProviderRouterContract,
} from "../src/provider.router.contract";
import type {
  ProviderPolicy,
  ProviderDefinition,
  ProviderSelection,
} from "../src/provider.router.contract";
import type { GatewayProcessedRequest } from "../src/ai.gateway.contract";

// --- Test helpers ---

const FIXED_TIME = "2026-04-08T12:00:00.000Z";

function createTestRequest(overrides?: Partial<GatewayProcessedRequest>): GatewayProcessedRequest {
  return {
    gatewayId: "gw-test-001",
    processedAt: FIXED_TIME,
    rawSignal: "test signal",
    normalizedSignal: "test signal",
    signalType: "command",
    envMetadata: {
      platform: "cvf",
      phase: "BUILD",
      riskLevel: "R1",
      locale: "en",
      tags: [],
    },
    privacyReport: { filtered: false, maskedTokenCount: 0, appliedPatterns: [] },
    gatewayHash: "test-hash",
    warnings: [],
    ...overrides,
  };
}

const claudeProvider: ProviderDefinition = {
  providerId: "claude",
  providerName: "Anthropic Claude",
  modelFamily: "claude",
  maxRiskLevel: "R2",
  costTier: "premium",
  capabilities: ["text", "code", "reasoning"],
};

const openaiProvider: ProviderDefinition = {
  providerId: "openai",
  providerName: "OpenAI GPT",
  modelFamily: "gpt",
  maxRiskLevel: "R1",
  costTier: "standard",
  capabilities: ["text", "code"],
};

const localProvider: ProviderDefinition = {
  providerId: "local-llm",
  providerName: "Local LLM",
  modelFamily: "llama",
  maxRiskLevel: "R3",
  costTier: "free",
  capabilities: ["text"],
};

function createTestPolicy(overrides?: Partial<ProviderPolicy>): ProviderPolicy {
  return {
    allowedProviders: [claudeProvider, openaiProvider, localProvider],
    defaultProviderId: "claude",
    riskCeiling: "R2",
    requireExplicitApproval: false,
    ...overrides,
  };
}

function createContract(): ProviderRouterContract {
  return createProviderRouterContract({ now: () => FIXED_TIME });
}

// --- Tests ---

describe("ProviderRouterContract", () => {
  describe("factory", () => {
    it("creates a contract via factory function", () => {
      const contract = createProviderRouterContract();
      expect(contract).toBeInstanceOf(ProviderRouterContract);
    });
  });

  describe("basic routing", () => {
    it("selects default provider when eligible", () => {
      const contract = createContract();
      const result = contract.route(createTestRequest(), createTestPolicy());

      expect(result.decision).toBe("ALLOW");
      expect(result.selectedProviderId).toBe("claude");
      expect(result.selectedProviderName).toBe("Anthropic Claude");
      expect(result.deniedReason).toBeNull();
    });

    it("includes fallback chain excluding selected provider", () => {
      const contract = createContract();
      const result = contract.route(createTestRequest(), createTestPolicy());

      expect(result.fallbackChain).toContain("openai");
      expect(result.fallbackChain).toContain("local-llm");
      expect(result.fallbackChain).not.toContain("claude");
    });

    it("produces deterministic hash", () => {
      const contract = createContract();
      const r1 = contract.route(createTestRequest(), createTestPolicy());
      const r2 = contract.route(createTestRequest(), createTestPolicy());

      expect(r1.selectionHash).toBe(r2.selectionHash);
      expect(r1.selectionId).toBe(r2.selectionId);
    });

    it("produces unique hash for different inputs", () => {
      const contract = createContract();
      const r1 = contract.route(createTestRequest(), createTestPolicy());
      const r2 = contract.route(
        createTestRequest({ envMetadata: { platform: "cvf", phase: "BUILD", riskLevel: "R2", locale: "en", tags: [] } }),
        createTestPolicy(),
      );

      expect(r1.selectionHash).not.toBe(r2.selectionHash);
    });

    it("populates evaluatedAt", () => {
      const contract = createContract();
      const result = contract.route(createTestRequest(), createTestPolicy());

      expect(result.evaluatedAt).toBe(FIXED_TIME);
    });

    it("tracks request risk level in selection", () => {
      const contract = createContract();
      const result = contract.route(createTestRequest(), createTestPolicy());

      expect(result.requestRiskLevel).toBe("R1");
      expect(result.policyRiskCeiling).toBe("R2");
    });
  });

  describe("risk ceiling enforcement", () => {
    it("denies when request risk exceeds policy ceiling", () => {
      const contract = createContract();
      const request = createTestRequest({
        envMetadata: { platform: "cvf", phase: "BUILD", riskLevel: "R3", locale: "en", tags: [] },
      });
      const policy = createTestPolicy({ riskCeiling: "R2" });

      const result = contract.route(request, policy);

      expect(result.decision).toBe("DENY");
      expect(result.selectedProviderId).toBeNull();
      expect(result.deniedReason).toContain("R3");
      expect(result.deniedReason).toContain("R2");
    });

    it("allows when request risk equals policy ceiling", () => {
      const contract = createContract();
      const request = createTestRequest({
        envMetadata: { platform: "cvf", phase: "BUILD", riskLevel: "R2", locale: "en", tags: [] },
      });
      const policy = createTestPolicy({ riskCeiling: "R2" });

      const result = contract.route(request, policy);

      expect(result.decision).toBe("ALLOW");
    });

    it("allows R0 with R0 ceiling", () => {
      const contract = createContract();
      const request = createTestRequest({
        envMetadata: { platform: "cvf", phase: "BUILD", riskLevel: "R0", locale: "en", tags: [] },
      });
      const policy = createTestPolicy({
        riskCeiling: "R0",
        allowedProviders: [localProvider],
        defaultProviderId: "local-llm",
      });

      const result = contract.route(request, policy);

      expect(result.decision).toBe("ALLOW");
    });

    it("denies R1 with R0 ceiling", () => {
      const contract = createContract();
      const request = createTestRequest({
        envMetadata: { platform: "cvf", phase: "BUILD", riskLevel: "R1", locale: "en", tags: [] },
      });
      const policy = createTestPolicy({ riskCeiling: "R0" });

      const result = contract.route(request, policy);

      expect(result.decision).toBe("DENY");
    });
  });

  describe("explicit approval", () => {
    it("escalates non-R0 request when requireExplicitApproval is true", () => {
      const contract = createContract();
      const policy = createTestPolicy({ requireExplicitApproval: true });
      const result = contract.route(createTestRequest(), policy);

      expect(result.decision).toBe("ESCALATE");
      expect(result.selectedProviderId).toBeNull();
      expect(result.rationale).toContain("explicit approval");
    });

    it("allows R0 request even with requireExplicitApproval", () => {
      const contract = createContract();
      const request = createTestRequest({
        envMetadata: { platform: "cvf", phase: "BUILD", riskLevel: "R0", locale: "en", tags: [] },
      });
      const policy = createTestPolicy({ requireExplicitApproval: true });

      const result = contract.route(request, policy);

      expect(result.decision).toBe("ALLOW");
    });
  });

  describe("provider filtering", () => {
    it("filters providers by risk level", () => {
      const contract = createContract();
      const request = createTestRequest({
        envMetadata: { platform: "cvf", phase: "BUILD", riskLevel: "R2", locale: "en", tags: [] },
      });
      // openai maxRiskLevel is R1, so it should be filtered out
      const result = contract.route(request, createTestPolicy());

      expect(result.decision).toBe("ALLOW");
      expect(result.selectedProviderId).toBe("claude");
      expect(result.fallbackChain).not.toContain("openai");
      expect(result.fallbackChain).toContain("local-llm");
    });

    it("filters providers by cost budget", () => {
      const contract = createContract();
      const policy = createTestPolicy({ costBudgetTier: "standard" });
      const result = contract.route(createTestRequest(), policy);

      // claude is premium, exceeds standard budget
      expect(result.decision).toBe("ALLOW");
      expect(result.selectedProviderId).toBe("openai");
    });

    it("filters providers by free budget", () => {
      const contract = createContract();
      const policy = createTestPolicy({ costBudgetTier: "free" });
      const result = contract.route(createTestRequest(), policy);

      expect(result.decision).toBe("ALLOW");
      expect(result.selectedProviderId).toBe("local-llm");
    });

    it("filters providers by required capabilities", () => {
      const contract = createContract();
      const policy = createTestPolicy({ requiredCapabilities: ["reasoning"] });
      const result = contract.route(createTestRequest(), policy);

      // Only claude has "reasoning" capability
      expect(result.decision).toBe("ALLOW");
      expect(result.selectedProviderId).toBe("claude");
      expect(result.fallbackChain).toHaveLength(0);
    });

    it("denies when no provider has required capability", () => {
      const contract = createContract();
      const policy = createTestPolicy({ requiredCapabilities: ["image-generation"] });
      const result = contract.route(createTestRequest(), policy);

      expect(result.decision).toBe("DENY");
      expect(result.deniedReason).toContain("No provider matches");
    });

    it("denies when all providers filtered out by combined constraints", () => {
      const contract = createContract();
      const policy = createTestPolicy({
        costBudgetTier: "free",
        requiredCapabilities: ["code"],
      });
      // local-llm is free but only has "text", not "code"
      const result = contract.route(createTestRequest(), policy);

      expect(result.decision).toBe("DENY");
    });
  });

  describe("fallback behavior", () => {
    it("selects first eligible when default is not eligible", () => {
      const contract = createContract();
      const policy = createTestPolicy({
        defaultProviderId: "nonexistent",
      });
      const result = contract.route(createTestRequest(), policy);

      expect(result.decision).toBe("ALLOW");
      expect(result.selectedProviderId).toBe("claude");
      expect(result.rationale).toContain("first eligible");
    });

    it("selects first eligible when default filtered by risk", () => {
      const contract = createContract();
      const request = createTestRequest({
        envMetadata: { platform: "cvf", phase: "BUILD", riskLevel: "R2", locale: "en", tags: [] },
      });
      const policy = createTestPolicy({
        defaultProviderId: "openai",
      });
      // openai maxRiskLevel R1 < request R2
      const result = contract.route(request, policy);

      expect(result.decision).toBe("ALLOW");
      expect(result.selectedProviderId).toBe("claude");
    });

    it("returns empty fallback chain for single eligible provider", () => {
      const contract = createContract();
      const policy = createTestPolicy({
        allowedProviders: [claudeProvider],
        defaultProviderId: "claude",
      });
      const result = contract.route(createTestRequest(), policy);

      expect(result.fallbackChain).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("handles empty provider list", () => {
      const contract = createContract();
      const policy = createTestPolicy({ allowedProviders: [] });
      const result = contract.route(createTestRequest(), policy);

      expect(result.decision).toBe("DENY");
      expect(result.deniedReason).toContain("No provider");
    });

    it("handles unknown risk level in request", () => {
      const contract = createContract();
      const request = createTestRequest({
        envMetadata: { platform: "cvf", phase: "BUILD", riskLevel: "UNKNOWN", locale: "en", tags: [] },
      });
      const result = contract.route(request, createTestPolicy());

      // Should default to R1
      expect(result.requestRiskLevel).toBe("R1");
      expect(result.decision).toBe("ALLOW");
    });

    it("risk ceiling check runs before provider filtering", () => {
      const contract = createContract();
      const request = createTestRequest({
        envMetadata: { platform: "cvf", phase: "BUILD", riskLevel: "R3", locale: "en", tags: [] },
      });
      const policy = createTestPolicy({
        riskCeiling: "R1",
        allowedProviders: [localProvider], // local-llm supports R3
      });

      const result = contract.route(request, policy);

      // Should be denied by ceiling, not allowed despite local-llm supporting R3
      expect(result.decision).toBe("DENY");
      expect(result.deniedReason).toContain("ceiling");
    });

    it("explicit approval check runs before provider filtering", () => {
      const contract = createContract();
      const policy = createTestPolicy({ requireExplicitApproval: true });

      const result = contract.route(createTestRequest(), policy);

      expect(result.decision).toBe("ESCALATE");
    });
  });
});
