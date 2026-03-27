---
description: Run CVF governed file size check before committing a tranche
---

## Pre-Commit Governance Size Check

Run this workflow **before** every `git commit` to catch file size violations early.

### Step 1: Run the advisory (non-blocking) check

```bash
python governance/compat/check_governed_file_size.py
```

Review advisories. If any file is close to its hard limit and will grow in this tranche, plan a split or register an exception **now**, not after commit fails.

### Step 2: Run the strict (blocking) check

```bash
python governance/compat/check_governed_file_size.py --enforce
```

If this exits 0 → proceed to commit.  
If this exits non-zero → fix violations first (see Step 3).

### Step 3: Fix a violation

**Option A — Split the file** (preferred):
- Extract tranche-local exports into a domain barrel: e.g. `boardroom.exports.ts`, `context.exports.ts`
- Update imports accordingly

**Option B — Register an exception** (for barrel/legacy files):
- Add an entry to `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json`
- Fill in: `path`, `fileClass`, `approvedMaxLines`, `status: "ACTIVE_EXCEPTION"`, `rationale`, `requiredFollowup`
- Re-run Step 2 to confirm pass

### Step 4: Commit

```bash
git add -A
git commit -F .git_commit_msg.txt
```

> ⚠️ Always write the commit message to a file first (`write_to_file` → `.git_commit_msg.txt`) and use `git commit -F` to avoid PowerShell multi-line string issues.
