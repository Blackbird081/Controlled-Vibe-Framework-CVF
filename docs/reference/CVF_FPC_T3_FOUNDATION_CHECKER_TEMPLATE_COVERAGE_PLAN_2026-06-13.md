# CVF FPC-T3 Foundation Checker Template Coverage Plan

Memory class: FULL_RECORD

Status: COMPLETE_PENDING_REVIEW

docType: reference

Date: 2026-06-13

Worker: Claude

Snapshot time: 2026-06-13 (execution HEAD 77098b23)

Commit mode: WORKER_MUST_NOT_COMMIT

rawMemoryReleased=false

## Purpose

Rank the FPC-T3 checker/template/standard candidates from FPC-T1 and FPC-T2,
add the workspace-integrity and agent-operation-audit design candidate (C07),
and recommend the smallest safe first implementation tranche for later
separate authorization.

This plan is decision-only. It does not authorize checker implementation,
template mutation, registry mutation, runtime/source/test mutation, OS audit
installation, agent computer-control changes, public-sync, provider/OCR/live
proof, readiness/cost/quality claims, memory reinjection, high-risk promotion,
or autonomous mutation.

## Scope / Target / Owner Boundary

Target: planning disposition for FPC-T3-C01 through FPC-T3-C07.

Owner boundary: Claude owns this coverage plan and the paired worker-return
packet only. Codex owns review, closure conversion, any later implementation
work orders, and any session-state sync. No implementation begins from this
plan without a separate Codex-authorized work order.

## Source Authority

| Source | Path | Role |
| --- | --- | --- |
| FPC roadmap | `docs/roadmaps/CVF_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_COMPLETION_ROADMAP_2026-06-13.md` | FPC-T3 purpose, ranking factors, claim boundary |
| FPC-T1 matrix | `docs/reference/CVF_FPC_T1_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_AUDIT_MATRIX_2026-06-13.md` | FPC-T3-C01 through FPC-T3-C06 candidate definitions |
| FPC-T2 matrix | `docs/reference/CVF_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_MATRIX_2026-06-13.md` | FPC-T3 dependency notes per candidate |
| FPC-T2 completion | `docs/reviews/CVF_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_COMPLETION_2026-06-13.md` | FPC-T3-C01 is prerequisite for C05 registry entry |
| FPC-T3 GC-018 | `docs/baselines/CVF_GC018_FPC_T3_FOUNDATION_CHECKER_TEMPLATE_COVERAGE_PLAN_2026-06-13.md` | authorization, C07 design boundary, forbidden scope |
| FPC-T3 work order | `docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_T3_FOUNDATION_CHECKER_TEMPLATE_COVERAGE_PLAN_FOR_CLAUDE_2026-06-13.md` | candidate requirements, disposition vocabulary |
| System-loop interlock standard | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_STANDARD_2026-06-02.md` | registry field contract |
| System-loop interlock registry | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | existing 15 connections (read-only) |
| Governance hook chain | `governance/compat/run_local_governance_hook_chain.py` | existing checker inventory at reviewer-fast |
| Worker-return fast gate | `governance/compat/run_worker_return_fast_gate.py` | gate structure; --pytest-target argument |
| Existing checkers (current) | `governance/compat/check_finding_to_governance_learning.py`, `check_markdown_structural_completeness.py`, `check_machine_closure_package.py`, `check_work_order_dispatch_quality.py`, `check_active_session_state.py`, `check_core_guard_self_protection.py`, `check_forbidden_filesystem_state.py`, `check_system_loop_interlock.py`, `check_memory_consolidation_artifact_quality.py` | existing coverage baseline |
| Negative search results | rg for `check_epistemic_process_packet`, `check_dice_machine_candidates` | confirmed NOT yet implemented as source files |
| Agent front-door instructions | `AGENTS.md` | provider-specific memory boundary |

No provider-specific agent file, external Document Translator source, external
Policy_Local source, or uncited inference is used as source authority.

## Source Verification Summary

| Claimed symbol or path | Search result | Disposition |
| --- | --- | --- |
| `check_epistemic_process_packet.py` | NOT found in `governance/compat/` or any `.py` file | confirmed absent; C01 is unimplemented |
| `check_dice_machine_candidates.py` | NOT found in `governance/compat/` or any `.py` file | confirmed absent; C02 is unimplemented |
| `check_system_loop_interlock.py` | EXISTS at `governance/compat/check_system_loop_interlock.py` | C03 is an extension of an existing checker |
| `rawMemoryReleased` in `governance/compat/` | found only in `check_memory_consolidation_artifact_quality.py` (pattern match on doc-only field) | C06 target pattern exists partially; no standalone gate for memory-write artifacts |
| `check_finding_to_governance_learning.py` | EXISTS | C01/C05 downstream consumer checker exists |
| `check_markdown_structural_completeness.py` | EXISTS | C04 template update would feed this gate |
| `check_memory_consolidation_artifact_quality.py` | EXISTS at `governance/compat/` | C06 may extend or companion this checker |
| `run_local_governance_hook_chain.py` | EXISTS; reviewer-fast runs 14 checks | C01/C02/C05 phase target |
| `run_worker_return_fast_gate.py` | EXISTS; `--pytest-target` flag supported | C05 gate fixture target |

---

## Candidate Evidence Ledger

### FPC-T3-C01: `check_epistemic_process_packet.py`

- Source: FPC roadmap `## FPC-T3`, FPC-T1 matrix `## FPC-T3 Candidate List` row C01
- Purpose: require hypothesis, prediction-result comparison, evidence uptake,
  contradiction handling, and claim update sections for evidence-heavy worker
  returns and completions at reviewer-fast or pre-closure phase.
