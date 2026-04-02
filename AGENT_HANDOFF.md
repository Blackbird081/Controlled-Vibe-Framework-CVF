# CVF Agent Handoff — 2026-04-03

> Branch: `restructuring/p3-cp2-retained-internal-root-relocation`
> Last push: `P4/CP10 shortlist wave consolidation delivered on isolated restructuring branch/worktree`
> Remote tracking branch: `origin/restructuring/p3-cp2-retained-internal-root-relocation`
> Exact remote SHA must be derived live from git when needed; do not hand-maintain it in handoff
> State: **P4 DOCUMENTATION COMPLETION DELIVERED ON ISOLATED BRANCH** — retained/internal root relocation is complete; `P3/CP3` and `P3/CP4` remain `HOLD`; `P3/CP5` strategy pivot is active; `P4/CP1-CP12` chain is delivered; all P4/CP11 documentation gaps closed; all three first-wave shortlist candidates remain `NEEDS_PACKAGING`; next safe packet is a second readiness re-assessment (P4/CP13)
> Architecture baseline snapshot: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (`v3.6-W32T1`)

---

## Current State

- External agent memory files: non-canonical convenience only; resume from repo truth first
- This handoff is for the isolated restructuring lane, not for canonical tranche execution on `cvf-next`
- Execution workspace for this lane: `D:/UNG DUNG AI/TOOL AI 2026/Controlled-Vibe-Framework-CVF-P3-CP2`
- Current branch state at handoff time: clean working tree on `restructuring/p3-cp2-retained-internal-root-relocation`, tracking `origin/restructuring/p3-cp2-retained-internal-root-relocation`
- Last delivered commit on this lane before agent transfer: `8bf05fc5` (`docs(P4/CP10): consolidate shortlist wave status - Full Lane`)

### Agent Transfer Briefing

- Resume from this worktree and this branch; do not continue pre-public restructuring work from the root `cvf-next` workspace
- Read in this order before acting:
  - `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
  - `docs/INDEX.md`
  - `docs/reference/CVF_PREPUBLIC_SHORTLIST_WAVE_STATUS_2026-04-03.md`
  - `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
  - `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- Repo truth after `P4/CP10`:
  - `P3/CP2` is the only delivered physical relocation wave
  - `v1.0/` and `v1.1/` remain visible frozen foundation anchors
  - first-wave shortlist implementation is complete for `CVF_v3.0_CORE_GIT_FOR_AI`, `CVF_GUARD_CONTRACT`, and `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
  - all three shortlisted candidates still remain `exportReadiness: NEEDS_PACKAGING`
- Default next lane:
  - prepare a bounded `P4/CP11` readiness re-assessment packet for the first-wave shortlist
  - reassess readiness only; do not assume any candidate will be uplifted
- Hard stop boundaries for the next agent:
  - no package publication
  - no public docs mirror execution
  - no new physical `P3` relocation
  - no landing-path override back onto `cvf-next`
  - no `READY_FOR_EXPORT` change unless a new bounded packet explicitly proves and records it

### Test Counts (last verified clean)
- CPF (Control Plane Foundation): **2561 tests, 0 failures**
- EPF (Execution Plane Foundation): **1123 tests, 0 failures**
- GEF (Governance Expansion Foundation): **625 tests, 0 failures**
- LPF (Learning Plane Foundation): **1465 tests, 0 failures**

### Last Tranches Closed

| Tranche | Description | Status |
|---------|-------------|--------|
| W32-T1 | Boardroom Multi-Round Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — BoardroomMultiRoundBatchContract canonical; CPF 2691 tests (+37); W1-T6 CP2 boardroom multi-round batch surface closed |
| W31-T1 | Boardroom Round Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — BoardroomRoundBatchContract canonical; CPF 2654 tests (+39); W1-T6 CP1 boardroom round batch surface closed |
| W30-T1 | Boardroom Transition Gate Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — BoardroomTransitionGateBatchContract canonical; CPF 2615 tests (+40); GC-028 batch surface closed |
| W29-T1 | Boardroom Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — BoardroomBatchContract canonical; CPF 2575 tests (+37); BoardroomContract.review() batch surface closed |
| W28-T1 | Reverse Prompting Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — ReversePromptingBatchContract canonical; CPF 2538 tests (+31) |
| W27-T1 | Design Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — DesignBatchContract canonical; CPF 2507 tests (+34) |
| W26-T1 | Orchestration Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — OrchestrationBatchContract canonical; CPF 2473 tests (+33) |
| W25-T1 | Route Match Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — RouteMatchBatchContract canonical; CPF 2440 tests (+27) |
| W24-T1 | Gateway PII Detection Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — GatewayPIIDetectionBatchContract canonical; CPF 2413 tests (+28) |
| W23-T1 | AI Gateway Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — AIGatewayBatchContract canonical; CPF 2385 tests (+28) |
| W22-T1 | Gateway Auth Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — GatewayAuthBatchContract canonical; CPF 2357 tests (+27) |

