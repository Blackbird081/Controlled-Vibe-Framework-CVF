// correction.plan.ts
// Đề xuất correction plan dựa trên deviation severity.

export interface CorrectionPlan {
  suggestedActions: string[]
  requiresGovernanceApproval: boolean
  severity: "LOW" | "MEDIUM" | "HIGH"
}

export function proposeCorrection(
  issues: string[],
  severity: "LOW" | "MEDIUM" | "HIGH"
): CorrectionPlan {
  const actions = issues.map(issue =>
    `Review and correct: ${issue}`
  )

  // LOW deviation không cần governance approval
  // MEDIUM/HIGH bắt buộc
  const requiresGovernanceApproval = severity !== "LOW"

  return {
    suggestedActions: actions,
    requiresGovernanceApproval,
    severity
  }
}