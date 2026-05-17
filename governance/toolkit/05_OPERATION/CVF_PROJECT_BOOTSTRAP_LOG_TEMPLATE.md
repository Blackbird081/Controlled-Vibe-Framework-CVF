# CVF PROJECT BOOTSTRAP LOG TEMPLATE

> **Type:** Operational Record Template  
> **Purpose:** Standardize downstream project onboarding under Workspace Isolation Rule  
> **Rule Reference:** `CVF_WORKSPACE_ISOLATION_GUARD.md`

---

## 1. RECORD METADATA

- Record ID: `BOOTSTRAP-YYYYMMDD-<PROJECT>`
- Date (YYYY-MM-DD):
- Prepared By:
- Reviewed By:
- CVF Core Commit:

---

## 2. WORKSPACE TOPOLOGY (MANDATORY)

- Workspace Root:
- CVF Core Path: (must be sibling, with `.Controlled-Vibe-Framework-CVF`)
- Project Path:
- VS Code Workspace File:

Expected pattern:

```text
<WorkspaceRoot>\
  .Controlled-Vibe-Framework-CVF\
  <ProjectName>\
  <ProjectName>.code-workspace
```

---

## 3. ISOLATION VALIDATION

- [ ] CVF core and downstream project are sibling folders
- [ ] No downstream development inside CVF root
- [ ] IDE opened at downstream project root
- [ ] Terminal default cwd points to `${workspaceFolder}` in project
- [ ] Team members informed: do not run project build/test/patch in CVF root

Evidence:
- `git -C "<project>" rev-parse --show-toplevel`
- `git -C "<cvf-core>" rev-parse --show-toplevel`
- `.vscode/settings.json` snapshot
- `<ProjectName>.code-workspace` snapshot

---

## 4. PROJECT BOOTSTRAP ACTIONS

- [ ] CVF core cloned or linked
- [ ] Downstream project cloned
- [ ] Runtime artifacts migrated (if applicable): `.env`, `data/`, model dirs
- [ ] Toolchain baseline recorded (`python`, `node`, `pnpm`, optional `uv`)
- [ ] Initial smoke checks executed

Notes:

---

## 5. POST-BOOTSTRAP CHECKS

- [ ] API health endpoint reachable (if backend exists)
- [ ] Frontend starts successfully (if frontend exists)
- [ ] Critical workflow smoke tested
- [ ] Any deviations/issues documented

Issue Log:

---

## 6. APPROVAL

- Bootstrap Result:
  - [ ] PASS
  - [ ] PASS WITH NOTE
  - [ ] FAIL

- Approved By:
- Approval Date:

---

## 7. CHANGE HISTORY

| Date | Change | Owner |
|---|---|---|
| 2026-03-02 | Template created for standardized workspace onboarding | CVF Governance |

---

End of template.
