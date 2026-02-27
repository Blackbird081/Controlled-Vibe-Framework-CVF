"use client"

import { useState, useEffect } from "react"
import StatusBadge from "../../components/StatusBadge"

interface AuditEntry {
  id: string
  action: string
  userId: string
  timestamp: string
  details: string
  level: string
}

// Sample audit data — replace with API call in production
const sampleAudit: AuditEntry[] = [
  {
    id: "a-001",
    action: "proposal:create",
    userId: "admin",
    timestamp: "2026-02-24 20:15",
    details: "Created proposal p-001",
    level: "info",
  },
  {
    id: "a-002",
    action: "policy:register",
    userId: "admin",
    timestamp: "2026-02-24 20:10",
    details: "Registered policy v2.1 (5 rules)",
    level: "info",
  },
  {
    id: "a-003",
    action: "auth:login",
    userId: "operator",
    timestamp: "2026-02-24 19:55",
    details: "Login from 192.168.1.10",
    level: "info",
  },
  {
    id: "a-004",
    action: "rate_limit:triggered",
    userId: "system",
    timestamp: "2026-02-24 19:40",
    details: "IP 10.0.0.5 exceeded 30 req/min",
    level: "warning",
  },
  {
    id: "a-005",
    action: "proposal:rejected",
    userId: "system",
    timestamp: "2026-02-24 19:30",
    details: "High cost proposal p-003 rejected by policy",
    level: "danger",
  },
  {
    id: "a-006",
    action: "ai:generate",
    userId: "operator",
    timestamp: "2026-02-24 19:15",
    details: "OpenAI gpt-4 — 2,500 tokens",
    level: "info",
  },
  {
    id: "a-007",
    action: "auth:failed",
    userId: "unknown",
    timestamp: "2026-02-24 18:50",
    details: "Invalid credentials from 10.0.0.99",
    level: "danger",
  },
  {
    id: "a-008",
    action: "proposal:approved",
    userId: "system",
    timestamp: "2026-02-24 18:30",
    details: "Low risk proposal p-005 auto-approved",
    level: "approved",
  },
]

const levelColors: Record<string, string> = {
  info: "var(--cvf-accent)",
  warning: "var(--cvf-warning)",
  danger: "var(--cvf-danger)",
  approved: "var(--cvf-success)",
}

export default function AuditPage() {
  const [filter, setFilter] = useState("")
  const [entries, setEntries] = useState<AuditEntry[]>([])

  useEffect(() => {
    // Simulate API fetch
    setEntries(sampleAudit)
  }, [])

  const filtered = entries.filter(
    (e) =>
      e.action.toLowerCase().includes(filter.toLowerCase()) ||
      e.details.toLowerCase().includes(filter.toLowerCase()) ||
      e.userId.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="cvf-animate-in">
      <div className="cvf-page-header">
        <h1 className="cvf-page-title">Audit Log</h1>
        <p className="cvf-page-subtitle">Complete system activity trail</p>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Filter by action, user, or details..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "10px 16px",
            background: "var(--cvf-bg-input)",
            border: "1px solid var(--cvf-border)",
            borderRadius: "var(--cvf-radius-sm)",
            color: "var(--cvf-text-primary)",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* Table */}
      <div className="cvf-card">
        <table className="cvf-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Action</th>
              <th>User</th>
              <th>Details</th>
              <th>Level</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                <td>
                  <span
                    style={{
                      color: levelColors[entry.level] ?? "var(--cvf-text-secondary)",
                    }}
                  >
                    {entry.action}
                  </span>
                </td>
                <td>{entry.userId}</td>
                <td>{entry.details}</td>
                <td>
                  <StatusBadge
                    status={
                      entry.level === "danger"
                        ? "rejected"
                        : entry.level === "approved"
                          ? "approved"
                          : entry.level
                    }
                  />
                </td>
                <td
                  style={{
                    color: "var(--cvf-text-muted)",
                    fontSize: "12px",
                    fontFamily: "var(--cvf-font-mono)",
                  }}
                >
                  {entry.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--cvf-text-muted)",
            }}
          >
            No audit entries match your filter.
          </div>
        )}
      </div>
    </div>
  )
}