### Architecture Baseline

- Whitepaper: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (`v3.6-W32T1`)
- Posture: `SUBSTANTIALLY DELIVERED`
- All four planes: `SUBSTANTIALLY DELIVERED`; W7 Governance Integration: `DONE`; post-W7 continuation: `DONE`
- Continuation readout: `W1-T30 / W2-T38 / W3-T18 / W4-T25 / W6-T6 / W7-T10 / W8-T1 / W8-T2 / W9-T1 / W10-T1 / W12-T1 / W13-T1 / W14-T1 / W15-T1 / W16-T1 / W17-T1 / W18-T1 / W19-T1 / W20-T1 / W21-T1 / W22-T1 / W23-T1 / W24-T1 / W25-T1 / W26-T1 / W27-T1 / W28-T1 / W29-T1 / W30-T1 / W31-T1 / W32-T1`
- Documentation-to-implementation gap: CLOSED (`v3.6-W32T1`)

---

## Immediate Next Action Required

**`P4/CP12` is delivered. This worktree is now positioned for `P4/CP13`, not for a fresh whitepaper tranche.**

Current guidance:

- **Next preferred packet**: bounded `P4/CP13` second readiness re-assessment for the first-wave shortlist
- **Primary question for `P4/CP13`**: with documentation gaps closed and `better-sqlite3` reclassified, does any candidate now have sufficient evidence to move beyond `NEEDS_PACKAGING`?
- **Minimum read set before drafting `P4/CP13`**:
  - `docs/baselines/CVF_P4_CP12_SHORTLIST_DOCUMENTATION_COMPLETION_DELTA_2026-04-03.md` (closed gap inventory)
  - `docs/audits/CVF_P4_CP11_SHORTLIST_READINESS_REASSESSMENT_AUDIT_2026-04-03.md` (original gap findings)
  - `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/README.md` (updated)
  - `EXTENSIONS/CVF_GUARD_CONTRACT/README.md` (updated)
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/README.md` (updated)
- **Default posture for `P4/CP13`**: conservative re-assessment; if uplift evidence is still ambiguous after documentation improvements, keep `NEEDS_PACKAGING`
- **Required output shape for `P4/CP13`**:
  - one bounded audit
  - one bounded review
  - one delta
  - canon sync in `AGENT_HANDOFF.md`, `docs/INDEX.md`, roadmap, and phase registry
- **Required verification before push**:
  - targeted governance guards relevant to changed files
  - full `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
