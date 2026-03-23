/**
 * CVF Guard Contract — Canonical Type Definitions
 * ================================================
 * SINGLE SOURCE OF TRUTH for all CVF guard types.
 * Both Web UI (v1.6) and MCP Server (v2.5) MUST import from here.
 *
 * Canonical runtime model:
 *   - phases: INTAKE → DESIGN → BUILD → REVIEW → FREEZE
 *   - roles: OBSERVER / ANALYST / BUILDER / REVIEWER / GOVERNOR
 *
 * Legacy aliases remain accepted at input boundaries for backward compatibility,
 * but they are not the preferred canonical runtime vocabulary.
 *
 * @module cvf-guard-contract/types
 */

// ─── Core Enums ───────────────────────────────────────────────────────

export type CanonicalCVFPhase =
  | 'INTAKE'
  | 'DESIGN'
  | 'BUILD'
  | 'REVIEW'
  | 'FREEZE';

export type LegacyCVFPhaseAlias = 'DISCOVERY';

export type CVFPhase = CanonicalCVFPhase | LegacyCVFPhaseAlias;
export type CVFPhaseInput = CVFPhase;

export type CVFRiskLevel = 'R0' | 'R1' | 'R2' | 'R3';

export type CVFRole =
  | 'OBSERVER'
  | 'ANALYST'
  | 'BUILDER'
  | 'REVIEWER'
  | 'GOVERNOR'
  | 'HUMAN'
  | 'AI_AGENT'
  | 'OPERATOR';

export type GuardDecision = 'ALLOW' | 'BLOCK' | 'ESCALATE';

export type GuardSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export type HandoffTransitionKind =
  | 'CONTINUE'
  | 'BREAK'
  | 'PAUSE'
  | 'SHIFT_HANDOFF'
  | 'AGENT_TRANSFER'
  | 'ESCALATION_HANDOFF'
  | 'CLOSURE';

export type HandoffNextOwnerType = 'HUMAN' | 'AGENT' | 'REVIEWER';

export type HandoffCheckpointStatus = 'OPEN' | 'RESOLVED';

export type HandoffCheckpointResolution =
  | 'RESUMED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

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
  /** Explicit file-level boundaries for mutating actions. */
  fileScope?: string[];
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

export interface HandoffTransitionContext {
  workActuallyClosed?: boolean;
  sameWorkerContinuesImmediately?: boolean;
  sameWorkerWillResumeLater?: boolean;
  ownershipChanges?: boolean;
  nextOwnerType?: HandoffNextOwnerType;
  approvalOrDecisionPending?: boolean;
  meaningfulStatePresent?: boolean;
}

export interface HandoffCheckpoint {
  id: string;
  transition: HandoffTransitionKind;
  formalHandoffRequired: boolean;
  reason: string;
  createdAt: string;
  currentOwnerId?: string;
  nextOwnerId?: string;
  nextOwnerType?: HandoffNextOwnerType;
  nextGovernedMove?: string;
  scopeHint?: string;
  status: HandoffCheckpointStatus;
  resolvedAt?: string;
  resolution?: HandoffCheckpointResolution;
  metadata?: Record<string, unknown>;
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

export const PHASE_ORDER: CanonicalCVFPhase[] = ['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE'];

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

/**
 * Guards that form the non-bypassable governance core.
 * Shared factories should always register these by default.
 */
export const MANDATORY_GUARD_IDS = ['authority_gate', 'phase_gate', 'ai_commit'] as const;

export type MandatoryGuardId = (typeof MANDATORY_GUARD_IDS)[number];

// ─── Multi-Agent Coordination (W6-T2) ─────────────────────────────────

export type AgentCoordinationMessageType =
  | 'BROADCAST'
  | 'DIRECT'
  | 'QUORUM_REQUEST'
  | 'QUORUM_RESPONSE';

export type AgentCoordinationStatus =
  | 'PENDING'
  | 'DELIVERED'
  | 'BLOCKED'
  | 'QUORUM_MET'
  | 'QUORUM_FAILED';

export interface AgentRegistration {
  agentId: string;
  role: CVFRole;
  phase: CVFPhase;
  registeredAt: string;
  capabilities?: string[];
}

export interface AgentCoordinationMessage {
  id: string;
  type: AgentCoordinationMessageType;
  fromAgentId: string;
  /** undefined = broadcast to all registered agents */
  toAgentIds?: string[];
  payload: Record<string, unknown>;
  sentAt: string;
  phase: CVFPhase;
  riskLevel: CVFRiskLevel;
  /** Required acknowledgement count for QUORUM_REQUEST */
  quorumRequired?: number;
}

export interface AgentCoordinationResult {
  messageId: string;
  status: AgentCoordinationStatus;
  deliveredTo: string[];
  blockedBy?: string;
  guardDecision?: GuardDecision;
  quorumAcks?: number;
  quorumRequired?: number;
  processedAt: string;
}
