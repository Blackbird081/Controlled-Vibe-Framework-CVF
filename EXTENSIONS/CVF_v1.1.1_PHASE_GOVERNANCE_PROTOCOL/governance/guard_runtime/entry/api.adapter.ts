/**
 * API Adapter — Track IV Phase B.2
 *
 * Normalizes HTTP API request bodies into GuardRequestContext.
 * API requests arrive as JSON with explicit fields.
 */

import type { CVFPhase, CVFRiskLevel, CVFRole, GuardPipelineResult } from '../guard.runtime.types.js';
import type { EntryAdapter, NormalizedRequest, EntryResponse } from './entry.types.js';

export class ApiAdapter implements EntryAdapter {
  type = 'API' as const;

  normalize(raw: Record<string, unknown>): NormalizedRequest {
    return {
      requestId: String(raw['requestId'] ?? `api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      phase: this.validatePhase(raw['phase']),
      riskLevel: this.validateRiskLevel(raw['riskLevel']),
      role: this.validateRole(raw['role']),
      agentId: raw['agentId'] ? String(raw['agentId']) : undefined,
      action: String(raw['action'] ?? 'unknown'),
      targetFiles: Array.isArray(raw['targetFiles']) ? (raw['targetFiles'] as unknown[]).map(String) : undefined,
      mutationCount: raw['mutationCount'] != null ? Number(raw['mutationCount']) : undefined,
      mutationBudget: raw['mutationBudget'] != null ? Number(raw['mutationBudget']) : undefined,
      traceHash: raw['traceHash'] ? String(raw['traceHash']) : undefined,
      scope: raw['scope'] ? String(raw['scope']) : undefined,
      metadata: { entryPoint: 'API', ...(raw['metadata'] as Record<string, unknown> ?? {}) },
    };
  }

  formatResponse(result: GuardPipelineResult, requestId: string): EntryResponse {
    const blocked = result.finalDecision === 'BLOCK';
    const escalated = result.finalDecision === 'ESCALATE';
    let reason = 'Request allowed.';

    if (blocked) {
      const blocker = result.results.find((r) => r.guardId === result.blockedBy);
      reason = blocker?.reason ?? `Blocked by ${result.blockedBy}.`;
    } else if (escalated) {
      const escalator = result.results.find((r) => r.guardId === result.escalatedBy);
      reason = escalator?.reason ?? `Escalated by ${result.escalatedBy}.`;
    }

    return {
      entryPoint: 'API',
      requestId,
      allowed: result.finalDecision === 'ALLOW',
      decision: result.finalDecision,
      reason,
      guardResult: result,
      timestamp: new Date().toISOString(),
    };
  }

  private validatePhase(value: unknown): CVFPhase {
    const valid: CVFPhase[] = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];
    const str = String(value ?? '').toUpperCase();
    if (valid.includes(str as CVFPhase)) return str as CVFPhase;
    throw new Error(`Invalid phase: "${value}". Must be one of: ${valid.join(', ')}`);
  }

  private validateRiskLevel(value: unknown): CVFRiskLevel {
    const valid: CVFRiskLevel[] = ['R0', 'R1', 'R2', 'R3'];
    const str = String(value ?? '').toUpperCase();
    if (valid.includes(str as CVFRiskLevel)) return str as CVFRiskLevel;
    throw new Error(`Invalid riskLevel: "${value}". Must be one of: ${valid.join(', ')}`);
  }

  private validateRole(value: unknown): CVFRole {
    const valid: CVFRole[] = ['HUMAN', 'AI_AGENT', 'REVIEWER', 'OPERATOR'];
    const str = String(value ?? '').toUpperCase();
    if (valid.includes(str as CVFRole)) return str as CVFRole;
    throw new Error(`Invalid role: "${value}". Must be one of: ${valid.join(', ')}`);
  }
}
