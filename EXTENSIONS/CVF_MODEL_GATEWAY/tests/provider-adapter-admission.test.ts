import { describe, expect, it } from "vitest";
import {
  admitProviderAdapter,
  PROVIDER_ADAPTER_ADMISSION_VERSION,
} from "../src/provider-adapter-admission";
import type { ProviderAdapterConformanceReport } from "../src/provider-adapter-conformance";
import {
  negotiateProviderCapability,
  PROVIDER_CAPABILITY_NEGOTIATION_VERSION,
} from "../src/provider-capability-negotiation";
import type { ProviderCapabilityFile, ProviderMethodName } from "../src/provider-method-contract";

function makeRegistry(overrides?: {
  providerId?: string;
  modelId?: string;
  methods?: ProviderMethodName[];
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

function makeReport(
  overrides?: Partial<ProviderAdapterConformanceReport>,
): ProviderAdapterConformanceReport {
  return {
    status: "conformant",
    providerId: "fake-provider",
    modelId: "fake-model-v1",
    requestedMethod: "complete",
    normalizedMethod: "complete",
    supportedMethods: ["complete", "chat"],
    adapterExecutionAuthorized: true,
    liveExecutionAuthorized: false,
    reasons: [],
    ...overrides,
  };
}

describe("provider adapter admission", () => {
  it("exports version constants", () => {
    expect(PROVIDER_ADAPTER_ADMISSION_VERSION).toBe("cvf.providerAdapterAdmission.p5a.v1");
    expect(PROVIDER_CAPABILITY_NEGOTIATION_VERSION).toBe(
      "cvf.providerCapabilityNegotiation.p5b.v1",
    );
  });

  it("admits a conformant P4C report with matching registry entry", () => {
    const record = admitProviderAdapter(makeReport(), makeRegistry());

    expect(record.status).toBe("admitted");
    expect(record.reasonCodes).toEqual([]);
    expect(record.providerId).toBe("fake-provider");
  });

  it("blocks a blocked P4C report with conformance_blocked", () => {
    const record = admitProviderAdapter(
      makeReport({ status: "blocked", adapterExecutionAuthorized: false }),
      makeRegistry(),
    );

    expect(record.status).toBe("blocked");
    expect(record.reasonCodes).toContain("conformance_blocked");
  });

  it("blocks a provider absent from registry", () => {
    const record = admitProviderAdapter(
      makeReport({ providerId: "missing-provider" }),
      makeRegistry(),
    );

    expect(record.status).toBe("blocked");
    expect(record.reasonCodes).toContain("provider_not_in_registry");
  });

  it("blocks a model absent from registry", () => {
    const record = admitProviderAdapter(
      makeReport({ modelId: "missing-model" }),
      makeRegistry(),
    );

    expect(record.status).toBe("blocked");
    expect(record.reasonCodes).toContain("model_not_in_registry");
  });

  it("blocks unsupported method after normalization", () => {
    const record = admitProviderAdapter(
      makeReport({ requestedMethod: "vision", normalizedMethod: "vision" }),
      makeRegistry({ methods: ["complete", "chat"] }),
    );

    expect(record.status).toBe("blocked");
    expect(record.reasonCodes).toContain("method_not_supported");
  });

  it("reflects method alias normalization in normalizedMethod", () => {
    const record = admitProviderAdapter(
      makeReport({ requestedMethod: "chat", normalizedMethod: "complete" }),
      makeRegistry({ methods: ["complete"] }),
    );

    expect(record.status).toBe("admitted");
    expect(record.normalizedMethod).toBe("complete");
  });

  it("requires operator authorization when credential metadata is required but absent", () => {
    const record = admitProviderAdapter(
      makeReport({ adapterExecutionAuthorized: false }),
      makeRegistry(),
      { requireCredentialMetadata: true },
    );

    expect(record.status).toBe("needs_operator_authorization");
    expect(record.reasonCodes).toContain("credential_metadata_required");
  });

  it("keeps liveExecutionAuthorized false for every record shape", () => {
    const admitted = admitProviderAdapter(makeReport(), makeRegistry());
    const blocked = admitProviderAdapter(
      makeReport({ providerId: "missing-provider" }),
      makeRegistry(),
    );

    expect(admitted.liveExecutionAuthorized).toBe(false);
    expect(blocked.liveExecutionAuthorized).toBe(false);
  });

  it("emits a non-empty deterministic traceId", () => {
    const first = admitProviderAdapter(makeReport(), makeRegistry());
    const second = admitProviderAdapter(makeReport(), makeRegistry());

    expect(first.traceId).toBeTruthy();
    expect(first.traceId).toBe(second.traceId);
  });

  it("does not require a hardcoded provider for admission", () => {
    const registry = makeRegistry({
      providerId: "acme-provider",
      modelId: "acme-model",
      methods: ["json_mode"],
    });
    const record = admitProviderAdapter(
      makeReport({
        providerId: "acme-provider",
        modelId: "acme-model",
        requestedMethod: "json_mode",
        normalizedMethod: "json_mode",
        supportedMethods: ["json_mode"],
      }),
      registry,
    );

    expect(record.status).toBe("admitted");
  });

  it("serialized record contains no test secret", () => {
    const secret = "sk-test-never-include-this-value";
    const record = admitProviderAdapter(makeReport(), makeRegistry());

    expect(JSON.stringify(record)).not.toContain(secret);
  });

  it("new P5 files contain no concrete adapter import or network call", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const roots = [
      "../src/provider-adapter-admission.ts",
      "../src/provider-capability-negotiation.ts",
      "./provider-adapter-admission.test.ts",
    ];
    const text = roots.map((root) => fs.readFileSync(path.resolve(__dirname, root), "utf-8"))
      .join("\n");

    expect(text).not.toMatch(/\bfetch\s*\(/);
    expect(text).not.toMatch(/https?:\/\//);
    expect(text).not.toMatch(/providers\/alibaba/);
    expect(text).not.toMatch(/providers\/deepseek/);
    expect(text).not.toMatch(new RegExp("create" + "Alibaba", "i"));
    expect(text).not.toMatch(new RegExp("create" + "DeepSeek", "i"));
    expect(text).not.toMatch(new RegExp("resolve" + "Secret" + "For" + "Runtime"));
    expect(text).not.toMatch(new RegExp("\\." + "env" + "\\." + "local"));
    expect(text).not.toMatch(new RegExp("DASHSCOPE" + "_API" + "_KEY"));
    expect(text).not.toMatch(new RegExp("DEEPSEEK" + "_API" + "_KEY"));
  });
});

describe("provider capability negotiation", () => {
  it("negotiates a directly supported method", () => {
    const result = negotiateProviderCapability(
      "fake-provider",
      "fake-model-v1",
      "complete",
      makeRegistry({ methods: ["complete", "chat"] }),
    );

    expect(result.status).toBe("negotiated");
    expect(result.effectiveMethod).toBe("complete");
  });

  it("negotiates an alias when normalized method is supported", () => {
    const result = negotiateProviderCapability(
      "fake-provider",
      "fake-model-v1",
      "chat",
      makeRegistry({ methods: ["complete"] }),
    );

    expect(result.status).toBe("negotiated");
    expect(result.effectiveMethod).toBe("complete");
  });

  it("reports fallback_available when complete can fall back to chat", () => {
    const result = negotiateProviderCapability(
      "fake-provider",
      "fake-model-v1",
      "complete",
      makeRegistry({ methods: ["chat"] }),
    );

    expect(result.status).toBe("fallback_available");
    expect(result.effectiveMethod).toBe("chat");
    expect(result.reasonCodes).toContain("fallback_method_available");
  });

  it("blocks when no supported or fallback method exists", () => {
    const result = negotiateProviderCapability(
      "fake-provider",
      "fake-model-v1",
      "vision",
      makeRegistry({ methods: ["complete"] }),
    );

    expect(result.status).toBe("blocked");
    expect(result.reasonCodes).toContain("method_not_supported");
  });
});
