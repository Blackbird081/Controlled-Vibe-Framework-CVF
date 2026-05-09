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
import { GuardRuntimeEngine } from './guards/index.js';
import type { CVFPhase, CVFRiskLevel, CVFRole, GuardRequestContext } from './guards/types.js';
declare const engine: GuardRuntimeEngine;
declare function buildContext(args: {
    phase?: string;
    riskLevel?: string;
    role?: string;
    action?: string;
    agentId?: string;
    targetFiles?: string[];
    mutationCount?: number;
    traceHash?: string;
}): GuardRequestContext;
declare function normalizePhase(raw?: string): CVFPhase;
declare function normalizeRiskLevel(raw?: string): CVFRiskLevel;
declare function normalizeRole(raw?: string): CVFRole;
declare const server: McpServer;
export { server, engine, buildContext, normalizePhase, normalizeRiskLevel, normalizeRole };
//# sourceMappingURL=index.d.ts.map