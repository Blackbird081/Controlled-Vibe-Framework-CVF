# CVF AOT-T2 Expected Manifest Trace Coverage Plan

Memory class: FULL_RECORD

Status: COMPLETE_PENDING_REVIEW

docType: reference

Date: 2026-06-13

Worker: Claude

Snapshot time: 2026-06-13 (execution HEAD 9581a2e3)

Commit mode: WORKER_MUST_NOT_COMMIT

rawMemoryReleased=false

## Purpose

Define the next useful hardening step for CVF agent/provider supervision:
expected-manifest and co-work trace coverage. This plan identifies what later
implementation should check, what evidence it should require, and what remains
out of scope.

CVF does not develop `codex_cowork`, `claude_cowork`, agent computer-control
surfaces, OS audit tooling, endpoint monitoring, or provider runtime features.
CVF's responsibility is repo-local control-plane supervision.

This plan is decision-only. It does not implement checkers, tests, hooks,
runtime changes, session-state edits, provider calls, OS audit, or public-sync.

## Scope / Target / Owner Boundary

Target: planning disposition for AOT-T2 expected-manifest and co-work trace
coverage candidates.

Owner boundary: Claude owns this coverage plan and the paired worker-return
packet only. Codex owns review, closure conversion, any later implementation
work orders, and session-state sync. No implementation begins from this plan
without a separate Codex-authorized work order.

## Source Authority

| Source | Path | Role |
| --- | --- | --- |
| AOT standard | `docs/reference/CVF_AGENT_OPERATION_TRACE_AND_WORKSPACE_INTEGRITY_STANDARD_2026-06-13.md` | canonical AOT-T1 boundary, trace block fields, protected surface, claim boundary |
| AOT checker | `governance/compat/check_agent_operation_trace.py` | current enforcement behavior, TRACE_MARKER, TRACE_REQUIRED_LABELS, TRACE_ARTIFACT_PREFIXES, TRACE_REVIEW_TRIGGERS, PROTECTED_REPO_PREFIXES, find_trace_violations |
| AOT tests | `governance/compat/test_check_agent_operation_trace.py` | regression coverage: 6 tests; missing-trace, complete-trace, worker-trigger, non-execution-ignore, protected-delete, protected-delete-disposition |
| Local hook chain | `governance/compat/run_local_governance_hook_chain.py` | hook placement: agent-operation-trace-integrity at reviewer-fast, pre-commit, pre-push |
| Autorun gate | `governance/compat/run_agent_autorun_workflow_gate.py` | autorun placement: agent-operation-trace-integrity at common phase gates |
| Active session state | `CVF_SESSION/ACTIVE_SESSION_STATE.json` | currentMode, nextAllowedMove, AOT-T2 dispatch entry |
| GC-018 | `docs/baselines/CVF_GC018_AOT_T2_EXPECTED_MANIFEST_TRACE_COVERAGE_PLAN_2026-06-13.md` | authorization, forbidden scope, claim boundary |
| Work order | `docs/work_orders/CVF_AGENT_WORK_ORDER_AOT_T2_EXPECTED_MANIFEST_TRACE_COVERAGE_PLAN_FOR_CLAUDE_2026-06-13.md` | candidate requirements, disposition vocabulary, negative search discipline |

No provider-specific agent file, external Document Translator source,
Policy_Local source, OS audit mechanism, or uncited inference is used as
source authority.

---

## Current AOT-T1 Capability Map

### What AOT-T1 enforces (source-backed)

