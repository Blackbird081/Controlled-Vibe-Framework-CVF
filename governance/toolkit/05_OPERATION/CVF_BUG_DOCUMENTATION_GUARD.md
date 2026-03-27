# CVF Bug Documentation Guard

**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active bug-history documentation contract for fix-bearing commits.
**Applies to:** All humans and AI agents pushing bug-fix commits into CVF repositories.
**Enforced by:** `governance/compat/check_bug_doc_compat.py`

## Purpose

- make bug-fix history searchable instead of oral or ad hoc
- reduce repeat debugging by preserving root cause, solution, and prevention context
- keep fix evidence paired with the commit batch that introduced it

## Rule

Any commit containing a bug fix pattern such as `fix:`, `bugfix:`, `hotfix:`, or a `BUG-XXX` token MUST have a corresponding entry in `docs/BUG_HISTORY.md` within the same push.

### Trigger Patterns

| Commit Message Pattern | Triggers Guard? |
|---|:---:|
| `fix: ...` | Yes |
| `bugfix: ...` | Yes |
| `hotfix: ...` | Yes |
| message contains `BUG-XXX` | Yes |
| `feat: ...` | No |
| `docs: ...` | No |
| `refactor: ...` | No |
| `chore: ...` | No |

### Required Documentation Format

Each bug entry in `BUG_HISTORY.md` MUST include:

| Field | Required? | Description |
|---|:---:|---|
| `Bug ID` | Yes | Sequential such as `BUG-001`, `BUG-002` |
| `Date` | Yes | When the bug was discovered |
| `Severity` | Yes | Critical, High, Medium, or Low |
| `Component` | Yes | Which module or component is affected |
| `File(s)` | Yes | Paths to affected files |
| `Error Message` | Yes | Exact error text for searchability |
| `Root Cause` | Yes | Why the bug happened |
| `Solution` | Yes | Step-by-step fix with code diff context |
| `Prevention` | Yes | How to avoid similar bugs in the future |
| `Related Commits` | Yes | Git commit hash of the fix |

### Workflow

1. detect and debug the bug
2. fix the code
3. add the entry to `docs/BUG_HISTORY.md` before committing
4. commit and push
5. let the compat gate validate the matching history entry

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_bug_doc_compat.py`
- local and CI usage should run the checker in `--enforce` mode before merge or push
- undocumented bug fixes are treated as governance drift and must be corrected before the push proceeds

Strict command:

```bash
python governance/compat/check_bug_doc_compat.py --enforce
```

Exit codes:

| Code | Meaning |
|---|---|
| `0` | all bug fixes are documented |
| `1` | script or git error |
| `2` | bug fix found without documentation |

## Related Artifacts

- `governance/compat/check_bug_doc_compat.py`
- `docs/BUG_HISTORY.md`
- `governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_ADR_GUARD.md`

## Final Clause

If a bug fix is important enough to ship, it is important enough to leave a durable explanation behind.
