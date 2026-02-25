import type { PolicyDecision, ExecutionRecord } from "../types/index"

const journal: ExecutionRecord[] = []

export function recordExecution(
  proposalId: string,
  policyVersion: string,
  policyHash: string,
  decision: PolicyDecision
) {

  journal.push({
    proposalId,
    policyVersion,
    policyHash,
    decision,
    timestamp: Date.now()
  })
}

export function getJournal(): readonly ExecutionRecord[] {
  return journal
}