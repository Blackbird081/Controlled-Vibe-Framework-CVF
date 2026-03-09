# CVF GUARD REGISTRY GUARD

> **Type:** Governance Guard (Meta-Guard)
> **Effective:** 2026-03-08
> **Status:** Active
> **Applies to:** All humans and all AI agents creating or modifying governance guards
> **Enforced by:** `governance/compat/check_guard_registry.py`

---

## 1. PURPOSE

This is a **meta-guard** — a guard that governs the creation of other guards.

As CVF expands into an ecosystem, new guards will be created for new development streams, new modules, and new governance requirements. Without a registry mechanism, guards may exist in the filesystem but not be discoverable by humans or AI agents reading the README or Knowledge Base.

This guard ensures:

- Every guard is **discoverable** (listed in README.md and CVF_CORE_KNOWLEDGE_BASE.md)
- Every guard is **consistent** (same information across all registration points)
- No guard is **orphaned** (exists on disk but unknown to the rest of the system)

---

## 2. RULE

> **NON-NEGOTIABLE:**
> When a new guard file is created in `governance/toolkit/05_OPERATION/`, the author (human or AI) MUST register it in **ALL** of the following locations before the commit is finalized:

### 2.1 Registration checklist

```
✅ 1. Guard file created in governance/toolkit/05_OPERATION/CVF_*_GUARD.md
✅ 2. Row added to README.md → "Mandatory Guards" table
✅ 3. Row added to docs/CVF_CORE_KNOWLEDGE_BASE.md → "Governance Guards" table
✅ 4. Committed together in the SAME commit batch
```

### 2.2 Applies equally to

- human authors,
- AI agents,
- migration/cleanup work.

---

## 3. REGISTRATION FORMAT

### 3.1 README.md format

Add a row to the `### Mandatory Guards` table:

```markdown
| [Guard Name](governance/toolkit/05_OPERATION/CVF_*_GUARD.md) | Trigger condition | Required action/file |
```

### 3.2 CVF_CORE_KNOWLEDGE_BASE.md format

Add a row to the `### Governance Guards (Mandatory):` table:

```markdown
| Guard Name Guard | Trigger condition | Required action/file |
```

### 3.3 Guard file naming

Guard files MUST follow:

```
CVF_<PURPOSE>_GUARD.md
```

- Prefix: `CVF_`
- Purpose: UPPERCASE_SNAKE_CASE describing what the guard controls
- Suffix: `_GUARD.md`

---

## 4. AUTOMATED ENFORCEMENT

### 4.1 Registry check script

```bash
# Advisory mode — shows status
python governance/compat/check_guard_registry.py

# Strict enforcement — blocks on violation (exit code 2)
python governance/compat/check_guard_registry.py --enforce

# JSON output for CI/CD
python governance/compat/check_guard_registry.py --json
```

### 4.2 What the script checks

The script:

1. Scans `governance/toolkit/05_OPERATION/` for all `*_GUARD.md` files
2. Checks each guard's filename appears in `README.md`
3. Checks each guard's filename appears in `docs/CVF_CORE_KNOWLEDGE_BASE.md`
4. Reports violations for any guard missing from either file

### 4.3 When to run

- After creating any new guard
- After renaming or deleting a guard
- Before committing governance changes
- In CI/CD pipeline (optional)

---

## 5. CURRENT GUARD INVENTORY

As of 2026-03-08, CVF has **14 guards**:

| # | Guard | Since |
|---|---|---|
| 1 | CVF_ADR_GUARD | 2026-03-06 |
| 2 | CVF_ARCHITECTURE_CHECK_GUARD | 2026-03-06 |
| 3 | CVF_BUG_DOCUMENTATION_GUARD | 2026-03-06 |
| 4 | CVF_CONFORMANCE_EXECUTION_PERFORMANCE_GUARD | 2026-03-07 |
| 5 | CVF_CONFORMANCE_TRACE_ROTATION_GUARD | 2026-03-07 |
| 6 | CVF_DEPTH_AUDIT_GUARD | 2026-03-06 |
| 7 | CVF_DOCUMENT_NAMING_GUARD | 2026-03-06 |
| 8 | CVF_DOCUMENT_STORAGE_GUARD | 2026-03-06 |
| 9 | CVF_EXTENSION_VERSIONING_GUARD | 2026-03-08 |
| 10 | CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD | 2026-03-06 |
| 11 | CVF_PYTHON_AUTOMATION_SIZE_GUARD | 2026-03-07 |
| 12 | CVF_TEST_DEPTH_CLASSIFICATION_GUARD | 2026-03-07 |
| 13 | CVF_TEST_DOCUMENTATION_GUARD | 2026-03-06 |
| 14 | CVF_WORKSPACE_ISOLATION_GUARD | 2026-03-06 |

> **Note:** This guard (CVF_GUARD_REGISTRY_GUARD) is #15, making the total 15 guards.

---

## 6. INTERACTION WITH OTHER GUARDS

| Guard | Relationship |
|---|---|
| All other guards | Downstream — this guard governs their registration |
| `CVF_DOCUMENT_NAMING_GUARD` | Complementary — naming convention for the guard file itself |
| `CVF_ADR_GUARD` | Upstream — new guard categories may require ADR |

---

## 7. FINAL CLAUSE

A guard that nobody knows about is a guard that nobody follows.

Registration is not bureaucracy — it is discoverability. If every AI agent and every human contributor can find the complete list of active guards in README.md and CVF_CORE_KNOWLEDGE_BASE.md, governance becomes automatic instead of accidental.
