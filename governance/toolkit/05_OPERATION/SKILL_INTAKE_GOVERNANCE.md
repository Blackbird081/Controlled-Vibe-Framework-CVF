# SKILL_INTAKE_GOVERNANCE — External Skill Integration Policy

> **Document Type:** Operational Policy
> **CVF Version:** v1.5.2+
> **Status:** Active
> **Last Updated:** 2026-02-27

---

## Overview

This document defines the mandatory rules and process for integrating **external skills** into the CVF Skill Library. It prevents domain drift, naming conflicts, and misalignment with CVF's core principles.

> [!IMPORTANT]
> All external skills MUST pass this intake process before being placed into any domain. No exceptions.

---

## CVF Skill First Principles

Before evaluating any new skill, reviewers must verify it aligns with:

1. **Non-coder first** — CVF serves non-technical users. Skills must guide users toward a result, not explain technology.
2. **AI/Agent execution** — Skills govern how AI behaves, not what users must do manually.
3. **Domain = job function** — Skills belong to functional areas (app_development, product_ux, finance_analytics...). Never categorize by user type.
4. **Form template purpose** — User-facing skills capture input. Agent skills govern execution. Do not mix these.
5. **English-only content** — All skill section content must be in English for AI/Agent consistency.
6. **Non-coder abstraction first** — If a skill is exposed to non-coders, users must describe goals in plain language while hidden frameworks, stacks, and execution patterns stay inside the generated spec/handoff layer.

---

## Intake Criteria (Pass ALL 5 to proceed)

A skill may enter the CVF Library only if it meets **all 5** of the following:

| # | Criterion | Must Answer YES |
|---|---|---|
| 1 | **Unique value** | Does this skill address something not already in the library? |
| 2 | **CVF phase alignment** | Does it fit one or more phases (Discovery / Design / Build / Review)? |
| 3 | **Form-capable** | Can it be expressed as a form with clear Input → Output? |
| 4 | **Domain-assignable** | Does it naturally belong to an existing functional domain? |
| 5 | **AI-executable** | Can AI/Agent follow the constraints and produce the expected output without human technical knowledge? |
| 6 | **Abstraction-safe for non-coders** | If surfaced to non-coders, can the skill hide technical choices and emit an agent-ready spec instead of asking the user to manage implementation details? |

> [!WARNING]
> If any criterion is answered NO — **STOP**. Do not proceed with intake.

---

## Disqualification Rules (Auto-Reject)

Reject immediately if the skill:

| Disqualifier | Reason |
|---|---|
| Duplicates an existing skill (>70% overlap in purpose) | Causes redundancy and maintenance burden |
| Describes AI behavior without user input | Should be an Agent Tool (v1.6+), not a User Skill |
| Requires technical execution by the user | Violates CVF non-coder principle |
| Exposes hidden technical choices to non-coders | Framework/stack decisions should stay inside the spec/handoff layer |
| Does not produce a verifiable, structured output | Cannot be UAT-tested |
| Content is in Vietnamese or mixed language | All skill content must be in English |
| Proposed domain is based on user type ("non_coder_workflow") | Domains must be job functions, not personas |

---

## Domain Assignment Rules

Use this priority order to assign the correct domain:

1. **Exact match** — does the skill clearly belong to an existing domain? Use it.
2. **Closest functional match** — does the skill support the same workflow as an existing domain? Use the closest.
3. **Cross-domain** — if the skill serves 2+ domains equally, assign to the one where it provides the *most unique value*.
4. **New domain only if** — the skill represents a genuinely new functional area with at least **5+ skills** to justify a new domain folder.

### Existing domains (as of v1.5.2):
`ai_ml_evaluation` | `app_development` | `business_analysis` | `content_creation` | `finance_analytics` | `hr_operations` | `legal_contracts` | `marketing_seo` | `product_ux` | `security_compliance` | `technical_review` | `web_development`

---

## Decision Matrix

| Scenario | Action |
|---|---|
| Unique + fits existing domain + has user input/output | ✅ INTAKE — convert to CVF format, assign domain |
| Partially unique + overlaps with existing skill but different audience | ✅ INTAKE — document distinction in skill header |
| Behavioral directive only (AI must do X) | ❌ REJECT — route to Agent Tools (v1.6+) |
| Duplicate of existing skill | ❌ REJECT — update existing skill if improvements exist |
| No structured output | ❌ REJECT — redesign as proper spec template first |
| Domain unclear | ⚠️ HOLD — request domain assignment from governance reviewer |

---

## Mandatory Sections Checklist (15 Required)

All skills must include these 15 sections validated by `validate_skills.py`:

