/**
 * Guard Runtime Adapter for Web — v1.6 → v2.0 (Unified Contract)
 * ================================================================
 * This file is now a THIN RE-EXPORT wrapper around the canonical
 * CVF Guard Contract package. All guard logic lives in one place:
 *   EXTENSIONS/CVF_GUARD_CONTRACT/
 *
 * MIGRATION NOTE (2026-03-11):
 *   Previously this file contained 676 lines with a duplicate
 *   WebGuardRuntimeEngine + 6 guards. Now it re-exports from
 *   the shared contract, ensuring Web UI and MCP Server use
 *   the SAME guard engine and types.
 *
 * @module lib/guard-runtime-adapter
 */

// ─── Re-export ALL types and classes from canonical contract ──────────

export {
  // Types
  type CVFPhase,
  type CVFRiskLevel,
  type CVFRole,
  type GuardDecision,
  type GuardSeverity,
  type GuardResult,
  type GuardRequestContext,
  type BuildAuthorityEvidence,
  type RiskApprovalEvidence,
  type Guard,
  type GuardPipelineResult,
  type GuardAuditEntry,
  type GuardRuntimeConfig,

  // Constants
  PHASE_ORDER,
  RISK_NUMERIC,
  DEFAULT_GUARD_RUNTIME_CONFIG,

  // Engine (canonical — replaces WebGuardRuntimeEngine)
  GuardRuntimeEngine,

  // Guards
  PhaseGateGuard,
  PHASE_ROLE_MATRIX,
  PHASE_DESCRIPTIONS,
  RiskGateGuard,
  RISK_DESCRIPTIONS,
  AuthorityGateGuard,
  AiCommitGuard,
  RESTRICTED_ACTIONS,
  MutationBudgetGuard,
  DEFAULT_MUTATION_BUDGETS,
  ESCALATION_THRESHOLD,
  FileScopeGuard,
  ScopeGuard,
  PROTECTED_PATHS,
  CVF_ROOT_INDICATORS,
  AuditTrailGuard,

  // Factory
  createGuardEngine,
} from 'cvf-guard-contract';

import { GuardRuntimeEngine, createGuardEngine } from 'cvf-guard-contract';
import type { GuardRuntimeConfig, GuardRequestContext, CVFRole, BuildAuthorityEvidence, RiskApprovalEvidence } from 'cvf-guard-contract';
import { normalizeWebPhaseInput } from '@/lib/governance-model';
import { normalizeRunnableRiskLevel } from '@/lib/risk-check';

// ─── Backward-compatible aliases ─────────────────────────────────────

/**
 * @deprecated Use `GuardRuntimeEngine` instead. This alias exists for
 * backward compatibility with v1.6 code that imported WebGuardRuntimeEngine.
 */
export const WebGuardRuntimeEngine = GuardRuntimeEngine;

/**
 * @deprecated Use `createGuardEngine()` instead.
 * Backward-compatible factory for v1.6 code.
 */
export function createWebGuardEngine(
  config?: Partial<GuardRuntimeConfig>,
): InstanceType<typeof GuardRuntimeEngine> {
  return createGuardEngine(config);
}

// ─── Helper: Build context from v1.6 web request ─────────────────────

export interface WebGuardInput {
  requestId?: string;
  phase?: string;
  riskLevel?: string;
  role?: string;
  userRole?: string; // Enterprise RBAC role
  agentId?: string;
  actorId?: string;
  action?: string;
  templateCategory?: string;
  intent?: string;
  mutationCount?: number;
  fileScope?: string[];
  targetFiles?: string[];
  traceHash?: string;
  approvalBinding?: string;
  riskApproval?: RiskApprovalEvidence;
  buildAuthority?: BuildAuthorityEvidence;
  aiCommit?: {
    commitId: string;
    agentId: string;
    timestamp: number;
    description?: string;
  };
}

/**
 * Converts loose v1.6 web request fields into a typed GuardRequestContext.
 * Provides sensible defaults for non-coder usage:
 *   - Default phase: INTAKE (safe front-door for loosely specified requests)
 *   - Default risk: R3 when an authoritative risk is missing
 *   - Default role: HUMAN (non-coder = human user)
 *   - Channel: 'web' (hardcoded for Web UI context)
 */
export function buildWebGuardContext(input: WebGuardInput): GuardRequestContext {
  return {
    requestId: input.requestId || `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    phase: normalizeWebPhaseInput(input.phase) ?? 'INTAKE',
    riskLevel: normalizeRunnableRiskLevel(input.riskLevel),
    role: normalizeRole(input.role),
    agentId: input.agentId,
    action: input.action || input.intent || 'execute_template',
    mutationCount: input.mutationCount,
    fileScope: input.fileScope,
    targetFiles: input.targetFiles,
    traceHash: input.traceHash,
    approvalBinding: input.approvalBinding,
    riskApproval: input.riskApproval,
    buildAuthority: input.buildAuthority,
    channel: 'web',
    metadata: {
      userRole: input.userRole,
      actorId: input.actorId,
      ...(input.aiCommit ? { ai_commit: input.aiCommit } : {}),
    },
  };
}

function normalizeRole(raw?: string): CVFRole {
  if (!raw) return 'HUMAN';
  const upper = raw.trim().toUpperCase();
  if (upper === 'OBSERVER') return 'OBSERVER';
  if (upper === 'ANALYST') return 'ANALYST';
  if (upper === 'BUILDER') return 'BUILDER';
  if (upper === 'AI_AGENT' || upper === 'AI' || upper === 'AGENT') return 'AI_AGENT';
  if (upper === 'REVIEWER') return 'REVIEWER';
  if (upper === 'GOVERNOR') return 'GOVERNOR';
  if (upper === 'OPERATOR') return 'OPERATOR';
  return 'HUMAN';
}