- Why needed now: FPC-T2 completion explicitly routes FPC-T2-C05 to this
  checker before any C05 registry entry. This is a hard prerequisite chain, not
  a nice-to-have.
- Current gap: no checker in `governance/compat/` enforces epistemic-process
  sections. `check_finding_to_governance_learning.py` enforces F2G learning
  disposition structure but does NOT enforce the prediction/evidence-comparison
  workflow steps that precede findings.
- Input signal (when implemented): worker returns and completions with
  evidence-heavy content must include at least: expected result / prediction
  section, comparison of prediction vs actual, contradiction/gap disposition,
  and claim update section. Checker verifies structural presence only, not
  semantic correctness.
- Deterministic test availability: AVAILABLE - structural marker presence
  checks are deterministic pattern matches; fixture files with and without
  sections are easy to author.
- False-positive risk: MEDIUM - inference-heavy or purely mechanical tasks
  (e.g., ASCII repair, format fix) should not require epistemic sections;
  checker must support an explicit `EPISTEMIC_PROCESS_NA_WITH_REASON` escape.
- Phase target: reviewer-fast (primary); pre-closure as backup.

### FPC-T3-C02: `check_dice_machine_candidates.py`

- Source: FPC-T1 matrix row C02; FPC-T2 matrix FPC-T3 Dependency Notes
- Purpose: enforce DICE-MC-01 through DICE-MC-10 ownership invariants in
  autorun (not just in focused test suite `tests/test_document_intelligence_control_envelope.py`).
- Current gap: DICE machine-check candidates are currently test-only (25 tests
  in a focused suite). No autorun hook-chain checker enforces DIR/DICE
  ownership invariants in governance workflow. This means a governance worker
  could violate DICE boundaries without the reviewer-fast gate catching it.
- Input signal (when implemented): changed files touching DICE or DIR paths
  must satisfy DICE-MC-01 through DICE-MC-10 ownership assertions in autorun.
- Deterministic test availability: AVAILABLE - DICE-MC checks are already
  defined in the test suite; the checker would wrap or invoke a subset of them.
- False-positive risk: LOW if scoped to DICE/DIR paths only; MEDIUM if the
  checker checks every governance commit for DICE patterns.
