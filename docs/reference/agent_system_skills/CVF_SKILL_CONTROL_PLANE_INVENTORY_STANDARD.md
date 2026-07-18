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

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer role |
| Provider or surface | local workspace |
| Session or invocation | SCPL-T1 skill control plane inventory, 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | source reads, apply_patch, generator, checker, governance gates |
| Target paths | `docs/reference/agent_system_skills/CVF_SKILL_CONTROL_PLANE_INVENTORY_STANDARD.md`; `docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json`; `governance/compat/generate_skill_control_plane_inventory.py`; `governance/compat/run_skill_control_plane_inventory.py`; `governance/compat/check_skill_control_plane_inventory.py`; `governance/compat/test_skill_control_plane_inventory.py`; local hook and autorun catalogs |
| Allowed scope source | operator request for unified Skill Control Plane / Inventory Reconciliation before scaling more package skills |
| Before status evidence | ASSF foundation and runtime-loader lanes existed without a unified cross-surface inventory read model |
| After status evidence | generated inventory, CLI readout, drift checker, and catalog wiring added |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | generated read model and checker only |
| Claim boundary | no package promotion, runtime/provider call, Web page, MCP server, public-sync, or production action authority |
| Agent type | reviewer/closer |
| Invocation ID | `scpl-t1-skill-control-plane-inventory-2026-06-30` |
| Expected manifest | `docs/reference/agent_system_skills/CVF_SKILL_CONTROL_PLANE_INVENTORY_STANDARD.md`; `docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json`; `governance/compat/generate_skill_control_plane_inventory.py`; `governance/compat/run_skill_control_plane_inventory.py`; `governance/compat/check_skill_control_plane_inventory.py`; `governance/compat/test_skill_control_plane_inventory.py`; `governance/compat/agent_autorun_command_catalog.py`; `governance/compat/local_governance_hook_catalog_reviewer_fast.py`; `governance/compat/local_governance_hook_catalog_pre_commit.py`; `governance/compat/local_governance_hook_catalog_pre_push.py` |
| Actual changed set | material commit steward will verify before commit |
| Manifest delta | MATCH_AFTER_COMMIT_REVIEW |
| Deletion or rename disposition | N/A with reason: no deletion or rename |
