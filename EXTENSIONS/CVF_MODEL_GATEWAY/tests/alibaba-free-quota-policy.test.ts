import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ALIBABA_FREE_QUOTA_MODELS, assertAlibabaFreeQuotaUse,
  getAlibabaFreeQuotaStatus, listAlibabaFreeQuotaTestCandidates,
  resolveAlibabaDashScopeEndpoint, ALIBABA_WORKSPACE_DASHSCOPE_ENDPOINT,
} from "../src/alibaba-free-quota-model-ledger";
import { classifyAdapterDestination } from "../src/adapter-destination-policy";

const now = new Date("2026-11-04T08:00:00Z");
describe("operator free-only quota policy (pure local rules, no provider proof)", () => {
  it("projects every visible source row without promoting non-chat model capabilities", () => {
    const source = JSON.parse(readFileSync(new URL("../../../docs/reference/model_gateway/CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.json", import.meta.url), "utf8"));
    expect(ALIBABA_FREE_QUOTA_MODELS.map(m => m.modelId).sort())
      .toEqual(source.models.map(m => m.modelCode).sort());
    for (const entry of ALIBABA_FREE_QUOTA_MODELS) {
      const row = source.models.find(m => m.modelCode === entry.modelId);
      expect(entry.expirationDate).toBe(row.expirationDate);
      expect(entry.freeQuotaRemainingAtCapture).toBe(row.freeQuotaRemaining);
    }
  });
  it("selects only current workspace rows and locks at the new expiry", () => {
    expect(listAlibabaFreeQuotaTestCandidates("text", now).map(m => m.modelId))
      .toEqual(["qwen-flash-character", "qwen-plus-character"]);
    expect(listAlibabaFreeQuotaTestCandidates("embedding", now)[0].modelId).toBe("qwen3.7-text-embedding");
    expect(getAlibabaFreeQuotaStatus("qwen-flash-character", new Date("2027-02-08T16:59:59Z"))).toBe("usable");
    expect(getAlibabaFreeQuotaStatus("qwen-flash-character", new Date("2027-02-08T17:00:00Z"))).toBe("expired");
    expect(getAlibabaFreeQuotaStatus("unlisted-old-model", now)).toBe("unknown");
    expect(getAlibabaFreeQuotaStatus("qwen3.8-max", now)).toBe("expired");
    expect(getAlibabaFreeQuotaStatus("unknown-paid-model", now)).toBe("unknown");
    expect(getAlibabaFreeQuotaStatus("qwen-flash-character", new Date(NaN))).toBe("unknown");
  });
  it("requires free-only quota and the workspace confirmation", () => {
    expect(() => assertAlibabaFreeQuotaUse("qwen3.8-max", {}, now)).toThrow("MODEL_LOCKED");
    const free = { CVF_ALIBABA_FREE_QUOTA_ONLY: "1" };
    expect(() => assertAlibabaFreeQuotaUse("unlisted-old-model", free, now)).toThrow("QUOTA_REFUSED");
    expect(() => assertAlibabaFreeQuotaUse("qwen-flash-character", free, now)).toThrow("SCOPE_UNCONFIRMED");
    expect(() => assertAlibabaFreeQuotaUse("qwen-flash-character", { ...free, CVF_ALIBABA_QUOTA_SCOPE_CONFIRMED: "1" }, now)).not.toThrow();
  });
  it("binds the workspace host exactly, without trusting other MaaS hosts", () => {
    expect(resolveAlibabaDashScopeEndpoint({ ALIBABA_BASE_URL: ALIBABA_WORKSPACE_DASHSCOPE_ENDPOINT.replace("/chat/completions", "/") })).toBe(ALIBABA_WORKSPACE_DASHSCOPE_ENDPOINT);
    expect(classifyAdapterDestination(ALIBABA_WORKSPACE_DASHSCOPE_ENDPOINT)).toEqual({ kind: "provider", provider: "alibaba" });
    expect(classifyAdapterDestination("https://other.ap-southeast-1.maas.aliyuncs.com/api/v1").kind).toBe("deny");
  });
});
