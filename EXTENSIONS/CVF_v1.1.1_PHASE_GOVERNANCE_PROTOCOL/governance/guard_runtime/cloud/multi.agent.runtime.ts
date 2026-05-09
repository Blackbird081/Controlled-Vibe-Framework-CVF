/**
 * Multi-Agent Runtime — Track IV Phase E
 *
 * Manages multiple AI agents operating under CVF governance.
 * Provides:
 *   - Agent registration with capability declarations
 *   - Tenant isolation (each tenant gets own guard engine config)
 *   - Concurrent agent coordination with conflict detection
 *   - Agent session management with TTL
 *   - Cross-agent communication via message bus
 */

import type { CanonicalCVFPhase, CVFPhase, CVFRole, CVFRiskLevel, GuardPipelineResult } from '../guard.runtime.types.js';
import { PHASE_ROLE_MATRIX } from '../guards/phase.gate.guard.js';

function normalizePhaseAlias(phase: CVFPhase): CanonicalCVFPhase {
  return phase === 'DISCOVERY' ? 'INTAKE' : phase;
}

// --- Agent Types ---

export type AgentStatus = 'IDLE' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

export interface AgentDescriptor {
  id: string;
  name: string;
  role: CVFRole;
  capabilities: string[];
  maxRiskLevel: CVFRiskLevel;
  tenantId: string;
  status: AgentStatus;
  registeredAt: string;
  lastActiveAt: string;
  sessionTtlMs: number;
  metadata?: Record<string, unknown>;
}

// --- Tenant Types ---

export interface TenantConfig {
  id: string;
  name: string;
  maxAgents: number;
  allowedRiskLevels: CVFRiskLevel[];
  guardPreset: 'core' | 'full' | 'minimal';
  createdAt: string;
}

// --- Message Bus ---

export type MessageType = 'TASK_ASSIGN' | 'TASK_COMPLETE' | 'CONFLICT' | 'HEARTBEAT' | 'SHUTDOWN';

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string | '*';
  type: MessageType;
  payload: Record<string, unknown>;
  timestamp: string;
}

// --- Conflict Detection ---

export interface ConflictRecord {
  id: string;
  agentIds: string[];
  resource: string;
  detectedAt: string;
  resolved: boolean;
  resolution?: string;
}

export interface GovernedTaskAssignment {
  id: string;
  phase: CVFPhase;
  riskLevel: CVFRiskLevel;
  targetFiles?: string[];
  fileScope?: string[];
  requiresLock?: boolean;
  payload?: Record<string, unknown>;
}

export interface GovernedTaskDecision {
  allowed: boolean;
  reason: string;
  conflictingResources?: string[];
}

// --- Multi-Agent Runtime ---

export class MultiAgentRuntime {
  private agents: Map<string, AgentDescriptor> = new Map();
  private tenants: Map<string, TenantConfig> = new Map();
  private messages: AgentMessage[] = [];
  private conflicts: ConflictRecord[] = [];
  private resourceLocks: Map<string, string> = new Map(); // resource -> agentId

  // --- Tenant Management ---

  createTenant(config: Omit<TenantConfig, 'createdAt'>): TenantConfig {
    if (this.tenants.has(config.id)) {
      throw new Error(`Tenant "${config.id}" already exists.`);
    }
    const tenant: TenantConfig = { ...config, createdAt: new Date().toISOString() };
    this.tenants.set(config.id, tenant);
    return tenant;
  }

  getTenant(tenantId: string): TenantConfig | undefined {
    return this.tenants.get(tenantId);
  }

  getAllTenants(): TenantConfig[] {
    return Array.from(this.tenants.values());
  }

  // --- Agent Management ---

  registerAgent(config: {
    id: string;
    name: string;
    role: CVFRole;
    capabilities: string[];
    maxRiskLevel: CVFRiskLevel;
    tenantId: string;
    sessionTtlMs?: number;
    metadata?: Record<string, unknown>;
  }): AgentDescriptor {
    if (this.agents.has(config.id)) {
      throw new Error(`Agent "${config.id}" is already registered.`);
    }

    const tenant = this.tenants.get(config.tenantId);
    if (!tenant) {
      throw new Error(`Tenant "${config.tenantId}" not found. Register tenant first.`);
    }

    const tenantAgents = this.getAgentsByTenant(config.tenantId);
    if (tenantAgents.length >= tenant.maxAgents) {
      throw new Error(`Tenant "${config.tenantId}" has reached max agent limit (${tenant.maxAgents}).`);
    }

    const now = new Date().toISOString();
    const agent: AgentDescriptor = {
      id: config.id,
      name: config.name,
      role: config.role,
      capabilities: config.capabilities,
      maxRiskLevel: config.maxRiskLevel,
      tenantId: config.tenantId,
      status: 'IDLE',
      registeredAt: now,
      lastActiveAt: now,
      sessionTtlMs: config.sessionTtlMs ?? 3600000,
      metadata: config.metadata,
    };

    this.agents.set(config.id, agent);
    return agent;
  }

