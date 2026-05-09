import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type AgentRole = "executor" | "observer" | "orchestrator" | "reviewer" | "coordinator";
export type CapabilityValidationStatus = "WITHIN_SCOPE" | "OUT_OF_SCOPE" | "UNDECLARED_AGENT";
export type ScopeResolutionStatus = "RESOLVED" | "EMPTY_SCOPE" | "UNDECLARED_AGENT";

// Input for registering an agent definition.
export interface AgentDefinitionInput {
  name: string;
  role: AgentRole;
  declaredCapabilities: string[]; // explicit allowlist — agent may only exercise these
  declaredDomains: string[];      // governed operational domains (e.g. "operations", "knowledge", "governance")
}

// Canonical governance record for a registered agent definition.
export interface AgentDefinitionRecord {
  agentId: string;
  registeredAt: string;
  name: string;
  role: AgentRole;
  declaredCapabilities: string[];
  declaredDomains: string[];
  definitionHash: string;
}

// Result of validating whether an agent has a given capability.
export interface CapabilityValidationResult {
  resultId: string;
  evaluatedAt: string;
  agentId: string;
  capability: string;
  status: CapabilityValidationStatus;
  reason: string;
  resultHash: string;
}

// Resolution of the full scope an agent is authorized to exercise.
export interface AgentScopeResolution {
  resolutionId: string;
  resolvedAt: string;
  agentId: string;
  status: ScopeResolutionStatus;
  resolvedCapabilities: string[];
  resolvedDomains: string[];
  reason: string;
  resolutionHash: string;
}

// Governance snapshot of all registered agent definitions.
export interface AgentDefinitionAudit {
  auditId: string;
  auditedAt: string;
  totalAgents: number;
  agents: AgentDefinitionRecord[];
  auditHash: string;
}

export interface AgentDefinitionBoundaryContractDependencies {
  now?: () => string;
}

// --- Helpers ---

function resolveCapabilityValidation(
  capability: string,
  record: AgentDefinitionRecord | undefined,
): { status: CapabilityValidationStatus; reason: string } {
  if (!record) {
    return {
      status: "UNDECLARED_AGENT",
      reason: `Agent is not registered in the Agent Definition boundary; no governance record exists`,
    };
  }
  if (record.declaredCapabilities.includes(capability)) {
    return {
      status: "WITHIN_SCOPE",
      reason: `Capability '${capability}' is within the agent's declared scope for role '${record.role}'`,
    };
  }
  return {
    status: "OUT_OF_SCOPE",
    reason: `Capability '${capability}' is not in the agent's declared capability allowlist; self-extension is not permitted`,
  };
}

function resolveScopeResolution(
  agentId: string,
  record: AgentDefinitionRecord | undefined,
): { status: ScopeResolutionStatus; resolvedCapabilities: string[]; resolvedDomains: string[]; reason: string } {
  if (!record) {
    return {
      status: "UNDECLARED_AGENT",
      resolvedCapabilities: [],
      resolvedDomains: [],
      reason: `Agent '${agentId}' is not registered; scope cannot be resolved`,
    };
  }
  if (record.declaredCapabilities.length === 0) {
    return {
      status: "EMPTY_SCOPE",
      resolvedCapabilities: [],
      resolvedDomains: record.declaredDomains,
      reason: `Agent '${record.name}' has no declared capabilities; governance record exists but scope is empty`,
    };
  }
  return {
    status: "RESOLVED",
    resolvedCapabilities: record.declaredCapabilities,
    resolvedDomains: record.declaredDomains,
    reason: `Scope resolved from governance record: ${record.declaredCapabilities.length} capabilities, ${record.declaredDomains.length} domains`,
  };
}

// --- Contract ---

export class AgentDefinitionBoundaryContract {
  private readonly now: () => string;

  constructor(dependencies: AgentDefinitionBoundaryContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  // Register an agent definition. The returned record is the canonical governance anchor.
  // Capability scope is immutable in this record; any change requires a new registration.
  registerDefinition(input: AgentDefinitionInput): AgentDefinitionRecord {
    const registeredAt = this.now();

    const definitionHash = computeDeterministicHash(
      "w12-t1-cp1-agent-def",
      registeredAt,
      `name:${input.name}`,
      `role:${input.role}`,
      `caps:${[...input.declaredCapabilities].sort().join(",")}`,
      `domains:${[...input.declaredDomains].sort().join(",")}`,
    );

    const agentId = computeDeterministicHash(
      "w12-t1-cp1-agent-id",
      definitionHash,
      registeredAt,
    );

    return {
      agentId,
      registeredAt,
      name: input.name,
      role: input.role,
      declaredCapabilities: [...input.declaredCapabilities],
      declaredDomains: [...input.declaredDomains],
      definitionHash,
    };
  }

  // Validate whether a given capability is within the agent's declared scope.
  // Pass the agent's registered record (callers own the registry lookup).
  validateCapability(
    agentId: string,
    capability: string,
    registered: AgentDefinitionRecord | undefined,
  ): CapabilityValidationResult {
    const evaluatedAt = this.now();
    const { status, reason } = resolveCapabilityValidation(capability, registered);

    const resultHash = computeDeterministicHash(
      "w12-t1-cp1-cap-validation",
      evaluatedAt,
      `agent:${agentId}`,
      `cap:${capability}`,
      `status:${status}`,
    );

    const resultId = computeDeterministicHash(
      "w12-t1-cp1-cap-validation-id",
      resultHash,
      evaluatedAt,
    );

    return {
      resultId,
      evaluatedAt,
      agentId,
      capability,
      status,
      reason,
      resultHash,
    };
  }

  // Resolve the full authorized scope for an agent.
  resolveScope(
    agentId: string,
    registered: AgentDefinitionRecord | undefined,
  ): AgentScopeResolution {
    const resolvedAt = this.now();
    const { status, resolvedCapabilities, resolvedDomains, reason } =
      resolveScopeResolution(agentId, registered);

    const resolutionHash = computeDeterministicHash(
      "w12-t1-cp1-scope-resolution",
      resolvedAt,
      `agent:${agentId}`,
      `status:${status}`,
      `caps:${resolvedCapabilities.sort().join(",")}`,
      `domains:${resolvedDomains.sort().join(",")}`,
    );

    const resolutionId = computeDeterministicHash(
      "w12-t1-cp1-scope-resolution-id",
      resolutionHash,
      resolvedAt,
    );

    return {
      resolutionId,
      resolvedAt,
      agentId,
      status,
      resolvedCapabilities,
      resolvedDomains,
      reason,
      resolutionHash,
    };
  }

  // Generate a governance audit snapshot of all registered definitions.
  auditDefinitions(registered: AgentDefinitionRecord[]): AgentDefinitionAudit {
    const auditedAt = this.now();
    const agents = [...registered];

    const auditHash = computeDeterministicHash(
      "w12-t1-cp1-def-audit",
      auditedAt,
      `count:${agents.length}`,
      ...agents.map((a) => a.definitionHash),
    );

    const auditId = computeDeterministicHash(
      "w12-t1-cp1-def-audit-id",
      auditHash,
      auditedAt,
    );

    return {
      auditId,
      auditedAt,
      totalAgents: agents.length,
      agents,
      auditHash,
    };
  }
}

export function createAgentDefinitionBoundaryContract(
  dependencies?: AgentDefinitionBoundaryContractDependencies,
): AgentDefinitionBoundaryContract {
  return new AgentDefinitionBoundaryContract(dependencies);
}