- Phase target: pre-commit or reviewer-fast.
- FPC-T2 companion: C04 interlock entry would be elevated from
  STRUCTURAL_GUARDED to MACHINE_CHECKED if C02 is implemented.

### FPC-T3-C03: Interlock Registry Coverage Checker Extension

- Source: FPC-T1 matrix row C03; `governance/compat/check_system_loop_interlock.py` EXISTS
- Purpose: detect closed workflow chains that produce downstream signals but
  lack a registered interlock disposition. Extend `check_system_loop_interlock.py`
  rather than creating a new checker.
- Current gap: `check_system_loop_interlock.py` validates existing registered
  connections. It does NOT detect planes or workflow chains that are closed but
  not registered. The FPC-T1 audit found Memory plane (C02/C03), Control Plane
  hook-chain (C01), and DIR/DICE (C04) as unregistered closed chains - none
  were caught by the existing checker.
- Input signal (when implemented): a registry of "workflow chains expected to
  have an interlock entry" compared against current registry connections. Chains
  on the expected list without a ACTIVE or PROPOSED entry emit a warning/error.
- Deterministic test availability: PARTIAL - requires a stable expected-chain
  manifest; false-positive risk is higher because new work-in-progress chains
  legitimately have no entry yet.
- False-positive risk: HIGH without a curated expected-chain manifest; MEDIUM
  if the expected-chain list is explicitly maintained and updated with new
  planes.
- Phase target: pre-closure (not pre-commit; too much churn during active
  development of new lanes).

### FPC-T3-C04: Work-Order Template Epistemic Block

- Source: FPC roadmap `## FPC-T3` candidate table; FPC-T1 matrix row C04
- Purpose: require high-evidence work orders to include expected-result and
  contradiction-handling fields before worker execution (pre-dispatch gate).
- Current gap: the work-order template
  (`docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`) does not
  require an expected-result or prediction section. Workers may receive task
  descriptions without any stated expectation, making it impossible to evaluate
  whether contrary evidence was handled.
- Relationship to C01: C04 is a TEMPLATE UPDATE, not a checker. It adds
  doc-only fields to the canonical work-order template. C01 would then CHECK
  that the epistemic fields are present. C04 should precede or accompany C01
  implementation so the checker has a template-level anchor.
- Deterministic test availability: AVAILABLE for doc-only field presence;
  `check_markdown_structural_completeness.py` would enforce the new sections.
- False-positive risk: LOW if scoped to "high-evidence" work orders
  with explicit classification; MEDIUM if applied broadly to all work orders
  including trivial mechanical ones.
- Phase target: pre-dispatch (template update affects future work orders only).

### FPC-T3-C05: Worker-Return Fast Gate Epistemic Fixture

- Source: FPC-T1 matrix row C05; `governance/compat/run_worker_return_fast_gate.py` EXISTS
- Purpose: let no-commit workers run the epistemic packet check before return,
  catching missing prediction/evidence-comparison sections before Codex review.
- Current gap: `run_worker_return_fast_gate.py` currently runs: focused pytest
  targets, corpus scan registry aggregate drift, reviewer-fast governance gate,
  and git diff whitespace check. It does NOT run `check_epistemic_process_packet.py`
  because that checker does not exist yet.
- Hard dependency: C05 is meaningless without C01 (`check_epistemic_process_packet.py`).
  Once C01 exists, wiring it into `run_worker_return_fast_gate.py` is a one-line
  addition to `build_commands()`.
- Deterministic test availability: AVAILABLE once C01 exists.
- False-positive risk: INHERITS C01 false-positive risk.
- Phase target: worker-return fast gate (runs before no-commit worker hands off).

### FPC-T3-C06: Memory `rawMemoryReleased=false` Autorun Check

- Source: FPC-T1 matrix row C06; MLW3 contract `rawMemoryReleased` field;
  `governance/compat/check_memory_consolidation_artifact_quality.py` (partial coverage)
- Purpose: machine-check that memory-write artifacts and worker returns honor
  the `rawMemoryReleased=false` invariant in autorun (reviewer-fast or
  pre-closure).
