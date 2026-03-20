/**
 * Pipeline Orchestrator — Track IV Phase A.3
 *
 * Manages the E2E governance pipeline lifecycle:
 *   intent → INTAKE → DESIGN → BUILD → REVIEW → FREEZE → COMPLETE/ROLLBACK
 *
 * Features:
 *   - Phase transitions with gate enforcement via GuardRuntimeEngine
 *   - Rollback to any previous phase
 *   - Event emission for monitoring
 *   - Full audit trail per pipeline instance
 *   - Pause/resume support
 */

import { GuardRuntimeEngine } from './guard.runtime.engine.js';
import type {
  CVFPhase,
  CVFRiskLevel,
  CVFRole,
  GuardRequestContext,
  GuardPipelineResult,
} from './guard.runtime.types.js';

// --- Types ---

export type PipelineStatus =
  | 'CREATED'
  | 'INTAKE'
  | 'DESIGN'
  | 'BUILD'
  | 'REVIEW'
  | 'FREEZE'
  | 'COMPLETED'
  | 'ROLLED_BACK'
  | 'PAUSED'
  | 'FAILED';

export interface PipelineEvent {
  type: 'PHASE_ENTER' | 'PHASE_EXIT' | 'GATE_CHECK' | 'ROLLBACK' | 'PAUSE' | 'RESUME' | 'COMPLETE' | 'FAIL' | 'ARTIFACT_RECORDED' | 'APPROVAL_REQUESTED' | 'APPROVAL_APPROVED' | 'APPROVAL_REJECTED';
  pipelineId: string;
  phase?: CVFPhase;
  previousPhase?: PipelineStatus;
  timestamp: string;
  details?: string;
  guardResult?: GuardPipelineResult;
}

export type PipelineArtifactType = 'INTENT' | 'PLAN' | 'EXECUTION' | 'REVIEW' | 'FREEZE';

export interface PipelineArtifact {
  id: string;
  type: PipelineArtifactType;
  recordedAt: string;
  details?: Record<string, unknown>;
}

export type PipelineApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PipelineApprovalCheckpoint {
  id: string;
  phase: Extract<CVFPhase, 'BUILD' | 'FREEZE'>;
  status: PipelineApprovalStatus;
  requiredBy: 'RISK' | 'MANUAL';
  reason: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewerRole?: CVFRole;
  comment?: string;
}

export interface PipelineInstance {
  id: string;
  intent: string;
  status: PipelineStatus;
  riskLevel: CVFRiskLevel;
  role: CVFRole;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
  phaseHistory: Array<{ phase: PipelineStatus; enteredAt: string; exitedAt?: string }>;
  events: PipelineEvent[];
  gateResults: Map<string, GuardPipelineResult>;
  artifacts: PipelineArtifact[];
  approvals: PipelineApprovalCheckpoint[];
  metadata?: Record<string, unknown>;
}

const PHASE_SEQUENCE: CVFPhase[] = ['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE'];

const PHASE_TO_STATUS: Record<CVFPhase, PipelineStatus> = {
  DISCOVERY: 'INTAKE',
  INTAKE: 'INTAKE',
  DESIGN: 'DESIGN',
  BUILD: 'BUILD',
  REVIEW: 'REVIEW',
  FREEZE: 'FREEZE',
};

// --- Orchestrator ---

export class PipelineOrchestrator {
  private pipelines: Map<string, PipelineInstance> = new Map();
  private guardEngine: GuardRuntimeEngine;
  private eventListeners: Array<(event: PipelineEvent) => void> = [];

  constructor(guardEngine: GuardRuntimeEngine) {
    this.guardEngine = guardEngine;
  }

  // --- Pipeline Lifecycle ---

