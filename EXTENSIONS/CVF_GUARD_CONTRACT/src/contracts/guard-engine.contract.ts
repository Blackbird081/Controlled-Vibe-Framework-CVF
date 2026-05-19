/**
 * CVF Canonical GuardEngine Contract — Phase 1.P
 * ================================================
 * Authoritative interface binding all GuardEngine / GuardRuntimeEngine surfaces
 * to the canonical home: CVF_GUARD_CONTRACT/src/engine.ts (GuardRuntimeEngine).
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_1P_POLICY_RISK_GUARD_CONVERGENCE_2026-05-18.md
 * Owner: CVF_GUARD_CONTRACT/src/engine.ts — confirmed as canonical GuardEngine
 *        home by Phase 1.0 owner map (kernel surface #5, disposition: owned).
 *
 * SCOPE: Contract definition and adapter documentation only.
 *        No runtime wire-up (Phase 2.B). GuardRuntimeEngine is NOT modified.
 */

import type { RiskLevel } from './policy-decision.contract';

// ─── Guard Adapter Interface ──────────────────────────────────────────────────

/**
 * Minimum interface that domain GuardEngine adapters must satisfy to be
 * registered with the canonical GuardRuntimeEngine.
 *
 * Domain guard implementations (CVF_ECO_v1.3_DOMAIN_GUARDS, etc.) must
 * implement this interface. They must NOT extend GuardRuntimeEngine directly —
 * they register Guard instances into it.
 *
 * The Guard interface already exists in CVF_GUARD_CONTRACT/src/types.ts.
 * This file documents the adapter obligation explicitly for Phase 1.P.
 */
export interface GuardEngineAdapter {
  /**
   * The guard instance(s) this adapter contributes.
   * Each guard is registered into GuardRuntimeEngine via registerGuard().
   */
  contributeGuards(): ReadonlyArray<GuardContribution>;
  /** Domain identifier for this adapter. */
  readonly domainId: string;
}

/** A single guard contribution from a domain adapter. */
export interface GuardContribution {
  /** Must match the Guard.id field used in CVF_GUARD_CONTRACT/src/types.ts. */
  readonly guardId: string;
  /** R-scale level at which this guard triggers. */
  readonly triggerLevel: RiskLevel;
  /** Human-readable description for audit. */
  readonly description: string;
}

// ─── Canonical Home Declaration ───────────────────────────────────────────────

/**
 * Canonical GuardEngine home declaration.
 * References the confirmed canonical implementation — not a re-export,
 * just a documentation anchor for Phase 1.P adapter mapping.
 *
 * Canonical class:    GuardRuntimeEngine
 * Canonical file:     EXTENSIONS/CVF_GUARD_CONTRACT/src/engine.ts
 * Canonical package:  cvf-guard-contract
 * Import path:        import { GuardRuntimeEngine } from 'cvf-guard-contract'
 */
export const CANONICAL_GUARD_ENGINE = {
  class: 'GuardRuntimeEngine',
  file: 'EXTENSIONS/CVF_GUARD_CONTRACT/src/engine.ts',
  package: 'cvf-guard-contract',
  importPath: "import { GuardRuntimeEngine } from 'cvf-guard-contract'",
} as const;

// ─── Domain Adapter Map ───────────────────────────────────────────────────────

/**
 * Phase 1.0 GuardEngine surfaces adapter map.
 * All 7 surfaces from the drift inventory classified.
 * node_modules copies are not production surfaces — excluded from adapter map.
 */
export const GUARD_ENGINE_ADAPTER_MAP = [
  {
    adapterId: 'domain-guards-guard-engine',
    sourcePath: 'EXTENSIONS/CVF_ECO_v1.3_DOMAIN_GUARDS/src/guard.engine.ts',
    domain: 'CVF_ECO_v1.3_DOMAIN_GUARDS',
    disposition: 'adapter' as const,
    migrationPath: 'Implement GuardEngineAdapter; contribute guards via registerGuard() into GuardRuntimeEngine',
    hasConformanceStub: true,
  },
  {
    adapterId: 'mcp-server-guard-engine',
    sourcePath: 'EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/guards/engine.ts',
    domain: 'CVF_ECO_v2.5_MCP_SERVER',
    disposition: 'adapter' as const,
    migrationPath: 'Implement GuardEngineAdapter; delegate evaluation to canonical GuardRuntimeEngine',
    hasConformanceStub: true,
  },
  {
    adapterId: 'guard-contract-engine',
    sourcePath: 'EXTENSIONS/CVF_GUARD_CONTRACT/src/engine.ts',
    domain: 'CVF_GUARD_CONTRACT',
    disposition: 'canonical_contract' as const,
    migrationPath: 'No migration — this IS the canonical home',
    hasConformanceStub: false,
  },
  // node_modules copies below — not production surfaces; no adapter required
  {
    adapterId: 'mcp-server-node-modules-guard-engine',
    sourcePath: 'EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/node_modules/cvf-guard-contract/src/engine.ts',
    domain: 'CVF_ECO_v2.5_MCP_SERVER (node_modules)',
    disposition: 'legacy_reference' as const,
    migrationPath: 'npm install update — not a manual migration target',
    hasConformanceStub: false,
  },
  {
    adapterId: 'plane-facades-node-modules-guard-engine',
    sourcePath: 'EXTENSIONS/CVF_PLANE_FACADES/node_modules/cvf-guard-contract/src/engine.ts',
    domain: 'CVF_PLANE_FACADES (node_modules)',
    disposition: 'legacy_reference' as const,
    migrationPath: 'npm install update — not a manual migration target',
    hasConformanceStub: false,
  },
  {
    adapterId: 'agent-platform-node-modules-guard-engine',
    sourcePath: 'EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/node_modules/cvf-guard-contract/src/engine.ts',
    domain: 'CVF_v1.6_AGENT_PLATFORM (node_modules)',
    disposition: 'legacy_reference' as const,
    migrationPath: 'npm install update — not a manual migration target',
    hasConformanceStub: false,
  },
  {
    adapterId: 'mcp-server-dist-guard-engine',
    sourcePath: 'EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/dist/guards/engine.d.ts',
    domain: 'CVF_ECO_v2.5_MCP_SERVER (dist)',
    disposition: 'legacy_reference' as const,
    migrationPath: 'Build artifact — not a manual migration target',
    hasConformanceStub: false,
  },
] as const;

// ─── Adapter Registration ─────────────────────────────────────────────────────

export interface GuardEngineAdapterMeta {
  readonly adapterId: string;
  readonly domain: string;
  readonly sourcePath: string;
  readonly disposition: 'adapter' | 'canonical_contract' | 'legacy_reference' | 'deprecate_candidate';
  readonly migrationPath: string;
  readonly hasConformanceStub: boolean;
}
