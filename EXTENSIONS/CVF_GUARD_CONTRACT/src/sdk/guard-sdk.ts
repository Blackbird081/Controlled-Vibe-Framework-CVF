/**
 * CVF Guard SDK
 * ==============
 * Standalone SDK for any Node.js project to call CVF guards.
 * Works with LangGraph, AutoGen, CrewAI, or any custom agent framework.
 *
 * Usage:
 *   import { CVFGuardClient } from '@cvf/guard-sdk';
 *   const client = new CVFGuardClient({ baseUrl: 'https://your-cvf.netlify.app' });
 *   const result = await client.evaluate({ action: 'deploy to production', phase: 'BUILD' });
 *   if (result.finalDecision === 'BLOCK') { ... }
 *
 * Sprint 8 — Task 8.1
 *
 * @module @cvf/guard-sdk
 */

// ─── Types ───────────────────────────────────────────────────────────

export type CVFPhase = 'INTAKE' | 'DESIGN' | 'BUILD' | 'REVIEW' | 'FREEZE' | 'DISCOVERY';
export type CVFRiskLevel = 'R0' | 'R1' | 'R2' | 'R3';
export type CVFRole = 'OBSERVER' | 'ANALYST' | 'BUILDER' | 'REVIEWER' | 'GOVERNOR' | 'HUMAN' | 'AI_AGENT' | 'OPERATOR';
export type CVFDecision = 'ALLOW' | 'BLOCK' | 'ESCALATE';

export interface CVFGuardRequest {
  requestId?: string;
  action: string;
  phase?: CVFPhase;
  riskLevel?: CVFRiskLevel;
  role?: CVFRole;
  agentId?: string;
  targetFiles?: string[];
  fileScope?: string[];
  mutationCount?: number;
  metadata?: Record<string, unknown>;
}

export interface CVFGuardResult {
  guardId: string;
  decision: CVFDecision;
  severity: string;
  reason: string;
  agentGuidance?: string;
}

export interface CVFGuardResponse {
  success: boolean;
  data?: {
    requestId: string;
    finalDecision: CVFDecision;
    blockedBy?: string;
    escalatedBy?: string;
    agentGuidance?: string;
    durationMs: number;
    guardsEvaluated: number;
    results: CVFGuardResult[];
  };
  error?: string;
}

export interface CVFPhaseGateResponse {
  success: boolean;
  data?: {
    allowed: boolean;
    currentPhase: CVFPhase;
    requestedAction: string;
    reason: string;
    agentGuidance?: string;
  };
  error?: string;
}

export interface CVFClientConfig {
  /** Base URL of CVF deployment (e.g., https://your-app.netlify.app) */
  baseUrl: string;
  /** Optional service token for authentication */
  serviceToken?: string;
  /** Optional agent identifier */
  agentId?: string;
  /** Request timeout in ms (default: 10000) */
  timeout?: number;
}

// ─── SDK Client ──────────────────────────────────────────────────────

export class CVFGuardClient {
  private baseUrl: string;
  private serviceToken?: string;
  private agentId?: string;
  private timeout: number;

  constructor(config: CVFClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.serviceToken = config.serviceToken;
    this.agentId = config.agentId;
    this.timeout = config.timeout ?? 10000;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.serviceToken) {
      headers['x-cvf-service-token'] = this.serviceToken;
    }
    if (this.agentId) {
      headers['x-cvf-agent-id'] = this.agentId;
    }
    return headers;
  }

  private generateRequestId(): string {
    return `sdk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Evaluate full guard pipeline.
   * Call this before executing any action to check if it's allowed.
   */
  async evaluate(request: CVFGuardRequest): Promise<CVFGuardResponse> {
    const body = {
      requestId: request.requestId || this.generateRequestId(),
      action: request.action,
      phase: request.phase || 'BUILD',
      riskLevel: request.riskLevel || 'R0',
      role: request.role || 'AI_AGENT',
      agentId: request.agentId || this.agentId,
      targetFiles: request.targetFiles,
      fileScope: request.fileScope,
      mutationCount: request.mutationCount,
      metadata: request.metadata,
    };

    const response = await fetch(`${this.baseUrl}/api/guards/evaluate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    return response.json();
  }

  /**
   * Quick phase gate check.
   * Lightweight check if an action is allowed in the current phase.
   */
  async checkPhaseGate(action: string, phase?: CVFPhase): Promise<CVFPhaseGateResponse> {
    const body = {
      requestId: this.generateRequestId(),
      action,
      phase: phase || 'BUILD',
    };

    const response = await fetch(`${this.baseUrl}/api/guards/phase-gate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    return response.json();
  }

  /**
   * Get audit log entries.
   */
  async getAuditLog(options?: { requestId?: string; limit?: number }): Promise<{
    success: boolean;
    data?: unknown[];
    error?: string;
  }> {
    const params = new URLSearchParams();
    if (options?.requestId) params.set('requestId', options.requestId);
    if (options?.limit) params.set('limit', String(options.limit));

    const url = `${this.baseUrl}/api/guards/audit-log${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(this.timeout),
    });

    return response.json();
  }

  /**
   * Health check — verify CVF is reachable and configured.
   */
  async healthCheck(): Promise<{ healthy: boolean; guardsLoaded?: number; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/guards/health`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      return { healthy: data.success, guardsLoaded: data.data?.guardsLoaded };
    } catch (error) {
      return { healthy: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  /**
   * Helper: Evaluate and throw if blocked.
   * Use this for a cleaner flow in agent code.
   */
  async assertAllowed(request: CVFGuardRequest): Promise<void> {
    const result = await this.evaluate(request);
    if (!result.success) {
      throw new Error(`CVF Guard error: ${result.error}`);
    }
    if (result.data?.finalDecision === 'BLOCK') {
      throw new Error(`CVF Guard BLOCKED: ${result.data.agentGuidance || result.data.blockedBy || 'Action not allowed'}`);
    }
    if (result.data?.finalDecision === 'ESCALATE') {
      throw new Error(`CVF Guard ESCALATE: ${result.data.agentGuidance || 'Human approval required'}`);
    }
  }
}

// ─── Factory ─────────────────────────────────────────────────────────

/**
 * Create a CVF Guard client.
 * Shorthand for `new CVFGuardClient(config)`.
 */
export function createCVFGuard(config: CVFClientConfig): CVFGuardClient {
  return new CVFGuardClient(config);
}

export default CVFGuardClient;
