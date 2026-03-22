# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

**Controlled Vibe Framework (CVF)** is a governance-first control plane for AI-assisted software development. It is not a code library — it is a governance framework with executable controls, process standards, and multi-layer architecture (L0–L5). The core workflow is: `INTAKE → DESIGN → BUILD → REVIEW → FREEZE`.

**Current branch:** `cvf-next` (development). **Main branch:** `main` (production).

---

## Commands

### Web UI (`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/`)

```bash
npm run dev           # Dev server at localhost:3000
npm run build         # Production build
npm run lint          # ESLint (max-warnings=0, must be clean)
npm run test          # Unit tests (Vitest, watch mode)
npm run test:run      # Tests once
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E tests
```

### Guard Contract SDK (`EXTENSIONS/CVF_GUARD_CONTRACT/`)

```bash
npm test              # Vitest run
npm run test:watch    # Watch mode
npm run check         # TypeScript type check
```

### Conformance & Automation Scripts (Python, from repo root)

```bash
python scripts/run_cvf_cross_extension_conformance.py
python scripts/run_cvf_conformance_release_gate.py
python scripts/rotate_cvf_conformance_trace.py
```

### Workspace Bootstrap (PowerShell)

```powershell
# Creates a new project sibling workspace (do NOT develop inside CVF root)
powershell -ExecutionPolicy Bypass -File .\scripts\new-cvf-workspace.ps1 `
  -WorkspaceRoot "D:\CVF-Workspace" -ProjectName "My-Project"
```

---

## Architecture

### Layer Model (L0 → L5)

| Layer | Module | Role |
|---|---|---|
| L0 (Foundation) | `CVF_v3.0_CORE_GIT_FOR_AI` | AI Commit, Artifact Staging, Ledger, Process Model |
| L1 (Core) | `v1.0/`, `v1.1/` | Phases, Governance (FROZEN baselines — do not modify) |
| L1.5 (Dev Governance) | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` | Hardened runtime, deterministic orchestration |
| L2 (Tools) | `CVF_ECO_v1.0`–`v1.4` | Validation, NL Policy, LLM Risk Engine, RAG Pipeline |
| L2.5 (Safety Runtime) | `CVF_v1.7`–`v1.9` | Reasoning Gate, Entropy Guard, Mutation Sandbox, Execution Recording |
| L3 (Platform) | `CVF_v1.6_AGENT_PLATFORM` | Web UI (Next.js), Agent Tools, Template Marketplace |
| L4 (Safety UI) | `CVF_v1.7.2` | Risk visualization, Policy simulation, Domain map |
| L5 (Adapter Hub) | `CVF_v1.7.3` | LLM/Runtime/Tool/Memory/Policy contracts |

### Authority Hierarchy

```
ECOSYSTEM/doctrine/          ← L0 Supreme layer (FROZEN — never touch)
    ↓ governs
ECOSYSTEM/operating-model/   ← L3 Operational model for humans
    ↓ governs
governance/ + docs/ + EXTENSIONS/  ← Engineering implementation
    ↓ verified by
tests/ + governance/compat/  ← Conformance verification
    ↓ evidenced in
docs/reviews/ + CHANGELOG    ← Audit trail
```

### Key Directory Purposes

- **`ECOSYSTEM/`** — Meta layer (WHY & WHAT). `doctrine/` is FROZEN supreme governance. `operating-model/` is VOM for human operators.
- **`EXTENSIONS/`** — All 36+ implementation modules. Each versioned module is self-contained with its own tests.
- **`governance/toolkit/05_OPERATION/`** — 34 operational guard files. These are the enforcement contracts.
- **`docs/`** — Engineering documentation hub: `concepts/`, `guides/`, `reference/`, `reviews/`, `roadmaps/`, `baselines/`.
- **`v1.0/`, `v1.1/`** — Frozen baseline layers. **Do not modify.**
- **`scripts/`** — 72 Python/PowerShell automation scripts for conformance, governance, and workspace management.
- **`tools/`** — CLI utilities: skill validation, skill search, security scanning.

### Web UI Stack (`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/`)

- Next.js 16.1.6, React 19.2.3, TypeScript 5, TailwindCSS 4
- Zod 4 for validation, React Hook Form 7
- NextAuth.js 5 (beta) for RBAC (Owner/Admin/Developer/Reviewer/Viewer)
- Vitest for unit tests, Playwright for E2E
- Deployed via Netlify (config: `netlify.toml`)

---

## Governance Controls to Know

**Fast Lane (GC-021):** Low-risk work can bypass full governance with a Fast Lane audit. Check `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md`.

**Continuation Governance (GC-018):** Agent handoff and stopping rules. See `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`.

**Memory Classification (GC-022):** Records are classified as FULL / SUMMARY / POINTER. See `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md`.

**File Size Guard (GC-023):** All governed source, test, frontend, and markdown files have hard line-count thresholds. Policy: `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`. Exception registry: `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json`. **Before adding tests or code to any existing file:** (1) check the current line count, (2) check the exception registry for that file's `approvedMaxLines` and `requiredFollowup`, (3) if adding would exceed the limit, create a dedicated file instead. Run `python governance/compat/check_governed_file_size.py --enforce` before every commit.

**Risk Model:** R0 (Safe) → R3 (Dangerous). All changes are classified before execution.

---

## CI/CD

GitHub Actions (`.github/workflows/`):
- **`cvf-ci.yml`** — Main pipeline: Guard Contract tests (Vitest) + MCP ECO v2.5 tests (71) + Web UI TypeScript check. Requires all-pass gate.
- **`cvf-web-ci.yml`** — Web changes: Python conformance check → Lint → Build → Unit tests → Coverage gate.
- **`cvf-extensions-ci.yml`** — Extensions CI for EXTENSIONS/ changes.

---

## Workspace Isolation Rule

The CVF root is **maintenance-only**. User projects must be created as **sibling directories**, not inside this repo. Use `scripts/new-cvf-workspace.ps1` to bootstrap new projects correctly.

---

## Key Reference Documents

| Purpose | Document |
|---|---|
| New to CVF | `docs/guides/CVF_QUICK_ORIENTATION.md` |
| Getting started (VN + EN) | `docs/GET_STARTED.md` |
| Architectural map | `docs/CVF_CORE_KNOWLEDGE_BASE.md` |
| Current release status | `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md` |
| Module inventory | `docs/reference/CVF_MODULE_INVENTORY.md` |
| Governance control matrix | `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md` |
| Architecture decisions | `docs/CVF_ARCHITECTURE_DECISIONS.md` |
| Cheat sheet | `docs/CHEAT_SHEET.md` |