  createPipeline(config: {
    id: string;
    intent: string;
    riskLevel: CVFRiskLevel;
    role: CVFRole;
    agentId?: string;
    metadata?: Record<string, unknown>;
  }): PipelineInstance {
    if (this.pipelines.has(config.id)) {
      throw new Error(`Pipeline "${config.id}" already exists.`);
    }

    const now = new Date().toISOString();
    const instance: PipelineInstance = {
      id: config.id,
      intent: config.intent,
      status: 'CREATED',
      riskLevel: config.riskLevel,
      role: config.role,
      agentId: config.agentId,
      createdAt: now,
      updatedAt: now,
      phaseHistory: [],
      events: [],
      gateResults: new Map(),
      artifacts: [
        {
          id: `${config.id}-artifact-intent`,
          type: 'INTENT',
          recordedAt: now,
          details: { intent: config.intent },
        },
      ],
      approvals: [],
      metadata: config.metadata,
    };

    this.pipelines.set(config.id, instance);
    return instance;
  }

  // --- Phase Transitions ---

  advancePhase(pipelineId: string): { success: boolean; guardResult?: GuardPipelineResult; error?: string } {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) return { success: false, error: `Pipeline "${pipelineId}" not found.` };

    if (pipeline.status === 'COMPLETED' || pipeline.status === 'ROLLED_BACK' || pipeline.status === 'FAILED') {
      return { success: false, error: `Pipeline is in terminal state: ${pipeline.status}.` };
    }

    if (pipeline.status === 'PAUSED') {
      return { success: false, error: 'Pipeline is paused. Resume before advancing.' };
    }

    const nextPhase = this.getNextPhase(pipeline.status);
    if (!nextPhase) {
      return { success: false, error: `No next phase after "${pipeline.status}".` };
    }

    const controlBoundaryError = this.validateControlBoundary(pipeline, nextPhase);
    if (controlBoundaryError) {
      return { success: false, error: controlBoundaryError };
    }

    const guardContext: GuardRequestContext = {
      requestId: `${pipelineId}-gate-${nextPhase}`,
      phase: nextPhase as CVFPhase,
      riskLevel: pipeline.riskLevel,
      role: pipeline.role,
      agentId: pipeline.agentId,
      action: `phase_transition_to_${nextPhase}`,
      traceHash: `trace-${pipelineId}-${nextPhase}`,
    };

    const guardResult = this.guardEngine.evaluate(guardContext);

    this.emitEvent({
      type: 'GATE_CHECK',
      pipelineId,
      phase: nextPhase as CVFPhase,
      timestamp: new Date().toISOString(),
      details: `Gate check for ${nextPhase}: ${guardResult.finalDecision}`,
      guardResult,
    });

    pipeline.gateResults.set(nextPhase, guardResult);

    if (guardResult.finalDecision === 'BLOCK') {
      return { success: false, guardResult, error: `Gate blocked transition to ${nextPhase}: ${guardResult.blockedBy}` };
    }

    if (guardResult.finalDecision === 'ESCALATE') {
      return { success: false, guardResult, error: `Gate escalated transition to ${nextPhase}: requires approval` };
    }

    // Exit current phase
    const currentHistory = pipeline.phaseHistory[pipeline.phaseHistory.length - 1];
    if (currentHistory && !currentHistory.exitedAt) {
      currentHistory.exitedAt = new Date().toISOString();
      this.emitEvent({
        type: 'PHASE_EXIT',
        pipelineId,
        previousPhase: pipeline.status,
        timestamp: currentHistory.exitedAt,
      });
    }

    const previousStatus = pipeline.status;
    const newStatus = PHASE_TO_STATUS[nextPhase as CVFPhase];
    pipeline.status = newStatus;
    pipeline.updatedAt = new Date().toISOString();
    pipeline.phaseHistory.push({ phase: newStatus, enteredAt: pipeline.updatedAt });

    this.emitEvent({
      type: 'PHASE_ENTER',
      pipelineId,
      phase: nextPhase as CVFPhase,
      previousPhase: previousStatus,
      timestamp: pipeline.updatedAt,
    });

