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
export type GuardCategory = 'phase' | 'risk' | 'authority' | 'budget' | 'scope' | 'audit' | 'architecture' | 'documentation' | 'workspace' | 'custom';
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
export declare class UnifiedGuardRegistry {
    private guards;
    register(guard: Guard, metadata: Omit<GuardMetadata, 'id' | 'name' | 'description' | 'priority'>): void;
    unregister(guardId: string): boolean;
    get(guardId: string): RegisteredGuard | undefined;
    getAll(): RegisteredGuard[];
    getEnabled(): RegisteredGuard[];
    getByCategory(category: GuardCategory): RegisteredGuard[];
    getBySource(source: string): RegisteredGuard[];
    getByPhase(phase: CVFPhase): RegisteredGuard[];
    getByTag(tag: string): RegisteredGuard[];
    getForContext(phase: CVFPhase, riskLevel: CVFRiskLevel): RegisteredGuard[];
    enable(guardId: string): boolean;
    disable(guardId: string): boolean;
    count(): number;
    getStats(): RegistryStats;
    toJSON(): object;
}
export declare function createUnifiedRegistry(): UnifiedGuardRegistry;
//# sourceMappingURL=guard-registry.d.ts.map