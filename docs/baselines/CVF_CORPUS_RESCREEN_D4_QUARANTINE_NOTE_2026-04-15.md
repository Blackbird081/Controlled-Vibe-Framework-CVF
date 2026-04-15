# CVF Corpus Rescreen — D4: Legacy Quarantine Note

Memory class: SUMMARY_RECORD

> Date: 2026-04-15
> Class: CORPUS_QUALITY / QUARANTINE
> Status: RESCREEN WAVE 1 — filed
> Authority: CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md §7

---

## Purpose

This document identifies templates that must not be used as evidence for non-coder product value
or public-facing CVF capability claims.

Quarantined items may remain in the platform for advanced users or power users.
They must never appear in benchmark runs, value-proof tranches, or public capability statements.

---

## LEGACY_LOW_CONFIDENCE (2 items)

These templates are folder containers — they have no executable intent pattern and produce no governed output.
They are UI scaffolding only.

| Template ID | Category | Reason quarantined |
|---|---|---|
| `individual_skills_folder` | development | `isFolder: true`; `intentPattern: ''`; `outputExpected: []`; contains sub-templates but produces nothing itself |
| `vibe_workflow_folder` | development | `isFolder: true`; `intentPattern: ''`; `outputExpected: []`; container for vibe workflow sub-templates |

**Rule:** These items must never be counted in template quality metrics or used as benchmark surfaces.

---

## REJECT_FOR_NON_CODER_FRONTDOOR (7 items)

These templates are actively unsuitable for the non-coder front door. They require technical execution
by the user, serve a developer audience, or are too vague to support bounded non-coder use.

| Template ID | Category | Rejection reason | May remain in platform? |
|---|---|---|---|
| `architecture_review` | technical | Requires technical architecture knowledge (microservices, NFRs, bottlenecks) | YES — power user / developer lane only |
| `tech_stack_selection` | development | Requires developer expertise (language choice, performance priority, team experience) | YES — power user / developer lane only |
| `architecture_design` | development | Requires tech stack + data flow description — developer task | YES — power user / developer lane only |
| `database_schema` | development | Database schema design is a developer skill; difficulty: advanced | YES — power user / developer lane only |
| `desktop_app_spec` | development | Framework selection (Tauri/Electron/PyQt), window config — technical | YES — power user / developer lane only |
| `cli_tool_spec` | development | CLI tool specification is a developer audience task | YES — power user / developer lane only |
| `local_deployment` | development | Deployment configuration is technical | YES — power user / developer lane only |

---

## REVIEW_REQUIRED (9 items)

These templates are not quarantined but are excluded from benchmark truth until review is complete.
They may remain visible to non-coders but must not be cited as evidence of non-coder value delivery.

| Template ID | Category | Blocking MIXED | Follow-up needed |
|---|---|---|---|
| `code_review` | technical | FD: output is developer-oriented | Add non-coder interpretation layer or simplify output format |
| `documentation` | content | FD: primary audience is developers | Reframe for non-coder use case or restrict audience label |
| `data_analysis` | research | ID: methods field; OA: statistical output | Improve hints; add non-technical interpretation output section |
| `ab_test_review` | product | ID: p-value / sample size; OA: statistical interpretation | Simplify to non-technical A/B review mode |
| `api_security` | security | ID: requires listing API endpoints | Add non-coder guidance for endpoint identification |
| `data_handling` | security | ID: storage systems field (PostgreSQL, S3) | Simplify to conceptual data type selection |
| `app_builder_complete` | development | FD: explicitly for CVF-process-aware users | Consider restricting to power user lane |
| `api_design` | development | **Benchmark-bound but REVIEW_REQUIRED** — see D3 | Improve input hints + non-coder examples; re-classify before W93-T1 |
| `vibe_logic_mapping` | development | ID: tech stack field required | Add plain-language tech stack selection to prerequisite step |

---

## What Must NOT Happen

1. LEGACY_LOW_CONFIDENCE containers (`individual_skills_folder`, `vibe_workflow_folder`) must not be counted as "working templates" in any product quality claim
2. REJECT items must not appear in non-coder front-door quality metrics
3. REVIEW_REQUIRED items must not be promoted into benchmark runs without a formal re-classification
4. `api_design` must not be treated as a trusted benchmark item until re-classification is complete (see D3 §2)
5. Sheer template count (57 total) must not be used as a quality signal — only the 39 TRUSTED items represent verifiable non-coder value surfaces

---

*Filed: 2026-04-15 — Corpus Rescreen Wave 1, D4*
