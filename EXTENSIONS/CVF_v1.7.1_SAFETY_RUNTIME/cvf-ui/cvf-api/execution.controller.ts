import { ExecuteProposalRequest } from "./api.types"
import { getProposal } from "./proposal.controller"

export function executeProposal(request: ExecuteProposalRequest) {
  const proposal = getProposal(request.proposalId)

  if (!proposal) {
    throw new Error("Proposal not found")
  }

  if (proposal.status !== "APPROVED") {
    throw new Error("Proposal not approved")
  }

  proposal.status = "EXECUTED"

  return {
    success: true,
    proposalId: proposal.id,
  }
}
