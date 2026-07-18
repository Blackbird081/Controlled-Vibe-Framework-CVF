# CVF External Agent Finding Absorption Workflow

Memory class: FULL_RECORD

Status: ACTIVE_WORKFLOW

docType: reference

## Purpose

Define how CVF classifies and absorbs returned external-agent review output
after a bounded external-agent review packet is used.

This workflow exists so useful external critique becomes CVF-owned governance
material instead of provider-local memory, chat commentary, or unverified
architecture drift.

Upstream routing lives in:

`docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md`

Use that chain map first to classify whether the input is external-agent
returned output, legacy/corpus intake, public/simple vocabulary, copied repo
material, or implementation planning.

## Scope / Target / Owner Boundary

Target: external-agent review returns, copied-package critique, external repo
idea intake, public/simple vocabulary assumptions, and external findings about
CVF workflow-chain, MCP, workspace, runtime, public/private boundary, or
governance surfaces.

Owner boundary: this workflow owns classification and routing only. It does
not make external output canonical, publish private provenance source,
authorize public-sync, run providers, implement MCP, mutate workspace runtime
state, add machine checks, or create readiness claims.

## Required Inputs

Before classifying external output, the CVF reviewer must have:

| Input | Requirement |
|---|---|
| Review packet | The packet sent to the external agent, preferably based on `CVF_EXTERNAL_AGENT_REVIEW_PACKET_TEMPLATE.md`. |
| External output | The returned findings, assumptions, useful patterns, questions, or blocked claims. |
| CVF authority surfaces | Current governed paths supplied in the packet or re-verified during review. |
| Public/private boundary | The packet's boundary or a reviewer-authored replacement when the packet was missing one. |
| Operator constraint | Any parked checkpoint, forbidden scope, or explicit authorization boundary. |
| Chain-map route | The input type and route selected from `CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md`. |

If the review packet is missing, classify the return as
`CONTEXT_DEFECT_REVIEW_REQUIRED` before absorbing any content.

## Classification Workflow

1. Preserve the external output as advisory input. Do not treat it as CVF
   source authority.
2. Split the return into atomic observations. One row may not mix a defect, a
   useful pattern, a question, and a readiness claim.
3. Classify each observation by source basis: CVF-governed source,
   public/simple vocabulary, private provenance summary, external reference,
   inference, or missing context.
4. Assign one CVF disposition from the matrix below.
5. Route the observation to the owning CVF artifact type.
6. Record whether the item is handled now, deferred with owner/path, rejected,
   or blocked.
7. If an item is reusable across agents, apply the finding-to-governance
   learning standard and keep it in a CVF-governed artifact.

## Disposition Matrix

| External output type | Required evidence | CVF disposition | Required next action |
|---|---|---|---|
| Source-backed CVF defect | Cites a supplied or re-verified CVF-governed source path/section | `GOVERNED_FINDING_CANDIDATE` | Create or update a finding-bearing review, audit, work order, or roadmap row with Finding-To-Governance Learning Disposition. |
| Useful external pattern | Cites external repo/package/pattern and explains why it fits CVF | `PATTERN_ABSORB_ADAPT_DEFER_REJECT` | Add an absorption map row or reference update with `ABSORB`, `ADAPT`, `DEFER`, or `REJECT`; do not copy blindly. |
| Public/simple assumption | Derived from public README, catalog, simplified lifecycle, or external-facing summary | `QUESTION_OR_HYPOTHESIS` | Re-verify against governed CVF surfaces before accepting; otherwise record as a question. |
| Missing context request | Names a missing source, unclear boundary, or unprovided authority surface | `RETURN_TO_OPERATOR_OR_REVIEWER` | Decide whether to provide a public-safe summary, private review packet, or reject the request. |
| Runtime/readiness/provider/MCP claim | Claims readiness or behavior beyond supplied proof | `BLOCKED_UNTIL_CVF_PROOF` | Block unless current CVF live/runtime evidence exists; otherwise record blocked claim with proof gap. |
| Raw private-source request | Requires private provenance files, secrets, credentials, or unpublished source in full | `REJECT_OR_PUBLIC_SAFE_SUMMARY` | Reject the raw request or replace with a bounded public-safe summary. |
| External criticism without source | Opinion, inference, or ungrounded recommendation | `NON_CANONICAL_ADVISORY` | May inform a future question, but cannot become CVF authority or closure evidence. |
| Reusable agent/process lesson | Describes a repeatable authoring, review, gate, or handoff failure | `GOVERNANCE_LEARNING_REQUIRED` | Promote to standard/template/checker candidate or record explicit non-reusable reason in a CVF-governed artifact. |

## Required Absorption Table

Any CVF artifact that consumes external-agent output must include a table with
these columns:

| Column | Required content |
|---|---|
| External item ID | Stable local ID for the returned observation. |
| External claim summary | Short paraphrase of the external output. |
| Source basis | CVF-governed source, public/simple vocabulary, external reference, inference, missing context, or private-summary request. |
| CVF verification surface | CVF path/section checked, or `BLOCKED_SOURCE_NOT_FOUND`. |
| CVF disposition | One disposition from the matrix. |
| Owner artifact | Finding, audit, standard, roadmap, work order, review, absorption map, or rejected/blocking note. |
| Next action | Handle now, defer with owner/path, reject, or block pending proof. |
| Claim boundary | What the row does not prove. |

## Promotion Rules

- Source-backed defects become governed finding candidates, not chat memory.
- Repeated cross-agent lessons must be promoted to a CVF-governed artifact or
  explicitly declined as non-reusable with reason.
- Useful patterns must be adapted to CVF contracts; external design is never
  imported as authority by name alone.
- Public/simple assumptions stay hypotheses until verified against active CVF
  governed surfaces.
- Runtime, provider, public, production, release, MCP, or workspace readiness
  claims require current CVF proof.

## Machine Check

Changed external-return absorption reviews must include the Required Absorption
Table before they close.

Machine guard:

`governance/compat/check_external_agent_absorption_table.py`

The guard is range-aware and forward-only. It checks changed `docs/reviews/`
and `docs/audits/` files in the committed range, staged set, and untracked set,
while avoiding ordinary completion/worker-return prose unless the artifact uses
the explicit marker:

`External absorption review: REQUIRED`

## Epistemic Process Block

### Expected Result / Prediction

Returned external-agent output should be safer to use when every observation is
split, source-classified, and routed to a CVF-owned disposition before action.

### Evidence Comparison

EARC-T1 already supplied the packet template and checklist, but its completion
left machine enforcement deferred until the absorption workflow existed.
EARC-T3 supplies that missing workflow and the required absorption table shape.

### Contradiction Or Gap Disposition

The remaining gap is machine enforcement for real external-return packets. It
is recorded as a machine-check candidate after one real return packet exercises
the workflow.

### Claim Update

CVF now has both pre-review packet guidance and post-review absorption routing.
External output remains advisory until classified and absorbed through governed
CVF artifacts.

## Claim Boundary

This workflow controls classification and absorption. It does not publish
private provenance files, add runtime behavior, run providers, implement MCP,
mutate workspace runtime state, prove readiness, or make external-agent output
canonical.
