/**
 * CVF Guard Runtime Engine — MCP Server version
 * Deterministic pipeline that evaluates guards in priority order.
 * Enhanced with agentGuidance for NL explanations.
 * @module guards/engine
 */
import { DEFAULT_GUARD_RUNTIME_CONFIG } from './types.js';
export class GuardRuntimeEngine {
    guards = new Map();
    auditLog = [];
    config;
    sessionPhase = 'DISCOVERY';
    constructor(config) {
        this.config = { ...DEFAULT_GUARD_RUNTIME_CONFIG, ...config };
    }
    registerGuard(guard) {
        if (this.guards.size >= this.config.maxGuardsPerPipeline) {
            throw new Error(`Guard pipeline limit reached: ${this.config.maxGuardsPerPipeline}. Cannot register guard "${guard.id}".`);
        }
        if (this.guards.has(guard.id)) {
            throw new Error(`Guard "${guard.id}" is already registered.`);
        }
        this.guards.set(guard.id, guard);
    }
    unregisterGuard(guardId) {
        return this.guards.delete(guardId);
    }
    getGuard(guardId) {
        return this.guards.get(guardId);
    }
    getRegisteredGuards() {
        return Array.from(this.guards.values());
    }
    getGuardCount() {
        return this.guards.size;
    }
    evaluate(context) {
        const startTime = Date.now();
        const results = [];
        const sortedGuards = this.getSortedEnabledGuards();
        let finalDecision = this.config.defaultDecision;
        let blockedBy;
        let escalatedBy;
        for (const guard of sortedGuards) {
            const result = guard.evaluate(context);
            results.push(result);
            if (result.decision === 'BLOCK') {
                finalDecision = 'BLOCK';
                blockedBy = guard.id;
                if (this.config.strictMode) {
                    break;
                }
            }
            if (result.decision === 'ESCALATE' && finalDecision !== 'BLOCK') {
                finalDecision = 'ESCALATE';
                if (!escalatedBy) {
                    escalatedBy = guard.id;
                }
            }
        }
        const guidanceParts = [];
        for (const r of results) {
            if (r.agentGuidance) {
                guidanceParts.push(r.agentGuidance);
            }
        }
        const pipelineResult = {
            requestId: context.requestId,
            finalDecision,
            results,
            executedAt: new Date().toISOString(),
            durationMs: Date.now() - startTime,
            blockedBy,
            escalatedBy,
            agentGuidance: guidanceParts.length > 0 ? guidanceParts.join(' ') : undefined,
        };
        if (this.config.enableAuditLog) {
            this.auditLog.push({
                requestId: context.requestId,
                timestamp: pipelineResult.executedAt,
                context,
                pipelineResult,
            });
        }
        return pipelineResult;
    }
    getAuditLog() {
        return this.auditLog;
    }
    getAuditEntry(requestId) {
        return this.auditLog.find((e) => e.requestId === requestId);
    }
    clearAuditLog() {
        this.auditLog = [];
    }
    getAuditLogSize() {
        return this.auditLog.length;
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
    getSessionPhase() {
        return this.sessionPhase;
    }
    setSessionPhase(phase) {
        this.sessionPhase = phase;
    }
    getSortedEnabledGuards() {
        return Array.from(this.guards.values())
            .filter((g) => g.enabled)
            .sort((a, b) => a.priority - b.priority);
    }
}
//# sourceMappingURL=engine.js.map