
export type ProposalStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED";

export interface CreateProposalRequest {
  instruction: string;
}

export interface ProposalResponse {
  id: string;
  status: ProposalStatus;
  riskScore: number;
  estimatedCost?: number;
  requiresApproval: boolean;
}

export interface ExecuteProposalRequest {
  proposalId: string;
}

export interface AISettingsRequest {
  provider: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AuditEntry {
  timestamp: number;
  model?: string;
  totalTokens?: number;
}