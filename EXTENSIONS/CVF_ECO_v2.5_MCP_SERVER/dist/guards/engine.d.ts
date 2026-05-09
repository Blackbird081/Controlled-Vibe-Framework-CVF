/**
 * CVF Guard Runtime Engine — MCP Server version
 * Deterministic pipeline that evaluates guards in priority order.
 * Enhanced with agentGuidance for NL explanations.
 * @module guards/engine
 */
import type { Guard, GuardRequestContext, GuardPipelineResult, GuardAuditEntry, GuardRuntimeConfig } from './types.js';
export declare class GuardRuntimeEngine {
    private guards;
    private auditLog;
    private config;
    private sessionPhase;
    constructor(config?: Partial<GuardRuntimeConfig>);
    registerGuard(guard: Guard): void;
    unregisterGuard(guardId: string): boolean;
    getGuard(guardId: string): Guard | undefined;
    getRegisteredGuards(): Guard[];
    getGuardCount(): number;
    evaluate(context: GuardRequestContext): GuardPipelineResult;
    getAuditLog(): readonly GuardAuditEntry[];
    getAuditEntry(requestId: string): GuardAuditEntry | undefined;
    clearAuditLog(): void;
    getAuditLogSize(): number;
    getConfig(): Readonly<GuardRuntimeConfig>;
    updateConfig(updates: Partial<GuardRuntimeConfig>): void;
    getSessionPhase(): string;
    setSessionPhase(phase: string): void;
    private getSortedEnabledGuards;
}
//# sourceMappingURL=engine.d.ts.map