import { describe, expect, it } from "vitest";
import { CredentialBoundary, fingerprintSecret, redactSecret } from "../src/credential-boundary";

describe("CredentialBoundary", () => {
  it("resolves credential metadata without exposing raw secret", () => {
    const boundary = new CredentialBoundary({ DASHSCOPE_API_KEY: "sk-test-secret-value" });

    const metadata = boundary.resolveMetadata({
      providerId: "dashscope",
      keyId: "dashscope-live",
      envNames: ["DASHSCOPE_API_KEY"],
    });

    expect(metadata.available).toBe(true);
    expect(metadata.fingerprint).toHaveLength(12);
    expect(JSON.stringify(metadata)).not.toContain("sk-test-secret-value");
    expect(boundary.resolveSecretForRuntime({
      providerId: "dashscope",
      keyId: "dashscope-live",
      envNames: ["DASHSCOPE_API_KEY"],
    })).toBe("sk-test-secret-value");
  });

  it("redacts and fingerprints deterministically", () => {
    expect(redactSecret("1234567890abcdef")).toBe("1234...cdef");
    expect(fingerprintSecret("same-secret")).toBe(fingerprintSecret("same-secret"));
  });

  it.each([
    ["missing", {}],
    ["empty", { PRIMARY_KEY: "" }],
    ["whitespace", { PRIMARY_KEY: " \t\r\n " }],
  ])("treats %s credentials as unavailable", (_label, env) => {
    const boundary = new CredentialBoundary(env);
    const reference = {
      providerId: "openai",
      keyId: "lpci-openai",
      envNames: ["PRIMARY_KEY"],
    };

    expect(boundary.resolveMetadata(reference)).toEqual({
      providerId: "openai",
      keyId: "lpci-openai",
      available: false,
      source: "env",
      fingerprint: undefined,
      redactedValue: undefined,
    });
    expect(boundary.resolveSecretForRuntime(reference)).toBeUndefined();
  });

  it("skips trim-empty aliases and preserves the original non-empty bytes", () => {
    const original = "  sk-preserve-surrounding-bytes  ";
    const boundary = new CredentialBoundary({
      PRIMARY_KEY: "   ",
      SECONDARY_KEY: original,
    });
    const reference = {
      providerId: "openai",
      keyId: "lpci-openai",
      envNames: ["PRIMARY_KEY", "SECONDARY_KEY"],
    };

    expect(boundary.resolveMetadata(reference).available).toBe(true);
    expect(JSON.stringify(boundary.resolveMetadata(reference))).not.toContain(original);
    expect(boundary.resolveSecretForRuntime(reference)).toBe(original);
  });
});
