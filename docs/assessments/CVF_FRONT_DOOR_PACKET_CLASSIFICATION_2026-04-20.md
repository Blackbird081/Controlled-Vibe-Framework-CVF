# CVF Front-Door Packet Classification

Memory class: SUMMARY_RECORD

> Date: 2026-04-20
> Class: PRODUCT / CORPUS_QUALITY / FRONT_DOOR_REWRITE
> Status: FILED — rewrite intake baseline for the current front-door corpus
> Authority: `956a7609 feat(noncoder): standardize web handoff packet and front-door guards`

---

## Scope

This note classifies the current front-door corpus after the shared non-coder handoff packet standard landed.

Classification authority used together:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/front-door-template-standard.test.ts`
- `docs/baselines/CVF_CORPUS_RESCREEN_D2_MATRIX_2026-04-15.md`
- `docs/baselines/CVF_CORPUS_RESCREEN_D3_TRUSTED_SUBSET_2026-04-15.md`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/data/skills-index.json`

---

## Current State Snapshot

| Surface | Count | Meaning |
|---|---|---|
| Front-door visible skills | 42 | Current public/default skill explorer subset |
| Unique linked front-door templates | 51 | Templates reachable through those 42 skills |
| Packet-ready under shared audit | 51 / 51 | All linked templates currently pass the governed packet/export/runtime audit |
| `TRUSTED_FOR_VALUE_PROOF` templates | 39 | Already aligned for strict non-coder value proof |
| `REVIEW_REQUIRED` templates | 10 | Kept visible, but not yet standard-complete |
| `REJECT_FOR_NON_CODER_FRONTDOOR` templates still linked | 1 | Should not remain on the strict front door |
| `UNSCREENED_LEGACY` templates still linked | 1 | Runtime-ready, but governance classification not yet synced |

**Working conclusion:** runtime packet standard is now uniform across the live front door, but the corpus is not yet uniformly trusted. The rewrite queue is therefore **12 linked template surfaces**.

---

## Ready Now

These 39 linked templates are both packet-ready and already classified `TRUSTED_FOR_VALUE_PROOF`.

Examples across the current front door:

- wizard subset: `app_builder_wizard`, `business_strategy_wizard`, `content_strategy_wizard`, `data_analysis_wizard`, `marketing_campaign_wizard`, `product_design_wizard`, `research_project_wizard`, `security_assessment_wizard`, `system_design_wizard`
- supporting trusted surfaces: `build_my_app`, `vibe_to_spec`, `non_coder_debug`, `project_init_checklist`, `accessibility_audit`, `user_flow_analysis`, `seo_audit`, `gdpr_compliance`, `email_template`

No manual rewrite is required for these 39 surfaces unless a later audit fails.

---

## Rewrite Queue

These linked templates are packet-ready but not yet acceptable for an all-trusted front door.

| Template ID | Current class | Why it still fails the stricter bar | Required rewrite direction |
|---|---|---|---|
| `code_review` | `REVIEW_REQUIRED` | Output assumes developer interpretation | Add a non-coder interpretation layer and action framing |
| `documentation` | `REVIEW_REQUIRED` | Audience and output still read as developer-facing | Reframe around non-coder handoff and operational docs |
| `data_analysis` | `REVIEW_REQUIRED` | Inputs and outputs lean on statistical literacy | Convert to plain-language analysis mode with interpretation guidance |
| `ab_test_review` | `REVIEW_REQUIRED` | Requires p-value / sample-size understanding | Split into non-technical experiment review and hidden technical reasoning |
| `api_security` | `REVIEW_REQUIRED` | Endpoint inventory assumption is too technical | Ask for business flows/examples, not endpoint taxonomy |
| `data_handling` | `REVIEW_REQUIRED` | Storage-system field exposes technical architecture | Replace with conceptual data handling choices and preservation guard |
| `app_builder_complete` | `REVIEW_REQUIRED` | CVF-process-aware / advanced form still leaks internal frames | Either simplify to strict front-door mode or demote to power-user lane |
| `api_design` | `REVIEW_REQUIRED` | Technical API design choices still pushed onto the user | Rewrite as plain-language integration contract builder |
| `vibe_logic_mapping` | `REVIEW_REQUIRED` | Requires tech-stack framing | Move stack choice into hidden translation logic |
| `web_ux_redesign_system` | `REVIEW_REQUIRED` | Needs reviewer judgment to stay preservation-safe | Tighten output acceptance and preservation checks |
| `architecture_review` | `REJECT_FOR_NON_CODER_FRONTDOOR` | Developer-architecture surface is still linked through a visible skill | Remove from strict front door or replace with a non-coder system posture review |
| `web_build_handoff` | `UNSCREENED_LEGACY` | Packet-ready, but D2/D3 corpus classification has not yet caught up | Run immediate rescreen and then either promote to `TRUSTED` or downgrade |

---

## Mixed Skill Surfaces To Unwind

These visible skills still carry at least one non-trusted linked template and therefore need targeted rewrite or lane-splitting:

| Front-door skill | Non-trusted linked template(s) | Immediate intent |
|---|---|---|
| `01_app_requirements_spec` | `app_builder_complete` | Keep the simple path; rewrite or isolate the advanced path |
| `01_documentation` | `documentation` | Preserve wizard lane; rewrite the standard template |
| `01_budget_analysis` | `data_analysis` | Preserve wizard lane; rewrite the legacy analysis form |
| `api_security_checklist` | `api_security` | Preserve wizard lane; rewrite the manual security intake |
| `02_architecture_review` | `architecture_review` | Remove reject surface from strict front-door linkage |
| `cvf_web_ux_redesign_system` | `web_ux_redesign_system`, `web_build_handoff` | Finish web handoff promotion wave before keeping this lane public-facing |

---

## Exit Condition For “All Strict”

This front-door rewrite program is complete only when all of the following are true:

1. every linked template in the front-door skill index remains packet-ready
2. every linked template in that index is classified `TRUSTED_FOR_VALUE_PROOF`
3. no visible skill carries a linked template in `REVIEW_REQUIRED`, `REJECT_FOR_NON_CODER_FRONTDOOR`, or `UNSCREENED_LEGACY`
4. the frozen benchmark subset remains explicitly limited to the trusted set while promotions are in progress

---

*Filed: 2026-04-20 — Front-door packet classification baseline*
