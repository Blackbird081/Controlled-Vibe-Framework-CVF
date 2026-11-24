# CVF Skill Control Plane Inventory Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-30

docType: reference_standard

Batch ID: SCPL-T1

## Purpose

Define the central Skill Control Plane inventory read model for CVF skill
surfaces. The inventory exists so future agents can answer where a skill sits
across ASSF metadata, package roots, runtime eligibility, active resolver
readiness, CLI/MCP adapter status, Web projection, and provider-skill authority
boundaries before scaling more package skills.

## Scope / Applies To

Applies to generated skill inventory read models, skill lifecycle CLI readouts,
cross-surface skill drift checkers, and future Skill Governance Console inputs.
It does not apply to package promotion, provider routing, Web page
implementation, MCP server runtime, or public-sync work.

## Scope / Target / Owner Boundary

| Field | Disposition |
|---|---|
| Target surface | Skill Control Plane generated inventory and checker |
| Owner surface | `docs/reference/agent_system_skills/` and `governance/compat/` |
| Authority boundary | read model and drift guard only |
| Forbidden expansion | no package lifecycle mutation, provider/live proof, Web page, MCP server, public-sync, or production action authority |

## Taxonomy

| Surface class | Control-plane token | Current status label |
|---|---|---|
| Codex/provider skills | `EXTERNAL_PROVIDER_RUNTIME_SKILL` | external/provider runtime skills, non-CVF authority |
| CVF Web/library skills/templates | `WEB_PROJECTION_CATALOG_ITEM` | presentation/projection/catalog items |
| ASSF registry entries | `ASSF_REGISTRY_ENTRY` | canonical metadata source |
| ASSF package roots | `ASSF_PACKAGE_ROOT` | governed package body candidates |
| Runtime-eligible packages | `RUNTIME_ELIGIBLE_PACKAGE` | bounded internal loader packages |
| Active resolver packages | `ACTIVE_RESOLVER_READY_PACKAGE` | read-only activation-readiness packages |
| CLI/MCP adapter packages | `CLI_MCP_ADAPTER_PACKAGE` | bounded adapter envelope packages |
| Public/prod packages | `PUBLIC_PROD_PACKAGE` | no public/prod authority from inventory alone |

## Generated Inventory Contract

Generated aggregate:

`docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json`

Generator:

`governance/compat/generate_skill_control_plane_inventory.py`

CLI readout:

`governance/compat/run_skill_control_plane_inventory.py`

Drift checker:

`governance/compat/check_skill_control_plane_inventory.py`

The generated inventory reads source surfaces only. It must not open package
instruction bodies, mutate lifecycle state, call providers, perform public-sync,
or grant runtime authority.

## Cross-Surface Drift Rules

The checker must fail when:

- the generated inventory differs from source surfaces;
- Web `CERTIFIED_PACKAGE_PROJECTION` lacks matching registry certification and
  UAT evidence;
- Web `certificationState` or `uatState` disagrees with the matching ASSF
  registry entry;
- a package root source record disagrees with its registry lifecycle state;
- a runtime-eligible package lacks an approved strict truth packet needed for
  activation readiness;
- `externalCliMcpDisposition=IMPLEMENTED` lacks concrete adapter contract or
  adapter evidence.

## Claim Boundary

This standard defines a generated read model and drift guard only. It does not
create package bodies, promote lifecycle state, implement a Web page, implement
an MCP server, call providers, public-sync, or grant production action
authority.

## Offline Orchestrator Projection

The opt-in CLI interface is `--orchestrator-request <JSON-file> --json`.
It adopts the selected offline contract retained at
`docs/reviews/evidence/jev-orchestrator-adapter-design-20261107/selected-design-section.txt`
(SHA256 `ddac226287b49a9599d35b0d3811a655bbf5ae7bf5145716e9475ded14fc727c`).
Legacy inventory and recommendation defaults remain unchanged; combining this
flag with legacy filters is an error. Invalid/unreadable request JSON exits2;
valid requests return structured metadata results, including BLOCKED, at exit0.

The request binds task text/class/role/phase/exact surface/risk ceiling and a
reasoned main-agent native decision. Native sufficiency returns NO_SKILL/NONE;
an unknown native decision returns BLOCKED/NEEDS_MAIN_DECISION. Both precede
metadata enumeration and Git lookup. Other requests read only the canonical
ASSF index, its registry entries and selection profiles, plus explicitly named
user-skill governance metadata through
`governance/skill-library/registry/user-skills/INDEX.md`. Source/body links in
those metadata files are never followed. User role/phase vocabularies are not
mapped to internal agent permissions; these references remain UNKNOWN_UNMAPPED.

