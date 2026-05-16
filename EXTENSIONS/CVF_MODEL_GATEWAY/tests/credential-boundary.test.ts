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
});
