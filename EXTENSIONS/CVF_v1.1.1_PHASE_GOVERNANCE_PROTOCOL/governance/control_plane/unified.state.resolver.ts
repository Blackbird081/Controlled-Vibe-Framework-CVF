import { GovernanceControlPlane, DEFAULT_GOVERNANCE_CONTROL_PLANE, createGovernanceControlPlane } from './governance.control.plane.js';

// --- Types ---

export type GovernanceSourcePriority = 1 | 2 | 3 | 4 | 5;

export interface GovernanceSourceRecord {
  priority: GovernanceSourcePriority;
  sourceId: string;
  sourcePath: string;
  governs: string;
  lastSyncedAt?: string;
}

export interface AgentStateBinding {
  agentId: string;
  certificationStatus: string;
  approvedPhases: string[];
  approvedSkills: string[];
  lastSelfUatDate?: string;
  uatStatus?: 'PASS' | 'FAIL' | 'NOT_TESTED';
}

export interface ConformanceState {
  scenarioCount: number;
  criticalAnchors: number;
  coverageGroups: number;
  overallResult: 'PASS' | 'FAIL' | 'NOT_RUN';
  goldenBaseline?: string;
}

export interface UnifiedEcosystemState {
  schemaVersion: string;
  policyVersion: string;
  resolvedAt: string;
  controlPlane: GovernanceControlPlane;
  sources: GovernanceSourceRecord[];
  agents: Map<string, AgentStateBinding>;
  conformance: ConformanceState;
  guards: {
    registrySource: string;
    autoCheck: string;
    syncStatus: 'SYNCED' | 'DRIFT' | 'UNKNOWN';
  };
  ecosystem: {
    doctrineVersion: string;
    operatingModelVersion: string;
    strategyVersion: string;
  };
  driftErrors: string[];
}

export interface StateResolverConfig {
  controlPlane?: GovernanceControlPlane;
  agentBindings?: AgentStateBinding[];
  conformance?: Partial<ConformanceState>;
  guardSyncStatus?: 'SYNCED' | 'DRIFT' | 'UNKNOWN';
  ecosystem?: Partial<UnifiedEcosystemState['ecosystem']>;
}

// --- Constants ---

const CANONICAL_SOURCES: GovernanceSourceRecord[] = [
  {
    priority: 1,
    sourceId: 'doctrine',
    sourcePath: 'ECOSYSTEM/doctrine/',
    governs: 'WHY — principles, positioning, identity',
  },
  {
    priority: 2,
    sourceId: 'governance-contract',
    sourcePath: 'governance/toolkit/05_OPERATION/CVF_ECOSYSTEM_GOVERNANCE_CONTRACT.md',
    governs: 'HOW — governance state, control plane',
  },
  {
    priority: 3,
    sourceId: 'control-plane-runtime',
    sourcePath: 'CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/control_plane/governance.control.plane.ts',
    governs: 'Runtime — pipeline, trace, audit',
  },
  {
    priority: 4,
    sourceId: 'state-registry',
    sourcePath: 'docs/reference/CVF_GOVERNANCE_STATE_REGISTRY.json',
    governs: 'State — agent registry, UAT status',
  },
  {
    priority: 5,
    sourceId: 'extension-local',
    sourcePath: '(extension-specific)',
    governs: 'Local — extension-specific overrides',
  },
];

// --- Unified State Resolver ---

export class UnifiedStateResolver {
  private state: UnifiedEcosystemState;

  constructor(config: StateResolverConfig = {}) {
    const controlPlane = config.controlPlane ?? DEFAULT_GOVERNANCE_CONTROL_PLANE;
    const agents = new Map<string, AgentStateBinding>();

    if (config.agentBindings) {
      for (const binding of config.agentBindings) {
        agents.set(binding.agentId.trim().toUpperCase(), binding);
      }
    }

    this.state = {
      schemaVersion: '2026-03-09',
      policyVersion: controlPlane.policyVersion,
      resolvedAt: new Date().toISOString(),
      controlPlane,
      sources: [...CANONICAL_SOURCES],
      agents,
      conformance: {
        scenarioCount: config.conformance?.scenarioCount ?? 84,
        criticalAnchors: config.conformance?.criticalAnchors ?? 18,
        coverageGroups: config.conformance?.coverageGroups ?? 17,
        overallResult: config.conformance?.overallResult ?? 'PASS',
        goldenBaseline: config.conformance?.goldenBaseline
          ?? 'docs/baselines/CVF_CONFORMANCE_GOLDEN_BASELINE_2026-03-07.json',
      },
      guards: {
        registrySource: 'README.md (Mandatory Guards table)',
        autoCheck: 'governance/compat/check_guard_registry.py',
        syncStatus: config.guardSyncStatus ?? 'UNKNOWN',
      },
      ecosystem: {
        doctrineVersion: config.ecosystem?.doctrineVersion ?? '1.0.0-FROZEN',
        operatingModelVersion: config.ecosystem?.operatingModelVersion ?? '1.0.0',
        strategyVersion: config.ecosystem?.strategyVersion ?? '2026-03-09',
      },
      driftErrors: [],
    };
  }

