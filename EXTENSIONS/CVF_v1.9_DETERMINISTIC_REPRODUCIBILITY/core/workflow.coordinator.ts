import type {
  CrossExtensionRecoveryResult,
  CrossExtensionRemediationPolicy,
} from '../types/index.js';

// --- Types ---

export type WorkflowStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK';

export type StepStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'ROLLED_BACK';

export interface WorkflowStep {
  stepId: string;
  extensionId: string;
  description: string;
  status: StepStatus;
  checkpoint?: WorkflowCheckpoint;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  rollbackCapable: boolean;
}

export interface WorkflowCheckpoint {
  checkpointId: string;
  sessionId: string;
  phase: string;
  extensionContext: string;
  stateSnapshot: Record<string, unknown>;
  auditTrail: string[];
  rollbackCapable: boolean;
  timestamp: string;
}

export interface WorkflowDefinition {
  workflowId: string;
  name: string;
  steps: Omit<WorkflowStep, 'status' | 'checkpoint'>[];
}

export interface WorkflowInstance {
  instanceId: string;
  workflowId: string;
  name: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  currentStepIndex: number;
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  retryCount: number;
  maxRetries: number;
  checkpoints: WorkflowCheckpoint[];
  rollbackLog: RollbackEntry[];
}

export interface RollbackEntry {
  stepId: string;
  extensionId: string;
  rolledBackAt: string;
  reason: string;
}

export interface StepExecutionResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
}

export type StepExecutor = (step: WorkflowStep, instance: WorkflowInstance) => StepExecutionResult;
export type StepRollbackFn = (step: WorkflowStep, instance: WorkflowInstance) => boolean;

// --- Workflow Coordinator ---

export class WorkflowCoordinator {
  private instances: Map<string, WorkflowInstance> = new Map();
  private executors: Map<string, StepExecutor> = new Map();
  private rollbackFns: Map<string, StepRollbackFn> = new Map();
  private instanceCounter = 0;

  registerExecutor(extensionId: string, executor: StepExecutor): void {
    this.executors.set(extensionId, executor);
  }

  registerRollback(extensionId: string, rollbackFn: StepRollbackFn): void {
    this.rollbackFns.set(extensionId, rollbackFn);
  }

  createWorkflow(definition: WorkflowDefinition, options?: { maxRetries?: number }): WorkflowInstance {
    this.instanceCounter += 1;
    const instanceId = `WF-${Date.now()}-${this.instanceCounter}`;
    const sessionId = `session-${instanceId}`;

    const instance: WorkflowInstance = {
      instanceId,
      workflowId: definition.workflowId,
      name: definition.name,
      status: 'PENDING',
      steps: definition.steps.map(s => ({
        ...s,
        status: 'PENDING' as StepStatus,
      })),
      currentStepIndex: 0,
      sessionId,
      startedAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: options?.maxRetries ?? 3,
      checkpoints: [],
      rollbackLog: [],
    };

    this.instances.set(instanceId, instance);
    return instance;
  }