| Capability | Source symbol / line | Current state |
| --- | --- | --- |
| Trace block required on changed work orders | `is_trace_artifact` line 136; `TRACE_ARTIFACT_PREFIXES` line 42 | ENFORCED - any changed `docs/work_orders/*.md` or `docs/reviews/*.md` with trigger words must have the trace block |
| Trace block required on changed worker-return and completion reviews | `TRACE_REVIEW_TRIGGERS` line 47; trigger words: `WORKER_RETURN`, `WORKER_MUST_NOT_COMMIT`, `WORKER_MAY_COMMIT`, `completion_review`, `Owner / reviewer`, `Worker:`, `Machine Closure Package`, `Closure Diff Gate` | ENFORCED - reviewed artifacts with these triggers are checked for the trace block |
| 12 required trace labels enforced | `TRACE_REQUIRED_LABELS` line 27 | ENFORCED - `Actor`, `Provider or surface`, `Session or invocation`, `Working directory`, `Command or tool surface`, `Target paths`, `Allowed scope source`, `Before status evidence`, `After status evidence`, `Diff evidence`, `Approval boundary`, `Claim boundary` |
| Protected-path delete/rename detection | `PROTECTED_REPO_PREFIXES` line 58; `protected_delete_or_rename_paths` line 162 | ENFORCED - deletions or renames of `.github/`, `AGENTS.md`, `CVF_SESSION/`, `CVF_SESSION_MEMORY.md`, `docs/baselines/`, `docs/reference/`, `docs/reviews/`, `docs/roadmaps/`, `docs/work_orders/`, `governance/compat/` require `Deletion or rename disposition` evidence in a changed trace block |
| Hook placement | `run_local_governance_hook_chain.py` line 50; autorun gate line 79 | ENFORCED at reviewer-fast, pre-commit, pre-push, and autorun common phase gates |
| Regression test coverage | `test_check_agent_operation_trace.py` 6 tests | PRESENT - missing-trace violation, complete-trace pass, worker-trigger, non-execution-ignore, protected-delete, protected-delete-disposition |
| Archive exclusion | `is_trace_artifact` line 138 | ENFORCED - paths containing `/archive/` are excluded from trace checks |
| Non-execution review exclusion | `is_trace_artifact` line 144 | ENFORCED - `docs/reviews/*.md` without trigger words is ignored |

### What AOT-T1 does NOT enforce (source-backed gaps)

| Gap | Evidence | AOT-T2 relevance |
| --- | --- | --- |
| Expected-manifest: no checker requires worker to declare the expected file set before execution | `TRACE_REQUIRED_LABELS` has no `Expected manifest` field; no manifest-delta check in `find_trace_violations` | HIGH - a worker could add unexpected files or skip expected files without detection at the trace gate |
| Co-work agent identity: trace block has no field requiring the agent type (Codex vs Claude vs other worker) or invocation ID | `TRACE_REQUIRED_LABELS` line 27 does not include agent-type or invocation-ID field | MEDIUM - without agent-type identification, the trace cannot differentiate which agent performed which work in multi-agent sessions |
| Unexpected-add detection: checker detects protected-path deletes/renames but does not detect unexpected new files in protected directories | `protected_delete_or_rename_paths` checks only `D` and `R` statuses, not `A` (add) in protected paths | MEDIUM - a worker could create unauthorized files in `docs/baselines/`, `docs/work_orders/`, or `governance/compat/` without a trace gate violation |
| Diff-scope guard: no machine check verifies that `Diff evidence` field matches the actual changed-file set | `find_trace_violations` checks presence of `Diff evidence` label but not the content correctness | MEDIUM - a worker could write `git diff --name-status` as the evidence value without recording which files actually changed |
| Out-of-scope addition: no autorun check prevents a worker from listing allowed artifacts in the trace but actually adding extra files | `find_trace_violations` does not compare `Target paths` to actual changed set | MEDIUM - trace block field values are currently unchecked for factual accuracy |
| Planned-vs-actual reconciliation: no gate compares the work order's `Write Ownership` or planned artifact list to the actual untracked/changed set | not implemented in checker | HIGH - closest to the expected-manifest gap; the biggest enforcement gap for WORKER_MUST_NOT_COMMIT boundary verification |
| Co-work sequence tracing: multi-agent handoff steps (Codex dispatches, Claude executes, Codex reviews) leave separate trace blocks but no single checker verifies the chain is complete | not implemented; trace blocks are checked individually | LOW (sequence is enforced by governance process, not machine check) |

---

## Expected Manifest Design Boundary

### Definition

An "expected manifest" is an explicit list of file paths that a worker is
authorized to add or modify, declared in the work order before execution. A
manifest-trace gate would verify that:

1. the set of untracked/changed files at worker return matches the allowed
   artifact list from the work order;
2. any file in the changed set that is NOT in the expected manifest triggers
   a gate violation;
