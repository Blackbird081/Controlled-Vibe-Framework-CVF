/**
 * Repository Interfaces — Abstract persistence layer.
 *
 * Core engine depends ONLY on these interfaces, never on Prisma directly.
 * This enables testing with in-memory stubs and swapping databases easily.
 */

import type {
  StoredProposal,
  ExecutionRecord,
  PolicyDefinition,
  ProposalSnapshot,
  ApprovalState,
  PolicyDecision,
  AIAuditEntry,
  UsageRecord,
} from "../types/index"

// ─── Proposal Repository ────────────────────────────────────

export interface IProposalRepository {
  save(proposal: StoredProposal): Promise<void>
  getById(id: string): Promise<StoredProposal | null>
  list(options?: {
    state?: ApprovalState
    limit?: number
    offset?: number
  }): Promise<StoredProposal[]>
  updateState(id: string, state: ApprovalState): Promise<void>
  updateDecision(id: string, decision: PolicyDecision): Promise<void>
}

// ─── Execution Journal Repository ───────────────────────────

export interface IExecutionJournalRepository {
  record(entry: ExecutionRecord): Promise<void>
  getByProposalId(proposalId: string): Promise<ExecutionRecord[]>
  list(options?: { limit?: number; offset?: number }): Promise<ExecutionRecord[]>
}

// ─── Policy Repository ──────────────────────────────────────

export interface IPolicyRepository {
  register(policy: PolicyDefinition): Promise<void>
  getByVersion(version: string): Promise<PolicyDefinition | null>
  getActive(): Promise<PolicyDefinition | null>
  list(): Promise<PolicyDefinition[]>
}

// ─── Snapshot Repository ────────────────────────────────────

export interface ISnapshotRepository {
  save(snapshot: ProposalSnapshot): Promise<void>
  getByProposalId(proposalId: string): Promise<ProposalSnapshot | null>
  list(): Promise<ProposalSnapshot[]>
}

// ─── Audit Repository ───────────────────────────────────────

export interface IAuditRepository {
  log(entry: AIAuditEntry): Promise<void>
  list(options?: { limit?: number; offset?: number }): Promise<AIAuditEntry[]>
}

// ─── Usage Repository ───────────────────────────────────────

export interface IUsageRepository {
  record(entry: UsageRecord): Promise<void>
  getDailyTokens(userId?: string): Promise<number>
  getMonthlyTokens(): Promise<number>
}
