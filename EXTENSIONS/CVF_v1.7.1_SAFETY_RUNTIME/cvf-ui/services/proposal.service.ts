import { apiPost } from "./cvf.api"
import { Proposal } from "../types/proposal.types"

export async function createProposal(instruction: string): Promise<Proposal> {
  return apiPost("/proposal", { instruction })
}

export async function executeProposal(proposalId: string) {
  return apiPost("/execute", { proposalId })
}
