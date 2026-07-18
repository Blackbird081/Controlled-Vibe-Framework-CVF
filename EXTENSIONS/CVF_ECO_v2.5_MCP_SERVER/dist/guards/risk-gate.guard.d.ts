/**
 * Risk Gate Guard — Enforces CVF R0-R3 risk model with NL guidance
 * @module guards/risk-gate.guard
 */
import type { Guard, GuardRequestContext, GuardResult, CVFRiskLevel } from './types.js';
export declare const RISK_DESCRIPTIONS: Record<CVFRiskLevel, string>;
export declare const MCP_RISK_GATE_ADAPTER_VERSION = "phase2b-mcp-risk-gate-adapter-1";
export interface McpRiskGateAdapterSnapshot {
    version: typeof MCP_RISK_GATE_ADAPTER_VERSION;
    source: 'eco-v2.5:mcp-risk-gate';
    requestId: string;
    riskLevel: CVFRiskLevel;
    role: GuardRequestContext['role'];
    riskNumeric: number | null;
    decision: GuardResult['decision'];
    severity: GuardResult['severity'];
    suggestedAction?: string;
}
export declare class RiskGateGuard implements Guard {
    id: string;
    name: string;
    description: string;
    priority: number;
    enabled: boolean;
    evaluate(context: GuardRequestContext): GuardResult;
    evaluateWithAdapter(context: GuardRequestContext): {
        result: GuardResult;
        adapter: McpRiskGateAdapterSnapshot;
    };
}
//# sourceMappingURL=risk-gate.guard.d.ts.map