# CVF Workspace Rules

> Canonical CVF reference.
>
> This file is the source of truth for CVF workspace topology and bootstrap behavior. A workspace root may also contain `WORKSPACE_RULES.md`; that file is a local copy/adaptation for the specific machine and may include local project names or local paths.
>
> Keep the shared rules aligned, but do not require the local workspace copy to be byte-for-byte identical.

This document defines the canonical workspace topology for CVF-managed local work.

## Purpose

`CVF-Workspace` is a parent container for the CVF governance repository and downstream application repositories. The workspace root itself is not a git repository.

## Required Layout

```text
CVF-Workspace/
  .Controlled-Vibe-Framework-CVF/
  CVF_RULE_PACKS/
  <Application-Project-1>/
  <Application-Project-2>/
  WORKSPACE_RULES.md
  CVF_WORKSPACE_RULE_PACKS.md
  CVF_WORKSPACE_MEMORY.md
  AGENT_HANDOFF.md
  WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json
  Update-CVF-Workspace-RulePack.ps1
  .agents/workflows/
  New-CVF-Governed-Project.ps1
  Run-CVF-NewProject-Enforcement.ps1
  Update-CVF-Workspace.ps1
```

## Governance Repository

The governance repository must live under the workspace root as `.Controlled-Vibe-Framework-CVF/`.

It is a clone of `https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`.

Rules:

- Treat this repository as the source of truth for CVF governance rules, scripts, templates, and shared documentation.
- Keep the leading dot in the directory name when using the standard workspace layout.
- Do not add downstream application code inside this repository.
- Update the governance repository by running git commands inside `.Controlled-Vibe-Framework-CVF`.

## Application Projects

Each application must live as a sibling of `.Controlled-Vibe-Framework-CVF`.

Rules:

- Each app owns its own source tree and git history.
- Apps may be standalone repos, worktrees, or submodules depending on the project.
- Apps may reference CVF by filesystem path, submodule, worktree, or versioned snapshot.
- Do not run app implementation tasks from inside the CVF core repository.
- Do not commit app artifacts into the CVF core repository.

Most shared downstream apps are expected to come from `https://github.com/CVF-Ecosystem/<repo>`.

## Workspace Root

The workspace root should stay clean:

- It should contain `WORKSPACE_RULES.md`.
- It may contain `CVF_RULE_PACKS/` and `CVF_WORKSPACE_RULE_PACKS.md` when a
  curated local rule pack has been installed.
- It may contain `CVF_WORKSPACE_MEMORY.md` and a workspace handoff root file
  for local agent continuity.
- It should contain `WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json`; the
  public-safe installer creates an empty baseline when it is missing and
  preserves an existing baseline.
- It may contain `Update-CVF-Workspace-RulePack.ps1` after an operator-local
  rule-pack sync.
- It may contain `.agents/workflows/` with workspace-local agent workflow
  notes.
- It should contain the hidden CVF core clone.
- It should contain application project folders.
- It should contain the public-safe root wrappers after bootstrap or
  reconciliation.
- It should not contain mixed application source files directly at root.
- It should not be initialized as a git repository.

## Bootstrap Contract

`scripts/new-cvf-workspace.ps1` creates or verifies this layout.

For new downstream projects, the bootstrap must produce:

- sibling app project folder
- `.cvf/manifest.json`
- `.cvf/policy.json`
- downstream `AGENTS.md`
- `knowledge/` folder
- bootstrap log under `docs/`
- workspace-root `WORKSPACE_RULES.md`

The workspace doctor must verify that the generated project remains isolated from CVF core and that the workspace-root rules file is present.

Bootstrap and reconciliation also install (or refresh) a small set of
workspace-root wrapper scripts and guides via
`scripts/install_cvf_workspace_root_wrappers.ps1`:

- `New-CVF-Governed-Project.ps1` - bootstrap + doctor + workspace gate in one command
- `Run-CVF-NewProject-Enforcement.ps1` - workspace-wide enforcement gate
- `Update-CVF-Workspace.ps1` - public-core fast-forward plus wrapper refresh
- `.agents/workflows/` - workspace-local agent workflow notes for onboarding and project pre-commit routing
- `WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json` - local legacy-project exemption baseline, created if missing and preserved if present
- `CVF_WORKSPACE_USER_GUIDE.md` / `CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md` - bilingual workspace-root guide

These wrappers only cover the public-safe flow (new-project bootstrap,
enforcement gate, public core update, agent workflow notes, and workspace-root
guidance). Local-only overlay tooling and private full-repository state are
separate operator-machine concerns and are not part of this public-safe wrapper
set.

## Rule Packs And Local Continuity

Operator-local workspaces may install curated rule packs from an
operator-approved source into the workspace root. When present:

- `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json` records the active selected pack.
- `CVF_WORKSPACE_RULE_PACKS.md` explains the installed pack and refresh flow.
- `Update-CVF-Workspace-RulePack.ps1` may be installed by an operator-local
  rule-pack sync so agents can refresh or switch the active pack without
  remembering the full source path.
- `CVF_WORKSPACE_MEMORY.md` is the workspace-local memory front door.
- The workspace handoff root file is the workspace-local agent handoff.
- `.agents/workflows/` gives agents short, workspace-local procedures for
  onboarding and pre-commit routing.

Rule packs are selected guidance, not full repository export. They do not turn
the workspace into the private full CVF repository and do not replace
project-level `AGENTS.md`, manifests, policies, or handoffs.

### Product Profile Tiers

Workspace rule packs use three product-facing tier names:

| Profile | Intended use | Boundary |
|---|---|---|
| `public-free` | Free or public-core-only workspace that needs the lightest guidance set. | No private continuity state. |
| `paid-user-safe` | Paid user or shared downstream team that needs curated authoring and repository-boundary references. | No private continuity state or full governance library. |
| `operator-local` | Private operator machine that needs full local continuity on top of the curated governance set. | Requires explicit continuity allowance and must not be copied into public or customer workspaces. |

Use `paid-user-safe` as the default future customer profile. Use
`operator-local` only for the operator's own local machine.

For paid-user-safe setup, first refresh the workspace, then select the profile,
then verify the active manifest and project-local checks:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace.ps1" -RunGate
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace-RulePack.ps1" -ProfileName "paid-user-safe"
```

The active manifest should record `paid-user-safe` in
`CVF_RULE_PACKS/ACTIVE_RULE_PACK.json`. This profile must not use
`-AllowProvenanceContinuity`.

## Update Flow

Reconcile an existing hidden public-core clone from inside
the workspace root:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace.ps1" -RunGate
```

If the root wrapper is missing, use the hidden-core reconciler directly from
inside `.Controlled-Vibe-Framework-CVF`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\update_cvf_workspace_public_core.ps1 `
  -WorkspaceRoot "<workspace-root>"
```

The reconciler verifies the workspace boundary, refuses to move a dirty hidden
core, backs up the existing clone, creates a fresh clone from the public
remote, refreshes the workspace-root rules file, and optionally updates
downstream manifest pins. It intentionally does not merge unrelated repository
histories.

Application projects should be updated from their own repository folders:

```powershell
cd <Application-Project>
git pull
```

## Boundary

This rule set is a local workspace convention and enforcement surface. It does not claim that every downstream app automatically inherits full CVF runtime behavior. A downstream project is agent-enforcement-ready only when its generated artifacts exist and `scripts/check_cvf_workspace_agent_enforcement.ps1` passes.

The workspace doctor also verifies that the hidden public core has the
public-safe bootstrap kit and matches `origin/main`. Use
`-AllowOfflinePinnedCore` only as an explicit bounded offline override when a
remote freshness check cannot run.
