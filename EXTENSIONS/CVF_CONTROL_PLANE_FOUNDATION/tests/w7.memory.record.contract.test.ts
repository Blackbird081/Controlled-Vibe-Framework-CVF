import { describe, it, expect } from "vitest";
import {
  W7MemoryRecordContract,
  createW7MemoryRecordContract,
  type W7MemoryRecordRequest,
} from "../src/w7.memory.record.contract";
import { FIXED_BATCH_NOW } from "./helpers/cpf.batch.contract.fixtures";

// ─── W73-T1: W7MemoryRecordContract ──────────────────────────────────────────

const RECORD_NOW = FIXED_BATCH_NOW;

function makeContract(): W7MemoryRecordContract {
  return new W7MemoryRecordContract({ now: () => RECORD_NOW });
}

function makeRequest(overrides: Partial<W7MemoryRecordRequest> = {}): W7MemoryRecordRequest {
  return {
    sourceRef: "src-001",
    candidateId: "cand-abc",
    name: "Governance Cycle Concept",
    domain: "governance",
    content: "This concept covers the governance cycle in detail.",
    ...overrides,
  };
}

// --- factory ---

describe("W7MemoryRecordContract — factory", () => {
  it("createW7MemoryRecordContract returns an instance", () => {
    expect(createW7MemoryRecordContract()).toBeInstanceOf(W7MemoryRecordContract);
  });
});

// --- output shape ---

describe("W7MemoryRecordContract — output shape", () => {
  it("stage is w7_memory_record", () => {
    expect(makeContract().record(makeRequest()).stage).toBe("w7_memory_record");
  });

  it("result has memoryRecordId", () => {
    expect(makeContract().record(makeRequest())).toHaveProperty("memoryRecordId");
  });

  it("result has memoryRecordHash", () => {
    expect(makeContract().record(makeRequest())).toHaveProperty("memoryRecordHash");
  });

  it("recordedAt matches injected timestamp", () => {
    expect(makeContract().record(makeRequest()).recordedAt).toBe(RECORD_NOW);
  });

  it("sourceRef carries through", () => {
    expect(makeContract().record(makeRequest()).sourceRef).toBe("src-001");
  });

  it("candidateId carries through", () => {
    expect(makeContract().record(makeRequest()).candidateId).toBe("cand-abc");
  });

  it("name carries through", () => {
    expect(makeContract().record(makeRequest()).name).toBe("Governance Cycle Concept");
  });

  it("domain carries through", () => {
    expect(makeContract().record(makeRequest()).domain).toBe("governance");
  });

  it("content carries through", () => {
    const req = makeRequest({ content: "custom content value" });
    expect(makeContract().record(req).content).toBe("custom content value");
  });
});

// --- palace vocabulary carry-through ---

describe("W7MemoryRecordContract — palace vocabulary carry-through", () => {
  it("wing carries through when provided", () => {
    const r = makeContract().record(makeRequest({ palaceVocabulary: { wing: "alpha" } }));
    expect(r.wing).toBe("alpha");
  });

  it("hall carries through when provided", () => {
    const r = makeContract().record(makeRequest({ palaceVocabulary: { hall: "main-hall" } }));
    expect(r.hall).toBe("main-hall");
  });

  it("room carries through when provided", () => {
    const r = makeContract().record(makeRequest({ palaceVocabulary: { room: "room-7" } }));
    expect(r.room).toBe("room-7");
  });

  it("drawer carries through when provided", () => {
    const r = makeContract().record(makeRequest({ palaceVocabulary: { drawer: "drawer-3" } }));
    expect(r.drawer).toBe("drawer-3");
  });

  it("closet_summary carries through when provided", () => {
    const r = makeContract().record(makeRequest({ palaceVocabulary: { closet_summary: "summary text" } }));
    expect(r.closet_summary).toBe("summary text");
  });

  it("tunnel_links carries through when provided", () => {
    const r = makeContract().record(makeRequest({ palaceVocabulary: { tunnel_links: ["a", "b"] } }));
    expect(r.tunnel_links).toEqual(["a", "b"]);
  });

  it("contradiction_flag carries through when provided", () => {
    const r = makeContract().record(makeRequest({ palaceVocabulary: { contradiction_flag: true } }));
    expect(r.contradiction_flag).toBe(true);
  });

  it("palace fields absent when palaceVocabulary not provided", () => {
    const r = makeContract().record(makeRequest());
    expect(r.wing).toBeUndefined();
    expect(r.hall).toBeUndefined();
    expect(r.room).toBeUndefined();
    expect(r.drawer).toBeUndefined();
    expect(r.closet_summary).toBeUndefined();
    expect(r.tunnel_links).toBeUndefined();
    expect(r.contradiction_flag).toBeUndefined();
  });
});

// --- determinism ---

describe("W7MemoryRecordContract — determinism", () => {
  it("same input + same timestamp → same memoryRecordHash", () => {
    const req = makeRequest();
    const r1 = makeContract().record(req);
    const r2 = makeContract().record(req);
    expect(r1.memoryRecordHash).toBe(r2.memoryRecordHash);
  });

  it("memoryRecordHash is time-independent", () => {
    const req = makeRequest();
    const c1 = new W7MemoryRecordContract({ now: () => "2026-01-01T00:00:00.000Z" });
    const c2 = new W7MemoryRecordContract({ now: () => "2026-06-01T00:00:00.000Z" });
    expect(c1.record(req).memoryRecordHash).toBe(c2.record(req).memoryRecordHash);
  });

  it("different timestamps → different memoryRecordId", () => {
    const req = makeRequest();
    const c1 = new W7MemoryRecordContract({ now: () => "2026-01-01T00:00:00.000Z" });
    const c2 = new W7MemoryRecordContract({ now: () => "2026-06-01T00:00:00.000Z" });
    expect(c1.record(req).memoryRecordId).not.toBe(c2.record(req).memoryRecordId);
  });

  it("same timestamp → same memoryRecordId", () => {
    const req = makeRequest();
    const r1 = makeContract().record(req);
    const r2 = makeContract().record(req);
    expect(r1.memoryRecordId).toBe(r2.memoryRecordId);
  });

  it("memoryRecordId always differs from memoryRecordHash", () => {
    const r = makeContract().record(makeRequest());
    expect(r.memoryRecordId).not.toBe(r.memoryRecordHash);
  });

  it("different content → different memoryRecordHash", () => {
    const r1 = makeContract().record(makeRequest({ content: "content A" }));
    const r2 = makeContract().record(makeRequest({ content: "content B" }));
    expect(r1.memoryRecordHash).not.toBe(r2.memoryRecordHash);
  });

  it("different domain → different memoryRecordHash", () => {
    const r1 = makeContract().record(makeRequest({ domain: "governance" }));
    const r2 = makeContract().record(makeRequest({ domain: "security" }));
    expect(r1.memoryRecordHash).not.toBe(r2.memoryRecordHash);
  });

  it("different palace vocab → different memoryRecordHash", () => {
    const r1 = makeContract().record(makeRequest({ palaceVocabulary: { wing: "alpha" } }));
    const r2 = makeContract().record(makeRequest({ palaceVocabulary: { wing: "beta" } }));
    expect(r1.memoryRecordHash).not.toBe(r2.memoryRecordHash);
  });

  it("no palace vs with palace → different memoryRecordHash", () => {
    const r1 = makeContract().record(makeRequest());
    const r2 = makeContract().record(makeRequest({ palaceVocabulary: { wing: "alpha" } }));
    expect(r1.memoryRecordHash).not.toBe(r2.memoryRecordHash);
  });
});
