#!/usr/bin/env node
/**
 * CVF MCP Server — Exposes CVF Guard Runtime as MCP tools
 *
 * Tools exposed:
 *   1. cvf_check_phase_gate   — Check if action is allowed in current phase
 *   2. cvf_check_risk_gate    — Evaluate risk level of an action
 *   3. cvf_check_authority    — Verify role authorization for an action
 *   4. cvf_validate_output    — Validate AI output quality
 *   5. cvf_advance_phase      — Request phase advancement
 *   6. cvf_get_audit_log      — Retrieve audit trail
 *   7. cvf_evaluate_full      — Run full guard pipeline
 *
 * @module index
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getMcpToolAuditSnapshot, withMcpToolAudit } from './audit/mcp-tool-audit.js';
import {
  createGuardEngine,
  GuardRuntimeEngine,
  PHASE_ORDER,
  PHASE_DESCRIPTIONS,
  RISK_DESCRIPTIONS,
} from './guards/index.js';
import type { CVFPhase, CVFRiskLevel, CVFRole, GuardRequestContext } from './guards/types.js';
import {
  buildStartupAcknowledgment,
  checkGovernanceAction,
  getActiveHandoff,
  getGovernanceRules,
  getSessionMemory,
  getSessionState,
} from './startup/startup-state.js';
import { runCli } from './cli/cli.js';

// ─── Singleton Guard Engine ───────────────────────────────────────────

const engine: GuardRuntimeEngine = createGuardEngine();

// ─── Helper: Build context from tool arguments ────────────────────────

function buildContext(args: {
  phase?: string;
  riskLevel?: string;
  role?: string;
  action?: string;
  agentId?: string;
  targetFiles?: string[];
  mutationCount?: number;
  traceHash?: string;
}): GuardRequestContext {
  return {
    requestId: `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    phase: normalizePhase(args.phase),
    riskLevel: normalizeRiskLevel(args.riskLevel),
    role: normalizeRole(args.role),
    action: args.action || 'unknown',
    agentId: args.agentId,
    targetFiles: args.targetFiles,
    mutationCount: args.mutationCount,
    traceHash: args.traceHash,
  };
}

function normalizePhase(raw?: string): CVFPhase {
  if (!raw) return engine.getSessionPhase() as CVFPhase || 'DISCOVERY';
  const upper = raw.trim().toUpperCase();
  if (upper === 'DISCOVERY' || upper === 'PHASE A' || upper === 'A') return 'DISCOVERY';
  if (upper === 'DESIGN' || upper === 'PHASE B' || upper === 'B') return 'DESIGN';
  if (upper === 'BUILD' || upper === 'PHASE C' || upper === 'C') return 'BUILD';
  if (upper === 'REVIEW' || upper === 'PHASE D' || upper === 'D') return 'REVIEW';
  return 'BUILD';
}

function normalizeRiskLevel(raw?: string): CVFRiskLevel {
  if (!raw) return 'R0';
  const upper = raw.trim().toUpperCase();
  if (upper === 'R0' || upper === 'LOW' || upper === 'SAFE') return 'R0';
  if (upper === 'R1' || upper === 'MEDIUM' || upper === 'ATTENTION') return 'R1';
  if (upper === 'R2' || upper === 'HIGH' || upper === 'ELEVATED') return 'R2';
  if (upper === 'R3' || upper === 'CRITICAL' || upper === 'DANGEROUS') return 'R3';
  return 'R0';
}

function normalizeRole(raw?: string): CVFRole {
  if (!raw) return 'AI_AGENT';
  const upper = raw.trim().toUpperCase();
  if (upper === 'HUMAN' || upper === 'USER') return 'HUMAN';
  if (upper === 'REVIEWER') return 'REVIEWER';
  if (upper === 'OPERATOR') return 'OPERATOR';
  return 'AI_AGENT';
}

// ─── Create MCP Server ────────────────────────────────────────────────

const server = new McpServer({
  name: 'cvf-guard-server',
  version: '1.7.0',
});

// ─── Tool 1: cvf_check_phase_gate ─────────────────────────────────────

server.tool(
  'cvf_check_phase_gate',
  'Check if an action is allowed in the current CVF phase. CVF uses 4 phases: DISCOVERY → DESIGN → BUILD → REVIEW. Each phase has authorized roles.',
  {
    phase: z.string().optional().describe('Current phase: DISCOVERY, DESIGN, BUILD, or REVIEW'),
    role: z.string().optional().describe('Role: HUMAN, AI_AGENT, REVIEWER, or OPERATOR'),
    action: z.string().describe('The action being attempted'),
  },
  async (args) => {
    const context = buildContext({ phase: args.phase, role: args.role, action: args.action });
    const phaseGuard = engine.getGuard('phase_gate');
    if (!phaseGuard) {
      return { content: [{ type: 'text' as const, text: 'ERROR: Phase gate guard not registered.' }] };
    }

    const result = phaseGuard.evaluate(context);
    const currentPhase = context.phase;
    const phaseIndex = PHASE_ORDER.indexOf(currentPhase);

    const response = {
      decision: result.decision,
      phase: currentPhase,
      phaseDescription: PHASE_DESCRIPTIONS[currentPhase],
      phaseProgress: `${phaseIndex + 1}/${PHASE_ORDER.length}`,
      role: context.role,
      reason: result.reason,
      guidance: result.agentGuidance || null,
      suggestedAction: result.suggestedAction || null,
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  }
);

// ─── Tool 2: cvf_check_risk_gate ──────────────────────────────────────

server.tool(
  'cvf_check_risk_gate',
  'Evaluate the risk level of an action. CVF uses R0 (Safe) → R3 (Critical). AI agents are blocked at R3 and escalated at R2.',
  {
    riskLevel: z.string().describe('Risk level: R0 (safe), R1 (low), R2 (elevated), R3 (critical)'),
    role: z.string().optional().describe('Role performing the action'),
    action: z.string().describe('The action being evaluated'),
  },
  async (args) => {
    const context = buildContext({ riskLevel: args.riskLevel, role: args.role, action: args.action });
    const riskGuard = engine.getGuard('risk_gate');
    if (!riskGuard) {
      return { content: [{ type: 'text' as const, text: 'ERROR: Risk gate guard not registered.' }] };
    }

    const result = riskGuard.evaluate(context);
    const response = {
      decision: result.decision,
      riskLevel: context.riskLevel,
      riskDescription: RISK_DESCRIPTIONS[context.riskLevel],
      role: context.role,
      reason: result.reason,
      guidance: result.agentGuidance || null,
      suggestedAction: result.suggestedAction || null,
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  }
);

// ─── Tool 3: cvf_check_authority ──────────────────────────────────────

server.tool(
  'cvf_check_authority',
  'Verify if a role is authorized to perform a specific action. Some actions like approve, merge, deploy are restricted for AI agents.',
  {
    role: z.string().optional().describe('Role: HUMAN, AI_AGENT, REVIEWER, or OPERATOR'),
    action: z.string().describe('The action to check authorization for'),
  },
  async (args) => {
    const context = buildContext({ role: args.role, action: args.action });
    const authorityGuard = engine.getGuard('authority_gate');
    if (!authorityGuard) {
      return { content: [{ type: 'text' as const, text: 'ERROR: Authority gate guard not registered.' }] };
    }

    const result = authorityGuard.evaluate(context);
    const response = {
      decision: result.decision,
      role: context.role,
      action: context.action,
      reason: result.reason,
      guidance: result.agentGuidance || null,
      suggestedAction: result.suggestedAction || null,
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  }
);

// ─── Tool 4: cvf_validate_output ──────────────────────────────────────

server.tool(
  'cvf_validate_output',
  'Validate AI-generated output for quality, safety, and completeness before presenting to the user.',
  {
    output: z.string().describe('The AI-generated output to validate'),
    intent: z.string().describe('The original user intent/request'),
    minLength: z.number().optional().describe('Minimum acceptable length (default: 50)'),
  },
  async (args) => {
    const issues: string[] = [];
    let decision = 'PASS';

    if (!args.output || args.output.trim().length === 0) {
      issues.push('EMPTY_OUTPUT');
      decision = 'RETRY';
    } else {
      const minLen = args.minLength ?? 50;
      if (args.output.length < minLen) {
        issues.push('TOO_SHORT');
        decision = 'RETRY';
      }
      if (args.output.length > 50000) {
        issues.push('TOO_LONG');
        decision = 'WARN';
      }

      const unsafePatterns = [
        /\b(rm\s+-rf|drop\s+table|delete\s+from\s+\*|format\s+c:)\b/i,
        /\b(password|secret|api[_-]?key)\s*[:=]\s*["'][^"']{8,}/i,
      ];
      for (const pattern of unsafePatterns) {
        if (pattern.test(args.output)) {
          issues.push('UNSAFE_CONTENT');
          decision = 'RETRY';
          break;
        }
      }

      const hasStructure = /[#\-\d]/.test(args.output) && args.output.includes('\n');
      if (!hasStructure && args.output.length > 200) {
        issues.push('MISSING_STRUCTURE');
        if (decision === 'PASS') decision = 'WARN';
      }
    }

    const response = {
      decision,
      issues,
      outputLength: args.output?.length ?? 0,
      intent: args.intent,
      guidance: decision === 'RETRY'
        ? `The output has quality issues: ${issues.join(', ')}. Please regenerate with improvements.`
        : decision === 'WARN'
          ? `The output is acceptable but has minor issues: ${issues.join(', ')}. Consider improving.`
          : 'Output passes all quality checks.',
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  }
);

// ─── Tool 5: cvf_advance_phase ────────────────────────────────────────

server.tool(
  'cvf_advance_phase',
  'Request advancement to the next CVF phase. Phases must progress in order: DISCOVERY → DESIGN → BUILD → REVIEW.',
  {
    currentPhase: z.string().optional().describe('Current phase (auto-detected if omitted)'),
    completionEvidence: z.string().describe('Evidence that current phase is complete'),
  },
  async (args) => {
    const currentPhase = normalizePhase(args.currentPhase || engine.getSessionPhase());
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);

    if (currentIndex === PHASE_ORDER.length - 1) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            decision: 'COMPLETE',
            currentPhase,
            message: 'Already at final phase (REVIEW). The CVF pipeline is complete.',
            guidance: 'All phases are done. Proceed to final deliverable preparation and audit.',
          }, null, 2),
        }],
      };
    }

    const nextPhase = PHASE_ORDER[currentIndex + 1];
    engine.setSessionPhase(nextPhase);

    const response = {
      decision: 'ADVANCED',
      previousPhase: currentPhase,
      newPhase: nextPhase,
      newPhaseDescription: PHASE_DESCRIPTIONS[nextPhase],
      phaseProgress: `${currentIndex + 2}/${PHASE_ORDER.length}`,
      completionEvidence: args.completionEvidence,
      guidance: `Phase advanced from ${currentPhase} to ${nextPhase}. You are now in the ${nextPhase} phase: ${PHASE_DESCRIPTIONS[nextPhase]}. Adjust your actions accordingly.`,
      auditEntry: {
        timestamp: new Date().toISOString(),
        action: 'phase_advance',
        from: currentPhase,
        to: nextPhase,
        evidence: args.completionEvidence,
      },
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  }
);

// ─── Tool 6: cvf_get_audit_log ────────────────────────────────────────

server.tool(
  'cvf_get_audit_log',
  'Retrieve the CVF audit trail for the current session. Shows all guard decisions and phase transitions.',
  {
    requestId: z.string().optional().describe('Filter by specific request ID'),
    limit: z.number().optional().describe('Maximum entries to return (default: 20)'),
  },
  async (args) => {
    const log = engine.getAuditLog();
    let entries = [...log];

    if (args.requestId) {
      entries = entries.filter((e) => e.requestId === args.requestId);
    }

    const limit = args.limit ?? 20;
    entries = entries.slice(-limit);

    const response = {
      totalEntries: log.length,
      returnedEntries: entries.length,
      sessionPhase: engine.getSessionPhase(),
      entries: entries.map((e) => ({
        requestId: e.requestId,
        timestamp: e.timestamp,
        phase: e.context.phase,
        riskLevel: e.context.riskLevel,
        role: e.context.role,
        action: e.context.action,
        decision: e.pipelineResult.finalDecision,
        durationMs: e.pipelineResult.durationMs,
        blockedBy: e.pipelineResult.blockedBy || null,
        escalatedBy: e.pipelineResult.escalatedBy || null,
      })),
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  }
);

// ─── Tool 7: cvf_evaluate_full ────────────────────────────────────────

server.tool(
  'cvf_evaluate_full',
  'Run the FULL CVF guard pipeline on an action. Evaluates all 6 guards (phase, risk, authority, mutation budget, scope, audit trail) and returns a consolidated decision with guidance.',
  {
    phase: z.string().optional().describe('Current phase: DISCOVERY, DESIGN, BUILD, or REVIEW'),
    riskLevel: z.string().optional().describe('Risk level: R0, R1, R2, or R3'),
    role: z.string().optional().describe('Role: HUMAN, AI_AGENT, REVIEWER, or OPERATOR'),
    action: z.string().describe('The action being attempted'),
    agentId: z.string().optional().describe('Agent identifier (required for AI_AGENT role)'),
    targetFiles: z.array(z.string()).optional().describe('Files being modified'),
    mutationCount: z.number().optional().describe('Number of mutations made so far'),
    traceHash: z.string().optional().describe('Trace hash for R2/R3 actions'),
  },
  async (args) => {
    const context = buildContext({
      phase: args.phase,
      riskLevel: args.riskLevel,
      role: args.role,
      action: args.action,
      agentId: args.agentId,
      targetFiles: args.targetFiles,
      mutationCount: args.mutationCount,
      traceHash: args.traceHash,
    });

    const result = engine.evaluate(context);

    const response = {
      requestId: result.requestId,
      finalDecision: result.finalDecision,
      phase: context.phase,
      riskLevel: context.riskLevel,
      role: context.role,
      action: context.action,
      durationMs: result.durationMs,
      blockedBy: result.blockedBy || null,
      escalatedBy: result.escalatedBy || null,
      agentGuidance: result.agentGuidance || 'All guards passed. You may proceed with your action.',
      guardResults: result.results.map((r) => ({
        guard: r.guardId,
        decision: r.decision,
        severity: r.severity,
        reason: r.reason,
        guidance: r.agentGuidance || null,
      })),
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  }
);

// ─── Gamma Tool 8: cvf_get_session_memory ─────────────────────────────

server.tool(
  'cvf_get_session_memory',
  'Read the active CVF session memory front door (CVF_SESSION_MEMORY.md) with secret redaction for startup bootstrap.',
  {
    maxChars: z.number().optional().describe('Maximum redacted characters to return (default: 12000, max: 100000)'),
  },
  async (args) => withMcpToolAudit('cvf_get_session_memory', args, async () => {
    const response = getSessionMemory(args.maxChars);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  })
);

// ─── Gamma Tool 9: cvf_get_active_handoff ─────────────────────────────

server.tool(
  'cvf_get_active_handoff',
  'Read the active handoff file named by CVF_SESSION/ACTIVE_SESSION_STATE.json with secret redaction.',
  {
    maxChars: z.number().optional().describe('Maximum redacted characters to return (default: 12000, max: 100000)'),
  },
  async (args) => withMcpToolAudit('cvf_get_active_handoff', args, async () => {
    const response = getActiveHandoff(args.maxChars);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  })
);

// ─── Gamma Tool 10: cvf_get_session_state ─────────────────────────────

server.tool(
  'cvf_get_session_state',
  'Read CVF_SESSION/ACTIVE_SESSION_STATE.json with secret redaction for machine-readable startup state.',
  {
    maxChars: z.number().optional().describe('Maximum redacted characters to return (default: 12000, max: 100000)'),
  },
  async (args) => withMcpToolAudit('cvf_get_session_state', args, async () => {
    const response = getSessionState(args.maxChars);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  })
);

// ─── Gamma Tool 11: cvf_get_startup_acknowledgment ────────────────────

server.tool(
  'cvf_get_startup_acknowledgment',
  'Build the mandatory CVF startup acknowledgment from current session state.',
  {},
  async (args) => withMcpToolAudit('cvf_get_startup_acknowledgment', args, async () => {
    const response = buildStartupAcknowledgment();
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  })
);

// ─── Gamma Tool 12: cvf_get_governance_rules ──────────────────────────

server.tool(
  'cvf_get_governance_rules',
  'Read selected CVF governance rule files by topic (startup, live_run, blindspot, public_sync, mcp_gamma, f1_stop_rule).',
  {
    topic: z.string().optional().describe('Governance topic to load. Default: startup'),
    maxChars: z.number().optional().describe('Maximum redacted characters per file (default: 12000, max: 100000)'),
  },
  async (args) => withMcpToolAudit('cvf_get_governance_rules', args, async () => {
    const response = getGovernanceRules(args.topic, args.maxChars);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  })
);

// ─── Gamma Tool 13: cvf_check_governance_action ───────────────────────

server.tool(
  'cvf_check_governance_action',
  'Classify a planned CVF action and list required governance guards/artifacts before proceeding.',
  {
    action: z.string().describe('Planned governed action to classify.'),
  },
  async (args) => withMcpToolAudit('cvf_check_governance_action', args, async () => {
    const response = checkGovernanceAction(args.action);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  })
);

// ─── Gamma Tool 14: cvf_get_mcp_tool_audit_log ────────────────────────

server.tool(
  'cvf_get_mcp_tool_audit_log',
  'Retrieve the secret-safe in-process audit trail for Gamma MCP memory/governance tool calls.',
  {
    limit: z.number().optional().describe('Maximum entries to return (default: 50, max: 200)'),
  },
  async (args) => withMcpToolAudit('cvf_get_mcp_tool_audit_log', args, async () => {
    const response = getMcpToolAuditSnapshot(args.limit);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  })
);

// ─── D2: Write-Path Tools ─────────────────────────────────────────────
// Contract: cvf.mcpWriteSubmitTools.delta.d2.v1
// Security boundary: docs/reference/CVF_DELTA_D2_MCP_WRITE_TOOLS_SECURITY_BOUNDARY_2026-05-29.md

const D2_CONTRACT = 'cvf.mcpWriteSubmitTools.delta.d2.v1' as const;

const D2_ALLOWED_SUBMIT_ROLES = new Set(['REVIEWER', 'OPERATOR']);
const D2_ALLOWED_ADVANCE_ROLES = new Set(['REVIEWER', 'OPERATOR', 'AI_AGENT']);
const D2_VALID_STAGES = new Set(['intake_gate', 'orchestrator', 'worker', 'reviewer', 'closure_gate']);
const D2_STAGE_ORDER: Record<string, string> = {
  intake_gate: 'orchestrator',
  orchestrator: 'worker',
  worker: 'reviewer',
  reviewer: 'closure_gate',
  closure_gate: 'closure_gate',
};

// ─── Tool D2-A: cvf_submit_review_receipt ─────────────────────────────

server.tool(
  'cvf_submit_review_receipt',
  'Submit a structured CVF review receipt through the governance control plane. Validates schema, writes audit record, and returns confirmation. Allowed roles: REVIEWER, OPERATOR.',
  {
    receiptId: z.string().min(1).max(128).describe('Caller-generated receipt ID'),
    agentRole: z.string().describe('Caller role: REVIEWER or OPERATOR'),
    templateId: z.string().min(1).max(128).describe('Governed template this receipt covers'),
    decision: z.enum(['APPROVE', 'REJECT', 'NEEDS_REVISION']).describe('Review decision'),
    findings: z.array(z.string().max(1000)).describe('List of findings (may be empty)'),
    evidenceRefs: z.array(z.string().max(256)).describe('Referenced receipt IDs or artifact paths'),
    claimBoundary: z.string().min(10).describe('What this review covers (min 10 chars)'),
    qualityScore: z.number().min(0).max(1).optional().describe('Quality score 0.0–1.0'),
  },
  async (args) => withMcpToolAudit('cvf_submit_review_receipt', args as Record<string, unknown>, async () => {
    const role = (args.agentRole || '').toUpperCase();

    if (!D2_ALLOWED_SUBMIT_ROLES.has(role)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({
          contractVersion: D2_CONTRACT,
          tool: 'cvf_submit_review_receipt',
          accepted: false,
          receiptId: args.receiptId,
          auditRecordId: `d2-reject-${Date.now()}`,
          decision: args.decision,
          rejectionReason: `role_not_authorized: role "${args.agentRole}" is not in allowed roles [REVIEWER, OPERATOR]`,
          writtenAt: new Date().toISOString(),
        }, null, 2) }],
      };
    }

    const auditRecordId = `d2-rcpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({
        contractVersion: D2_CONTRACT,
        tool: 'cvf_submit_review_receipt',
        accepted: true,
        receiptId: args.receiptId,
        auditRecordId,
        decision: args.decision,
        writtenAt: new Date().toISOString(),
      }, null, 2) }],
    };
  })
);

// ─── Tool D2-B: cvf_advance_pipeline_stage ────────────────────────────

server.tool(
  'cvf_advance_pipeline_stage',
  'Advance the CVF pipeline to the next stage. Validates stage transition rules, writes audit record, and returns updated state. Allowed roles: REVIEWER, OPERATOR, AI_AGENT.',
  {
    currentStage: z.string().describe('Current pipeline stage: intake_gate, orchestrator, worker, reviewer, or closure_gate'),
    stageResult: z.enum(['completed', 'failed', 'needs_review', 'escalated']).describe('Result of the current stage'),
    agentRole: z.string().describe('Caller role: REVIEWER, OPERATOR, or AI_AGENT'),
    receiptRef: z.string().max(256).optional().describe('Receipt ID proving prior step completed'),
    notes: z.string().max(2000).optional().describe('Optional notes for the audit record'),
  },
  async (args) => withMcpToolAudit('cvf_advance_pipeline_stage', args as Record<string, unknown>, async () => {
    const role = (args.agentRole || '').toUpperCase();
    const stage = args.currentStage;

    if (!D2_ALLOWED_ADVANCE_ROLES.has(role)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({
          contractVersion: D2_CONTRACT,
          tool: 'cvf_advance_pipeline_stage',
          previousStage: stage,
          nextStage: stage,
          advanced: false,
          humanInterventionRequired: false,
          rejectionReason: `role_not_authorized: role "${args.agentRole}" is not in allowed roles [REVIEWER, OPERATOR, AI_AGENT]`,
          auditRecordId: `d2-reject-${Date.now()}`,
          advancedAt: new Date().toISOString(),
        }, null, 2) }],
      };
    }

    if (!D2_VALID_STAGES.has(stage)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({
          contractVersion: D2_CONTRACT,
          tool: 'cvf_advance_pipeline_stage',
          previousStage: stage,
          nextStage: stage,
          advanced: false,
          humanInterventionRequired: false,
          rejectionReason: `validation_error: "${stage}" is not a valid stage`,
          auditRecordId: `d2-reject-${Date.now()}`,
          advancedAt: new Date().toISOString(),
        }, null, 2) }],
      };
    }

    const auditRecordId = `d2-adv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const failed = args.stageResult === 'failed' || args.stageResult === 'escalated';
    const humanRequired = failed;
    const nextStage = failed ? stage : (D2_STAGE_ORDER[stage] ?? stage);
    const advanced = !failed && nextStage !== stage;

    return {
      content: [{ type: 'text' as const, text: JSON.stringify({
        contractVersion: D2_CONTRACT,
        tool: 'cvf_advance_pipeline_stage',
        previousStage: stage,
        nextStage,
        advanced,
        humanInterventionRequired: humanRequired,
        auditRecordId,
        advancedAt: new Date().toISOString(),
      }, null, 2) }],
    };
  })
);

// ─── D3: MCP → CLI Bridge ─────────────────────────────────────────────
// Contract: cvf.mcpCliBridge.delta.d3.v1
// Sandbox boundary: docs/reference/CVF_DELTA_D3_SANDBOX_BOUNDARY_SPEC_2026-05-29.md

const D3_CONTRACT = 'cvf.mcpCliBridge.delta.d3.v1' as const;
const D3_ALLOWED_ROLES = new Set(['OPERATOR', 'ORCHESTRATOR', 'AI_AGENT']);
const D3_COMMAND_WHITELIST = new Set(['evaluate', 'status', 'help']);

// ─── Tool D3: cvf_invoke_cli_stage ────────────────────────────────────

server.tool(
  'cvf_invoke_cli_stage',
  'Invoke a governed CVF CLI stage through the MCP surface. Executes runCli() with whitelisted commands only. Allowed commands: evaluate, status, help. Allowed roles: OPERATOR, ORCHESTRATOR, AI_AGENT.',
  {
    command: z.string().describe('CLI command to invoke: evaluate, status, or help'),
    agentRole: z.string().describe('Caller role: OPERATOR, ORCHESTRATOR, or AI_AGENT'),
    flags: z.record(z.string(), z.string()).optional().describe('Optional CLI flags as key-value pairs'),
    receiptRef: z.string().max(256).optional().describe('Receipt ID from prior D2 stage submission'),
  },
  async (args) => withMcpToolAudit('cvf_invoke_cli_stage', args as Record<string, unknown>, async () => {
    const role = (args.agentRole || '').toUpperCase();
    const command = (args.command || '').toLowerCase().trim();

    if (!D3_ALLOWED_ROLES.has(role)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({
          contractVersion: D3_CONTRACT,
          tool: 'cvf_invoke_cli_stage',
          accepted: false,
          command,
          auditRecordId: `d3-reject-${Date.now()}`,
          rejectionReason: `role_not_authorized: role "${args.agentRole}" is not in allowed roles [OPERATOR, ORCHESTRATOR, AI_AGENT]`,
          invokedAt: new Date().toISOString(),
        }, null, 2) }],
      };
    }

    if (!D3_COMMAND_WHITELIST.has(command)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({
          contractVersion: D3_CONTRACT,
          tool: 'cvf_invoke_cli_stage',
          accepted: false,
          command,
          auditRecordId: `d3-reject-${Date.now()}`,
          rejectionReason: `command_not_whitelisted: "${command}" is not in allowed commands [evaluate, status, help]`,
          invokedAt: new Date().toISOString(),
        }, null, 2) }],
      };
    }

    const auditRecordId = `d3-cli-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Build argv for runCli() from command + flags
    const argv: string[] = [command];
    if (args.flags) {
      for (const [key, value] of Object.entries(args.flags)) {
        argv.push(`--${key}`, String(value));
      }
    }

    let cliResult: { success: boolean; command: string; output: Record<string, unknown>; exitCode: number };
    try {
      cliResult = runCli(argv);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({
          contractVersion: D3_CONTRACT,
          tool: 'cvf_invoke_cli_stage',
          accepted: false,
          command,
          auditRecordId,
          rejectionReason: `cli_execution_error: ${message}`,
          invokedAt: new Date().toISOString(),
        }, null, 2) }],
      };
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify({
        contractVersion: D3_CONTRACT,
        tool: 'cvf_invoke_cli_stage',
        accepted: true,
        command,
        auditRecordId,
        cliSuccess: cliResult.success,
        exitCode: cliResult.exitCode,
        output: cliResult.output,
        invokedAt: new Date().toISOString(),
      }, null, 2) }],
    };
  })
);

// ─── INT-1: Generic MCP Adapter Tools ────────────────────────────────
// Contract: cvf.genericMcpAdapter.int1.v1
// GC-018: docs/baselines/CVF_GC018_INT1_GENERIC_MCP_ADAPTER_2026-05-31.md
// runtimeExecutionAuthorized: false — advisory readout only

const INT1_CONTRACT = 'cvf.genericMcpAdapter.int1.v1' as const;
const INT1_ALLOWED_EVENT_TYPES = new Set([
  'intent.received', 'plan.created', 'tool.requested',
  'execution.state', 'result.produced',
]);

// ─── Tool INT-1-A: cvf_validate_plan ──────────────────────────────────
// Closes CP2 Plan Validator gap from LHW19 T1.

server.tool(
  'cvf_validate_plan',
  'Advisory plan validation gate (CP2). Evaluates plan steps and required tools against CVF risk and forbidden-action policy. Returns advisory decision — does NOT block execution. runtimeExecutionAuthorized=false.',
  {
    planSteps: z.array(z.string()).describe('List of planned execution steps'),
    toolsRequired: z.array(z.string()).describe('Tools the plan intends to call'),
    agentRole: z.string().describe('Caller role, e.g. AI_AGENT, ORCHESTRATOR, OPERATOR'),
    planContext: z.string().max(1000).optional().describe('Optional context about the plan purpose'),
  },
  async (args) => withMcpToolAudit('cvf_validate_plan', args as Record<string, unknown>, async () => {
    const forbiddenPatterns = ['delete_all', 'drop_database', 'rm -rf', 'format_disk'];
    const forbidden = args.planSteps.filter(step =>
      forbiddenPatterns.some(p => step.toLowerCase().includes(p))
    );
    const riskScore = Math.min(args.planSteps.length * 0.1 + args.toolsRequired.length * 0.2, 3.0);
    const advisoryDecision = forbidden.length > 0 ? 'REJECT_ADVISORY' : riskScore > 2.0 ? 'REVIEW_RECOMMENDED' : 'ALLOW_ADVISORY';
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({
        contractVersion: INT1_CONTRACT,
        tool: 'cvf_validate_plan',
        advisoryDecision,
        planRisk: riskScore.toFixed(2),
        forbiddenStepsDetected: forbidden,
        stepCount: args.planSteps.length,
        toolCount: args.toolsRequired.length,
        runtimeExecutionAuthorized: false,
        evaluatedAt: new Date().toISOString(),
      }, null, 2) }],
    };
  })
);

// ─── Tool INT-1-B: cvf_emit_agent_event ───────────────────────────────
// Generic event emitter mapping external framework lifecycle to CVF 5-event model.

server.tool(
  'cvf_emit_agent_event',
  'Emit a CVF governance event from an external agent framework. Routes to the appropriate CVF gate based on eventType. Supported: intent.received, plan.created, tool.requested, execution.state, result.produced.',
  {
    eventType: z.string().describe('CVF event type: intent.received | plan.created | tool.requested | execution.state | result.produced'),
    agentId: z.string().describe('Identifier of the emitting agent'),
    payload: z.record(z.string(), z.unknown()).describe('Event payload — structure varies by eventType'),
  },
  async (args) => withMcpToolAudit('cvf_emit_agent_event', args as Record<string, unknown>, async () => {
    const eventType = args.eventType;
    if (!INT1_ALLOWED_EVENT_TYPES.has(eventType)) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({
          contractVersion: INT1_CONTRACT,
          tool: 'cvf_emit_agent_event',
          accepted: false,
          eventType,
          rejectionReason: `unsupported_event_type: "${eventType}" not in [${[...INT1_ALLOWED_EVENT_TYPES].join(', ')}]`,
          emittedAt: new Date().toISOString(),
        }, null, 2) }],
      };
    }
    const eventId = `int1-evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({
        contractVersion: INT1_CONTRACT,
        tool: 'cvf_emit_agent_event',
        accepted: true,
        eventType,
        eventId,
        agentId: args.agentId,
        runtimeExecutionAuthorized: false,
        emittedAt: new Date().toISOString(),
      }, null, 2) }],
    };
  })
);

// ─── Start Server ─────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CVF MCP Server v1.7.0 running on stdio');
  console.error(`Guards loaded: ${engine.getGuardCount()}`);
  console.error('Gamma startup memory tools loaded: 7');
  console.error(`Session phase: ${engine.getSessionPhase()}`);
}

main().catch((error) => {
  console.error('Failed to start CVF MCP Server:', error);
  process.exit(1);
});

export { server, engine, buildContext, normalizePhase, normalizeRiskLevel, normalizeRole };
