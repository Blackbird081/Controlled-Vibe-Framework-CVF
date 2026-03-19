/**
 * CVF Adoption SDK — Track IV Phase C
 *
 * Single unified entry point for downstream projects to adopt CVF governance.
 * Provides a high-level API that wires up guards, engine, pipeline, gateway,
 * conformance, and extension bridge with sensible defaults.
 *
 * Usage:
 *   const cvf = CvfSdk.create();                   // full default setup
 *   const cvf = CvfSdk.create({ guards: 'core' }); // core guards only
 *   const result = cvf.evaluate(context);
 *   const report = cvf.runConformance();
 */

import { GuardRuntimeEngine } from '../guard.runtime.engine.js';
import type { GuardRequestContext, GuardPipelineResult, Guard, GuardAuditEntry } from '../guard.runtime.types.js';

// Phase A.1 guards
import { PhaseGateGuard } from '../guards/phase.gate.guard.js';
import { RiskGateGuard } from '../guards/risk.gate.guard.js';
import { AuthorityGateGuard } from '../guards/authority.gate.guard.js';
import { AiCommitGuard } from '../guards/ai.commit.guard.js';
import { MutationBudgetGuard } from '../guards/mutation.budget.guard.js';
import { FileScopeGuard } from '../guards/file.scope.guard.js';
import { ScopeGuard } from '../guards/scope.guard.js';
import { AuditTrailGuard } from '../guards/audit.trail.guard.js';

// Phase A.2 guards
import { AdrGuard } from '../guards/adr.guard.js';
import { DepthAuditGuard } from '../guards/depth.audit.guard.js';
import { ArchitectureCheckGuard } from '../guards/architecture.check.guard.js';
import { DocumentNamingGuard } from '../guards/document.naming.guard.js';
import { DocumentStorageGuard } from '../guards/document.storage.guard.js';
import { WorkspaceIsolationGuard } from '../guards/workspace.isolation.guard.js';
import { GuardRegistryGuard } from '../guards/guard.registry.guard.js';

// Phase A.3
import { PipelineOrchestrator } from '../pipeline.orchestrator.js';
import type { PipelineInstance } from '../pipeline.orchestrator.js';

// Phase B.1
import { ConformanceRunner } from '../conformance/conformance.runner.js';
import { CVF_CORE_SCENARIOS } from '../conformance/conformance.scenarios.js';
import type { ConformanceReport } from '../conformance/conformance.types.js';

// Phase B.2
import { GuardGateway } from '../entry/guard.gateway.js';
import type { EntryPointType, EntryResponse } from '../entry/entry.types.js';
import type { CVFRole } from '../guard.runtime.types.js';

// Phase B.3
import { ExtensionBridge } from '../wiring/extension.bridge.js';

// --- SDK Config ---

export type GuardPreset = 'core' | 'full' | 'minimal';

export interface CvfSdkConfig {
  guards?: GuardPreset;
  customGuards?: Guard[];
  enableConformance?: boolean;
  enableGateway?: boolean;
  enableExtensionBridge?: boolean;
  strictMode?: boolean;
}

const DEFAULT_CONFIG: Required<CvfSdkConfig> = {
  guards: 'full',
  customGuards: [],
  enableConformance: true,
  enableGateway: true,
  enableExtensionBridge: true,
  strictMode: true,
};

// --- SDK ---

export class CvfSdk {
  readonly engine: GuardRuntimeEngine;
  readonly pipeline: PipelineOrchestrator;
  readonly conformance: ConformanceRunner | null;
  readonly gateway: GuardGateway | null;
  readonly bridge: ExtensionBridge | null;
  readonly config: Required<CvfSdkConfig>;

  private constructor(config: Required<CvfSdkConfig>) {
    this.config = config;

    // Engine
    this.engine = new GuardRuntimeEngine({ strictMode: config.strictMode });
    this.registerGuards(config.guards, config.customGuards);

    // Pipeline
    this.pipeline = new PipelineOrchestrator(this.engine);

    // Conformance
    if (config.enableConformance) {
      this.conformance = new ConformanceRunner(this.engine);
      this.conformance.loadScenarios(CVF_CORE_SCENARIOS);
    } else {
      this.conformance = null;
    }

    // Gateway
    this.gateway = config.enableGateway ? new GuardGateway(this.engine) : null;

    // Bridge
    this.bridge = config.enableExtensionBridge ? new ExtensionBridge() : null;
  }

  // --- Factory ---

  static create(config?: CvfSdkConfig): CvfSdk {
    return new CvfSdk({ ...DEFAULT_CONFIG, ...config });
  }

  // --- Core API ---

  evaluate(context: GuardRequestContext): GuardPipelineResult {
    return this.engine.evaluate(context);
  }

  processEntry(entryPoint: EntryPointType, rawInput: Record<string, unknown>): EntryResponse {
    if (!this.gateway) {
      throw new Error('Gateway is not enabled. Set enableGateway: true in config.');
    }
    return this.gateway.process(entryPoint, rawInput);
  }

  runConformance(): ConformanceReport {
    if (!this.conformance) {
      throw new Error('Conformance is not enabled. Set enableConformance: true in config.');
    }
    return this.conformance.runAll();
  }

  // --- Pipeline Shortcuts ---

  createPipeline(config: {
    id: string;
    intent: string;
    riskLevel: 'R0' | 'R1' | 'R2' | 'R3';
    role: CVFRole;
    agentId?: string;
  }): PipelineInstance {
    return this.pipeline.createPipeline(config);
  }

  // --- Audit ---

  getAuditLog(): readonly GuardAuditEntry[] {
    return this.engine.getAuditLog();
  }

  getGuardCount(): number {
    return this.engine.getRegisteredGuards().length;
  }

  getVersion(): string {
    return '4.0.0-runtime';
  }

  // --- Internals ---

  private registerGuards(preset: GuardPreset, custom: Guard[]): void {
    if (preset === 'core' || preset === 'full') {
      this.engine.registerGuard(new PhaseGateGuard());
      this.engine.registerGuard(new RiskGateGuard());
      this.engine.registerGuard(new AuthorityGateGuard());
      this.engine.registerGuard(new AiCommitGuard());
      this.engine.registerGuard(new MutationBudgetGuard());
      this.engine.registerGuard(new FileScopeGuard());
      this.engine.registerGuard(new ScopeGuard());
      this.engine.registerGuard(new AuditTrailGuard());
    }

    if (preset === 'full') {
      this.engine.registerGuard(new AdrGuard());
      this.engine.registerGuard(new DepthAuditGuard());
      this.engine.registerGuard(new ArchitectureCheckGuard());
      this.engine.registerGuard(new DocumentNamingGuard());
      this.engine.registerGuard(new DocumentStorageGuard());
      this.engine.registerGuard(new WorkspaceIsolationGuard());
      this.engine.registerGuard(new GuardRegistryGuard());
    }

    for (const guard of custom) {
      this.engine.registerGuard(guard);
    }
  }
}
