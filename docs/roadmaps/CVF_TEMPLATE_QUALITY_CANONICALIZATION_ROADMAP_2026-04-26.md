# CVF Template Quality Canonicalization Roadmap
**Date:** 2026-04-26  
**Triggered by:** Skill portfolio canonicalization (131 → 62 → 27 active skills, commit d4b3382b)  
**Status:** PROPOSAL — Awaiting owner approval before execution  
**Author:** Audit pass by Claude Code (Sonnet 4.6)

---

## 1. Context & Motivation

The skill library was canonicalized from 131 → 27 active skills to enforce a quality-first standard. This audit applies the same standard to the template layer. A template that lacks governance backing (no live skill reference) or is structurally incomplete degrades the overall CVF UX and misleads users about what the platform can guarantee.

**Core principle:** Every template surfaced to users must be backed by a live skill, produce a complete governed spec, and have a verifiable output structure. Templates that cannot satisfy this must be removed, not archived.

---

## 2. Audit Evidence

### 2.1 Data Sources
| Source | Path |
|---|---|
| Template definitions | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/*.ts` |
| Skill-template mapping | `src/data/skill-template-map.json` |
| Active skill library | `public/data/skills-index.json` |

### 2.2 Inventory (as of 2026-04-26)

| Type | Count | Notes |
|---|---|---|
| Total template objects | 59 | In 8 category TS files |
| Folder containers | 2 | `individual_skills_folder`, `vibe_workflow_folder` — UI organizers only |
| Wizard templates | 9 | Have dedicated multi-step UI components (`*Wizard.tsx`) |
| Form templates | 48 | Standard single-page form with fields |
| **Active skills in library** | **27** | Post-canonicalization |

### 2.3 Full Evidence Table

```
TYPE   | CAT         | ID                        | F  | R | I | OE | OT | SO | MAP  | SKILL_ID
-------|-------------|---------------------------|----|---|---|----|----|----|------|---------------------------
WIZARD | business    | business_strategy_wizard  | 0  | 0 | N | Y  | N  | N  | LIVE | 04_business_plan
FORM   | business    | strategy_analysis         | 5  | 2 | Y | Y  | Y  | Y  | LIVE | 01_strategy_analysis
FORM   | business    | risk_assessment           | 5  | 2 | Y | Y  | N  | N  | LIVE | 02_risk_assessment
FORM   | business    | competitor_review         | 4  | 3 | Y | Y  | N  | N  | LIVE | 03_market_research
WIZARD | content     | content_strategy_wizard   | 0  | 0 | N | Y  | N  | N  | LIVE | 01_documentation
FORM   | content     | documentation             | 5  | 3 | Y | Y  | Y  | Y  | LIVE | 01_documentation
FORM   | content     | email_template            | 4  | 2 | Y | Y  | N  | N  | LIVE | 02_report_writing
WIZARD | development | app_builder_wizard        | 0  | 0 | N | Y  | N  | N  | LIVE | 01_app_requirements_spec
FORM   | development | build_my_app              | 5  | 4 | Y | Y  | N  | N  | LIVE | 01_app_requirements_spec
FORM   | development | app_builder_complete      | 12 | 7 | Y | Y  | Y  | N  | LIVE | 01_app_requirements_spec
FORM   | development | app_requirements_spec     | 9  | 7 | Y | Y  | N  | N  | LIVE | 01_app_requirements_spec
FORM   | development | tech_stack_selection      | 9  | 6 | Y | Y  | N  | N  | DEAD | 02_tech_stack_selection ❌
FORM   | development | architecture_design       | 7  | 5 | Y | Y  | N  | N  | LIVE | 03_architecture_design
FORM   | development | database_schema           | 7  | 5 | Y | Y  | N  | N  | DEAD | 04_database_schema_design ❌
FORM   | development | api_design                | 6  | 4 | Y | Y  | Y  | N  | LIVE | 05_api_design_spec
FORM   | development | desktop_app_spec          | 9  | 6 | Y | Y  | N  | N  | DEAD | 06_desktop_app_spec ❌
FORM   | development | cli_tool_spec             | 8  | 5 | Y | Y  | N  | N  | LIVE | 07_project_init_checklist
FORM   | development | local_deployment          | 7  | 4 | Y | Y  | N  | N  | DEAD | 08_local_deployment ❌
FORM   | development | vibe_to_spec              | 3  | 2 | Y | Y  | N  | N  | LIVE | 01_app_requirements_spec
FORM   | development | vibe_logic_mapping        | 4  | 3 | Y | Y  | Y  | N  | LIVE | 03_architecture_design
FORM   | development | project_init_checklist    | 4  | 4 | Y | Y  | N  | N  | LIVE | 07_project_init_checklist
FORM   | development | non_coder_debug           | 3  | 2 | Y | Y  | N  | N  | NONE | — ❌
FORM   | development | auto_documentation        | 5  | 4 | Y | Y  | N  | N  | NONE | — ❌
WIZARD | marketing   | marketing_campaign_wizard | 0  | 0 | N | Y  | N  | N  | LIVE | 01_seo_audit
FORM   | marketing   | seo_audit                 | 4  | 2 | Y | Y  | N  | Y  | LIVE | 01_seo_audit
FORM   | marketing   | copywriting_evaluation    | 5  | 4 | Y | Y  | N  | N  | LIVE | 03_content_quality_review
FORM   | marketing   | landing_page_cro          | 5  | 3 | Y | Y  | N  | N  | LIVE | 03_content_quality_review
FORM   | marketing   | pricing_strategy          | 5  | 4 | Y | Y  | N  | N  | LIVE | 05_brand_strategy_review
FORM   | marketing   | content_quality           | 4  | 4 | Y | Y  | N  | N  | LIVE | 03_content_quality_review
FORM   | marketing   | email_campaign            | 4  | 4 | Y | Y  | N  | N  | LIVE | 03_content_quality_review
FORM   | marketing   | social_ad_review          | 5  | 5 | Y | Y  | N  | N  | LIVE | 04_social_media_review
FORM   | marketing   | brand_voice               | 5  | 4 | Y | Y  | N  | N  | LIVE | 05_brand_strategy_review
WIZARD | product     | product_design_wizard     | 0  | 0 | N | Y  | N  | N  | LIVE | 02_user_flow_analysis
FORM   | product     | ab_test_review            | 5  | 3 | Y | Y  | Y  | N  | NONE | — ⚠️ (see note)
FORM   | product     | accessibility_audit       | 4  | 2 | Y | Y  | N  | N  | LIVE | 04_accessibility_audit
FORM   | product     | user_flow_analysis        | 4  | 2 | Y | Y  | N  | N  | LIVE | 02_user_flow_analysis
FORM   | product     | ux_heuristic_evaluation   | 4  | 2 | Y | Y  | N  | N  | LIVE | 03_ux_heuristic_evaluation
FORM   | product     | feature_prioritization    | 4  | 2 | Y | Y  | N  | N  | NONE | — ❌
FORM   | product     | user_persona              | 4  | 2 | Y | Y  | N  | N  | LIVE | 01_user_persona_development
FORM   | product     | error_handling_ux         | 4  | 2 | Y | Y  | N  | N  | NONE | — ❌
FORM   | product     | onboarding_review         | 4  | 2 | Y | Y  | N  | N  | LIVE | 05_onboarding_experience_review
FORM   | product     | web_ux_redesign_system    | 10 | 6 | Y | Y  | Y  | Y  | LIVE | cvf_web_ux_redesign_system
FORM   | product     | web_build_handoff         | 7  | 6 | Y | Y  | Y  | Y  | LIVE | cvf_web_ux_redesign_system
FORM   | product     | grandma_ux_test           | 3  | 2 | Y | Y  | N  | N  | NONE | — ❌
WIZARD | research    | research_project_wizard   | 0  | 0 | N | Y  | N  | N  | LIVE | 01_model_selection
WIZARD | research    | data_analysis_wizard      | 0  | 0 | N | Y  | N  | N  | LIVE | 01_finance_analysis_system
FORM   | research    | data_analysis             | 4  | 2 | Y | Y  | Y  | Y  | LIVE | 01_finance_analysis_system
WIZARD | security    | security_assessment_wizard| 0  | 0 | N | Y  | N  | N  | LIVE | 01_security_assessment
FORM   | security    | api_security              | 4  | 3 | Y | Y  | Y  | N  | LIVE | 01_security_assessment
FORM   | security    | gdpr_compliance           | 4  | 3 | Y | Y  | N  | N  | LIVE | 02_data_privacy_compliance
FORM   | security    | privacy_policy_audit      | 4  | 3 | Y | Y  | N  | N  | LIVE | 02_data_privacy_compliance
FORM   | security    | incident_response         | 4  | 3 | Y | Y  | N  | N  | LIVE | 03_incident_response
FORM   | security    | data_handling             | 4  | 3 | Y | Y  | Y  | N  | LIVE | 02_data_privacy_compliance
FORM   | security    | tos_review                | 4  | 4 | Y | Y  | N  | N  | NONE | — ❌
WIZARD | technical   | system_design_wizard      | 0  | 0 | N | Y  | N  | N  | LIVE | 02_architecture_review
FORM   | technical   | code_review               | 5  | 3 | Y | Y  | Y  | Y  | LIVE | 01_code_review
FORM   | technical   | architecture_review       | 4  | 2 | Y | Y  | N  | N  | NONE | — ❌
```

**Column key:** F=field count, R=required fields, I=intentPattern, OE=outputExpected, OT=outputTemplate, SO=sampleOutput, MAP=skill mapping status (LIVE/DEAD/NONE)

### 2.4 Quality Distribution (Form templates, 6-point scoring)

| Bucket | Score | Count | Criteria failed |
|---|---|---|---|
| 🥇 Gold | 6/6 | **11** | None — production-ready |
| 🥈 Silver | 5/6 | **26** | Missing `outputTemplate` only |
| 🥉 Bronze | 4/6 | **11** | Missing `outputTemplate` + dead/no skill |
| ❌ DEAD mapping | — | **4** | Skill archived, no replacement in library |
| ⚠️ NONE mapping | — | **8** | No skill backing at all |

**Wizard quality (separate track):** All 9 wizards map to live skills. Wizards have empty `fields:[]` by design — their form logic lives in dedicated `*Wizard.tsx` components with multi-step state management.

### 2.5 Critical Findings

**F1 — 4 templates reference archived skills (data integrity breach):**
- `development/tech_stack_selection` → `02_tech_stack_selection` (archived)
- `development/database_schema` → `04_database_schema_design` (archived)
- `development/desktop_app_spec` → `06_desktop_app_spec` (archived)
- `development/local_deployment` → `08_local_deployment` (archived)

**F2 — 8 form templates have no skill governance backing:**
`non_coder_debug`, `auto_documentation`, `ab_test_review`, `feature_prioritization`, `error_handling_ux`, `grandma_ux_test`, `tos_review`, `architecture_review`

**F3 — 26 Silver templates structurally complete but missing `outputTemplate`:**  
Users can fill fields and get a governed spec, but the AI has no structured markdown skeleton to enforce output shape — reducing consistency of results.

**F4 — Only 4 Gold templates have `sampleOutput`:**  
`strategy_analysis`, `documentation`, `data_analysis`, `code_review` + 2 product UX templates. Without sample output, users cannot calibrate expectation quality.

**Special case — `ab_test_review`:**  
Score 5/6 despite no skill mapping (has fields, intent, outputExpected, outputTemplate). Highest-quality orphan. Recommend: add mapping to `product_ux/02_user_flow_analysis` rather than delete.

---

## 3. Proposed Template Quality Standard

### 3.1 CVF Template Quality Rules (mandatory for all new templates)

These rules must be enforced by CI via an automated test gate in `src/lib/templates/index.test.ts`.

**RULE-T1 — Minimum input richness**  
Form templates MUST have ≥3 input fields, with ≥1 marked `required: true`.  
Wizard templates are exempt (form logic in component).

**RULE-T2 — Intent completeness**  
`intentPattern` MUST be non-empty and MUST include:
- A `SUCCESS CRITERIA:` block with ≥3 measurable criteria
- An `OUTPUT FORMAT` block with named section headings

**RULE-T3 — Output definition**  
`outputExpected` MUST be present with ≥3 items.  
`outputTemplate` MUST be present (markdown skeleton for the AI to follow).

**RULE-T4 — Skill governance backing**  
Every template MUST appear in `skill-template-map.json` with a `skillId` that exists in `public/data/skills-index.json`.  
The CI test MUST validate this cross-reference at build time.

**RULE-T5 — No dead references**  
Any `skillId` in `skill-template-map.json` that is not present in the active skill library MUST be treated as a build error. Template must be re-mapped or removed before merge.

**RULE-T6 — Sample output (STRONGLY RECOMMENDED)**  
`sampleOutput` SHOULD be present to set user quality expectations. Gold rating requires it.

### 3.2 Quality Tiers (enforced by rules)

| Tier | Criteria | Gate |
|---|---|---|
| **Gold** | T1+T2+T3+T4+T5+T6 (all 6 rules) | Public showcase eligible |
| **Silver** | T1+T2+T3+T4+T5 (no sampleOutput) | Public listing eligible |
| **Bronze** | Fails any of T1–T5 | BLOCKED from merge |
| **Wizard** | T4+T5 + component exists | Separate track |

---

## 4. Action Plan

### Phase 0 — CI Gate (mandatory first, blocks everything else)
**Deliverable:** New test block in `src/lib/templates/index.test.ts`  
**Tests to add:**
1. All templates in `skill-template-map.json` have a matching template ID in the template array
2. All `skillId` values in `skill-template-map.json` exist in `skills-index.json`
3. All non-wizard form templates have `fields.length >= 3`
4. All non-wizard form templates have `intentPattern.length > 50`
5. All non-wizard form templates have `outputTemplate` defined
6. All non-wizard form templates are present in `skill-template-map.json`

> This gate transforms the quality standard from aspiration to enforcement. No template can regress once landed.

### Phase 1 — Hard deletions (12 templates removed)

**1A — Delete 4 dead-skill templates** (data integrity breach, delete immediately):
- `development/tech_stack_selection`
- `development/database_schema`
- `development/desktop_app_spec`
- `development/local_deployment`
- Also remove their entries from `skill-template-map.json`

**1B — Delete 7 unmapped templates** (no governance backing):
- `development/non_coder_debug`
- `development/auto_documentation`
- `product/feature_prioritization`
- `product/error_handling_ux`
- `product/grandma_ux_test`
- `security/tos_review`
- `technical/architecture_review`

**1C — Rescue decision on `ab_test_review`:**  
Option A (recommended): Add mapping `ab_test_review → product_ux/02_user_flow_analysis`, add `sampleOutput` → promote to Gold.  
Option B: Delete with the others.  
Argument for rescue: It has `outputTemplate` already (rare), strong fields, good intent structure — only missing governance link. Adding a mapping is a 2-line change.

**Result after Phase 1:**  
48 form templates → **36 form templates** (Option A: 37) + 9 wizards = **45–46 active templates**

### Phase 2 — Silver → Gold upgrade (26 templates)

Systematically add `outputTemplate` markdown skeletons to all 26 Silver templates.  
Priority order: business (3) → content (1) → development (7) → marketing (8) → product (6) → security (3) → security (1).

Each `outputTemplate` must follow the heading structure already defined in the template's `intentPattern` OUTPUT FORMAT block.

**Estimated effort:** ~30 min per template × 26 = 1 focused session.  
**Recommended approach:** Batch by domain, write all at once, run CI.

### Phase 3 — Add `sampleOutput` to remaining Gold templates

Currently only 6 templates have `sampleOutput`. After Phase 2 upgrade, add `sampleOutput` to all Gold templates to reach full 6/6 across the board.

**Targets:** All templates that reach 6/6 post-Phase-2 (est. 36 templates).

---

## 5. Post-Cleanup Expected State

| Metric | Before | After (Option A) |
|---|---|---|
| Total runnable templates | 56 (+ 2 folders + wizard 9) | 46 (+ 2 folders + wizard 9) |
| Templates with live skill | 45/56 (80%) | 46/46 (100%) |
| Gold templates | 11 (20%) | ~37 (80%) — after Phase 2+3 |
| Dead skill mappings | 4 | 0 |
| CI gate failures | No gate | Build fails on any violation |

---

## 6. Open Questions for Owner Decision

**Q1.** Delete or rescue `ab_test_review`?  
Recommendation: Rescue — 2-line mapping change, highest-quality orphan, has outputTemplate.

**Q2.** Delete `architecture_review` or merge into `system_design_wizard` scope?  
Recommendation: Delete — `code_review` (Gold) + `system_design_wizard` (Wizard) already cover this domain. A standalone Bronze template with no skill adds noise.

**Q3.** Phase 2 timing — same commit or separate tranche?  
Recommendation: Separate. Phase 0+1 can land immediately (cleanup). Phase 2 (26 outputTemplates) is content work that benefits from domain expertise review per category.

**Q4.** Should wizard templates also be required to have `outputTemplate` in their `Template` object?  
Recommendation: No. Wizard UX is controlled by the component. The governed spec is generated at the wizard's final step, which has its own structured output logic. Requiring it in the Template object creates false duplication.

---

## 7. Files to Change (Phase 0 + 1)

```
MODIFY: src/lib/templates/index.test.ts        (add 6 CI enforcement tests)
MODIFY: src/lib/templates/development.ts       (delete 4 dead + 2 unmapped)
MODIFY: src/lib/templates/product.ts           (delete 3–4 unmapped, rescue ab_test_review)
MODIFY: src/lib/templates/security.ts          (delete tos_review)
MODIFY: src/lib/templates/technical.ts         (delete architecture_review)
MODIFY: src/data/skill-template-map.json       (remove 4 dead entries, add ab_test_review if rescued)
```

---

## 8. Dissenting / Challenge Notes

*Adversarial review by independent agent (2026-04-26). 9 challenges raised.*

**C1 — Deletion list conflates registry gaps with quality failures.**  
`non_coder_debug` (4/6), `auto_documentation` (5/6), `grandma_ux_test`, `feature_prioritization`, `error_handling_ux` all have complete intent, fields, and success criteria. Their only failure is missing a `skill-template-map.json` entry — a 2-line JSON fix, not a content problem. The roadmap recommends deletion to solve a registry problem.  
→ *Revised action: attempt re-mapping to nearest live skill before deleting.*

**C2 — `ab_test_review` rescue to `user_flow_analysis` is semantically incorrect.**  
A/B test review is experiment decision-making (rollout/rollback under statistical uncertainty). `user_flow_analysis` is funnel and journey analysis. The skills are different domains. Mapping them creates a false governance link.  
→ *Revised action: delete for now; re-create correctly only when a `product_ux/experiment_review` skill exists.*

**C3 — `architecture_review` deletion is wrong — skill `02_architecture_review` already exists in the library.**  
`skill-template-map.json` already maps `system_design_wizard → 02_architecture_review`. The same skill can back `architecture_review` with a 1-line JSON entry. Deleting a template because its JSON registry entry is missing while the backing skill is live is an unnecessary loss.  
→ *Revised action: add `"architecture_review": { "domain": "technical_review", "skillId": "02_architecture_review" }` to the map. Add `outputTemplate`. Do not delete.*

**C4 — `tos_review` fills a real gap; `privacy_policy_audit` covers a legally distinct document.**  
ToS and Privacy Policy are separate legal instruments. The security domain would lose its only ToS audit path. `tos_review` scores 4/6 with only registry+sampleOutput missing.  
→ *Revised action: map to `02_data_privacy_compliance` (nearest live skill). Add `outputTemplate`. Retain.*

**C5 — Wizard governance claim is unverified. `SystemDesignWizard.tsx` uses a local `generateConsolidatedSpec()`, not `generateCompleteSpec()`.**  
The governed constraint blocks (Execution Constraints, Validation Hooks, CVF Non-Coder Success Standard, Governed Response Rules, Knowledge Preference) injected by `generateCompleteSpec` are absent from wizard-generated output. All 9 wizards must be verified.  
→ *New RULE-T7 required: Wizard components MUST use `generateCompleteSpec` or equivalent governed wrapper.*

**C6 — RULE-T2 CI gate is toothless. Test checks `intentPattern.length > 50`, not `SUCCESS CRITERIA:` presence.**  
Rule text and enforcement are decoupled. A 51-character intent passes T2 under the proposed test. Many Silver templates lack an `OUTPUT FORMAT:` block entirely.  
→ *Fix: CI test must assert `intentPattern.includes('SUCCESS CRITERIA:')` and `intentPattern.includes('OUTPUT FORMAT')` as substring checks.*

**C7 — 6-point score conflates content quality with governance registry.**  
`ab_test_review` (5/6, excellent quality, missing registry) scores same as a low-quality but fully-mapped template. The score is misleading as a single dimension.  
→ *Recommended fix: split into Content Score (T1+T2+T3+T6, max 4) and Governance Score (T4+T5, max 2). Both must be > 0 for display eligibility.*

**C8 — Phase 2 effort is underestimated.**  
Many Silver templates have no `OUTPUT FORMAT:` block in intentPattern. Adding `outputTemplate` correctly requires coordinating both changes per template. Estimate 45–60 min/template if RULE-T2 is simultaneously enforced, not 30 min.

**C9 — Dead-skill templates (1A) should be re-mapped before delete.**  
`tech_stack_selection` (9 fields), `database_schema` (7 fields) are structurally complete. They could map to `01_app_requirements_spec` and `03_architecture_design` respectively. Deleting loses content that took effort to build.  
→ *Check re-mapping feasibility first; delete only if semantics do not fit any live skill.*

---

**ADVERSARIAL VERDICT:** Roadmap is sound in framing but 3 deletions are wrong (`architecture_review`, `tos_review`, and `non_coder_debug`/`auto_documentation` family). RULE-T7 and T2 enforcement gap are real structural deficiencies. Fix these before execution.

---

> **Audit basis:** Machine-generated via Python cross-reference of template TS files × `skill-template-map.json` × `skills-index.json`. Evidence table in §2.3 is the authoritative source. All counts verified against live file content as of 2026-04-26.