| # | Section heading | Notes |
|---|---|---|
| 1 | `📌 Prerequisites` | What must exist before using this skill |
| 2 | `🎯 Purpose` | When to use / not to use |
| 3 | `🛡️ Governance Summary (CVF Autonomous)` | Table with 6 fields |
| 4 | `⛔ Execution Constraints` | What AI MUST / MUST NOT do |
| 5 | `✅ Validation Hooks` | Automated checkpoints |
| 6 | `🧪 UAT Binding` | UAT Record path + objective |
| 7 | `📋 Form Input` | Table: Field, Description, Required, Example |
| 8 | `✅ Expected Output` | Concrete output format |
| 9 | `🔍 Evaluation Criteria` | Accept checklist + Red Flags |
| 10 | `⚠️ Common Failures` | Table: Error + Prevention |
| 11 | `💡 Tips` | Numbered list of best practices |
| 12 | `📊 Example` | Sample Input + Sample Output + Evaluation |
| 13 | `🔗 Next Step` | What to do after this skill completes |
| 14 | `🔗 Related Skills` | Links to related skills |
| 15 | `📜 Version History` | Table: Version, Date, Changes |

---

## Language Rule

> [!IMPORTANT]
> **All skill content MUST be written in English.**

- Section headers: English with emoji prefix (as above)
- All descriptions, constraints, examples: English
- UAT Record path: English domain name (e.g. `app_development`, not `phat-trien-ung-dung`)
- Footer line format: `*[Skill Name] — CVF v1.5.2 [Domain Name] Skill Library*`

---

## Template Bridge Requirement

Every skill integrated into the library **MUST** have a corresponding Template entry for full bidirectional navigation.

### Steps:
1. Create the Template in the appropriate `src/lib/templates/*.ts` file
2. Add the Template↔Skill mapping to `src/lib/skill-template-map.ts`
3. Verify the "📚 View related Skill" and "📝 Use Template" links work in the Web UI

### Non-Coder Front-Door Standard

If the skill will be visible in the non-coder front door, the Template layer must additionally satisfy all rules below:

1. **Plain-language fields only** — labels and hints must ask for goals, users, flows, constraints, and examples; not framework, stack, or hidden implementation choices
2. **Spec/Handoff output required** — the resulting packet must be ready for another AI/agent to continue from
3. **Hidden technique ownership stays with CVF** — frameworks, internal patterns, and execution tactics are resolved by CVF/agent, not delegated back to the user
4. **Sample output preview required** — the template should show a believable sample packet so non-coders know what they are creating
5. **Preservation guard required** — if the skill can touch existing systems, the form must include a way to declare what must not change

If any of the five rules above is missing, the skill may still exist internally, but it is **not ready for non-coder front-door exposure**.

### Legacy Alignment Strategy

When standardizing an existing front-door corpus, do **not** start by rewriting every skill file manually.

Use this order:

1. align the shared packet/export layer so every front-door template emits a governed handoff packet
2. align the shared execution/runtime layer so hidden metadata and guards stay inside CVF, not on the user
3. run a deterministic front-door audit against all linked templates
4. manually rewrite only the templates/skills that still fail the audit

This is the default path for bringing legacy skills forward to the non-coder standard without creating avoidable maintenance noise.

---

## UAT Path Convention

UAT Record paths follow this format:

```
governance/skill-library/uat/results/UAT-{domain}-{skill_filename_without_extension}.md
```

Examples:
- `UAT-app_development-01_vibe_to_spec.md`
- `UAT-product_ux-04_grandma_ux_test.md`
- `UAT-finance_analytics-09_financial_trend_predictor.md`

---

## Governance Pipeline (Run After Every Intake)

After all skill files are created and validated, run the full pipeline:

```bash
# Step 1: Validate all skill files
python tools/skill-validation/validate_skills.py --root EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS
# → Must have 0 new errors from new skills

# Step 2: Regenerate governance records
python governance/skill-library/registry/generate_user_skills.py

# Step 3: Regenerate UAT records
python governance/skill-library/uat/generate_uat_records.py

# Step 4: Score UAT
python governance/skill-library/uat/score_uat.py

# Step 5: Rebuild skill index (for Web UI)
node EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/scripts/build-skill-index.js

# Step 6: TypeScript build check
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run build

# Step 7: Commit and push
git add -A
git commit -m "feat(skills): [domain] add [skill_name] — CVF v1.5.2 intake"
git push origin main
```

---

## Skill File Naming Convention

```
{nn}_{skill_identifier}.skill.md
```

Where:
- `nn` = zero-padded 2-digit sequence number within the domain (01, 02...)
- `skill_identifier` = snake_case, descriptive, max 4 words

Examples: `01_vibe_to_spec.skill.md`, `04_grandma_ux_test.skill.md`

---

## Intake Record

Document every intake decision in the Version History section of the skill file:

```markdown
| 1.0.0 | YYYY-MM-DD | Initial creation from [source] — CVF-Compatible Skills intake |
| 1.1.0 | YYYY-MM-DD | Translated to English; domain corrected to [domain] |
```

---

*SKILL_INTAKE_GOVERNANCE — CVF v1.5.2 Operational Policy*
