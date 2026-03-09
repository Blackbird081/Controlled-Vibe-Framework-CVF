# CVF PYTHON AUTOMATION SIZE GUARD

> **Type:** Governance Policy  
> **Effective:** 2026-03-07  
> **Status:** Active  
> **Enforced by:** `governance/compat/check_python_automation_size.py`

---

## 1. PURPOSE

Governed Python automation under `scripts/` and `governance/compat/` must stay reviewable.

This guard exists to prevent:
- single-file automation blobs that become hard to audit
- slow, risky edits because too many unrelated rules accumulate in one file
- repeated future regressions where agents keep extending oversized scripts instead of splitting them

---

## 2. SCOPE

This guard applies to:
- `scripts/**/*.py`
- `governance/compat/**/*.py`

This guard does **not** apply to:
- vendored Python under `node_modules/`
- `governance/skill-library/registry/` legacy registry utilities
- extension-local Python outside the two governed automation trees above

---

## 3. SIZE RULE

### Thresholds

- **Soft threshold:** `600` lines
- **Hard threshold:** `1200` lines

### Required behavior

- Any governed Python file above the **soft threshold** MUST either:
  - be split/refactored, or
  - be listed in the exception registry with rationale and follow-up plan
- Any governed Python file above the **hard threshold** MUST NOT exist unless:
  - it is explicitly listed in the exception registry, and
  - the registry grants a temporary approved maximum

### Exception registry

Use:
- `governance/compat/CVF_PYTHON_AUTOMATION_SIZE_EXCEPTION_REGISTRY.json`

Each exception entry MUST include:
- `path`
- `approvedMaxLines`
- `rationale`
- `requiredFollowup`
- `status`

---

## 4. OPERATIONAL RULE

When a governed Python file approaches or exceeds the soft threshold:

1. Stop extending it blindly.
2. Decide whether the next batch should:
   - split builders/helpers into a separate module, or
   - register a temporary exception with explicit follow-up
3. Record the decision in the active roadmap/trace chain if the file remains oversized.

---

## 5. ENFORCEMENT

### Standard check

```bash
python governance/compat/check_python_automation_size.py
```

### Strict check

```bash
python governance/compat/check_python_automation_size.py --enforce
```

### Exit codes

| Code | Meaning |
|:----:|---------|
| 0 | Governed Python automation is within policy |
| 1 | Script/runtime error |
| 2 | Size policy violation |

---

## 6. CURRENT BASELINE NOTE

At the time this guard was activated:
- `scripts/export_cvf_release_packet.py` was already above the hard threshold
- it is therefore treated as a **legacy controlled exception**
- future extensions to that file should bias toward extraction/refactor, not continued in-place growth

---

## 7. RELATED GOVERNANCE

- `CVF_TEST_DOCUMENTATION_GUARD.md`
- `CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md`
- `CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md`
- `CVF_DOCUMENT_STORAGE_GUARD.md`

End of Python Automation Size Guard.
