# CVF Pre-Public Export Surface — Safety Runtime

Memory class: POINTER_RECORD

> Package: `cvf-safety-runtime` v0.1.0
> Directory: `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME`
> exportReadiness: `REVIEW_REQUIRED` (Phase B)
> Date: 2026-04-10

---

## Intended Export Surface (pre-split target)

This package is `REVIEW_REQUIRED`. The intended export surface is **`simulation/` only**:

- `simulation/sandbox.isolation.contract.ts` — `SandboxIsolationContract`, `createSandboxIsolationContract`, and all sandbox types (`SandboxPlatform`, `SandboxStatus`, `ContainmentViolationType`, `SandboxConfig`, `SandboxCommand`, `SandboxResult`, `SandboxExecutor`, `ContainmentViolation`, etc.)

**Nothing else in this package should be published** until the package boundary split is complete.

---

## Current Blockers (why REVIEW_REQUIRED)

1. Package root mixes simulation contracts with UI (`react`, `react-dom`, `next`) and server (`express`) dependencies — publishing the whole package forces heavy consumer burden
2. `Heavy runtime dependencies (express, next, react, react-dom, zod) create consumer burden`
3. `Export surface should be scoped to simulation/ subdirectory only`
4. `Requires package boundary split before publication: separate simulation/ into standalone package`

---

## Path to CANDIDATE

1. Extract `simulation/sandbox.isolation.contract.ts` into a standalone `cvf-sandbox-runtime` package
2. The new package has zero heavy runtime dependencies (only TypeScript types + Node.js `worker_threads`)
3. Re-run Phase B packaging assessment on the new standalone package
4. Original `cvf-safety-runtime` remains internal/private until its dependency model is resolved

---

## Current `npm pack --dry-run` Note

As of 2026-04-10, `npm pack --dry-run` pulls non-publication files including `.env` and `dev.db`. This confirms the current package boundary is not clean for publication. Requires `.npmignore` or `files` field scoping to fix alongside the package split.

---

*Surface document date: 2026-04-10*
*Status: REVIEW_REQUIRED — publication blocked by package boundary issues*
