# CVF PRG Product Requirement Contract

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-28

Batch ID: PRG-T1

## Purpose

Define the CVF Product Requirement Governance contract promoted from the
operator-provided external package and adapted into CVF-owned form.

The contract captures useful product-spec primitives without copying external
source code, adopting Claude-specific package mechanics, or creating a parallel
workflow. It governs the path:

```text
product intent -> product requirement artifact -> SPEC input -> Work Order
```

## Scope / Target / Owner Boundary

In scope:

- product requirement artifact hierarchy and metadata;
- traceable product artifact IDs;
- deterministic validation versus reviewer judgment;
- no-silent-reversal rule for approved or frozen meaning;
- read-only critique/reviewer lane;
- decision, evidence, and traceability records;
- product requirement to SPEC input handoff;
- SPEC-approved handoff to Work Order authoring.

Out of scope:

- runtime validator implementation;
- generated registry or aggregate;
- UI, provider/live proof, public-sync, package certification, or adapters;
- direct import of AGPL source code or Claude-specific skill/hooks;
- treating product requirements as Build authorization.

## Source Conversion Matrix

| Source package item | Reused substance | CVF adaptation | Disposition |
|---|---|---|---|
| `PRODUCT_ARTIFACT_MODEL.md` | product hierarchy and governance objects | converted to CVF upstream artifact classes and non-execution boundary | ACCEPT_AS_CONTRACT |
| `SPEC_METADATA_PROTOCOL.md` | frontmatter metadata as governance contract | converted to PRG metadata contract and controlled-field rules | ACCEPT_AS_CONTRACT |
| `TRACEABLE_ARTIFACT_ID_PROTOCOL.md` | stable ID and lineage concept | adapted as forward contract; registry is deferred | ADAPT |
| `DETERMINISTIC_CHECK_VS_LLM_JUDGMENT.md` | compute computable checks, review interpretive concerns | adopted as validator/reviewer lane split | ACCEPT_AS_DOCTRINE |
| `SPEC_VALIDATION_GATE.md` and `VALIDATION_FINDINGS_RECEIPT.md` | validation gate and receipt concept | contract only; implementation deferred | ADAPT |
| `NO_SILENT_REVERSAL_GUARD.md` | approved/frozen meaning cannot reverse silently | adopted as PRG semantic-change rule | ACCEPT_AS_DOCTRINE |
| `DECISION_RECEIPT_PROTOCOL.md` and evidence protocols | decision/evidence/change trace model | adapted into first-class PRG governance objects | ADAPT |
| `READ_ONLY_REVIEWER_LANE.md` and review protocols | critique/report lane cannot mutate governed artifacts | adopted as reviewer lane contract | ACCEPT_AS_DOCTRINE |
| `PRODUCT_REQUIREMENT_TO_SPEC.md` | product intent becomes SPEC input, not Build authorization | adopted as PRG to SPEC handoff rule | ACCEPT_AS_CONTRACT |
| `PRODUCT_SPEC_HANDOFF_TO_WORK_ORDER.md` | Product Spec may inform Work Order but cannot bypass SPEC | adopted as PRG handoff boundary | ACCEPT_AS_CONTRACT |

## Product Artifact Model

PRG recognizes this upstream artifact hierarchy:

```text
Vision
  -> Business Requirement
      -> Product Requirement
          -> Epic
              -> Story
                  -> Acceptance Criterion
```

PRG also recognizes these governance objects:

- Decision;
- Evidence;
- Risk;
- Assumption;
- Constraint;
- Review Finding;
- Work Order input;
- Freeze Record.

Product artifacts are not execution authority. They become governed inputs for
SPEC and Work Order only after validation, review, and decision/evidence
requirements are satisfied.

## Product Artifact To CVF Mapping

| Product artifact | CVF role | Execution authority |
|---|---|---|
| Vision | context input | none |
| Business Requirement | design/outcome constraint | none |
| Product Requirement | SPEC input | none |
| Epic | SPEC decomposition input | none |
| Story | Work Order candidate input after SPEC approval | none by itself |
| Acceptance Criterion | review/test matrix input | none by itself |
| Decision | governance/evidence object | authority only within its recorded scope |
| Evidence | audit/evidence object | supports claims but does not widen scope |

## Metadata Contract

The PRG metadata contract follows this core rule:

```text
frontmatter is the governance contract; body prose is supporting explanation
```

Minimum metadata fields for a PRG artifact:

