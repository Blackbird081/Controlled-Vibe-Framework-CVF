/**
 * CVF Guard Types — Shared type definitions for MCP Server
 * @module guards/types
 */
export const PHASE_ORDER = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];
export const RISK_NUMERIC = {
    R0: 0,
    R1: 1,
    R2: 2,
    R3: 3,
};
export const DEFAULT_GUARD_RUNTIME_CONFIG = {
    enableAuditLog: true,
    strictMode: true,
    maxGuardsPerPipeline: 20,
    defaultDecision: 'ALLOW',
    escalationThreshold: 'R2',
};
//# sourceMappingURL=types.js.map