- **If switching back to tranche work instead of pre-public work**: leave this worktree untouched and resume from the canonical `cvf-next` workspace separately
- **Before any fresh GC-018 on CPF**: read `docs/reference/CVF_MAINTAINABILITY_STANDARD.md` and preserve the maintainability perimeter adopted in `GC-033` through `GC-036`
- **Before any future pre-public `P3` relocation discussion**: read `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`, `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`, `docs/reviews/CVF_MULTI_AGENT_REBUTTAL_PREPUBLIC_RESTRUCTURING_2026-04-02.md`, and `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_PREPUBLIC_RESTRUCTURING_2026-04-02.md`; `P3` remains blocked until a fresh `GC-019` packet is approved and `GC-039` passes for the proposed move set
- **Before any future physical `P3` relocation execution**: create and use a dedicated branch matching `restructuring/p3-*`; do not execute relocation directly on `cvf-next`
- **For any future physical `P3` relocation execution**: use a secondary git worktree for that branch so structural changes remain isolated from the canonical workspace
- **P3 execution posture is slow-and-safe, not speed-first**: do not optimize for large move count per wave; optimize for rollback clarity, path-traceability, and low blast radius
- **For any future physical `P3` relocation wave**: prefer smaller bounded move sets, keep migration notes explicit, and stop immediately if runtime paths, docs canon, registries, or packaging assumptions become ambiguous
- **Default P3 decision rule**: if there is a tradeoff between moving faster and preserving recovery/traceability, choose recovery/traceability
- **P3/CP1 completed**: `CVF Edit/`, `CVF_Important/`, and `CVF_Restructure/` were retired from the visible repo root through `docs/audits/CVF_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_AUDIT_2026-04-02.md` and `docs/reviews/CVF_GC019_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_REVIEW_2026-04-02.md`; if local recovery copies are retained they must live only under `.private_reference/legacy/`
- **P3/CP2 completed on isolated restructuring branch/worktree**: `CVF_SKILL_LIBRARY/` and `ui_governance_engine/` were relocated from the visible repo root into `ECOSYSTEM/reference-roots/retained-internal/` through `docs/audits/CVF_P3_CP2_RETAINED_INTERNAL_ROOT_RELOCATION_AUDIT_2026-04-02.md`, `docs/reviews/CVF_GC019_P3_CP2_RETAINED_INTERNAL_ROOT_RELOCATION_REVIEW_2026-04-02.md`, and `docs/baselines/CVF_P3_CP2_RETAINED_INTERNAL_ROOT_RELOCATION_DELTA_2026-04-02.md`
- **P3/CP3 re-assessment concluded `HOLD`**: `docs/audits/CVF_P3_CP3_FROZEN_REFERENCE_REASSESSMENT_AUDIT_2026-04-02.md`, `docs/reviews/CVF_GC019_P3_CP3_FROZEN_REFERENCE_REASSESSMENT_REVIEW_2026-04-02.md`, and `docs/baselines/CVF_P3_CP3_FROZEN_REFERENCE_REASSESSMENT_DELTA_2026-04-02.md` confirm that no next physical wave is currently approved
- **P3/CP4 re-assessment concluded `HOLD`**: `docs/audits/CVF_P3_CP4_CANONICAL_LANDING_PATH_REASSESSMENT_AUDIT_2026-04-02.md`, `docs/reviews/CVF_GC019_P3_CP4_CANONICAL_LANDING_PATH_REASSESSMENT_REVIEW_2026-04-02.md`, and `docs/baselines/CVF_P3_CP4_CANONICAL_LANDING_PATH_REASSESSMENT_DELTA_2026-04-02.md` record that current governance defines isolated execution but not a resolved landing path back to `cvf-next`
- **P3/CP5 strategy pivot approved**: `docs/audits/CVF_P3_CP5_FOUNDATION_ANCHOR_PRESERVATION_AUDIT_2026-04-02.md`, `docs/reviews/CVF_GC019_P3_CP5_FOUNDATION_ANCHOR_PRESERVATION_REVIEW_2026-04-02.md`, and `docs/baselines/CVF_P3_CP5_FOUNDATION_ANCHOR_PRESERVATION_DELTA_2026-04-02.md` preserve `v1.0/` and `v1.1/` as visible frozen foundation anchors and redirect future reduction work toward `P4` navigation/packaging/docs curation
- **P4/CP1 planning lane approved**: `docs/audits/CVF_P4_CP1_CURATED_FRONT_DOOR_PLANNING_AUDIT_2026-04-02.md`, `docs/reviews/CVF_GC019_P4_CP1_CURATED_FRONT_DOOR_PLANNING_REVIEW_2026-04-02.md`, and `docs/baselines/CVF_P4_CP1_CURATED_FRONT_DOOR_PLANNING_DELTA_2026-04-02.md` open `P4` as planning-only work for curated navigation, docs-mirror boundaries, export-boundary definition, and explicit private-core-visible foundation-anchor policy
- **P4/CP2 docs-mirror boundary approved**: `docs/audits/CVF_P4_CP2_DOCS_MIRROR_BOUNDARY_DEFINITION_AUDIT_2026-04-02.md`, `docs/reviews/CVF_GC019_P4_CP2_DOCS_MIRROR_BOUNDARY_DEFINITION_REVIEW_2026-04-02.md`, `docs/baselines/CVF_P4_CP2_DOCS_MIRROR_BOUNDARY_DEFINITION_DELTA_2026-04-02.md`, and `docs/reference/CVF_PREPUBLIC_DOCS_MIRROR_BOUNDARY_2026-04-02.md` define that any future public docs mirror is a curated subset, not a wholesale copy of `docs/`
- **P4/CP3 export shortlist approved**: `docs/audits/CVF_P4_CP3_EXPORT_SHORTLIST_DEFINITION_AUDIT_2026-04-02.md`, `docs/reviews/CVF_GC019_P4_CP3_EXPORT_SHORTLIST_DEFINITION_REVIEW_2026-04-02.md`, `docs/baselines/CVF_P4_CP3_EXPORT_SHORTLIST_DEFINITION_DELTA_2026-04-02.md`, and `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md` prioritize `CVF_GUARD_CONTRACT`, `CVF_v3.0_CORE_GIT_FOR_AI`, and `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` as the first bounded export-planning wave
- **P4/CP4 shortlist packaging boundary approved**: `docs/audits/CVF_P4_CP4_SHORTLIST_PACKAGING_BOUNDARY_DEFINITION_AUDIT_2026-04-02.md`, `docs/reviews/CVF_GC019_P4_CP4_SHORTLIST_PACKAGING_BOUNDARY_DEFINITION_REVIEW_2026-04-02.md`, `docs/baselines/CVF_P4_CP4_SHORTLIST_PACKAGING_BOUNDARY_DEFINITION_DELTA_2026-04-02.md`, and `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md` define the first candidate-scoped packaging boundary for that shortlist while preserving `NEEDS_PACKAGING`
- **P4/CP5 curated front-door navigation approved**: `docs/audits/CVF_P4_CP5_CURATED_FRONT_DOOR_NAVIGATION_DEFINITION_AUDIT_2026-04-02.md`, `docs/reviews/CVF_GC019_P4_CP5_CURATED_FRONT_DOOR_NAVIGATION_DEFINITION_REVIEW_2026-04-02.md`, `docs/baselines/CVF_P4_CP5_CURATED_FRONT_DOOR_NAVIGATION_DEFINITION_DELTA_2026-04-02.md`, and `docs/reference/CVF_PREPUBLIC_CURATED_FRONT_DOOR_NAVIGATION_2026-04-02.md` define the current ring-based entry flow for root front-door files, guided docs paths, and private-core depth surfaces
- **P4/CP6 root front-door content sync approved**: `docs/audits/CVF_P4_CP6_ROOT_FRONT_DOOR_CONTENT_SYNC_AUDIT_2026-04-03.md`, `docs/reviews/CVF_GC019_P4_CP6_ROOT_FRONT_DOOR_CONTENT_SYNC_REVIEW_2026-04-03.md`, and `docs/baselines/CVF_P4_CP6_ROOT_FRONT_DOOR_CONTENT_SYNC_DELTA_2026-04-03.md` synchronize `README.md`, `START_HERE.md`, and `ARCHITECTURE.md` to the current curated front-door navigation map without widening public posture
- **P4/CP7 core-git export boundary implementation approved**: `docs/audits/CVF_P4_CP7_CORE_GIT_EXPORT_BOUNDARY_IMPLEMENTATION_AUDIT_2026-04-03.md`, `docs/reviews/CVF_GC019_P4_CP7_CORE_GIT_EXPORT_BOUNDARY_IMPLEMENTATION_REVIEW_2026-04-03.md`, `docs/baselines/CVF_P4_CP7_CORE_GIT_EXPORT_BOUNDARY_IMPLEMENTATION_DELTA_2026-04-03.md`, and `docs/reference/CVF_PREPUBLIC_CORE_GIT_EXPORT_SURFACE_2026-04-03.md` formalize `CVF_v3.0_CORE_GIT_FOR_AI` as a root-barrel-first package surface while preserving `exportReadiness: NEEDS_PACKAGING`
- **P4/CP8 guard-contract export boundary tightening approved**: `docs/audits/CVF_P4_CP8_GUARD_CONTRACT_EXPORT_BOUNDARY_TIGHTENING_AUDIT_2026-04-03.md`, `docs/reviews/CVF_GC019_P4_CP8_GUARD_CONTRACT_EXPORT_BOUNDARY_TIGHTENING_REVIEW_2026-04-03.md`, `docs/baselines/CVF_P4_CP8_GUARD_CONTRACT_EXPORT_BOUNDARY_TIGHTENING_DELTA_2026-04-03.md`, and `docs/reference/CVF_PREPUBLIC_GUARD_CONTRACT_EXPORT_SURFACE_2026-04-03.md` narrow `CVF_GUARD_CONTRACT` to the approved first-wave guard surface while preserving `exportReadiness: NEEDS_PACKAGING`
- **P4/CP9 runtime-adapter-hub export-map implementation approved**: `docs/audits/CVF_P4_CP9_RUNTIME_ADAPTER_HUB_EXPORT_MAP_IMPLEMENTATION_AUDIT_2026-04-03.md`, `docs/reviews/CVF_GC019_P4_CP9_RUNTIME_ADAPTER_HUB_EXPORT_MAP_IMPLEMENTATION_REVIEW_2026-04-03.md`, `docs/baselines/CVF_P4_CP9_RUNTIME_ADAPTER_HUB_EXPORT_MAP_IMPLEMENTATION_DELTA_2026-04-03.md`, and `docs/reference/CVF_PREPUBLIC_RUNTIME_ADAPTER_HUB_EXPORT_SURFACE_2026-04-03.md` formalize the canonical root entrypoint and explicit named export map for `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` while preserving `exportReadiness: NEEDS_PACKAGING`
- **P4/CP10 shortlist wave consolidation approved**: `docs/audits/CVF_P4_CP10_SHORTLIST_WAVE_CONSOLIDATION_AUDIT_2026-04-03.md`, `docs/reviews/CVF_GC019_P4_CP10_SHORTLIST_WAVE_CONSOLIDATION_REVIEW_2026-04-03.md`, `docs/baselines/CVF_P4_CP10_SHORTLIST_WAVE_CONSOLIDATION_DELTA_2026-04-03.md`, and `docs/reference/CVF_PREPUBLIC_SHORTLIST_WAVE_STATUS_2026-04-03.md` consolidate `P4/CP7-CP9` into one completed first-wave package-boundary lane while preserving `exportReadiness: NEEDS_PACKAGING` for all three shortlisted candidates
- **P4/CP11 readiness re-assessment approved — no uplift**: `docs/audits/CVF_P4_CP11_SHORTLIST_READINESS_REASSESSMENT_AUDIT_2026-04-03.md`, `docs/reviews/CVF_GC019_P4_CP11_SHORTLIST_READINESS_REASSESSMENT_REVIEW_2026-04-03.md`, and `docs/baselines/CVF_P4_CP11_SHORTLIST_READINESS_REASSESSMENT_DELTA_2026-04-03.md` confirm all three candidates remain `NEEDS_PACKAGING`; gap inventory documented: external-consumer docs, support obligations, license posture acknowledgment for all three; `CVF_GUARD_CONTRACT` has additional blocker (`better-sqlite3` runtime dependency resolution)
- **P4/CP12 documentation-completion approved**: `docs/audits/CVF_P4_CP12_SHORTLIST_DOCUMENTATION_COMPLETION_AUDIT_2026-04-03.md`, `docs/reviews/CVF_GC019_P4_CP12_SHORTLIST_DOCUMENTATION_COMPLETION_REVIEW_2026-04-03.md`, and `docs/baselines/CVF_P4_CP12_SHORTLIST_DOCUMENTATION_COMPLETION_DELTA_2026-04-03.md` close all four P4/CP11 gaps: READMEs rewritten for external consumers, support statements added, license acknowledged, `CVF_GUARD_CONTRACT` `better-sqlite3` moved to `optionalDependencies`; all three remain `NEEDS_PACKAGING`
- **Keep `v1.0/` and `v1.1/` blocked for later waves**: both remain materially denser than the retained/internal pair and still anchor active onboarding/reference surfaces
- **Do not treat `REVIEW/` as the next relocation unit**: current repo truth shows it as a local placeholder rather than a tracked payload root
- **Do not assume `P3/CP2` can merge back to `cvf-next` under current rules**: `GC-039` currently blocks relocation diffs on the canonical branch even after isolated execution; separate governance clarification is required
- **Do not misread `P4/CP1` as publication authorization**: it opens planning only; it does not authorize public mirrors, package releases, or more physical relocation
- **Do not misread `P4/CP2` as mirror execution**: it defines the boundary only; actual docs-mirror publication still requires a separate implementation packet
- **Do not misread `P4/CP3` as export approval**: shortlist priority is not the same thing as `READY_FOR_EXPORT` or package release authorization
- **Do not misread `P4/CP4` as packaging completion**: it defines the first package boundary only; explicit entrypoints, export maps, and release mechanics still require a later bounded implementation packet
- **Do not misread `P4/CP5` as front-door rewrite completion**: it defines the navigation map only; actual `README.md` / `START_HERE.md` / `ARCHITECTURE.md` sync still requires a later bounded implementation packet
- **Do not misread `P4/CP6` as docs-mirror execution**: it syncs the private root front door only; public mirror publication and mirror-safe link replacement remain separate future work
- **Do not misread `P4/CP7` as export approval**: it formalizes one shortlist candidate surface only; `CVF_v3.0_CORE_GIT_FOR_AI` still remains `NEEDS_PACKAGING`, and no package publication is authorized
- **Do not misread `P4/CP8` as provider-runtime approval**: it narrows `CVF_GUARD_CONTRACT` to the selected helper/runtime surface only; provider adapters, enterprise subpaths, and audit persistence remain outside the approved first-wave package promise
- **Do not misread `P4/CP9` as adapter-hub publication approval**: it adds a canonical root barrel and explicit named export map only; `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` still remains `NEEDS_PACKAGING`, and explicit capability boundaries remain part of the package story
- **Do not misread `P4/CP10` as readiness uplift**: it consolidates first-wave completion only; any future `READY_FOR_EXPORT` discussion still requires a separate bounded reassessment packet
- **Do not misread `P4/CP11` as a green light for publication**: it is a conservative re-assessment that found no uplift evidence; all three candidates remain `NEEDS_PACKAGING`; `P4/CP12` documentation-completion does not automatically authorize readiness uplift either
- **Do not misread `P4/CP12` as readiness uplift**: it closes documentation and dependency gaps only; all three candidates still remain `NEEDS_PACKAGING`; a second bounded re-assessment (`P4/CP13`) is required before any uplift can be considered
- If touching CPF batch-contract surfaces, reuse `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/batch.contract.shared.ts` and `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/helpers/cpf.batch.contract.fixtures.ts`
- W7 retained active anchors: `docs/roadmaps/CVF_W7_R14_R15_R16_INTEGRATION_ROADMAP_2026-03-25.md`, `docs/reviews/CVF_W7_T3_CP1_GUARD_BINDING_MATRIX_2026-03-28.md`, `docs/reviews/CVF_W7_T3_CP2_ARCHITECTURE_BOUNDARY_LOCK_2026-03-28.md`, `docs/reviews/CVF_W7_T10_CP2_GATE_CLOSURE_VERIFICATION_MATRIX_2026-03-28.md`, `docs/reviews/CVF_W7_T10_CP3_CLOSURE_REVIEW_2026-03-28.md`
- W7 detailed tranche packet archive indexes: `docs/reviews/archive/CVF_ARCHIVE_INDEX.md`, `docs/roadmaps/archive/CVF_ARCHIVE_INDEX.md`
- Guard binding matrix (G1-G8 + P-01–P-15): `docs/reviews/CVF_W7_T3_CP1_GUARD_BINDING_MATRIX_2026-03-28.md`
- Architecture boundary lock: `docs/reviews/CVF_W7_T3_CP2_ARCHITECTURE_BOUNDARY_LOCK_2026-03-28.md`
- W5-T2 closure: `docs/reviews/CVF_W5_T2_TRANCHE_CLOSURE_REVIEW_2026-03-28.md`

