/**
 * Material Context Manifest - Deterministic and Adversarial Tests
 */
import { describe, it, expect } from "vitest";
import {
  buildMaterialContextManifest as buildBoundMaterialContextManifest,
  validateMaterialContextManifest as validateBoundMaterialContextManifest,
  MATERIAL_CONTEXT_MANIFEST_VERSION,
  type MaterialContextManifest,
  type MaterialContextManifestBuildResult,
  type MaterialContextManifestFailure,
} from "../src/material-context-manifest";
import type { GatewayExecuteRequest } from "../src/unified-gateway-interface-contract";

const TRACE_ID = "test-trace-mcm-001";
const INVOCATION_BINDING = { providerId: "test-provider", modelId: "test-model" };

function asFailure(result: MaterialContextManifestBuildResult): MaterialContextManifestFailure {
  if (result.ok) {
    throw new Error("expected a manifest build failure in test setup");
  }
  return result as MaterialContextManifestFailure;
}

function makeRequest(overrides?: Partial<GatewayExecuteRequest>): GatewayExecuteRequest {
  return {
    traceId: TRACE_ID,
    prompt: "Hello, world",
    policy: {
      traceId: TRACE_ID,
      policyResult: "allow",
      reason: "test_allow",
    },
    routing: {
      traceId: TRACE_ID,
      preferredProviderId: "test-provider",
      requestedModelId: "test-model",
    },
    ...overrides,
  };
}

function buildMaterialContextManifest(request: GatewayExecuteRequest) {
  return buildBoundMaterialContextManifest(request, INVOCATION_BINDING);
}

function validateMaterialContextManifest(manifest: unknown, expectedTraceId: string): boolean {
  if (expectedTraceId !== TRACE_ID) return false;
  return validateBoundMaterialContextManifest(
    manifest,
    makeRequest({ systemPrompt: "sp", metadata: { a: 1 } }),
    INVOCATION_BINDING,
  );
}

