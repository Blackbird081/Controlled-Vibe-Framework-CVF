# CVF Public-Core Agent Continuation

Memory class: POINTER_RECORD

Status: PUBLIC_CORE_ACTIVE

## Purpose

Provide a compact public-only continuation pointer for users, developers, and
agents working from the public CVF repository.

## Scope / Target / Owner Boundary

Target: public-core continuation and workspace-kit availability only. Private
session state and provenance continuity remain outside this file.

## Owner / Source

Owner: public CVF core. This template is mapped to root `AGENT_HANDOFF.md` by
`scripts/cvf-public-sync.ps1`.

## Repository Boundary

Remote tracking branch: `origin/codex/p1-p5-public-doc-cleanup`

Default public remote branch: `origin/main`

Exact remote SHA must be derived live from git when needed.

External agent memory files: non-canonical convenience only.

Public repository:

`https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`

Derive the exact public tip from git when needed. Do not use this file as
private provenance memory.

## Current Public-Core Move

The public core supports local-first runtime use and sibling downstream
workspace bootstrap. The workspace kit includes bootstrap, doctor, knowledge
ingest, evidence bridge, hooks, and hidden-core reconciliation scripts.

## Workspace Continuation

For an existing workspace with a stale or unrelated hidden-core history, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\update_cvf_workspace_public_core.ps1 `
  -WorkspaceRoot "<workspace-root>" `
  -UpdateProjectManifests
```

## Protocol / Contract / Requirements

Derive the current public tip from git, keep downstream projects as siblings,
and reconcile stale hidden cores through backup plus fresh clone.

Consult `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json` before opening a
fresh public surface tranche.

Do not open a fresh tranche before consulting the canonical scan continuity registry.

Knowledge absorption and extension work must also consult
`docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`,
`CVF_KNOWLEDGE_ABSORPTION_PRIORITY_GUARD.md`, and
`governance/compat/check_knowledge_absorption_priority_compat.py` before
opening implementation-first expansion.

Template and skill value-proof work must consult
`governance/toolkit/05_OPERATION/CVF_TEMPLATE_SKILL_STANDARD_GUARD.md`,
`docs/reference/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md`,
`docs/reference/CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md`, and
`governance/compat/check_template_skill_standard_guard_compat.py` before
claiming `TRUSTED_FOR_VALUE_PROOF`.

## Enforcement / Verification

Use `scripts/check_cvf_workspace_agent_enforcement.ps1` after bootstrap or
reconciliation.

## Related Artifacts

- `AGENTS.md`
- `docs/reference/CVF_WORKSPACE_RULES.md`
- `scripts/new-cvf-workspace.ps1`
- `scripts/update_cvf_workspace_public_core.ps1`

## Claim Boundary

This pointer does not expose private session state and does not claim hosted
readiness, production readiness, or hidden cross-agent memory transfer.
