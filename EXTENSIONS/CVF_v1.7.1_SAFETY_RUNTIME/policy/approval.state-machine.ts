export type ApprovalState =
  | "proposed"
  | "validated"
  | "pending"
  | "approved"
  | "rejected"
  | "executed"

/**
 * Deterministic state machine for proposal approval.
 *
 * Valid transitions:
 *   proposed  → validated  (always — every proposal must be validated first)
 *   validated → approved   (if policy decision === "approved")
 *   validated → rejected   (if policy decision === "rejected")
 *   validated → pending    (if policy decision === "pending", requires manual review)
 *   approved  → executed   (after execution completes)
 *
 * Note: The `decision` parameter is intentionally ignored when current === "proposed"
 * because validation is a mandatory step before any policy decision applies.
 */
export function nextState(
  current: ApprovalState,
  decision: "approved" | "rejected" | "pending"
): ApprovalState {
  if (current === "proposed") {
    return "validated"
  }

  if (current === "validated") {
    return decision === "approved"
      ? "approved"
      : decision === "rejected"
        ? "rejected"
        : "pending"
  }

  if (current === "approved") {
    return "executed"
  }

  return current
}
