# CVF Workspace Rules

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

## Update Flow

Update CVF rules from inside `.Controlled-Vibe-Framework-CVF`:

```powershell
cd .Controlled-Vibe-Framework-CVF
git fetch origin
git merge origin/main
```

Application projects should be updated from their own repository folders:

```powershell
cd <Application-Project>
git pull
```

## Boundary

This rule set is a local workspace convention and enforcement surface. It does not claim that every downstream app automatically inherits full CVF runtime behavior. A downstream project is agent-enforcement-ready only when its generated artifacts exist and `scripts/check_cvf_workspace_agent_enforcement.ps1` passes.
