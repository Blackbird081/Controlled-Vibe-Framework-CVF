# CVF Corpus Rescreen — D1: Template Inventory

Memory class: SUMMARY_RECORD

> Date: 2026-04-15
> Class: CORPUS_QUALITY / PRODUCT / NON_CODER_VALUE
> Status: RESCREEN WAVE 1 — filed
> Authority: CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_ROADMAP_2026-04-14.md

---

## Inventory Summary

Total templates screened: **57**
Categories: 8 (business, technical, content, research, marketing, product, security, development)
Wizard templates (benchmark-bound candidates): 10
Folder containers (non-executable): 2

---

## D1 — Full Template Inventory

| # | Template ID | Category | Type | Front-Door Visible | Notes |
|---|---|---|---|---|---|
| 1 | `business_strategy_wizard` | business | wizard | YES | Benchmark-bound |
| 2 | `strategy_analysis` | business | standard | YES | Bounded inputs + sampleOutput |
| 3 | `risk_assessment` | business | standard | YES | |
| 4 | `competitor_review` | business | standard | YES | |
| 5 | `system_design_wizard` | technical | wizard | YES | Benchmark-bound |
| 6 | `code_review` | technical | standard | YES | Requires code paste; developer-oriented output |
| 7 | `architecture_review` | technical | standard | YES | Requires technical arch knowledge |
| 8 | `content_strategy_wizard` | content | wizard | YES | Benchmark-bound |
| 9 | `documentation` | content | standard | YES | Audience: Developers |
| 10 | `email_template` | content | standard | YES | |
| 11 | `research_project_wizard` | research | wizard | YES | Benchmark-bound |
| 12 | `data_analysis_wizard` | research | wizard | YES | Benchmark-bound |
| 13 | `data_analysis` | research | standard | YES | Methods field requires statistical knowledge |
| 14 | `marketing_campaign_wizard` | marketing | wizard | YES | Benchmark-bound |
| 15 | `seo_audit` | marketing | standard | YES | |
| 16 | `copywriting_evaluation` | marketing | standard | YES | |
| 17 | `landing_page_cro` | marketing | standard | YES | |
| 18 | `pricing_strategy` | marketing | standard | YES | |
| 19 | `content_quality` | marketing | standard | YES | |
| 20 | `email_campaign` | marketing | standard | YES | |
| 21 | `social_ad_review` | marketing | standard | YES | |
| 22 | `brand_voice` | marketing | standard | YES | |
| 23 | `product_design_wizard` | product | wizard | YES | Benchmark-bound |
| 24 | `ab_test_review` | product | standard | YES | A/B statistical analysis; difficulty: advanced |
| 25 | `accessibility_audit` | product | standard | YES | |
| 26 | `user_flow_analysis` | product | standard | YES | |
| 27 | `ux_heuristic_evaluation` | product | standard | YES | |
| 28 | `feature_prioritization` | product | standard | YES | RICE/ICE framework explained |
| 29 | `user_persona` | product | standard | YES | |
| 30 | `error_handling_ux` | product | standard | YES | |
| 31 | `onboarding_review` | product | standard | YES | |
| 32 | `grandma_ux_test` | product | standard | YES | Explicitly non-technical |
| 33 | `security_assessment_wizard` | security | wizard | YES | Benchmark-bound |
| 34 | `api_security` | security | standard | YES | OWASP API Top 10; requires API endpoint knowledge |
| 35 | `gdpr_compliance` | security | standard | YES | |
| 36 | `privacy_policy_audit` | security | standard | YES | |
| 37 | `incident_response` | security | standard | YES | SMB/startup accessible |
| 38 | `data_handling` | security | standard | YES | Storage systems field: technical |
| 39 | `tos_review` | security | standard | YES | |
| 40 | `app_builder_wizard` | development | wizard | YES | Benchmark-bound |
| 41 | `build_my_app` | development | standard | YES | Vibe Coding; explicitly for non-coders |
| 42 | `app_builder_complete` | development | standard | YES | CVF-process-aware users; 13+ technical fields |
| 43 | `individual_skills_folder` | development | folder | YES | Container only; isFolder: true; no outputs |
| 44 | `app_requirements_spec` | development | standard | YES | parentFolder: individual_skills_folder |
| 45 | `tech_stack_selection` | development | standard | YES | Requires developer experience fields |
| 46 | `architecture_design` | development | standard | YES | Requires tech stack + data flow knowledge |
| 47 | `database_schema` | development | standard | YES | Database design — developer skill required |
| 48 | `api_design` | development | standard | YES | **Benchmark-bound**; difficulty: advanced; requires API knowledge |
| 49 | `desktop_app_spec` | development | standard | YES | Framework selection Tauri/Electron/PyQt required |
| 50 | `cli_tool_spec` | development | standard | YES | CLI development — developer audience |
| 51 | `local_deployment` | development | standard | YES | Deployment is technical |
| 52 | `vibe_workflow_folder` | development | folder | YES | Container only; isFolder: true; no outputs |
| 53 | `vibe_to_spec` | development | standard | YES | Plain-language vibe → spec; non-coder designed |
| 54 | `vibe_logic_mapping` | development | standard | YES | Requires tech stack field |
| 55 | `project_init_checklist` | development | standard | YES | Non-coder entry workflow |
| 56 | `non_coder_debug` | development | standard | YES | Explicitly "no technical words needed" |
| 57 | `auto_documentation` | development | standard | YES | Generates plain-language USER_GUIDE.md |

---

## Benchmark-Bound Templates (from measurement standard §6.1)

| Template ID | Type | Classification result |
|---|---|---|
| `app_builder_wizard` | wizard | TRUSTED_FOR_VALUE_PROOF |
| `api_design` | standard | **REVIEW_REQUIRED** — see D2 for rationale |
| `business_strategy_wizard` | wizard | TRUSTED_FOR_VALUE_PROOF |
| `content_strategy_wizard` | wizard | TRUSTED_FOR_VALUE_PROOF |
| `marketing_campaign_wizard` | wizard | TRUSTED_FOR_VALUE_PROOF |
| `product_design_wizard` | wizard | TRUSTED_FOR_VALUE_PROOF |
| `research_project_wizard` | wizard | TRUSTED_FOR_VALUE_PROOF |
| `data_analysis_wizard` | wizard | TRUSTED_FOR_VALUE_PROOF |
| `security_assessment_wizard` | wizard | TRUSTED_FOR_VALUE_PROOF |
| `system_design_wizard` | wizard | TRUSTED_FOR_VALUE_PROOF |

**Finding:** 9 of 10 benchmark-bound templates are TRUSTED_FOR_VALUE_PROOF.
`api_design` is REVIEW_REQUIRED due to technical input requirements — see D2.

---

*Filed: 2026-04-15 — Corpus Rescreen Wave 1, D1*
