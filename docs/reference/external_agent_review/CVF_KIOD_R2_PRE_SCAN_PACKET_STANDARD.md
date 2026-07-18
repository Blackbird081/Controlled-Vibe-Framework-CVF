# CVF KIOD-R2 Pre-Scan Packet Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-30

External knowledge intake routing: REQUIRED

## Purpose

Define the packet a future agent must prepare before closing a large source
repo/folder review as novel, duplicate, rejected, or owner-missing. The packet
creates a warning surface before the final report, so overlap and missed value
are caught while the source is still being sorted.

## Scope / Applies To

Applies to future governed knowledge-intake work that reviews a source
repo/folder, source bundle, returned agent packet, or comparison corpus and may
produce CVF doctrine, runtime, package, checker, Web/UI, provider, MCP/CLI,
memory/state, corpus, or public-sync candidates.

The packet is required before closeout, but it does not itself approve
implementation.

## Required Pre-Scan Packet

| Field | Required content | Invalid if |
|---|---|---|
| Source identity | upstream or local source label, local root, commit/hash when available, and intake reason | source is unnamed or only described from memory |
| Source groups | grouped folders/files/features with read status | all files are summarized as one blob |
| Feature clusters | concrete capability clusters or concepts | clusters are marketing labels only |
| Expected owner surfaces | owner class from KIOD-R1 and candidate CVF path | owner surface is blank for value-bearing items |
| Confirmed-overlap candidates | items likely already owned by CVF | no owner path or reason is provided |
| Enrichment candidates | deltas that improve an existing owner | delta is vague or action is missing |
| Novelty candidates | items with no current owner after search | negative-search evidence is absent |
| Rejection candidates | direct-use or out-of-scope items | rejection reason is not recorded |
| No-new-value candidates | items that add no meaningful delta | comparison basis is not named |
| Owner-missing candidates | items needing R4-style owner decision | next decision owner is missing |
| Claim boundary | what the packet does not prove | runtime, package, provider, public, or production claim appears |

## Packet Stop Conditions

| Condition | Required action |
|---|---|
| Source item unread or unreadable | mark read status and do not classify as no-new-value |
| Owner surface not found | mark `OWNER_SURFACE_NOT_FOUND` and route to KIOD-R4 decision |
| Candidate needs runtime or provider proof | park behind fresh GC-018 and live-proof authority |
| Candidate affects package skills | route through package productionization SOP |
| Candidate affects Web/UI | read `DESIGN.md` and require a UI work order before implementation |
| Candidate affects public export | preserve private provenance boundary until public-sync is authorized |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| Pre-scan packet standard | `docs/roadmaps/CVF_KIOD_T0_KNOWLEDGE_INTAKE_OVERLAP_DEDUPLICATION_ROADMAP_2026-06-30.md` | ENRICH_EXISTING | Adds a packet shape before future source closeout. | Use this standard as R2 packet template. |
| Feature cluster without owner | OWNER_SURFACE_NOT_FOUND | OWNER_SURFACE_NOT_FOUND | Cluster has value but no matched owner after documented search. | Route to KIOD-R4 decision; do not open a new lane directly. |
| Direct-use candidate | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` | REJECT_DIRECT_IMPORT | Implementation cannot be copied directly even when concept value remains. | Rewrite only through a CVF-owned future tranche. |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | KIOD-T0 roadmap -> KIOD-R1 owner-surface taxonomy -> KIOD-R2 pre-scan packet -> KIOD-R3 routing matrix -> KIOD-R4 decision if owner is missing |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_absorption_overlap_discipline.py` |
| Owner surface | `docs/reference/external_agent_review/CVF_KIOD_R2_PRE_SCAN_PACKET_STANDARD.md` |
| Disposition | ADAPT KIOD-T0 R2 into a reusable pre-scan packet standard |
| Claim boundary | packet standard only; no selected source intake, runtime, package, provider, public, dashboard, adapter, checker, or production-readiness claim |

## Package Skill Productionization Control Block

SOP source: `docs/reference/agent_system_skills/CVF_PACKAGE_SKILL_PRODUCTIONIZATION_SOP.md`

Current phase: NOT_APPLICABLE_WITH_REASON - package skills are named only as a
candidate owner class in the packet.

Target lifecycle state: NOT_APPLICABLE_WITH_REASON - no package skill lifecycle
state is changed.

Prior phase evidence: package productionization remains governed by the ASSF
SOP and its existing closure evidence.

Next forbidden skip: a future pre-scan packet cannot promote a package
candidate without the ASSF productionization path.

Runtime/provider proof: N/A with reason: no runtime, package, provider, model,
or live governance behavior is claimed.

Claim boundary: packet standard only; no package conversion, lifecycle
mutation, activation, adapter behavior, or production-readiness claim.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | local workspace |
| Session or invocation | KIOD-R2 on 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | rg, apply_patch, governance gates |
| Target paths | this reference |
| Allowed scope source | KIOD-T0 roadmap and KIOD-R1-R3 work order |
| Before status evidence | base commit `f3200159` |
| After status evidence | reference created for R2 |
| Diff evidence | material diff and focused guards |
| Approval boundary | operator requested KIOD-R1 -> R2 -> R3 first |
| Claim boundary | pre-scan packet standard only |
| Agent type | implementer/closer |
| Invocation ID | `cvf-kiod-r2-pre-scan-packet-standard-2026-06-30` |
| Expected manifest | this reference |
| Actual changed set | this reference |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This file defines a pre-scan packet. It does not classify any selected source,
approve implementation, mutate runtime or package state, run providers, export
public artifacts, or prove semantic completeness.
