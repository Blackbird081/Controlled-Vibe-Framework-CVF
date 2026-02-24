export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export function transitionApproval(
  current: ApprovalStatus,
  action: "approve" | "reject"
): ApprovalStatus {
  if (current !== "PENDING") {
    throw new Error("Invalid state transition");
  }

  return action === "approve" ? "APPROVED" : "REJECTED";
}