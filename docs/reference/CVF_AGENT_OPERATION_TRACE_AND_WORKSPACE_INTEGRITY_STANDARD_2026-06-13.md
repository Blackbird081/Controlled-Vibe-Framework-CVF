# CVF Agent Operation Trace And Workspace Integrity Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

docType: reference_standard

Date: 2026-06-13

Owner: Codex

rawMemoryReleased=false

## Purpose

Define the repo-local evidence that CVF requires when agents or provider
surfaces execute governed work.

CVF does not develop `codex_cowork`, `claude_cowork`, agent computer-control
surfaces, operating-system audit tooling, endpoint monitoring, or provider
runtime features. Those capabilities belong to their platform providers and to
operator-selected infrastructure.

CVF's core responsibility is control-plane supervision: when an agent/provider
surface performs governed work, the work must leave enough evidence for review,
scope validation, rollback, and bounded attribution inside the repository.

## Scope / Target / Owner Boundary

In scope:

- repo-local operation trace evidence for work orders, worker returns, and
  completion reviews;
- changed-path evidence from `git status --short` and `git diff --name-status`;
- detection of protected governed path deletion or rename in changed ranges;
- explicit claim boundaries separating repo evidence from OS-level identity or
  endpoint audit claims.

Out of scope:

- Windows Security Audit policy configuration;
- Sysmon, EDR, file watcher services, or endpoint telemetry installation;
- destructive broker design;
- agent computer-control permission changes;
- provider platform feature development;
- proof of who physically used the machine;
- proof that no external process modified the filesystem outside repo-visible
  evidence.

## Rule

Any changed work order, worker-return packet, or completion review that acts as
agent execution evidence must include an `Agent Operation Trace Block`.

The block must be filled with command, path, or artifact evidence where
available. `N/A with reason` is allowed only when the field truly cannot apply
to the work being closed.

Protected governed path deletion or rename must be visible in the trace block
through a `Deletion or rename disposition` row before the work may pass the
agent-operation trace gate.

## Required Agent Operation Trace Block

```text
## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | <agent/operator/provider role> |
| Provider or surface | <Codex, Claude, CLI, IDE tab, MCP, browser, etc.> |
| Session or invocation | <session id, commit range, or N/A with reason> |
| Working directory | <cwd or repo root> |
| Command or tool surface | <commands/tools used; safe summaries allowed> |
| Target paths | <changed or intended paths> |
| Allowed scope source | <operator instruction, roadmap, GC-018, work order> |
| Before status evidence | <git status --short, base HEAD, or N/A with reason> |
| After status evidence | <git status --short or closure status evidence> |
| Diff evidence | <git diff --name-status / committed range> |
| Approval boundary | <what was authorized and by whom/source> |
| Claim boundary | <repo-local trace only; no OS/user attribution unless separately proven> |
| Agent type | <Codex | Claude | operator | OTHER: description> |
| Invocation ID | <session id, commit range, provider invocation label, or N/A with reason> |
| Expected manifest | <semicolon-separated list of planned paths, or N/A with reason> |
| Actual changed set | <semicolon-separated list of actual changed/untracked paths, or N/A with reason> |
| Manifest delta | <MATCH | MISSING_DELIVERABLE: path | UNAUTHORIZED_ADDITION: path | N/A with reason> |
| Deletion or rename disposition | <required only when protected paths are deleted/renamed; otherwise N/A with reason> |
```

## AOT-T2 Fields: Agent Attribution And Manifest Reconciliation

### Agent Type And Invocation ID (AOT-T2-C02)

`Agent type` must identify the executing agent or operator:

- `Codex` - Codex agent executing governed work;
- `Claude` - Claude agent executing governed work;
- `operator` - human operator executing governed work;
- `OTHER: <description>` - any other surface.

`Invocation ID` may be a session identifier, commit range, provider invocation
label, or `N/A with reason`. This is repo-local attribution only. It does not
claim OS-level user identity, endpoint telemetry, or provider-internal logs.

