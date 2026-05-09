"use client"

interface Props {
  requiresApproval: boolean
}

export default function ApprovalActions({ requiresApproval }: Props) {
  if (!requiresApproval) {
    return <div>No manual approval required.</div>
  }

  return <div style={{ color: "red" }}>Approval required before execution.</div>
}