- Current coverage: `check_memory_consolidation_artifact_quality.py` checks
  MEMCON artifact quality. The `rawMemoryReleased` token appears in that
  checker's test patterns, but no standalone gate checks that worker return
  packets and memory-write routes consistently carry `rawMemoryReleased=false`
  as a doc-level assertion. The invariant is currently enforced by convention
  (doc discipline) not machine check.
- Input signal (when implemented): any changed governed markdown that contains
  memory write, raw memory, or learning promotion language must contain the
  literal `rawMemoryReleased=false` assertion. Pattern match is deterministic.
- Deterministic test availability: AVAILABLE - simple pattern match; fixture
  files are easy.
- False-positive risk: LOW - the pattern is narrow and specific to governed
  memory artifacts. Non-memory artifacts would not trigger it.
- Phase target: reviewer-fast or pre-closure.
- Note: this could be a small extension to the existing
  `check_memory_consolidation_artifact_quality.py` rather than a new file.

### FPC-T3-C07: Workspace-Integrity and Agent-Operation-Audit Control

- Source: FPC-T3 GC-018 `## Decision / Baseline / Proposed Tranche` (C07 added
  in response to operator's protected-folder visibility concern and current-session
  workspace incident); FPC-T3 work order `## FPC-T3-C07 Design Boundary`
- Purpose: design-only candidate for: (1) protected-folder disappearance
  detection before staging or commit; (2) operation-log evidence requirements
  for high-risk filesystem actions; (3) rollback evidence model; (4) claim
  boundary separating repo-local detection from OS-level attribution.
- Design questions answered by this candidate (per work order boundary):
  1. **Repo-local detection signals:** `git status --short` before work
     (pre-flight) + `Test-Path docs/roadmaps` (protected directory existence)
     + `check_forbidden_filesystem_state.py` (forbidden paths on disk before
     implementation) + `git diff --name-status` scope guard (diff must stay
     inside allowed artifact set). As of 2026-06-13 these are all in use and already wired into
     the pre-flight protocol. A future `check_workspace_integrity.py` could
     formalize them as an autorun check that fires when a worker's changed-file
     list includes deletions from governed directories.
  2. **Operation-log evidence requirements:** a future agent-control plane should
     require each high-risk filesystem action to carry: actor identity
     (agent/session ID), command or tool surface, timestamp, cwd, changed paths,
     and approval boundary. This is a doc-only new field pattern in work orders
     and session state - no runtime code yet.
  3. **CVF repo-guard scope vs OS-level scope:** CVF repo guards (git status,
     forbidden-filesystem-state checker, diff scope guard) can detect WHAT
     changed in the working tree. They cannot prove WHO used the physical
     machine without a separate OS or endpoint audit mechanism (Windows Security
     Auditing, Sysmon, EDR). This boundary must be stated explicitly in any
     future `check_workspace_integrity.py` claim boundary.
  4. **Rollback evidence model:** git status snapshot before work + allowed
     artifact list from work order + `git diff --check` after work + branch/
     worktree snapshot. For higher-risk operations: protected-path digest
     (SHA-256 of key governed files before work). External audit log is out of
     scope for this tranche.
  5. **Claim boundary:** a repo-local workspace integrity checker proves that
     governed tracked paths were not unexpectedly deleted or modified outside
     the allowed artifact set. It does NOT prove agent identity, physical-machine
     user attribution, OS-level filesystem events, or absence of all malicious
     activity without OS-level audit already enabled.
- Current CVF coverage: `check_forbidden_filesystem_state.py` (forbidden paths
  on disk at dispatch), pre-flight `git status --short`, `docs/roadmaps`
  Test-Path check in this work order's pre-flight. These are already in use.
- What is missing: a formalized `check_workspace_integrity.py` that runs
  `git diff --name-status` and warns when governed tracked paths are deleted
  outside the allowed artifact set. This is a narrow, deterministic check.