  getWorkflow(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId);
  }

  getAllWorkflows(): WorkflowInstance[] {
    return Array.from(this.instances.values());
  }

  getWorkflowsByStatus(status: WorkflowStatus): WorkflowInstance[] {
    return this.getAllWorkflows().filter(w => w.status === status);
  }

  executeNext(instanceId: string): StepExecutionResult {
    const instance = this.getOrFail(instanceId);

    if (instance.status === 'COMPLETED' || instance.status === 'FAILED' || instance.status === 'ROLLED_BACK') {
      return { success: false, error: `Workflow is ${instance.status}` };
    }

    if (instance.currentStepIndex >= instance.steps.length) {
      instance.status = 'COMPLETED';
      instance.completedAt = new Date().toISOString();
      return { success: true, output: { message: 'All steps completed' } };
    }

    instance.status = 'RUNNING';
    const step = instance.steps[instance.currentStepIndex]!;
    step.status = 'RUNNING';
    step.startedAt = new Date().toISOString();

    // Create checkpoint before execution
    const checkpoint = this.createCheckpoint(step, instance);
    step.checkpoint = checkpoint;
    instance.checkpoints.push(checkpoint);

    // Execute step
    const executor = this.executors.get(step.extensionId);
    if (!executor) {
      step.status = 'FAILED';
      step.error = `No executor registered for extension: ${step.extensionId}`;
      return this.handleStepFailure(instance, step);
    }

    try {
      const result = executor(step, instance);
      if (result.success) {
        step.status = 'COMPLETED';
        step.completedAt = new Date().toISOString();
        instance.currentStepIndex += 1;

        // Check if all steps done
        if (instance.currentStepIndex >= instance.steps.length) {
          instance.status = 'COMPLETED';
          instance.completedAt = new Date().toISOString();
        }

        return result;
      } else {
        step.status = 'FAILED';
        step.error = result.error;
        return this.handleStepFailure(instance, step);
      }
    } catch (err) {
      step.status = 'FAILED';
      step.error = err instanceof Error ? err.message : String(err);
      return this.handleStepFailure(instance, step);
    }
  }

  executeAll(instanceId: string): WorkflowInstance {
    const instance = this.getOrFail(instanceId);

    while (instance.status !== 'COMPLETED' && instance.status !== 'FAILED' && instance.status !== 'ROLLED_BACK') {
      const result = this.executeNext(instanceId);
      if (!result.success && (instance.status as WorkflowStatus) !== 'COMPLETED') {
        break;
      }
    }

    return instance;
  }

  pauseWorkflow(instanceId: string): boolean {
    const instance = this.getOrFail(instanceId);
    if (instance.status !== 'RUNNING' && instance.status !== 'PENDING') return false;

    instance.status = 'PAUSED';
    return true;
  }

  resumeWorkflow(instanceId: string): boolean {
    const instance = this.getOrFail(instanceId);
    if (instance.status !== 'PAUSED') return false;

    instance.status = 'RUNNING';
    return true;
  }

  rollbackWorkflow(instanceId: string, reason: string): boolean {
    const instance = this.getOrFail(instanceId);

    // Rollback completed steps in reverse order
    const completedSteps = instance.steps
      .filter(s => s.status === 'COMPLETED')
      .reverse();

    for (const step of completedSteps) {
      const rollbackFn = this.rollbackFns.get(step.extensionId);

      if (rollbackFn && step.rollbackCapable) {
        const success = rollbackFn(step, instance);
        if (success) {
          step.status = 'ROLLED_BACK';
          instance.rollbackLog.push({
            stepId: step.stepId,
            extensionId: step.extensionId,
            rolledBackAt: new Date().toISOString(),
            reason,
          });
        }
      }
    }

    instance.status = 'ROLLED_BACK';
    instance.completedAt = new Date().toISOString();
    return true;
  }

  getCheckpoints(instanceId: string): WorkflowCheckpoint[] {
    return this.getOrFail(instanceId).checkpoints;
  }

  getRollbackLog(instanceId: string): RollbackEntry[] {
    return this.getOrFail(instanceId).rollbackLog;
  }

  getRemediationPolicy(instance: WorkflowInstance): CrossExtensionRemediationPolicy {
    if (instance.status === 'COMPLETED') {
      return {
        severity: 'INFO',
        requiresHumanApproval: false,
        nextStep: 'Workflow completed successfully.',
        playbook: ['archive_evidence', 'update_audit_log'],
      };
    }

    if (instance.status === 'ROLLED_BACK') {
      return {
        severity: 'CRITICAL',
        requiresHumanApproval: true,
        nextStep: 'Review rollback evidence before retrying.',
        playbook: ['review_rollback_log', 'investigate_root_cause', 'human_approval_required'],
      };
    }

    if (instance.status === 'FAILED') {
      const failedStep = instance.steps.find(s => s.status === 'FAILED');
      if (instance.retryCount >= instance.maxRetries) {
        return {
          severity: 'CRITICAL',
          requiresHumanApproval: true,
          nextStep: `Max retries exceeded at step: ${failedStep?.stepId}`,
          playbook: ['halt_workflow', 'escalate_to_human', 'review_failure_chain'],
        };
      }
      return {
        severity: 'WARN',
        requiresHumanApproval: false,
        nextStep: `Retry from checkpoint at step: ${failedStep?.stepId}`,
        playbook: ['verify_checkpoint_integrity', 'retry_from_checkpoint', 'monitor_execution'],
      };
    }

    const hasFailedStep = instance.steps.some(s => s.status === 'FAILED');
    if (hasFailedStep && instance.retryCount < instance.maxRetries) {
      const failedStep = instance.steps.find(s => s.status === 'FAILED');
      return {
        severity: 'WARN',
        requiresHumanApproval: false,
        nextStep: `Retry from checkpoint at step: ${failedStep?.stepId}`,
        playbook: ['verify_checkpoint_integrity', 'retry_from_checkpoint', 'monitor_execution'],
      };
    }

    return {
      severity: 'INFO',
      requiresHumanApproval: false,
      nextStep: 'Continue workflow execution.',
      playbook: ['execute_next_step'],
    };
  }

  // --- Private helpers ---

  private getOrFail(instanceId: string): WorkflowInstance {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error(`Workflow not found: ${instanceId}`);
    return instance;
  }

  private createCheckpoint(step: WorkflowStep, instance: WorkflowInstance): WorkflowCheckpoint {
    return {
      checkpointId: `CP-${Date.now()}-${step.stepId}`,
      sessionId: instance.sessionId,
      phase: step.description,
      extensionContext: step.extensionId,
      stateSnapshot: {
        currentStepIndex: instance.currentStepIndex,
        completedSteps: instance.steps.filter(s => s.status === 'COMPLETED').map(s => s.stepId),
      },
      auditTrail: instance.checkpoints.map(c => c.checkpointId),
      rollbackCapable: step.rollbackCapable,
      timestamp: new Date().toISOString(),
    };
  }

  private handleStepFailure(instance: WorkflowInstance, step: WorkflowStep): StepExecutionResult {
    instance.retryCount += 1;

    if (instance.retryCount >= instance.maxRetries) {
      instance.status = 'FAILED';
      instance.completedAt = new Date().toISOString();
    }

    return {
      success: false,
      error: step.error ?? 'Unknown failure',
    };
  }
}
