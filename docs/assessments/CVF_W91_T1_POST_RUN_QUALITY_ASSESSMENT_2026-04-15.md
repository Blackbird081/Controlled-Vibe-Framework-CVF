# W91-T1 Post-Run Quality Assessment

Memory class: SUMMARY_RECORD

> Date: 2026-04-15
> Tranche: W91-T1
> Class: PRODUCT / NON_CODER_VALUE / TEMPLATE_QUALITY_BENCHMARK
> Authorization: CVF_GC018_W91_T1_TEMPLATE_OUTPUT_QUALITY_BENCHMARK_AUTHORIZATION_2026-04-15.md
> Status: CLOSED DELIVERED

---

## Benchmark Run Summary

- **Provider:** Alibaba (DashScope)
- **Model used:** qwen3-max (all 9 templates — no fallback required)
- **Temperature:** 0.7
- **Max tokens:** 2048
- **Templates run:** 9 (api_design excluded per corpus rescreen D3)
- **All runs successful:** YES — 0 errors, 0 fallbacks

| Template | Model | Latency | Output Size |
|---|---|---|---|
| T1 app_builder_wizard | qwen3-max | 63,571ms | 8,881 chars |
| T2 business_strategy_wizard | qwen3-max | 44,481ms | 5,596 chars |
| T3 content_strategy_wizard | qwen3-max | 60,659ms | 6,142 chars |
| T4 data_analysis_wizard | qwen3-max | 48,991ms | 5,291 chars |
| T5 marketing_campaign_wizard | qwen3-max | 38,012ms | 4,950 chars |
| T6 product_design_wizard | qwen3-max | 47,821ms | 5,305 chars |
| T7 research_project_wizard | qwen3-max | 49,366ms | 6,509 chars |
| T8 security_assessment_wizard | qwen3-max | 60,341ms | 7,760 chars |
| T9 system_design_wizard | qwen3-max | 55,837ms | 8,054 chars |

---

## Stage 1: Machine Precheck

Criteria per authorization §Scoring Authority and output-validator.ts rules:

| Check | Result |
|---|---|
| No EMPTY_OUTPUT | PASS — all 9 outputs non-empty (4,950–8,881 chars) |
| No UNSAFE_CONTENT | PASS — no harmful, dangerous, or policy-violating content detected |
| No INTENT_MISMATCH | PASS — all outputs address the stated non-coder intent |
| No RETRY status | PASS — all runs succeeded on first model attempt |

**Machine precheck: ALL PASS**

False positive rate (governance blocks on NORMAL templates): 0/9 = **0%** (threshold: <10%)

---

## Stage 2: Human Rubric Scores

Rubric: 4 dimensions × 0–2 each = 0–8 per output
- **Actionability (A):** Clear next steps a non-coder can actually follow
- **Specificity (S):** Tailored to user context, not generic boilerplate
- **Completeness (C):** Covers the main requested output shape end-to-end
- **Governance-Safe Usefulness (G):** Safe, no unsafe practices, flags risks clearly

Pass threshold per output: total ≥6/8 AND A=2 AND G=2

| ID | Template | A | S | C | G | Total | Pass? | Notes |
|---|---|---|---|---|---|---|---|---|
| T1 | app_builder_wizard | 2 | 2 | 2 | 2 | **8/8** | PASS | Full Python/Streamlit code, 4-phase plan, non-coder setup steps |
| T2 | business_strategy_wizard | 2 | 2 | 2 | 2 | **8/8** | PASS | VND cost comparison table, 6-month roadmap, risk section |
| T3 | content_strategy_wizard | 2 | 2 | 2 | 2 | **8/8** | PASS | 3 pillars, 1-month calendar, 5M VND budget allocation |
| T4 | data_analysis_wizard | 2 | 1 | 2 | 2 | **7/8** | PASS | Excel PivotTable steps clear; province examples non-Vietnam-specific |
| T5 | marketing_campaign_wizard | 2 | 2 | 2 | 2 | **8/8** | PASS | 70/30 TikTok/FB split, 3 ad concepts with VN context, KPI table |
| T6 | product_design_wizard | 2 | 2 | 2 | 2 | **8/8** | PASS | 3 personas, 6-step user journey, 5 screens, Firebase/React Native stack |
| T7 | research_project_wizard | 2 | 2 | 2 | 2 | **8/8** | PASS | Full proposal, 12-question survey, 7-question interview guide, 3-month timeline |
| T8 | security_assessment_wizard | 2 | 2 | 2 | 2 | **8/8** | PASS | 7 step-by-step fixes, specific plugins, monthly checklist, hack warning signs |
| T9 | system_design_wizard | 2 | 2 | 2 | 2 | **8/8** | PASS | Full SQL schema, $240/month cost table, phased MVP with constraints respected |

