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
import { createGuardEngine, PHASE_ORDER, PHASE_DESCRIPTIONS, RISK_DESCRIPTIONS, } from './guards/index.js';
// ─── Singleton Guard Engine ───────────────────────────────────────────
const engine = createGuardEngine();
// ─── Helper: Build context from tool arguments ────────────────────────
function buildContext(args) {
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
function normalizePhase(raw) {
    if (!raw)
        return engine.getSessionPhase() || 'DISCOVERY';
    const upper = raw.trim().toUpperCase();
    if (upper === 'DISCOVERY' || upper === 'PHASE A' || upper === 'A')
        return 'DISCOVERY';
    if (upper === 'DESIGN' || upper === 'PHASE B' || upper === 'B')
        return 'DESIGN';
    if (upper === 'BUILD' || upper === 'PHASE C' || upper === 'C')
        return 'BUILD';
    if (upper === 'REVIEW' || upper === 'PHASE D' || upper === 'D')
        return 'REVIEW';
    return 'BUILD';
}
function normalizeRiskLevel(raw) {
    if (!raw)
        return 'R0';
    const upper = raw.trim().toUpperCase();
    if (upper === 'R0' || upper === 'LOW' || upper === 'SAFE')
        return 'R0';
    if (upper === 'R1' || upper === 'MEDIUM' || upper === 'ATTENTION')
        return 'R1';
    if (upper === 'R2' || upper === 'HIGH' || upper === 'ELEVATED')
        return 'R2';
    if (upper === 'R3' || upper === 'CRITICAL' || upper === 'DANGEROUS')
        return 'R3';
    return 'R0';
}
function normalizeRole(raw) {
    if (!raw)
        return 'AI_AGENT';
    const upper = raw.trim().toUpperCase();
    if (upper === 'HUMAN' || upper === 'USER')
        return 'HUMAN';
    if (upper === 'REVIEWER')
        return 'REVIEWER';
    if (upper === 'OPERATOR')
        return 'OPERATOR';
    return 'AI_AGENT';
}
// ─── Create MCP Server ────────────────────────────────────────────────
const server = new McpServer({
    name: 'cvf-guard-server',
    version: '1.7.0',
});
// ─── Tool 1: cvf_check_phase_gate ─────────────────────────────────────
server.tool('cvf_check_phase_gate', 'Check if an action is allowed in the current CVF phase. CVF uses 4 phases: DISCOVERY → DESIGN → BUILD → REVIEW. Each phase has authorized roles.', {
    phase: z.string().optional().describe('Current phase: DISCOVERY, DESIGN, BUILD, or REVIEW'),
    role: z.string().optional().describe('Role: HUMAN, AI_AGENT, REVIEWER, or OPERATOR'),
    action: z.string().describe('The action being attempted'),
}, async (args) => {
    const context = buildContext({ phase: args.phase, role: args.role, action: args.action });
    const phaseGuard = engine.getGuard('phase_gate');
    if (!phaseGuard) {
        return { content: [{ type: 'text', text: 'ERROR: Phase gate guard not registered.' }] };
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
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    };
});
// ─── Tool 2: cvf_check_risk_gate ──────────────────────────────────────
server.tool('cvf_check_risk_gate', 'Evaluate the risk level of an action. CVF uses R0 (Safe) → R3 (Critical). AI agents are blocked at R3 and escalated at R2.', {
    riskLevel: z.string().describe('Risk level: R0 (safe), R1 (low), R2 (elevated), R3 (critical)'),
    role: z.string().optional().describe('Role performing the action'),
    action: z.string().describe('The action being evaluated'),
}, async (args) => {
    const context = buildContext({ riskLevel: args.riskLevel, role: args.role, action: args.action });
    const riskGuard = engine.getGuard('risk_gate');
    if (!riskGuard) {
        return { content: [{ type: 'text', text: 'ERROR: Risk gate guard not registered.' }] };
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
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    };
});
// ─── Tool 3: cvf_check_authority ──────────────────────────────────────
server.tool('cvf_check_authority', 'Verify if a role is authorized to perform a specific action. Some actions like approve, merge, deploy are restricted for AI agents.', {
    role: z.string().optional().describe('Role: HUMAN, AI_AGENT, REVIEWER, or OPERATOR'),
    action: z.string().describe('The action to check authorization for'),
}, async (args) => {
    const context = buildContext({ role: args.role, action: args.action });
    const authorityGuard = engine.getGuard('authority_gate');
    if (!authorityGuard) {
        return { content: [{ type: 'text', text: 'ERROR: Authority gate guard not registered.' }] };
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
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    };
});
// ─── Tool 4: cvf_validate_output ──────────────────────────────────────
server.tool('cvf_validate_output', 'Validate AI-generated output for quality, safety, and completeness before presenting to the user.', {
    output: z.string().describe('The AI-generated output to validate'),
    intent: z.string().describe('The original user intent/request'),
    minLength: z.number().optional().describe('Minimum acceptable length (default: 50)'),
}, async (args) => {
    const issues = [];
    let decision = 'PASS';
    if (!args.output || args.output.trim().length === 0) {
        issues.push('EMPTY_OUTPUT');
        decision = 'RETRY';
    }
    else {
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
            if (decision === 'PASS')
                decision = 'WARN';
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
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    };
});
// ─── Tool 5: cvf_advance_phase ────────────────────────────────────────
server.tool('cvf_advance_phase', 'Request advancement to the next CVF phase. Phases must progress in order: DISCOVERY → DESIGN → BUILD → REVIEW.', {
    currentPhase: z.string().optional().describe('Current phase (auto-detected if omitted)'),
    completionEvidence: z.string().describe('Evidence that current phase is complete'),
}, async (args) => {
    const currentPhase = normalizePhase(args.currentPhase || engine.getSessionPhase());
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    if (currentIndex === PHASE_ORDER.length - 1) {
        return {
            content: [{
                    type: 'text',
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
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    };
});
// ─── Tool 6: cvf_get_audit_log ────────────────────────────────────────
server.tool('cvf_get_audit_log', 'Retrieve the CVF audit trail for the current session. Shows all guard decisions and phase transitions.', {
    requestId: z.string().optional().describe('Filter by specific request ID'),
    limit: z.number().optional().describe('Maximum entries to return (default: 20)'),
}, async (args) => {
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
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    };
});
// ─── Tool 7: cvf_evaluate_full ────────────────────────────────────────
server.tool('cvf_evaluate_full', 'Run the FULL CVF guard pipeline on an action. Evaluates all 6 guards (phase, risk, authority, mutation budget, scope, audit trail) and returns a consolidated decision with guidance.', {
    phase: z.string().optional().describe('Current phase: DISCOVERY, DESIGN, BUILD, or REVIEW'),
    riskLevel: z.string().optional().describe('Risk level: R0, R1, R2, or R3'),
    role: z.string().optional().describe('Role: HUMAN, AI_AGENT, REVIEWER, or OPERATOR'),
    action: z.string().describe('The action being attempted'),
    agentId: z.string().optional().describe('Agent identifier (required for AI_AGENT role)'),
    targetFiles: z.array(z.string()).optional().describe('Files being modified'),
    mutationCount: z.number().optional().describe('Number of mutations made so far'),
    traceHash: z.string().optional().describe('Trace hash for R2/R3 actions'),
}, async (args) => {
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
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    };
});
// ─── Start Server ─────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('CVF MCP Server v1.7.0 running on stdio');
    console.error(`Guards loaded: ${engine.getGuardCount()}`);
    console.error(`Session phase: ${engine.getSessionPhase()}`);
}
main().catch((error) => {
    console.error('Failed to start CVF MCP Server:', error);
    process.exit(1);
});
export { server, engine, buildContext, normalizePhase, normalizeRiskLevel, normalizeRole };
//# sourceMappingURL=index.js.map