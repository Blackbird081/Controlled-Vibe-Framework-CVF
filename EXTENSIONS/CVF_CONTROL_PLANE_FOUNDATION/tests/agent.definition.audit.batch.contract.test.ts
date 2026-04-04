import { describe, expect, it } from "vitest";
import {
  AgentDefinitionAuditBatchContract,
  createAgentDefinitionAuditBatchContract,
  type AgentDefinitionAuditBatch,
} from "../src/agent.definition.audit.batch.contract";
import type { AgentDefinitionAudit } from "../src/agent.definition.boundary.contract";

// --- Helpers ---

const FIXED_NOW = "2026-03-30T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeContract() {
  return createAgentDefinitionAuditBatchContract({ now: fixed });
}

function makeAudit(
  totalAgents: number,
  overrides: Partial<AgentDefinitionAudit> = {},
): AgentDefinitionAudit {
  const id = Math.random().toString(36).slice(2);
  return {
    auditId: `audit-id-${id}`,
    auditedAt: FIXED_NOW,
    totalAgents,
    agents: [],
    auditHash: `audit-hash-${id}`,
    ...overrides,
  };
}

// --- empty batch ---

describe("AgentDefinitionAuditBatchContract.batch — empty", () => {
  it("returns zero totalAudits and totalAgentsAcrossAudits for empty array", () => {
    const contract = makeContract();
    const result = contract.batch([]);
    expect(result.totalAudits).toBe(0);
    expect(result.totalAgentsAcrossAudits).toBe(0);
  });

  it("batchId and batchHash are non-empty strings for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([]);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId !== batchHash for empty input", () => {
    const contract = makeContract();
    const result = contract.batch([]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("createdAt is injected from now()", () => {
    const contract = makeContract();
    const result = contract.batch([]);
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});

// --- single audit ---

describe("AgentDefinitionAuditBatchContract.batch — single audit", () => {
  it("totalAudits is 1 for a single audit", () => {
    const contract = makeContract();
    const result = contract.batch([makeAudit(3)]);
    expect(result.totalAudits).toBe(1);
  });

  it("totalAgentsAcrossAudits equals audit.totalAgents for a single audit", () => {
    const contract = makeContract();
    const result = contract.batch([makeAudit(5)]);
    expect(result.totalAgentsAcrossAudits).toBe(5);
  });

  it("batchHash is a non-empty string for a single audit", () => {
    const contract = makeContract();
    const result = contract.batch([makeAudit(2, { auditHash: "hash-single" })]);
    expect(typeof result.batchHash).toBe("string");
    expect(result.batchHash.length).toBeGreaterThan(0);
  });

  it("batchId !== batchHash for a single audit", () => {
    const contract = makeContract();
    const result = contract.batch([makeAudit(1, { auditHash: "hash-single-id" })]);
    expect(result.batchId).not.toBe(result.batchHash);
  });
});

// --- aggregate accuracy ---

describe("AgentDefinitionAuditBatchContract.batch — aggregate accuracy", () => {
  it("totalAudits matches input array length for multiple audits", () => {
    const contract = makeContract();
    const audits = [makeAudit(1), makeAudit(2), makeAudit(3)];
    expect(contract.batch(audits).totalAudits).toBe(3);
  });

  it("totalAgentsAcrossAudits sums all totalAgents correctly", () => {
    const contract = makeContract();
    const audits = [makeAudit(1), makeAudit(4), makeAudit(7)];
    expect(contract.batch(audits).totalAgentsAcrossAudits).toBe(12);
  });

  it("handles audits with 0 totalAgents without error", () => {
    const contract = makeContract();
    const audits = [makeAudit(0), makeAudit(0), makeAudit(3)];
    expect(contract.batch(audits).totalAgentsAcrossAudits).toBe(3);
  });

  it("totalAgentsAcrossAudits is 0 when all audits have 0 agents", () => {
    const contract = makeContract();
    const audits = [makeAudit(0), makeAudit(0)];
    expect(contract.batch(audits).totalAgentsAcrossAudits).toBe(0);
  });

  it("handles large multi-audit batch correctly", () => {
    const contract = makeContract();
    const audits = Array.from({ length: 10 }, (_, i) => makeAudit(i + 1));
    const expected = Array.from({ length: 10 }, (_, i) => i + 1).reduce((s, n) => s + n, 0);
    const result = contract.batch(audits);
    expect(result.totalAudits).toBe(10);
    expect(result.totalAgentsAcrossAudits).toBe(expected);
  });
});

// --- determinism ---

describe("AgentDefinitionAuditBatchContract.batch — determinism", () => {
  it("produces identical batchHash for identical inputs", () => {
    const a1 = makeAudit(2, { auditHash: "hash-A" });
    const a2 = makeAudit(3, { auditHash: "hash-B" });
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch([a1, a2]).batchHash).toBe(c2.batch([a1, a2]).batchHash);
  });

  it("produces identical batchId for identical inputs", () => {
    const a1 = makeAudit(4, { auditHash: "hash-C" });
    const c1 = makeContract();
    const c2 = makeContract();
    expect(c1.batch([a1]).batchId).toBe(c2.batch([a1]).batchId);
  });

  it("batchId !== batchHash for non-empty inputs", () => {
    const contract = makeContract();
    const result = contract.batch([makeAudit(1, { auditHash: "hash-X" })]);
    expect(result.batchId).not.toBe(result.batchHash);
  });

  it("produces different batchHash for different auditHash values", () => {
    const contract = makeContract();
    const a1 = makeAudit(2, { auditHash: "hash-AAA" });
    const a2 = makeAudit(2, { auditHash: "hash-BBB" });
    expect(contract.batch([a1]).batchHash).not.toBe(contract.batch([a2]).batchHash);
  });

  it("produces different batchHash when createdAt differs", () => {
    const a = makeAudit(3, { auditHash: "hash-SAME" });
    const c1 = createAgentDefinitionAuditBatchContract({ now: () => "2026-03-30T00:00:00.000Z" });
    const c2 = createAgentDefinitionAuditBatchContract({ now: () => "2026-03-30T01:00:00.000Z" });
    expect(c1.batch([a]).batchHash).not.toBe(c2.batch([a]).batchHash);
  });
});

// --- factory function ---

describe("createAgentDefinitionAuditBatchContract", () => {
  it("returns an AgentDefinitionAuditBatchContract instance", () => {
    const contract = createAgentDefinitionAuditBatchContract({ now: fixed });
    expect(contract).toBeInstanceOf(AgentDefinitionAuditBatchContract);
  });

  it("works without dependency injection (real now)", () => {
    const contract = createAgentDefinitionAuditBatchContract();
    const result = contract.batch([]);
    expect(result.totalAudits).toBe(0);
    expect(typeof result.createdAt).toBe("string");
    expect(result.createdAt.length).toBeGreaterThan(0);
  });
});

// --- output shape ---

describe("AgentDefinitionAuditBatchContract.batch — output shape", () => {
  it("returns all required fields for a non-empty batch", () => {
    const contract = makeContract();
    const result = contract.batch([makeAudit(2, { auditHash: "hash-shape" })]);
    const keys: Array<keyof AgentDefinitionAuditBatch> = [
      "batchId",
      "batchHash",
      "createdAt",
      "totalAudits",
      "totalAgentsAcrossAudits",
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  it("totalAudits equals input array length", () => {
    const contract = makeContract();
    const inputs = [makeAudit(1), makeAudit(2), makeAudit(3), makeAudit(4)];
    expect(contract.batch(inputs).totalAudits).toBe(4);
  });

  it("totalAgentsAcrossAudits is a number", () => {
    const contract = makeContract();
    const result = contract.batch([makeAudit(5)]);
    expect(typeof result.totalAgentsAcrossAudits).toBe("number");
  });

  it("batchId is a string", () => {
    const contract = makeContract();
    expect(typeof contract.batch([makeAudit(1)]).batchId).toBe("string");
  });

  it("batchHash is a string", () => {
    const contract = makeContract();
    expect(typeof contract.batch([makeAudit(1)]).batchHash).toBe("string");
  });

  it("createdAt comes from injected now()", () => {
    const customNow = "2026-03-30T12:00:00.000Z";
    const contract = createAgentDefinitionAuditBatchContract({ now: () => customNow });
    expect(contract.batch([]).createdAt).toBe(customNow);
  });
});