describe("buildMaterialContextManifest", () => {
  it("exports the manifest version constant", () => {
    expect(MATERIAL_CONTEXT_MANIFEST_VERSION).toBe("cvf.materialContextManifest.rfrR4.v1");
  });

  it("builds a complete manifest for prompt/systemPrompt/metadata/policy/routing", () => {
    const request = makeRequest({
      systemPrompt: "You are a test assistant",
      metadata: { requestKind: "test" },
    });
    const result = buildMaterialContextManifest(request);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.manifest.traceId).toBe(TRACE_ID);
    expect(result.manifest.manifestVersion).toBe(MATERIAL_CONTEXT_MANIFEST_VERSION);
    expect(result.manifest.selectedProviderId).toBe(INVOCATION_BINDING.providerId);
    expect(result.manifest.selectedModelId).toBe(INVOCATION_BINDING.modelId);
    expect(result.manifest.adapterInputDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(result.manifest.manifestDigest).toMatch(/^[0-9a-f]{64}$/);
    const classes = result.manifest.entries.map((entry) => entry.contextClass).sort();
    expect(classes).toEqual(["metadata", "policy", "prompt", "routing", "systemPrompt"]);
    for (const entry of result.manifest.entries) {
      expect(entry.status).toBe("present");
      expect(entry.contentDigest).toMatch(/^[0-9a-f]{64}$/);
      expect(entry.traceBinding).toBe(TRACE_ID);
      expect(entry.sensitivity).toBe("material_secret_safe");
      expect(entry.authorityLabel).toBe("SOURCE_BACKED");
    }
  });

  it("produces deterministic key order and identical digests across repeated builds", () => {
    const request = makeRequest({ metadata: { b: 1, a: 2 } });
    const first = buildMaterialContextManifest(request);
    const second = buildMaterialContextManifest(makeRequest({ metadata: { a: 2, b: 1 } }));
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    const firstDigest = first.manifest.entries.find((e) => e.contextClass === "metadata")!.contentDigest;
    const secondDigest = second.manifest.entries.find((e) => e.contextClass === "metadata")!.contentDigest;
    expect(firstDigest).toBe(secondDigest);
  });

  it("marks optional systemPrompt and metadata explicitly absent when omitted", () => {
    const request = makeRequest();
    const result = buildMaterialContextManifest(request);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const systemPromptEntry = result.manifest.entries.find((e) => e.contextClass === "systemPrompt")!;
    const metadataEntry = result.manifest.entries.find((e) => e.contextClass === "metadata")!;
    expect(systemPromptEntry.status).toBe("absent");
    expect(systemPromptEntry.contentDigest).toBeNull();
    expect(metadataEntry.status).toBe("absent");
    expect(metadataEntry.contentDigest).toBeNull();
  });

  it("accepts empty-string prompt and whitespace-only prompt as present", () => {
    const emptyResult = buildMaterialContextManifest(makeRequest({ prompt: "" }));
    const whitespaceResult = buildMaterialContextManifest(makeRequest({ prompt: "   " }));
    expect(emptyResult.ok).toBe(true);
    expect(whitespaceResult.ok).toBe(true);
    if (!emptyResult.ok || !whitespaceResult.ok) return;
    const emptyPrompt = emptyResult.manifest.entries.find((e) => e.contextClass === "prompt")!;
    const whitespacePrompt = whitespaceResult.manifest.entries.find((e) => e.contextClass === "prompt")!;
    expect(emptyPrompt.status).toBe("present");
    expect(whitespacePrompt.status).toBe("present");
    expect(emptyPrompt.contentDigest).not.toBe(whitespacePrompt.contentDigest);
  });

  it("rejects raw credential-like keys in metadata", () => {
    const result = buildMaterialContextManifest(
      makeRequest({ metadata: { apiKey: "sk-fake-not-real" } }),
    );
    expect(result.ok).toBe(false);
    const failure = asFailure(result);
    expect(failure.reason).toBe("canonicalization_rejected");
    expect(failure.detail).toContain("credential_like_key_rejected");
  });

  it("rejects secret-like token/credential/password keys", () => {
    for (const key of ["secretToken", "credential", "password", "authToken"]) {
      const result = buildMaterialContextManifest(makeRequest({ metadata: { [key]: "x" } }));
      expect(result.ok).toBe(false);
    }
  });

  it("rejects cyclic metadata objects", () => {
    const cyclic: Record<string, unknown> = { a: 1 };
    cyclic.self = cyclic;
    const result = buildMaterialContextManifest(makeRequest({ metadata: cyclic }));
    expect(result.ok).toBe(false);
    expect(asFailure(result).detail).toContain("cycle_detected");
  });

  it("rejects accessor/getter properties", () => {
    const withGetter: Record<string, unknown> = {};
    Object.defineProperty(withGetter, "sneaky", {
      get() {
        return "value";
      },
      enumerable: true,
    });
    const result = buildMaterialContextManifest(makeRequest({ metadata: withGetter }));
    expect(result.ok).toBe(false);
    expect(asFailure(result).detail).toContain("unsupported_accessor_property");
  });

  it("rejects Date, Map, Set, function, symbol, and bigint values", () => {
    const cases: Array<Record<string, unknown>> = [
      { when: new Date() },
      { collection: new Map() },
      { collection: new Set() },
      { fn: () => 1 },
      { sym: Symbol("x") },
      { big: BigInt(1) },
    ];
    for (const metadata of cases) {
      const result = buildMaterialContextManifest(makeRequest({ metadata }));
      expect(result.ok).toBe(false);
    }
  });

  it("rejects non-finite numbers", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const result = buildMaterialContextManifest(makeRequest({ metadata: { n: value } }));
      expect(result.ok).toBe(false);
      expect(asFailure(result).detail).toContain("non_finite_number");
    }
  });

  it("rejects metadata exceeding the maximum depth bound", () => {
    let deep: Record<string, unknown> = { leaf: true };
    for (let i = 0; i < 20; i += 1) {
      deep = { nested: deep };
    }
    const result = buildMaterialContextManifest(makeRequest({ metadata: deep }));
    expect(result.ok).toBe(false);
    expect(asFailure(result).detail).toContain("depth_exceeded");
  });

  it("rejects metadata exceeding the maximum entry-count bound", () => {
    const wide: Record<string, unknown> = {};
    for (let i = 0; i < 2500; i += 1) {
      wide[`field${i}`] = i;
    }
    const result = buildMaterialContextManifest(makeRequest({ metadata: wide }));
    expect(result.ok).toBe(false);
    expect(asFailure(result).detail).toContain("size_exceeded");
  });

  it("distinguishes colliding-looking values with different digests (no hash collision confusion)", () => {
    const first = buildMaterialContextManifest(makeRequest({ metadata: { a: "1", b: "2" } }));
    const second = buildMaterialContextManifest(makeRequest({ metadata: { a: "12", b: "" } }));
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    const firstDigest = first.manifest.entries.find((e) => e.contextClass === "metadata")!.contentDigest;
    const secondDigest = second.manifest.entries.find((e) => e.contextClass === "metadata")!.contentDigest;
    expect(firstDigest).not.toBe(secondDigest);
  });

  it("length-prefixes object keys so delimiter-shaped distinct objects cannot collide", () => {
    const first = buildMaterialContextManifest(makeRequest({ metadata: { a: "x", b: "y" } }));
    const second = buildMaterialContextManifest(
      makeRequest({ metadata: { "a=s:1:x,b": "y" } }),
    );
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    const digest = (manifest: MaterialContextManifest) =>
      manifest.entries.find((entry) => entry.contextClass === "metadata")!.contentDigest;
    expect(digest(first.manifest)).not.toBe(digest(second.manifest));
  });

  it("rejects oversized and sparse arrays rather than silently truncating material", () => {
    const oversized = buildMaterialContextManifest(
      makeRequest({ metadata: { values: Array.from({ length: 2001 }, (_, index) => index) } }),
    );
    const sparseValues = new Array(2);
    sparseValues[1] = "present";
    const sparse = buildMaterialContextManifest(makeRequest({ metadata: { sparseValues } }));
    expect(oversized.ok).toBe(false);
    expect(sparse.ok).toBe(false);
    expect(asFailure(oversized).detail).toContain("size_exceeded");
    expect(asFailure(sparse).detail).toContain("sparse_array_rejected");
  });

  it("rejects symbol-keyed material instead of omitting it from the digest", () => {
    const metadata: Record<PropertyKey, unknown> = { visible: true };
    metadata[Symbol("hidden")] = "material";
    const result = buildMaterialContextManifest(
      makeRequest({ metadata: metadata as Record<string, unknown> }),
    );
    expect(result.ok).toBe(false);
    expect(asFailure(result).detail).toContain("symbol_key_rejected");
  });

  it("rejects request accessors without invoking them", () => {
    let getterCalls = 0;
    const request = makeRequest();
    Object.defineProperty(request, "metadata", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return { note: "must-not-run" };
      },
    });
    const result = buildMaterialContextManifest(request);
    expect(result.ok).toBe(false);
    expect(getterCalls).toBe(0);
  });

  it("rejects policy or routing trace drift", () => {
    const policyMismatch = buildMaterialContextManifest(
      makeRequest({ policy: { traceId: "wrong", policyResult: "allow", reason: "x" } }),
    );
    const routingMismatch = buildMaterialContextManifest(
      makeRequest({ routing: { traceId: "wrong", requestedModelId: "test-model" } }),
    );
    expect(policyMismatch.ok).toBe(false);
    expect(routingMismatch.ok).toBe(false);
  });

  it("normalizes own systemPrompt: undefined to the same absence as omission", () => {
    const omitted = buildMaterialContextManifest(makeRequest());
    const ownUndefined = buildMaterialContextManifest(makeRequest({ systemPrompt: undefined }));
    expect(omitted.ok).toBe(true);
    expect(ownUndefined.ok).toBe(true);
    if (!omitted.ok || !ownUndefined.ok) return;
    const omittedEntry = omitted.manifest.entries.find((e) => e.contextClass === "systemPrompt")!;
    const ownUndefinedEntry = ownUndefined.manifest.entries.find(
      (e) => e.contextClass === "systemPrompt",
    )!;
    expect(ownUndefinedEntry.status).toBe("absent");
    expect(ownUndefinedEntry.contentDigest).toBeNull();
    expect(ownUndefinedEntry.status).toBe(omittedEntry.status);
    expect(ownUndefinedEntry.contentDigest).toBe(omittedEntry.contentDigest);
  });

  it("normalizes own metadata: undefined to the same absence as omission", () => {
    const omitted = buildMaterialContextManifest(makeRequest());
    const ownUndefined = buildMaterialContextManifest(makeRequest({ metadata: undefined }));
    expect(omitted.ok).toBe(true);
    expect(ownUndefined.ok).toBe(true);
    if (!omitted.ok || !ownUndefined.ok) return;
    const ownUndefinedEntry = ownUndefined.manifest.entries.find(
      (e) => e.contextClass === "metadata",
    )!;
    expect(ownUndefinedEntry.status).toBe("absent");
    expect(ownUndefinedEntry.contentDigest).toBeNull();
  });

  it("normalizes own routing: undefined to the same absence as omission", () => {
    // routing is optional at the field level even though its nested shape,
    // when present, requires a matching traceId.
    const request = makeRequest();
    delete (request as unknown as Record<string, unknown>).routing;
    (request as unknown as Record<string, unknown>).routing = undefined;
    const result = buildMaterialContextManifest(request);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const routingEntry = result.manifest.entries.find((e) => e.contextClass === "routing")!;
    expect(routingEntry.status).toBe("absent");
    expect(routingEntry.contentDigest).toBeNull();
  });

  it("normalizes all three optional own-undefined fields together, matching full omission", () => {
    const omittedRequest = makeRequest();
    delete (omittedRequest as unknown as Record<string, unknown>).routing;
    const omitted = buildMaterialContextManifest(omittedRequest);
    const request = makeRequest();
    (request as unknown as Record<string, unknown>).systemPrompt = undefined;
    (request as unknown as Record<string, unknown>).metadata = undefined;
    (request as unknown as Record<string, unknown>).routing = undefined;
    const allOwnUndefined = buildMaterialContextManifest(request);
    expect(omitted.ok).toBe(true);
    expect(allOwnUndefined.ok).toBe(true);
    if (!omitted.ok || !allOwnUndefined.ok) return;
    for (const contextClass of ["systemPrompt", "metadata", "routing"] as const) {
      const omittedEntry = omitted.manifest.entries.find((e) => e.contextClass === contextClass)!;
      const ownUndefinedEntry = allOwnUndefined.manifest.entries.find(
        (e) => e.contextClass === contextClass,
      )!;
      expect(ownUndefinedEntry.status).toBe(omittedEntry.status);
      expect(ownUndefinedEntry.contentDigest).toBe(omittedEntry.contentDigest);
    }
  });

  it("produces identical manifest and adapter-input digests for omission versus own-undefined", () => {
    const omitted = buildMaterialContextManifest(makeRequest());
    const request = makeRequest();
    (request as unknown as Record<string, unknown>).systemPrompt = undefined;
    (request as unknown as Record<string, unknown>).metadata = undefined;
    const ownUndefined = buildMaterialContextManifest(request);
    expect(omitted.ok).toBe(true);
    expect(ownUndefined.ok).toBe(true);
    if (!omitted.ok || !ownUndefined.ok) return;
    expect(ownUndefined.manifest.adapterInputDigest).toBe(omitted.manifest.adapterInputDigest);
    expect(ownUndefined.manifest.manifestDigest).toBe(omitted.manifest.manifestDigest);
  });

  it("still rejects required traceId supplied as an own undefined value", () => {
    const request = makeRequest();
    (request as unknown as Record<string, unknown>).traceId = undefined;
    const result = buildMaterialContextManifest(request);
    expect(result.ok).toBe(false);
    expect(asFailure(result).detail).toContain("invalid_string_field:traceId");
  });

  it("still rejects required prompt supplied as an own undefined value", () => {
    const request = makeRequest();
    (request as unknown as Record<string, unknown>).prompt = undefined;
    const result = buildMaterialContextManifest(request);
    expect(result.ok).toBe(false);
    expect(asFailure(result).detail).toContain("invalid_string_field:prompt");
  });

  it("still rejects required policy supplied as an own undefined value", () => {
    // policy itself stays present (required fields never normalize an own
    // `undefined` to absence); its own-undefined value then fails the nested
    // trace-binding read against a non-object source.
    const request = makeRequest();
    (request as unknown as Record<string, unknown>).policy = undefined;
    const result = buildMaterialContextManifest(request);
    expect(result.ok).toBe(false);
    expect(asFailure(result).detail).toContain("invalid_request_object");
  });

  it("still rejects a missing required descriptor the same way as before", () => {
    const request = makeRequest();
    delete (request as unknown as Record<string, unknown>).traceId;
    const result = buildMaterialContextManifest(request);
    expect(result.ok).toBe(false);
    expect(asFailure(result).detail).toContain("missing_required_field:traceId");
  });

  it("still rejects required binding providerId/modelId supplied as own undefined values", () => {
    const request = makeRequest();
    const providerUndefined = buildBoundMaterialContextManifest(request, {
      providerId: undefined as unknown as string,
      modelId: "test-model",
    });
    const modelUndefined = buildBoundMaterialContextManifest(request, {
      providerId: "test-provider",
      modelId: undefined as unknown as string,
    });
    expect(providerUndefined.ok).toBe(false);
    expect(modelUndefined.ok).toBe(false);
    expect(asFailure(providerUndefined).detail).toContain("invalid_string_field:providerId");
    expect(asFailure(modelUndefined).detail).toContain("invalid_string_field:modelId");
  });

  it("rejects an optional accessor returning undefined without invoking the getter", () => {
    let getterCalls = 0;
    const request = makeRequest();
    Object.defineProperty(request, "systemPrompt", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return undefined;
      },
    });
    const result = buildMaterialContextManifest(request);
    expect(result.ok).toBe(false);
    expect(asFailure(result).detail).toContain("unsupported_accessor_field:systemPrompt");
    expect(getterCalls).toBe(0);
  });

  it("still rejects optional null and wrong-type non-undefined systemPrompt values", () => {
    const nullResult = buildMaterialContextManifest(
      makeRequest({ systemPrompt: null as unknown as string }),
    );
    const numberResult = buildMaterialContextManifest(
      makeRequest({ systemPrompt: 42 as unknown as string }),
    );
    expect(nullResult.ok).toBe(false);
    expect(numberResult.ok).toBe(false);
    expect(asFailure(nullResult).detail).toContain("invalid_string_field:systemPrompt");
    expect(asFailure(numberResult).detail).toContain("invalid_string_field:systemPrompt");
  });

  it("still rejects hostile prototype-chain / inherited optional fields", () => {
    const base = { systemPrompt: "inherited-should-not-be-admitted" };
    const request = Object.create(base) as GatewayExecuteRequest;
    Object.assign(request, {
      traceId: TRACE_ID,
      prompt: "Hello, world",
      policy: { traceId: TRACE_ID, policyResult: "allow", reason: "test_allow" },
      routing: {
        traceId: TRACE_ID,
        preferredProviderId: "test-provider",
        requestedModelId: "test-model",
      },
    });
    const result = buildMaterialContextManifest(request);
    expect(result.ok).toBe(false);
    expect(asFailure(result).detail).toContain("invalid_request_object");
  });

  it("never contains raw prompt, system prompt, or metadata values in the serialized manifest", () => {
    const secretLikePrompt = "the actual raw prompt text should never appear";
    const request = makeRequest({
      prompt: secretLikePrompt,
      systemPrompt: "the actual raw system prompt",
      metadata: { note: "the actual raw metadata note" },
    });
    const result = buildMaterialContextManifest(request);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const serialized = JSON.stringify(result.manifest);
    expect(serialized).not.toContain(secretLikePrompt);
    expect(serialized).not.toContain("the actual raw system prompt");
    expect(serialized).not.toContain("the actual raw metadata note");
  });
});

