/**
 * CVF Guard Contract — Canonical Type Definitions
 * ================================================
 * SINGLE SOURCE OF TRUTH for all CVF guard types.
 * Both Web UI (v1.6) and MCP Server (v2.5) MUST import from here.
 *
 * @module cvf-guard-contract/types
 */

// ─── Core Enums ───────────────────────────────────────────────────────

export type CVFPhase = 'DISCOVERY' | 'DESIGN' | 'BUILD' | 'REVIEW';

export type CVFRiskLevel = 'R0' | 'R1' | 'R2' | 'R3';

export type CVFRole = 'HUMAN' | 'AI_AGENT' | 'REVIEWER' | 'OPERATOR';

export type GuardDecision = 'ALLOW' | 'BLOCK' | 'ESCALATE';

export type GuardSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

// ─── Core Interfaces ──────────────────────────────────────────────────

/**
 * Result returned by a single guard evaluation.
 * `agentGuidance` and `suggestedAction` are REQUIRED for agent-facing contexts.
 */
export interface GuardResult {
  guardId: string;
  decision: GuardDecision;
  severity: GuardSeverity;
  reason: string;
  timestamp: string;
  /** Natural-language explanation for AI agents about why this decision was made */
  agentGuidance?: string;
  /** Machine-readable suggested next action */
  suggestedAction?: string;
  /** Additional context-specific data */
  metadata?: Record<string, unknown>;
}

/**
 * Context provided to guards for evaluation.
 * This is the UNIVERSAL input contract — same for Web, IDE, CLI, MCP.
 */
export interface GuardRequestContext {
  requestId: string;
  phase: CVFPhase;
  riskLevel: CVFRiskLevel;
  role: CVFRole;
  agentId?: string;
  action: string;
  targetFiles?: string[];
  mutationCount?: number;
  mutationBudget?: number;
  scope?: string;
  traceHash?: string;
  /** Channel from which this request originated */
  channel?: 'web' | 'ide' | 'cli' | 'mcp' | 'api';
  metadata?: Record<string, unknown>;
}

/**
 * Guard interface — ALL guards must implement this contract.
 */
export interface Guard {
  id: string;
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  evaluate(context: GuardRequestContext): GuardResult;
}

/**
 * Result of running the full guard pipeline (all guards in sequence).
 */
export interface GuardPipelineResult {
  requestId: string;
  finalDecision: GuardDecision;
  results: GuardResult[];
  executedAt: string;
  durationMs: number;
  blockedBy?: string;
  escalatedBy?: string;
  /** Aggregated agent guidance from all guards */
  agentGuidance?: string;
}

/**
 * Audit log entry — stored for each pipeline evaluation.
 */
export interface GuardAuditEntry {
  requestId: string;
  timestamp: string;
  context: GuardRequestContext;
  pipelineResult: GuardPipelineResult;
}

/**
 * Runtime configuration for the guard engine.
 */
export interface GuardRuntimeConfig {
  enableAuditLog: boolean;
  strictMode: boolean;
  maxGuardsPerPipeline: number;
  defaultDecision: GuardDecision;
  escalationThreshold: CVFRiskLevel;
}

// ─── Constants ────────────────────────────────────────────────────────

export const PHASE_ORDER: CVFPhase[] = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];

export const RISK_NUMERIC: Record<CVFRiskLevel, number> = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
};

export const DEFAULT_GUARD_RUNTIME_CONFIG: GuardRuntimeConfig = {
  enableAuditLog: true,
  strictMode: true,
  maxGuardsPerPipeline: 20,
  defaultDecision: 'ALLOW',
  escalationThreshold: 'R2',
};
