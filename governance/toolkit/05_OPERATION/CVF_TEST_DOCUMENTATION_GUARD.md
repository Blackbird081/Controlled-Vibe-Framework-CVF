# CVF Test Documentation Guard

**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active incremental-test-log documentation contract for test-bearing changes.
**Applies to:** All humans and AI agents running tests or changing governed test files in CVF repositories.
**Enforced by:** `governance/compat/check_test_doc_compat.py`

## Purpose

- keep every test execution batch traceable in the active window at `docs/CVF_INCREMENTAL_TEST_LOG.md`
- prevent repeated testing or silent skip-scope decisions
- preserve a durable explanation of what was verified, what was not, and why

Historical windows may rotate into `docs/logs/`, but the active root file remains the canonical entrypoint and current working log.

## Rule

Any commit that runs tests, carries a test-oriented commit pattern, or changes governed test files MUST have a corresponding batch entry in the active incremental test log window `docs/CVF_INCREMENTAL_TEST_LOG.md` within the same push.

### Trigger Patterns

| Commit Message Pattern Or Change Type | Triggers Guard? |
|---|:---:|
| `test: ...` | Yes |
| `test(scope): ...` | Yes |
| `chore(test): ...` | Yes |
| message contains `test`, `coverage`, or `regression` | Yes |
| changed `*.test.ts`, `*.test.tsx`, or `*.spec.ts` files | Yes |
| `feat: ...` with no governed test change | No |
| `docs: ...` with no governed test change | No |
| `fix: ...` with no governed test change | No |

### Required Log Format

Each batch entry in the active incremental test log chain MUST include:

| Field | Required? | Description |
|---|:---:|---|
| `Date` | Yes | `[YYYY-MM-DD]` format |
| `Batch Name` | Yes | Short descriptive name |
| `Change Reference` | Yes | Commit hash, range, or PR |
| `Impacted Scope` | Yes | Files or modules affected |
| `Tests Executed` | Yes | Commands plus pass or fail result |
| `Skip Scope` | Yes | What was not tested and why |
| `Notes/Risks` | Optional | Edge cases or known issues |

Template:

```md
## [YYYY-MM-DD] Batch: <name>
- Change reference:
- Impacted scope:
- Tests executed:
  - `<command>` -> PASS/FAIL
- Skip scope:
  - `<module>`: skipped because <reason>
- Notes/Risks:
```

### Workflow

1. determine the test scope
2. run the needed tests
3. log the result in `docs/CVF_INCREMENTAL_TEST_LOG.md` before committing
4. commit and push
5. let the compat gate validate the matching batch entry

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_test_doc_compat.py`
- this guard works together with `check_core_compat.py`, `check_bug_doc_compat.py`, and `check_incremental_test_log_rotation.py`
- test activity without documentation is governance drift and must be corrected before push or merge

Strict command:

```bash
python governance/compat/check_test_doc_compat.py --enforce
```

Exit codes:

| Code | Meaning |
|---|---|
| `0` | all test activities are documented |
| `1` | script or git error |
| `2` | test activity found without log entry |

## Related Artifacts

- `governance/compat/check_test_doc_compat.py`
- `governance/compat/check_incremental_test_log_rotation.py`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/logs/`
- `governance/toolkit/05_OPERATION/CVF_BUG_DOCUMENTATION_GUARD.md`

## Final Clause

Running tests without leaving a governed record behind creates false confidence. CVF requires the result and the rationale for any skipped scope to be durable.