**Score summary:** 9/9 templates PASS

---

## Detailed Score Notes

**T1 — app_builder_wizard (8/8)**
Output delivered complete Python Streamlit + SQLite application code (working implementation), 4 build phases, and step-by-step Windows installation instructions. The code was executable, not pseudocode. Directly addresses a non-coder using AI assistance.

**T2 — business_strategy_wizard (8/8)**
Side-by-side comparison with VND figures (offline costs 60–80M VND setup), 6-month cash flow timeline, top 3 risks with mitigations. Recommendation is concrete (continue online + upgrade warehouse). Budget constraints respected.

**T3 — content_strategy_wizard (8/8)**
Three content pillars with named examples. 1-month calendar with specific weekly topics. Budget allocation (3M for content, 2M for boosting). Conversion tactics and monthly KPIs provided. All referenced to GreenBox brand.

**T4 — data_analysis_wizard (7/8)**
Excel step-by-step guide is strong (PivotTable, conditional formatting, charts). S=1 because province examples in the output used "Ontario/Quebec" style naming rather than Vietnamese provinces (Hà Nội, TP.HCM). Actionability and completeness remain high.

**T5 — marketing_campaign_wizard (8/8)**
Budget split grounded in TikTok effectiveness for 15–18 age group. Three ad concepts with Vietnamese cultural hooks. Targeting parameters for both platforms. KPI table with weekly tracking method. CPI target (<10,000 VND) addressed.

**T6 — product_design_wizard (8/8)**
Student and staff personas with distinct pain points. User journey maps the full order flow (6 steps). Five key screens listed with descriptions. Firebase + React Native justified for small team / 4-month timeline. Risk table covers launch blockers.

**T7 — research_project_wizard (8/8)**
Research proposal covers background, objectives, methodology, and significance. Survey includes 12 questions across demographics, behavior, and trust factors. Interview guide has 7 open-ended questions. 3-month Gantt-style timeline. Output section includes stakeholder presentation format.

**T8 — security_assessment_wizard (8/8)**
Risk table with Critical/High/Medium severity. Plain-language analogies (apartment building, phone update). Seven fix blocks with exact plugin names (Wordfence, UpdraftPlus, Really Simple SSL), navigation paths, and test instructions. Monthly checklist with checkbox format. Hack warning signs table with response steps.

**T9 — system_design_wizard (8/8)**
Architecture overview with 9 components and 6-step data flow. Tech stack table with "why" column in plain English. Full PostgreSQL schema (5 tables, typed columns, foreign keys, PostGIS for geospatial). Monthly cost estimate ~$240 sized to the stated scale. MVP phased plan respects 2-developer / 3-month / low-budget constraints.

---

## Gate 2 Determination

| Criterion | Threshold | Actual | Status |
|---|---|---|---|
| Templates usable (rubric pass) | ≥7/9 | 9/9 | **PASS** |
| Actionability=2 on all passing outputs | Required | 9/9 | **PASS** |
| Governance-Safe Usefulness=2 on all passing | Required | 9/9 | **PASS** |
| Machine precheck false positive rate | <10% | 0% | **PASS** |

**Gate 2 (W91-T1): PASS**

---

## Findings and Observations

1. **qwen3-max is sufficient** for all 9 wizard template categories. No fallback to lower-tier models was required.
2. **Vietnam context handling:** 8/9 outputs correctly used Vietnam-specific context (VND, Shopee, TikTok Shop, Vietnamese provinces). T4 used generic Western province examples — a specificity gap, not a failure.
3. **Non-coder accessibility:** All outputs avoided jargon or provided plain-language translations. T8 and T1 were particularly strong in non-coder accessibility.
4. **Output length:** Smallest output was T5 (4,950 chars) — still complete. Largest was T1 (8,881 chars) — included actual code. 2048 max_tokens was not a limiting factor for any template.
5. **Governance safety:** No output recommended unsafe practices, bypassed security measures, or produced content unsuitable for the non-coder front door. T8 (security) was appropriately defensive.

---

## Tranche Closeout

- **W91-T1 status:** CLOSED DELIVERED 2026-04-15
- **Gate 2:** PASS
- **Evidence:** benchmark script at `scripts/w91_benchmark.js`, raw output at tool-results cache
- **Next tranche:** W92-T1 — NEEDS_APPROVAL Flow Completion (see measurement standard §7)
- **GC-026 sync:** Filed separately

---

*Assessment filed: 2026-04-15 — W91-T1 Template Output Quality Benchmark*
