/**
 * Workflow Monitor — v1.6 Enhancement Track 4.2
 *
 * Simplifies multi-agent workflow status into non-coder-friendly
 * summaries. Converts internal agent states, task progress, and
 * error conditions into clear, actionable status messages.
 *
 * @module lib/workflow-monitor
 */

import type { AgentTask, Workflow } from './multi-agent';

type Lang = 'vi' | 'en';

// ─── Types ────────────────────────────────────────────────────────────

export type WorkflowHealth = 'healthy' | 'warning' | 'error' | 'idle';

export interface WorkflowStatusSummary {
  health: WorkflowHealth;
  overallPercent: number;
  currentAgentName: string;
  currentAgentIcon: string;
  friendlyStatus: string;
  friendlyStatusVi: string;
  tasksCompleted: number;
  tasksTotal: number;
  tasksFailed: number;
  estimatedTimeLeft: string;
  estimatedTimeLeftVi: string;
  actionRequired: boolean;
  actionMessage: string;
  actionMessageVi: string;
}

export interface TaskStatusSummary {
  taskId: string;
  agentName: string;
  agentIcon: string;
  status: AgentTask['status'];
  friendlyStatus: string;
  friendlyStatusVi: string;
  duration: string | null;
}

// ─── Agent Display ────────────────────────────────────────────────────

const AGENT_DISPLAY: Record<string, { name: string; nameVi: string; icon: string }> = {
  orchestrator: { name: 'Coordinator', nameVi: 'Điều phối', icon: '🎯' },
  architect: { name: 'Designer', nameVi: 'Thiết kế', icon: '📐' },
  builder: { name: 'Builder', nameVi: 'Xây dựng', icon: '🔨' },
  reviewer: { name: 'Quality Check', nameVi: 'Kiểm tra', icon: '✅' },
};

function getAgentDisplay(agentId: string) {
  return AGENT_DISPLAY[agentId] || { name: agentId, nameVi: agentId, icon: '🤖' };
}

// ─── Task Status Translation ──────────────────────────────────────────

const TASK_STATUS_LABELS: Record<AgentTask['status'], { en: string; vi: string }> = {
  pending: { en: 'Waiting', vi: 'Đang chờ' },
  running: { en: 'Working...', vi: 'Đang xử lý...' },
  completed: { en: 'Done', vi: 'Hoàn thành' },
  failed: { en: 'Issue found', vi: 'Có vấn đề' },
};

// ─── Duration Formatting ──────────────────────────────────────────────

