import { CVFExecutionResult } from "./types/contract.types"

export function formatResponse(result: CVFExecutionResult): string {
  switch (result.status) {
    case "approved":
      return `Approved. Execution ID: ${result.executionId}`
    case "pending":
      return `Pending approval.`
    case "rejected":
      return `Rejected: ${result.reason}`
    default:
      return "Unknown status."
  }
}