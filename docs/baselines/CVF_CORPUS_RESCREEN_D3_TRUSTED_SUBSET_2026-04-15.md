# CVF Corpus Rescreen — D3: Trusted Benchmark Subset

Memory class: SUMMARY_RECORD

> Date: 2026-04-15
> Class: CORPUS_QUALITY / BENCHMARK_AUTHORITY
> Status: FROZEN — trusted subset for W91/W93/W96 use
> Authority: CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md §7

---

## Freeze Statement

This document freezes the trusted subset of CVF templates that may be used as benchmark evidence
in W91-T1, W93-T1, and W96-T1.

Only items listed here as TRUSTED may produce truth-bearing benchmark results.

---

## Benchmark-Ready Subset (9 wizards)

These 9 wizard templates are confirmed TRUSTED_FOR_VALUE_PROOF for benchmark use in W91-T1:

| # | Template ID | Category | Benchmark Role |
|---|---|---|---|
| 1 | `app_builder_wizard` | development | Primary: non-coder app creation |
| 2 | `business_strategy_wizard` | business | Primary: strategic decision support |
| 3 | `content_strategy_wizard` | content | Primary: content planning |
| 4 | `data_analysis_wizard` | research | Primary: data insight generation |
| 5 | `marketing_campaign_wizard` | marketing | Primary: campaign planning |
| 6 | `product_design_wizard` | product | Primary: product design spec |
| 7 | `research_project_wizard` | research | Primary: research planning |
| 8 | `security_assessment_wizard` | security | Primary: security posture assessment |
| 9 | `system_design_wizard` | technical | Primary: system design documentation |

**`api_design` is NOT in this frozen subset.** See §2 below.

---

## §1 — TRUSTED Non-Wizard Templates (30)

These templates are TRUSTED_FOR_VALUE_PROOF and may be used as supporting benchmark surfaces
(not primary benchmark items unless specifically authorized in a future tranche):

**business:** strategy_analysis, risk_assessment, competitor_review

**content:** email_template

**marketing:** seo_audit, copywriting_evaluation, landing_page_cro, pricing_strategy, content_quality, email_campaign, social_ad_review, brand_voice

**product:** accessibility_audit, user_flow_analysis, ux_heuristic_evaluation, feature_prioritization, user_persona, error_handling_ux, onboarding_review, grandma_ux_test

**security:** gdpr_compliance, privacy_policy_audit, incident_response, tos_review

**development:** build_my_app, app_requirements_spec, vibe_to_spec, project_init_checklist, non_coder_debug, auto_documentation

---

## §2 — api_design Status

`api_design` was listed as one of the 10 frozen benchmark template IDs in the measurement standard §6.1.

This rescreen classifies it as **REVIEW_REQUIRED**, not TRUSTED.

**Reason:** `api_design` has difficulty: advanced, requires technical inputs (API style selection, resource/entity naming, auth type selection, pagination strategy), and produces a technical output document that a non-coder cannot directly act on without developer mediation.

**Consequence for W91-T1:**
W91-T1 must use the 9 confirmed trusted wizards as its benchmark subset.
The measurement standard §6.1 frozen list requires an amendment to replace `api_design` with another TRUSTED template OR to elevate `api_design` after a focused review sprint.

**Proposed resolution path:**
- Option A: Replace `api_design` with `build_my_app` (TRUSTED, explicitly non-coder, development category) — this maintains category coverage
- Option B: Run a focused review sprint to improve `api_design` input hints and provide non-coder example inputs, then re-classify as TRUSTED before W93-T1

W91-T1 may proceed with 9 trusted wizards under Option A without blocking. Option B requires a future mini-tranche.

---

## §3 — Wizard Input Discipline Verification Required

All 9 trusted benchmark wizards have `fields: []` in the template file — input is handled by the wizard component.

The TRUSTED classification for these wizards assumes the wizard component enforces bounded input.

**Required during W91-T1:** verify that wizard component input collection is structured, bounded, and non-coder legible before treating first benchmark run results as conclusive.

If wizard component input discipline is found to be poor during W91-T1 execution, the affected wizard's classification must be downgraded to REVIEW_REQUIRED before the benchmark run is treated as proof.

---

## §4 — Freeze Rule

After this document is committed:

- The 9 wizards listed in the benchmark-ready subset are the ONLY templates that may be used for W91-T1 primary benchmark runs
- No other template may produce a benchmark truth claim without a separate TRUSTED classification decision
- This freeze applies to W91-T1, W93-T1, and W96-T1 unless overridden by a subsequent rescreen wave document

---

*Filed: 2026-04-15 — Corpus Rescreen Wave 1, D3*
