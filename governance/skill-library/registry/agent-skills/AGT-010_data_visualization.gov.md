# AGT-010: Data Visualization Generator

> **Type:** Agent Skill  
> **Domain:** Data Analysis  
> **Status:** Active

---

## Source

Inspired by Anthropic financial-data-analyst quickstart (dynamic chart generation with Recharts).  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-010_DATA_VISUALIZATION_GENERATOR.md`

---

## Capability

Generates chart configuration JSON from structured data, supporting multiple chart types for interactive data visualization.

**Actions:**
- Accept structured data arrays and generate chart configs
- Support line, bar, pie, area, and stacked area chart types
- Configure axes, series, labels, and titles
- Output Recharts-compatible JSON configuration
- Validate chart configs against schema

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R1 – Low** |
| Allowed Roles | Architect, Builder |
| Allowed Phases | Build, Review |
| Decision Scope | Tactical |
| Autonomy | Automatic (read-only operation) |

---

## Risk Justification

- **Read-only** – Does not modify source data
- **No network** – Operates entirely on local data
- **Output-only risk** – Misconfigured charts could misrepresent data
- **No executable code** – Chart configs are declarative JSON only

---

## Constraints

- ✅ Read-only operation — source data never modified
- ✅ Chart configs validated against schema before output
- ✅ No executable code (JavaScript) in chart configuration
- ✅ All generated configs logged for audit
- ✅ Data stays within session boundary
- ❌ Cannot contain executable JavaScript in output
- ❌ Cannot export data outside the session
- ❌ Cannot modify underlying data sources

---

## UAT Binding

**PASS criteria:**
- [ ] Generated config is valid Recharts JSON
- [ ] Chart accurately represents input data
- [ ] No executable code in output
- [ ] Config logged for audit
- [ ] Source data unmodified after operation

**FAIL criteria:**
- [ ] Invalid or malformed chart configuration
- [ ] Data misrepresentation (wrong axis mapping, missing series)
- [ ] Executable code injected into config
- [ ] Data modification detected
