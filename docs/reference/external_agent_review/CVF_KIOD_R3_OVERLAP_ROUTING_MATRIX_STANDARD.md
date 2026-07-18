# CVF KIOD-R3 Overlap Routing Matrix Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-30

External knowledge intake routing: REQUIRED

## Purpose

Define how future pre-scan packet rows are routed after the agent checks the
KIOD-R1 owner taxonomy. R3 is the conversion layer between source value and the
next governed CVF action.

## Scope / Applies To

Applies after a future pre-scan packet has source groups, feature clusters, and
expected owner surfaces. The matrix maps each row to an overlap disposition and
a bounded next action.

It does not approve direct implementation, runtime change, package activation,
public-sync, provider proof, or dashboard build.

## Routing Matrix

| Overlap disposition | When to use | Required evidence | Allowed next action | Forbidden shortcut |
|---|---|---|---|---|
| `CONFIRMED_EXISTING` | Source confirms a CVF owner without adding a delta | owner path and matching concept | cite confirmation or close as no new work | opening a duplicate lane |
| `ENRICH_EXISTING` | Source adds a concrete delta to an existing owner | owner path, delta, and target artifact | enrich that owner through fresh work order if needed | creating a parallel owner |
| `NEW_FINDING` | Source appears valuable and no owner was found after search | negative-search commands and candidate owner decision | route to KIOD-R4 decision before implementation | claiming a new owner from impression alone |
| `REJECT_DIRECT_IMPORT` | Direct use is invalid but concept value may remain | rejection reason and optional CVF rewrite target | reject direct use; optionally open CVF-native rewrite lane | copying implementation or branding |
| `NO_NEW_VALUE` | Source adds no meaningful delta after comparison | owner path or comparison basis | close row with reason | marking unread material as no-new-value |
| `OWNER_SURFACE_NOT_FOUND` | No existing owner can be named | search roots, terms, and blocker | park with next owner decision | silently dropping the finding |

## Routing Decision Steps

| Step | Action | Evidence |
|---|---|---|
| 1 | Start from a KIOD-R2 pre-scan packet row. | source group and feature cluster |
| 2 | Check KIOD-R1 owner taxonomy. | owner class and candidate path |
| 3 | Search the candidate owner surface. | command, path, or reasoned `OWNER_SURFACE_NOT_FOUND` |
| 4 | Select exactly one overlap disposition. | token from the routing matrix |
| 5 | Record next governed action. | work order, roadmap, park condition, or close reason |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| R3 routing matrix standard | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`; `docs/roadmaps/CVF_KIOD_T0_KNOWLEDGE_INTAKE_OVERLAP_DEDUPLICATION_ROADMAP_2026-06-30.md` | ENRICH_EXISTING | Converts existing overlap tokens into a pre-scan routing matrix. | Use this file as R3 routing standard. |
| New owner proposal | OWNER_SURFACE_NOT_FOUND | NEW_FINDING | A source row may deserve a new owner, but only after negative-search evidence. | Route to KIOD-R4 decision before new owner creation. |
| Duplicate capability proposal | existing owner path from KIOD-R1 taxonomy | CONFIRMED_EXISTING | Source confirms existing owner with no delta. | Close or cite confirmation; do not duplicate the lane. |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | KIOD-T0 roadmap -> KIOD-R1 owner-surface taxonomy -> KIOD-R2 pre-scan packet -> KIOD-R3 routing matrix -> KIOD-R4 decision if owner is missing |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_absorption_overlap_discipline.py` |
| Owner surface | `docs/reference/external_agent_review/CVF_KIOD_R3_OVERLAP_ROUTING_MATRIX_STANDARD.md` |
| Disposition | ADAPT KIOD-T0 R3 into a routing matrix standard |
| Claim boundary | routing matrix only; no selected source intake, runtime, package, provider, public, dashboard, adapter, checker, or production-readiness claim |

## Package Skill Productionization Control Block

SOP source: `docs/reference/agent_system_skills/CVF_PACKAGE_SKILL_PRODUCTIONIZATION_SOP.md`

Current phase: NOT_APPLICABLE_WITH_REASON - package skills may be routed as
future owner-surface candidates only.

Target lifecycle state: NOT_APPLICABLE_WITH_REASON - no package skill lifecycle
state is changed.

Prior phase evidence: package-skill productionization remains controlled by the
ASSF SOP and existing closure evidence.

Next forbidden skip: future package candidate rows cannot skip package SOP,
truth packet, UAT, resolver, receipt, or live/provider proof requirements.

Runtime/provider proof: N/A with reason: no runtime, package, provider, model,
or live governance behavior is claimed.

Claim boundary: routing matrix only; no package conversion, lifecycle mutation,
activation, adapter behavior, or production-readiness claim.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | local workspace |
| Session or invocation | KIOD-R3 on 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | rg, apply_patch, governance gates |
| Target paths | this reference |
| Allowed scope source | KIOD-T0 roadmap and KIOD-R1-R3 work order |
| Before status evidence | base commit `f3200159` |
| After status evidence | reference created for R3 |
| Diff evidence | material diff and focused guards |
| Approval boundary | operator requested KIOD-R1 -> R2 -> R3 first |
| Claim boundary | routing matrix standard only |
| Agent type | implementer/closer |
| Invocation ID | `cvf-kiod-r3-overlap-routing-matrix-standard-2026-06-30` |
| Expected manifest | this reference |
| Actual changed set | this reference |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This file defines a routing matrix. It does not classify any selected source,
authorize implementation, mutate runtime or package state, run providers, export
public artifacts, or prove semantic completeness.
