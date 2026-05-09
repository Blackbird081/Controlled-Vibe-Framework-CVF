import { randomUUID } from "crypto"
import { CreateProposalRequest, ProposalResponse } from "./api.types"

const proposalStore: Record<string, ProposalResponse> = {}

export function createProposal(request: CreateProposalRequest): ProposalResponse {
  const id = randomUUID()

  const riskScore = request.instruction.length > 500 ? 7 : 3

  const requiresApproval = riskScore > 5

  const proposal: ProposalResponse = {
    id,
    status: requiresApproval ? "PENDING" : "APPROVED",
    riskScore,
    estimatedCost: request.instruction.length * 0.001,
    requiresApproval,
  }

  proposalStore[id] = proposal

  return proposal
}

export function getProposal(id: string): ProposalResponse | null {
  return proposalStore[id] || null
}
