/**
 * Guard Runtime Types — Track IV Phase A.1
 *
 * Defines the core type system for the CVF Guard Runtime Engine.
 * Every governance guard must implement the Guard interface.
 * The engine processes guards in a deterministic pipeline order.
 */

// --- Phase & Risk Types ---

export type CVFPhase = 'DISCOVERY' | 'DESIGN' | 'BUILD' | 'REVIEW';

export type CVFRiskLevel = 'R0' | 'R1' | 'R2' | 'R3';

export type CVFRole = 'HUMAN' | 'AI_AGENT' | 'REVIEWER' | 'OPERATOR';

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
