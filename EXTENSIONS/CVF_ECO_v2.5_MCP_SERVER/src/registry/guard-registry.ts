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

import type { Guard, CVFPhase, CVFRiskLevel } from '../guards/types.js';

export interface GuardMetadata {
  id: string;
  name: string;
  description: string;
  priority: number;
  version: string;
  source: 'v1.1.1' | 'v1.6' | 'v1.7' | 'custom';
  category: GuardCategory;
  phases: CVFPhase[];
  minRiskLevel: CVFRiskLevel;
  tags: string[];
}

export type GuardCategory =
  | 'phase'
  | 'risk'
  | 'authority'
  | 'budget'
  | 'scope'
  | 'audit'
  | 'architecture'
  | 'documentation'
  | 'workspace'
  | 'custom';

export interface RegisteredGuard {
  guard: Guard;
  metadata: GuardMetadata;
  enabled: boolean;
}

export interface RegistryStats {
  totalGuards: number;
  enabledGuards: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  byPhase: Record<string, number>;
}

export class UnifiedGuardRegistry {
  private guards: Map<string, RegisteredGuard> = new Map();

  register(guard: Guard, metadata: Omit<GuardMetadata, 'id' | 'name' | 'description' | 'priority'>): void {
    if (this.guards.has(guard.id)) {
      throw new Error(`Guard "${guard.id}" is already registered in the unified registry.`);
    }

    const fullMetadata: GuardMetadata = {
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

  unregister(guardId: string): boolean {
    return this.guards.delete(guardId);
  }

  get(guardId: string): RegisteredGuard | undefined {
    return this.guards.get(guardId);
  }

  getAll(): RegisteredGuard[] {
    return Array.from(this.guards.values());
  }

  getEnabled(): RegisteredGuard[] {
    return this.getAll().filter((g) => g.enabled);
  }

  getByCategory(category: GuardCategory): RegisteredGuard[] {
    return this.getAll().filter((g) => g.metadata.category === category);
  }

  getBySource(source: string): RegisteredGuard[] {
    return this.getAll().filter((g) => g.metadata.source === source);
  }

  getByPhase(phase: CVFPhase): RegisteredGuard[] {
    return this.getAll().filter((g) => g.metadata.phases.includes(phase));
  }

  getByTag(tag: string): RegisteredGuard[] {
    return this.getAll().filter((g) => g.metadata.tags.includes(tag));
  }

  getForContext(phase: CVFPhase, riskLevel: CVFRiskLevel): RegisteredGuard[] {
    const riskNum: Record<CVFRiskLevel, number> = { R0: 0, R1: 1, R2: 2, R3: 3 };
    return this.getEnabled()
      .filter((g) => g.metadata.phases.includes(phase))
      .filter((g) => riskNum[riskLevel] >= riskNum[g.metadata.minRiskLevel])
      .sort((a, b) => a.guard.priority - b.guard.priority);
  }

  enable(guardId: string): boolean {
    const entry = this.guards.get(guardId);
    if (!entry) return false;
    entry.enabled = true;
    entry.guard.enabled = true;
    return true;
  }

  disable(guardId: string): boolean {
    const entry = this.guards.get(guardId);
    if (!entry) return false;
    entry.enabled = false;
    entry.guard.enabled = false;
    return true;
  }

  count(): number {
    return this.guards.size;
  }

  getStats(): RegistryStats {
    const all = this.getAll();
    const byCategory: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byPhase: Record<string, number> = {};

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

  toJSON(): object {
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

const ALL_PHASES: CVFPhase[] = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];

export function createUnifiedRegistry(): UnifiedGuardRegistry {
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
