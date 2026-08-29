import { describe, expect, it } from "vitest";
import {
  ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT,
} from "../src/alibaba-free-quota-model-ledger";
import {
  classifyAdapterDestination,
} from "../src/adapter-destination-policy";

describe("classifyAdapterDestination", () => {
  it("permits a relative path without provider authority", () => {
    expect(classifyAdapterDestination("/api/health")).toEqual({
      kind: "permit-non-provider",
    });
  });

  it("permits a relative dot path", () => {
    expect(classifyAdapterDestination("./local")).toEqual({
      kind: "permit-non-provider",
    });
  });

  it("permits a relative parent-dot path", () => {
    expect(classifyAdapterDestination("../local")).toEqual({
      kind: "permit-non-provider",
    });
  });

  it("denies a protocol-relative external hostname as unparseable", () => {
    const decision = classifyAdapterDestination("//attacker.invalid/payload");
    expect(decision.kind).toBe("deny");
    if (decision.kind === "deny") {
      expect(decision.reason).toContain("unparseable request destination");
    }
  });

  it.each([
    ["loopback host", "http://localhost:3000/api/health"],
    ["loopback ip", "http://127.0.0.1:3000/api/health"],
    ["data uri", "data:text/plain,ok"],
    ["blob uri", "blob:https://localhost/test-fixture"],
    ["file uri", "file:///tmp/test-fixture"],
  ])("permits legitimate non-provider traffic: %s", (_label, target) => {
    expect(classifyAdapterDestination(target)).toEqual({ kind: "permit-non-provider" });
  });

  it("permits a subdomain of localhost", () => {
    expect(classifyAdapterDestination("http://foo.localhost:3000/api")).toEqual({
      kind: "permit-non-provider",
    });
  });

  it("classifies a known provider endpoint by hostname", () => {
    expect(classifyAdapterDestination("https://api.openai.com/v1/chat/completions")).toEqual({
      kind: "provider",
      provider: "openai",
    });
  });

  it("covers a gateway endpoint constant that this module never names literally", () => {
    expect(classifyAdapterDestination(ALIBABA_DASHSCOPE_MAINLAND_ENDPOINT)).toEqual({
      kind: "provider",
      provider: "alibaba",
    });
  });

  it("recognises every derived and declared provider hostname", () => {
    const expected = [
      ["https://api.anthropic.com/v1/messages", "claude"],
      ["https://api.deepseek.com/v1/chat/completions", "deepseek"],
      ["https://api.openai.com/v1/chat/completions", "openai"],
      ["https://dashscope-intl.aliyuncs.com/api/v1", "alibaba"],
      ["https://dashscope.aliyuncs.com/api/v1", "alibaba"],
      ["https://generativelanguage.googleapis.com/v1beta/models", "gemini"],
      ["https://openrouter.ai/api/v1/chat/completions", "openrouter"],
    ];
    for (const [endpoint, provider] of expected) {
      expect(classifyAdapterDestination(endpoint)).toEqual({ kind: "provider", provider });
    }
  });

  it("denies an unsupported protocol", () => {
    const decision = classifyAdapterDestination("ftp://example.com/payload");
    expect(decision.kind).toBe("deny");
    if (decision.kind === "deny") {
      expect(decision.reason).toContain("unsupported protocol");
    }
  });

  it("denies an arbitrary unrecognised hostname", () => {
    const decision = classifyAdapterDestination("https://example.com/data");
    expect(decision.kind).toBe("deny");
    if (decision.kind === "deny") {
      expect(decision.reason).toContain("unrecognised egress destination");
    }
  });

  it("denies an external-store hostname exactly like any other unrecognised destination", () => {
    const decision = classifyAdapterDestination(
      "https://balanced-shrew-118656.upstash.io/some/path",
    );
    expect(decision.kind).toBe("deny");
    if (decision.kind === "deny") {
      expect(decision.reason).toContain("unrecognised egress destination");
    }
  });

  it("denies a malformed, unparseable absolute-looking destination", () => {
    const decision = classifyAdapterDestination("https://");
    expect(decision.kind).toBe("deny");
  });

  it("accepts a URL instance directly, not only a string", () => {
    expect(
      classifyAdapterDestination(new URL("https://api.openai.com/v1/chat/completions")),
    ).toEqual({ kind: "provider", provider: "openai" });
  });

  it("classifies destinations without consulting any provider identity", () => {
    expect(classifyAdapterDestination("https://evil.example.net/v1/chat/completions").kind).toBe(
      "deny",
    );
  });
});
