# CVF Corpus Rescreen — D2: Classification Matrix

Memory class: SUMMARY_RECORD

> Date: 2026-04-15
> Class: CORPUS_QUALITY / PRODUCT / NON_CODER_VALUE
> Status: RESCREEN WAVE 1 — filed
> Authority: CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md §5

---

## Classification Summary

| Class | Count |
|---|---|
| TRUSTED_FOR_VALUE_PROOF | 39 |
| REVIEW_REQUIRED | 10 |
| LEGACY_LOW_CONFIDENCE | 2 |
| REJECT_FOR_NON_CODER_FRONTDOOR | 7 |
| **Total** | **58** |

---

## Screening Dimensions Key

Scores: PASS / MIXED / FAIL

| Dim | Description |
|---|---|
| UV | Unique Value |
| DP | Domain / Phase Fit |
| RA | Risk / Authority Fit |
| ID | Input Discipline |
| OA | Output Actionability |
| GC | Governance Compatibility |
| FD | Front-Door Suitability |
| LC | Legacy Contamination Risk |

---

## TRUSTED_FOR_VALUE_PROOF (39)

All entries: no FAIL; legacy contamination not above MIXED; OA=PASS; GC=PASS; FD=PASS.

### Benchmark Wizards (9)

| Template ID | UV | DP | RA | ID | OA | GC | FD | LC | Result |
|---|---|---|---|---|---|---|---|---|---|
| `business_strategy_wizard` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `system_design_wizard` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `content_strategy_wizard` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `research_project_wizard` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `data_analysis_wizard` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `marketing_campaign_wizard` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `product_design_wizard` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `security_assessment_wizard` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `app_builder_wizard` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |

Note: wizard templates have `fields: []` — input discipline is handled by the wizard component. Classification assumes wizard component enforces bounded input. This assumption must be verified during W91-T1 execution.

### Business (3)

| Template ID | UV | DP | RA | ID | OA | GC | FD | LC | Result |
|---|---|---|---|---|---|---|---|---|---|
| `strategy_analysis` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `risk_assessment` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `competitor_review` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |

### Content (1)

| Template ID | UV | DP | RA | ID | OA | GC | FD | LC | Result |
|---|---|---|---|---|---|---|---|---|---|
| `email_template` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |

### Marketing (8)

| Template ID | UV | DP | RA | ID | OA | GC | FD | LC | Result |
|---|---|---|---|---|---|---|---|---|---|
| `seo_audit` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `copywriting_evaluation` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `landing_page_cro` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `pricing_strategy` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `content_quality` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `email_campaign` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `social_ad_review` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `brand_voice` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |

### Product (9)

| Template ID | UV | DP | RA | ID | OA | GC | FD | LC | Result |
|---|---|---|---|---|---|---|---|---|---|
| `accessibility_audit` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `user_flow_analysis` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `ux_heuristic_evaluation` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `feature_prioritization` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `user_persona` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `error_handling_ux` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `onboarding_review` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `grandma_ux_test` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `user_persona` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |

### Security (5)

| Template ID | UV | DP | RA | ID | OA | GC | FD | LC | Result |
|---|---|---|---|---|---|---|---|---|---|
| `gdpr_compliance` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `privacy_policy_audit` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `incident_response` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `tos_review` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |

### Development (7)

| Template ID | UV | DP | RA | ID | OA | GC | FD | LC | Result |
|---|---|---|---|---|---|---|---|---|---|
| `build_my_app` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `app_requirements_spec` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `vibe_to_spec` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `project_init_checklist` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `non_coder_debug` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |
| `auto_documentation` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **TRUSTED** |

---

## REVIEW_REQUIRED (10)

No fatal governance conflict; at least one important MIXED dimension.