describe("validateMaterialContextManifest", () => {
  function buildValidManifest(): MaterialContextManifest {
    const result = buildMaterialContextManifest(makeRequest({ systemPrompt: "sp", metadata: { a: 1 } }));
    if (!result.ok) throw new Error("expected valid manifest in test setup");
    return result.manifest;
  }

  it("accepts a complete manifest bound to the expected trace", () => {
    const manifest = buildValidManifest();
    expect(validateMaterialContextManifest(manifest, TRACE_ID)).toBe(true);
  });

  it("rejects a manifest bound to a mismatched trace", () => {
    const manifest = buildValidManifest();
    expect(validateMaterialContextManifest(manifest, "different-trace")).toBe(false);
  });

  it("rejects a manifest with an entry traceBinding mismatched from the manifest traceId", () => {
    const manifest = buildValidManifest();
    const tampered: MaterialContextManifest = {
      ...manifest,
      entries: manifest.entries.map((entry, index) =>
        index === 0 ? { ...entry, traceBinding: "spoofed-trace" } : entry,
      ),
    };
    expect(validateMaterialContextManifest(tampered, TRACE_ID)).toBe(false);
  });

  it("rejects a manifest missing a required context class", () => {
    const manifest = buildValidManifest();
    const truncated: MaterialContextManifest = {
      ...manifest,
      entries: manifest.entries.filter((entry) => entry.contextClass !== "policy"),
    };
    expect(validateMaterialContextManifest(truncated, TRACE_ID)).toBe(false);
  });

  it("rejects a manifest with a duplicate context class", () => {
    const manifest = buildValidManifest();
    const duplicated: MaterialContextManifest = {
      ...manifest,
      entries: [...manifest.entries, manifest.entries[0]],
    };
    expect(validateMaterialContextManifest(duplicated, TRACE_ID)).toBe(false);
  });

  it("rejects a manifest containing an unknown context class", () => {
    const manifest = buildValidManifest();
    const withUnknown: MaterialContextManifest = {
      ...manifest,
      entries: [
        ...manifest.entries.slice(1),
        { ...manifest.entries[0], contextClass: "unknownClass" as never },
      ],
    };
    expect(validateMaterialContextManifest(withUnknown, TRACE_ID)).toBe(false);
  });

  it("rejects a present entry whose contentDigest is missing (caller-manifest spoofing)", () => {
    const manifest = buildValidManifest();
    const spoofed: MaterialContextManifest = {
      ...manifest,
      entries: manifest.entries.map((entry) =>
        entry.contextClass === "prompt" ? { ...entry, contentDigest: null } : entry,
      ),
    };
    expect(validateMaterialContextManifest(spoofed, TRACE_ID)).toBe(false);
  });

  it("rejects an absent entry that carries a fabricated contentDigest (caller-manifest spoofing)", () => {
    const manifest = buildValidManifest();
    const spoofed: MaterialContextManifest = {
      ...manifest,
      entries: manifest.entries.map((entry) =>
        entry.contextClass === "prompt"
          ? { ...entry, status: "absent" as const, contentDigest: "a".repeat(64) }
          : entry,
      ),
    };
    expect(validateMaterialContextManifest(spoofed, TRACE_ID)).toBe(false);
  });

  it("rejects every omitted or altered provenance and invocation binding field", () => {
    const manifest = buildValidManifest();
    const first = manifest.entries[0];
    const alteredEntries = [
      { ...first, sourceReference: "wrong" },
      { ...first, sourceType: "wrong" as never },
      { ...first, sourceVersion: "wrong" as never },
      { ...first, authorityLabel: "wrong" as never },
      { ...first, transformationMethod: "wrong" as never },
      { ...first, transformationVersion: "wrong" as never },
      { ...first, invocationScope: "wrong" as never },
      { ...first, sensitivity: "wrong" as never },
    ];
    for (const alteredEntry of alteredEntries) {
      const altered = { ...manifest, entries: [alteredEntry, ...manifest.entries.slice(1)] };
      expect(validateMaterialContextManifest(altered, TRACE_ID)).toBe(false);
    }
    for (const altered of [
      { ...manifest, manifestVersion: "wrong" },
      { ...manifest, selectedProviderId: "wrong" },
      { ...manifest, selectedModelId: "wrong" },
      { ...manifest, adapterInputDigest: "0".repeat(64) },
      { ...manifest, manifestDigest: "0".repeat(64) },
    ]) {
      expect(validateMaterialContextManifest(altered, TRACE_ID)).toBe(false);
    }
  });

  it("fails closed on a hostile manifest accessor without invoking it", () => {
    const manifest = buildValidManifest() as unknown as Record<string, unknown>;
    let getterCalls = 0;
    Object.defineProperty(manifest, "entries", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return [];
      },
    });
    expect(validateMaterialContextManifest(manifest, TRACE_ID)).toBe(false);
    expect(getterCalls).toBe(0);
  });
});
