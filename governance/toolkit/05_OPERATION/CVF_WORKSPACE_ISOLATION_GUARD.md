# CVF Workspace Isolation Guard

**Guard Class:** `PACKAGE_AND_RUNTIME_ALIGNMENT_GUARD`
**Status:** Active workspace-boundary rule protecting CVF core from downstream project contamination.
**Applies to:** Humans and AI agents opening, building, or developing downstream projects that use CVF as a framework.
**Enforced by:** `governance/compat/check_foundational_guard_surfaces.py`, `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`, `README.md`

## Purpose

- protect CVF core from unintended edits caused by downstream product development
- prevent cross-project contamination and mixed workspace drift
- keep framework maintenance separate from downstream app execution and secrets

## Rule

Downstream projects MUST NOT be opened, built, or developed directly inside the CVF repository root.

CVF root is reserved for framework maintenance only.

### Required Workspace Pattern

Use isolated sibling workspaces:

```text
D:\Work\
  .Controlled-Vibe-Framework-CVF\   # CVF core
  <Project-A>\                      # downstream app
  <Project-B>\                      # downstream app
```

Notes:

- the leading `.` in the CVF folder name is an isolation convention
- hidden attribute is optional; the naming convention is enough

### Allowed In CVF Root

- update CVF governance and policy documents
- improve CVF core, runtime, or extensions
- run CVF core tests and release tasks

### Forbidden In CVF Root

- creating a new product app directly under CVF root
- running downstream app build pipelines from CVF root
- storing downstream env files, app data, or secrets in CVF root

### Mandatory Workflow

1. prepare isolated directories for CVF core and the downstream project
2. clone or link CVF core into its dedicated folder
3. open the IDE at the project workspace, not the CVF root
4. use CVF as a framework reference, not as the downstream app workspace
5. store a bootstrap record in downstream project docs using `governance/toolkit/05_OPERATION/CVF_PROJECT_BOOTSTRAP_LOG_TEMPLATE.md`

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_foundational_guard_surfaces.py`
- the canonical policy requirement lives in `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- onboarding and governance notices in `README.md` reinforce the rule at repository entry
- if workspace isolation is violated, stop development, move the downstream artifacts into an isolated project workspace, and rerun governance checks before continuing

## Related Artifacts

- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- `README.md`
- `docs/GET_STARTED.md`
- `governance/toolkit/05_OPERATION/CVF_PROJECT_BOOTSTRAP_LOG_TEMPLATE.md`

## Final Clause

CVF cannot remain a trustworthy framework if downstream work is allowed to blur the boundary between core maintenance and product development.
