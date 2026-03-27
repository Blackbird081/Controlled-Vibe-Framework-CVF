---
description: Run CVF governed file size check before committing a tranche
---

## Pre-Commit Governance Size Check

Run this workflow **before** every `git commit`.
The repo-managed git pre-commit hook (`.githooks/pre-commit`) now runs the guard chain automatically once `core.hooksPath` is pointed at `.githooks` — this workflow is for early detection before staging.

### Step 1: File size advisory

```bash
python governance/compat/check_governed_file_size.py
```

Review advisories. If any file is close to its hard limit and will grow in this tranche, plan a split **now**.

### Step 2: File size strict (blocking)

```bash
python governance/compat/check_governed_file_size.py --enforce
```

If exits non-zero → see Fix section below.

### Step 3: Exception registry integrity (NEW — mandatory)

```bash
python governance/compat/check_governed_exception_registry.py --enforce
```

This guard catches **unauthorized modifications** to the exception registry:
- `approvedMaxLines` bumped beyond `maxApprovableLines` ceiling → **BLOCKED**
- `approvedMaxLines` bumped > `maxAllowedBumpPercent` above hard threshold → **BLOCKED**
- existing `approvedMaxLines` changed from `HEAD` → **BLOCKED**
- new exception entry added in the normal commit path → **BLOCKED**
- Missing required fields, duplicate paths, invalid status → **BLOCKED**

If exits non-zero → the registry was modified incorrectly. See Fix section.

### Fix a file size violation

**Option A — Split the file** (always preferred):
- Extract domain-specific exports into a dedicated barrel (e.g. `context.exports.ts`, `boardroom.exports.ts`)
- Update imports/re-exports in `index.ts`
- Re-run Steps 2 + 3

**Option B — Register a new exception** (only for genuinely unresolvable legacy debt):
- Add an entry to `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json`
- Required fields: `path`, `fileClass`, `approvedMaxLines`, `status: "ACTIVE_EXCEPTION"`, `rationale`, `requiredFollowup`
- `approvedMaxLines` MUST stay within `maxApprovableLines` ceiling AND within `maxAllowedBumpPercent` of `hardThresholdLines`
- Run Step 3 to confirm the registry is internally consistent
- If Step 3 blocks because the entry is new or `approvedMaxLines` changed from `HEAD` → stop. Exception creation/bump now requires explicit human review and a deliberate override path; agents must not self-authorize it.

> ⚠️ **Do NOT bump `approvedMaxLines` as a quick fix for a growing file.** Existing exception caps are frozen in the normal pre-commit path, and the guard will reject self-authorized bumps automatically.

### Step 4: Commit

```bash
git add -A
git commit -F .git_commit_msg.txt
```

> The pre-commit hook (`.githooks/pre-commit`, installed via `scripts/install-cvf-git-hooks.ps1`) now runs the hook chain automatically. A commit will be blocked if either GC-023 guard fails.

> ⚠️ Always write the commit message to `.git_commit_msg.txt` and use `git commit -F` to avoid PowerShell multi-line string issues.
