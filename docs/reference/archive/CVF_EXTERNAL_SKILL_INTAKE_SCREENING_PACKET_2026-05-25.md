# CVF External Skill Intake Screening Packet

Memory class: SUMMARY_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-05-25

---

## Purpose

Define the mandatory screening packet for future external skill intake. This is
the controlled answer to Candidate 7: CVF should absorb high-value external
skills, but only after value, duplication, risk, owner-surface, and governance
fit are explicit.

## Scope / Target / Owner Boundary

This packet applies before any AI/agent proposes to absorb external skills,
models, skill folders, capability packs, MCP/tool bundles, or agent workflow
instructions into CVF.

It is a screening/reference packet only. It does not authorize import,
execution, registry publication, marketplace display, public-sync, provider
calls, MCP/tool/database execution, hosted readiness, production readiness, or
freeze release.

## Source / Predecessor Evidence

Canonical predecessors:

- `docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md`
- `docs/reviews/CVF_C7A_PRODUCT_SKILL_PACK_TOP10_COMPLETION_2026-05-25.md`
- `docs/reviews/CVF_C8_PRODUCT_SKILL_PACK_SELECTION_READOUT_COMPLETION_2026-05-25.md`
- `docs/reviews/CVF_TA1_TOOL_ACTION_APPROVAL_READOUT_COMPLETION_2026-05-25.md`

Legacy source families normalized:

- Hugging Face skill absorption and normalization;
- Hermes skill package model;
- Memento governed skill evolution;
- Agent Engineer strict interface contracts;
- CVF master policy Skill Preflight and intake/escalation rule.

## Screening Inputs

Every external skill candidate must provide:

- `source_name`
- `source_path_or_reference`
- `source_revision_or_fingerprint`
- `operator_use_case`
- `target_user`
- `expected_output`
- `declared_tools`
- `declared_side_effects`
- `data_sensitivity`
- `runtime_expectation`
- `proposed_owner_surface`

Missing source, use case, side effects, or owner surface is an automatic
`DEFER_INCOMPLETE`.

## Value Screen

The candidate must pass all value questions before risk screening:

1. Does it solve a concrete non-coder or agent-operator job?
2. Does it improve one of the existing ten certified product packs or justify a
   clearly better eleventh workflow?
3. Is it outcome-oriented rather than governance-for-governance?
4. Is it reusable across more than one prompt/session?
5. Is the expected output inspectable as an artifact, checklist, plan, receipt,
   or deterministic readout?

Failing value screen means `REJECT_LOW_VALUE_NOW`, even if the skill is
technically interesting.

## Duplicate / Dilution Screen

Before accepting any external skill candidate, compare it to the certified pack
inventory:

- `strategy_analysis`
- `product_brief`
- `sop_generator`
- `proposal_writer`
- `meeting_summarizer`
- `contract_review`
- `landing_page_builder`
- `competitor_review`
- `data_analysis`
- `app_requirements_spec`

Disposition:

- `MERGE_AS_PATTERN` if it improves an existing pack without needing a new pack.
- `CANDIDATE_NEW_PACK` only if it covers a distinct, repeated non-coder job.
- `REJECT_DUPLICATE` if it adds wording but no new outcome capability.

## Risk Screen

Classify every candidate before normalization:

| Risk factor | Required disposition |
| --- | --- |
| Hidden or unclear side effects | `REJECT_UNGOVERNABLE` |
| Tool, MCP, CLI, script, model, provider, browser, or database execution | `DEFER_RUNTIME_GATED` |
| Requires secrets or credentials | `DEFER_SECRET_BOUNDARY_REQUIRED` |
| Writes to external systems or publishes output | `DEFER_EXPLICIT_APPROVAL_REQUIRED` |
| Self-modifies skills or registry | `DEFER_EVOLUTION_GATED` |
| Pure documentation/knowledge workflow | may proceed to normalization |

Risk screening must use TA1/W3 posture when an action class is involved. A
candidate that needs action approval cannot be imported until the action is
classified and the approval/readout state is explicit.

## Normalization Minimum

Accepted candidates must be re-expressed in CVF-native terms. Minimum fields:

- `cvf_candidate_id`
- `canonical_name`
- `source_reference`
- `source_revision`
- `capability_class`
- `task_intents`
- `required_tools`
- `execution_mode`
- `expected_artifacts`
- `risk_level`
- `data_sensitivity`
- `side_effect_profile`
- `human_review_mode`
- `sandbox_requirement`
- `policy_bindings`
- `trace_requirements`
- `owner_surface`
- `status`

External names, prompts, scripts, and folder structure are evidence, not
authority. CVF owns the normalized form.

## Owner-Surface Routing

Route candidates to one owner surface:

| Candidate type | Default owner surface |
| --- | --- |
| Product workflow / static skill pack | certified product skill pack registry |
| Request shaping / context discipline | Governance CLI selector or context readout |
| Tool/MCP/database action | `governance/contracts` taxonomy/readout first |
| Runtime adapter / command execution | deferred until execution-plane roadmap |
| Provider/model method | Model Gateway, method-specific only |
| Memory/graph intelligence | AIF/LPF with Control Block |
| Skill evolution / mutation | proposal-only evolution lane |

If no owner surface exists, disposition is `DEFER_NO_OWNER_SURFACE`.

## Dispatch Decisions

Allowed screening dispositions:

- `ACCEPT_AS_PATTERN`
- `MERGE_AS_PATTERN`
- `CANDIDATE_NEW_PACK`
- `DEFER_INCOMPLETE`
- `DEFER_RUNTIME_GATED`
- `DEFER_SECRET_BOUNDARY_REQUIRED`
- `DEFER_EXPLICIT_APPROVAL_REQUIRED`
- `DEFER_NO_OWNER_SURFACE`
- `REJECT_DUPLICATE`
- `REJECT_LOW_VALUE_NOW`
- `REJECT_UNGOVERNABLE`
- `REJECT_DIRECT_IMPORT`

No disposition grants execution or registry publication.

## Stop Conditions

Stop immediately and open a fresh GC-018 before implementation if any candidate:

- requires live provider/API-key proof;
- needs external repository fetch;
- needs a new product pack;
- needs runtime execution, MCP/tool/database access, or CLI invocation;
- needs registry publication;
- changes public-facing claims;
- touches `/api/execute`, receipt envelopes, auth/RBAC, or provider behavior.

## Required Screening Record

Future packets must include:

```yaml
external_skill_screen:
  candidate_id: string
  source_name: string
  source_reference: string
  source_revision_or_fingerprint: string
  operator_use_case: string
  target_user: string
  value_screen: pass|fail
  duplicate_screen: merge|new_candidate|duplicate|unknown
  risk_screen: low|medium|high|blocked
  owner_surface: string
  normalized_fields_complete: true|false
  action_approval_required: true|false
  disposition: string
  required_next_gc018: string
```

## Verification

ES1 verification is documentation/governance only:

- the screening packet exists;
- it preserves Candidate 7 as demand-gated;
- it blocks direct import and execution;
- it routes future work through fresh GC-018 before implementation.

## Claim Boundary

This packet proves only a screening standard for future external skill intake.
It does not prove external skill ingestion, skill quality, registry admission,
runtime execution, live tool/MCP/database behavior, provider behavior, public
marketplace readiness, hosted readiness, production readiness, or freeze
release.