3. any file in the expected manifest that is absent from the changed set is
   flagged as a missing deliverable.

### What this plan authorizes (design-only)

- documentation of the manifest-trace design: three required fields
  (`Expected manifest`, `Actual changed set`, `Manifest delta`) as additions
  to the `Agent Operation Trace Block`;
- documentation of the manifest-delta logic: `MISSING_DELIVERABLE` when an
  expected path is absent; `UNAUTHORIZED_ADDITION` when an actual changed path
  is absent from the manifest; `MATCH` when both sets are equal;
- documentation of the claim boundary: manifest-trace proves repo-local
  file-set compliance only; it does NOT prove OS-level user attribution or
  that no external process modified other files outside the repo;
- documentation of the `N/A with reason` escape for mechanical tasks where
  no expected manifest is defined (e.g., trivial doc-only hotfixes with a
  single known file and no work order).

### What requires a separate Codex-authorized work order

- addition of `Expected manifest`, `Actual changed set`, and `Manifest delta`
  to `TRACE_REQUIRED_LABELS` in `check_agent_operation_trace.py`;
- implementation of manifest-delta comparison logic in `find_trace_violations`;
- addition of manifest-delta regression tests to
  `test_check_agent_operation_trace.py`;
- update of the AOT standard to include manifest-trace fields;
- wiring of any new mandatory fields into the hook chain.

### What is out of scope for AOT-T2 (and later)

- OS-level file modification proof;
- proof that no external process added files outside the changed set;
- agent computer-control permission enforcement;
- provider-internal execution logs;
- Windows Security Audit or Sysmon integration;
- endpoint telemetry.

### Claim boundary for manifest-trace

A manifest-trace gate proves that the changed file set at worker return matches
the declared expected manifest. It does NOT prove: who operated the physical
machine; that no process outside git modified files; that the expected manifest
itself is complete or correct; or that the worker's internal reasoning is
bounded. These require OS-level or endpoint-level mechanisms outside CVF scope.

---

## Co-Work Trace Coverage Matrix

Co-work agents are Codex (dispatcher/reviewer) and Claude (worker) operating
in a `MULTI_AGENT_MULTI_ROLE` sequence. The current trace coverage for each
agent role is mapped below.

| Co-work role | Trace block present | Agent-type field | Invocation-ID field | Expected manifest field | Diff-scope guard | Current coverage state |
| --- | --- | --- | --- | --- | --- | --- |
| Codex dispatcher (work order author) | REQUIRED by `TRACE_ARTIFACT_PREFIXES` on `docs/work_orders/` | NOT PRESENT in `TRACE_REQUIRED_LABELS` | NOT PRESENT | NOT PRESENT | NOT PRESENT | PARTIAL - actor and approval boundary are present; agent-type and invocation-ID are absent |
| Claude worker (worker return) | REQUIRED by `TRACE_REVIEW_TRIGGERS` on `docs/reviews/` with worker keywords | NOT PRESENT | NOT PRESENT | NOT PRESENT | NOT PRESENT | PARTIAL - same as above |
| Codex reviewer (completion review) | REQUIRED by `TRACE_REVIEW_TRIGGERS` on `docs/reviews/` with completion keywords | NOT PRESENT | NOT PRESENT | NOT PRESENT | NOT PRESENT | PARTIAL - same as above |

### What agent-type and invocation-ID fields would add

- `Agent type` field: `Codex`, `Claude`, `claude-sonnet-4-6`, `codex-mini`, or
  `operator`. Provides a durable label for multi-agent attribution inside the
  repo, without requiring OS audit.
- `Invocation or session ID` field: session commit hash range, CLI session ID,
  or `N/A with reason`. Binds a trace block to a specific agent execution
  window; useful for audit and rollback boundary.

These fields can be added to `TRACE_REQUIRED_LABELS` by a later implementation
work order. They are repo-local fields only and do NOT claim OS-level identity.

### Supervision boundary for co-work

CVF supervises co-work agents by requiring each agent to leave a trace block
in the artifacts it authors or modifies. Supervision is:

- PRESENT for file-level change detection (trace block required);
- PRESENT for protected-path delete/rename detection;
- ABSENT for agent-type differentiation in the trace;
- ABSENT for manifest-delta enforcement (which files were expected vs actual);
- ABSENT for diff-scope guard (are the declared paths factually accurate).

