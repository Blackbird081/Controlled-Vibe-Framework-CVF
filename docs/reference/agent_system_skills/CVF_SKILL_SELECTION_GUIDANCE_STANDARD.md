# CVF Skill Selection Guidance Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-30

docType: reference_standard

Batch ID: SCPL-T2

## Purpose

Define the package-skill domain and spec-to-skill selection guidance layer for
the CVF Skill Control Plane. The layer helps users and agents choose relevant
package skills from a received spec before package body reads or runtime
invocation.

## Scope / Applies To

Applies to Skill Control Plane selection profile sources, generated inventory
selection fields, deterministic CLI recommendations, and drift checks that keep
package skills classified for future user and agent selection.

## Scope / Target / Owner Boundary

| Field | Disposition |
|---|---|
| Target surface | package-skill selection profiles and generated Skill Control Plane inventory |
| Owner surface | `docs/reference/agent_system_skills/` and `governance/compat/` |
| Authority boundary | selection guidance only |
| Forbidden expansion | no package lifecycle mutation, package body invocation, provider/live proof, Web page, MCP server, public-sync, or production action authority |

## Selection Profile Contract

Source profile:

`docs/reference/agent_system_skills/control_plane/source/skill-selection-profiles.json`

Generated projection:

`docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json`

Each package-root skill profile must include:

- `skillId`
- `domainGroup`
- `primaryDomain`
- `secondaryDomains`
- `intendedUsers`
- `agentUseCases`
- `specSignals`
- `selectionKeywords`
- `outputGoals`
- `recommendedWhen`
- `notRecommendedWhen`
- `expectedOutputContribution`
- `selectionPriority`

Allowed `domainGroup` values are `engineering` and `governance`.

## Selection CLI Contract

CLI:

`governance/compat/run_skill_control_plane_inventory.py`

The CLI may rank package skills from `--spec-text` or `--spec-file` using
deterministic profile keyword matching. It must not open package instruction
bodies, mutate lifecycle state, call providers, make Web claims, or convert a
recommendation into runtime authority.

## Drift Rules

The Skill Control Plane checker must fail when:

- a package root lacks a selection profile;
- a profile references a skill that is not a package root;
- a profile omits required selection fields;
- a profile uses an unsupported `domainGroup`;
- generated inventory drift hides a profile or recommendation source change.

## Claim Boundary

This standard defines package-skill domain and spec-selection guidance only. It
does not activate packages, invoke package bodies, certify skills, call
providers, implement Web UI, implement MCP runtime, public-sync, or authorize
production action.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer role |
| Provider or surface | local workspace |
| Session or invocation | SCPL-T2 skill selection guidance, 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | source reads, apply_patch, generator, checker, CLI smoke, governance gates |
| Target paths | `docs/reference/agent_system_skills/CVF_SKILL_SELECTION_GUIDANCE_STANDARD.md`; `docs/reference/agent_system_skills/control_plane/source/skill-selection-profiles.json`; `docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json`; `governance/compat/generate_skill_control_plane_inventory.py`; `governance/compat/run_skill_control_plane_inventory.py`; `governance/compat/test_skill_control_plane_inventory.py`; `docs/baselines/CVF_GC018_SCPL_T2_SKILL_SELECTION_GUIDANCE_2026-06-30.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_SCPL_T2_SKILL_SELECTION_GUIDANCE_2026-06-30.md`; `docs/reviews/CVF_SCPL_T2_SKILL_SELECTION_GUIDANCE_COMPLETION_2026-06-30.md` |
| Allowed scope source | operator request to classify package skills by domain and spec-selection guidance so users and agents choose correct skills |
| Before status evidence | SCPL-T1 inventory classified lifecycle/runtime surfaces but did not include domain and spec-selection guidance |
| After status evidence | selection profile source, inventory projection, CLI spec recommendation, and tests added |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | package-skill selection guidance only |
| Claim boundary | no package promotion, runtime/provider call, Web page, MCP server, public-sync, or production action authority |
| Agent type | reviewer/closer |
| Invocation ID | `scpl-t2-skill-selection-guidance-2026-06-30` |
| Expected manifest | `docs/reference/agent_system_skills/CVF_SKILL_SELECTION_GUIDANCE_STANDARD.md`; `docs/reference/agent_system_skills/control_plane/source/skill-selection-profiles.json`; `docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json`; `governance/compat/generate_skill_control_plane_inventory.py`; `governance/compat/run_skill_control_plane_inventory.py`; `governance/compat/test_skill_control_plane_inventory.py`; `docs/baselines/CVF_GC018_SCPL_T2_SKILL_SELECTION_GUIDANCE_2026-06-30.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_SCPL_T2_SKILL_SELECTION_GUIDANCE_2026-06-30.md`; `docs/reviews/CVF_SCPL_T2_SKILL_SELECTION_GUIDANCE_COMPLETION_2026-06-30.md` |
| Actual changed set | `docs/reference/agent_system_skills/CVF_SKILL_SELECTION_GUIDANCE_STANDARD.md`; `docs/reference/agent_system_skills/control_plane/source/skill-selection-profiles.json`; `docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json`; `governance/compat/generate_skill_control_plane_inventory.py`; `governance/compat/run_skill_control_plane_inventory.py`; `governance/compat/test_skill_control_plane_inventory.py`; `docs/baselines/CVF_GC018_SCPL_T2_SKILL_SELECTION_GUIDANCE_2026-06-30.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_SCPL_T2_SKILL_SELECTION_GUIDANCE_2026-06-30.md`; `docs/reviews/CVF_SCPL_T2_SKILL_SELECTION_GUIDANCE_COMPLETION_2026-06-30.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |
