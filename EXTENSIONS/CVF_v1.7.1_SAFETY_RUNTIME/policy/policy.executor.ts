import type { PolicyDecision, ProposalPayload } from "../types/index"
import { getPolicy } from "./policy.registry"

export function executePolicy(
  proposal: ProposalPayload,
  policyVersion: string
): PolicyDecision {
  const policy = getPolicy(policyVersion)

  for (const rule of policy.rules) {
    const decision = rule.evaluate(proposal)

    if (decision) {
      return decision
    }
  }

  // Safety: when no rule explicitly approves, require manual review.
  // This prevents auto-approval of unrecognized proposal types.
  return "pending"
}
