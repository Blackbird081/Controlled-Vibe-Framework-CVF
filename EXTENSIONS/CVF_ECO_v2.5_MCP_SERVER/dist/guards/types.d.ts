/**
 * CVF Guard Types — Shared type definitions for MCP Server
 * @module guards/types
 */
export type CVFPhase = 'DISCOVERY' | 'DESIGN' | 'BUILD' | 'REVIEW';
export type CVFRiskLevel = 'R0' | 'R1' | 'R2' | 'R3';
export type CVFRole = 'HUMAN' | 'AI_AGENT' | 'REVIEWER' | 'OPERATOR';
export type GuardDecision = 'ALLOW' | 'BLOCK' | 'ESCALATE';
export type GuardSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
export interface GuardResult {
    guardId: string;
    decision: GuardDecision;
    severity: GuardSeverity;
    reason: string;
    timestamp: string;
    agentGuidance?: string;
    suggestedAction?: string;
    metadata?: Record<string, unknown>;
}
export interface GuardRequestContext {
    requestId: string;
    phase: CVFPhase;
    riskLevel: CVFRiskLevel;
    role: CVFRole;
    agentId?: string;
    action: string;
    targetFiles?: string[];
    mutationCount?: number;
    mutationBudget?: number;
    scope?: string;
    traceHash?: string;
    metadata?: Record<string, unknown>;
}
export interface Guard {
    id: string;
    name: string;
    description: string;
    priority: number;
    enabled: boolean;
    evaluate(context: GuardRequestContext): GuardResult;
}
export interface GuardPipelineResult {
    requestId: string;
    finalDecision: GuardDecision;
    results: GuardResult[];
    executedAt: string;
    durationMs: number;
    blockedBy?: string;
    escalatedBy?: string;
    agentGuidance?: string;
}
export interface GuardAuditEntry {
    requestId: string;
    timestamp: string;
    context: GuardRequestContext;
    pipelineResult: GuardPipelineResult;
}
export interface GuardRuntimeConfig {
    enableAuditLog: boolean;
    strictMode: boolean;
    maxGuardsPerPipeline: number;
    defaultDecision: GuardDecision;
    escalationThreshold: CVFRiskLevel;
}
export declare const PHASE_ORDER: CVFPhase[];
export declare const RISK_NUMERIC: Record<CVFRiskLevel, number>;
export declare const DEFAULT_GUARD_RUNTIME_CONFIG: GuardRuntimeConfig;
//# sourceMappingURL=types.d.ts.map