---

## Governance Rules (must follow strictly)

### Tranche Protocol
1. **GC-018** (10/10 audit score) → commits roadmap + tracker + GC-026 sync + execution plan
2. **GC-032 first** before writing governed packets → source truth first, typed evidence stays explicit, continuity surfaces move together
3. **Quality-first before expansion** → read the active quality assessment and explicitly decide `REMEDIATE_FIRST` or `EXPAND_NOW` before drafting any fresh GC-018 packet
4. **GC-033 to GC-036 enforced for CPF maintainability** → thin public barrel, smoke-only `tests/index.test.ts`, shared batch helpers/builders, and no typed evidence payload drift into canon summary docs
5. **Per CP**: Full Lane = new concept/module/cross-plane; Fast Lane (GC-021) = additive batch/summary
6. **Per CP artifacts**: audit doc + review doc + delta doc + exec plan update + test log update + commit
7. **No implementation without GC-018 authorization**
8. **No push to main** — canonical tranche work stays on `cvf-next`, but pre-public restructuring work must stay on a dedicated `restructuring/p3-*` branch and secondary worktree until governance explicitly defines a landing path

### Fast Lane (GC-021) — eligible when:
- additive only, no restructuring
- inside already-authorized tranche
- no new module creation, no ownership transfer, no boundary change

