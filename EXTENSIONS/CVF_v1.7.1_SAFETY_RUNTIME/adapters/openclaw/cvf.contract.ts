import { CVFProposalEnvelope, CVFExecutionResult } from "./types/contract.types"

export interface CVFPublicAPI {
  submitProposal(
    proposal: CVFProposalEnvelope
  ): Promise<CVFExecutionResult>
}