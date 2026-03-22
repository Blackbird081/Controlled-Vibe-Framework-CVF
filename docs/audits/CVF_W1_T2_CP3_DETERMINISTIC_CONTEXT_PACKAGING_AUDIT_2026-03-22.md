# CVF W1-T2 CP3 Deterministic Context Packaging — GC-019 Structural Change Audit

> Date: `2026-03-22`
> Tranche: `W1-T2 — Usable Intake Slice`
> Control point: `CP3 — Deterministic Context Packaging`
> Authorization chain:
>
> - `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T2_2026-03-22.md`
> - `docs/roadmaps/CVF_W1_T2_USABLE_INTAKE_SLICE_EXECUTION_PLAN_2026-03-22.md`
> - `docs/reviews/CVF_WHITEPAPER_SCOPE_CLARIFICATION_PACKET_2026-03-22.md`

---

## 1. Proposal Summary

Extract the deterministic context packaging logic currently inline in `intake.contract.ts` into a standalone `PackagingContract` that:

- makes packaging independently callable without committing to full intake
- integrates with `ContextFreezer` for proper snapshot freeze and drift detection
- provides a governed, testable surface for token budgeting, chunk selection, and deterministic hashing
- serves as the shared packaging path for both `ControlPlaneIntakeContract` and `KnowledgeFacade`

## 2. Problem

The current `packageIntakeContext()` function:

1. lives as a module-level function in `intake.contract.ts` — tightly coupled to the intake contract file
2. does not integrate with `ContextFreezer` from `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` despite the shell having a `context: ContextFreezer` dependency
3. is not independently instantiable as a governed contract with its own lifecycle
4. helper functions `serializeChunks`, `sortValue`, and `estimateTokenCount` are private to the intake file
5. `KnowledgeFacade.packageContext()` delegates to `packageIntakeContext()` but cannot control freezer integration

## 3. Proposed Solution

Change class: `additive runtime integration`

Create `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/packaging.contract.ts`:

- `PackagingContract` class with a `package()` method
- accepts `PackagingRequest` (chunks, tokenBudget, optional executionId for freeze)
- returns `PackagingResultSurface` with selected chunks, token stats, truncation flag, snapshot hash, and optional freeze receipt
- extracts and exports shared helpers: `estimateTokenCount`, `serializeChunks`, `sortValue`
- optionally integrates with `ContextFreezer` when an executionId is provided

Refactor consumers:

- `intake.contract.ts` → delegates to `PackagingContract.package()` instead of inline `packageIntakeContext()`
- `knowledge.facade.ts` → delegates `packageContext()` to the new contract
- preserve `packageIntakeContext()` as a thin backward-compatible wrapper

## 4. Scope Boundary

### In scope

- extract packaging logic into a standalone governed contract
- integrate optional `ContextFreezer` snapshot support
- export shared serialization helpers
- add dedicated packaging contract tests
- maintain backward compatibility for `packageIntakeContext()` callers

### Out of scope

- new tokenizer or embedding-aware token counting (keep current `content.length / 4` estimate)
- streaming or chunked packaging
- cross-session freeze persistence
- physical merge of source modules
- full `Context Builder & Packager` whitepaper target-state completion

## 5. Module Profiles

### Primary target

| Module | Role | Change type |
|---|---|---|
| `CVF_CONTROL_PLANE_FOUNDATION` | hosts the new packaging contract | additive + refactor |

### Delegation source

| Module | Role | Change type |
|---|---|---|
| `CVF_PLANE_FACADES` (knowledge facade) | consumer of packaging contract | delegation update |

### Upstream dependency

| Module | Role | Change type |
|---|---|---|
| `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` | provides `ContextFreezer` and `computeDeterministicHash` | no change (consumed only) |

## 6. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| regression in intake contract output shape | medium | existing CP1 test + new CP3 tests verify identical output |
| `ContextFreezer` integration changes hash determinism | low | freeze is optional; snapshot hash formula stays identical for non-freeze path |
| backward compatibility break for `packageIntakeContext()` | low | preserve it as a thin wrapper delegating to the new contract |
| scope creep into tokenizer or streaming | low | explicitly out of scope in this audit |

## 7. Verification Plan

- `npm run check` in `CVF_CONTROL_PLANE_FOUNDATION` — type-correct
- `npm run test` in `CVF_CONTROL_PLANE_FOUNDATION` — all existing + new CP3 tests pass
- `npm run test` in `CVF_PLANE_FACADES` — no regressions
- coverage: maintain or improve current levels
- source-line regression: intent-validation, rag-pipeline, deterministic-reproducibility — all pass
- governance gates: docs-compat, baseline-update, release-manifest — all pass

## 8. Rollback Plan

If CP3 introduces regressions:

1. revert the `packaging.contract.ts` file
2. restore inline `packageIntakeContext()` with original helpers
3. revert barrel export changes
4. no upstream module changes needed (dependency direction is one-way)

## 9. Approval Request

This audit requests approval to proceed with CP3 implementation as an `additive runtime integration` inside the approved `W1-T2` tranche boundary.
