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
  <Application-Project-1>/
  <Application-Project-2>/
  WORKSPACE_RULES.md
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
- It should contain the hidden CVF core clone.
- It should contain application project folders.
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

## New Project Enforcement Gate

Existing workspaces may contain older sibling projects that predate the current
bootstrap contract. Those projects do not become governed automatically just
because they sit next to `.Controlled-Vibe-Framework-CVF/`.

Use a workspace baseline to grandfather legacy projects and enforce the doctor
for every new project added after the baseline is created:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check_cvf_workspace_new_project_enforcement.ps1 `
  -WorkspaceRoot "<workspace-root>"
```

The gate reads `<workspace-root>/WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json`.
Projects listed under `legacyProjects` are reported as `LEGACY_EXEMPT`. Every
other sibling project is treated as a new governed project and must pass
`scripts/check_cvf_workspace_agent_enforcement.ps1`.

This lets a team adopt the rule immediately for new work without rewriting
older repositories on day one.

## Update Flow

Reconcile an existing hidden public-core clone from inside
`.Controlled-Vibe-Framework-CVF`:

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