    return { success: true, guardResult };
  }

  completePipeline(pipelineId: string): boolean {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) return false;

    if (pipeline.status !== 'FREEZE') {
      return false;
    }

    if (this.isGoverned(pipeline) && !this.hasArtifact(pipeline, 'FREEZE')) {
      return false;
    }

    const currentHistory = pipeline.phaseHistory[pipeline.phaseHistory.length - 1];
    if (currentHistory && !currentHistory.exitedAt) {
      currentHistory.exitedAt = new Date().toISOString();
    }

    pipeline.status = 'COMPLETED';
    pipeline.updatedAt = new Date().toISOString();
    pipeline.phaseHistory.push({ phase: 'COMPLETED', enteredAt: pipeline.updatedAt });

    this.emitEvent({
      type: 'COMPLETE',
      pipelineId,
      timestamp: pipeline.updatedAt,
      details: 'Pipeline completed successfully.',
    });

    return true;
  }

  // --- Rollback ---

  rollback(pipelineId: string, targetPhase?: CVFPhase): boolean {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) return false;

    if (pipeline.status === 'COMPLETED' || pipeline.status === 'ROLLED_BACK') {
      return false;
    }

    const currentHistory = pipeline.phaseHistory[pipeline.phaseHistory.length - 1];
    if (currentHistory && !currentHistory.exitedAt) {
      currentHistory.exitedAt = new Date().toISOString();
    }

    if (targetPhase) {
      pipeline.status = PHASE_TO_STATUS[targetPhase];
      pipeline.updatedAt = new Date().toISOString();
      pipeline.phaseHistory.push({ phase: pipeline.status, enteredAt: pipeline.updatedAt });

      this.emitEvent({
        type: 'ROLLBACK',
        pipelineId,
        phase: targetPhase,
        timestamp: pipeline.updatedAt,
        details: `Rolled back to ${targetPhase}.`,
      });
    } else {
      pipeline.status = 'ROLLED_BACK';
      pipeline.updatedAt = new Date().toISOString();
      pipeline.phaseHistory.push({ phase: 'ROLLED_BACK', enteredAt: pipeline.updatedAt });

      this.emitEvent({
        type: 'ROLLBACK',
        pipelineId,
        timestamp: pipeline.updatedAt,
        details: 'Pipeline fully rolled back.',
      });
    }

    return true;
  }

  // --- Pause / Resume ---

  pause(pipelineId: string): boolean {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) return false;
    if (pipeline.status === 'COMPLETED' || pipeline.status === 'ROLLED_BACK' || pipeline.status === 'PAUSED' || pipeline.status === 'FAILED') {
      return false;
    }

    const savedStatus = pipeline.status;
    pipeline.status = 'PAUSED';
    pipeline.updatedAt = new Date().toISOString();
    pipeline.metadata = { ...pipeline.metadata, pausedFrom: savedStatus };

    this.emitEvent({
      type: 'PAUSE',
      pipelineId,
      previousPhase: savedStatus,
      timestamp: pipeline.updatedAt,
    });

    return true;
  }

  resume(pipelineId: string): boolean {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) return false;
    if (pipeline.status !== 'PAUSED') return false;

    const resumeTo = pipeline.metadata?.['pausedFrom'] as PipelineStatus | undefined;
    if (!resumeTo) return false;

    pipeline.status = resumeTo;
    pipeline.updatedAt = new Date().toISOString();
    delete pipeline.metadata?.['pausedFrom'];

    this.emitEvent({
      type: 'RESUME',
      pipelineId,
      previousPhase: 'PAUSED',
      timestamp: pipeline.updatedAt,
      details: `Resumed to ${resumeTo}.`,
    });

    return true;
  }

  // --- Fail ---

  failPipeline(pipelineId: string, reason: string): boolean {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) return false;
    if (pipeline.status === 'COMPLETED' || pipeline.status === 'ROLLED_BACK' || pipeline.status === 'FAILED') {
      return false;
    }

    pipeline.status = 'FAILED';
    pipeline.updatedAt = new Date().toISOString();
    pipeline.phaseHistory.push({ phase: 'FAILED', enteredAt: pipeline.updatedAt });

    this.emitEvent({
      type: 'FAIL',
      pipelineId,
      timestamp: pipeline.updatedAt,
      details: reason,
    });

    return true;
  }

  // --- Query ---

  getPipeline(pipelineId: string): PipelineInstance | undefined {
    return this.pipelines.get(pipelineId);
  }

  getAllPipelines(): PipelineInstance[] {
    return Array.from(this.pipelines.values());
  }

  getPipelineCount(): number {
    return this.pipelines.size;
  }

  recordArtifact(
    pipelineId: string,
    artifact: {
      type: PipelineArtifactType;
      details?: Record<string, unknown>;
      id?: string;
    },
  ): PipelineArtifact | null {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) return null;

    const recordedAt = new Date().toISOString();
    const entry: PipelineArtifact = {
      id: artifact.id ?? `${pipelineId}-artifact-${artifact.type.toLowerCase()}-${pipeline.artifacts.length + 1}`,
      type: artifact.type,
      recordedAt,
      details: artifact.details,
    };
    pipeline.artifacts.push(entry);
    pipeline.updatedAt = recordedAt;

    this.emitEvent({
      type: 'ARTIFACT_RECORDED',
      pipelineId,
      phase: pipeline.status === 'CREATED' ? undefined : (pipeline.status as CVFPhase),
      timestamp: recordedAt,
      details: `Recorded ${artifact.type} artifact.`,
    });

    return entry;
  }

  requestApproval(
    pipelineId: string,
    config: {
      phase: Extract<CVFPhase, 'BUILD' | 'FREEZE'>;
      reason: string;
      requiredBy?: 'RISK' | 'MANUAL';
    },
  ): PipelineApprovalCheckpoint | null {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) return null;

    const existing = pipeline.approvals.find((approval) =>
      approval.phase === config.phase && approval.status === 'PENDING');
    if (existing) return existing;

    const requestedAt = new Date().toISOString();
    const approval: PipelineApprovalCheckpoint = {
      id: `${pipelineId}-approval-${config.phase.toLowerCase()}-${pipeline.approvals.length + 1}`,
      phase: config.phase,
      status: 'PENDING',
      requiredBy: config.requiredBy ?? 'MANUAL',
      reason: config.reason,
      requestedAt,
    };
    pipeline.approvals.push(approval);
    pipeline.updatedAt = requestedAt;

    this.emitEvent({
      type: 'APPROVAL_REQUESTED',
      pipelineId,
      phase: config.phase,
      timestamp: requestedAt,
      details: config.reason,
    });

    return approval;
  }

  approveCheckpoint(
    pipelineId: string,
    checkpointId: string,
    reviewer: { id: string; role: CVFRole; comment?: string },
  ): PipelineApprovalCheckpoint | null {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) return null;

    const approval = pipeline.approvals.find((entry) => entry.id === checkpointId);
    if (!approval || approval.status !== 'PENDING') return null;

    approval.status = 'APPROVED';
    approval.reviewerId = reviewer.id;
    approval.reviewerRole = reviewer.role;
    approval.comment = reviewer.comment;
    approval.reviewedAt = new Date().toISOString();
    pipeline.updatedAt = approval.reviewedAt;

    this.emitEvent({
      type: 'APPROVAL_APPROVED',
      pipelineId,
      phase: approval.phase,
      timestamp: approval.reviewedAt,
      details: reviewer.comment ?? `Approved by ${reviewer.id}.`,
    });

    return approval;
  }

  rejectCheckpoint(
    pipelineId: string,
    checkpointId: string,
    reviewer: { id: string; role: CVFRole; comment?: string },
  ): PipelineApprovalCheckpoint | null {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) return null;

    const approval = pipeline.approvals.find((entry) => entry.id === checkpointId);
    if (!approval || approval.status !== 'PENDING') return null;

    approval.status = 'REJECTED';
    approval.reviewerId = reviewer.id;
    approval.reviewerRole = reviewer.role;
    approval.comment = reviewer.comment;
    approval.reviewedAt = new Date().toISOString();
    pipeline.updatedAt = approval.reviewedAt;

    this.emitEvent({
      type: 'APPROVAL_REJECTED',
      pipelineId,
      phase: approval.phase,
      timestamp: approval.reviewedAt,
      details: reviewer.comment ?? `Rejected by ${reviewer.id}.`,
    });

    return approval;
  }

  getPendingApprovals(pipelineId: string): PipelineApprovalCheckpoint[] {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) return [];
    return pipeline.approvals.filter((entry) => entry.status === 'PENDING');
  }

  // --- Events ---

  addEventListener(listener: (event: PipelineEvent) => void): void {
    this.eventListeners.push(listener);
  }

  private emitEvent(event: PipelineEvent): void {
    const pipeline = this.getPipeline(event.pipelineId);
    if (pipeline) {
      pipeline.events.push(event);
    }
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  // --- Internals ---

  private validateControlBoundary(pipeline: PipelineInstance, nextPhase: CVFPhase): string | null {
    if (!this.isGoverned(pipeline)) return null;

    if (nextPhase === 'BUILD') {
      if (!this.hasArtifact(pipeline, 'PLAN')) {
        return 'Governed transition to BUILD requires a PLAN artifact.';
      }

      if (this.requiresApproval(pipeline, 'BUILD')) {
        const approval = this.ensureApprovalCheckpoint(
          pipeline,
          'BUILD',
          `Governed transition to BUILD requires approval for risk level ${pipeline.riskLevel}.`,
        );
        if (approval.status !== 'APPROVED') {
          return `Governed transition to BUILD is waiting for approval (${approval.id}).`;
        }
      }
    }

    if (nextPhase === 'FREEZE') {
      if (!this.hasArtifact(pipeline, 'EXECUTION')) {
        return 'Governed transition to FREEZE requires EXECUTION evidence.';
      }
      if (!this.hasArtifact(pipeline, 'REVIEW')) {
        return 'Governed transition to FREEZE requires REVIEW evidence.';
      }

      if (this.requiresApproval(pipeline, 'FREEZE')) {
        const approval = this.ensureApprovalCheckpoint(
          pipeline,
          'FREEZE',
          `Governed transition to FREEZE requires approval for risk level ${pipeline.riskLevel}.`,
        );
        if (approval.status !== 'APPROVED') {
          return `Governed transition to FREEZE is waiting for approval (${approval.id}).`;
        }
      }
    }

    return null;
  }

  private isGoverned(pipeline: PipelineInstance): boolean {
    return pipeline.metadata?.['controlMode'] === 'governed';
  }

  private hasArtifact(pipeline: PipelineInstance, type: PipelineArtifactType): boolean {
    return pipeline.artifacts.some((artifact) => artifact.type === type);
  }

  private requiresApproval(
    pipeline: PipelineInstance,
    phase: Extract<CVFPhase, 'BUILD' | 'FREEZE'>,
  ): boolean {
    if (pipeline.metadata?.[`requires${phase}Approval`] === true) {
      return true;
    }
    return pipeline.riskLevel === 'R2' || pipeline.riskLevel === 'R3';
  }

  private ensureApprovalCheckpoint(
    pipeline: PipelineInstance,
    phase: Extract<CVFPhase, 'BUILD' | 'FREEZE'>,
    reason: string,
  ): PipelineApprovalCheckpoint {
    const existing = pipeline.approvals.find((approval) =>
      approval.phase === phase && (approval.status === 'PENDING' || approval.status === 'APPROVED'));
    if (existing) return existing;

    return this.requestApproval(pipeline.id, {
      phase,
      reason,
      requiredBy: 'RISK',
    })!;
  }

  private getNextPhase(currentStatus: PipelineStatus): CVFPhase | null {
    switch (currentStatus) {
      case 'CREATED': return 'INTAKE';
      case 'INTAKE': return 'DESIGN';
      case 'DESIGN': return 'BUILD';
      case 'BUILD': return 'REVIEW';
      case 'REVIEW': return 'FREEZE';
      default: return null;
    }
  }
}

export { PHASE_SEQUENCE };
