"use client"

import { Proposal } from "../types/proposal.types"
import RiskBadge from "./RiskBadge"
import CostEstimator from "./CostEstimator"

interface Props {
  proposal: Proposal
  onExecute?: () => void
}

export default function ProposalCard({ proposal, onExecute }: Props) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "12px",
      }}
    >
      <div>
        <strong>ID:</strong> {proposal.id}
      </div>

      <div>
        <strong>Status:</strong> {proposal.status}
      </div>

      <RiskBadge riskScore={proposal.riskScore} />

      <CostEstimator estimatedCost={proposal.estimatedCost} />

      {proposal.status === "APPROVED" && onExecute && (
        <button onClick={onExecute} style={{ marginTop: "10px" }}>
          Execute
        </button>
      )}
    </div>
  )
}
