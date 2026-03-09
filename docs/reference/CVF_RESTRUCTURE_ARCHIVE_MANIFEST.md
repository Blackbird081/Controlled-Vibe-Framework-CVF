# CVF_Restructure Archive Manifest

> **Status:** ARCHIVED
> **Date:** 2026-03-09
> **Task:** Track II, Section 1.6 — Archive CVF_Restructure
> **ADR:** ADR-021 (ECOSYSTEM Restructure)

---

## 1. Purpose

This manifest documents the integration and archive status of all files in the `CVF_Restructure/` folder. The folder is `.gitignored` (private, not published) and serves as the historical origin of the ECOSYSTEM restructure.

---

## 2. Integration Status

### 2.1 Files Integrated into CVF (DONE)

| Source (CVF_Restructure/) | Target (CVF main) | Status |
|---|---|---|
| `CVF_ECOSYSTEM/doctrine/CVF_ARCHITECTURE_PRINCIPLES.md` | `ECOSYSTEM/doctrine/CVF_ARCHITECTURE_PRINCIPLES.md` | ✅ Integrated |
| `CVF_ECOSYSTEM/doctrine/CVF_PRODUCT_POSITIONING.md` | `ECOSYSTEM/doctrine/CVF_PRODUCT_POSITIONING.md` | ✅ Integrated |
| `CVF_ECOSYSTEM/doctrine/CVF_ECOSYSTEM_MAP.md` | `ECOSYSTEM/doctrine/CVF_ECOSYSTEM_MAP.md` | ✅ Integrated |
| `CVF_ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md` | `ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md` | ✅ Integrated |
| `CVF_ECOSYSTEM/doctrine/RULES.md` | `ECOSYSTEM/doctrine/CVF_DOCTRINE_RULES.md` | ✅ Integrated (renamed) |
| `CVF_ECOSYSTEM/operating-model/CVF_AGENT_OPERATING_MODEL.md` | `ECOSYSTEM/operating-model/CVF_AGENT_OPERATING_MODEL.md` | ✅ Integrated |
| `CVF_ECOSYSTEM/operating-model/CVF_BUILDER_MODEL.md` | `ECOSYSTEM/operating-model/CVF_BUILDER_MODEL.md` | ✅ Integrated |
| `CVF_AI Systems/CVF_Roadmap/CVF_One-Page Master Blueprint.md` | `docs/reference/CVF_ONE_PAGE_MASTER_BLUEPRINT.md` | ✅ Integrated |
| `CVF_AI Systems/CVF_Roadmap/CVF_Strategic Compass.md` | `docs/reference/CVF_STRATEGIC_COMPASS.md` | ✅ Integrated |
| `CVF_AI Systems/CVF_Roadmap/CVF_Minimum Viable Governance Stack.md` | `docs/reference/CVF_MINIMUM_VIABLE_GOVERNANCE_STACK.md` | ✅ Integrated |
| `CVF_ECOSYSTEM/cvf-core/v0.1/CVF_BUILD_PROMPT.md` | `docs/reference/CVF_BUILD_PROMPT_V01.md` | ✅ Integrated |

### 2.2 Independent Reviews (Referenced, not moved)

These documents remain in `CVF_Restructure/Independent Review/` as audit records. They are referenced by the Unified Roadmap.

| File | Role | Status |
|---|---|---|
| `ADR-021_CVF_ECOSYSTEM_RESTRUCTURE.md` | Architecture Decision Record | 📎 Referenced |
| `CVF_ECOSYSTEM_INDEPENDENT_REVIEW_2026-03-08.md` | Independent quality review | 📎 Referenced |
| `CVF_ECOSYSTEM_ROADMAP_2026-03-08.md` | Detailed roadmap (Track II+III source) | 📎 Referenced |
| `CVF_ROADMAP_CONSOLIDATION_AUDIT_2026-03-09.md` | Audit leading to roadmap unification | 📎 Referenced |
| `CVF_STRATEGIC_INTEGRATION_REVIEW_2026-03-08.md` | Integration recommendation | 📎 Referenced |
| `CVF_DIAGRAM_VALIDATOR_AUDIT_2026-03-09.md` | Diagram validator audit | 📎 Referenced |

### 2.3 Archived as Historical Reference

These files contain strategic vision material (Phase 3-5, 2028+) that is not yet actionable. They remain in `CVF_Restructure/` for future reference.

| Category | Files | Reason |
|---|---|---|
| **AI Civilization Vision** | `Thong_tin/AI Agent Civilization Stack.md`, `AI Autonomous Company Architecture.md`, `AI Labor Economy.md`, `Agent Skill Economy.md` | Phase 4-5 vision (2028+) |
| **AI Research** | `Thong_tin/AI Capability Ledger.md`, `AI Skill Supply Chain.md`, `AI Power Map.md`, `AI Super-Organism Architecture.md` | Research reference |
| **Strategy Drafts** | `docs/strategy/cvf_10_year_master_plan.md`, `cvf_ecosystem_strategy.md`, `cvf_founder_strategy.md`, `cvf_power_map.md` | Superseded by Unified Roadmap |
| **CVF_Roadmap Drafts** | 15 files in `CVF_AI Systems/CVF_Roadmap/` | Consolidated into 3 key docs |
| **CVF_ECOSYSTEM Structure** | `agents/`, `audit/`, `identity/`, `policy/`, `protocols/`, `system/`, `examples/` | Placeholder structure, not yet implemented |
| **Non-Coder Guides** | `Information for non coder.md`, `Information for non_coder.md` | Superseded by `CVF_VOM_QUICK_START.md` |

---

## 3. .gitignore Status

```
# CVF_Restructure (archived — integration complete, kept as historical reference)
CVF_Restructure/
```

The folder remains `.gitignored`. It is NOT deleted — it serves as the historical origin and audit trail for the ECOSYSTEM restructure decision (ADR-021).

---

## 4. Archive Decision Rules

- **Do NOT delete** `CVF_Restructure/` — it contains audit records referenced by the roadmap
- **Do NOT publish** — contains draft material and private strategy
- **Future integration** — when Track III begins, revisit `CVF_ECOSYSTEM/` placeholder structure for implementation guidance
- **Key innovations** from `CVF_AI Systems/Thong_tin/` (Intent Validation, NL Policy, LLM Risk Engine, Domain Guards) are captured in the Unified Roadmap Phase 2-5

---

## 5. Verification Checklist

- [x] Doctrine (5 files) → `ECOSYSTEM/doctrine/` ✅
- [x] Operating Model (3 files incl. Quick Start) → `ECOSYSTEM/operating-model/` ✅
- [x] Strategy (2 files) → `ECOSYSTEM/strategy/` ✅
- [x] Master Blueprint → `docs/reference/` ✅
- [x] Strategic Compass → `docs/reference/` ✅
- [x] MVGS → `docs/reference/` ✅
- [x] Build Prompt v0.1 → `docs/reference/` ✅
- [x] Independent Reviews → Referenced in roadmap ✅
- [x] .gitignore updated → Comment clarified ✅
- [x] Archive manifest created → This file ✅
