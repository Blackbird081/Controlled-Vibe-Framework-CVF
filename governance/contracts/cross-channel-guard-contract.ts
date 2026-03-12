/**
 * CVF Cross-Channel Guard Contract — Extended Types & Mapping Functions
 *
 * ⚠️ CANONICAL SOURCE OF TRUTH: EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts
 * This file provides SUPERSET types (5 phases, R0-R4, 8 roles) and
 * mapping functions for cross-channel normalization.
 * For core guard types used in the runtime engine, import from 'cvf-guard-contract'.
 *
 * @module governance/contracts/cross-channel-guard-contract
 * @version 1.0.1
 * @date 2026-03-12
 *
 * @see EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts — Canonical guard types
 */

// ─── Canonical Phase Model (superset: 5 phases) ─────────────────────

export type CVFCanonicalPhase = 'INTAKE' | 'DESIGN' | 'BUILD' | 'REVIEW' | 'FREEZE';

export const CANONICAL_PHASE_ORDER: CVFCanonicalPhase[] = [
  'INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE',
];

export const CANONICAL_PHASE_ALIASES: Record<string, CVFCanonicalPhase> = {
  // Web UI aliases (A-E)
  'A': 'INTAKE', 'PHASE A': 'INTAKE',
  'B': 'DESIGN', 'PHASE B': 'DESIGN',
  'C': 'BUILD',  'PHASE C': 'BUILD',
  'D': 'REVIEW', 'PHASE D': 'REVIEW',
  'E': 'FREEZE', 'PHASE E': 'FREEZE',
  // MCP Server aliases
  'DISCOVERY': 'INTAKE',
  // Direct canonical names
  'INTAKE': 'INTAKE',
  'DESIGN': 'DESIGN',
  'BUILD': 'BUILD',
  'REVIEW': 'REVIEW',
  'FREEZE': 'FREEZE',
};

// ─── Canonical Risk Model (superset: R0-R4) ─────────────────────────

export type CVFCanonicalRisk = 'R0' | 'R1' | 'R2' | 'R3' | 'R4';

export const CANONICAL_RISK_ORDER: CVFCanonicalRisk[] = ['R0', 'R1', 'R2', 'R3', 'R4'];

export const CANONICAL_RISK_NUMERIC: Record<CVFCanonicalRisk, number> = {
  R0: 0, R1: 1, R2: 2, R3: 3, R4: 4,
};

export const CANONICAL_RISK_LABELS: Record<CVFCanonicalRisk, { en: string; vi: string }> = {
  R0: { en: 'No Risk',   vi: 'Không rủi ro' },
  R1: { en: 'Low',       vi: 'Thấp' },
  R2: { en: 'Medium',    vi: 'Trung bình' },
  R3: { en: 'High',      vi: 'Cao' },
  R4: { en: 'Critical',  vi: 'Nghiêm trọng' },
};

// ─── Canonical Decision Model (superset) ────────────────────────────

export type CVFCanonicalDecision =
  | 'ALLOW'
  | 'BLOCK'
  | 'ESCALATE'
  | 'CLARIFY'
  | 'LOG_ONLY';

// ─── Canonical Role Model (superset) ────────────────────────────────

export type CVFCanonicalRole =
  | 'OBSERVER'
  | 'ANALYST'
  | 'BUILDER'
  | 'REVIEWER'
  | 'GOVERNOR'
  | 'HUMAN'
  | 'AI_AGENT'
  | 'OPERATOR';

// ─── Canonical Guard Severity ────────────────────────────────────────

export type CVFGuardSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

// ─── Guard Request (channel-agnostic input) ──────────────────────────

export interface CVFGuardRequest {
  requestId: string;
  channel: CVFChannel;
  phase: CVFCanonicalPhase;
  riskLevel: CVFCanonicalRisk;
  role: CVFCanonicalRole;
  action: string;
  agentId?: string;
  targetFiles?: string[];
  mutationCount?: number;
  mutationBudget?: number;
  traceHash?: string;
  metadata?: Record<string, unknown>;
}

// ─── Guard Response (channel-agnostic output) ────────────────────────

export interface CVFGuardResult {
  guardId: string;
  decision: CVFCanonicalDecision;
  severity: CVFGuardSeverity;
  reason: string;
  timestamp: string;
  agentGuidance?: string;
  suggestedAction?: string;
  metadata?: Record<string, unknown>;
}

