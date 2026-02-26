# CVF Kernel Architecture — Fix Roadmap (Alignment with CVF Core Logic)

**Date:** 2026-02-25  
**Input baseline:** `docs/CVF_KERNEL_ARCHITECTURE_PRE_FIX_ASSESSMENT_2026-02-25.md`  
**Goal:** Move `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/` from **NO-GO** to integration-ready with current CVF governance/runtime model.

---

## Official Mapping Note (Canonical)

- Canonical module ID: `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture`
- Version binding: CVF `v1.7.1` Safety Runtime submodule (not a standalone extension version)
- Layer mapping: Safety Runtime (`Layer 2.5` in root README stack, equivalent `Layer 3` in positioning stack)
- Core rule: additive hardening only; no mutation of stable core behavior (`v1.0/v1.1/v1.2`)

---

## 1) Scope and Success Criteria

Scope:
- `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/**`

Core preservation principle (mandatory):
- CVF current architecture is the root baseline.
- Kernel work is additive hardening only.
- No change in this roadmap may break or invalidate existing CVF core logic/governance flow.

Out of scope:
- Refactor of existing stable CVF core (`v1.0/v1.1/v1.2`).
- Production rollout before post-fix assessment is PASS.

Definition of Done:
1. Type-check/build pass for module.
2. Safety invariants are hard-enforced (not advisory).
3. Risk taxonomy aligned with CVF (`R0-R4` mapping or native).
4. Tests exist and pass for critical flows.
5. Documentation and treeview match real implementation.
6. Post-fix independent assessment returns GO/Conditional GO.

---

## Progress Snapshot

- Phase 0: Completed (docs baseline + tree split + roadmap alignment)
- Phase 1: Completed (compile blockers resolved, local typecheck gate added)
- Phase 2: Completed (non-bypass orchestrator chain enforced with domain preflight + invariant check)
- Phase 3: Completed (CVF risk-level mapping and policy parity with `cvf-web` baseline validated)
- Phase 4: Completed (expanded behavioral suite passing: 26/26 across 9 test files)
- Phase 5: Completed (target modules implemented and tree/docs synchronized)
- Phase 6: Completed (post-fix re-assessment updated to module-scope GO)
- Phase 7: Completed (mandatory entrypoint + anti-bypass enforcement implemented)
- Phase 8: Completed (versioned refusal policy + golden dataset regression gate added)
- Phase 9: Completed (forensic trace fields + module CI gate + rollout plan baseline documented)

---

## 2) Target vs Implemented (Gap Baseline)

Reference files:
- Target: `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/TREEVIEW_TARGET.md`
- Implemented: `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/TREEVIEW_IMPLEMENTED.md`

| Layer | Target (Design Intent) | Implemented (Current) | Gap Summary |
|---|---|---|---|
| 01 Domain Lock | Domain map/schema + strict upstream lock | Domain map schema + declared/classified preflight lock + hard domain gate | Closed in module scope |
| 02 Contract Runtime | Registry + consumer matrix + transformation guard + validator | Registry + matrix + transformation guard + validator integrated in runtime engine | Closed in module scope |
| 03 Contamination Guard | Assumption tracker + lineage graph + propagation + drift + rollback | All target components implemented and wired in orchestrator risk flow | Closed in module scope |
| 04 Refusal Router | Policy + rewrite + clarification + alternative routing | All target components implemented with CVF-compatible actions | Closed in module scope |
| 05 Creative Control | Controlled permission + provenance tagging | Permission policy + provenance tagger + creative controller integration | Closed in module scope |
| Runtime | Orchestrator with non-bypass chain | End-to-end chain enforced; capability/domain/contract/risk/refusal/creative/ledger wired | Closed in module scope |
| Internal Ledger | Lineage/risk/boundary snapshots for forensic traceability | Ledger + trace reporter telemetry available via `getTelemetry()` | Closed in module scope |

---

## 3) Findings-to-Workstream Mapping

- F1 (compile/runtime broken) -> Workstream A
- F2 (invariants not enforced) -> Workstream B
- F3 (risk model incompatible) -> Workstream C
- F4 (no harness/tests) -> Workstream D
- F5 (docs mismatch) -> Workstream E
- F6 (declared layers not wired) -> Workstream F

---

## 4) Execution Phases

## Phase 0 — Stabilize Baseline and Branch Discipline
Duration: 0.5 day

Tasks:
1. Create dedicated fix branch (example: `fix/cvf-kernel-compat`).
2. Freeze current NO-GO baseline doc (no edits except addenda).
3. Add "work in progress" marker inside folder README.

Exit criteria:
- Baseline remains immutable for comparison.
- All changes are tracked only in fix branch.

---

## Phase 1 — Compile and Naming Normalization (Workstream A)
Duration: 1 day

Tasks:
1. Normalize file naming convention (`dot` vs `underscore`) and import paths.
2. Resolve missing/incorrect exported types:
   - Add/align `DomainDefinition`.
   - Add/align `ContractDefinition` or replace usage by `IOContract`.
3. Align method contracts:
   - Replace missing `enforce(...)` call or implement it consistently.
   - Replace invalid `score(...)` call with supported scorer API.
4. Ensure orchestrator imports resolve cleanly.

Verification command:
```bash
node EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/node_modules/typescript/bin/tsc --noEmit --target ES2020 --module commonjs --skipLibCheck --pretty false "EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/**/*.ts"
```

Exit criteria:
- Zero TypeScript compile errors.

---

## Phase 2 — Enforce Safety Invariants at Runtime (Workstream B + F)
Duration: 1 day

