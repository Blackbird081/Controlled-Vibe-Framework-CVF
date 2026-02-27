/**
 * CVF Shared Types — Single source of truth for all type definitions.
 *
 * This module consolidates types used across core, policy, AI, simulation,
 * adapters, and UI layers to eliminate duplication and ensure consistency.
 */

// ─── Policy Types ───────────────────────────────────────────────

export type PolicyDecision = "approved" | "rejected" | "pending"

export interface PolicyRule {
  id: string
  description: string
  evaluate(proposal: ProposalPayload): PolicyDecision | null
}

export interface PolicyDefinition {
  version: string
  createdAt: number
  rules: PolicyRule[]
  hash: string
}

// ─── Approval State Machine ─────────────────────────────────────

export type ApprovalState =
  | "proposed"
  | "validated"
  | "pending"
  | "approved"
  | "rejected"
  | "executed"

// ─── Proposal Types ─────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high"

export type ProposalSource = "openclaw" | "structured" | "api"

export interface ProposalPayload {
  [key: string]: unknown
}

export interface ProposalEnvelope {
  id: string
  source: ProposalSource
  action: string
  payload: ProposalPayload
  createdAt: number
  confidence: number
  riskLevel: RiskLevel
}

export interface StoredProposal {
  id: string
  payload: ProposalPayload
  policyVersion: string
  policyHash: string
  createdAt: number
}

// ─── Execution Types ────────────────────────────────────────────

export interface ExecutionResult {
  status: PolicyDecision
  state: ApprovalState | undefined
  policyHash: string
}

export interface ExecutionRecord {
  proposalId: string
  policyVersion: string
  policyHash: string
  decision: PolicyDecision
  timestamp: number
}

// ─── Lifecycle Types ────────────────────────────────────────────

export interface LifecycleInput {
  id: string
  payload: ProposalPayload
  policyVersion: string
  simulateOnly?: boolean
}

// ─── AI Provider Types ──────────────────────────────────────────

export type AIProviderType = "OPENCLAW" | "DIRECT_LLM" | "LOCAL"

export interface AIGenerationRequest {
  systemPrompt?: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
}

export interface AIGenerationResponse {
  content: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  model?: string
}

export interface AIProviderAdapter {
  generate(request: AIGenerationRequest): Promise<AIGenerationResponse>
}

// ─── Cost & Risk Types ──────────────────────────────────────────

export type CostLevel = "OK" | "WARNING" | "LIMIT_EXCEEDED"

export interface CostValidationResult {
  level: CostLevel
  reasons: string[]
}

export type RiskAssessmentLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface RiskAssessmentResult {
  level: RiskAssessmentLevel
  score: number
  reasons: string[]
}

// ─── Simulation Types ───────────────────────────────────────────

export interface SimulationContext {
  proposalId: string
  policyVersion: string
  simulateOnly: boolean
}

export interface SimulationResult {
  originalDecision?: string
  simulatedDecision: string
  policyVersion: string
  changed: boolean
}

export interface ProposalSnapshot {
  proposalId: string
  proposal: ProposalPayload
  policyVersion: string
  decision: string
  timestamp: number
}

// ─── OpenClaw Types ─────────────────────────────────────────────

export interface OpenClawMessage {
  userId: string
  message: string
  metadata?: Record<string, unknown>
}

export interface ParsedIntent {
  action: string
  confidence: number
  parameters: Record<string, unknown>
  simulateOnly?: boolean
}

export interface CVFExecutionResult {
  status: PolicyDecision
  reason?: string
  executionId?: string
  data?: unknown
}

// ─── Budget Types ───────────────────────────────────────────────

export type BudgetScope = "EXECUTION" | "USER_DAILY" | "ORG_MONTHLY"

export interface BudgetCheckInput {
  userId: string
  estimatedCostUsd: number
  estimatedTokens: number
}

export interface BudgetCheckResult {
  allowed: boolean
  reason?: string
}

// ─── Guard Types ────────────────────────────────────────────────

export interface GuardResult {
  allowed: boolean
  escalatedRisk?: "medium" | "high"
  reason?: string
}

// ─── Audit Types ────────────────────────────────────────────────

export interface AIAuditEntry {
  timestamp: number
  request: AIGenerationRequest
  responseMeta: {
    model?: string
    totalTokens?: number
  }
}

export interface UsageRecord {
  timestamp: number
  totalTokens?: number
  model?: string
}