These three absent capabilities are the primary AOT-T2 targets.

---

## Protected Path And Delete/Rename Coverage

### Current protected prefix list (source: checker line 58)

```
.github/
AGENTS.md
CVF_SESSION/
CVF_SESSION_MEMORY.md
docs/baselines/
docs/reference/
docs/reviews/
docs/roadmaps/
docs/work_orders/
governance/compat/
```

### Current enforcement behavior

- Delete (`D`) and rename (`R`) statuses on any path under these prefixes
  trigger a `Deletion or rename disposition` requirement.
- Add (`A`) statuses on protected prefixes do NOT trigger a violation under
  the current checker. A worker adding a new file to `docs/baselines/` or
  `governance/compat/` would not be blocked by the current trace gate.
- The AOT standard (line 101) notes: "The checker may expand this list later
  through a separate governed work order."

### AOT-T2 gap: unexpected protected-path adds

A worker that adds an unauthorized file to a protected directory (e.g.,
creating a fake `docs/baselines/CVF_GC018_UNAUTHORIZED.md`) would:

- NOT trigger the current `protected_delete_or_rename_paths` check (only D/R);
- be visible in `git status --short` (untracked) and `find_trace_violations`
  would surface it IF that file is a trace artifact with trigger words;
- but NOT be blocked if the unauthorized file does not contain trigger words.

A future `TRACE_REQUIRED_LABELS` extension or a new `PROTECTED_ADD_LABELS`
check could detect unexpected adds. This design is for AOT-T2 planning only.

### Recommended future protected-add detection

A `protected_unexpected_add_paths` function parallel to
`protected_delete_or_rename_paths` that flags `A` statuses under protected
prefixes unless the path appears in a work order's Write Ownership or expected
manifest. This would require the expected-manifest design above to be
implemented first.

---

## Negative Search And Collision Discipline

Search roots: `governance/compat/` (primary); repo root (secondary).
Search commands: `rg "expected.manifest" .`; `rg "TRACE_REQUIRED_LABELS" governance/compat/`; `rg "expected manifest" governance/compat/check_agent_operation_trace.py`.
Coverage: source, tests, docs, JSON, session state, scripts all checked.

Absent-versus-collision token disposition table:

| Token | Claim | Non-authoritative occurrence record | Absent-vs-collision disposition |
| --- | --- | --- | --- |
| `expected-manifest` | absent as a runtime field, checker field, or schema key | non-authoritative occurrence confirmed: appears in active session state `nextAllowedMove` entry and in FPC-T3 C07 protected-path design notes as a planning label | ABSENT AS RUNTIME OR CHECKER FIELD; same-token occurrences are governance planning labels only, not implemented fields; negative claim binding for runtime and checker scope |
| `expected manifest` (without hyphen) | absent as a field in `TRACE_REQUIRED_LABELS` | non-authoritative occurrence: may appear in planning docs; confirmed absent from `TRACE_REQUIRED_LABELS` in checker | ABSENT AS CHECKER FIELD; not a search target for runtime schema; negative claim binding for checker-field scope |
| `Manifest delta` | absent as a checker function or label | confirmed absent from `check_agent_operation_trace.py` | ABSENT AS IMPLEMENTATION; planning-label only in this document; negative claim binding |
| `UNAUTHORIZED_ADDITION` | absent as a checker status token | confirmed absent from `check_agent_operation_trace.py` | ABSENT AS IMPLEMENTATION; design-label only in this document; negative claim binding |
| `MISSING_DELIVERABLE` | absent as a checker status token | confirmed absent from `check_agent_operation_trace.py` | ABSENT AS IMPLEMENTATION; design-label only in this document; negative claim binding |
| `agent type` field | absent from `TRACE_REQUIRED_LABELS` | confirmed absent from checker line 27-40; field label not present | ABSENT AS ENFORCED FIELD; design candidate only in this plan; negative claim binding |
| `invocation` field label | absent as a required label in `TRACE_REQUIRED_LABELS` | `Session or invocation` IS present in `TRACE_REQUIRED_LABELS` as an existing label; the `invocation-ID` as a standalone mandatory field is absent | PARTIAL COVERAGE; `Session or invocation` field covers session range; dedicated `invocation-ID` enforcement is absent as a separate field; design candidate for AOT-T2 |
| `protected_unexpected_add_paths` | absent as a function in `check_agent_operation_trace.py` | confirmed absent from checker | ABSENT AS IMPLEMENTATION; design candidate in this plan; negative claim binding |