Limits are 4000 task characters, 200 source records, 20 explicit user IDs,
10 returned candidates, 2MiB per metadata file and 32KiB per request/compact
projection. Duplicate keys/IDs, unknown fields, redirects, source inconsistency,
dirty metadata, unavailable revision and over-cap inputs fail closed. Raw
metadata hashes and Git revision describe observed bytes; consistency does not
prove approval or quality. Package instruction bodies, truth/readiness owners,
body-bearing Web index and provider transports are outside this route.

Pure `project_candidates`, `validate_advisory` and `bind_main_decision` helpers
live in `governance/compat/orchestrator_capability_projection.py`. They reuse
the existing selection read model and rank the complete bounded eligible set
before truncation, with an explicit inventory dictionary even when empty.
Unknown risk fails eligibility, surfaces match exactly, and runtime bonuses
are omitted because readiness is UNKNOWN_NOT_EVALUATED. Snapshot-bound opaque
references keep advisory suggestions separate from the main NONE/SINGLE/
PROPOSED_COMPOSITION/ABSTAIN decision. Composition remains unverified; metadata
selection grants no reference read, activation, invocation or use proof.

The focused component tests and immutable legacy parity fixtures prove only
this offline route. Actual Orchestrator consumption, live Jev efficacy,
composition execution and NCR/product acceptance remain separate owned proof.

## Agent Operation Trace Block

Original SCPL-T1 inventory adoption is historical Git evidence; this trace covers the current bounded opt-in change.

| Field | Evidence |
|---|---|
| Actor | INTERNAL_AGENT LOCAL implementation worker |
| Provider or surface | private local filesystem |
| Session or invocation | CVF-JEV-ORCHESTRATOR-REENTRY-20261117-worker |
| Working directory | repository root |
| Command or tool surface | exact offline source edits, focused native tests and worker-return helper |
| Target paths | governance/compat/run_skill_control_plane_inventory.py; governance/compat/orchestrator_capability_projection.py; governance/compat/test_orchestrator_capability_projection.py; docs/reference/agent_system_skills/CVF_SKILL_CONTROL_PLANE_INVENTORY_STANDARD.md; docs/reviews/CVF_JEV_ORCHESTRATOR_OFFLINE_PROJECTION_WORKER_RETURN_2026-11-07.md |
| Allowed scope source | released current offline projection work order at material80430ce52 and continuity6a6e072bf |
| Before status evidence | clean actual executionBaseHead6a6e072bf053590259a9a586421a065754671544; raw preimages retained |
| After status evidence | bounded opt-in projection with unknown readiness; legacy defaults retained |
| Diff evidence | git diff --name-status; git status --short |
| Approval boundary | exact4source+formal5; WORKER_MUST_NOT_COMMIT; provider/runtime0 |
| Claim boundary | offline metadata source behavior only; no invocation or product acceptance |
| Agent type | INTERNAL_AGENT |
| Invocation ID | CVF-JEV-ORCHESTRATOR-REENTRY-20261117-worker |
| Expected manifest | governance/compat/run_skill_control_plane_inventory.py; governance/compat/orchestrator_capability_projection.py; governance/compat/test_orchestrator_capability_projection.py; docs/reference/agent_system_skills/CVF_SKILL_CONTROL_PLANE_INVENTORY_STANDARD.md; docs/reviews/CVF_JEV_ORCHESTRATOR_OFFLINE_PROJECTION_WORKER_RETURN_2026-11-07.md |
| Actual changed set | governance/compat/run_skill_control_plane_inventory.py; governance/compat/orchestrator_capability_projection.py; governance/compat/test_orchestrator_capability_projection.py; docs/reference/agent_system_skills/CVF_SKILL_CONTROL_PLANE_INVENTORY_STANDARD.md; docs/reviews/CVF_JEV_ORCHESTRATOR_OFFLINE_PROJECTION_WORKER_RETURN_2026-11-07.md |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Epistemic Process Block

### Expected Result / Prediction

The opt-in metadata adapter should preserve legacy output and avoid body/provider effects.

### Evidence Comparison

Focused source tests and immutable legacy parity fixtures are recorded in the governed worker return; the actual repository metadata consumer smoke remains NOT_RUN there.

### Contradiction Or Gap Disposition

Preliminary source review corrected unknown-readiness and snapshot-binding gaps without changing the native ranker or frozen oracle.

### Claim Update

This reference documents bounded offline source behavior; independent acceptance and runtime/product proof remain separate.
