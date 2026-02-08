# CVF Workflow Impact Review (v1.5.2 ↔ v1.6)

> **Date:** 2026-02-07  
> **Scope:** Governance + Skill Library (v1.5.2) + Agent Platform (v1.6)  
> **Purpose:** Provide a clear, pre-change impact assessment to avoid breaking established workflows.

---

## 1) Executive Summary

Recent governance updates introduce a **Spec Quality Gate (input validation)** and explicitly separate it from **UAT (output validation)**. This clarifies responsibility and prevents misuse of UAT for input quality.  
**Impact:** Requires a small refactor of reporting semantics (Spec metrics vs UAT metrics) and a gating rule in execution flows.  
**Risk:** Low to medium for UI/metrics; medium for workflow enforcement if not implemented consistently.

---

## 2) Current Workflow Baseline (Before Change)

### v1.5.2 Skill Library (Input Layer)
1. Skill specs exist as reusable **input templates**.
2. Mapping records + UAT binding exist.
3. UAT is used as a compliance test, but in practice it is sometimes treated as "quality" of the skill itself.

### v1.6 Agent Platform (Execution Layer)
1. User request + template + skills → spec.
2. Agent executes.
3. Phase gate + quality badge exist.
4. UAT is surfaced in UI but conflated with input readiness.

---

## 3) Change Definition (Spec Gate vs UAT)

**New separation:**
- **Spec Quality Gate** = input validation (before execution)
- **Pre-UAT (Agent self-check)** = output validation before user sees it
- **Final UAT (User)** = output acceptance

**Rule:**
- Spec Gate PASS → may execute
- Spec Gate CLARIFY → ask user for missing inputs
- Spec Gate FAIL → block execution

This is now documented in:
- `governance/skill-library/specs/GOVERNANCE_DASHBOARD_DESIGN.md`
- `governance/skill-library/specs/CVF_RISK_AUTHORITY_MAPPING.md`
- `governance/skill-library/specs/CVF_SKILL_RISK_AUTHORITY_LINK.md`

---

## 4) Impact Matrix

| Area | Current Behavior | Change | Impact Level |
|------|------------------|--------|:------------:|
| Skill quality reporting | Often tied to UAT avg | Replace with Spec Score/Spec Quality | Medium |
| UAT usage | Used as skill quality proxy | Strictly output validation only | Medium |
| Execution pipeline | Spec always proceeds | Spec Gate can block or clarify | Medium |
| Governance mapping | UAT only | Spec Gate + Pre-UAT + Final UAT | Low |
| UI dashboards | Domain report shows UAT avg | Split Spec metrics vs UAT | Medium |

---

## 5) Risks If Not Implemented

1. **Wrong signals to end users**: UAT avg shown as skill quality.
2. **Spec drift**: low-quality input still executes.
3. **Agent QA gaps**: no pre-check before user review.
4. **Governance confusion**: output compliance vs input readiness mixed.

---

## 6) Required Updates (Minimal)

### A) Data & Scoring
- Add Spec Score and Spec Quality to skill metadata.
- Keep UAT score for output only.

### B) UI Reporting
- Replace "UAT Avg" with "Spec Avg" in domain report for input libraries.
- Add indicator for UAT (output) only when output is generated.

### C) Execution Workflow
- Block agent execution if Spec Gate fails.
- If CLARIFY: request missing inputs.
- For R2+: require Pre-UAT (agent self-check) before output is presented.

---

## 7) Non-Goals (To Avoid Scope Creep)

- No change to skill content generation rules.
- No change to risk model definition itself.
- No full UI redesign, only semantics + labels.

---

## 8) Verification Checklist (Before Release)

1. Spec Gate pass/clarify/fail visible in UI.
2. Spec metrics displayed separately from UAT.
3. UAT only appears after output generation.
4. R2+ requires Pre-UAT evidence.
5. Old workflows still execute if Spec Gate passes.

---

## 9) Decision Log

**Decision:** Adopt the optimal workflow: **Spec Gate → Pre‑UAT (Agent) → Final UAT (User)**.  
**Reason:** Maximize input control, reduce regression before user review, align with CVF governance.  
**Date:** 2026-02-07

---

## 10) Next Step (Optional)

Create a lightweight UI spec update in v1.6:
- Domain Report: add Spec Avg + Spec Quality, hide UAT unless output exists.
- Skill Detail: show Spec Gate status separately from UAT.

---

## 11) UI Mapping (v1.6)

> Purpose: make all UI surfaces explicitly distinguish **Spec Quality** (input) vs **UAT** (output).

