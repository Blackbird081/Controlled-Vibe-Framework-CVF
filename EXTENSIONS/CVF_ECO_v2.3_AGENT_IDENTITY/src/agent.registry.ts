import { AgentIdentity, AgentRole, AgentStatus, TrustLevel } from "./types";

let agentCounter = 0;

function nextAgentId(): string {
  agentCounter++;
  return `AGT-${String(agentCounter).padStart(4, "0")}`;
}

export function resetAgentCounter(): void {
  agentCounter = 0;
}

export class AgentRegistry {
  private agents: Map<string, AgentIdentity> = new Map();

  register(opts: {
    name: string;
    role: AgentRole;
    domains?: string[];
    capabilities?: string[];
    metadata?: Record<string, unknown>;
  }): AgentIdentity {
    const id = nextAgentId();
    const agent: AgentIdentity = {
      agentId: id,
      name: opts.name,
      role: opts.role,
      status: "active",
      trustLevel: "basic",
      domains: opts.domains ?? [],
      capabilities: opts.capabilities ?? [],
      registeredAt: Date.now(),
      lastActiveAt: Date.now(),
      metadata: opts.metadata ?? {},
    };
    this.agents.set(id, agent);
    return agent;
  }

  get(agentId: string): AgentIdentity | undefined {
    return this.agents.get(agentId);
  }

  findByName(name: string): AgentIdentity | undefined {
    return [...this.agents.values()].find((a) => a.name === name);
  }

  findByRole(role: AgentRole): AgentIdentity[] {
    return [...this.agents.values()].filter((a) => a.role === role);
  }

  findByDomain(domain: string): AgentIdentity[] {
    return [...this.agents.values()].filter((a) => a.domains.includes(domain));
  }

  updateStatus(agentId: string, status: AgentStatus): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    agent.status = status;
    return true;
  }

  updateTrust(agentId: string, level: TrustLevel): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    agent.trustLevel = level;
    return true;
  }

  touch(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) agent.lastActiveAt = Date.now();
  }

  remove(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  listAll(): AgentIdentity[] {
    return [...this.agents.values()];
  }

  listActive(): AgentIdentity[] {
    return this.listAll().filter((a) => a.status === "active");
  }

  count(): number {
    return this.agents.size;
  }

  clear(): void {
    this.agents.clear();
  }
}