```yaml
id:
type:
title:
status:
owner:
created_at:
updated_at:
version:
schema_version:
parent_ids:
child_ids:
source_refs:
evidence_refs:
decision_refs:
risk_level:
approval_required:
approved_by:
approved_at:
freeze_ref:
claim_boundary:
```

Control fields are:

- `id`;
- `type`;
- `owner`;
- `status`;
- `approval_required`;
- `approved_by`;
- `approved_at`;
- `freeze_ref`;
- `claim_boundary`.

Control fields must not be changed by a stylistic rewrite. Approved or frozen
artifacts require a decision receipt before controlled meaning changes.

## Lifecycle Contract

Base PRG lifecycle:

```text
DRAFT -> REVIEW_READY -> APPROVED -> FROZEN -> SUPERSEDED
```

Allowed branch states:

```text
REJECTED
BLOCKED
NEEDS_DECISION
NEEDS_EVIDENCE
NEEDS_CHANGE_DECISION
```

State transition requirements:

| Transition | Requirement |
|---|---|
| `DRAFT -> REVIEW_READY` | required metadata complete |
| `REVIEW_READY -> APPROVED` | validation pass plus approval |
| `APPROVED -> FROZEN` | evidence and freeze record |
| `FROZEN -> SUPERSEDED` | decision receipt |
| `APPROVED -> DRAFT` | blocked unless a decision receipt authorizes supersession or scope change |
| `FROZEN -> DRAFT` | blocked |

## Deterministic Validation And Reviewer Judgment

PRG uses this rule:

```text
if a check can be computed, compute it
if a concern requires interpretation, review it
if a change affects governance, require a receipt
```

Deterministic checks include:

- required metadata fields;
- enum values;
- ID grammar and uniqueness;
- parent/child reference resolution;
- decision/evidence/freeze reference resolution;
- controlled state transitions;
- acceptance criteria coverage.

Reviewer or LLM judgment may evaluate:

- ambiguity;
- contradiction;
- hidden assumptions;
- weak user value;
- overbroad scope;
- unclear risk;
- likely handoff failure;
- feasibility or market concern.

Reviewer or LLM judgment must not:

- override duplicate ID failure;
- declare missing evidence present;
- approve its own artifact;
- bypass transition rules;
- infer source references that do not exist;
- claim production readiness from prose quality.

## No-Silent-Reversal Rule

Approved or frozen meaning cannot be reversed silently.

A proposed update is a controlled reversal when it:

- changes scope from included to excluded;
- changes non-goal into goal;
- removes acceptance criteria;
- changes actor or target user;
- lowers risk level;
- changes approval or evidence requirements;
- removes decision references;
- changes frozen behavior;
- makes the implementation path broader than the approved Work Order.

When triggered, the allowed responses are:

- `KEEP_EXISTING`;
- `CHANGE_WITH_DECISION`;
- `HYBRID_WITH_NEW_SCOPE`;
- `ESCALATE_TO_HUMAN`.

The agent may explain the conflict but must not apply the semantic change until
a decision receipt exists.

## Read-Only Reviewer Lane

Reviewer lane observes, evaluates, and reports. It does not mutate governed
artifacts.

Allowed reviewer outputs:

- review finding;
- critique report;
- evidence request;
- decision request;
- handoff warning;
- freeze warning.

Forbidden reviewer actions:

- edit product requirement artifacts directly;
- change artifact status;
- approve its own suggested changes;
- alter metadata;
- remove evidence references;
- generate a Work Order directly;
- bypass validation, human approval, or freeze records.

## Decision And Evidence Objects

PRG decisions and evidence must remain first-class records. They explain why a
scope, acceptance, risk, or status change exists.

Minimum decision fields:

```yaml
decision_id:
owner:
reason:
old_state:
new_state:
affected_artifacts:
affected_work_orders:
evidence_refs:
approval:
claim_boundary:
```

Evidence supports a claim but does not widen the claim boundary. Missing
evidence must remain explicit as `NEEDS_EVIDENCE`, not hidden by stronger prose.

## Product Requirement To SPEC Handoff

Product requirement describes needed outcome. SPEC defines controlled contract.

Mapping:

| Product requirement field | SPEC input role |
|---|---|
| User or actor | actor boundary |
| Problem | intent boundary |
| Scope | contract scope |
| Non-goals | contract exclusions |
| Acceptance criteria | acceptance matrix |
| Constraints | invariants |
| Evidence references | evidence requirement |
| Decisions | decision trace |
| Risks | failure tokens or risk gate |
| Handoff warnings | review requirements |

