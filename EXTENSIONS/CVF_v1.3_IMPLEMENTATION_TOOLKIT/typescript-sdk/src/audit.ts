/**
 * CVF TypeScript SDK - Audit Logger
 */

import type {
    AuditLogEntry,
    SkillContract,
    ExecutionResult
} from './types';

/**
 * Generate unique ID
 */
function generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Audit Tracer - logs all capability executions
 */
export class AuditTracer {
    private logs: AuditLogEntry[] = [];
    private maxLogs: number;

    constructor(maxLogs = 10000) {
        this.maxLogs = maxLogs;
    }

    /**
     * Log an execution
     */
    log(
        contract: SkillContract,
        actor: string,
        inputs: Record<string, unknown>,
        result: ExecutionResult
    ): AuditLogEntry {
        const entry: AuditLogEntry = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            capability_id: contract.capability_id,
            version: contract.version,
            actor,
            inputs: this.sanitizeInputs(inputs, contract),
            outputs: result.success ? result.outputs as Record<string, unknown> : null,
            success: result.success,
            error: result.error,
            duration_ms: result.duration_ms
        };

        this.logs.push(entry);

        // Trim if over limit
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        return entry;
    }

    /**
     * Sanitize inputs based on trace level
     */
    private sanitizeInputs(
        inputs: Record<string, unknown>,
        contract: SkillContract
    ): Record<string, unknown> {
        if (contract.audit.trace_level === 'Minimal') {
            // Only log required fields
            const sanitized: Record<string, unknown> = {};
            for (const field of contract.audit.required_fields) {
                if (field in inputs) {
                    sanitized[field] = inputs[field];
                }
            }
            return sanitized;
        }

        if (contract.audit.trace_level === 'Standard') {
            // Log all but redact sensitive fields
            const sensitiveFields = ['password', 'token', 'secret', 'key', 'api_key'];
            const sanitized = { ...inputs };
            for (const field of sensitiveFields) {
                if (field in sanitized) {
                    sanitized[field] = '[REDACTED]';
                }
            }
            return sanitized;
        }

        // Full trace - log everything
        return inputs;
    }

    /**
     * Get logs for a capability
     */
    getLogsFor(capabilityId: string, limit = 100): AuditLogEntry[] {
        return this.logs
            .filter(log => log.capability_id === capabilityId)
            .slice(-limit);
    }

    /**
     * Get recent logs
     */
    getRecent(limit = 100): AuditLogEntry[] {
        return this.logs.slice(-limit);
    }

    /**
     * Get failed executions
     */
    getFailures(limit = 100): AuditLogEntry[] {
        return this.logs
            .filter(log => !log.success)
            .slice(-limit);
    }

    /**
     * Get stats
     */
    getStats(): Record<string, number | string> {
        const total = this.logs.length;
        const successful = this.logs.filter(l => l.success).length;
        const avgDuration = total > 0
            ? this.logs.reduce((sum, l) => sum + l.duration_ms, 0) / total
            : 0;

        return {
            total_executions: total,
            successful: successful,
            failed: total - successful,
            success_rate: total > 0 ? `${((successful / total) * 100).toFixed(1)}%` : '0%',
            avg_duration_ms: Math.round(avgDuration)
        };
    }

    /**
     * Export logs
     */
    export(): AuditLogEntry[] {
        return [...this.logs];
    }

    /**
     * Clear logs
     */
    clear(): void {
        this.logs = [];
    }
}
