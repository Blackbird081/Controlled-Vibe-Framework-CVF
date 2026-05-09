import { describe, expect, it } from "vitest";
import {
  AgentDefinitionBoundaryContract,
  createAgentDefinitionBoundaryContract,
  type AgentDefinitionInput,
  type AgentDefinitionRecord,
} from "../src/agent.definition.boundary.contract";

// --- Helpers ---

const FIXED_NOW = "2026-03-29T00:00:00.000Z";
const fixed = () => FIXED_NOW;

function makeContract() {
  return createAgentDefinitionBoundaryContract({ now: fixed });
}

function makeInput(overrides: Partial<AgentDefinitionInput> = {}): AgentDefinitionInput {
  return {
    name: "Test-Agent",
    role: "executor",
    declaredCapabilities: ["read:knowledge", "write:output"],
    declaredDomains: ["operations"],
    ...overrides,
  };
}

// --- registerDefinition ---

describe("AgentDefinitionBoundaryContract.registerDefinition", () => {
  it("returns a record with a stable agentId and definitionHash", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    expect(record.agentId).toBeTruthy();
    expect(record.definitionHash).toBeTruthy();
    expect(record.registeredAt).toBe(FIXED_NOW);
  });

  it("produces deterministic IDs for identical inputs", () => {
    const contract = makeContract();
    const r1 = contract.registerDefinition(makeInput());
    const r2 = contract.registerDefinition(makeInput());
    expect(r1.agentId).toBe(r2.agentId);
    expect(r1.definitionHash).toBe(r2.definitionHash);
  });

  it("produces different IDs for different names", () => {
    const contract = makeContract();
    const r1 = contract.registerDefinition(makeInput({ name: "Agent-A" }));
    const r2 = contract.registerDefinition(makeInput({ name: "Agent-B" }));
    expect(r1.agentId).not.toBe(r2.agentId);
  });

  it("produces different IDs for different roles", () => {
    const contract = makeContract();
    const r1 = contract.registerDefinition(makeInput({ role: "executor" }));
    const r2 = contract.registerDefinition(makeInput({ role: "orchestrator" }));
    expect(r1.definitionHash).not.toBe(r2.definitionHash);
  });

  it("stores declared capabilities immutably", () => {
    const contract = makeContract();
    const caps = ["read:knowledge", "write:output"];
    const record = contract.registerDefinition(makeInput({ declaredCapabilities: caps }));
    caps.push("write:secrets"); // mutate original
    expect(record.declaredCapabilities).not.toContain("write:secrets");
  });

  it("stores declared domains immutably", () => {
    const contract = makeContract();
    const domains = ["operations"];
    const record = contract.registerDefinition(makeInput({ declaredDomains: domains }));
    domains.push("governance");
    expect(record.declaredDomains).not.toContain("governance");
  });

  it("supports all valid roles", () => {
    const contract = makeContract();
    const roles = ["executor", "observer", "orchestrator", "reviewer", "coordinator"] as const;
    for (const role of roles) {
      const record = contract.registerDefinition(makeInput({ role }));
      expect(record.role).toBe(role);
    }
  });

  it("agentId differs from definitionHash", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    expect(record.agentId).not.toBe(record.definitionHash);
  });

  it("uses injected now()", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    expect(record.registeredAt).toBe(FIXED_NOW);
  });

  it("defaults now() to current time when not injected", () => {
    const contract = new AgentDefinitionBoundaryContract();
    const before = new Date().toISOString();
    const record = contract.registerDefinition(makeInput());
    const after = new Date().toISOString();
    expect(record.registeredAt >= before).toBe(true);
    expect(record.registeredAt <= after).toBe(true);
  });
});

// --- validateCapability ---

describe("AgentDefinitionBoundaryContract.validateCapability", () => {
  it("returns WITHIN_SCOPE for a declared capability", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const result = contract.validateCapability(record.agentId, "read:knowledge", record);
    expect(result.status).toBe("WITHIN_SCOPE");
  });

  it("returns OUT_OF_SCOPE for an undeclared capability", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const result = contract.validateCapability(record.agentId, "delete:all", record);
    expect(result.status).toBe("OUT_OF_SCOPE");
  });

  it("returns UNDECLARED_AGENT when record is undefined", () => {
    const contract = makeContract();
    const result = contract.validateCapability("ghost-id", "read:knowledge", undefined);
    expect(result.status).toBe("UNDECLARED_AGENT");
  });

  it("result has stable resultId and resultHash", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const r1 = contract.validateCapability(record.agentId, "read:knowledge", record);
    const r2 = contract.validateCapability(record.agentId, "read:knowledge", record);
    expect(r1.resultId).toBe(r2.resultId);
    expect(r1.resultHash).toBe(r2.resultHash);
  });

  it("resultId differs from resultHash", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const result = contract.validateCapability(record.agentId, "read:knowledge", record);
    expect(result.resultId).not.toBe(result.resultHash);
  });

  it("different capabilities produce different hashes", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const r1 = contract.validateCapability(record.agentId, "read:knowledge", record);
    const r2 = contract.validateCapability(record.agentId, "write:output", record);
    expect(r1.resultHash).not.toBe(r2.resultHash);
  });

  it("UNDECLARED_AGENT result echoes the requested agentId", () => {
    const contract = makeContract();
    const result = contract.validateCapability("ghost-id", "some:cap", undefined);
    expect(result.agentId).toBe("ghost-id");
  });

  it("reason mentions self-extension for OUT_OF_SCOPE", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const result = contract.validateCapability(record.agentId, "admin:override", record);
    expect(result.reason).toContain("self-extension");
  });

  it("uses injected now()", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const result = contract.validateCapability(record.agentId, "read:knowledge", record);
    expect(result.evaluatedAt).toBe(FIXED_NOW);
  });
});

