# CVF Post-MC5 Continuation Strategy Roadmap

Memory class: SUMMARY_RECORD
> Tranche: Strategic Planning (Post-MC5)
> Date: 2026-04-08
> Context: Defines the next strategic tracks after the completion of the MC1-MC5 architecture baseline and W60-T1 remediation.
> Baseline: `v3.7-W46T1` (CLOSURE-ASSESSED); W60-T1 CLOSED DELIVERED.

---

## 1. Objective

To provide a structured continuation path for CVF post-MC5 closure. Since all foundation architectural planes are `DONE-ready` or `DONE`, the next phases focus on operational readiness, infrastructure expansion, and public-release preparation rather than core architectural definition.

## 2. Current State Audit Summary

- **Architecture Health**: `EXCELLENT`. CPF (2929 tests), EPF (1301 tests), GEF (625 tests), LPF (1465 tests) all pass locally. 
- **Product Surface**: `EXCELLENT`. `cvf-web` has 0 TS errors, 1853 passing tests (W60-T1). MCP Server has 71 passing tests. Guard Contract passes all unit tests.
- **CI/CD Coverage**: `GAP IDENTIFIED`. Current CI covers only Guard Contract, MCP Server, and `cvf-web` Typecheck. **77% of foundation tests (8173 tests) are not running in CI.**
- **Pre-Public Readiness**: `IN PROGRESS`. Publication model recommended is `PRIVATE_CORE + PUBLIC_DOCS_MIRROR`. Re-assessment boundary is **2026-05-01**.

## 3. Strategic Tracks

The continuation plan is divided into 5 independent tracks. Each track (except Track 4) must be authorized with a fresh `GC-018` before execution.

### Track 1: CI/CD Expansion ⚡ (IMMEDIATE)
* **Priority**: HIGH
* **Class**: INFRA
* **Scope**: Add 5 new CI jobs to `.github/workflows/cvf-ci.yml`:
  - `test-cpf` (2929 tests)
  - `test-epf` (1301 tests)
  - `test-gef` (625 tests)
  - `test-lpf` (1465 tests)
  - `test-web-ui` (vitest for cvf-web, 1853 tests)
* **Exit Criteria**: All jobs pass on push/PR, achieving ~10,500 tests run in CI automatically.

### Track 2: cvf-web Product Hardening 🛠️ (IMMEDIATE)
* **Priority**: MEDIUM
* **Class**: REMEDIATION / INFRA
* **Scope**: 
  - Add `npm run build` verification to CI to ensure no runtime missing-import failures.
  - Investigate and resolve the `progress tracker sync compatibility` pre-push hook issue that affects branch unifications.
* **Exit Criteria**: Standard pushing no longer requires `--no-verify` for cross-branch sync; `cvf-web` builds successfully in CI.

### Track 3: Pre-Public Packaging 📦 (SHORT-TERM)
* **Priority**: MEDIUM
* **Class**: PACKAGING
* **Scope**: Execute the first wave of `PUBLIC_EXPORT_CANDIDATE` modules.
  - Phase A Targets: `CVF_GUARD_CONTRACT`, `CVF_ECO_v2.5_MCP_SERVER`, `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`.
  - Add `exportReadiness` status, documentation, and boundary definitions.
* **Exit Criteria**: At least 1 module reaches `READY_FOR_EXPORT` state.

### Track 4: Documentation Curation 📚 (SHORT-TERM)
* **Priority**: LOW-MEDIUM
* **Class**: DOCUMENTATION (No GC-018 required)
* **Scope**: 
  - Audit sensitive content in `docs/` (incremental test logs, ADR history).
  - Define the `PUBLIC_DOCS_MIRROR` boundary for future exposure.
  - Refresh `README.md` and `START_HERE.md` to reflect `CLOSURE-ASSESSED` post-MC5 status.

### Track 5: Deferred Architecture 🔮 (FUTURE — post May 2026)
* **Priority**: LOW (Intentionally Deferred)
* **Class**: REALIZATION
* **Scope**: Proceed with deferred targets ONLY if required.
  - Model Gateway (provider routing).
  - Sandbox Runtime (physical isolation).
  - Agent Definition Registry L0-L4 consolidation.

## 4. Execution Sequence Strategy

1. **W61-T1**: Combine **Track 1** and **Track 2** into a single `GC-018` INFRA/REMEDIATION tranche. This immediately protects the codebase against future test drift and stabilizes the build pipeline.
2. **Track 4** documentation curation can run in parallel without strict governance blocking.
3. **W62-T1**: Launch **Track 3** (Pre-Public Packaging) utilizing the stable CI foundation established in W61, making the packaging targets demonstrably green.
4. **W6x+**: Re-assess pending **Track 5** items post `2026-05-01`.

---
*Authorized by: CVF Agent (Strategic Planning)*
*Date: 2026-04-08*
