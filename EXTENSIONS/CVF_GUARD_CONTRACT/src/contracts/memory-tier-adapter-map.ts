/**
 * CVF Phase 1.M — Memory-Home Tier Adapter Map
 * ==============================================
 * Classifies Phase 1.0 memory-home surfaces and the Phase 1.M canonical
 * tier anchors. The Phase 1.0 drift inventory found 1 explicit MemoryHome
 * file (a false positive). This map supplements with confirmed production
 * surfaces that serve as canonical homes for each memory tier.
 *
 * Source inventory: docs/reviews/CVF_17_05_STABILIZATION_DRIFT_INVENTORY_2026-05-17.md
 * Alias table:      docs/reviews/CVF_17_05_KERNEL_TERMINOLOGY_ALIAS_TABLE_2026-05-17.md
 * Authorized by:    docs/baselines/CVF_GC018_PHASE_1M_MEMORY_HOME_TIER_MAP_2026-05-18.md
 *
 * SCOPE: Tier assignment and classification only. No existing code modified.
 */

import type { MemoryTierAdapterMeta } from './memory-tier.contract';

export const MEMORY_TIER_ADAPTER_MAP: ReadonlyArray<MemoryTierAdapterMeta> = [
  // ── Phase 1.0 inventory surface (false positive) ──────────────────────────

  {
    adapterId: 'mcp-server-express-rate-limit-dist',
    domain: 'CVF_ECO_v2.5_MCP_SERVER',
    sourcePath: 'EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/node_modules/express-rate-limit/dist/index.d.ts',
    assignedTier: 'false-positive',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'Matched rg pattern but contains no CVF memory tier — express-rate-limit dist artifact',
  },

  // ── Working Memory tier — canonical home ─────────────────────────────────

  {
    adapterId: 'cpf-agent-governed-session-contract-working',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.governed.session.contract.ts',
    assignedTier: 'working',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    migrationNote: 'Active session context — canonical home for working memory tier',
  },

  // ── Task Memory tier — canonical home ─────────────────────────────────────

  {
    adapterId: 'epf-execution-pipeline-contract-task',
    domain: 'CVF_EXECUTION_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.pipeline.contract.ts',
    assignedTier: 'task',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    migrationNote: 'Task-scoped execution state — canonical home for task memory tier',
  },
  {
    adapterId: 'epf-execution-bridge-consumer-contract-task',
    domain: 'CVF_EXECUTION_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.bridge.consumer.contract.ts',
    assignedTier: 'task',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },

  // ── Skill Memory tier — canonical home ────────────────────────────────────

  {
    adapterId: 'lpf-controlled-memory-gateway-contract-skill',
    domain: 'CVF_LEARNING_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts',
    assignedTier: 'skill',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    migrationNote: 'Controlled skill memory gateway — canonical home for skill memory tier',
  },

  // ── Audit Memory tier — canonical home ───────────────────────────────────

  {
    adapterId: 'guard-contract-trace-emitter-audit',
    domain: 'CVF_GUARD_CONTRACT',
    sourcePath: 'EXTENSIONS/CVF_GUARD_CONTRACT/src/audit/trace-emitter.ts',
    assignedTier: 'audit',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    migrationNote: 'Immutable audit trace emitter — canonical home for audit memory tier',
  },
  {
    adapterId: 'guard-contract-sqlite-db-audit',
    domain: 'CVF_GUARD_CONTRACT',
    sourcePath: 'EXTENSIONS/CVF_GUARD_CONTRACT/src/audit/sqlite-db.ts',
    assignedTier: 'audit',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },

  // ── Receipt Memory tier — canonical home ─────────────────────────────────

  {
    adapterId: 'guard-contract-receipt-envelope-receipt',
    domain: 'CVF_GUARD_CONTRACT',
    sourcePath: 'EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/receipt-envelope.contract.ts',
    assignedTier: 'receipt',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    migrationNote: 'Phase 1.R canonical Receipt envelope — canonical home for receipt memory tier',
  },
  {
    adapterId: 'model-gateway-gateway-receipt-receipt',
    domain: 'CVF_MODEL_GATEWAY',
    sourcePath: 'EXTENSIONS/CVF_MODEL_GATEWAY/src/gateway-receipt.ts',
    assignedTier: 'receipt',
    disposition: 'adapter',
    hasConformanceStub: true,
    migrationNote: 'Gateway domain receipt producer — Phase 2.B: wrap in canonical Receipt envelope',
  },
] as const;
