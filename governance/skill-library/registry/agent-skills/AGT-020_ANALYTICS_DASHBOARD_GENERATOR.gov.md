# AGT-020: Analytics Dashboard Generator

> **Type:** Agent Skill  
> **Domain:** Monitoring & Analytics  
> **Status:** Active

---

## Source

Inspired by claude-code-templates analytics dashboard (real-time session monitoring, live state detection, usage statistics, conversation monitoring, health checks) and Sentry engineering skills.  
Reference: https://github.com/davila7/claude-code-templates (Analytics Dashboard, Conversation Monitor)  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-020_ANALYTICS_DASHBOARD_GENERATOR.md`

---

## Capability

Generates real-time analytics dashboards for monitoring AI agent sessions, skill usage, performance metrics, governance compliance, and system health. Provides actionable insights and trend visualization.

**Actions:**
- Generate real-time session monitoring dashboards
- Track skill usage frequency and performance metrics
- Monitor governance compliance rates across agent interactions
- Visualize conversation flow and state transitions
- Produce system health check reports with recommendations
- Export analytics data in CSV/JSON/HTML formats
- Track token usage and cost estimates per session
- Alert on anomalies (unusual patterns, governance violations, performance degradation)

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R1 – Low** |
| Allowed Roles | Architect, Builder |
| Allowed Phases | All |
| Decision Scope | tactical |
| Autonomy | Auto (read-only analytics and visualization) |

---

## Risk Justification

- **Read-only data access** – Only reads session logs and metrics
- **No system modification** – Dashboards are generated artifacts, not system changes
- **Data privacy** – Session data may contain user prompts/content
- **Storage impact** – Analytics data accumulation requires managed retention
- **Performance overhead** – Real-time monitoring adds minimal processing load
- **Export sensitivity** – Exported data should respect data classification

---

## Constraints

- ✅ Analytics data is read-only (no modification of source data)
- ✅ User prompt content redacted in analytics by default
- ✅ Data retention policy enforced (configurable, default 30 days)
- ✅ Export formats validated before generation
- ✅ Real-time monitoring impact limited (<5% CPU overhead)
- ✅ Dashboard access follows role-based permissions
- ❌ Cannot modify session data or logs
- ❌ Cannot expose full user prompt content without explicit consent
- ❌ Cannot bypass data retention policy
- ❌ Cannot share analytics data with external services
- ❌ Cannot auto-generate alerts without configured thresholds

---

## UAT Binding

**PASS criteria:**
- [ ] Analytics generated from read-only data access
- [ ] User prompts redacted in dashboard views
- [ ] Data retention policy enforced
- [ ] Export formats are valid and openable
- [ ] Dashboard reflects real-time session state

**FAIL criteria:**
- [ ] Source data modified by analytics generation
- [ ] User prompt content exposed in analytics
- [ ] Data retention exceeded without cleanup
- [ ] Exported data is malformed or incomplete