### Memory Governance (GC-022)
- `docs/audits/`, `docs/reviews/` → `Memory class: FULL_RECORD`
- `docs/baselines/`, `docs/roadmaps/` → `Memory class: SUMMARY_RECORD`
- `docs/reference/`, `docs/INDEX.md` → `Memory class: POINTER_RECORD`

### Test Governance (GC-024)
- Each new contract gets a **dedicated test file** (not added to `tests/index.test.ts`)
- Add partition entry to `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`

### Determinism Pattern (all contracts must follow)
- inject `now?: () => string` in `ContractDependencies`
- default: `() => new Date().toISOString()`
- propagate to all sub-contracts via `now: this.now`
- hash IDs with `computeDeterministicHash()` from `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
- **Critical**: when inner contracts create their own sub-contracts internally, thread `now` explicitly into nested dependencies from the consumer bridge constructor

### Batch Contract Pattern
- `dominantTokenBudget` = `Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
- empty batch → `dominantTokenBudget = 0`, valid hash
- `batchId` ≠ `batchHash` (batchId = hash of batchHash only)

---

## Key File Paths

| Purpose | Path |
|---------|------|
| Architecture baseline snapshot | `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` |
| Progress tracker | `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` |
| Completion roadmap | `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` |
| Post-W7 upgrade baseline | `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md` |
| Governed artifact authoring standard | `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md` |
| Test log | `docs/CVF_INCREMENTAL_TEST_LOG.md` |
| Test partition registry | `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` |
| CPF barrel exports | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` |
| EPF barrel exports | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts` |
| GEF barrel exports | `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/index.ts` |
| Deterministic hash util | `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash.ts` |
| Fast lane audit template | `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md` |
| Fast lane review template | `docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md` |
| GC-026 tracker sync template | `docs/reference/CVF_GC026_PROGRESS_TRACKER_SYNC_TEMPLATE.md` |

