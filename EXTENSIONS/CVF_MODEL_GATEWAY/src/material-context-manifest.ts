/**
 * Deterministic, secret-safe inventory of material Model Gateway invocation
 * context. Raw context is canonicalized only in memory and is never retained.
 */
import { createHash } from "node:crypto";
import {
  UNIFIED_GATEWAY_INTERFACE_CONTRACT_VERSION,
  type GatewayExecuteRequest,
} from "./unified-gateway-interface-contract";

export const MATERIAL_CONTEXT_MANIFEST_VERSION = "cvf.materialContextManifest.rfrR4.v1" as const;
export const MATERIAL_CONTEXT_TRANSFORMATION_VERSION =
  "cvf.materialContextCanonicalDigest.rfrR4.v1" as const;

export type MaterialContextClass =
  | "prompt"
  | "systemPrompt"
  | "metadata"
  | "policy"
  | "routing";

const REQUIRED_CONTEXT_CLASSES: readonly MaterialContextClass[] = [
  "prompt",
  "systemPrompt",
  "metadata",
  "policy",
  "routing",
];
const MAX_CANONICALIZATION_DEPTH = 12;
const MAX_CANONICALIZATION_ENTRIES = 2000;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/;
const CREDENTIAL_LIKE_WORDS = new Set([
  "key",
  "secret",
  "token",
  "credential",
  "password",
  "apikey",
  "passphrase",
]);

export type MaterialContextEntryStatus = "present" | "absent";

export interface MaterialContextEntry {
  readonly contextClass: MaterialContextClass;
  readonly sourceReference: string;
  readonly sourceType: "request_field";
  readonly sourceVersion: typeof UNIFIED_GATEWAY_INTERFACE_CONTRACT_VERSION;
  readonly authorityLabel: "SOURCE_BACKED";
  readonly transformationMethod: "deterministic_canonical_digest";
  readonly transformationVersion: typeof MATERIAL_CONTEXT_TRANSFORMATION_VERSION;
  readonly invocationScope: "provider_execution_bridge.execute";
  readonly traceBinding: string;
  readonly sensitivity: "material_secret_safe";
  readonly status: MaterialContextEntryStatus;
  readonly contentDigest: string | null;
}

export interface MaterialContextInvocationBinding {
  readonly providerId: string;
  readonly modelId: string;
}

export interface MaterialContextManifest {
  readonly manifestVersion: typeof MATERIAL_CONTEXT_MANIFEST_VERSION;
  readonly traceId: string;
  readonly selectedProviderId: string;
  readonly selectedModelId: string;
  readonly adapterInputDigest: string;
  readonly entries: readonly MaterialContextEntry[];
  readonly manifestDigest: string;
}

export type MaterialContextManifestFailureReason = "canonicalization_rejected";
export interface MaterialContextManifestFailure {
  readonly ok: false;
  readonly reason: MaterialContextManifestFailureReason;
  readonly detail: string;
}
export interface MaterialContextManifestSuccess {
  readonly ok: true;
  readonly manifest: MaterialContextManifest;
}
export type MaterialContextManifestBuildResult =
  | MaterialContextManifestSuccess
  | MaterialContextManifestFailure;

class CanonicalizationRejected extends Error {}
interface CanonicalizationState {
  readonly seen: Set<object>;
  entries: number;
}

function reject(reason: string): never {
  throw new CanonicalizationRejected(reason);
}

function isCredentialLikeKey(key: string): boolean {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .map((word) => word.toLowerCase())
    .filter(Boolean);
  return words.some((word) => CREDENTIAL_LIKE_WORDS.has(word));
}

function countEntries(state: CanonicalizationState, count: number): void {
  state.entries += count;
  if (state.entries > MAX_CANONICALIZATION_ENTRIES) reject("size_exceeded");
}

