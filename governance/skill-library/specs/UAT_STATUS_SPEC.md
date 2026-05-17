# CVF UAT Status Badge Specification

> **Version:** 1.0.0  
> **Status:** Active  
> **Date:** 2026-02-08  
> **Related:** [SKILL_MAPPING_UAT_BINDING](../uat/SKILL_MAPPING_UAT_BINDING.md)

---

## 1. Purpose

Define explicit UAT status badges to differentiate between:
- UAT that has **not been executed** (neutral)
- UAT that is **stale** (needs re-run)
- UAT that has been **validated** (passed)
- UAT that has **failed** (explicit failure)

This prevents users from interpreting "0% coverage" as "poor quality" — it means "not yet tested."

---

## 2. Badge Definitions

| Badge | Label | Visual | Condition | User Interpretation |
|-------|-------|:------:|-----------|---------------------|
| `NOT_RUN` | Not Run | 🔘 | No UAT result exists for this skill | "Testing not started" |
| `NEEDS_UAT` | Needs UAT | ⚠️ | Spec version > UAT version (stale) | "Changed since last test" |
| `VALIDATED` | Validated | ✅ | UAT PASS + version match | "Tested and passed" |
| `FAILED` | Failed | ❌ | UAT result = FAIL | "Tested and failed" |

---

## 3. Badge Assignment Rules

```
IF no UAT result exists:
    badge = NOT_RUN

ELSE IF skill_version != uat_skill_version:
    badge = NEEDS_UAT  (stale)

ELSE IF uat_result == "PASS":
    badge = VALIDATED

ELSE IF uat_result == "FAIL":
    badge = FAILED

ELSE:
    badge = NOT_RUN  (fallback)
```

---

## 4. Integration Points

### 4.1 In `.gov.md` Files
```markdown
## UAT Status

| Field | Value |
|-------|-------|
| Badge | ✅ VALIDATED |
| UAT Date | 2026-02-08 |
| Skill Version at UAT | 1.2.0 |
| Current Skill Version | 1.2.0 |
| Sync | SYNCED |
```

### 4.2 In Domain Reports
```markdown
| Domain | Skills | UAT Validated | UAT Not Run | UAT Stale |
|--------|:------:|:-------------:|:-----------:|:---------:|
| App Dev | 8 | 3 | 4 | 1 |
```

### 4.3 In `score_uat.py` Output
Each UAT result record must include:
- `badge`: one of `NOT_RUN`, `NEEDS_UAT`, `VALIDATED`, `FAILED`
- `uat_skill_version`: skill version when UAT was run
- `uat_date`: date of UAT execution

---

## 5. Stale Detection

A UAT result becomes **stale** when:
1. The source `.skill.md` file's `Skill Version` metadata changes
2. The governance `.gov.md` risk level or authority mapping changes
3. The UAT template itself is updated

Stale UAT → badge automatically changes from `VALIDATED` → `NEEDS_UAT`.

---

## 6. Reporting Rules

- **Domain UAT Coverage** = `(VALIDATED count) / (total skills in domain) × 100%`
- `NOT_RUN` and `NEEDS_UAT` do NOT count as failures
- `FAILED` counts as tested but failed
- Display: "3/8 validated (37.5%) · 4 not run · 1 stale"

---

## 7. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-08 | Initial specification |
