import type { StoredProposal } from "../types/index"

const proposalStore: Record<string, StoredProposal> = {}

export function saveProposal(proposal: StoredProposal) {

  if (proposalStore[proposal.id]) {
    throw new Error("Proposal already exists (immutable)")
  }

  proposalStore[proposal.id] = proposal
}

export function getProposal(id: string): StoredProposal {

  const proposal = proposalStore[id]

  if (!proposal) {
    throw new Error("Proposal not found")
  }

  return proposal
}