# CVF WORKSPACE ISOLATION GUARD

> **Type:** Governance Policy  
> **Effective:** 2026-03-02  
> **Status:** Active  
> **Enforced by:** `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md` (Core Requirement #8)

---

## 1. PURPOSE

Protect CVF core from unintended edits caused by downstream product development.

This guard prevents:
- Cross-project contamination
- Accidental modification of framework files
- Governance drift caused by mixed workspaces

---

## 2. RULE

> ⚠️ **NON-NEGOTIABLE:**  
> Downstream projects MUST NOT be opened, built, or developed directly inside the CVF repository root.

CVF root is reserved for framework maintenance only.

---

## 3. REQUIRED WORKSPACE PATTERN

Use isolated sibling workspaces:

```text
D:\Work\
  .Controlled-Vibe-Framework-CVF\   # CVF core (shared or cloned)
  <Project-A>\                      # downstream app
  <Project-B>\                      # downstream app
```

Notes:
- Leading `.` in CVF folder name is an isolation convention.
- Hidden attribute is optional; naming convention is enough.

---

## 4. ALLOWED VS FORBIDDEN

### Allowed in CVF root

- Update CVF governance/policy documents
- Improve CVF core/runtime/extensions
- Run CVF core tests and release tasks

### Forbidden in CVF root

- Creating a new product app directly under CVF root
- Running downstream app build pipelines from CVF root
- Storing downstream env files, data, or secrets in CVF root

---

## 5. MANDATORY WORKFLOW

1. Prepare isolated directories (`CVF core` + `project workspace`)
2. Clone/link CVF core into its dedicated folder
3. Open IDE at project workspace folder, not CVF root
4. Use CVF as framework reference, not as downstream app workspace

---

## 6. DRIFT TRIGGER & ENFORCEMENT

If workspace isolation is violated:

1. Agent state -> `REVALIDATING`
2. Stop development activity immediately
3. Move downstream artifacts to isolated project workspace
4. Re-run governance checks before continuing

Violation is considered governance drift and must be corrected before normal operation.

---

## 7. RELATED GOVERNANCE ARTIFACTS

- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- `governance/toolkit/05_OPERATION/CONTINUOUS_GOVERNANCE_LOOP.md`
- `README.md` (mandatory governance notice)
- `docs/GET_STARTED.md` (onboarding rule)

End of Workspace Isolation Guard.
