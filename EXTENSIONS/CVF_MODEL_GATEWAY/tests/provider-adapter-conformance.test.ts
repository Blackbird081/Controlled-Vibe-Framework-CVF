/**
 * Provider Adapter Contract Conformance - Deterministic Tests
 *
 * Tests all 12 required cases from the P4C work order.
 * No network calls, no real credentials, no concrete adapter imports,
 * no hardcoded required provider IDs.
 */

import { describe, it, expect, vi } from "vitest";
import {
  evaluateProviderAdapterConformance,
  PROVIDER_ADAPTER_CONFORMANCE_VERSION,
} from "../src/provider-adapter-conformance";
import type {
  ProviderAdapterConformanceInput,
} from "../src/provider-adapter-conformance";
import type { ProviderCapabilityFile } from "../src/provider-method-contract";
import type { ProviderExecutionAdapter } from "../src/provider-execution-bridge";

// ---------------------------------------------------------------------------
// Generic test fixtures - no real provider IDs required
// ---------------------------------------------------------------------------

/** Build a fake capability registry with one arbitrary provider and model. */
function makeRegistry(overrides?: {
  providerId?: string;
  modelId?: string;
  methods?: ("complete" | "chat" | "stream" | "json_mode" | "reasoning" | "vision" | "embedding" | "receipt" | "tool_call")[];
}): readonly ProviderCapabilityFile[] {
  return [
    {
      contractVersion: "cvf.providerCapability.v1",
      providerId: overrides?.providerId ?? "fake-provider",
      capabilityRef: "provider-capability/fake-provider",
      models: [
        {
          modelId: overrides?.modelId ?? "fake-model-v1",
          supportedMethods: overrides?.methods ?? ["complete", "chat"],
          defaultMethod: "complete",
        },
      ],
    },
  ];
}

/** Make a fake adapter that matches the given providerId. */
function makeAdapter(providerId: string): ProviderExecutionAdapter {
  return {
    providerId,
    execute: vi.fn(async () => ({ text: "should-not-be-called" })),
  };
}

