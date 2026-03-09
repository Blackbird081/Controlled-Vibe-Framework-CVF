/**
 * Agent Conformance Types — Track IV Phase B.1
 *
 * Defines the type system for agent conformance testing.
 * Conformance scenarios validate that agents respect CVF governance.
 */

import type { CVFPhase, CVFRiskLevel, CVFRole, GuardDecision } from '../guard.runtime.types.js';

// --- Conformance Scenario ---

export type ConformanceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ConformanceVerdict = 'PASS' | 'FAIL' | 'SKIP' | 'ERROR';

export interface ConformanceScenario {
  id: string;
  title: string;
  description: string;
  severity: ConformanceSeverity;
  category: ConformanceCategory;
  input: ConformanceInput;
  expectedDecision: GuardDecision;
  expectedBlockedBy?: string;
  tags?: string[];
}

export type ConformanceCategory =
  | 'PHASE_BOUNDARY'
  | 'RISK_ENFORCEMENT'
  | 'AUTHORITY_BOUNDARY'
  | 'MUTATION_LIMIT'
  | 'SCOPE_ISOLATION'
  | 'AUDIT_TRAIL'
  | 'ADR_COMPLIANCE'
  | 'DEPTH_AUDIT'
  | 'ARCHITECTURE_CHECK'
  | 'DOCUMENT_NAMING'
  | 'DOCUMENT_STORAGE'
  | 'WORKSPACE_ISOLATION'
  | 'GUARD_REGISTRY'
  | 'PIPELINE_LIFECYCLE';

export interface ConformanceInput {
  phase: CVFPhase;
  riskLevel: CVFRiskLevel;
  role: CVFRole;
  agentId?: string;
  action: string;
  targetFiles?: string[];
  mutationCount?: number;
  mutationBudget?: number;
  traceHash?: string;
  metadata?: Record<string, unknown>;
}

// --- Conformance Result ---

export interface ConformanceResult {
  scenarioId: string;
  verdict: ConformanceVerdict;
  actualDecision?: GuardDecision;
  actualBlockedBy?: string;
  durationMs: number;
  error?: string;
  details?: string;
}

// --- Conformance Report ---

export interface ConformanceReport {
  runId: string;
  timestamp: string;
  totalScenarios: number;
  passed: number;
  failed: number;
  skipped: number;
  errors: number;
  passRate: number;
  results: ConformanceResult[];
  criticalFailures: ConformanceResult[];
  durationMs: number;
}
