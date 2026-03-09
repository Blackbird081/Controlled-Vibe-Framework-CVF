/**
 * MCP Adapter — Track IV Phase B.2
 *
 * Normalizes MCP (Model Context Protocol) tool call inputs into GuardRequestContext.
 * MCP requests arrive as JSON-RPC with tool_name and arguments.
 */

import type { CVFPhase, CVFRiskLevel, CVFRole, GuardPipelineResult } from '../guard.runtime.types.js';
import type { EntryAdapter, NormalizedRequest, EntryResponse } from './entry.types.js';

export class McpAdapter implements EntryAdapter {
  type = 'MCP' as const;

  normalize(raw: Record<string, unknown>): NormalizedRequest {
    const toolName = String(raw['tool_name'] ?? raw['method'] ?? 'unknown');
    const args = (raw['arguments'] ?? raw['params'] ?? {}) as Record<string, unknown>;

    const phase = this.resolvePhase(toolName);
    const riskLevel = this.resolveRisk(toolName, args);
    const role: CVFRole = 'AI_AGENT';

    return {
      requestId: String(raw['id'] ?? raw['requestId'] ?? `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      phase,
      riskLevel,
      role,
      agentId: String(args['agentId'] ?? raw['agentId'] ?? 'mcp-agent'),
      action: toolName,
      targetFiles: this.extractFiles(args),
      mutationCount: args['mutationCount'] != null ? Number(args['mutationCount']) : undefined,
      mutationBudget: args['mutationBudget'] != null ? Number(args['mutationBudget']) : undefined,
      traceHash: args['traceHash'] ? String(args['traceHash']) : undefined,
      scope: args['scope'] ? String(args['scope']) : undefined,
      metadata: { entryPoint: 'MCP', toolName, originalArgs: args },
    };
  }

  formatResponse(result: GuardPipelineResult, requestId: string): EntryResponse {
    const blocked = result.finalDecision === 'BLOCK';
    const escalated = result.finalDecision === 'ESCALATE';
    let reason = 'Tool call allowed.';

    if (blocked) {
      const blocker = result.results.find((r) => r.guardId === result.blockedBy);
      reason = blocker?.reason ?? `Blocked by ${result.blockedBy}.`;
    } else if (escalated) {
      const escalator = result.results.find((r) => r.guardId === result.escalatedBy);
      reason = escalator?.reason ?? `Escalated by ${result.escalatedBy}.`;
    }

    return {
      entryPoint: 'MCP',
      requestId,
      allowed: result.finalDecision === 'ALLOW',
      decision: result.finalDecision,
      reason,
      guardResult: result,
      timestamp: new Date().toISOString(),
    };
  }

  private resolvePhase(toolName: string): CVFPhase {
    const lower = toolName.toLowerCase();
    if (lower.includes('discover') || lower.includes('explore')) return 'DISCOVERY';
    if (lower.includes('design') || lower.includes('plan')) return 'DESIGN';
    if (lower.includes('review') || lower.includes('audit')) return 'REVIEW';
    return 'BUILD';
  }

  private resolveRisk(toolName: string, args: Record<string, unknown>): CVFRiskLevel {
    if (args['riskLevel']) {
      const str = String(args['riskLevel']).toUpperCase();
      if (['R0', 'R1', 'R2', 'R3'].includes(str)) return str as CVFRiskLevel;
    }
    const lower = toolName.toLowerCase();
    if (lower.includes('delete') || lower.includes('drop') || lower.includes('destroy')) return 'R3';
    if (lower.includes('deploy') || lower.includes('migrate')) return 'R2';
    if (lower.includes('write') || lower.includes('update') || lower.includes('edit')) return 'R1';
    return 'R0';
  }

  private extractFiles(args: Record<string, unknown>): string[] | undefined {
    if (args['targetFiles'] && Array.isArray(args['targetFiles'])) {
      return (args['targetFiles'] as unknown[]).map(String);
    }
    if (args['file']) return [String(args['file'])];
    if (args['path']) return [String(args['path'])];
    return undefined;
  }
}
