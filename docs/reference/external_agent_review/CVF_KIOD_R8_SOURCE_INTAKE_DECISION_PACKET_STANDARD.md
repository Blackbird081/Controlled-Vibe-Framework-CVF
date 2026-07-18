# CVF KIOD-R8 Source Intake Decision Packet Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-01

External knowledge intake routing: REQUIRED

Source intake decision packet: REQUIRED

## Purpose

Define a bounded decision-packet shape that any future repo/folder knowledge
intake dispatch must carry before a worker begins reading source material. The
packet forces the dispatcher to record owner-surface selection, pre-scan
evidence, overlap routing, negative-search evidence, value-conversion routing,
worker output path, forbidden scope, and a claim boundary in one place, so a
future preflight checker can block worker dispatch when this evidence is
missing.

This standard defines the packet shape only. It does not itself absorb any
outside source and does not authorize a source intake pilot.

## Scope / Applies To

Applies to any future governed artifact (work order, GC-018 baseline, roadmap,
or review) that declares itself a source-intake dispatch packet by including
the applicability marker `Source intake decision packet: REQUIRED`. Does not
apply retroactively to closed KIOD-R1 through KIOD-R7 artifacts, and does not
apply to artifacts that do not carry the marker.

## Source Intake Decision Packet

Any artifact carrying the applicability marker must include a
`## Source Intake Decision Packet` section with the following required fields:

| Required field | Required content |
|---|---|
| Decision packet standard | Cites `docs/reference/external_agent_review/CVF_KIOD_R8_SOURCE_INTAKE_DECISION_PACKET_STANDARD.md` |
| Input root or repository | Names the exact source root, repository, or folder under review |
| Bounded scope | States what is in scope and out of scope for this intake tranche |
| Enumeration authority | Names the command or method used to enumerate source files |
| Owner-surface taxonomy | Cites `docs/reference/external_agent_review/CVF_KIOD_R1_OWNER_SURFACE_TAXONOMY.md` and the selected owner-surface class |
| Pre-scan packet source | Cites `docs/reference/external_agent_review/CVF_KIOD_R2_PRE_SCAN_PACKET_STANDARD.md` and the pre-scan packet artifact or inline table |
| Overlap routing matrix | Cites `docs/reference/external_agent_review/CVF_KIOD_R3_OVERLAP_ROUTING_MATRIX_STANDARD.md` and the selected routing disposition(s) |
| Negative-search evidence | Records the search command(s) and result confirming no existing CVF owner surface, or the found owner surface |
| Core disposition | Names the applicable disposition taxonomy token(s) defined by `CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Value conversion requirement | Names the applicable value-conversion lane token(s) defined by `CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Overlap classification requirement | Names the applicable overlap disposition token(s) defined by `CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Worker output path | Names the exact path(s) the worker is authorized to create or modify |
| Forbidden scope | States what the worker must not touch in this tranche |
| Claim boundary | States that the packet is pre-dispatch evidence only, not proof source intake has completed |

## Required Co-Sections

An artifact carrying the applicability marker must also include the paired
core, value-conversion, and overlap sections defined by
`docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`,
plus the intake routing section defined by
`docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md`:

- the intake routing section named by the chain map
- the two paired sections named by the core standard for disposition and for
  value-lane classification
- the overlap/novelty classification section named by the core standard

This standard does not redefine their shape; it requires their presence
alongside the Source Intake Decision Packet section. See
`governance/compat/check_source_intake_decision_packet_preflight.py` for the
exact required heading strings enforced at preflight time.

## Escalation Rule

If the Overlap routing matrix field or the Overlap And Novelty Classification
co-section contains `OWNER_SURFACE_NOT_FOUND` or `NEW_FINDING`, the artifact
must also include:

1. Negative-search evidence naming the exact search command(s) and search
   root(s) used.
2. A concrete next governed action (for example: route to a KIOD-R4-style
   decision, or name the specific follow-up work order/roadmap that will
   resolve the missing owner).

An artifact that uses `OWNER_SURFACE_NOT_FOUND` or `NEW_FINDING` without both
of these is incomplete under this standard.

## Checker

`governance/compat/check_source_intake_decision_packet_preflight.py`

The checker is range-aware. It accepts `--base`, `--head`, and `--enforce`
arguments identical to other range-aware CVF checkers. It applies only to
changed governed Markdown files under `docs/baselines/`, `docs/work_orders/`,
`docs/reviews/`, and `docs/roadmaps/` that contain the applicability marker
`Source intake decision packet: REQUIRED`. Archive-qualified paths
(`/archive/`) are excluded. Unchanged historical artifacts are never
inspected.

## Remediation

| Symptom | Required fix |
|---|---|
| Applicability marker present but `## Source Intake Decision Packet` section missing | Add the section with all fourteen required fields |
| A required field is missing or blank | Add the missing field with concrete, source-verified content |
| A required co-section is missing | Add the missing intake-routing, core-disposition, value-lane, or overlap/novelty section named by the core standard and chain map cited above |
| `OWNER_SURFACE_NOT_FOUND` or `NEW_FINDING` present without negative-search evidence or a next governed action | Add the missing negative-search command/result and name a concrete next governed action |

## Wiring

This checker is wired into:

- `governance/compat/agent_autorun_command_catalog.py` (`_common_commands`)
- `governance/compat/local_governance_hook_catalog_pre_commit.py`
- `governance/compat/local_governance_hook_catalog_pre_push.py`
- `governance/compat/local_governance_hook_catalog_reviewer_fast.py`

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | external knowledge intake routing guard implementation |
| Chain map route | KIOD-R7 dispatch packet lifecycle hygiene -> KIOD-R8 source intake decision packet preflight -> future source-intake dispatch packets |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | `docs/reference/external_agent_review/CVF_KIOD_R8_SOURCE_INTAKE_DECISION_PACKET_STANDARD.md` |
| Disposition | CONFIRMED_EXISTING - guard-foundation standard authored under KIOD-R8 work order scope |
| Claim boundary | source-intake decision packet standard and checker only; no runtime, package, provider, public, dashboard, adapter, or production-readiness claim |

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: This standard defines a conservative static
packet-shape rule for future source-intake dispatch artifacts. It does not
make evidence-heavy predictions, run experiments, or compare competing
hypotheses. The rule follows directly from the KIOD-R8 work order scope and
the existing KIOD-R1 through KIOD-R3 references plus
`docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`.
No prediction, evidence comparison, or contradiction-gap disposition is
applicable.

## Claim Boundary

This standard defines a decision-packet shape for future source-intake
dispatch artifacts only. It does not authorize any outside-source absorption
pilot, runtime changes, provider-routing behavior, package activation,
public-sync, Web/UI changes, MCP/CLI adapter implementation, or
production-readiness claims. The checker enforces conservative changed-range
rules on artifacts that opt in via the applicability marker; it does not infer
broad historical closure semantics or reopen closed KIOD-R1 through KIOD-R7
artifacts.
