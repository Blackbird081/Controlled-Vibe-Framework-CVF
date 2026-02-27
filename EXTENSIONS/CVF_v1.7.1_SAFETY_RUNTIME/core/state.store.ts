import { ApprovalState } from "../policy/approval.state-machine"

const stateStore: Record<string, ApprovalState> = {}

export function setState(proposalId: string, state: ApprovalState) {
  stateStore[proposalId] = state
}

export function getState(proposalId: string): ApprovalState | undefined {
  return stateStore[proposalId]
}