// --- resolveScope ---

describe("AgentDefinitionBoundaryContract.resolveScope", () => {
  it("returns RESOLVED with capabilities for a registered agent", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const resolution = contract.resolveScope(record.agentId, record);
    expect(resolution.status).toBe("RESOLVED");
    expect(resolution.resolvedCapabilities).toEqual(
      expect.arrayContaining(["read:knowledge", "write:output"]),
    );
  });

  it("returns EMPTY_SCOPE for an agent with no declared capabilities", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput({ declaredCapabilities: [] }));
    const resolution = contract.resolveScope(record.agentId, record);
    expect(resolution.status).toBe("EMPTY_SCOPE");
    expect(resolution.resolvedCapabilities).toHaveLength(0);
  });

  it("returns UNDECLARED_AGENT when record is undefined", () => {
    const contract = makeContract();
    const resolution = contract.resolveScope("ghost-id", undefined);
    expect(resolution.status).toBe("UNDECLARED_AGENT");
    expect(resolution.resolvedCapabilities).toHaveLength(0);
  });

  it("resolution has stable resolutionId and resolutionHash", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const r1 = contract.resolveScope(record.agentId, record);
    const r2 = contract.resolveScope(record.agentId, record);
    expect(r1.resolutionId).toBe(r2.resolutionId);
    expect(r1.resolutionHash).toBe(r2.resolutionHash);
  });

  it("resolutionId differs from resolutionHash", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const resolution = contract.resolveScope(record.agentId, record);
    expect(resolution.resolutionId).not.toBe(resolution.resolutionHash);
  });

  it("EMPTY_SCOPE still returns resolved domains", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(
      makeInput({ declaredCapabilities: [], declaredDomains: ["governance"] }),
    );
    const resolution = contract.resolveScope(record.agentId, record);
    expect(resolution.status).toBe("EMPTY_SCOPE");
    expect(resolution.resolvedDomains).toContain("governance");
  });

  it("uses injected now()", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const resolution = contract.resolveScope(record.agentId, record);
    expect(resolution.resolvedAt).toBe(FIXED_NOW);
  });

  it("different agents produce different resolution hashes", () => {
    const contract = makeContract();
    const r1 = contract.registerDefinition(makeInput({ name: "Agent-A", declaredCapabilities: ["read:k"] }));
    const r2 = contract.registerDefinition(makeInput({ name: "Agent-B", declaredCapabilities: ["write:o"] }));
    const s1 = contract.resolveScope(r1.agentId, r1);
    const s2 = contract.resolveScope(r2.agentId, r2);
    expect(s1.resolutionHash).not.toBe(s2.resolutionHash);
  });
});

// --- auditDefinitions ---

describe("AgentDefinitionBoundaryContract.auditDefinitions", () => {
  it("returns an audit with correct agent count", () => {
    const contract = makeContract();
    const r1 = contract.registerDefinition(makeInput({ name: "A1" }));
    const r2 = contract.registerDefinition(makeInput({ name: "A2" }));
    const audit = contract.auditDefinitions([r1, r2]);
    expect(audit.totalAgents).toBe(2);
    expect(audit.agents).toHaveLength(2);
  });

  it("returns an audit with zero agents for empty registry", () => {
    const contract = makeContract();
    const audit = contract.auditDefinitions([]);
    expect(audit.totalAgents).toBe(0);
    expect(audit.agents).toHaveLength(0);
  });

  it("audit has stable auditId and auditHash for same inputs", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const a1 = contract.auditDefinitions([record]);
    const a2 = contract.auditDefinitions([record]);
    expect(a1.auditId).toBe(a2.auditId);
    expect(a1.auditHash).toBe(a2.auditHash);
  });

  it("auditId differs from auditHash", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const audit = contract.auditDefinitions([record]);
    expect(audit.auditId).not.toBe(audit.auditHash);
  });

  it("different agent registries produce different audit hashes", () => {
    const contract = makeContract();
    const r1 = contract.registerDefinition(makeInput({ name: "A1" }));
    const r2 = contract.registerDefinition(makeInput({ name: "A2" }));
    const a1 = contract.auditDefinitions([r1]);
    const a2 = contract.auditDefinitions([r2]);
    expect(a1.auditHash).not.toBe(a2.auditHash);
  });

  it("uses injected now()", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const audit = contract.auditDefinitions([record]);
    expect(audit.auditedAt).toBe(FIXED_NOW);
  });

  it("audit includes full agent records", () => {
    const contract = makeContract();
    const record = contract.registerDefinition(makeInput());
    const audit = contract.auditDefinitions([record]);
    expect(audit.agents[0].agentId).toBe(record.agentId);
    expect(audit.agents[0].name).toBe(record.name);
  });
});

// --- factory ---

describe("createAgentDefinitionBoundaryContract", () => {
  it("returns an AgentDefinitionBoundaryContract instance", () => {
    const contract = createAgentDefinitionBoundaryContract({ now: fixed });
    expect(contract).toBeInstanceOf(AgentDefinitionBoundaryContract);
  });

  it("works without dependencies argument", () => {
    const contract = createAgentDefinitionBoundaryContract();
    const record = contract.registerDefinition(makeInput());
    expect(record.agentId).toBeTruthy();
  });
});
