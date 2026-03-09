# CVF TEST DOCUMENTATION GUARD

> **Type:** Governance Policy  
> **Effective:** 2026-02-26  
> **Status:** Active  
> **Enforced by:** `governance/compat/check_test_doc_compat.py`

---

## 1. PURPOSE

Every test execution batch MUST be logged in the active window at `docs/CVF_INCREMENTAL_TEST_LOG.md`.

Historical windows may be rotated into `docs/logs/`, but the active root file remains the canonical entrypoint and current working log.

This ensures:
- **No blind spots**: every test decision is traceable
- **No wasted cycles**: future testers know what was already verified
- **Drift prevention**: skipped scope is explicitly justified, not silently ignored

---

## 2. RULE

> ⚠️ **NON-NEGOTIABLE:**  
> Any commit that runs tests (`test:`, `test(`, `chore(test)`) or changes test files (`*.test.ts`, `*.test.tsx`, `*.spec.ts`) **MUST** have a corresponding batch entry in the active incremental test log window `docs/CVF_INCREMENTAL_TEST_LOG.md` within the same push.

### What Triggers This Guard?

| Commit Message Pattern | Triggers Guard? |
|----------------------|:-:|
| `test: ...` | ✅ |
| `test(scope): ...` | ✅ |
| `chore(test): ...` | ✅ |
| Message contains `test`, `coverage`, `regression` | ✅ |
| Changed `*.test.ts` / `*.test.tsx` / `*.spec.ts` files | ✅ |
| `feat: ...` (no test files changed) | ❌ |
| `docs: ...` (no test files changed) | ❌ |
| `fix: ...` (no test files changed) | ❌ |

---

## 3. REQUIRED LOG FORMAT

Each batch entry in the active incremental test log chain MUST include:

| Field | Required? | Description |
|-------|:---------:|-------------|
| **Date** | ✅ | `[YYYY-MM-DD]` format |
| **Batch Name** | ✅ | Short descriptive name |
| **Change Reference** | ✅ | Commit hash, range, or PR |
| **Impacted Scope** | ✅ | Files/modules affected |
| **Tests Executed** | ✅ | Commands + PASS/FAIL result |
| **Skip Scope** | ✅ | What was NOT tested and WHY |
| **Notes/Risks** | 📋 Optional | Edge cases, known issues |

Template (from Section 4 of the test log):

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

---

## 4. WORKFLOW

```
CODE CHANGE MADE
    ↓
DETERMINE TEST SCOPE
    ↓
RUN compatibility gate:
    python governance/compat/check_core_compat.py
    ↓
EXECUTE TESTS (focused or full)
    ↓
LOG RESULTS in docs/CVF_INCREMENTAL_TEST_LOG.md    ← BEFORE committing
    ↓
COMMIT (test: ...)
    ↓
PUSH
    ↓
COMPAT GATE VALIDATES                               ← Automated check
    ↓
✅ PASS or ❌ FAIL
```

---

## 5. ENFORCEMENT

### Automated Check

```bash
# Standard check (advisory)
python governance/compat/check_test_doc_compat.py

# Strict enforcement (blocks push on failure)
python governance/compat/check_test_doc_compat.py --enforce
```

### Exit Codes

| Code | Meaning |
|:----:|---------|
| 0 | All test activities are documented |
| 1 | Script error (git failure, etc.) |
| 2 | Test activity found WITHOUT log entry (VIOLATION) |

---

## 6. RELATION TO EXISTING GOVERNANCE

This guard works in tandem with:
- `check_core_compat.py` — Decides WHAT to test (focused vs full)
- `check_bug_doc_compat.py` — Ensures bug fixes are documented
- `check_test_doc_compat.py` — Ensures test results are logged ← **THIS GUARD**
- `check_incremental_test_log_rotation.py` — Ensures the active test log window stays reviewable
- `CONTINUOUS_GOVERNANCE_LOOP.md` — Test without documentation is a drift trigger
- `docs/baselines/CVF_CORE_COMPAT_BASELINE.md` — Baseline reference for test decisions

### Complete Compat Gate Pipeline

```bash
# 1. Core compatibility (what scope to test)
python governance/compat/check_core_compat.py --base <BASE> --head <HEAD>

# 2. Bug documentation (fix commits must have BUG_HISTORY entry)
python governance/compat/check_bug_doc_compat.py --enforce

# 3. Test documentation (test commits must have TEST_LOG entry)
python governance/compat/check_test_doc_compat.py --enforce
```

End of Test Documentation Guard.