- Deterministic test availability: AVAILABLE for repo-local detection; BLOCKED
  for OS-level attribution (requires endpoint audit infrastructure).
- False-positive risk: LOW for repo-local deletion detection; HIGH for
  attribution claims without OS audit.
- Phase target: pre-commit (repo-local deletion detection); separate
  operator-approved OS/endpoint audit for attribution (not in this plan).
- Authorization required: implementing the repo-local `check_workspace_integrity.py`
  portion requires a separate Codex-authorized work order. OS auditing (Windows
  Security, Sysmon, file watcher service, destructive broker) requires a
  separate operator decision and is out of FPC scope.

---

## Candidate Ranking Matrix

Ranking factors per FPC roadmap: repeated-defect risk, operator time saved,
earliest phase placement, false-positive risk, protected-path impact,
deterministic-test availability. C07 adds: repo-local vs OS-level scope.

| Candidate ID | Candidate name | Repeated-defect risk | Operator time saved | Earliest phase | False-positive risk | Protected-path impact | Deterministic-test availability | Recommended disposition | Priority rank |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FPC-T3-C01 | `check_epistemic_process_packet.py` | HIGH (epistemic-gap finding repeats across FPC-T1, FPC-T2; operator concern from AI-scientist paper intake) | HIGH (catches evidence-ignoring before reviewer sees it; reduces review rework) | reviewer-fast | MEDIUM (NA escape needed for mechanical tasks) | read-only (checks markdown content only) | AVAILABLE | `IMPLEMENT_FIRST_CANDIDATE_LATER` | 1 (highest) |
| FPC-T3-C04 | Work-order template epistemic block | HIGH (no pre-dispatch expectation anchor means workers have no prediction to compare; pre-reqs C01) | HIGH (sets up C01 checker anchor; early-phase catch) | pre-dispatch (template update) | LOW (doc-only field; scoped to high-evidence work orders) | none (template doc update only) | AVAILABLE (structural completeness gate) | `TEMPLATE_UPDATE_LATER` | 2 (implement with or just before C01) |
| FPC-T3-C06 | Memory `rawMemoryReleased=false` autorun check | MEDIUM (current doc-discipline enforcement is reliable but single-point failure if discipline drifts) | MEDIUM (prevents memory-release regression in future memory work) | reviewer-fast or pre-closure | LOW (narrow pattern match) | read-only (checks governed markdown only) | AVAILABLE | `CHECKER_EXTENSION_LATER` | 3 |
| FPC-T3-C02 | `check_dice_machine_candidates.py` | MEDIUM (DICE/DIR invariants currently test-only; risk increases as DIR/DICE adapters are developed) | MEDIUM (elevates C04 interlock from STRUCTURAL_GUARDED to MACHINE_CHECKED) | pre-commit or reviewer-fast | LOW (if scoped to DICE/DIR paths only) | read-only (checks DICE/DIR source/test paths) | AVAILABLE (DICE test suite already exists) | `IMPLEMENT_AFTER_PREREQUISITE` | 4 (after C01 and C04 template; can proceed independently) |
| FPC-T3-C03 | Interlock registry coverage checker extension | MEDIUM (new unregistered planes could silently remain unregistered) | LOW-MEDIUM (catches visibility gaps; false-positive burden is high) | pre-closure | HIGH (requires maintained expected-chain manifest) | read-only (extends existing checker) | PARTIAL (expected-chain manifest must be authored and maintained) | `CHECKER_EXTENSION_LATER` | 5 (after C01/C02; expected-chain manifest is the bottleneck) |
| FPC-T3-C05 | Worker-return fast gate epistemic fixture | MEDIUM (only adds value after C01 exists) | MEDIUM (no-commit workers catch epistemic gaps before Codex review) | worker-return fast gate | INHERITS C01 | none | AVAILABLE once C01 exists | `WORKER_GATE_FIXTURE_LATER` | 6 (implement immediately after C01 as a one-line wiring change) |
| FPC-T3-C07 | Workspace-integrity and agent-operation-audit control | MEDIUM (protected-folder disappearance already detected by pre-flight; repo-local gap is real but bounded) | MEDIUM (formalized check prevents pre-flight discipline from being skipped) | pre-commit (repo-local portion) | LOW (repo-local deletion check) | read-only for repo-local portion; OS-level portion requires separate authorization | AVAILABLE (repo-local); BLOCKED (OS attribution) | `CONTROL_DESIGN_ONLY` | 7 (design complete; repo-local implementation in separate tranche; OS-level separate operator decision) |

