import type { ExecutionRecord, ExecutionResumeContext, PolicyDecision } from "../types/index"

const journal: ExecutionRecord[] = []

export function recordExecution(
  proposalId: string,
  policyVersion: string,
  policyHash: string,
  decision: PolicyDecision,
  resumeContext?: ExecutionResumeContext
) {
  journal.push({
    proposalId,
    policyVersion,
    policyHash,
    decision,
    timestamp: Date.now(),
    resumeContext,
  })
}

export function getJournal(): readonly ExecutionRecord[] {
  return journal
}

export function _clearJournal() {
  journal.length = 0
}
