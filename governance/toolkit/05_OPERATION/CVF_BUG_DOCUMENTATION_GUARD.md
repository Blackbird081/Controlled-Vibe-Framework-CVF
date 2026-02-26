# CVF BUG DOCUMENTATION GUARD

> **Type:** Governance Policy  
> **Effective:** 2026-02-26  
> **Status:** Active  
> **Enforced by:** `governance/compat/check_bug_doc_compat.py`

---

## 1. PURPOSE

Every bug fix MUST be documented in `docs/BUG_HISTORY.md` before pushing to the repository.

This reduces **debug loop repetition** — when the same or similar bug appears again, the team can search the history for root cause, solution, and prevention strategies instead of debugging from scratch.

---

## 2. RULE

> ⚠️ **NON-NEGOTIABLE:**  
> Any commit containing a bug fix (`fix:`, `bugfix:`, `hotfix:`) **MUST** have a corresponding entry in `docs/BUG_HISTORY.md` within the same push.

### What Constitutes a "Bug Fix"?

| Commit Message Pattern | Triggers Guard? |
|----------------------|:-:|
| `fix: ...` | ✅ |
| `bugfix: ...` | ✅ |
| `hotfix: ...` | ✅ |
| Message contains `BUG-XXX` | ✅ |
| `feat: ...` | ❌ |
| `docs: ...` | ❌ |
| `refactor: ...` | ❌ |
| `chore: ...` | ❌ |

---

## 3. REQUIRED DOCUMENTATION FORMAT

Each bug entry in `BUG_HISTORY.md` MUST include:

| Field | Required? | Description |
|-------|:---------:|-------------|
| **Bug ID** | ✅ | Sequential: `BUG-001`, `BUG-002`, ... |
| **Date** | ✅ | When the bug was discovered |
| **Severity** | ✅ | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low |
| **Component** | ✅ | Which module/component is affected |
| **File(s)** | ✅ | Paths to affected files |
| **Error Message** | ✅ | Exact error text for searchability |
| **Root Cause** | ✅ | WHY the bug happened (not just WHAT) |
| **Solution** | ✅ | Step-by-step fix with code diff |
| **Prevention** | ✅ | How to avoid similar bugs in the future |
| **Related Commits** | ✅ | Git commit hash of the fix |

---

## 4. WORKFLOW

```
BUG DETECTED
    ↓
DEBUG & FIX THE CODE
    ↓
ADD ENTRY TO docs/BUG_HISTORY.md    ← BEFORE committing
    ↓
COMMIT (fix: ...)
    ↓
PUSH
    ↓
COMPAT GATE VALIDATES              ← Automated check
    ↓
✅ PASS or ❌ FAIL
```

---

## 5. ENFORCEMENT

### Automated Check

```bash
# Standard check (advisory)
python governance/compat/check_bug_doc_compat.py

# Strict enforcement (blocks push on failure)
python governance/compat/check_bug_doc_compat.py --enforce
```

### Exit Codes

| Code | Meaning |
|:----:|---------|
| 0 | All bug fixes are documented |
| 1 | Script error (git failure, etc.) |
| 2 | Bug fix found WITHOUT documentation (VIOLATION) |

### Integration Points

- **Pre-push hook** (recommended): Run with `--enforce`
- **CI/CD pipeline**: Run as gate before merge
- **Agent governance loop**: Include as drift trigger

---

## 6. DRIFT TRIGGER

If the compat check detects an undocumented bug fix:

1. Agent state → `REVALIDATING`
2. Developer must add the missing BUG_HISTORY entry
3. Re-run compat check to verify
4. Only then can the push proceed

---

## 7. BENEFITS

| Metric | Without Guard | With Guard |
|--------|:------------:|:----------:|
| Repeated debug time | High | **Near zero** |
| Knowledge transfer | Oral/ad hoc | **Documented & searchable** |
| Onboarding speed | Slow | **Fast** (read history) |
| Pattern detection | Manual | **Quick reference tables** |

---

## 8. RELATION TO EXISTING GOVERNANCE

This guard complements:
- `CVF_INCIDENT_REPORT_TEMPLATE.md` — For production incidents (broader scope)
- `CONTINUOUS_GOVERNANCE_LOOP.md` — Bug doc is a new drift trigger
- `check_core_compat.py` — Bug doc check runs alongside core compat

End of Bug Documentation Guard.
