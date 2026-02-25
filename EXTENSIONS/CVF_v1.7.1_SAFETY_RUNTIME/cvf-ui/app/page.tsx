import StatCard from "../components/StatCard"
import StatusBadge from "../components/StatusBadge"

// Sample data — in production, fetch from API
const recentProposals = [
  { id: "p-001", action: "Deploy auth system", source: "api", riskLevel: "low", state: "approved", time: "2 min ago" },
  { id: "p-002", action: "Update pricing engine", source: "openclaw", riskLevel: "high", state: "pending", time: "15 min ago" },
  { id: "p-003", action: "Grant admin role to @user3", source: "structured", riskLevel: "high", state: "rejected", time: "1 hr ago" },
  { id: "p-004", action: "Scale AI token limit", source: "api", riskLevel: "medium", state: "approved", time: "3 hr ago" },
  { id: "p-005", action: "Enable sandbox mode", source: "openclaw", riskLevel: "low", state: "approved", time: "5 hr ago" },
]

const activityFeed = [
  { text: "Policy v2.1 registered — 5 rules", color: "var(--cvf-accent)", time: "10:32" },
  { text: "Rate limit triggered for 192.168.1.42", color: "var(--cvf-warning)", time: "10:28" },
  { text: "Proposal p-002 awaiting approval", color: "var(--cvf-pending)", time: "10:15" },
  { text: "AI usage: 12,500 tokens (OpenAI)", color: "var(--cvf-text-muted)", time: "10:02" },
  { text: "Auth: admin login from new device", color: "var(--cvf-success)", time: "09:45" },
]

export default function DashboardPage() {
  return (
    <div className="cvf-animate-in">
      <div className="cvf-page-header">
        <h1 className="cvf-page-title">Dashboard</h1>
        <p className="cvf-page-subtitle">Controlled Vibe Framework — System Overview</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="cvf-stats-grid">
        <StatCard title="Total Proposals" value={142} change="↑ 12% this week" changeType="positive" icon="📋" />
        <StatCard title="Pending Review" value={7} change="3 high risk" changeType="negative" icon="⏳" />
        <StatCard title="Policy Version" value="v2.1" change="5 active rules" changeType="neutral" icon="🛡️" />
        <StatCard title="AI Tokens Today" value="45.2K" change="↓ 8% vs yesterday" changeType="positive" icon="🤖" />
      </div>

      {/* ── Proposals Table ── */}
      <div className="cvf-card" style={{ marginBottom: "24px" }}>
        <div className="cvf-card-header">
          <span className="cvf-card-title">Recent Proposals</span>
          <button className="cvf-btn cvf-btn-outline">View All</button>
        </div>
        <table className="cvf-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Action</th>
              <th>Source</th>
              <th>Risk</th>
              <th>State</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {recentProposals.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.action}</td>
                <td>{p.source}</td>
                <td><StatusBadge status={p.riskLevel} /></td>
                <td><StatusBadge status={p.state} /></td>
                <td style={{ color: "var(--cvf-text-muted)", fontSize: "12px" }}>{p.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Activity Feed ── */}
      <div className="cvf-card">
        <div className="cvf-card-header">
          <span className="cvf-card-title">Activity Feed</span>
        </div>
        <div className="cvf-activity">
          {activityFeed.map((item, i) => (
            <div key={i} className="cvf-activity-item">
              <div className="cvf-activity-dot" style={{ background: item.color }} />
              <span>{item.text}</span>
              <span className="cvf-activity-time">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}