### Expected Manifest And Manifest Delta (AOT-T2-C01)

`Expected manifest` records the paths the worker is authorized to create or
modify per the work order or GC-018.

`Actual changed set` records the paths observed in `git status --short` or
`git diff --name-status` after implementation.

`Manifest delta` must be:

- `MATCH` when the expected manifest equals the actual changed set;
- `MISSING_DELIVERABLE: <path>` when an expected path is absent from the
  actual changed set;
- `UNAUTHORIZED_ADDITION: <path>` when an actual changed path is not in the
  expected manifest;
- `N/A with reason` only when the trace artifact is not a worker-return or
  work-order governed execution packet, and all manifest fields record the
  same N/A reason.

The checker enforces manifest delta when the expected manifest field contains
at least one parsed path. The trace artifact file itself is excluded from
the comparison only when the expected manifest does not name it. `Actual
changed set` must match the repo-local changed paths observed by the checker
for the selected range.

### Dispatch Manifest Scope Discipline (AOT-T3)

For dispatch work orders, the Agent Operation Trace `Expected manifest` and
`Actual changed set` describe the dispatch batch itself. They must not include
future execution artifacts merely because the work order authorizes them.

Future source, test, decision, worker-return, and completion paths belong in
work-order sections such as `Write Ownership`, `Expected Deliverables`,
`Required Artifact Manifest`, or acceptance criteria. The checker treats those
sections as execution intent, not as dispatch changed-set evidence.

If a dispatch work order places a future execution path in the trace
`Expected manifest`, the checker reports `DISPATCH_SCOPE_VIOLATION`. This is a
dispatch-authoring defect, even when the same path is correctly listed in
`Write Ownership`.

### Worker-Authored Reference Deliverable Trace Eligibility

Changed files under `docs/reference/` require a trace block only when
worker or execution trigger vocabulary is present in the file:

- `WORKER_RETURN`, `WORKER_MUST_NOT_COMMIT`, `WORKER_MAY_COMMIT`;
- `WORKER_RETURN_SUBMITTED_UNCOMMITTED`, `COMPLETE_PENDING_REVIEW`;
- `Worker:`, `completion_review`, `Owner / reviewer`;
- `Machine Closure Package`, `Closure Diff Gate`.

A standard or reference document without these triggers is not required to
carry a trace block.

### Non-Goals

These fields and the manifest checker do not prove:

- OS-level user attribution;
- endpoint telemetry or provider-internal logging;
- physical machine identity;
- that no external process modified the filesystem outside repo-visible evidence;
- production or public readiness.

## Protected Repo-Local Integrity Surface

The protected repo-local surface includes:

- `.github/`;
- `AGENTS.md`;
- `CVF_SESSION/`;
- `CVF_SESSION_MEMORY.md`;
- `docs/baselines/`;
- `docs/reference/`;
- `docs/reviews/`;
- `docs/roadmaps/`;
- `docs/work_orders/`;
- `governance/compat/`.

The checker may expand this list later through a separate governed work order.

## Enforcement

Machine checker:

`governance/compat/check_agent_operation_trace.py`

Focused tests:

`governance/compat/test_check_agent_operation_trace.py`

Initial hook placement:

- `reviewer-fast`;
- `pre-commit`;
- `pre-push`;
- autorun common phase gates.

The checker operates on changed files and changed ranges. It does not scan
every historical artifact for retroactive compliance.

## Claim Boundary

This standard proves only repo-local trace completeness and protected-path
visibility in changed ranges. It does not prove OS-level user attribution,
provider-internal action logs, endpoint telemetry, physical machine identity,
or the absence of external filesystem events.

OS-level attribution requires a separate operator decision and a separate
control surface outside this standard.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance governance-control standard. Public-sync is not
authorized by this batch.

rawMemoryReleased=false