  resolve(): UnifiedEcosystemState {
    this.state.resolvedAt = new Date().toISOString();
    this.state.driftErrors = this.detectDrift();
    return { ...this.state };
  }

  getControlPlane(): GovernanceControlPlane {
    return this.state.controlPlane;
  }

  getPolicyVersion(): string {
    return this.state.policyVersion;
  }

  getAgent(agentId: string): AgentStateBinding | undefined {
    return this.state.agents.get(agentId.trim().toUpperCase());
  }

  getAgentCount(): number {
    return this.state.agents.size;
  }

  registerAgent(binding: AgentStateBinding): void {
    this.state.agents.set(binding.agentId.trim().toUpperCase(), binding);
  }

  getConformance(): ConformanceState {
    return { ...this.state.conformance };
  }

  getSourceHierarchy(): GovernanceSourceRecord[] {
    return [...this.state.sources].sort((a, b) => a.priority - b.priority);
  }

  isSourceValid(sourceId: string): boolean {
    return this.state.sources.some(s => s.sourceId === sourceId);
  }

  validatePipelineOrder(pipeline: readonly string[]): boolean {
    const canonical = this.state.controlPlane.pipeline;
    if (pipeline.length !== canonical.length) return false;
    return pipeline.every((name, i) => name === canonical[i]);
  }

  validateTraceFields(trace: Record<string, unknown>): string[] {
    const missing: string[] = [];
    for (const field of this.state.controlPlane.requiredTraceFields) {
      if (!trace[field]) {
        missing.push(field);
      }
    }
    return missing;
  }

  detectDrift(): string[] {
    const errors: string[] = [];

    if (this.state.policyVersion !== this.state.controlPlane.policyVersion) {
      errors.push(
        `Policy version mismatch: state=${this.state.policyVersion}, controlPlane=${this.state.controlPlane.policyVersion}`
      );
    }

    if (this.state.guards.syncStatus === 'DRIFT') {
      errors.push('Guard registry is in DRIFT state — run check_guard_registry.py');
    }

    if (this.state.conformance.overallResult === 'FAIL') {
      errors.push('Conformance suite is FAILING — investigate before release');
    }

    if (this.state.ecosystem.doctrineVersion !== '1.0.0-FROZEN') {
      errors.push(
        `Doctrine version should be FROZEN but is: ${this.state.ecosystem.doctrineVersion}`
      );
    }

    return errors;
  }

  isDriftFree(): boolean {
    return this.detectDrift().length === 0;
  }

  toJSON(): Record<string, unknown> {
    const agentsObj: Record<string, AgentStateBinding> = {};
    for (const [key, value] of this.state.agents) {
      agentsObj[key] = value;
    }

    return {
      schemaVersion: this.state.schemaVersion,
      policyVersion: this.state.policyVersion,
      resolvedAt: this.state.resolvedAt,
      controlPlane: {
        policyVersion: this.state.controlPlane.policyVersion,
        auditPhase: this.state.controlPlane.auditPhase,
        pipelineModules: [...this.state.controlPlane.pipeline],
        requiredTraceFields: [...this.state.controlPlane.requiredTraceFields],
      },
      sources: this.state.sources,
      agents: agentsObj,
      conformance: this.state.conformance,
      guards: this.state.guards,
      ecosystem: this.state.ecosystem,
      driftErrors: this.state.driftErrors,
    };
  }
}

export function createUnifiedStateResolver(config: StateResolverConfig = {}): UnifiedStateResolver {
  return new UnifiedStateResolver(config);
}