### 11.1 Skill Library (Domain Report Panel)
- **Current:** Count + Avg UAT Score + Quality buckets.
- **Change:**
  - Replace **Avg UAT Score** → **Spec Avg Score** (input quality).
  - Replace **Quality buckets** → **Spec Quality buckets**.
  - Add **UAT Coverage** column only when output exists for that skill set.
  - Tooltip: “Spec metrics evaluate input readiness; UAT evaluates output only.”

### 11.2 Skill Detail Header (Right Panel)
- **Current:** Risk / Autonomy / Roles / Phases / Scope / UAT / Score / Quality.
- **Change:**
  - Add **Spec Gate** badge: PASS / CLARIFY / FAIL.
  - Show **Spec Score** and **Spec Quality** next to input metadata.
  - UAT badge remains, but labeled **Output UAT** and disabled until output exists.

### 11.3 UAT Editor (View/Edit)
- **Current:** Direct edit of UAT markdown.
- **Change:**
  - If Spec Gate = FAIL, disable UAT edit and show “Spec must pass first.”
  - Pre‑UAT status (Agent) visible as separate block above UAT decision.

### 11.4 Agent Execution Panel (Simple/Governance/Full)
- **Current:** Generates output even if spec weak.
- **Change:**
  - Block execution if Spec Gate = FAIL.
  - If CLARIFY: auto prompt missing fields before execution.
  - On output: run Pre‑UAT (agent self-check) before user sees final output.

### 11.5 Analytics / Reports
- **Current:** Uses UAT metrics for domain quality.
- **Change:**
  - Replace domain quality with **Spec Quality** for input selection.
  - Keep UAT metrics for **output quality** only (post-execution).

---

## 11.6 UI Checklist by Component (v1.6)

| Component | File | Required Updates |
|---|---|---|
| Skill Library (Domain Report) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SkillLibrary.tsx` | Replace UAT‑avg label with Spec‑avg for input library. Add Spec Gate badge on skill header. Disable UAT edit if Spec Gate FAIL. |
| Skill Detail (Header badges) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SkillLibrary.tsx` | Add Spec Gate status + clarify messaging. Rename UAT badge to “Output UAT”. |
| Spec Export | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SpecExport.tsx` | Run Spec Gate before enabling “Send to Agent”. Prompt missing fields when CLARIFY. |
| Dynamic Form (Spec flow) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/DynamicForm.tsx` | Hook Spec Gate to prevent export if FAIL. |
| Execute with AI | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ExecuteWithAI.tsx` | Enforce Spec Gate before execution. Trigger Pre‑UAT for R2+ before showing output. |
| Agent Chat (Full flow) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/AgentChat.tsx` | Add Pre‑UAT step before final output display (Governance/Full modes). |

---

## 12) Migration Plan (Safe & Reversible)

### Phase 0 — Snapshot (Before Change)
- Backup:
  - `governance/skill-library/uat/results/`
  - `governance/skill-library/registry/`
  - UI report state if cached locally

### Phase 1 — Schema Additions (Non-breaking)
- Add fields:
  - `specScore`, `specQuality`, `specGateStatus`
- Do **not** remove UAT fields.
- Default fallback: `specGateStatus = CLARIFY` when missing.

### Phase 2 — Recompute Spec Metrics
- Batch run to compute `specScore/specQuality`.
- Store results in skill metadata and/or registry cache.

### Phase 3 — UI Switch (Read-only)
- Replace labels in UI:
  - “UAT Avg” → “Spec Avg”
  - “Quality” → “Spec Quality”
- Keep UAT UI but lock unless output exists.

### Phase 4 — Workflow Enforcement
- Block execution if Spec Gate FAIL.
- Add clarify prompt when CLARIFY.
- Add Pre‑UAT (agent self-check) step before output is displayed.

### Phase 5 — Validation
- Confirm:
  - No skill disappears.
  - Domain report counts unchanged.
  - Output UAT remains intact.

### Rollback Plan
- Disable Spec Gate enforcement (execution resumes).
- Keep Spec metrics as passive display only.
- UAT flows remain unchanged.

---

## 13) Migration Script (Spec Metrics)

To support migration, add a report script that computes Spec Score/Quality from existing `.skill.md` files without mutating source content:

- Script: `governance/skill-library/registry/report_spec_metrics.py`
- Outputs:
  - `governance/skill-library/registry/reports/spec_metrics_report.json`
  - `governance/skill-library/registry/reports/spec_metrics_report.csv`
  - `governance/skill-library/registry/reports/spec_metrics_report.md`