---

## Dependency Map

```
FPC-T3-C04 (template update)
    |
    v
FPC-T3-C01 (check_epistemic_process_packet.py) -- PREREQUISITE --> FPC-T2-C05 registry entry
    |
    v
FPC-T3-C05 (worker-return fast gate fixture)
        [C05 is a one-line wiring change after C01 exists]

FPC-T3-C02 (check_dice_machine_candidates.py) -- COMPANION --> FPC-T2-C04 interlock elevation
        [C02 is independent of C01; can proceed in parallel]

FPC-T3-C06 (rawMemoryReleased autorun check) -- COMPANION --> FPC-T2-C02/C03 interlock elevation
        [C06 is independent; can proceed in parallel]

FPC-T3-C03 (interlock registry coverage extension)
        [C03 depends on having a stable expected-chain manifest; best after C01/C02 complete
        so new interlock entries are registered before the manifest is finalized]

FPC-T3-C07 (workspace-integrity design)
        [DESIGN COMPLETE in this plan; repo-local implementation is a separate tranche;
        OS-level attribution requires separate operator decision]
```

---

## Recommended First Implementation Tranche

**Recommendation: FPC-T3-C04 (template update) + FPC-T3-C01 (checker) as a
single paired tranche.**

Rationale:

1. FPC-T3-C01 is the only hard prerequisite in the FPC-T3 chain: it gates
   FPC-T2-C05 registry viability and enables FPC-T3-C05. No other candidate
   blocks on it, but C01 blocks the most downstream value.
2. FPC-T3-C04 is a template-only doc update with no runtime risk. It should
   precede or accompany C01 so the checker has a template-level anchor for the
   epistemic fields it enforces.
3. The pair is bounded: both artifacts are governed markdown (template update)
   and a single Python checker. Neither touches runtime, registry, session
   state, OS controls, or downstream adapters.
4. The false-positive risk (MEDIUM for C01 due to mechanical tasks) is
   manageable by including an `EPISTEMIC_PROCESS_NA_WITH_REASON` escape in
   the checker's first version.
5. Together they satisfy the highest priority gap from FPC-T1 audit (epistemic
   process enforcement) and unblock the FPC-T2-C05 registry entry.

**Scope of the recommended tranche:**

- Template update: add `Expected result / prediction` and `Contradiction
  handling` fields to the high-evidence work-order template variant.
- Checker implementation: `check_epistemic_process_packet.py` enforces
  structural presence of prediction, evidence-comparison, contradiction, and
  claim-update sections in governed evidence-heavy worker returns and
  completions. Supports `EPISTEMIC_PROCESS_NA_WITH_REASON` escape.
- Wiring: add checker to `run_local_governance_hook_chain.py` reviewer-fast
  phase and to `run_worker_return_fast_gate.py` via `--pytest-target`.
- Deterministic tests: fixture files with and without sections; NA escape test.
- All other candidates (C02, C03, C05, C06, C07) remain in the plan for later
  separate tranches.

**This tranche requires a separate Codex-authorized work order before execution.**

---

## FPC-T3-C07 Design Boundary and Future Authorization Requirements

The design for FPC-T3-C07 is complete as a planning artifact. The following
boundaries apply to any future implementation work:

### What this plan authorizes (design-only):

- documentation of repo-local detection signals (git status, Test-Path, diff
  scope guard, forbidden-filesystem-state checker);
- documentation of operation-log evidence requirements as doc-only fields in
  future work orders or session state;