---

## Doc Naming Conventions

- GC-018 auth: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W{W}_T{T}_{SLUG}_{DATE}.md`
- GC-026 auth sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W{W}_T{T}_AUTHORIZATION_{DATE}.md`
- GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W{W}_T{T}_CLOSURE_{DATE}.md`
- Execution plan: `docs/roadmaps/CVF_W{W}_T{T}_{SLUG}_EXECUTION_PLAN_{DATE}.md`
- Full Lane audit: `docs/audits/CVF_W{W}_T{T}_CP{N}_{SLUG}_AUDIT_{DATE}.md`
- Full Lane review: `docs/reviews/CVF_GC019_W{W}_T{T}_CP{N}_{SLUG}_REVIEW_{DATE}.md`
- Fast Lane audit: `docs/audits/CVF_W{W}_T{T}_CP{N}_{SLUG}_AUDIT_{DATE}.md`
- Fast Lane review: `docs/reviews/CVF_GC021_W{W}_T{T}_CP{N}_{SLUG}_REVIEW_{DATE}.md`
- Delta: `docs/baselines/CVF_W{W}_T{T}_CP{N}_{SLUG}_DELTA_{DATE}.md`
- Closure review: `docs/reviews/CVF_W{W}_T{T}_TRANCHE_CLOSURE_REVIEW_{DATE}.md`

---

## Test Commands

```bash
# CPF tests
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm test

# EPF tests
cd EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION && npm test

# GEF tests
cd EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION && npm test

# LPF tests
cd EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION && npm test
```

---

## Commit Format

```
<type>(W{W}-T{T}/CP{N}): <short description> — <Lane>

Tranche: W{W}-T{T} — <Tranche Name>
Control point: CP{N} — <ContractName>
Lane: Full Lane | Fast Lane (GC-021)

Contract: <what it does>
Tests: <N> new (<total> <module> total, 0 failures)
Governance artifacts: <list of docs>
```
