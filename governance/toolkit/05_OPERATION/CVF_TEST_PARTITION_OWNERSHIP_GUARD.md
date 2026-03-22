# CVF TEST PARTITION OWNERSHIP GUARD

> **Control ID:** `GC-024`  
> **Type:** Governance Guard  
> **Effective:** 2026-03-23  
> **Status:** Active  
> **Applies to:** governed test partition ownership where CVF has already split a large test surface into canonical sub-files  
> **Enforced by:** `governance/compat/check_test_partition_ownership.py`

---

## 1. PURPOSE

When CVF extracts tranche-local or subsystem-local tests out of an oversized test file,
that split must stay durable.

Without an explicit ownership guard, future batches can silently append new tests
back into the old monolithic file and erase the maintainability gain.

This guard prevents that regression.

---

## 2. CANONICAL MODEL

For each governed split covered by this guard:

- one canonical destination file owns the extracted test surface,
- one or more legacy files are explicitly forbidden from reintroducing that surface,
- ownership is stored in a registry so enforcement stays machine-readable.

---

## 3. CURRENT ACTIVE OWNERSHIP

At the active baseline, the first enforced partition is:

- scope: `CPF Context Builder`
- canonical file:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/context.builder.test.ts`
- forbidden legacy file:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts`

Forbidden symbols in the legacy file include:

- `ContextBuildContract`
- `createContextBuildContract`
- `ContextBuildBatchContract`
- `createContextBuildBatchContract`

---

## 4. REQUIRED WORKFLOW

When a test surface is intentionally split:

1. mark the canonical file as the owner,
2. mark the old file as forbidden for that surface,
3. register the partition in:
   - `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
4. run:
   - `python governance/compat/check_test_partition_ownership.py --enforce`

---

## 5. VIOLATION CONDITIONS

Violations include:

- reintroducing owned symbols into a forbidden legacy file,
- missing canonical file,
- incomplete ownership registry entry.

---

## 6. FINAL CLAUSE

Splitting a large test file is not complete until the split becomes durable.

CVF therefore treats canonical test ownership as a governed boundary, not a suggestion.
