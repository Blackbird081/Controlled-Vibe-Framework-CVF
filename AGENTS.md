# CVF Public Core Agent Instructions

Memory class: POINTER_RECORD

Status: PUBLIC_CORE_ACTIVE

## Purpose

Provide public-safe startup instructions for agents using the public CVF core.

## Scope / Target / Owner Boundary

Target: public repository startup, local workspace bootstrap, and bounded live
proof guidance. Private provenance memory remains outside this surface.

## Owner / Source

Owner: public CVF core. Canonical source is this public-safe template, exported
to root `AGENTS.md` by `scripts/cvf-public-sync.ps1`.

## Repository Boundary

This repository is the public CVF core:

`https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`

Use it for public framework maintenance, local CVF runtime use, and downstream
workspace bootstrap. Do not treat it as private provenance memory.

Private operator handoffs, raw provider transcripts, internal reviews,
`.private_reference/`, and provenance-only state belong outside this public
repository.

## Public Startup Order

Before material public-core work:

1. read `AGENT_HANDOFF.md`;
2. read `docs/GET_STARTED.md`;
3. read `docs/reference/CVF_WORKSPACE_RULES.md`;
4. inspect `git remote -v`, `git status --short`, and the current branch;
5. keep downstream application work outside the CVF core folder.

## Workspace Rule

For a user or developer project, use the sibling workspace topology:

```text
CVF-Workspace/
  .Controlled-Vibe-Framework-CVF/
  <Application-Project>/
  WORKSPACE_RULES.md
```

Bootstrap or reconcile a workspace with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\new-cvf-workspace.ps1 `
  -WorkspaceRoot "<workspace-root>" `
  -ProjectName "<project-name>"
```

If an existing hidden core clone is stale or has unrelated history, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\update_cvf_workspace_public_core.ps1 `
  -WorkspaceRoot "<workspace-root>"
```

## Live Governance Proof

Any release-quality claim that CVF controls AI or agent behavior must run:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Mock mode is only for UI structure checks. Never commit or print raw provider
keys.

## Protocol / Contract / Requirements

Agents must honor the startup order, workspace isolation rule, public claim
boundary, and live-proof requirement above.

## Enforcement / Verification

Use `scripts/check_cvf_workspace_agent_enforcement.ps1` for downstream
workspace checks and `python scripts/run_cvf_release_gate_bundle.py --json`
for release-quality live governance proof. Public export disposition is checked
by `governance/compat/check_public_export_disposition.py`.

## Related Artifacts

- `AGENT_HANDOFF.md`
- `docs/GET_STARTED.md`
- `docs/reference/CVF_WORKSPACE_RULES.md`
- `governance/compat/check_public_export_disposition.py`
- `scripts/update_cvf_workspace_public_core.ps1`

## Claim Boundary

Do not claim hosted readiness, production readiness, universal provider parity,
or private-provenance completeness from this public checkout alone. Use only
public artifacts, current git state, and explicit live receipts as evidence.