---

## Candidate Ranking

Ranking factors: enforcement gap severity, repeated-defect risk, deterministic-test
availability, false-positive risk, dependency on other candidates.

| Candidate ID | Candidate name | Enforcement gap severity | Repeated-defect risk | Earliest phase | False-positive risk | Deterministic-test available | Recommended disposition | Priority rank |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AOT-T2-C01 | Expected-manifest trace fields (`Expected manifest`, `Actual changed set`, `Manifest delta`) added to `TRACE_REQUIRED_LABELS` and enforced in `find_trace_violations` | HIGH - planned-vs-actual reconciliation is the largest single gap; directly addresses WORKER_MUST_NOT_COMMIT boundary verification | HIGH - workers routinely add unexpected files that are visible only via `git status --short` discipline, not machine check | reviewer-fast and pre-commit | MEDIUM - `N/A with reason` escape required for single-known-file hotfixes and trivial mechanical tasks | AVAILABLE - manifest-delta is a set comparison; fixtures are easy to author | `IMPLEMENT_FIRST_CANDIDATE` (plan only; implementation in separate tranche) | 1 (highest) |
| AOT-T2-C02 | Agent-type and invocation-ID fields added to `TRACE_REQUIRED_LABELS` | MEDIUM - multi-agent attribution is important but the `Actor` field partially covers it; bounded defect risk | MEDIUM - multi-agent sessions (Codex + Claude) will increase; without agent-type differentiation, audit attribution is weak | reviewer-fast | LOW - agent-type is a controlled set; false-positive risk is low if an `OTHER` escape is allowed | AVAILABLE - enum check on agent-type values is deterministic | `IMPLEMENT_AFTER_PREREQUISITE` (after AOT-T2-C01; both fields can ship together) | 2 |
| AOT-T2-C03 | Protected unexpected-add detection (`protected_unexpected_add_paths` function) | MEDIUM - current checker only detects D/R; unexpected A in protected dirs is undetected | MEDIUM - a misbehaving worker could create unauthorized governance files; risk increases with more multi-agent work | pre-commit | MEDIUM - requires expected-manifest (C01) to avoid flagging every legitimate new governed file | AVAILABLE once C01 provides expected-manifest; standalone version possible but higher false-positive rate | `IMPLEMENT_AFTER_PREREQUISITE` (after C01 provides expected-manifest anchor) | 3 |
| AOT-T2-C04 | Diff-scope guard: verify that `Diff evidence` field content factually matches actual changed-file set | LOW-MEDIUM - current gap allows `Diff evidence` to contain a command name without capturing the actual diff output | LOW - workers currently follow discipline; gap would only matter if a worker fabricated the field value | reviewer-fast | LOW - comparison is between field content and actual git output | AVAILABLE but requires parsing the trace block field value | `CHECKER_EXTENSION_LATER` (lower priority; discipline covers this today) | 4 |

---

## Recommended First Implementation Tranche

**Recommendation: AOT-T2-C01 (expected-manifest trace fields) as a single
implementation tranche.**

Rationale:

1. AOT-T2-C01 closes the largest enforcement gap in the current AOT-T1
   system: a worker can return with an unexpected file set and the trace gate
   will not catch it unless the unexpected files happen to be trace artifacts
   with trigger words.
2. AOT-T2-C01 is a prerequisite for AOT-T2-C03 (protected unexpected-add
   detection): once the expected-manifest field exists, C03 can compare against
   it instead of maintaining a separate manifest registry.
3. The implementation is bounded: three new fields in `TRACE_REQUIRED_LABELS`,
   manifest-delta logic in `find_trace_violations`, and deterministic fixture
   tests. No runtime, provider, OS audit, or session-state changes required.
4. False-positive risk (MEDIUM) is manageable with an `N/A with reason` escape
   for trivial single-file tasks where no work order defines a manifest.