Tasks:
1. Replace passive checks with hard enforcement in orchestrator:
   - Domain violation => throw/block.
   - Contract violation => throw/block.
2. Define a strict execution pipeline:
   - Domain lock -> Contract input -> LLM -> Risk -> Refusal -> Creative control -> Contract output.
3. Wire declared layers that are currently unused:
   - `DomainLockEngine`, `ContractRuntimeEngine`, `RiskGate`/equivalent, `ExecutionGate`, invariant checker, trace reporter.
4. Remove dead paths or mark explicit TODOs with guardrails.

Exit criteria:
- No path can bypass domain + contract + refusal gate.
- Invariant checks executable in integration flow.

---

## Phase 3 — CVF Risk Model Compatibility (Workstream C)
Duration: 0.5-1 day

Tasks:
1. Standardize risk model to CVF-native levels (`R0-R4`) or add deterministic adapter:
   - `low/medium/high/critical` -> `R1/R2/R3/R4` mapping table.
2. Ensure refusal policies and thresholds read CVF-compatible risk levels.
3. Add explicit compatibility note in module docs.

Exit criteria:
- Kernel outputs risk in CVF-compatible format.
- No ambiguity in policy evaluation.

---

## Phase 4 — Test Harness and Quality Gate (Workstream D)
Duration: 1 day

Tasks:
1. Add module-local `package.json` and `tsconfig.json`.
2. Add minimum critical tests:
   - Domain required and unknown domain blocked.
   - Contract input/output violation blocked.
   - High/critical risk triggers refusal.
   - Creative mode default OFF.
   - No-bypass orchestrator integration test.
3. Add test command documentation in module README.

Minimum target:
- 1 integration test + unit tests for each kernel layer.

Exit criteria:
- `npm run test:run` (module-local) PASS.
- Type-check + tests reproducible by another contributor.

---

## Phase 5 — Documentation Sync (Workstream E)
Duration: 0.5 day

Tasks:
1. Update `TREEVIEW.md` to match real files.
2. Update README examples and flow diagrams based on actual code.
3. Document:
   - invariants,
   - risk mapping,
   - refusal behavior,
   - extension points.

Exit criteria:
- No doc/file mismatch in architecture tree and referenced module names.

---

## Phase 6 — Independent Re-Assessment and Integration Decision
Duration: 0.5 day

Tasks:
1. Run independent review again against pre-fix baseline.
2. Create:
   - `docs/CVF_KERNEL_ARCHITECTURE_POST_FIX_ASSESSMENT_YYYY-MM-DD.md`
3. Log results in:
   - `docs/CVF_INCREMENTAL_TEST_LOG.md`
4. Decide status:
   - GO / Conditional GO / NO-GO.

Exit criteria:
- Post-fix assessment signed with explicit gate decision.

---

## 4.1) Advanced Roadmap (Implementation Record)

Purpose:
- Capture post-fix hardening direction before implementation starts.
- Keep team aligned on what "production-grade kernel" means beyond module-scope GO.

Status:
- Implemented (initial production-hardening baseline completed on 2026-02-25).

## Phase 7 — Enforcement Plane Integration
Duration: 1-2 days

Tasks:
1. Define mandatory kernel entrypoint for runtime execution.
2. Block direct LLM call paths that bypass kernel chain.
3. Add integration tests proving all AI execution routes pass through kernel.

Exit criteria:
- 100% runtime AI routes are enforced via kernel entrypoint.

## Phase 8 — Policy Versioning + Calibration
Duration: 2-3 days

Tasks:
1. Version refusal/risk policy as data (`policy.v1`, `policy.v2`) with compatibility rules.
2. Build golden evaluation dataset (safe/borderline/unsafe cases + expected decision).
3. Add regression gate for decision parity across policy updates.

Exit criteria:
- Policy update process is data-driven and regression-protected.

## Phase 9 — Forensic + CI + Rollout Hardening
Duration: 2-3 days

Tasks:
1. Extend ledger schema (`request_id`, `policy_version`, `decision_code`, `trace_hash`).
2. Add kernel CI gates (typecheck, tests, coverage floor).
3. Plan shadow-mode and canary rollout for integration activation.

Exit criteria:
- Kernel has audit-grade traceability and controlled rollout path.

Implementation notes (completed):
1. Forensic fields added to ledger records: `requestId`, `policyVersion`, `decisionCode`, `traceHash`.
2. Module CI gate scripts added: `ci:gate`, `test:golden`, `test:coverage`.
3. Coverage standard enforced:
   - global minimum `>= 80%` (statements/branches/functions/lines)
   - core branch files `>= 90%` (statements/branches/functions/lines)
   - enforced by `vitest.config.mjs` thresholds.
4. Rollout plan documented at:
   - `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/ROLLOUT_PLAN.md`

---

## 5) Priority Order (Must-Do First)

1. Phase 1 (compile consistency)
2. Phase 2 (hard safety enforcement)
3. Phase 3 (risk compatibility)
4. Phase 4 (tests/harness)
5. Phase 5 (docs sync)
6. Phase 6 (independent gate)

---

## 6) Suggested Milestone Plan

- M1 (Day 1): Compile clean (Phase 1 done)
- M2 (Day 2): Invariants hard-enforced and wired (Phase 2 done)
- M3 (Day 3): Risk compatibility + tests pass (Phase 3 + 4 done)
- M4 (Day 4): Docs sync + post-fix assessment (Phase 5 + 6 done)

---

## 7) Operational Rule

No GitHub publish for this module until:
1. Pre-fix findings F1-F4 are closed.
2. Post-fix assessment exists and returns module-scope GO (or explicit owner waiver).
3. Incremental test log has explicit tested/untested scope and commands.