export interface CVFGuardPipelineResult {
  requestId: string;
  channel: CVFChannel;
  finalDecision: CVFCanonicalDecision;
  results: CVFGuardResult[];
  executedAt: string;
  durationMs: number;
  blockedBy?: string;
  escalatedBy?: string;
  agentGuidance?: string;
}

// ─── Audit Entry ─────────────────────────────────────────────────────

export interface CVFGuardAuditEntry {
  requestId: string;
  timestamp: string;
  channel: CVFChannel;
  request: CVFGuardRequest;
  pipelineResult: CVFGuardPipelineResult;
}

// ─── Channel Enum ────────────────────────────────────────────────────

export type CVFChannel =
  | 'web-ui'
  | 'mcp-server'
  | 'vscode'
  | 'cli'
  | 'http-bridge'
  | 'external';

// ─── Guard Contract Interface ────────────────────────────────────────
//
// Any channel that enforces CVF governance MUST implement this interface.
// This guarantees cross-channel consistency.

export interface CVFGuardContract {
  /** Unique channel identifier */
  readonly channel: CVFChannel;

  /** Evaluate full guard pipeline */
  evaluate(request: CVFGuardRequest): CVFGuardPipelineResult | Promise<CVFGuardPipelineResult>;

  /** Check phase gate only */
  checkPhaseGate(request: CVFGuardRequest): CVFGuardResult | Promise<CVFGuardResult>;

  /** Check risk gate only */
  checkRiskGate(request: CVFGuardRequest): CVFGuardResult | Promise<CVFGuardResult>;

  /** Get audit log entries */
  getAuditLog(limit?: number): CVFGuardAuditEntry[] | Promise<CVFGuardAuditEntry[]>;

  /** Health check */
  healthCheck(): CVFHealthStatus | Promise<CVFHealthStatus>;
}

export interface CVFHealthStatus {
  channel: CVFChannel;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  guardsLoaded: number;
}

// ─── Phase Advancement ───────────────────────────────────────────────

export interface CVFPhaseAdvanceRequest {
  requestId: string;
  channel: CVFChannel;
  currentPhase: CVFCanonicalPhase;
  targetPhase: CVFCanonicalPhase;
  role: CVFCanonicalRole;
  justification: string;
}

export interface CVFPhaseAdvanceResult {
  allowed: boolean;
  fromPhase: CVFCanonicalPhase;
  toPhase: CVFCanonicalPhase;
  reason: string;
  timestamp: string;
}

// ─── Mapping Functions ───────────────────────────────────────────────

/**
 * Normalize any phase string to canonical CVFCanonicalPhase.
 * Returns 'INTAKE' as default if unrecognized.
 */
export function normalizePhase(raw?: string): CVFCanonicalPhase {
  if (!raw) return 'INTAKE';
  const key = raw.trim().toUpperCase();
  return CANONICAL_PHASE_ALIASES[key] ?? 'INTAKE';
}

/**
 * Normalize any risk string to canonical CVFCanonicalRisk.
 * Returns 'R1' as default if unrecognized.
 */
export function normalizeRisk(raw?: string): CVFCanonicalRisk {
  if (!raw) return 'R1';
  const key = raw.trim().toUpperCase();
  if (key === 'R0' || key === 'R1' || key === 'R2' || key === 'R3' || key === 'R4') {
    return key;
  }
  return 'R1';
}

/**
 * Map MCP Server decision to canonical decision.
 * MCP uses: ALLOW | BLOCK | ESCALATE
 */
export function mapMcpDecision(decision: string): CVFCanonicalDecision {
  switch (decision.toUpperCase()) {
    case 'ALLOW': return 'ALLOW';
    case 'BLOCK': return 'BLOCK';
    case 'ESCALATE': return 'ESCALATE';
    default: return 'BLOCK';
  }
}

/**
 * Map Web UI enforcement status to canonical decision.
 * Web UI uses: ALLOW | CLARIFY | BLOCK | NEEDS_APPROVAL
 */
export function mapWebUiDecision(status: string): CVFCanonicalDecision {
  switch (status.toUpperCase()) {
    case 'ALLOW': return 'ALLOW';
    case 'BLOCK': return 'BLOCK';
    case 'CLARIFY': return 'CLARIFY';
    case 'NEEDS_APPROVAL': return 'ESCALATE';
    case 'ESCALATE': return 'ESCALATE';
    case 'LOG_ONLY': return 'LOG_ONLY';
    default: return 'BLOCK';
  }
}

