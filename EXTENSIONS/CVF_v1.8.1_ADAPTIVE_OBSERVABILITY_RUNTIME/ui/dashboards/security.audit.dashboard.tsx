// ui/dashboards/security.audit.dashboard.tsx

import React from "react"
import { getAuditLogs } from "../../storage/audit.store"

export const SecurityAuditDashboard = () => {
  const logs = getAuditLogs()

  return (
    <div>
      <h2>Security Audit Logs</h2>
      <ul>
        {logs.map(log => (
          <li key={log.id}>
            [{log.type}] {log.detail}
          </li>
        ))}
      </ul>
    </div>
  )
}