  getAgent(agentId: string): AgentDescriptor | undefined {
    return this.agents.get(agentId);
  }

  getAgentsByTenant(tenantId: string): AgentDescriptor[] {
    return Array.from(this.agents.values()).filter((a) => a.tenantId === tenantId);
  }

  getAllAgents(): AgentDescriptor[] {
    return Array.from(this.agents.values());
  }

  getAgentCount(): number {
    return this.agents.size;
  }

  canAssignTask(agentId: string, assignment: GovernedTaskAssignment): GovernedTaskDecision {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { allowed: false, reason: `Agent "${agentId}" not found.` };
    }

    if (agent.status === 'SUSPENDED' || agent.status === 'TERMINATED') {
      return { allowed: false, reason: `Agent "${agentId}" is ${agent.status}.` };
    }

    const tenant = this.tenants.get(agent.tenantId);
    if (!tenant) {
      return { allowed: false, reason: `Tenant "${agent.tenantId}" not found.` };
    }

    const normalizedPhase = normalizePhaseAlias(assignment.phase);
    const allowedRoles = PHASE_ROLE_MATRIX[normalizedPhase] ?? [];
    if (!allowedRoles.includes(agent.role)) {
      return {
        allowed: false,
        reason: `Role "${agent.role}" is not authorized for phase "${normalizedPhase}".`,
      };
    }

    if (!tenant.allowedRiskLevels.includes(assignment.riskLevel)) {
      return {
        allowed: false,
        reason: `Tenant "${tenant.id}" does not allow risk level "${assignment.riskLevel}".`,
      };
    }

    if (this.compareRiskLevels(assignment.riskLevel, agent.maxRiskLevel) > 0) {
      return {
        allowed: false,
        reason: `Agent "${agent.id}" max risk "${agent.maxRiskLevel}" is lower than requested "${assignment.riskLevel}".`,
      };
    }

    const targetFiles = assignment.targetFiles ?? [];
    const assignmentScope = assignment.fileScope ?? [];
    if (targetFiles.length > 0 && assignmentScope.length > 0 && !targetFiles.every((file) => assignmentScope.includes(file))) {
      return {
        allowed: false,
        reason: 'Target files exceed the assignment file scope.',
      };
    }

    const agentScope = this.parseStringArray(agent.metadata?.['fileScope']);
    if (targetFiles.length > 0 && agentScope.length > 0 && !targetFiles.every((file) => agentScope.includes(file))) {
      return {
        allowed: false,
        reason: `Target files exceed the file scope assigned to agent "${agent.id}".`,
      };
    }

    if (assignment.requiresLock && targetFiles.length > 0) {
      const conflictingResources = targetFiles.filter((resource) => {
        const holder = this.resourceLocks.get(resource);
        return holder != null && holder !== agentId;
      });
      if (conflictingResources.length > 0) {
        return {
          allowed: false,
          reason: 'One or more target resources are locked by another agent.',
          conflictingResources,
        };
      }
    }

