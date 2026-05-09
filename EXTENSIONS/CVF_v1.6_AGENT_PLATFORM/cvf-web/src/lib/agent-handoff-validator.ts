/**
 * Agent Handoff Validator — v1.6 Enhancement Track 4.1
 *
 * Validates data integrity during agent-to-agent handoffs in the
 * multi-agent workflow. Ensures that:
 * - Task output from one agent is valid input for the next
 * - No data loss occurs during handoffs
 * - Context is properly transferred between agents
 * - Governance constraints are maintained across the pipeline
 *
 * Designed for non-coder transparency: errors are surfaced as
 * friendly status messages, not stack traces.
 *
 * @module lib/agent-handoff-validator
 */

import type { AgentRole, AgentTask, Workflow } from './multi-agent';

// ─── Types ────────────────────────────────────────────────────────────

export type HandoffDecision = 'ALLOW' | 'WARN' | 'BLOCK';

export interface HandoffIssue {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  friendlyMessage: string;
  friendlyMessageVi: string;
}

export interface HandoffValidationResult {
  decision: HandoffDecision;
  issues: HandoffIssue[];
  fromAgent: string;
  toAgent: string;
  contextCarried: boolean;
  outputSummary: string;
}

export interface HandoffContext {
  workflow: Pick<Workflow, 'id' | 'name' | 'status'>;
  fromTask: Pick<AgentTask, 'id' | 'agentId' | 'output' | 'status' | 'error'>;
  toAgentId: string;
  toAgentRole: AgentRole;
}

// ─── Agent Capability Matrix ──────────────────────────────────────────

/**
 * Defines what each agent role can produce and consume.
 * Used to validate handoff compatibility.
 */
export const AGENT_CAPABILITIES: Record<AgentRole, {
  produces: string[];
  consumes: string[];
  requiresInput: boolean;
}> = {
  orchestrator: {
    produces: ['task_breakdown', 'delegation_plan', 'synthesis'],
    consumes: ['user_request', 'agent_output', 'review_feedback'],
    requiresInput: true,
  },
  architect: {
    produces: ['architecture_spec', 'api_contract', 'component_design', 'data_model'],
    consumes: ['task_breakdown', 'user_request', 'requirements'],
    requiresInput: true,
  },
  builder: {
    produces: ['implementation', 'code', 'build_artifact'],
    consumes: ['architecture_spec', 'api_contract', 'component_design', 'task_breakdown'],
    requiresInput: true,
  },
  reviewer: {
    produces: ['review_feedback', 'quality_report', 'approval'],
    consumes: ['implementation', 'code', 'architecture_spec', 'build_artifact'],
    requiresInput: true,
  },
};

/**
 * Valid handoff sequences (from → to).
 * Defines the governance-compliant workflow order.
 */
export const VALID_HANDOFF_SEQUENCES: Array<[AgentRole, AgentRole]> = [
  ['orchestrator', 'architect'],
  ['orchestrator', 'builder'],
  ['orchestrator', 'reviewer'],
  ['architect', 'builder'],
  ['architect', 'orchestrator'],
  ['builder', 'reviewer'],
  ['builder', 'orchestrator'],
  ['reviewer', 'orchestrator'],
  ['reviewer', 'builder'], // send back for fixes
];

// ─── Validation Rules ─────────────────────────────────────────────────

function validateTaskCompletion(context: HandoffContext): HandoffIssue | null {
  if (context.fromTask.status !== 'completed') {
    return {
      code: 'TASK_NOT_COMPLETED',
      severity: 'error',
      message: `Task ${context.fromTask.id} has status "${context.fromTask.status}", expected "completed"`,
      friendlyMessage: 'The previous step isn\'t finished yet.',
      friendlyMessageVi: 'Bước trước chưa hoàn thành.',
    };
  }
  return null;
}

function validateOutputPresence(context: HandoffContext): HandoffIssue | null {
  if (!context.fromTask.output || context.fromTask.output.trim().length === 0) {
    return {
      code: 'EMPTY_OUTPUT',
      severity: 'error',
      message: `Task ${context.fromTask.id} produced no output`,
      friendlyMessage: 'The previous step didn\'t produce any results.',
      friendlyMessageVi: 'Bước trước không tạo ra kết quả nào.',
    };
  }
  return null;
}

function validateOutputLength(context: HandoffContext): HandoffIssue | null {
  const output = context.fromTask.output || '';
  if (output.trim().length < 20) {
    return {
      code: 'OUTPUT_TOO_SHORT',
      severity: 'warning',
      message: `Task output is very short (${output.trim().length} chars)`,
      friendlyMessage: 'The results from the previous step are quite brief.',
      friendlyMessageVi: 'Kết quả từ bước trước khá ngắn gọn.',
    };
  }
  return null;
}

