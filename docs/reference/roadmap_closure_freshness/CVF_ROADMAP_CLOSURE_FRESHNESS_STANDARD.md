# CVF Roadmap Closure Freshness Standard

Memory class: FULL_RECORD

Status: ACTIVE STANDARD

docType: reference-standard

rawMemoryReleased: false

## Purpose

This standard prevents a repeated CVF governance drift class: a roadmap is
closed or closure-bounded in one surface, while another same-file roadmap
surface still advertises an older ready, dispatch, or mismatched closed status.

The standard is intentionally narrow. It makes same-file closure state
machine-checkable without asking a guard to infer every historical cross-roadmap
relationship in the repository.

## Central Rule

When a changed active roadmap includes both:

- a top-of-file `Status:` line; and
- a `## Machine Closure Package` row for `Roadmap state` that refers to the
  same roadmap file,

the Machine Closure Package evidence must cite the exact same `Status:` value
as the top-of-file line.

Do not retype a roadmap's expected status from memory. Copy it from the actual
top-of-file `Status:` line after the final closure/status decision is made.

## Applies To

This standard applies to changed active roadmap files under:

`docs/roadmaps/`

It applies when the changed roadmap has a Machine Closure Package self-reference
using any of:

- the full repo-relative roadmap path;
- the roadmap filename;
- `this file`;
- `this roadmap`.

## Does Not Apply

This standard does not force a Machine Closure Package onto every old roadmap.
It does not scan archived roadmaps. It does not infer cross-file closure facts
from session memory, review packets, or chat history.

Existing closed artifacts are not reopened solely to satisfy this standard.
The rule is forward-only and applies to files already being changed.

## Machine Guard

Guard:

`governance/compat/check_roadmap_closure_freshness.py`

Required hook surfaces:

- reviewer-fast;
- pre-commit;
- pre-push;
- autorun common bundle for pre-dispatch, pre-implementation, pre-closure, and
  pre-push phases.

The guard is a Central Core machine check. Individual roadmaps remain Local
Views that record tranche-specific status, scope, and closure evidence.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action | Worker blame |
|---|---|---|---|---|---|
| Roadmap Machine Closure Package self-reference can drift from the roadmap's own top `Status:` line | `ORCHESTRATOR_PACKET_GAP` | `GOVERNANCE_CONTROL_PLANE` | `MACHINE_CHECK_ADDED` | Keep the guard narrow and range-aware; broaden only after source-backed false-negative evidence | `N/A_WITH_REASON`: this is repeated closure-surface duplication drift across batches |

## Claim Boundary

This standard governs roadmap closure freshness only. It does not authorize
runtime behavior, provider calls, public-sync, registry mutation, product
runtime changes, production readiness, public readiness, or broad historical
cleanup.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/implementer/closer |
| Provider or surface | Codex local workspace |
| Session or invocation | 2026-06-18 GFC-T4 roadmap closure freshness standard authoring |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, apply_patch |
| Target paths | `docs/reference/roadmap_closure_freshness/CVF_ROADMAP_CLOSURE_FRESHNESS_STANDARD.md`; `docs/reference/roadmap_closure_freshness/README.md`; `governance/compat/check_roadmap_closure_freshness.py`; `governance/compat/run_agent_autorun_workflow_gate.py`; `governance/compat/run_local_governance_hook_chain.py` |
| Allowed scope source | operator asked Codex to process GFC-T4 machine/template follow-up |
| Before status evidence | GFC-T3 closure continuity commit `0560f525` |
| After status evidence | roadmap closure freshness standard authored, pending material commit |
| Diff evidence | `git diff --name-status` |
| Approval boundary | pre-runtime governance foundation closeout only |
| Claim boundary | no runtime/provider/live/public/registry/product claim |
| Agent type | Codex reviewer/implementer/closer |
| Invocation ID | `gfc-t4-roadmap-freshness-standard-codex-2026-06-18` |
| Expected manifest | `docs/reference/roadmap_closure_freshness/CVF_ROADMAP_CLOSURE_FRESHNESS_STANDARD.md`; `docs/reference/roadmap_closure_freshness/README.md`; `governance/compat/check_roadmap_closure_freshness.py`; `governance/compat/run_agent_autorun_workflow_gate.py`; `governance/compat/run_local_governance_hook_chain.py` |
| Actual changed set | `docs/reference/roadmap_closure_freshness/CVF_ROADMAP_CLOSURE_FRESHNESS_STANDARD.md`; `docs/reference/roadmap_closure_freshness/README.md`; `governance/compat/check_roadmap_closure_freshness.py`; `governance/compat/run_agent_autorun_workflow_gate.py`; `governance/compat/run_local_governance_hook_chain.py` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |
