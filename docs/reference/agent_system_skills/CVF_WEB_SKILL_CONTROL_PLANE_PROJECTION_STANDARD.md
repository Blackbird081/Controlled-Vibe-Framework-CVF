# CVF Web Skill Control Plane Projection Standard

Memory class: reference-standard

Status: ACTIVE_REFERENCE

Date: 2026-06-30

docType: reference_standard

## Purpose

Define how CVF Web and future dashboard surfaces inherit package-skill state
from the Skill Control Plane without becoming runtime, activation, provider,
certification, or public-export authority.

## Scope / Applies To

Applies to CVF Web skill-library projection files, Web dashboard read models,
and future dashboard views that display ASSF package-skill lifecycle,
runtime-eligibility, domain, selection, activation, or adapter state.

## Scope / Target / Owner Boundary

Target owner: CVF Web projection and dashboard display surfaces.

Forbidden owner claim: Web projection does not own ASSF certification, package
runtime activation, provider routing, public export, truth packets, registry
source, package body source, or Skill Control Plane canonical state.

## Standard

CVF Web may display and filter package-skill state only through generated
projection files derived from canonical ASSF and Skill Control Plane sources.

Required projection files:

| File | Role |
|---|---|
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/data/skills-index.json` | existing skill library read model used by the skills pages |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/data/assf-skill-control-plane.json` | dashboard-ready package-skill control-plane read model |

Canonical sources remain:

| Source | Role |
|---|---|
| `docs/reference/agent_system_skills/registry/entries/` | ASSF metadata source |
| `docs/reference/agent_system_skills/packages/` | governed package body candidates and active package bodies |
| `docs/reference/agent_system_skills/generated/skill-index.json` | generated ASSF skill index |
| `docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json` | generated Skill Control Plane aggregate |

## Dashboard Contract

The Web control-plane projection must carry a `dashboardContract` value stating
that the file is read-only display/filtering data and is not runtime authority,
activation authority, provider authority, or public certification authority.

Future Web dashboard pages must consume the generated projection rather than
reconstructing package lifecycle state from registry entries or package bodies.

## Required Fields

For runtime package projections, Web data must expose at least:

| Field | Source |
|---|---|
| `skillId` | Skill Control Plane inventory record |
| `title` | registry name fallback |
| `primaryDomain` | selection profile |
| `domainGroup` | selection profile |
| `recommendedWhen` | selection profile |
| `notRecommendedWhen` | selection profile |
| `specSignals` | selection profile |
| `selectionKeywords` | selection profile |
| `outputGoals` | selection profile |
| `runtimeEligible` | runtime eligibility state |
| `activationDecision` | active resolver state |
| `cliMcpDisposition` | CLI/MCP adapter state |
| `packageRootPath` | package root source |
| `truthStatus` | truth packet state |

## Drift Guard

The guard
`governance/compat/check_cvf_web_skill_control_plane_projection.py --enforce`
must pass whenever Web skill projection files, ASSF package source, generated
ASSF indexes, or Skill Control Plane inventory are changed.

The guard must verify that every runtime-eligible package in the Skill Control
Plane inventory appears in both Web projection files with runtime package
projection metadata.

## Future Dashboard Inheritance

Dashboard work should treat
`public/data/assf-skill-control-plane.json` as the single Web-side package-skill
read model. A future dashboard may add UI filters, domain grouping, lifecycle
badges, recommended-use panels, or blocked-gate explanations, but it must not
promote Web display state into ASSF certification, package activation, provider
routing, or public-export authority.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this standard governs private provenance Web projection behavior.
Public-safe export requires a separate public-sync authorization.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | SCPL-WEB-T1 Skill Control Plane Web projection, 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | source reads, apply_patch, Web generator, unit tests, governance checks |
| Target paths | this standard; Web skill generator; Web skill components and types; Web generated data; Web projection checker and catalogs |
| Allowed scope source | operator instruction to create a Web tranche and make future dashboard inherit Skill Control Plane state |
| Before status evidence | Web skill index projected ASSF skills but had no dashboard-ready package-skill control-plane read model |
| After status evidence | Web projection read model generated and drift guard added |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | Web projection and dashboard inheritance contract only |
| Claim boundary | read-only Web projection; no runtime, provider, public-sync, or activation authority |
| Agent type | dispatcher/implementer/reviewer/closer |
| Invocation ID | `scpl-web-t1-skill-control-plane-web-projection-2026-06-30` |
| Expected manifest | Web projection standard, GC-018, work order, completion review, Web generator, Web data, Web component tests, Web projection checker and hook catalogs |
| Actual changed set | pending material diff before closure |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename planned |

## Claim Boundary

This standard defines Web/dashboard projection inheritance only. It does not
grant runtime package activation, provider model routing, full MCP behavior,
public-sync, or downstream action authority.
