# CVF New Machine Setup Checklist

Memory class: POINTER_RECORD

> Purpose: shortest reliable checklist for moving CVF work to a new machine without reinstalling the whole extension stack up front
> Recommended posture: clone first, install per extension only when needed

---

## 1. Base Tools

Install these first:

- `Git`
- `Node.js` LTS
- `npm`
- `Python 3`
- `PowerShell`

Do not copy `node_modules/` from another machine.

---

## 2. Clone The Repository

```powershell
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF
git checkout main
```

If you need a different branch:

```powershell
git checkout cvf-next
```

Or:

```powershell
git checkout <your-branch>
```

---

## 3. Default Rule For `EXTENSIONS/`

Do **not** install dependencies for every extension up front.

Use this rule instead:

- clone the whole repo
- open the exact extension you need to work on
- if that extension already has `package-lock.json`, run `npm ci`
- otherwise run `npm install`
- if you switch to another extension later, install that one then

This keeps setup lighter, faster, and less fragile.

Install decision rule:

- `npm ci` is preferred when the package already has a committed `package-lock.json`
- `npm install` is the fallback when a package does not ship a lockfile
- the 4 foundation packages now ship lockfiles, so fresh clones can use `npm ci` there immediately

---

## 4. Recommended Install Strategy

### Option A — Agent or user is working on one extension

Go into that extension and install only there:

```powershell
cd EXTENSIONS/<target-extension>
npm ci   # if package-lock.json exists
# or: npm install   # if that package has no lockfile
```

Then run the package commands you need, usually:

```powershell
npm run check
npm run test
```

### Option B — Running the Web UI

```powershell
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci
npm run dev
```

Then open `http://localhost:3000`.

---

## 5. Examples

### Control Plane Foundation

```powershell
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION
npm ci
npm run check
npm run test
```

### Execution Plane Foundation

```powershell
cd EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION
npm ci
npm run check
npm run test
```

### Governance Expansion Foundation

```powershell
cd EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION
npm ci
npm run check
npm run test
```

### Learning Plane Foundation

```powershell
cd EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION
npm ci
npm run check
npm run test
```

---

## 6. Agent Rule On A New Machine

Agents should follow this default behavior:

- do not install the whole repo up front
- do not install every package in `EXTENSIONS/` preemptively
- install dependencies only for the package they are actively touching
- if the touched package has `package-lock.json`, run `npm ci`
- if the touched package has no lockfile, run `npm install`

This is the preferred default for CVF.

---

## 7. When Full Preinstall Is Reasonable

A broader install is only reasonable when:

- you are doing cross-extension test work
- you are validating multiple packages in one batch
- you intentionally need several UIs/runtimes at once

Even then, install package-by-package, not by copying old `node_modules/`.

### Convenience Script

If you need all 4 foundations installed at once:

```powershell
.\scripts\bootstrap_foundations.ps1
```

Or in shell environments:

```bash
./scripts/bootstrap_foundations.sh
```

These scripts use `npm ci` when a package lockfile already exists, otherwise `npm install`. The canonical install policy (per-extension) remains unchanged.

---

## 8. What Must Be Pushed Before Switching Machines

GitHub only contains committed and pushed changes.

Before moving to another machine:

- `git status`
- commit the work you want to keep
- push the branch you want to continue from

Uncommitted local files will not appear on the new machine after clone.

---

## 9. Quick Start Summary

```powershell
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF
git checkout main
cd EXTENSIONS/<target-extension>
npm ci   # if package-lock.json exists
```

Then run only the commands needed for that package.

---

## 10. Canonical Pointers

- `README.md`
- `START_HERE.md`
- `AGENT_HANDOFF.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
- `docs/roadmaps/CVF_MASTER_ARCHITECTURE_CLOSURE_ROADMAP_2026-04-05.md`
