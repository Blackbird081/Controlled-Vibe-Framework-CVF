/**
 * Multi-Entry Types — Track IV Phase B.2
 *
 * Shared types for CLI, MCP, and API entry point adapters.
 * All entry points normalize requests into GuardRequestContext before evaluation.
 */

import type { CVFPhase, CVFRiskLevel, CVFRole, GuardPipelineResult } from '../guard.runtime.types.js';

export type EntryPointType = 'CLI' | 'MCP' | 'API';

export interface EntryRequest {
  entryPoint: EntryPointType;
  rawInput: Record<string, unknown>;
  timestamp: string;
}

export interface NormalizedRequest {
  requestId: string;
  phase: CVFPhase;
  riskLevel: CVFRiskLevel;
  role: CVFRole;
  agentId?: string;
  action: string;
  targetFiles?: string[];
  mutationCount?: number;
  mutationBudget?: number;
  traceHash?: string;
  scope?: string;
  metadata?: Record<string, unknown>;
}

export interface EntryResponse {
  entryPoint: EntryPointType;
  requestId: string;
  allowed: boolean;
  decision: string;
  reason: string;
  guardResult: GuardPipelineResult;
  timestamp: string;
}

export interface EntryAdapter {
  type: EntryPointType;
  normalize(raw: Record<string, unknown>): NormalizedRequest;
  formatResponse(result: GuardPipelineResult, requestId: string): EntryResponse;
}
