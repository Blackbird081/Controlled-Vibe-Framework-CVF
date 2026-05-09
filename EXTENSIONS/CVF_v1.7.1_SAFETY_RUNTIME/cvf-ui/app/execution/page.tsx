"use client"

import { useState } from "react"
import StatusBadge from "../../components/StatusBadge"

interface ExecutionEntry {
  id: string
  proposalId: string
  policyVersion: string
  decision: string
  duration: string
  timestamp: string
}

const sampleExecutions: ExecutionEntry[] = [
  {
    id: "ex-001",
    proposalId: "p-001",
    policyVersion: "v2.1",
    decision: "approved",
    duration: "12ms",
    timestamp: "2026-02-24 20:15",
  },
  {
    id: "ex-002",
    proposalId: "p-002",
    policyVersion: "v2.1",
    decision: "pending",
    duration: "8ms",
    timestamp: "2026-02-24 20:10",
  },
  {
    id: "ex-003",
    proposalId: "p-003",
    policyVersion: "v2.1",
    decision: "rejected",
    duration: "15ms",
    timestamp: "2026-02-24 19:55",
  },
  {
    id: "ex-004",
    proposalId: "p-004",
    policyVersion: "v2.0",
    decision: "approved",
    duration: "9ms",
    timestamp: "2026-02-24 19:40",
  },
  {
    id: "ex-005",
    proposalId: "p-005",
    policyVersion: "v2.1",
    decision: "approved",
    duration: "11ms",
    timestamp: "2026-02-24 19:30",
  },
]

export default function ExecutionPage() {
  const [entries] = useState(sampleExecutions)

  const stats = {
    total: entries.length,
    approved: entries.filter((e) => e.decision === "approved").length,
    rejected: entries.filter((e) => e.decision === "rejected").length,
    pending: entries.filter((e) => e.decision === "pending").length,
  }

  return (
    <div className="cvf-animate-in">
      <div className="cvf-page-header">
        <h1 className="cvf-page-title">Execution Journal</h1>
        <p className="cvf-page-subtitle">Policy execution history with timing metrics</p>
      </div>

      {/* Summary Stats */}
      <div className="cvf-stats-grid" style={{ marginBottom: "24px" }}>
        <div className="cvf-card">
          <div className="cvf-card-title">Total Executions</div>
          <div className="cvf-card-value">{stats.total}</div>
        </div>
        <div className="cvf-card">
          <div className="cvf-card-title">Approved</div>
          <div className="cvf-card-value" style={{ color: "var(--cvf-success)" }}>
            {stats.approved}
          </div>
        </div>
        <div className="cvf-card">
          <div className="cvf-card-title">Rejected</div>
          <div className="cvf-card-value" style={{ color: "var(--cvf-danger)" }}>
            {stats.rejected}
          </div>
        </div>
        <div className="cvf-card">
          <div className="cvf-card-title">Pending</div>
          <div className="cvf-card-value" style={{ color: "var(--cvf-pending)" }}>
            {stats.pending}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="cvf-card">
        <div className="cvf-card-header">
          <span className="cvf-card-title">Recent Executions</span>
        </div>
        <table className="cvf-table">
          <thead>
            <tr>
              <th>Execution ID</th>
              <th>Proposal</th>
              <th>Policy</th>
              <th>Decision</th>
              <th>Duration</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.proposalId}</td>
                <td>
                  <span className="cvf-badge cvf-badge-low">{e.policyVersion}</span>
                </td>
                <td>
                  <StatusBadge status={e.decision} />
                </td>
                <td
                  style={{
                    fontFamily: "var(--cvf-font-mono)",
                    color: "var(--cvf-text-muted)",
                  }}
                >
                  {e.duration}
                </td>
                <td
                  style={{
                    color: "var(--cvf-text-muted)",
                    fontSize: "12px",
                    fontFamily: "var(--cvf-font-mono)",
                  }}
                >
                  {e.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