If product language is vague, SPEC input must normalize it or mark
`NEEDS_DECISION` / `NEEDS_EVIDENCE`. Missing details must not be invented.

## SPEC To Work Order Handoff

Product Spec may inform Work Order, but cannot bypass SPEC.

A Work Order handoff requires:

- source product requirement or Product Spec ID;
- approved or explicitly accepted input status;
- validation receipt or explicit waiver;
- review report or decision-waived review;
- decision and evidence references;
- scope and non-goals;
- acceptance criteria;
- allowed and forbidden paths;
- test plan seed;
- review matrix seed;
- claim boundary stating the handoff is not Build authority by itself.

Forbidden handoff cases:

- draft artifact without explicit decision;
- validation errors;
- approved artifact changed without decision;
- missing acceptance criteria;
- required evidence absent;
- unresolved review blocker;
- Work Order exceeds product requirement or SPEC scope.

## Validator Foundation Boundary

PRG-T1 defines validator candidate requirements only. A future validator may
parse frontmatter, run enum checks, resolve artifact graph links, and produce
validation findings receipts.

PRG-T1 does not implement that validator. Any validator source, tests, fixtures,
generated registry, or hook wiring requires a separate source-verified tranche.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this contract and README under `docs/reference/product_requirement_governance/` | internal agents may use this as a reference when drafting PRG artifacts, SPEC inputs, or Work Orders; it is not runtime enforcement | PRG-T1 source conversion matrix and closure evidence | N/A with reason: no internal runtime adapter | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future PRG readout, MCP, CLI, or public-safe summary | no external agent interface or mutation path exists in PRG-T1 | deferred in PRG-T1 work order and completion review | separate GC-018/source-verified adapter or public-sync work required | `DEFERRED_WITH_REASON` |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | operator-provided package -> PRG-T0 audit roadmap -> PRG-T1 adapted CVF contract |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | `docs/reference/product_requirement_governance/CVF_PRG_PRODUCT_REQUIREMENT_CONTRACT.md` |
| Disposition | ADAPT selected package primitives into a CVF-owned contract |
| Claim boundary | package material is external input; this adapted contract is the CVF-owned reference |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this contract is private provenance documentation. A public-safe PRG
summary requires separate public-sync authorization.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | PRG-T1 product requirement governance reference contract |
| claimDisposition | N/A with reason: reference documentation contract only |
| receiptEvidence | N/A with reason: no runtime receipt or execution-control claim |
| actionEvidence | ACTION_EVIDENCE_PRESENT - reference contract authored from PRG-T0-approved package primitives |
| invocationBoundary | local governed documentation authoring |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | contract/reference language only |
| forbiddenExpansion | no validator implementation, runtime/provider/live proof, public-sync, adapter, package certification, or Build authorization |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex dispatcher/worker/reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | PRG-T1 product requirement governance contract promotion, 2026-06-28 |
| Working directory | repository root |
| Command or tool surface | source reads, package reads, apply_patch, governance gates |
| Target paths | `docs/reference/product_requirement_governance/README.md`; `docs/reference/product_requirement_governance/CVF_PRG_PRODUCT_REQUIREMENT_CONTRACT.md` |
| Allowed scope source | operator approval after PRG-T0 commit `efb45892` |
| Before status evidence | `dispatchBaseHead=67250e04` |
| After status evidence | PRG reference contract active after material commit |
| Diff evidence | `git diff --name-status 67250e04..HEAD` after material commit |
| Approval boundary | documentation contract promotion only |
| Claim boundary | no runtime validator, generated registry, public-sync, provider/live proof, adapter, package certification, or Build authorization |
| Agent type | single-agent multi-role |
| Invocation ID | `cvf-prg-t1-product-requirement-contract-promotion-2026-06-28` |
| Expected manifest | README and PRG product requirement contract |
| Actual changed set | README and PRG product requirement contract plus paired GC-018/work order/completion review |
| Manifest delta | MATCH_WITH_DISPATCH_ARTIFACTS |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This contract promotes selected PRG package primitives into CVF-owned
documentation. It does not implement validation, create fixtures, mutate
runtime/source, call providers, authorize public-sync, certify packages, create
an adapter, bypass SPEC, bypass Work Order, or make product requirements
execution-ready by themselves.
