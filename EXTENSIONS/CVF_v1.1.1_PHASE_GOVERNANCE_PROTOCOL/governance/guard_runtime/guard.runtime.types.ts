/**
 * Guard Runtime Types — Re-export Wrapper
 * ========================================
 * DEPRECATED: This file no longer defines types locally.
 * All canonical types are defined in `cvf-guard-contract` (CVF_GUARD_CONTRACT).
 *
 * This re-export wrapper preserves backward compatibility for existing imports
 * within CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL without requiring mass refactoring.
 *
 * Phase 3 BV-01 Resolution: Duplicate types → single source of truth.
 *
 * @see CVF_GUARD_CONTRACT/src/types.ts — canonical source
 */

// Re-export ALL types from canonical source
export type {
  CanonicalCVFPhase,
  LegacyCVFPhaseAlias,
  CVFPhase,
  CVFPhaseInput,
  CVFRiskLevel,
  CVFRole,
  GuardDecision,
  GuardSeverity,
  GuardResult,
  GuardRequestContext,
  Guard,
  GuardPipelineResult,
  GuardAuditEntry,
  GuardRuntimeConfig,
  MandatoryGuardId,
} from '../../../CVF_GUARD_CONTRACT/src/types';

// Re-export constants
export {
  DEFAULT_GUARD_RUNTIME_CONFIG,
  MANDATORY_GUARD_IDS,
  PHASE_ORDER,
  RISK_NUMERIC,
} from '../../../CVF_GUARD_CONTRACT/src/types';
