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
import type { PipelineArtifactType, PipelineInstance } from '../pipeline.orchestrator.js';

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
import type { CrossExtensionWorkflow, WorkflowStep, WorkflowStepResult } from '../wiring/extension.bridge.js';

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

export interface ReferenceGovernedLoopOptions {
  workflowId?: string;
  pipelineId?: string;
  intent: string;
  riskLevel?: 'R0' | 'R1' | 'R2' | 'R3';
  role?: CVFRole;
  agentId?: string;
  action?: string;
  fileScope?: string[];
  targetFiles?: string[];
  requireApproval?: boolean;
  reviewerId?: string;
  reviewerRole?: CVFRole;
  reviewerComment?: string;
  aiCommit?: {
    commitId: string;
    agentId: string;
    timestamp: number;
    description?: string;
  };
  skillId?: string;
}

export interface ReferenceGovernedLoopResult {
  success: boolean;
  workflowId: string;
  pipelineId: string;
  workflowStatus?: CrossExtensionWorkflow['status'];
  pipelineStatus?: PipelineInstance['status'];
  guardDecision?: GuardPipelineResult['finalDecision'];
  checkpointId?: string;
  approvalCheckpointId?: string;
  freezeReceipt?: unknown;
  workflow?: CrossExtensionWorkflow;
  pipeline?: PipelineInstance;
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
    this.bootstrapExtensionBridge();
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
    metadata?: Record<string, unknown>;
  }): PipelineInstance {
    return this.pipeline.createPipeline(config);
  }

  async runReferenceGovernedLoop(options: ReferenceGovernedLoopOptions): Promise<ReferenceGovernedLoopResult> {
    if (!this.bridge) {
      throw new Error('Extension bridge is not enabled. Set enableExtensionBridge: true in config.');
    }

    const workflowId = options.workflowId ?? `reference-loop-${Date.now()}`;
    const pipelineId = options.pipelineId ?? `${workflowId}-pipeline`;
    const riskLevel = options.riskLevel ?? 'R1';
    const requireApproval = options.requireApproval ?? (riskLevel === 'R2' || riskLevel === 'R3');
    const workflow = this.bridge.createWorkflow({
      id: workflowId,
      name: `Reference governed loop: ${options.intent}`,
      steps: this.buildReferenceGovernedLoopSteps({
        ...options,
        workflowId,
        pipelineId,
        riskLevel,
        requireApproval,
      }),
    });

    const result = await this.bridge.executeWorkflow(workflow.id);
    const pipeline = this.pipeline.getPipeline(pipelineId);
    const completedSteps = result.workflow?.steps ? [...result.workflow.steps].reverse() : [];
    const checkpointStep = completedSteps.find((step) => step.action === 'checkpoint' && step.status === 'COMPLETED');
    const approvalStep = completedSteps.find((step) => step.action === 'pipeline_approve_checkpoint' && step.status === 'COMPLETED');
    const guardStep = result.workflow?.steps.find((step) => step.action === 'guard_check');

    return {
      success: result.success,
      workflowId,
      pipelineId,
      workflowStatus: result.workflow?.status,
      pipelineStatus: pipeline?.status,
      guardDecision: guardStep?.guardResult?.finalDecision,
      checkpointId: typeof checkpointStep?.output?.['checkpointId'] === 'string' ? checkpointStep.output['checkpointId'] : undefined,
      approvalCheckpointId: typeof approvalStep?.output?.['checkpointId'] === 'string' ? approvalStep.output['checkpointId'] : undefined,
      freezeReceipt: result.workflow?.metadata?.['freezeReceipt'],
      workflow: result.workflow,
      pipeline,
    };
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

  private bootstrapExtensionBridge(): void {
    if (!this.bridge) return;

    this.bridge.registerExtension({
      id: 'v1.1.1',
      name: 'Phase Governance',
      version: '1.1.1',
      capabilities: ['guard_runtime', 'pipeline_orchestration', 'entry_gateway'],
      dependencies: [],
    });
    this.bridge.registerExtension({
      id: 'v3.0',
      name: 'Core Git',
      version: '3.0',
      capabilities: ['skill_lifecycle', 'artifact_validation'],
      dependencies: [],
    });
    this.bridge.registerExtension({
      id: 'v1.9',
      name: 'Deterministic Reproducibility',
      version: '1.9',
      capabilities: ['durable_execution', 'checkpoint_receipts'],
      dependencies: ['v3.0', 'v1.1.1'],
    });

    this.bridge.registerActionHandler('v1.1.1', 'guard_check', ({ workflow, step }): WorkflowStepResult => {
      const input = step.input ?? {};
      const guardResult = this.runGuardCheck(input);

      if (guardResult.finalDecision !== 'ALLOW') {
        return {
          status: 'FAILED',
          guardResult,
          output: {
            decision: guardResult.finalDecision,
            blockedBy: guardResult.blockedBy,
            escalatedBy: guardResult.escalatedBy,
          },
          error: `Guard decision is ${guardResult.finalDecision}.`,
          evidence: {
            runtime: 'guard_runtime',
            requestId: guardResult.requestId,
          },
        };
      }

      workflow.metadata = {
        ...workflow.metadata,
        lastGuardRequestId: guardResult.requestId,
        lastGuardDecision: guardResult.finalDecision,
      };

      return {
        status: 'COMPLETED',
        guardResult,
        output: {
          decision: guardResult.finalDecision,
          requestId: guardResult.requestId,
        },
        evidence: {
          runtime: 'guard_runtime',
          guardCount: guardResult.results.length,
        },
      };
    });

    this.bridge.registerActionHandler('v1.1.1', 'pipeline_create', ({ workflow, step }): WorkflowStepResult => {
      const input = step.input ?? {};
      const pipelineId = String(input['pipelineId'] ?? `${workflow.id}-pipeline`);
      const pipeline = this.pipeline.createPipeline({
        id: pipelineId,
        intent: String(input['intent'] ?? workflow.name),
        riskLevel: this.parseRiskLevel(input['riskLevel'] ?? 'R1'),
        role: this.parseRole(input['role'] ?? 'HUMAN'),
        agentId: input['agentId'] ? String(input['agentId']) : undefined,
        metadata: {
          controlMode: 'governed',
          workflowId: workflow.id,
          sourceStepId: step.id,
          ...this.parseRecord(input['metadata']),
        },
      });

      workflow.metadata = {
        ...workflow.metadata,
        linkedPipelineId: pipeline.id,
      };

      return {
        status: 'COMPLETED',
        output: {
          pipelineId: pipeline.id,
          status: pipeline.status,
        },
        evidence: {
          runtime: 'pipeline_orchestrator',
          createdAt: pipeline.createdAt,
        },
      };
    });

    this.bridge.registerActionHandler('v1.1.1', 'pipeline_record_artifact', ({ workflow, step }): WorkflowStepResult => {
      const input = step.input ?? {};
      const pipeline = this.requireLinkedPipeline(workflow, input);
      const type = String(input['type'] ?? '').toUpperCase() as PipelineArtifactType;

      if (!['INTENT', 'PLAN', 'EXECUTION', 'REVIEW', 'FREEZE'].includes(type)) {
        return {
          status: 'FAILED',
          error: `Invalid pipeline artifact type "${input['type']}".`,
          output: {
            pipelineId: pipeline.id,
          },
        };
      }

      const artifact = this.pipeline.recordArtifact(pipeline.id, {
        type,
        details: this.parseRecord(input['details']),
        id: input['artifactId'] ? String(input['artifactId']) : undefined,
      });

      if (!artifact) {
        return {
          status: 'FAILED',
          error: `Failed to record ${type} artifact for pipeline "${pipeline.id}".`,
          output: {
            pipelineId: pipeline.id,
          },
        };
      }

      return {
        status: 'COMPLETED',
        output: {
          pipelineId: pipeline.id,
          artifactId: artifact.id,
          artifactType: artifact.type,
        },
        evidence: {
          runtime: 'pipeline_orchestrator',
          recordedAt: artifact.recordedAt,
        },
      };
    });

    this.bridge.registerActionHandler('v1.1.1', 'pipeline_approve_checkpoint', ({ workflow, step }): WorkflowStepResult => {
      const input = step.input ?? {};
      const pipeline = this.requireLinkedPipeline(workflow, input);
      const pending = this.pipeline.getPendingApprovals(pipeline.id);
      const checkpointId = String(input['checkpointId'] ?? pending[0]?.id ?? '');

      if (!checkpointId) {
        return {
          status: 'FAILED',
          error: `Pipeline "${pipeline.id}" has no pending approval checkpoint to approve.`,
          output: {
            pipelineId: pipeline.id,
          },
        };
      }

      const approved = this.pipeline.approveCheckpoint(pipeline.id, checkpointId, {
        id: String(input['reviewerId'] ?? 'governor'),
        role: this.parseRole(input['reviewerRole'] ?? 'GOVERNOR'),
        comment: input['comment'] ? String(input['comment']) : undefined,
      });

      if (!approved) {
        return {
          status: 'FAILED',
          error: `Approval checkpoint "${checkpointId}" could not be approved.`,
          output: {
            pipelineId: pipeline.id,
            checkpointId,
          },
        };
      }

      return {
        status: 'COMPLETED',
        output: {
          pipelineId: pipeline.id,
          checkpointId: approved.id,
          approvalStatus: approved.status,
        },
        evidence: {
          runtime: 'pipeline_orchestrator',
          reviewedAt: approved.reviewedAt,
          reviewerId: approved.reviewerId,
        },
      };
    });

    this.bridge.registerActionHandler('v1.1.1', 'pipeline_advance', ({ workflow, step }): WorkflowStepResult => {
      const input = step.input ?? {};
      const pipeline = this.requireLinkedPipeline(workflow, input);
      const advanceCount = Math.max(1, Number(input['advanceCount'] ?? 1));

      let lastGuardResult: GuardPipelineResult | undefined;
      for (let i = 0; i < advanceCount; i++) {
        const advanced = this.pipeline.advancePhase(pipeline.id);
        if (!advanced.success) {
          const pendingApproval = this.pipeline.getPendingApprovals(pipeline.id)[0];
          if (advanced.error?.includes('waiting for approval') && pendingApproval) {
            return {
              status: 'SKIPPED',
              output: {
                pipelineId: pipeline.id,
                status: this.pipeline.getPipeline(pipeline.id)?.status,
                pendingApprovalId: pendingApproval.id,
                pendingApprovalPhase: pendingApproval.phase,
              },
              evidence: {
                runtime: 'pipeline_orchestrator',
                pendingApprovalReason: pendingApproval.reason,
              },
            };
          }

          return {
            status: 'FAILED',
            error: advanced.error ?? 'Pipeline advance failed.',
            guardResult: advanced.guardResult,
            output: {
              pipelineId: pipeline.id,
              attemptedAdvances: i + 1,
            },
            evidence: {
              runtime: 'pipeline_orchestrator',
              status: this.pipeline.getPipeline(pipeline.id)?.status,
            },
          };
        }
        lastGuardResult = advanced.guardResult;
      }

      const updated = this.pipeline.getPipeline(pipeline.id)!;
      return {
        status: 'COMPLETED',
        guardResult: lastGuardResult,
        output: {
          pipelineId: pipeline.id,
          status: updated.status,
          phaseHistoryLength: updated.phaseHistory.length,
        },
        evidence: {
          runtime: 'pipeline_orchestrator',
          eventCount: updated.events.length,
        },
      };
    });

    this.bridge.registerActionHandler('v1.1.1', 'pipeline_complete', ({ workflow, step }): WorkflowStepResult => {
      const pipeline = this.requireLinkedPipeline(workflow, step.input ?? {});
      const success = this.pipeline.completePipeline(pipeline.id);
      const updated = this.pipeline.getPipeline(pipeline.id);

      if (!success || !updated) {
        return {
          status: 'FAILED',
          error: `Pipeline "${pipeline.id}" could not be completed. Ensure it reached FREEZE first.`,
          output: {
            pipelineId: pipeline.id,
          },
        };
      }

      return {
        status: 'COMPLETED',
        output: {
          pipelineId: updated.id,
          status: updated.status,
        },
        evidence: {
          runtime: 'pipeline_orchestrator',
          completedAt: updated.updatedAt,
        },
      };
    });

    this.bridge.registerActionHandler('v3.0', 'skill_validate', ({ workflow, step }): WorkflowStepResult => {
      const input = step.input ?? {};
      const pipeline = this.requireLinkedPipeline(workflow, input);
      const pipelineState = this.pipeline.getPipeline(pipeline.id);
      const declaredSkill = String(input['skill'] ?? input['skillId'] ?? '').trim();

      if (!declaredSkill) {
        return {
          status: 'FAILED',
          error: 'Skill validation requires `skill` or `skillId` in step input.',
          output: {
            pipelineId: pipeline.id,
          },
        };
      }

      if (!pipelineState || (pipelineState.status !== 'FREEZE' && pipelineState.status !== 'COMPLETED')) {
        return {
          status: 'FAILED',
          error: `Pipeline "${pipeline.id}" must be at FREEZE or COMPLETED before skill validation.`,
          output: {
            pipelineId: pipeline.id,
            skill: declaredSkill,
          },
          evidence: {
            runtime: 'core_git_reference',
            pipelineStatus: pipelineState?.status ?? 'MISSING',
          },
        };
      }

      return {
        status: 'COMPLETED',
        output: {
          skill: declaredSkill,
          validated: true,
          pipelineId: pipeline.id,
        },
        evidence: {
          runtime: 'core_git_reference',
          pipelineStatus: pipelineState.status,
          priorCompletedSteps: workflow.steps.filter((candidate) => candidate.status === 'COMPLETED').length,
        },
      };
    });

    this.bridge.registerActionHandler('v1.9', 'checkpoint', ({ workflow, step }): WorkflowStepResult => {
      const pipeline = this.requireLinkedPipeline(workflow, step.input ?? {});
      const pipelineState = this.pipeline.getPipeline(pipeline.id);

      if (!pipelineState) {
        return {
          status: 'FAILED',
          error: `Pipeline "${pipeline.id}" not found for checkpoint.`,
          output: {
            pipelineId: pipeline.id,
          },
        };
      }

      const checkpointId = `${workflow.id}:${pipeline.id}:${step.id}`;
      return {
        status: 'COMPLETED',
        output: {
          checkpointId,
          pipelineId: pipeline.id,
          pipelineStatus: pipelineState.status,
        },
        evidence: {
          runtime: 'deterministic_reference',
          phaseHistoryLength: pipelineState.phaseHistory.length,
          eventCount: pipelineState.events.length,
          linkedGuardRequestId: workflow.metadata?.['lastGuardRequestId'],
        },
      };
    });
  }

  private buildReferenceGovernedLoopSteps(
    options: ReferenceGovernedLoopOptions & {
      workflowId: string;
      pipelineId: string;
      riskLevel: 'R0' | 'R1' | 'R2' | 'R3';
      requireApproval: boolean;
    },
  ): Array<{ extensionId: string; action: string; input?: Record<string, unknown> }> {
    const aiCommit = options.aiCommit ?? {
      commitId: `${options.pipelineId}:reference-commit`,
      agentId: options.agentId ?? 'reference-governed-loop',
      timestamp: Date.now(),
      description: 'Auto-generated ai_commit for the SDK reference governed loop.',
    };
    const traceHash = `${options.workflowId}:trace:${options.riskLevel}`;

    const steps: Array<{ extensionId: string; action: string; input?: Record<string, unknown> }> = [
      {
        extensionId: 'v1.1.1',
        action: 'guard_check',
        input: {
          requestId: `${options.workflowId}:guard`,
          phase: 'BUILD',
          riskLevel: options.riskLevel,
          role: options.role ?? 'HUMAN',
          agentId: options.agentId,
          action: options.action ?? 'write_code',
          targetFiles: options.targetFiles,
          fileScope: options.fileScope,
          traceHash,
          ai_commit: aiCommit,
        },
      },
      {
        extensionId: 'v1.1.1',
        action: 'pipeline_create',
        input: {
          pipelineId: options.pipelineId,
          intent: options.intent,
          riskLevel: options.riskLevel,
          role: options.role ?? 'HUMAN',
          agentId: options.agentId,
        },
      },
      {
        extensionId: 'v1.1.1',
        action: 'pipeline_record_artifact',
        input: {
          pipelineId: options.pipelineId,
          type: 'PLAN',
          details: {
            source: 'reference_governed_loop',
            intent: options.intent,
          },
        },
      },
    ];

    if (options.requireApproval) {
      steps.push(
        {
          extensionId: 'v1.1.1',
          action: 'pipeline_advance',
          input: {
            pipelineId: options.pipelineId,
            advanceCount: 2,
          },
        },
        {
          extensionId: 'v1.1.1',
          action: 'pipeline_advance',
          input: {
            pipelineId: options.pipelineId,
            advanceCount: 1,
          },
        },
        {
          extensionId: 'v1.1.1',
          action: 'pipeline_approve_checkpoint',
          input: {
            pipelineId: options.pipelineId,
            reviewerId: options.reviewerId ?? 'governor-reference',
            reviewerRole: options.reviewerRole ?? 'GOVERNOR',
            comment: options.reviewerComment ?? 'Approved through reference governed loop.',
          },
        },
        {
          extensionId: 'v1.1.1',
          action: 'pipeline_advance',
          input: {
            pipelineId: options.pipelineId,
            advanceCount: 1,
          },
        },
      );
    } else {
      steps.push({
        extensionId: 'v1.1.1',
        action: 'pipeline_advance',
        input: {
          pipelineId: options.pipelineId,
          advanceCount: 3,
        },
      });
    }

    steps.push(
      {
        extensionId: 'v1.1.1',
        action: 'pipeline_record_artifact',
        input: {
          pipelineId: options.pipelineId,
          type: 'EXECUTION',
          details: {
            targetFiles: options.targetFiles ?? options.fileScope ?? [],
            action: options.action ?? 'write_code',
          },
        },
      },
      {
        extensionId: 'v1.1.1',
        action: 'pipeline_advance',
        input: {
          pipelineId: options.pipelineId,
          advanceCount: 1,
        },
      },
      {
        extensionId: 'v1.1.1',
        action: 'pipeline_record_artifact',
        input: {
          pipelineId: options.pipelineId,
          type: 'REVIEW',
          details: {
            accepted: true,
            reviewerRole: options.reviewerRole ?? 'GOVERNOR',
          },
        },
      },
      {
        extensionId: 'v1.1.1',
        action: 'pipeline_advance',
        input: {
          pipelineId: options.pipelineId,
          advanceCount: 1,
        },
      },
    );

    if (options.requireApproval) {
      steps.push(
        {
          extensionId: 'v1.1.1',
          action: 'pipeline_approve_checkpoint',
          input: {
            pipelineId: options.pipelineId,
            reviewerId: options.reviewerId ?? 'governor-reference',
            reviewerRole: options.reviewerRole ?? 'GOVERNOR',
            comment: options.reviewerComment ?? 'Approved through reference governed loop.',
          },
        },
        {
          extensionId: 'v1.1.1',
          action: 'pipeline_advance',
          input: {
            pipelineId: options.pipelineId,
            advanceCount: 1,
          },
        },
      );
    }

    steps.push(
      {
        extensionId: 'v1.1.1',
        action: 'pipeline_record_artifact',
        input: {
          pipelineId: options.pipelineId,
          type: 'FREEZE',
          details: {
            receipt: `${options.pipelineId}:freeze`,
            source: 'reference_governed_loop',
          },
        },
      },
      {
        extensionId: 'v1.1.1',
        action: 'pipeline_complete',
        input: {
          pipelineId: options.pipelineId,
        },
      },
      {
        extensionId: 'v3.0',
        action: 'skill_validate',
        input: {
          pipelineId: options.pipelineId,
          skill: options.skillId ?? 'reference_governed_loop',
        },
      },
      {
        extensionId: 'v1.9',
        action: 'checkpoint',
        input: {
          pipelineId: options.pipelineId,
        },
      },
    );

    return steps;
  }

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

  private runGuardCheck(input: Record<string, unknown>): GuardPipelineResult {
    const entryPoint = input['entryPoint'];
    if (entryPoint && this.gateway) {
      const normalizedEntryPoint = String(entryPoint).toUpperCase() as EntryPointType;
      const rawInput = this.parseRecord(input['rawInput']) ?? input;
      return this.gateway.process(normalizedEntryPoint, rawInput).guardResult;
    }

    return this.engine.evaluate(this.buildGuardContext(input));
  }

  private buildGuardContext(input: Record<string, unknown>): GuardRequestContext {
    const metadata = this.parseRecord(input['metadata']) ?? {};
    return {
      requestId: String(input['requestId'] ?? `bridge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      phase: this.parsePhase(input['phase'] ?? 'BUILD'),
      riskLevel: this.parseRiskLevel(input['riskLevel'] ?? 'R1'),
      role: this.parseRole(input['role'] ?? 'HUMAN'),
      agentId: input['agentId'] ? String(input['agentId']) : undefined,
      action: String(input['action'] ?? 'workflow_guard_check'),
      targetFiles: this.parseStringArray(input['targetFiles']),
      fileScope: this.parseStringArray(input['fileScope']),
      mutationCount: input['mutationCount'] != null ? Number(input['mutationCount']) : undefined,
      mutationBudget: input['mutationBudget'] != null ? Number(input['mutationBudget']) : undefined,
      traceHash: input['traceHash'] ? String(input['traceHash']) : undefined,
      scope: input['scope'] ? String(input['scope']) : undefined,
      metadata: {
        ...metadata,
        ...(input['ai_commit'] ? { ai_commit: input['ai_commit'] } : {}),
        workflowSource: 'extension_bridge',
      },
    };
  }

  private requireLinkedPipeline(
    workflow: CrossExtensionWorkflow,
    input: Record<string, unknown>,
  ): PipelineInstance {
    const pipelineId = String(input['pipelineId'] ?? workflow.metadata?.['linkedPipelineId'] ?? '');
    if (!pipelineId) {
      throw new Error(`Workflow "${workflow.id}" has no linked pipeline. Run pipeline_create first or provide pipelineId.`);
    }

    const pipeline = this.pipeline.getPipeline(pipelineId);
    if (!pipeline) {
      throw new Error(`Linked pipeline "${pipelineId}" not found.`);
    }

    workflow.metadata = {
      ...workflow.metadata,
      linkedPipelineId: pipeline.id,
    };

    return pipeline;
  }

  private parsePhase(value: unknown): GuardRequestContext['phase'] {
    const phase = String(value ?? 'BUILD').toUpperCase();
    if (['INTAKE', 'DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE'].includes(phase)) {
      return phase as GuardRequestContext['phase'];
    }
    throw new Error(`Invalid phase "${value}" for workflow bridge guard execution.`);
  }

  private parseRiskLevel(value: unknown): GuardRequestContext['riskLevel'] {
    const riskLevel = String(value ?? 'R1').toUpperCase();
    if (['R0', 'R1', 'R2', 'R3'].includes(riskLevel)) {
      return riskLevel as GuardRequestContext['riskLevel'];
    }
    throw new Error(`Invalid risk level "${value}" for workflow bridge execution.`);
  }

  private parseRole(value: unknown): CVFRole {
    const role = String(value ?? 'HUMAN').toUpperCase();
    if (['OBSERVER', 'ANALYST', 'BUILDER', 'REVIEWER', 'GOVERNOR', 'HUMAN', 'AI_AGENT', 'OPERATOR'].includes(role)) {
      return role as CVFRole;
    }
    throw new Error(`Invalid role "${value}" for workflow bridge execution.`);
  }

  private parseRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? { ...(value as Record<string, unknown>) }
      : undefined;
  }

  private parseStringArray(value: unknown): string[] | undefined {
    if (Array.isArray(value)) {
      return value.map(String);
    }
    if (typeof value === 'string') {
      return value.split(',').map((entry) => entry.trim()).filter(Boolean);
    }
    return undefined;
  }
}
