/**
 * CVF Enterprise Features
 * ========================
 * Team roles, approval workflows, and compliance reporting
 * for enterprise-grade governance.
 *
 * Sprint 8 — Task 8.6
 *
 * @module cvf-guard-contract/enterprise
 */

import type {
  CanonicalCVFPhase,
  CVFPhase,
  CVFRiskLevel,
  CVFRole,
  GuardPipelineResult,
} from '../types';

function normalizePhaseAlias(phase: CVFPhase): CanonicalCVFPhase {
  return phase === 'DISCOVERY' ? 'INTAKE' : phase;
}

// ─── Team Roles & Permissions ────────────────────────────────────────

export type TeamRole = 'owner' | 'admin' | 'developer' | 'reviewer' | 'viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  joinedAt: string;
  lastActive?: string;
}

export interface TeamPermissions {
  canExecute: boolean;
  canApprove: boolean;
  canConfigureGuards: boolean;
  canViewAudit: boolean;
  canManageTeam: boolean;
  canExportReports: boolean;
  maxRiskLevel: CVFRiskLevel;
  allowedPhases: CanonicalCVFPhase[];
}

const ROLE_PERMISSIONS: Record<TeamRole, TeamPermissions> = {
  owner: {
    canExecute: true, canApprove: true, canConfigureGuards: true,
    canViewAudit: true, canManageTeam: true, canExportReports: true,
    maxRiskLevel: 'R3', allowedPhases: ['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE'],
  },
  admin: {
    canExecute: true, canApprove: true, canConfigureGuards: true,
    canViewAudit: true, canManageTeam: true, canExportReports: true,
    maxRiskLevel: 'R3', allowedPhases: ['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE'],
  },
  developer: {
    canExecute: true, canApprove: false, canConfigureGuards: false,
    canViewAudit: true, canManageTeam: false, canExportReports: false,
    maxRiskLevel: 'R2', allowedPhases: ['INTAKE', 'DESIGN', 'BUILD'],
  },
  reviewer: {
    canExecute: false, canApprove: true, canConfigureGuards: false,
    canViewAudit: true, canManageTeam: false, canExportReports: true,
    maxRiskLevel: 'R3', allowedPhases: ['REVIEW'],
  },
  viewer: {
    canExecute: false, canApprove: false, canConfigureGuards: false,
    canViewAudit: true, canManageTeam: false, canExportReports: false,
    maxRiskLevel: 'R0', allowedPhases: ['INTAKE'],
  },
};

export function getPermissions(role: TeamRole): TeamPermissions {
  return { ...ROLE_PERMISSIONS[role] };
}

export function canPerformAction(member: TeamMember, action: string, riskLevel: CVFRiskLevel, phase: CVFPhase): {
  allowed: boolean;
  reason: string;
} {
  const perms = ROLE_PERMISSIONS[member.role];
  const riskOrder: CVFRiskLevel[] = ['R0', 'R1', 'R2', 'R3'];
  const normalizedPhase = normalizePhaseAlias(phase);

  if (!perms.canExecute) {
    return { allowed: false, reason: `Role "${member.role}" cannot execute actions` };
  }
  if (riskOrder.indexOf(riskLevel) > riskOrder.indexOf(perms.maxRiskLevel)) {
    return { allowed: false, reason: `Risk ${riskLevel} exceeds max ${perms.maxRiskLevel} for role "${member.role}"` };
  }
  if (!perms.allowedPhases.includes(normalizedPhase)) {
    return { allowed: false, reason: `Phase ${normalizedPhase} not allowed for role "${member.role}"` };
  }
  return { allowed: true, reason: 'Permitted' };
}

// ─── Approval Workflows ──────────────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApprovalRequest {
  id: string;
  requestedBy: string;
  action: string;
  phase: CanonicalCVFPhase;
  riskLevel: CVFRiskLevel;
  reason: string;
  status: ApprovalStatus;
  createdAt: string;
  expiresAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  guardResult?: GuardPipelineResult;
}

export class ApprovalWorkflow {
  private requests: Map<string, ApprovalRequest> = new Map();
  private expiryMs: number;

  constructor(expiryHours = 24) {
    this.expiryMs = expiryHours * 60 * 60 * 1000;
  }