/**
 * Map canonical decision back to Web UI enforcement status.
 */
export function canonicalToWebUiStatus(decision: CVFCanonicalDecision): string {
  switch (decision) {
    case 'ALLOW': return 'ALLOW';
    case 'BLOCK': return 'BLOCK';
    case 'CLARIFY': return 'CLARIFY';
    case 'ESCALATE': return 'NEEDS_APPROVAL';
    case 'LOG_ONLY': return 'ALLOW';
  }
}

/**
 * Map canonical decision back to MCP Server decision.
 */
export function canonicalToMcpDecision(decision: CVFCanonicalDecision): string {
  switch (decision) {
    case 'ALLOW': return 'ALLOW';
    case 'BLOCK': return 'BLOCK';
    case 'ESCALATE': return 'ESCALATE';
    case 'CLARIFY': return 'ESCALATE';
    case 'LOG_ONLY': return 'ALLOW';
  }
}

/**
 * Map MCP Server role to canonical role.
 */
export function mapMcpRole(role: string): CVFCanonicalRole {
  switch (role.toUpperCase()) {
    case 'HUMAN': return 'HUMAN';
    case 'AI_AGENT': return 'AI_AGENT';
    case 'REVIEWER': return 'REVIEWER';
    case 'OPERATOR': return 'OPERATOR';
    default: return 'AI_AGENT';
  }
}

/**
 * Map Web UI role to canonical role.
 */
export function mapWebUiRole(role: string): CVFCanonicalRole {
  switch (role.toUpperCase()) {
    case 'OBSERVER': return 'OBSERVER';
    case 'ANALYST': return 'ANALYST';
    case 'BUILDER': return 'BUILDER';
    case 'REVIEWER': return 'REVIEWER';
    case 'GOVERNOR': return 'GOVERNOR';
    default: return 'ANALYST';
  }
}

/**
 * Map MCP Server phase (DISCOVERY/DESIGN/BUILD/REVIEW) to canonical.
 */
export function mapMcpPhase(phase: string): CVFCanonicalPhase {
  return normalizePhase(phase);
}

/**
 * Map canonical phase back to MCP Server phase string.
 * MCP only has 4 phases, so INTAKE→DISCOVERY, FREEZE→REVIEW.
 */
export function canonicalToMcpPhase(phase: CVFCanonicalPhase): string {
  switch (phase) {
    case 'INTAKE': return 'DISCOVERY';
    case 'DESIGN': return 'DESIGN';
    case 'BUILD': return 'BUILD';
    case 'REVIEW': return 'REVIEW';
    case 'FREEZE': return 'REVIEW'; // MCP has no FREEZE, map to strictest
  }
}

/**
 * Map canonical risk back to MCP Server risk string.
 * MCP only has R0-R3, so R4→R3.
 */
export function canonicalToMcpRisk(risk: CVFCanonicalRisk): string {
  if (risk === 'R4') return 'R3'; // MCP max is R3
  return risk;
}

// ─── Validation Helpers ──────────────────────────────────────────────

export function isValidPhase(raw: string): boolean {
  return raw.trim().toUpperCase() in CANONICAL_PHASE_ALIASES;
}

export function isValidRisk(raw: string): boolean {
  const key = raw.trim().toUpperCase();
  return key === 'R0' || key === 'R1' || key === 'R2' || key === 'R3' || key === 'R4';
}

export function compareRisk(a: CVFCanonicalRisk, b: CVFCanonicalRisk): number {
  return CANONICAL_RISK_NUMERIC[a] - CANONICAL_RISK_NUMERIC[b];
}

export function comparePhase(a: CVFCanonicalPhase, b: CVFCanonicalPhase): number {
  return CANONICAL_PHASE_ORDER.indexOf(a) - CANONICAL_PHASE_ORDER.indexOf(b);
}

/**
 * Check if a risk level exceeds a threshold.
 */
export function riskExceeds(level: CVFCanonicalRisk, threshold: CVFCanonicalRisk): boolean {
  return CANONICAL_RISK_NUMERIC[level] > CANONICAL_RISK_NUMERIC[threshold];
}
