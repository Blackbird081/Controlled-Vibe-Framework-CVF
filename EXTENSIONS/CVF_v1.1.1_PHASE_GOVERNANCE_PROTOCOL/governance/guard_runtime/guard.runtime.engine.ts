/**
 * Guard Runtime Engine — Re-export Wrapper
 * =========================================
 * DEPRECATED: This file no longer defines GuardRuntimeEngine locally.
 * The canonical implementation lives in `cvf-guard-contract` (CVF_GUARD_CONTRACT).
 *
 * This re-export wrapper preserves backward compatibility for existing imports
 * within CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL and its tests.
 *
 * Phase 3 BV-02 Resolution: Dual engine → single canonical engine.
 *
 * The canonical engine now includes all features from both implementations:
 *   - agentGuidance aggregation (from GUARD_CONTRACT)
 *   - disableGuard() + MANDATORY_GUARD_IDS protection (merged from PHASE_GOV)
 *   - getAuditLogSize() (from GUARD_CONTRACT)
 *
 * @see CVF_GUARD_CONTRACT/src/engine.ts — canonical source
 */

export { GuardRuntimeEngine } from '../../../CVF_GUARD_CONTRACT/src/engine';
