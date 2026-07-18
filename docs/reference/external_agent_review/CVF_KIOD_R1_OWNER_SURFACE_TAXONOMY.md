# CVF KIOD-R1 Owner Surface Taxonomy

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-30

External knowledge intake routing: REQUIRED

## Purpose

Define the owner-surface lookup that future knowledge-intake work must check
before proposing a new lane. The taxonomy is intentionally compact: it tells an
agent where a source value probably belongs, what evidence to gather, and when
the current owner is missing.

## Scope / Applies To

Applies to future source repo/folder review, comparison, critique, returned
agent output, corpus scan output, and operator-provided recommendations that
could affect CVF doctrine, package skills, runtime, checkers, Web/UI, provider
routes, MCP/CLI, memory/state, corpus, or public-sync surfaces.

It does not authorize edits to those surfaces. It routes findings to the likely
owner before any implementation work order is opened.

## Owner Surface Taxonomy

| Owner surface class | Primary CVF owner surface to check first | Typical value signals | Default disposition before source verification |
|---|---|---|---|
| Doctrine / governance standards | `docs/reference/`; `docs/roadmaps/`; `docs/reviews/` | policy rule, lifecycle rule, claim boundary, proof standard | compare existing standard before new rule |
| Agent handoff / workspace | `docs/reference/agent_handoff/`; `docs/reference/agent_workspace/`; `CVF_SESSION/agent_workspace/` | role handoff, queue/state, workspace topology | enrich existing handoff/workspace standards if possible |
| Package skills | `docs/reference/agent_system_skills/`; ASSF package truth and control-plane outputs | skill package, activation, runtime eligibility, adapter boundary | route through package productionization SOP |
| Runtime / provider / model | `EXTENSIONS/`; `scripts/`; provider proof standards | model route, provider key, live proof, gateway, router | require fresh GC-018 and live-proof authority before claim |
| Governance checkers | `governance/compat/`; `governance/toolkit/` | machine guard, hook, preflight, drift check | prefer reference rule first unless checker gap is proven |
| Web / UI / dashboard | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/`; root `DESIGN.md` | dashboard, console, user-visible skill view | read `DESIGN.md` and require fresh UI work order |
| MCP / CLI / adapters | `docs/reference/`; `governance/compat/`; adapter source when present | command surface, protocol bridge, tool server | classify CLI/MCP authority before implementation |
| Memory / session / state | `CVF_SESSION_MEMORY.md`; `CVF_SESSION/`; generated state sources | continuity, next move, active handoff, state aggregate | edit generated sources where applicable, then regenerate |
| Corpus / scan / extraction | `docs/corpus-intelligence/`; scan registry sources | corpus manifest, extraction, semantic map | use corpus registry and reconciliation gates |
| Public-sync / export | public-sync sibling clone and public export standards | README/catalog/public artifact | keep private until public-sync authority exists |
| Unknown / missing owner | `docs/roadmaps/` or new GC-018 proposal | high-value delta with no matched owner | mark `OWNER_SURFACE_NOT_FOUND` and route to R4-style decision |

## Owner Surface Selection Rule

| Step | Required action | Stop condition |
|---|---|---|
| 1 | Name the source item or feature cluster. | Stop if the source item is unread or only inferred. |
| 2 | Select the closest owner surface class from this taxonomy. | Stop if no class fits and mark `OWNER_SURFACE_NOT_FOUND`. |
| 3 | Search the primary CVF owner surface before opening a new lane. | Stop if negative search evidence is absent. |
| 4 | Choose a KIOD-R3 routing action. | Stop if the action would mutate runtime, package, public, provider, or Web surfaces without fresh authority. |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| Owner-surface taxonomy reference | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`; `docs/roadmaps/CVF_KIOD_T0_KNOWLEDGE_INTAKE_OVERLAP_DEDUPLICATION_ROADMAP_2026-06-30.md` | ENRICH_EXISTING | Adds a compact owner lookup before future intake closeout. | Use this file as R1 lookup. |
| Package-skill owner routing | `docs/reference/agent_system_skills/CVF_PACKAGE_SKILL_PRODUCTIONIZATION_SOP.md` | CONFIRMED_EXISTING | Existing SOP owns package activation and lifecycle claims. | Route package-skill deltas to SOP, not direct activation. |
| Missing owner case | OWNER_SURFACE_NOT_FOUND | OWNER_SURFACE_NOT_FOUND | No current owner can be named after documented search. | Park for KIOD-R4 decision before new owner proposal. |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | KIOD-T0 roadmap -> KIOD-R1 owner-surface taxonomy -> KIOD-R2 pre-scan packet -> KIOD-R3 routing matrix -> KIOD-R4 decision if owner is missing |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_absorption_overlap_discipline.py` |
| Owner surface | `docs/reference/external_agent_review/CVF_KIOD_R1_OWNER_SURFACE_TAXONOMY.md` |
| Disposition | ADAPT KIOD-T0 R1 into a compact owner-surface lookup |
| Claim boundary | taxonomy only; no selected source intake, runtime, package, provider, public, dashboard, adapter, checker, or production-readiness claim |

## Package Skill Productionization Control Block

SOP source: `docs/reference/agent_system_skills/CVF_PACKAGE_SKILL_PRODUCTIONIZATION_SOP.md`

Current phase: NOT_APPLICABLE_WITH_REASON - package skills are named only as an
owner-surface class.

Target lifecycle state: NOT_APPLICABLE_WITH_REASON - no package skill lifecycle
state is changed.

Prior phase evidence: existing package-skill productionization artifacts remain
the source of truth for package lifecycle decisions.

Next forbidden skip: future package candidate work must still satisfy ASSF SOP,
truth packet, usage receipt, UAT, resolver, and live/provider proof rules.

Runtime/provider proof: N/A with reason: no runtime, package, provider, model,
or live governance behavior is claimed.

Claim boundary: owner-surface taxonomy only; no package conversion, lifecycle
mutation, activation, adapter behavior, or production-readiness claim.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | local workspace |
| Session or invocation | KIOD-R1 on 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | rg, apply_patch, governance gates |
| Target paths | this reference |
| Allowed scope source | KIOD-T0 roadmap and KIOD-R1-R3 work order |
| Before status evidence | base commit `f3200159` |
| After status evidence | reference created for R1 |
| Diff evidence | material diff and focused guards |
| Approval boundary | operator requested KIOD-R1 -> R2 -> R3 first |
| Claim boundary | owner-surface taxonomy only |
| Agent type | implementer/closer |
| Invocation ID | `cvf-kiod-r1-owner-surface-taxonomy-2026-06-30` |
| Expected manifest | this reference |
| Actual changed set | this reference |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This file is a taxonomy and routing reference. It is not source intake
evidence, not package activation evidence, not a runtime or provider proof, not
public-sync, and not a claim that every future source value has already been
classified.
