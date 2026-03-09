/**
 * CLI Adapter — Track IV Phase B.2
 *
 * Normalizes CLI command inputs into GuardRequestContext.
 * CLI commands follow the pattern: cvf <action> [--phase] [--risk] [--role] [--files]
 */

import type { CVFPhase, CVFRiskLevel, CVFRole, GuardPipelineResult } from '../guard.runtime.types.js';
import type { EntryAdapter, NormalizedRequest, EntryResponse } from './entry.types.js';

export class CliAdapter implements EntryAdapter {
  type = 'CLI' as const;

  normalize(raw: Record<string, unknown>): NormalizedRequest {
    const action = String(raw['action'] ?? raw['command'] ?? 'unknown');
    const phase = this.parsePhase(raw['phase']);
    const riskLevel = this.parseRiskLevel(raw['risk'] ?? raw['riskLevel']);
    const role = this.parseRole(raw['role']);
    const agentId = raw['agentId'] ? String(raw['agentId']) : undefined;
    const files = this.parseFiles(raw['files'] ?? raw['targetFiles']);

    return {
      requestId: String(raw['requestId'] ?? `cli-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      phase,
      riskLevel,
      role,
      agentId,
      action,
      targetFiles: files,
      mutationCount: raw['mutationCount'] != null ? Number(raw['mutationCount']) : undefined,
      mutationBudget: raw['mutationBudget'] != null ? Number(raw['mutationBudget']) : undefined,
      traceHash: raw['traceHash'] ? String(raw['traceHash']) : undefined,
      scope: raw['scope'] ? String(raw['scope']) : undefined,
      metadata: { entryPoint: 'CLI', originalArgs: raw },
    };
  }

  formatResponse(result: GuardPipelineResult, requestId: string): EntryResponse {
    const blocked = result.finalDecision === 'BLOCK';
    const escalated = result.finalDecision === 'ESCALATE';
    let reason = 'Action allowed.';

    if (blocked) {
      const blocker = result.results.find((r) => r.guardId === result.blockedBy);
      reason = blocker?.reason ?? `Blocked by ${result.blockedBy}.`;
    } else if (escalated) {
      const escalator = result.results.find((r) => r.guardId === result.escalatedBy);
      reason = escalator?.reason ?? `Escalated by ${result.escalatedBy}.`;
    }

    return {
      entryPoint: 'CLI',
      requestId,
      allowed: result.finalDecision === 'ALLOW',
      decision: result.finalDecision,
      reason,
      guardResult: result,
      timestamp: new Date().toISOString(),
    };
  }

  private parsePhase(value: unknown): CVFPhase {
    const str = String(value ?? 'BUILD').toUpperCase();
    const valid: CVFPhase[] = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];
    return valid.includes(str as CVFPhase) ? (str as CVFPhase) : 'BUILD';
  }

  private parseRiskLevel(value: unknown): CVFRiskLevel {
    const str = String(value ?? 'R1').toUpperCase();
    const valid: CVFRiskLevel[] = ['R0', 'R1', 'R2', 'R3'];
    return valid.includes(str as CVFRiskLevel) ? (str as CVFRiskLevel) : 'R1';
  }

  private parseRole(value: unknown): CVFRole {
    const str = String(value ?? 'AI_AGENT').toUpperCase();
    const valid: CVFRole[] = ['HUMAN', 'AI_AGENT', 'REVIEWER', 'OPERATOR'];
    return valid.includes(str as CVFRole) ? (str as CVFRole) : 'AI_AGENT';
  }

  private parseFiles(value: unknown): string[] | undefined {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') return value.split(',').map((f) => f.trim());
    return undefined;
  }
}
