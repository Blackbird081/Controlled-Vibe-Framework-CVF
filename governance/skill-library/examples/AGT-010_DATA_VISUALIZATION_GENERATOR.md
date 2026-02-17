# SKILL MAPPING RECORD
## AGT-010: Data Visualization Generator

> **Status:** ✅ Active  
> **Risk Level:** R1  
> **Last UAT:** 2026-02-17 — PASS

---

## 1. Skill Identity

| Field | Value |
|-------|-------|
| Skill ID | AGT-010 |
| Skill Name | Data Visualization Generator |
| Version | 1.0.0 |
| Source URL | https://github.com/anthropics/anthropic-quickstarts/tree/main/financial-data-analyst |
| Original Author | Anthropic (financial-data-analyst) |
| Intake Date | 2026-02-17 |
| Intake Owner | CVF Governance Team |

---

## 2. Capability Summary

### 2.1 Core Capability
Generates chart configurations and visual renderings from structured data. Inspired by the financial-data-analyst quickstart's Recharts-based visualization pipeline, which dynamically produces interactive charts (line, bar, pie, area, stacked bar, scatter) from tabular financial data. The skill:
- Accepts a data array and chart specification
- Validates data schema against the requested chart type
- Produces a Recharts-compatible JSON configuration object
- Optionally renders an SVG snapshot for static embedding
- Supports axis labeling, color theming, legends, and tooltips

### 2.2 Inputs
| Input | Type | Sensitivity | Required |
|-------|------|-------------|----------|
| Data array | JSON array of objects | Internal | Yes |
| Chart type | Enum: `line`, `bar`, `pie`, `area`, `stacked_bar`, `scatter` | Public | Yes |
| X-axis field | String (key name) | Public | Yes |
| Y-axis field(s) | String or String array (key names) | Public | Yes |
| Chart title | String | Public | No |
| Color palette | String array (hex codes) | Public | No |
| Width × Height | Integer pair (px) | Public | No (default: 800×500) |

### 2.3 Outputs
| Output | Type | Persistence |
|--------|------|-------------|
| Chart config JSON (Recharts-compatible) | JSON object | Logged |
| SVG render (base64-encoded) | String | Ephemeral |
| Data summary statistics | JSON object | Logged |
| Validation warnings | String array | Logged |

### 2.4 Execution Model
| Property | Value |
|----------|-------|
| Invocation | Agent-invoked |
| Execution | Sync |
| Autonomy level | Auto |
| Timeout | 5 000 ms |

---

## 3. CVF Risk Mapping

### 3.1 Assigned Risk Level
- ☐ R0 – Informational (Read-only, no side effects)
- ☑ **R1 – Advisory** (Suggestions only, human confirmation required)
- ☐ R2 – Assisted Execution (Bounded actions, explicit invocation)
- ☐ R3 – Autonomous Execution (Multi-step, requires authorization)
- ☐ R4 – Critical / Blocked (Severe damage potential, execution blocked)

### 3.2 Risk Justification
- Pure transformation: input data → chart configuration (no side effects)
- Does not modify source data, databases, or external systems
- Output is visual/advisory — human interprets the chart
- Slight risk of misleading visualization (wrong chart type, truncated axes)
- Elevated above R0 because chart output may influence business decisions

### 3.3 Failure Scenarios
| Mode | Description | Impact |
|------|-------------|--------|
| Primary | Data schema mismatch (missing fields) | Low — Validation error returned, no chart produced |
| Secondary | Misleading chart (e.g., truncated Y-axis) | Medium — Human may misinterpret data; mitigated by default axis ranges |
| Tertiary | Oversized data array causing timeout | Low — Capped at 10 000 rows; graceful error |
| Quaternary | Invalid color palette | Low — Falls back to default palette |

### 3.4 Blast Radius Assessment
| Dimension | Assessment |
|-----------|------------|
| Scope of impact | Single visualization output |
| Reversibility | Full — No data modified, chart is regenerable |
| Data exposure risk | Low — Data stays in-process, no external calls |

---

## 4. Authority Mapping

### 4.1 Allowed Agent Roles
- ☐ Orchestrator
- ☑ **Architect**
- ☑ **Builder**
- ☐ Reviewer

### 4.2 Allowed CVF Phases
- ☐ Discovery
- ☐ Design
- ☑ **Build**
- ☑ **Review**

