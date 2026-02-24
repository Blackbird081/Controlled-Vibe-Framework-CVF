
export type ProposalStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED";

export interface Proposal {
  id: string;
  status: ProposalStatus;
  riskScore: number;
  estimatedCost?: number;
  requiresApproval: boolean;
}