  /**
   * Create an approval request when a guard returns ESCALATE.
   */
  createRequest(params: {
    requestedBy: string;
    action: string;
    phase: CVFPhase;
    riskLevel: CVFRiskLevel;
    reason: string;
    guardResult?: GuardPipelineResult;
  }): ApprovalRequest {
    const id = `apr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    const request: ApprovalRequest = {
      id,
      requestedBy: params.requestedBy,
      action: params.action,
      phase: normalizePhaseAlias(params.phase),
      riskLevel: params.riskLevel,
      reason: params.reason,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.expiryMs).toISOString(),
      guardResult: params.guardResult,
    };
    this.requests.set(id, request);
    return request;
  }

  /**
   * Approve a pending request.
   */
  approve(requestId: string, reviewerId: string, comment?: string): ApprovalRequest | null {
    const req = this.requests.get(requestId);
    if (!req || req.status !== 'pending') return null;
    if (new Date() > new Date(req.expiresAt)) {
      req.status = 'expired';
      return req;
    }
    req.status = 'approved';
    req.reviewedBy = reviewerId;
    req.reviewedAt = new Date().toISOString();
    req.reviewComment = comment;
    return req;
  }

  /**
   * Reject a pending request.
   */
  reject(requestId: string, reviewerId: string, comment?: string): ApprovalRequest | null {
    const req = this.requests.get(requestId);
    if (!req || req.status !== 'pending') return null;
    req.status = 'rejected';
    req.reviewedBy = reviewerId;
    req.reviewedAt = new Date().toISOString();
    req.reviewComment = comment;
    return req;
  }

  /**
   * Get all pending requests.
   */
  getPending(): ApprovalRequest[] {
    this.expireOld();
    return [...this.requests.values()].filter(r => r.status === 'pending');
  }

  /**
   * Get request by ID.
   */
  getRequest(id: string): ApprovalRequest | undefined {
    return this.requests.get(id);
  }

  /**
   * Get all requests (for audit).
   */
  getAllRequests(): ApprovalRequest[] {
    return [...this.requests.values()];
  }

  private expireOld(): void {
    const now = new Date();
    for (const req of this.requests.values()) {
      if (req.status === 'pending' && now > new Date(req.expiresAt)) {
        req.status = 'expired';
      }
    }
  }
}

// ─── Compliance Reports ──────────────────────────────────────────────

export interface ComplianceReport {
  generatedAt: string;
  reportPeriod: { from: string; to: string };
  summary: {
    totalActions: number;
    allowedActions: number;
    blockedActions: number;
    escalatedActions: number;
    approvalRate: number;
    avgResponseTimeMs: number;
  };
  guardBreakdown: {
    guardId: string;
    triggered: number;
    blocked: number;
    allowed: number;
  }[];
  riskDistribution: Record<CVFRiskLevel, number>;
  phaseDistribution: Record<CanonicalCVFPhase, number>;
  topBlockedActions: { action: string; count: number; reason: string }[];
  teamActivity: { memberId: string; actions: number; blocked: number }[];
  complianceScore: number; // 0-100
}

/**
 * Generate a compliance report from guard pipeline results.
 */
export function generateComplianceReport(
  results: GuardPipelineResult[],
  periodFrom: string,
  periodTo: string,
): ComplianceReport {
  const totalActions = results.length;
  const allowedActions = results.filter(r => r.finalDecision === 'ALLOW').length;
  const blockedActions = results.filter(r => r.finalDecision === 'BLOCK').length;
  const escalatedActions = results.filter(r => r.finalDecision === 'ESCALATE').length;

  // Guard breakdown
  const guardMap = new Map<string, { triggered: number; blocked: number; allowed: number }>();
  for (const result of results) {
    for (const gr of result.results) {
      const entry = guardMap.get(gr.guardId) ?? { triggered: 0, blocked: 0, allowed: 0 };
      entry.triggered++;
      if (gr.decision === 'BLOCK') entry.blocked++;
      if (gr.decision === 'ALLOW') entry.allowed++;
      guardMap.set(gr.guardId, entry);
    }
  }

  // Risk distribution
  const riskDist: Record<CVFRiskLevel, number> = { R0: 0, R1: 0, R2: 0, R3: 0 };

  // Phase distribution
  const phaseDist: Record<CanonicalCVFPhase, number> = {
    INTAKE: 0,
    DESIGN: 0,
    BUILD: 0,
    REVIEW: 0,
    FREEZE: 0,
  };

  // Avg response time
  const totalMs = results.reduce((sum, r) => sum + (r.durationMs ?? 0), 0);

  // Top blocked actions
  const blockedMap = new Map<string, { count: number; reason: string }>();
  for (const r of results) {
    if (r.finalDecision === 'BLOCK' && r.blockedBy) {
      const key = r.blockedBy;
      const entry = blockedMap.get(key) ?? { count: 0, reason: r.agentGuidance ?? 'Blocked' };
      entry.count++;
      blockedMap.set(key, entry);
    }
  }

  // Compliance score: 100 - (blocked% * penalty)
  const blockRate = totalActions > 0 ? (blockedActions / totalActions) : 0;
  const complianceScore = Math.round(Math.max(0, Math.min(100, 100 - blockRate * 30)));

  return {
    generatedAt: new Date().toISOString(),
    reportPeriod: { from: periodFrom, to: periodTo },
    summary: {
      totalActions,
      allowedActions,
      blockedActions,
      escalatedActions,
      approvalRate: totalActions > 0 ? Math.round((allowedActions / totalActions) * 100) : 100,
      avgResponseTimeMs: totalActions > 0 ? Math.round(totalMs / totalActions) : 0,
    },
    guardBreakdown: [...guardMap.entries()].map(([guardId, data]) => ({
      guardId, ...data,
    })),
    riskDistribution: riskDist,
    phaseDistribution: phaseDist,
    topBlockedActions: [...blockedMap.entries()]
      .map(([action, data]) => ({ action, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    teamActivity: [],
    complianceScore,
  };
}