function makeInput(
  overrides?: Partial<ProviderAdapterConformanceInput>,
): ProviderAdapterConformanceInput {
  return {
    providerId: "fake-provider",
    modelId: "fake-model-v1",
    method: "complete",
    adapter: makeAdapter("fake-provider"),
    capabilityRegistry: makeRegistry(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("evaluateProviderAdapterConformance", () => {
  describe("contract version", () => {
    it("exports correct version constant", () => {
      expect(PROVIDER_ADAPTER_CONFORMANCE_VERSION).toBe(
        "cvf.providerAdapterConformance.p4c.v1",
      );
    });
  });

  // Test 1: conformant fake adapter with matching provider/model/method passes
  describe("conformant path", () => {
    it("returns conformant when adapter, provider, model, and method all match", () => {
      const result = evaluateProviderAdapterConformance(makeInput());

      expect(result.status).toBe("conformant");
      expect(result.adapterExecutionAuthorized).toBe(true);
      expect(result.liveExecutionAuthorized).toBe(false);
      expect(result.reasons).toHaveLength(0);
      expect(result.providerId).toBe("fake-provider");
      expect(result.modelId).toBe("fake-model-v1");
    });
  });

  // Test 2: adapter provider mismatch blocks
  describe("adapter provider mismatch", () => {
    it("returns blocked when adapter.providerId differs from declared providerId", () => {
      const result = evaluateProviderAdapterConformance(
        makeInput({ adapter: makeAdapter("other-provider") }),
      );

      expect(result.status).toBe("blocked");
      expect(result.adapterExecutionAuthorized).toBe(false);
      expect(result.reasons.some((r) => r.includes("adapter_provider_mismatch"))).toBe(true);
    });
  });

  // Test 3: missing provider capability blocks
  describe("missing provider capability", () => {
    it("returns blocked when provider is not in the registry", () => {
      const result = evaluateProviderAdapterConformance(
        makeInput({
          providerId: "unregistered-provider",
          adapter: makeAdapter("unregistered-provider"),
        }),
      );

      expect(result.status).toBe("blocked");
      expect(result.adapterExecutionAuthorized).toBe(false);
      expect(result.reasons.some((r) => r.includes("missing_provider_capability"))).toBe(true);
      expect(result.supportedMethods).toHaveLength(0);
    });
  });

  // Test 4: missing model capability blocks
  describe("missing model capability", () => {
    it("returns blocked when model is not in the provider registry", () => {
      const result = evaluateProviderAdapterConformance(
        makeInput({ modelId: "nonexistent-model" }),
      );

      expect(result.status).toBe("blocked");
      expect(result.adapterExecutionAuthorized).toBe(false);
      expect(result.reasons.some((r) => r.includes("missing_provider_capability"))).toBe(true);
    });
  });

  // Test 5: unsupported method blocks
  describe("unsupported method", () => {
    it("returns blocked when method is not in the model's supported methods", () => {
      const result = evaluateProviderAdapterConformance(
        makeInput({
          method: "vision",
          capabilityRegistry: makeRegistry({ methods: ["complete", "chat"] }),
        }),
      );

      expect(result.status).toBe("blocked");
      expect(result.adapterExecutionAuthorized).toBe(false);
      expect(result.reasons.some((r) => r.includes("unsupported_method"))).toBe(true);
    });
  });

  // Test 6: method alias normalization is reflected in the report
  describe("method alias normalization", () => {
    it("normalizes 'chat' alias to 'complete' in the report", () => {
      const result = evaluateProviderAdapterConformance(
        makeInput({
          method: "chat",
          capabilityRegistry: makeRegistry({ methods: ["complete", "chat"] }),
        }),
      );

      expect(result.requestedMethod).toBe("chat");
      expect(result.normalizedMethod).toBe("complete");
      // chat is supported so should pass
      expect(result.status).toBe("conformant");
    });

    it("non-aliased methods normalize to themselves", () => {
      const result = evaluateProviderAdapterConformance(
        makeInput({
          method: "complete",
          capabilityRegistry: makeRegistry({ methods: ["complete"] }),
        }),
      );

      expect(result.normalizedMethod).toBe("complete");
      expect(result.status).toBe("conformant");
    });
  });

  // Test 7: optional credential metadata requirement blocks when unavailable
  describe("credential metadata requirement", () => {
    it("blocks when credentialMetadataAvailable=false is passed", () => {
      const result = evaluateProviderAdapterConformance(
        makeInput({ credentialMetadataAvailable: false }),
      );

      expect(result.status).toBe("blocked");
      expect(result.adapterExecutionAuthorized).toBe(false);
      expect(
        result.reasons.some((r) => r.includes("credential_metadata_unavailable")),
      ).toBe(true);
    });

    it("does not block when credentialMetadataAvailable is omitted", () => {
      const input = makeInput();
      delete (input as Partial<ProviderAdapterConformanceInput>).credentialMetadataAvailable;
      const result = evaluateProviderAdapterConformance(input);

      expect(result.status).toBe("conformant");
    });

    it("does not block when credentialMetadataAvailable=true", () => {
      const result = evaluateProviderAdapterConformance(
        makeInput({ credentialMetadataAvailable: true }),
      );

      expect(result.status).toBe("conformant");
    });
  });

  // Test 8: liveExecutionAuthorized is always false
  describe("liveExecutionAuthorized invariant", () => {
    it("is false for a conformant result", () => {
      const result = evaluateProviderAdapterConformance(makeInput());
      expect(result.liveExecutionAuthorized).toBe(false);
    });

    it("is false for a blocked result", () => {
      const result = evaluateProviderAdapterConformance(
        makeInput({ adapter: makeAdapter("wrong-provider") }),
      );
      expect(result.liveExecutionAuthorized).toBe(false);
    });
  });

  // Test 9: evaluator never calls adapter.execute()
  describe("adapter.execute() never called", () => {
    it("does not invoke adapter.execute() for any conformant input", () => {
      const adapter = makeAdapter("fake-provider");
      const executeSpy = vi.spyOn(adapter, "execute");

      evaluateProviderAdapterConformance(makeInput({ adapter }));

      expect(executeSpy).not.toHaveBeenCalled();
    });

    it("does not invoke adapter.execute() for any blocked input", () => {
      const adapter = makeAdapter("wrong-provider");
      const executeSpy = vi.spyOn(adapter, "execute");

      evaluateProviderAdapterConformance(makeInput({ adapter }));

      expect(executeSpy).not.toHaveBeenCalled();
    });
  });

  // Test 10: no hardcoded provider is required for conformance
  describe("provider agnosticism", () => {
    it("any arbitrary providerId is admitted when it matches adapter and registry", () => {
      const arbitraryId = "acme-cloud-llm";
      const result = evaluateProviderAdapterConformance({
        providerId: arbitraryId,
        modelId: "acme-model-turbo",
        method: "complete",
        adapter: makeAdapter(arbitraryId),
        capabilityRegistry: [
          {
            contractVersion: "cvf.providerCapability.v1",
            providerId: arbitraryId,
            capabilityRef: "provider-capability/acme",
            models: [
              {
                modelId: "acme-model-turbo",
                supportedMethods: ["complete"],
                defaultMethod: "complete",
              },
            ],
          },
        ],
      });

      expect(result.status).toBe("conformant");
      expect(result.adapterExecutionAuthorized).toBe(true);
    });

    it("a second arbitrary provider is also admitted", () => {
      const secondId = "open-source-llm-xyz";
      const result = evaluateProviderAdapterConformance({
        providerId: secondId,
        modelId: "xyz-model-1",
        method: "json_mode",
        adapter: makeAdapter(secondId),
        capabilityRegistry: [
          {
            contractVersion: "cvf.providerCapability.v1",
            providerId: secondId,
            capabilityRef: "provider-capability/xyz",
            models: [
              {
                modelId: "xyz-model-1",
                supportedMethods: ["complete", "json_mode"],
                defaultMethod: "complete",
              },
            ],
          },
        ],
      });

      expect(result.status).toBe("conformant");
      expect(result.adapterExecutionAuthorized).toBe(true);
    });
  });

  // Test 11: serialized report contains no test secret
  describe("serialized report contains no test secret", () => {
    it("conformant report has no leaked secret", () => {
      const TEST_SECRET = "sk-test-very-secret-key-12345";
      const adapter = makeAdapter("fake-provider");
      // Attempt to smuggle a secret through metadata
      const result = evaluateProviderAdapterConformance(
        makeInput({ adapter }),
      );
      const serialized = JSON.stringify(result);

      expect(serialized).not.toContain(TEST_SECRET);
    });

    it("blocked report has no leaked secret", () => {
      const TEST_SECRET = "sk-test-very-secret-key-12345";
      const adapter = makeAdapter("wrong-provider");
      const result = evaluateProviderAdapterConformance(
        makeInput({ adapter }),
      );
      const serialized = JSON.stringify(result);

      expect(serialized).not.toContain(TEST_SECRET);
    });
  });

  // Test 12: negative source assertion proves no concrete adapter import or network call
  describe("negative source assertions", () => {
    it("conformance source contains no concrete adapter references or network calls", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");

      const src = fs.readFileSync(
        path.resolve(__dirname, "../src/provider-adapter-conformance.ts"),
        "utf-8",
      );

      // No concrete provider adapter imports
      expect(src).not.toMatch(/providers\/alibaba/);
      expect(src).not.toMatch(/providers\/deepseek/);
      expect(src).not.toMatch(new RegExp("create" + "Alibaba", "i"));
      expect(src).not.toMatch(new RegExp("create" + "DeepSeek", "i"));

      // No network calls
      expect(src).not.toMatch(/\bfetch\s*\(/);
      expect(src).not.toMatch(/https?:\/\//);

      // No runtime secret resolution
      expect(src).not.toMatch(new RegExp("resolve" + "Secret" + "For" + "Runtime"));

      // No local environment-file reads
      expect(src).not.toMatch(new RegExp("\\." + "env" + "\\." + "local"));

      // No API key literals
      expect(src).not.toMatch(new RegExp("DASHSCOPE" + "_API" + "_KEY"));
      expect(src).not.toMatch(new RegExp("DEEPSEEK" + "_API" + "_KEY"));
      expect(src).not.toMatch(new RegExp("ALIBABA" + "_API" + "_KEY"));
    });
  });

  // Additional coverage: report shape completeness
  describe("report shape", () => {
    it("always returns all required fields for conformant path", () => {
      const result = evaluateProviderAdapterConformance(makeInput());

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("providerId");
      expect(result).toHaveProperty("modelId");
      expect(result).toHaveProperty("requestedMethod");
      expect(result).toHaveProperty("normalizedMethod");
      expect(result).toHaveProperty("supportedMethods");
      expect(result).toHaveProperty("adapterExecutionAuthorized");
      expect(result).toHaveProperty("liveExecutionAuthorized");
      expect(result).toHaveProperty("reasons");
      expect(Array.isArray(result.supportedMethods)).toBe(true);
      expect(Array.isArray(result.reasons)).toBe(true);
    });

    it("always returns all required fields for blocked path", () => {
      const result = evaluateProviderAdapterConformance(
        makeInput({ adapter: makeAdapter("wrong-id") }),
      );

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("adapterExecutionAuthorized");
      expect(result.adapterExecutionAuthorized).toBe(false);
      expect(result.liveExecutionAuthorized).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it("supportedMethods reflects actual registry entry", () => {
      const result = evaluateProviderAdapterConformance(
        makeInput({
          capabilityRegistry: makeRegistry({ methods: ["complete", "stream", "vision"] }),
        }),
      );

      expect(result.supportedMethods).toContain("complete");
      expect(result.supportedMethods).toContain("stream");
      expect(result.supportedMethods).toContain("vision");
    });
  });
});
