/**
 * Unified Guard Registry — M3.1
 *
 * Single source of truth for all CVF guards across versions:
 * - v1.1.1 guards (governance protocol)
 * - v1.6 guards (web adapter)
 * - v1.7 guards (MCP server)
 *
 * Provides guard discovery, metadata, and cross-version compatibility.
 *
 * @module registry/guard-registry
 */
export class UnifiedGuardRegistry {
    guards = new Map();
    register(guard, metadata) {
        if (this.guards.has(guard.id)) {
            throw new Error(`Guard "${guard.id}" is already registered in the unified registry.`);
        }
        const fullMetadata = {
            id: guard.id,
            name: guard.name,
            description: guard.description,
            priority: guard.priority,
            ...metadata,
        };
        this.guards.set(guard.id, {
            guard,
            metadata: fullMetadata,
            enabled: guard.enabled,
        });
    }
    unregister(guardId) {
        return this.guards.delete(guardId);
    }
    get(guardId) {
        return this.guards.get(guardId);
    }
    getAll() {
        return Array.from(this.guards.values());
    }
    getEnabled() {
        return this.getAll().filter((g) => g.enabled);
    }
    getByCategory(category) {
        return this.getAll().filter((g) => g.metadata.category === category);
    }
    getBySource(source) {
        return this.getAll().filter((g) => g.metadata.source === source);
    }
    getByPhase(phase) {
        return this.getAll().filter((g) => g.metadata.phases.includes(phase));
    }
    getByTag(tag) {
        return this.getAll().filter((g) => g.metadata.tags.includes(tag));
    }
    getForContext(phase, riskLevel) {
        const riskNum = { R0: 0, R1: 1, R2: 2, R3: 3 };
        return this.getEnabled()
            .filter((g) => g.metadata.phases.includes(phase))
            .filter((g) => riskNum[riskLevel] >= riskNum[g.metadata.minRiskLevel])
            .sort((a, b) => a.guard.priority - b.guard.priority);
    }
    enable(guardId) {
        const entry = this.guards.get(guardId);
        if (!entry)
            return false;
        entry.enabled = true;
        entry.guard.enabled = true;
        return true;
    }
    disable(guardId) {
        const entry = this.guards.get(guardId);
        if (!entry)
            return false;
        entry.enabled = false;
        entry.guard.enabled = false;
        return true;
    }
    count() {
        return this.guards.size;
    }
    getStats() {
        const all = this.getAll();
        const byCategory = {};
        const bySource = {};
        const byPhase = {};
        for (const entry of all) {
            const cat = entry.metadata.category;
            byCategory[cat] = (byCategory[cat] || 0) + 1;
            const src = entry.metadata.source;
            bySource[src] = (bySource[src] || 0) + 1;
            for (const phase of entry.metadata.phases) {
                byPhase[phase] = (byPhase[phase] || 0) + 1;
            }
        }
        return {
            totalGuards: all.length,
            enabledGuards: all.filter((g) => g.enabled).length,
            byCategory,
            bySource,
            byPhase,
        };
    }
    toJSON() {
        return {
            guards: this.getAll().map((g) => ({
                id: g.metadata.id,
                name: g.metadata.name,
                category: g.metadata.category,
                source: g.metadata.source,
                priority: g.metadata.priority,
                enabled: g.enabled,
                phases: g.metadata.phases,
                tags: g.metadata.tags,
            })),
            stats: this.getStats(),
        };
    }
}
// ─── Factory: Create registry with all v1.7 guards ───────────────────
import { PhaseGateGuard } from '../guards/phase-gate.guard.js';
import { RiskGateGuard } from '../guards/risk-gate.guard.js';
import { AuthorityGateGuard } from '../guards/authority-gate.guard.js';
import { MutationBudgetGuard } from '../guards/mutation-budget.guard.js';
import { ScopeGuard } from '../guards/scope.guard.js';
import { AuditTrailGuard } from '../guards/audit-trail.guard.js';
const ALL_PHASES = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];
export function createUnifiedRegistry() {
    const registry = new UnifiedGuardRegistry();
    registry.register(new PhaseGateGuard(), {
        version: '1.7.0',
        source: 'v1.7',
        category: 'phase',
        phases: ALL_PHASES,
        minRiskLevel: 'R0',
        tags: ['core', 'phase', 'mandatory'],
    });
    registry.register(new RiskGateGuard(), {
        version: '1.7.0',
        source: 'v1.7',
        category: 'risk',
        phases: ALL_PHASES,
        minRiskLevel: 'R0',
        tags: ['core', 'risk', 'mandatory'],
    });
    registry.register(new AuthorityGateGuard(), {
        version: '1.7.0',
        source: 'v1.7',
        category: 'authority',
        phases: ALL_PHASES,
        minRiskLevel: 'R0',
        tags: ['core', 'authority', 'mandatory'],
    });
    registry.register(new MutationBudgetGuard(), {
        version: '1.7.0',
        source: 'v1.7',
        category: 'budget',
        phases: ['BUILD', 'REVIEW'],
        minRiskLevel: 'R0',
        tags: ['core', 'budget', 'safety'],
    });
    registry.register(new ScopeGuard(), {
        version: '1.7.0',
        source: 'v1.7',
        category: 'scope',
        phases: ['BUILD', 'REVIEW'],
        minRiskLevel: 'R0',
        tags: ['core', 'scope', 'protection'],
    });
    registry.register(new AuditTrailGuard(), {
        version: '1.7.0',
        source: 'v1.7',
        category: 'audit',
        phases: ALL_PHASES,
        minRiskLevel: 'R0',
        tags: ['core', 'audit', 'mandatory'],
    });
    return registry;
}
//# sourceMappingURL=guard-registry.js.map