function validateHandoffSequence(
  fromRole: AgentRole,
  toRole: AgentRole,
): HandoffIssue | null {
  const isValid = VALID_HANDOFF_SEQUENCES.some(
    ([f, t]) => f === fromRole && t === toRole,
  );

  if (!isValid) {
    return {
      code: 'INVALID_SEQUENCE',
      severity: 'error',
      message: `Handoff from ${fromRole} to ${toRole} is not a valid workflow sequence`,
      friendlyMessage: 'This workflow step order needs adjustment.',
      friendlyMessageVi: 'Thứ tự bước trong quy trình cần điều chỉnh.',
    };
  }
  return null;
}

function validateTaskError(context: HandoffContext): HandoffIssue | null {
  if (context.fromTask.error) {
    return {
      code: 'PREVIOUS_ERROR',
      severity: 'warning',
      message: `Previous task had error: ${context.fromTask.error}`,
      friendlyMessage: 'The previous step had an issue that may affect results.',
      friendlyMessageVi: 'Bước trước có lỗi có thể ảnh hưởng đến kết quả.',
    };
  }
  return null;
}

function validateWorkflowStatus(context: HandoffContext): HandoffIssue | null {
  if (context.workflow.status === 'failed') {
    return {
      code: 'WORKFLOW_FAILED',
      severity: 'error',
      message: 'Workflow is in failed state',
      friendlyMessage: 'The workflow has encountered an error and needs to be restarted.',
      friendlyMessageVi: 'Quy trình đã gặp lỗi và cần khởi động lại.',
    };
  }
  return null;
}

// ─── Utility ──────────────────────────────────────────────────────────

function getAgentRole(agentId: string): AgentRole {
  const roleMap: Record<string, AgentRole> = {
    orchestrator: 'orchestrator',
    architect: 'architect',
    builder: 'builder',
    reviewer: 'reviewer',
  };
  return roleMap[agentId] || 'orchestrator';
}

function summarizeOutput(output: string | undefined, maxLength = 100): string {
  if (!output || !output.trim()) return '(no output)';
  const trimmed = output.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength) + '...';
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Validate an agent-to-agent handoff.
 * Returns a decision (ALLOW/WARN/BLOCK) with issues.
 */
export function validateHandoff(context: HandoffContext): HandoffValidationResult {
  const issues: HandoffIssue[] = [];

  const fromRole = getAgentRole(context.fromTask.agentId);
  const toRole = context.toAgentRole;

  // Run all validation rules
  const checks = [
    validateWorkflowStatus(context),
    validateTaskCompletion(context),
    validateOutputPresence(context),
    validateOutputLength(context),
    validateHandoffSequence(fromRole, toRole),
    validateTaskError(context),
  ];

  for (const issue of checks) {
    if (issue) issues.push(issue);
  }

  // Determine decision
  const hasError = issues.some(i => i.severity === 'error');
  const hasWarning = issues.some(i => i.severity === 'warning');

  let decision: HandoffDecision;
  if (hasError) {
    decision = 'BLOCK';
  } else if (hasWarning) {
    decision = 'WARN';
  } else {
    decision = 'ALLOW';
  }

  return {
    decision,
    issues,
    fromAgent: context.fromTask.agentId,
    toAgent: context.toAgentId,
    contextCarried: !hasError && !!context.fromTask.output,
    outputSummary: summarizeOutput(context.fromTask.output),
  };
}

/**
 * Validate the entire workflow handoff chain.
 * Returns validation results for each handoff in sequence.
 */
export function validateWorkflowChain(workflow: Workflow): HandoffValidationResult[] {
  const results: HandoffValidationResult[] = [];

  for (let i = 0; i < workflow.tasks.length - 1; i++) {
    const fromTask = workflow.tasks[i];
    const toTask = workflow.tasks[i + 1];
    const toAgent = workflow.agents.find(a => a.id === toTask.agentId);

    const result = validateHandoff({
      workflow: { id: workflow.id, name: workflow.name, status: workflow.status },
      fromTask,
      toAgentId: toTask.agentId,
      toAgentRole: toAgent?.role || 'orchestrator',
    });

    results.push(result);
  }

  return results;
}

/**
 * Quick check: is this handoff safe to proceed?
 */
export function isHandoffSafe(context: HandoffContext): boolean {
  const result = validateHandoff(context);
  return result.decision !== 'BLOCK';
}