| Template ID | UV | DP | RA | ID | OA | GC | FD | LC | Blocking MIXED | Result |
|---|---|---|---|---|---|---|---|---|---|---|
| `code_review` | PASS | PASS | PASS | MIXED | MIXED | PASS | MIXED | PASS | FD: developer-oriented output; non-coder can't act on security issues without technical guidance | **REVIEW_REQUIRED** |
| `documentation` | PASS | PASS | PASS | MIXED | MIXED | PASS | MIXED | PASS | FD: "Technical documentation"; audience: Developers; not front-door non-coder | **REVIEW_REQUIRED** |
| `data_analysis` | PASS | PASS | PASS | MIXED | MIXED | PASS | MIXED | PASS | ID: methods field requires statistical knowledge; OA: "Statistical Analysis" output needs interpretation | **REVIEW_REQUIRED** |
| `ab_test_review` | PASS | PASS | PASS | MIXED | MIXED | PASS | MIXED | PASS | ID: "p-value", sample size adequacy; OA: statistical validity requires technical interpretation | **REVIEW_REQUIRED** |
| `api_security` | PASS | PASS | PASS | MIXED | MIXED | PASS | MIXED | PASS | ID: listing API endpoints requires technical knowledge; difficulty: advanced | **REVIEW_REQUIRED** |
| `data_handling` | PASS | PASS | PASS | MIXED | MIXED | PASS | MIXED | PASS | ID: "PostgreSQL on AWS RDS, S3 buckets" — storage systems field is technical | **REVIEW_REQUIRED** |
| `app_builder_complete` | PASS | PASS | PASS | MIXED | PASS | PASS | MIXED | PASS | FD: "for people who understand CVF process"; 13+ fields; difficulty: advanced | **REVIEW_REQUIRED** |
| `api_design` | PASS | PASS | PASS | MIXED | MIXED | PASS | MIXED | PASS | **BENCHMARK-BOUND** per §6.1 but: difficulty: advanced; API concepts (REST/GraphQL, auth types, pagination) require technical context; output is technical spec | **REVIEW_REQUIRED** |
| `vibe_logic_mapping` | PASS | PASS | PASS | MIXED | PASS | PASS | MIXED | PASS | ID: requires tech stack field (e.g. "Streamlit, Next.js"); FD: intermediate step, assumes vibe_to_spec was run | **REVIEW_REQUIRED** |
| `web_ux_redesign_system` | PASS | PASS | PASS | PASS | MIXED | PASS | PASS | PASS | OA: output spans design system, surface blueprint, and implementation guardrails; requires reviewer judgment to keep style reuse aligned with brand and behavior-preservation goals | **REVIEW_REQUIRED** |

### Critical Finding — api_design

`api_design` is listed in measurement standard §6.1 as one of the 10 frozen benchmark templates.
This rescreen classifies it as REVIEW_REQUIRED — it may not be used for benchmark truth under the rescreen standard.

**Required follow-up action:** W91-T1 must either:
1. Replace `api_design` with a TRUSTED_FOR_VALUE_PROOF template as the 10th benchmark item, OR
2. Run a focused review sprint to elevate `api_design` to TRUSTED status (improve input hints, add non-coder example inputs)

This is flagged in D3 (trusted benchmark subset) and D5 (handoff sync).

---

## LEGACY_LOW_CONFIDENCE (2)

Technically retained but too weak for product-value proof.

| Template ID | Category | Reason | Result |
|---|---|---|---|
| `individual_skills_folder` | development | `isFolder: true`; no intentPattern; no outputExpected; not an executable template | **LEGACY_LOW_CONFIDENCE** |
| `vibe_workflow_folder` | development | `isFolder: true`; no intentPattern; no outputExpected; not an executable template | **LEGACY_LOW_CONFIDENCE** |

These folder containers organize the UI but produce no governed output. They must not appear in any benchmark or value-proof path.

---

## REJECT_FOR_NON_CODER_FRONTDOOR (7)

Auto-reject triggered: requires technical execution by the user.

| Template ID | Category | Auto-Reject Reason | Result |
|---|---|---|---|
| `architecture_review` | technical | Requires describing microservices, NFRs, bottlenecks — developer execution | **REJECT** |
| `tech_stack_selection` | development | Requires language preference, performance priority, team experience — developer knowledge | **REJECT** |
| `architecture_design` | development | Requires tech stack, data flow (e.g. "React → Tauri commands → SQLite"), state complexity | **REJECT** |
| `database_schema` | development | Database schema design is a developer task; difficulty: advanced | **REJECT** |
| `desktop_app_spec` | development | Requires framework selection (Tauri/Electron/PyQt), window types, menu bar structure | **REJECT** |
| `cli_tool_spec` | development | CLI tool development is a developer audience; not front-door non-coder | **REJECT** |
| `local_deployment` | development | Deployment configuration is a developer task | **REJECT** |

These 7 templates must not be used as benchmark evidence or value-proof surfaces for non-coder users.
They may remain visible in the platform as advanced/power-user templates, but must be excluded from non-coder front-door claims.

---

*Filed: 2026-04-15 — Corpus Rescreen Wave 1, D2*