### 4.3 Decision Scope Influence
- ☑ **Informational**
- ☐ Tactical (influences immediate task decisions)
- ☐ Strategic (requires human oversight)

### 4.4 Autonomy Constraints
| Constraint | Value |
|------------|-------|
| Invocation conditions | Explicit agent request with data payload |
| Explicit prohibitions | Must not modify source data; must not persist charts to external storage without explicit instruction; must not auto-select misleading chart types (e.g., pie chart for >10 categories) |

> ⚠️ Undefined authority is forbidden by default.

---

## 5. Adaptation Requirements

- ☐ No adaptation required
- ☑ **Capability narrowing required** (Read-only visualization; no data mutation)
- ☐ Execution sandboxing required
- ☐ Additional audit hooks required

### Adaptation Details
1. **Removed:** Direct database query capability present in the original financial-data-analyst (data must be provided as input)
2. **Removed:** File upload handling — the original quickstart accepts PDF, CSV, and image uploads; this skill only accepts pre-parsed JSON arrays
3. **Added:** Chart type validation — blocks pie charts when category count > 10 to prevent unreadable output
4. **Added:** Axis range defaults — Y-axis always starts at 0 unless explicitly overridden to prevent misleading visualizations
5. **Constrained:** Data array capped at 10 000 rows to bound processing time

---

## 6. UAT & Validation Hooks

### 6.1 Required UAT Scenarios
| Scenario | Description |
|----------|-------------|
| Normal operation | Generate line chart from 100-row dataset with 2 Y-axis series |
| All chart types | Produce valid config for each of the 6 supported chart types |
| Schema validation | Reject data array missing required X-axis field |
| Data cap | Reject or truncate data arrays exceeding 10 000 rows |
| Default palette | Produce chart with default colors when no palette specified |
| SVG render | Generate valid base64-encoded SVG output |

### 6.2 Output Validation
| Criteria | Check |
|----------|-------|
| Acceptance | Chart config JSON is valid Recharts specification |
| Acceptance | SVG output renders without errors in a standard browser |
| Acceptance | Data summary statistics match input data |
| Rejection | Chart config references fields not present in input data |
| Rejection | Pie chart generated with > 10 categories without explicit override |

---

## 7. Decision Record

### 7.1 Intake Outcome
- ☐ Reject
- ☑ **Accept with Restrictions**
- ☐ Accept after Adaptation

### 7.2 Decision Rationale
The chart generation pattern from Anthropic's financial-data-analyst quickstart is a valuable read-only visualization capability. Accepted at R1 because it produces advisory output (charts) that humans must interpret. Restrictions remove data querying and file upload capabilities, limiting the skill to pure data-to-chart transformation with safeguards against misleading visualizations.

### 7.3 Decision Authority
| Field | Value |
|-------|-------|
| Name / Role | CVF Governance Team / Skill Intake Owner |
| Date | 2026-02-17 |
| Signature | Approved |

---

## 8. Lifecycle Controls

### 8.1 Review Cycle
| Field | Value |
|-------|-------|
| Review interval | 90 days |
| Next review date | 2026-05-17 |

### 8.2 Deprecation Conditions
- Recharts library deprecated or replaced by a successor
- Visualization requirements exceed supported chart types
- >3 UAT failures in a review cycle

---

## 9. Audit References

| Reference | Link |
|-----------|------|
| Source pattern | [anthropic-quickstarts/financial-data-analyst](https://github.com/anthropics/anthropic-quickstarts/tree/main/financial-data-analyst) |
| CVF documents | `CVF_SKILL_RISK_AUTHORITY_LINK.md` |
| Change log | v1.0.0: Initial intake from financial-data-analyst chart generation pattern |
| Incident references | None |

---

## 10. Final Assertion

By approving this record, the decision authority confirms that:

- ✅ The skill is bound to CVF governance
- ✅ Its risks are understood and accepted
- ✅ Its authority is explicitly constrained
- ✅ Visualization output is read-only and advisory

> ⚠️ Unrecorded usage of this skill constitutes a CVF violation.

---

**Approval Signatures:**

| Role | Name | Date |
|------|------|------|
| Skill Owner | CVF Governance Team | 2026-02-17 |
| Governance Reviewer | CVF Governance Team | 2026-02-17 |
| Security Reviewer | Security Team | 2026-02-17 |