5. AOT-T2-C02 (agent-type/invocation-ID) can ship in the same tranche as C01
   since both require changes to `TRACE_REQUIRED_LABELS`; this avoids two
   separate hook-chain re-wiring events.

**Scope of the recommended tranche (C01 + C02 combined):**

- Add `Expected manifest` field to `TRACE_REQUIRED_LABELS` (with `N/A with
  reason` escape for trivial tasks).
- Add `Actual changed set` field to `TRACE_REQUIRED_LABELS`.
- Add `Manifest delta` field to `TRACE_REQUIRED_LABELS` with accepted values:
  `MATCH`, `MISSING_DELIVERABLE: <path>`, `UNAUTHORIZED_ADDITION: <path>`,
  `N/A with reason: <reason>`.
- Add `Agent type` field to `TRACE_REQUIRED_LABELS` with accepted values:
  `Codex`, `Claude`, `operator`, `OTHER: <description>`.
- Implement manifest-delta comparison in `find_trace_violations`:
  compare parsed `Expected manifest` and `Actual changed set` field values;
  emit violation for `MISSING_DELIVERABLE` or `UNAUTHORIZED_ADDITION`.
- Add 4 regression tests: manifest-match pass, missing-deliverable violation,
  unauthorized-addition violation, `N/A with reason` pass.
- Update AOT standard to document the new required fields.
- Existing 6 regression tests must continue to pass after the addition.

**This tranche requires a separate Codex-authorized work order before execution.**

AOT-T2-C03 and C04 are deferred to later tranches (C03 after C01 manifest
anchor is implemented; C04 is low-priority discipline-covered gap).

---

## Claim Boundary

This coverage plan defines planning priority and implementation sequencing for
AOT-T2 checker hardening candidates. It does not:

- implement any checker field, function, or test;
- mutate `governance/compat/check_agent_operation_trace.py`,
  `test_check_agent_operation_trace.py`, or any hook chain file;
- mutate the AOT standard or session state;
- prove checker design correctness or semantic truth;
- prove OS-level attribution, physical-machine identity, or agent
  computer-control safety;
- authorize AOT-T2 implementation or any downstream use-case work;
- authorize public-sync;
- make production, public, readiness, cost, or quality claims;
- release raw memory (`rawMemoryReleased=false`);
- constitute autonomous mutation.

The recommended first tranche requires a separate Codex-authorized work order
before any implementation begins.

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Claude (worker) |
| Provider or surface | Claude Code CLI / VSCode extension |
| Session or invocation | AOT-T2 worker session from dispatch base `ce369ab6`; execution HEAD `9581a2e3` |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Required first-read file review, PowerShell pre-flight checks, ripgrep source searches, Markdown authoring |
| Target paths | `docs/reference/CVF_AOT_T2_EXPECTED_MANIFEST_TRACE_COVERAGE_PLAN_2026-06-13.md`; `docs/reviews/CVF_AOT_T2_EXPECTED_MANIFEST_TRACE_WORKER_RETURN_2026-06-13.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_AOT_T2_EXPECTED_MANIFEST_TRACE_COVERAGE_PLAN_FOR_CLAUDE_2026-06-13.md`; `docs/baselines/CVF_GC018_AOT_T2_EXPECTED_MANIFEST_TRACE_COVERAGE_PLAN_2026-06-13.md`; active session state next allowed move |
| Before status evidence | Worker recorded clean `git status --short` and HEAD `9581a2e3` before work |
| After status evidence | Worker return submitted with the two expected untracked planning artifacts only |
| Diff evidence | New planning artifacts only: this coverage plan and the paired worker-return packet |
| Approval boundary | Operator authorized Codex to select next roadmap and create the Claude work order; Claude operated under `WORKER_MUST_NOT_COMMIT` |
| Claim boundary | Repo-local trace planning only; no OS-level user attribution, endpoint telemetry, provider-internal logs, physical-machine identity, runtime behavior, or public-sync claim |
| Deletion or rename disposition | N/A with reason: no protected path was deleted or renamed during the worker session |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance AOT-T2 planning artifact. Public-sync is not
authorized by this work order or GC-018.

rawMemoryReleased=false
