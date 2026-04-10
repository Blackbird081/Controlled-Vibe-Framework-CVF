# CVF Product Value Validation Corpus Index — W66-T1 CP1

Memory class: FULL_RECORD

> Corpus ID: PVV-CORPUS-W66-T1-CP1
> Date frozen: 2026-04-11
> Version: 1.0
> Owner: CVF Governance Agent
> Related roadmap: `docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md`
> Related rubric: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_W66_T1_CP1_2026-04-11.md`
> Related run manifest: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_W66_T1_CP2_2026-04-11.md`
> Guard: `governance/toolkit/05_OPERATION/CVF_PRODUCT_VALUE_VALIDATION_GUARD.md` (GC-042)
> Authorization: `docs/baselines/CVF_GC018_W66_T1_PVV_CP1_AUTHORIZATION_2026-04-11.md`
> **Freeze status: FROZEN**

---

## 1. Corpus Composition Summary

- Total task count: **90**
- Scenario-family count: **5** (Corpus A)
- Real product task count: **20** (Corpus B)
- Governance stress task count: **20** (Corpus C)
- Minimum runs per task: **3** (per configuration)
- Compared configurations: **2** (Direct baseline CFG-A; CVF governed path CFG-B)
- Minimum total runs: **90 tasks × 2 configurations × 3 runs = 540 runs**

## 2. Corpus File Map

| File | Corpus | Families / Scope | Tasks | Freeze |
|---|---|---|---:|---|
| [CVF_PRODUCT_VALUE_VALIDATION_CORPUS_A1_W66_T1_CP1_2026-04-11.md](CVF_PRODUCT_VALUE_VALIDATION_CORPUS_A1_W66_T1_CP1_2026-04-11.md) | A | FAM-001 FinTech, FAM-002 Healthcare, FAM-003 E-Commerce | 30 | FROZEN |
| [CVF_PRODUCT_VALUE_VALIDATION_CORPUS_A2_W66_T1_CP1_2026-04-11.md](CVF_PRODUCT_VALUE_VALIDATION_CORPUS_A2_W66_T1_CP1_2026-04-11.md) | A | FAM-004 Enterprise Code Review, FAM-005 SaaS Customer Success | 20 | FROZEN |
| [CVF_PRODUCT_VALUE_VALIDATION_CORPUS_B_W66_T1_CP1_2026-04-11.md](CVF_PRODUCT_VALUE_VALIDATION_CORPUS_B_W66_T1_CP1_2026-04-11.md) | B | Real CVF product workflow tasks | 20 | FROZEN |
| [CVF_PRODUCT_VALUE_VALIDATION_CORPUS_C_W66_T1_CP1_2026-04-11.md](CVF_PRODUCT_VALUE_VALIDATION_CORPUS_C_W66_T1_CP1_2026-04-11.md) | C | Governance stress / failure-mode tasks | 20 | FROZEN |

## 3. Scenario Family Table (Corpus A)

| Family ID | Scenario family | Source | Risk level | Task count | Case study |
|---|---|---|---|---:|---|
| `FAM-001` | FinTech Credit Approval | Canonical | `MEDIUM–HIGH` | 10 | `docs/case-studies/01_fintech_credit_approval.md` |
| `FAM-002` | Healthcare Diagnostics | Canonical | `HIGH–CRITICAL` | 10 | `docs/case-studies/02_healthcare_diagnostics.md` |
| `FAM-003` | E-Commerce Content Moderation | Canonical | `MEDIUM–HIGH` | 10 | `docs/case-studies/03_ecommerce_moderation.md` |
| `FAM-004` | Enterprise Code Review | Canonical | `MEDIUM–CRITICAL` | 10 | `docs/case-studies/04_enterprise_code_review.md` |
| `FAM-005` | SaaS Customer Success | Canonical | `LOW–HIGH` | 10 | `docs/case-studies/05_saas_customer_success.md` |

## 4. Task Class Distribution

| Task class | Corpus A | Corpus B | Corpus C | Total |
|---|---:|---:|---:|---:|
| `NORMAL` | 10 | 8 | 0 | 18 |
| `AMBIGUOUS` | 10 | 6 | 2 | 18 |
| `HIGH_RISK` | 10 | 4 | 6 | 20 |
| `ADVERSARIAL` | 10 | 2 | 12 | 24 |
| `MULTI_STEP` | 10 | 0 | 0 | 10 |
| **Total** | **50** | **20** | **20** | **90** |

## 5. Corpus Integrity Rules

- **No post-result task removal**: Tasks may not be removed after scored runs are seen. Removal requires documented reviewer approval and malformed-task evidence.
- **Malformed-task correction procedure**: Corrections to task wording before first scored run require version increment and reviewer note. After first scored run, corrections are not permitted.
- **Reviewer-blinding plan**: For usefulness and quality scoring, reviewers must not see configuration labels during scoring. See rubric §2.
- **Task-ID immutability rule**: Task IDs assigned at freeze are permanent. Superseded tasks become OBSOLETE but retain their IDs.
- **Evidence retention rule**: All run artifacts (prompt, output, trace, reviewer verdict) are retained for minimum 12 months after wave close.

## 6. Coverage Checklist

- [x] At least `5` scenario families present (5 — FAM-001 through FAM-005)
- [x] At least `90` total frozen tasks present (90 total)
- [x] Every Corpus A family contains `2` normal + `2` ambiguous + `2` high-risk + `2` adversarial + `2` multi-step
- [x] Governance-stress tasks explicitly included (Corpus C, 20 tasks)
- [x] Real product or near-real tasks explicitly included (Corpus B, 20 tasks)
- [x] High-risk tasks marked for double review (all CRITICAL safety sensitivity tasks)
- [x] Every task has a stable `TASK-ID`
- [x] Every task states whether code execution is required / not required / unknown

## 7. Task ID Namespace

| Prefix | Corpus / Family | Range |
|---|---|---|
| `A1-` | Corpus A / FAM-001 FinTech | A1-001 – A1-010 |
| `A2-` | Corpus A / FAM-002 Healthcare | A2-001 – A2-010 |
| `A3-` | Corpus A / FAM-003 E-Commerce | A3-001 – A3-010 |
| `A4-` | Corpus A / FAM-004 Code Review | A4-001 – A4-010 |
| `A5-` | Corpus A / FAM-005 SaaS CS | A5-001 – A5-010 |
| `B-` | Corpus B / Real product | B-001 – B-020 |
| `C-` | Corpus C / Governance stress | C-001 – C-020 |

## 8. Not Allowed

- removing difficult tasks after seeing failures
- rewriting tasks mid-run to help one configuration
- mixing evaluation hints into task prompts
- letting reviewers change acceptance criteria during scoring
- treating this corpus as valid if the freeze checklist is incomplete

## 9. Evidence Ledger

- Corpus A source: `docs/case-studies/` (5 canonical case study seed files)
- Corpus B source: CVF internal governance workflow patterns (AGENT_HANDOFF.md, governance toolkit)
- Corpus C source: GC-042 failure taxonomy + PVV wave anti-vanity rules
- Authorization: GC018-W66-T1-PVV-CP1 (AUTHORIZED 2026-04-11)
- Freeze approval: agent-authored on authorization; human reviewer confirmation required before CP2 run start

---

*Frozen: 2026-04-11*
*Corpus version: 1.0 / FROZEN*
*Next action: authorize CP2 (Run Harness) when execution infrastructure and reviewer pool confirmed*