export function formatDuration(startTime?: Date, endTime?: Date): string | null {
  if (!startTime) return null;
  const end = endTime || new Date();
  const ms = end.getTime() - startTime.getTime();

  if (ms < 1000) return '<1s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

// ─── Time Estimation ──────────────────────────────────────────────────

function estimateTimeLeft(
  completedTasks: number,
  totalTasks: number,
  avgDurationMs: number,
  lang: Lang,
): string {
  const remaining = totalTasks - completedTasks;
  if (remaining <= 0) {
    return lang === 'vi' ? 'Hoàn thành!' : 'Done!';
  }

  if (avgDurationMs <= 0) {
    return lang === 'vi' ? 'Đang ước tính...' : 'Estimating...';
  }

  const totalMs = remaining * avgDurationMs;
  const totalSeconds = Math.ceil(totalMs / 1000);

  if (totalSeconds < 60) {
    return lang === 'vi' ? 'Dưới 1 phút' : 'Less than 1 minute';
  }

  const minutes = Math.ceil(totalSeconds / 60);
  if (minutes === 1) {
    return lang === 'vi' ? 'Khoảng 1 phút' : 'About 1 minute';
  }
  return lang === 'vi' ? `Khoảng ${minutes} phút` : `About ${minutes} minutes`;
}

function getAverageDuration(tasks: AgentTask[]): number {
  const completed = tasks.filter(t => t.status === 'completed' && t.startTime && t.endTime);
  if (completed.length === 0) return 30000; // default 30s

  const totalMs = completed.reduce((sum, t) => {
    const start = t.startTime instanceof Date ? t.startTime : new Date(t.startTime!);
    const end = t.endTime instanceof Date ? t.endTime : new Date(t.endTime!);
    return sum + (end.getTime() - start.getTime());
  }, 0);

  return totalMs / completed.length;
}

// ─── Workflow Health ──────────────────────────────────────────────────

function computeHealth(workflow: Workflow): WorkflowHealth {
  if (workflow.status === 'idle') return 'idle';
  if (workflow.status === 'failed') return 'error';

  const hasFailed = workflow.tasks.some(t => t.status === 'failed');
  if (hasFailed) return 'warning';

  return 'healthy';
}

// ─── Friendly Status ──────────────────────────────────────────────────

function getFriendlyWorkflowStatus(workflow: Workflow): { en: string; vi: string } {
  if (workflow.status === 'idle') {
    return { en: 'Ready to start', vi: 'Sẵn sàng bắt đầu' };
  }
  if (workflow.status === 'completed') {
    return { en: 'All done! Your results are ready.', vi: 'Hoàn tất! Kết quả đã sẵn sàng.' };
  }
  if (workflow.status === 'failed') {
    return { en: 'Something went wrong. Let me try again.', vi: 'Có lỗi xảy ra. Để tôi thử lại.' };
  }

  // Running
  const currentAgent = workflow.agents[workflow.currentAgentIndex];
  if (!currentAgent) {
    return { en: 'Working on it...', vi: 'Đang xử lý...' };
  }

  const display = getAgentDisplay(currentAgent.id);
  return {
    en: `${display.icon} ${display.name} is working on your request...`,
    vi: `${display.icon} ${display.nameVi} đang xử lý yêu cầu của bạn...`,
  };
}

function getActionRequired(workflow: Workflow): { required: boolean; en: string; vi: string } {
  if (workflow.status === 'failed') {
    return {
      required: true,
      en: 'Would you like to try again?',
      vi: 'Bạn muốn thử lại không?',
    };
  }

  const failedTasks = workflow.tasks.filter(t => t.status === 'failed');
  if (failedTasks.length > 0 && workflow.status === 'running') {
    return {
      required: true,
      en: 'A step had an issue. Results may be partial.',
      vi: 'Một bước gặp vấn đề. Kết quả có thể chưa đầy đủ.',
    };
  }

  return { required: false, en: '', vi: '' };
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Get a simplified, non-coder-friendly workflow status summary.
 */
export function getWorkflowStatus(workflow: Workflow): WorkflowStatusSummary {
  const tasksCompleted = workflow.tasks.filter(t => t.status === 'completed').length;
  const tasksFailed = workflow.tasks.filter(t => t.status === 'failed').length;
  const tasksTotal = workflow.tasks.length;
  const overallPercent = tasksTotal === 0 ? 0 : Math.round((tasksCompleted / tasksTotal) * 100);

  const currentAgent = workflow.agents[workflow.currentAgentIndex];
  const display = currentAgent ? getAgentDisplay(currentAgent.id) : { name: '', nameVi: '', icon: '' };

  const status = getFriendlyWorkflowStatus(workflow);
  const action = getActionRequired(workflow);
  const avgDuration = getAverageDuration(workflow.tasks);

  return {
    health: computeHealth(workflow),
    overallPercent,
    currentAgentName: display.name,
    currentAgentIcon: display.icon,
    friendlyStatus: status.en,
    friendlyStatusVi: status.vi,
    tasksCompleted,
    tasksTotal,
    tasksFailed,
    estimatedTimeLeft: estimateTimeLeft(tasksCompleted, tasksTotal, avgDuration, 'en'),
    estimatedTimeLeftVi: estimateTimeLeft(tasksCompleted, tasksTotal, avgDuration, 'vi'),
    actionRequired: action.required,
    actionMessage: action.en,
    actionMessageVi: action.vi,
  };
}

/**
 * Get per-task status summaries.
 */
export function getTaskStatuses(workflow: Workflow): TaskStatusSummary[] {
  return workflow.tasks.map(task => {
    const agent = workflow.agents.find(a => a.id === task.agentId);
    const display = agent ? getAgentDisplay(agent.id) : { name: task.agentId, nameVi: task.agentId, icon: '🤖' };
    const labels = TASK_STATUS_LABELS[task.status];

    return {
      taskId: task.id,
      agentName: display.name,
      agentIcon: display.icon,
      status: task.status,
      friendlyStatus: labels.en,
      friendlyStatusVi: labels.vi,
      duration: formatDuration(task.startTime, task.endTime),
    };
  });
}

/**
 * Check if workflow needs user attention.
 */
export function needsUserAttention(workflow: Workflow): boolean {
  return getActionRequired(workflow).required;
}