function canonicalize(value: unknown, depth: number, state: CanonicalizationState): string {
  if (depth > MAX_CANONICALIZATION_DEPTH) reject("depth_exceeded");
  if (value === null) return "null";
  const valueType = typeof value;
  if (valueType === "function" || valueType === "symbol" || valueType === "bigint") {
    reject(`unsupported_type:${valueType}`);
  }
  if (valueType === "number") {
    if (!Number.isFinite(value as number)) reject("non_finite_number");
    return Object.is(value, -0) ? "n:-0" : `n:${value as number}`;
  }
  if (valueType === "boolean") return `b:${value as boolean}`;
  if (valueType === "string") return `s:${(value as string).length}:${value as string}`;
  if (valueType === "undefined") return "u";
  if (value instanceof Date) reject("unsupported_type:date");
  if (value instanceof Map || value instanceof Set) reject("unsupported_type:collection");
  if (valueType !== "object") reject(`unsupported_type:${valueType}`);

  const objectValue = value as object;
  if (state.seen.has(objectValue)) reject("cycle_detected");
  state.seen.add(objectValue);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) reject("unsupported_type:array_subclass");
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const ownKeys = Reflect.ownKeys(descriptors);
      if (ownKeys.some((key) => typeof key === "symbol")) reject("symbol_key_rejected");
      const length = value.length;
      countEntries(state, length);
      const allowedKeys = new Set(["length", ...Array.from({ length }, (_, index) => String(index))]);
      if (ownKeys.some((key) => typeof key !== "string" || !allowedKeys.has(key))) {
        reject("unsupported_array_property");
      }
      const items: string[] = [];
      for (let index = 0; index < length; index += 1) {
        const descriptor = descriptors[String(index)];
        if (!descriptor) reject("sparse_array_rejected");
        if (descriptor.get || descriptor.set || !("value" in descriptor)) {
          reject("unsupported_accessor_property");
        }
        items.push(canonicalize(descriptor.value, depth + 1, state));
      }
      return `a:${length}:[${items.join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      reject("unsupported_type:non_plain_object");
    }
    const descriptors = Object.getOwnPropertyDescriptors(value as Record<string, unknown>);
    const ownKeys = Reflect.ownKeys(descriptors);
    if (ownKeys.some((key) => typeof key === "symbol")) reject("symbol_key_rejected");
    const keys = (ownKeys as string[]).sort();
    countEntries(state, keys.length);
    const parts: string[] = [];
    for (const key of keys) {
      const descriptor = descriptors[key];
      if (descriptor.get || descriptor.set || !("value" in descriptor)) {
        reject("unsupported_accessor_property");
      }
      if (isCredentialLikeKey(key)) reject("credential_like_key_rejected");
      parts.push(`${key.length}:${key}=${canonicalize(descriptor.value, depth + 1, state)}`);
    }
    return `o:${keys.length}:{${parts.join(",")}}`;
  } finally {
    state.seen.delete(objectValue);
  }
}

function canonicalForm(value: unknown): string {
  return canonicalize(value, 0, { seen: new Set<object>(), entries: 0 });
}

function digestOf(value: unknown): string {
  return createHash("sha256").update(canonicalForm(value), "utf8").digest("hex");
}

function readDataField(
  source: unknown,
  field: string,
  required: boolean,
): { present: boolean; value: unknown } {
  if (source === null || typeof source !== "object") reject("invalid_request_object");
  const prototype = Object.getPrototypeOf(source);
  if (prototype !== Object.prototype && prototype !== null) reject("invalid_request_object");
  const descriptor = Object.getOwnPropertyDescriptor(source, field);
  if (!descriptor) {
    if (required) reject(`missing_required_field:${field}`);
    return { present: false, value: undefined };
  }
  if (descriptor.get || descriptor.set || !("value" in descriptor)) {
    reject(`unsupported_accessor_field:${field}`);
  }
  if (!required && descriptor.value === undefined) {
    // An optional own data property explicitly set to `undefined` carries no
    // material distinct from an omitted property; normalize both to the same
    // explicit-absence representation. Required fields never take this path,
    // so an own `undefined` required value still reaches present-value
    // validation and fails it exactly as today.
    return { present: false, value: undefined };
  }
  return { present: true, value: descriptor.value };
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) reject(`invalid_string_field:${field}`);
  return value;
}

function assertNestedTrace(value: unknown, traceId: string, field: string): void {
  const nestedTrace = readDataField(value, "traceId", true).value;
  if (nestedTrace !== traceId) reject(`trace_mismatch:${field}`);
}

function buildEntry(
  contextClass: MaterialContextClass,
  traceId: string,
  value: unknown,
  present: boolean,
): MaterialContextEntry {
  return {
    contextClass,
    sourceReference: `GatewayExecuteRequest.${contextClass}`,
    sourceType: "request_field",
    sourceVersion: UNIFIED_GATEWAY_INTERFACE_CONTRACT_VERSION,
    authorityLabel: "SOURCE_BACKED",
    transformationMethod: "deterministic_canonical_digest",
    transformationVersion: MATERIAL_CONTEXT_TRANSFORMATION_VERSION,
    invocationScope: "provider_execution_bridge.execute",
    traceBinding: traceId,
    sensitivity: "material_secret_safe",
    status: present ? "present" : "absent",
    contentDigest: present ? digestOf(value) : null,
  };
}

function unsignedManifest(
  traceId: string,
  binding: MaterialContextInvocationBinding,
  adapterInputDigest: string,
  entries: readonly MaterialContextEntry[],
): Omit<MaterialContextManifest, "manifestDigest"> {
  return {
    manifestVersion: MATERIAL_CONTEXT_MANIFEST_VERSION,
    traceId,
    selectedProviderId: binding.providerId,
    selectedModelId: binding.modelId,
    adapterInputDigest,
    entries,
  };
}

export function buildMaterialContextManifest(
  request: GatewayExecuteRequest,
  binding: MaterialContextInvocationBinding,
): MaterialContextManifestBuildResult {
  try {
    const traceId = requireString(readDataField(request, "traceId", true).value, "traceId");
    const prompt = readDataField(request, "prompt", true);
    if (typeof prompt.value !== "string") reject("invalid_string_field:prompt");
    const systemPrompt = readDataField(request, "systemPrompt", false);
    if (systemPrompt.present && typeof systemPrompt.value !== "string") {
      reject("invalid_string_field:systemPrompt");
    }
    const metadata = readDataField(request, "metadata", false);
    const policy = readDataField(request, "policy", true);
    const routing = readDataField(request, "routing", false);
    assertNestedTrace(policy.value, traceId, "policy");
    if (routing.present) assertNestedTrace(routing.value, traceId, "routing");
    const providerId = requireString(readDataField(binding, "providerId", true).value, "providerId");
    const modelId = requireString(readDataField(binding, "modelId", true).value, "modelId");
    const normalizedBinding = { providerId, modelId };
    const values: Record<MaterialContextClass, { present: boolean; value: unknown }> = {
      prompt,
      systemPrompt,
      metadata,
      policy,
      routing,
    };
    const entries = REQUIRED_CONTEXT_CLASSES.map((contextClass) => {
      const field = values[contextClass];
      return buildEntry(contextClass, traceId, field.value, field.present);
    });
    const adapterInputDigest = digestOf({
      traceId,
      providerId,
      modelId,
      prompt: prompt.value,
      systemPrompt: systemPrompt.value,
      metadata: metadata.value,
    });
    const unsigned = unsignedManifest(traceId, normalizedBinding, adapterInputDigest, entries);
    return { ok: true, manifest: { ...unsigned, manifestDigest: digestOf(unsigned) } };
  } catch (caught: unknown) {
    const detail = caught instanceof CanonicalizationRejected ? caught.message : "unknown_error";
    return { ok: false, reason: "canonicalization_rejected", detail };
  }
}

/** Validates every manifest field by rebuilding the expected secret-safe form. */
export function validateMaterialContextManifest(
  manifest: unknown,
  request: GatewayExecuteRequest,
  binding: MaterialContextInvocationBinding,
): boolean {
  try {
    const expected = buildMaterialContextManifest(request, binding);
    if (!expected.ok) return false;
    if (canonicalForm(manifest) !== canonicalForm(expected.manifest)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(manifest as object, "manifestDigest");
    return Boolean(
      descriptor &&
        "value" in descriptor &&
        typeof descriptor.value === "string" &&
        DIGEST_PATTERN.test(descriptor.value),
    );
  } catch {
    return false;
  }
}