    return { allowed: true, reason: 'Assignment satisfies phase, risk, and file-boundary checks.' };
  }

  assignTask(agentId: string, assignment: GovernedTaskAssignment): { success: boolean; decision: GovernedTaskDecision } {
    const decision = this.canAssignTask(agentId, assignment);
    if (!decision.allowed) {
      return { success: false, decision };
    }

    const agent = this.agents.get(agentId);
    if (!agent) {
      return {
        success: false,
        decision: { allowed: false, reason: `Agent "${agentId}" not found.` },
      };
    }

    const lockedResources: string[] = [];
    if (assignment.requiresLock) {
      for (const resource of assignment.targetFiles ?? []) {
        if (!this.acquireLock(agentId, resource)) {
          for (const locked of lockedResources) {
            this.releaseLock(agentId, locked);
          }
          return {
            success: false,
            decision: {
              allowed: false,
              reason: `Could not acquire lock for "${resource}".`,
              conflictingResources: [resource],
            },
          };
        }
        lockedResources.push(resource);
      }
    }

    agent.lastActiveAt = new Date().toISOString();
    agent.metadata = {
      ...agent.metadata,
      currentAssignment: {
        id: assignment.id,
        phase: assignment.phase,
        riskLevel: assignment.riskLevel,
        targetFiles: assignment.targetFiles,
        fileScope: assignment.fileScope,
        requiresLock: assignment.requiresLock ?? false,
      },
    };

    this.sendMessage({
      fromAgentId: 'runtime',
      toAgentId: agentId,
      type: 'TASK_ASSIGN',
      payload: {
        assignmentId: assignment.id,
        phase: assignment.phase,
        riskLevel: assignment.riskLevel,
        targetFiles: assignment.targetFiles,
        lockedResources,
      },
    });

    return {
      success: true,
      decision,
    };
  }

  activateAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status === 'TERMINATED') return false;
    agent.status = 'ACTIVE';
    agent.lastActiveAt = new Date().toISOString();
    return true;
  }

  suspendAgent(agentId: string, reason?: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status === 'TERMINATED') return false;
    agent.status = 'SUSPENDED';
    agent.metadata = { ...agent.metadata, suspendReason: reason };
    this.releaseAllLocks(agentId);
    return true;
  }

  terminateAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    agent.status = 'TERMINATED';
    this.releaseAllLocks(agentId);
    return true;
  }

  // --- Resource Locking (Conflict Prevention) ---

  acquireLock(agentId: string, resource: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status !== 'ACTIVE') return false;

    const holder = this.resourceLocks.get(resource);
    if (holder && holder !== agentId) {
      this.recordConflict([agentId, holder], resource);
      return false;
    }

    this.resourceLocks.set(resource, agentId);
    return true;
  }

  releaseLock(agentId: string, resource: string): boolean {
    const holder = this.resourceLocks.get(resource);
    if (holder !== agentId) return false;
    this.resourceLocks.delete(resource);
    return true;
  }

  getLockHolder(resource: string): string | undefined {
    return this.resourceLocks.get(resource);
  }

  getLockedResources(agentId: string): string[] {
    const resources: string[] = [];
    for (const [resource, holder] of this.resourceLocks) {
      if (holder === agentId) resources.push(resource);
    }
    return resources;
  }

  private releaseAllLocks(agentId: string): void {
    for (const [resource, holder] of this.resourceLocks) {
      if (holder === agentId) this.resourceLocks.delete(resource);
    }
  }

  // --- Conflict Detection ---

  private recordConflict(agentIds: string[], resource: string): void {
    this.conflicts.push({
      id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      agentIds,
      resource,
      detectedAt: new Date().toISOString(),
      resolved: false,
    });
  }

  resolveConflict(conflictId: string, resolution: string): boolean {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict || conflict.resolved) return false;
    conflict.resolved = true;
    conflict.resolution = resolution;
    return true;
  }

  getConflicts(includeResolved = false): ConflictRecord[] {
    return includeResolved ? [...this.conflicts] : this.conflicts.filter((c) => !c.resolved);
  }

  // --- Message Bus ---

  sendMessage(msg: Omit<AgentMessage, 'id' | 'timestamp'>): AgentMessage {
    const message: AgentMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(message);
    return message;
  }

  getMessages(agentId: string): AgentMessage[] {
    return this.messages.filter((m) => m.toAgentId === agentId || m.toAgentId === '*');
  }

  getAllMessages(): AgentMessage[] {
    return [...this.messages];
  }

  // --- Session TTL ---

  checkSessionExpiry(): AgentDescriptor[] {
    const now = Date.now();
    const expired: AgentDescriptor[] = [];

    for (const agent of this.agents.values()) {
      if (agent.status === 'TERMINATED') continue;
      const lastActive = new Date(agent.lastActiveAt).getTime();
      if (now - lastActive > agent.sessionTtlMs) {
        agent.status = 'SUSPENDED';
        agent.metadata = { ...agent.metadata, suspendReason: 'session_expired' };
        this.releaseAllLocks(agent.id);
        expired.push(agent);
      }
    }

    return expired;
  }

  // --- Health ---

  getHealthSummary(): {
    totalAgents: number;
    active: number;
    idle: number;
    suspended: number;
    terminated: number;
    tenantCount: number;
    lockedResources: number;
    unresolvedConflicts: number;
  } {
    const agents = Array.from(this.agents.values());
    return {
      totalAgents: agents.length,
      active: agents.filter((a) => a.status === 'ACTIVE').length,
      idle: agents.filter((a) => a.status === 'IDLE').length,
      suspended: agents.filter((a) => a.status === 'SUSPENDED').length,
      terminated: agents.filter((a) => a.status === 'TERMINATED').length,
      tenantCount: this.tenants.size,
      lockedResources: this.resourceLocks.size,
      unresolvedConflicts: this.conflicts.filter((c) => !c.resolved).length,
    };
  }

  private compareRiskLevels(left: CVFRiskLevel, right: CVFRiskLevel): number {
    const order: Record<CVFRiskLevel, number> = {
      R0: 0,
      R1: 1,
      R2: 2,
      R3: 3,
    };
    return order[left] - order[right];
  }

  private parseStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(String);
    }
    if (typeof value === 'string') {
      return value.split(',').map((entry) => entry.trim()).filter(Boolean);
    }
    return [];
  }
}
