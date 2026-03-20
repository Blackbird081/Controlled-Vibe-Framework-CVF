/**
 * Guard Runtime Types — v1.1.3 Governance Runtime Hardening
 *
 * Defines the core type system for the CVF Guard Runtime Engine.
 * Every governance guard must implement the Guard interface.
 * The engine processes guards in a deterministic pipeline order.
 *
 * v1.1.3 changes:
 *   - CVFPhase expanded to 5 phases matching CVF_PHASE_AUTHORITY_MATRIX.md
 *   - CVFRole expanded to 5 roles matching CVF_PHASE_AUTHORITY_MATRIX.md
 *   - Added fileScope to GuardRequestContext for file-level enforcement
 *   - Added MANDATORY_GUARD_IDS for non-bypassable governance guards
 */

// --- Phase & Risk Types ---

/** v1.1.3 canonical phases + legacy aliases for backward compat */
export type CanonicalCVFPhase =
  | 'INTAKE' | 'DESIGN' | 'BUILD' | 'REVIEW' | 'FREEZE';

export type LegacyCVFPhaseAlias = 'DISCOVERY';

export type CVFPhase = CanonicalCVFPhase | LegacyCVFPhaseAlias;  // legacy alias for INTAKE
export type CVFPhaseInput = CVFPhase;

export type CVFRiskLevel = 'R0' | 'R1' | 'R2' | 'R3';

/** v1.1.3 canonical roles + legacy aliases for backward compat */
export type CVFRole =
  | 'OBSERVER' | 'ANALYST' | 'BUILDER' | 'REVIEWER' | 'GOVERNOR'
  | 'HUMAN' | 'AI_AGENT' | 'OPERATOR';  // legacy aliases

// --- Guard Decision ---

export type GuardDecision = 'ALLOW' | 'BLOCK' | 'ESCALATE';

export type GuardSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface GuardResult {
  guardId: string;
  decision: GuardDecision;
  severity: GuardSeverity;
  reason: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// --- Guard Request Context ---

export interface GuardRequestContext {
  requestId: string;
  phase: CVFPhase;
  riskLevel: CVFRiskLevel;
  role: CVFRole;
  agentId?: string;
  action: string;
  targetFiles?: string[];
  /** File paths the agent is allowed to modify (file scope restriction) */
  fileScope?: string[];
  mutationCount?: number;
  mutationBudget?: number;
  scope?: string;
  traceHash?: string;
  metadata?: Record<string, unknown>;
}

// --- Guard Interface ---

export interface Guard {
  id: string;
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  evaluate(context: GuardRequestContext): GuardResult;
}

// --- Guard Pipeline Result ---

export interface GuardPipelineResult {
  requestId: string;
  finalDecision: GuardDecision;
  results: GuardResult[];
  executedAt: string;
  durationMs: number;
  blockedBy?: string;
  escalatedBy?: string;
}

// --- Guard Runtime Configuration ---

export interface GuardRuntimeConfig {
  enableAuditLog: boolean;
  strictMode: boolean;
  maxGuardsPerPipeline: number;
  defaultDecision: GuardDecision;
  escalationThreshold: CVFRiskLevel;
}

export const DEFAULT_GUARD_RUNTIME_CONFIG: GuardRuntimeConfig = {
  enableAuditLog: true,
  strictMode: true,
  maxGuardsPerPipeline: 20,
  defaultDecision: 'ALLOW',
  escalationThreshold: 'R2',
};

// --- Audit Log Entry ---

export interface GuardAuditEntry {
  requestId: string;
  timestamp: string;
  context: GuardRequestContext;
  pipelineResult: GuardPipelineResult;
}

// --- Mandatory Guards (v1.1.3) ---

/**
 * Guards that cannot be unregistered or disabled.
 * These form the non-bypassable governance core.
 */
export const MANDATORY_GUARD_IDS = [
  'authority_gate',
  'phase_gate',
  'ai_commit',
] as const;

export type MandatoryGuardId = (typeof MANDATORY_GUARD_IDS)[number];