- documentation of the claim boundary between repo-local detection and OS-level
  attribution;
- documentation of the rollback evidence model (git snapshot + allowed artifact
  list + SHA-256 digest of key governed files before work).

### What requires a separate Codex-authorized work order:

- implementation of `check_workspace_integrity.py` (repo-local deletion
  detection checker);
- integration of the checker into the pre-commit hook chain;
- authoring of a "protected-path expected-manifest" that the checker validates
  against.

### What requires a separate OPERATOR DECISION (out of FPC scope entirely):

- Windows Security Audit policy configuration;
- Sysmon or equivalent EDR installation;
- file watcher service creation;
- destructive broker design or implementation;
- agent computer-control permission changes;
- any OS-level or endpoint-level attribution mechanism.

### Claim boundary for C07 repo-local detection:

A `check_workspace_integrity.py` checker proves that governed tracked paths
were not unexpectedly deleted or modified outside the allowed artifact set
during a worker's run. It does NOT prove: who used the physical machine; that
all malicious filesystem actions are detected without OS-level audit; that
Git history cannot be rewritten; or that the agent session is isolated from
other processes. These guarantees require OS-level and endpoint-level audit
mechanisms that are out of CVF repo-guard scope.

---

## Rejected or Deferred Candidates

No candidates from C01 through C07 are rejected. All are valid planning targets
with clear evidence. Deferral reasons:

| Candidate | Deferral reason |
| --- | --- |
| FPC-T3-C03 | Expected-chain manifest is not yet authored; false-positive risk is HIGH without it; defer until C01/C02 complete and interlock entries are registered |
| FPC-T3-C05 | Hard dependency on C01; trivially implementable after C01 as a one-line wiring change; no separate planning needed |
| FPC-T3-C07 repo-local implementation | Separate Codex-authorized work order required; design is complete in this plan |
| FPC-T3-C07 OS-level attribution | Separate operator decision required; out of FPC scope |

---

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| FPC-T3-C01 is not yet implemented; epistemic process sections are unenforceable at any autorun phase | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | Recommended first implementation tranche is C04+C01 pair; requires separate Codex-authorized work order |
| FPC-T3-C03 false-positive risk is HIGH without expected-chain manifest; premature implementation could block legitimate work | RULE_GAP | GOVERNANCE_CONTROL_PLANE | DEFER_WITH_REASON | Defer C03 until C01/C02 complete and interlock entries are registered to reduce manifest churn |
| FPC-T3-C07 repo-local workspace detection is already partially covered by existing pre-flight checks; the gap is formalization only | SYSTEM_LOOP_VISIBILITY_GAP | GOVERNANCE_CONTROL_PLANE | INTERLOCK_CANDIDATE | Separate Codex-authorized tranche for check_workspace_integrity.py after FPC-T3-C01 first tranche |
| `rawMemoryReleased=false` is enforced by convention only; C06 would machine-check it | RULE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | C06 is independent; can be implemented in parallel with C01 in a separate small tranche |
| Runtime/provider/cost learning applicability | N/A_WITH_REASON | RUNTIME_BEHAVIOR_LEARNING | N/A_WITH_REASON | FPC-T3 is planning-only; no runtime/provider/cost behavior changed |

---

## Claim Boundary

This coverage plan decides planning priority and implementation sequencing for
FPC-T3 checker/template/standard candidates. It does not:

- implement any checker or template;
- mutate `governance/compat/` files, the work-order template, or the system-loop
  interlock registry;
- prove that any checker design is semantically correct;
- prove OS-level attribution, physical-machine identity, or agent
  computer-control safety;
- authorize FPC-T3 implementation or any downstream use-case work;
- authorize public-sync;
- make production, public, readiness, cost, or quality claims;
- release raw memory (`rawMemoryReleased=false`);
- constitute autonomous mutation.

The recommended first tranche requires a separate Codex-authorized work order
before any implementation begins.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance FPC-T3 planning artifact. Public-sync is not
authorized by this work order or GC-018.

rawMemoryReleased=false
