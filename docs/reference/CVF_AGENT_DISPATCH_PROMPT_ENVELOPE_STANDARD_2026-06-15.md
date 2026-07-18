# CVF Agent Dispatch Prompt Envelope Standard

Memory class: POINTER_RECORD

Status: ACTIVE STANDARD

Date: 2026-06-15

Standard ID: CVF-ADPES-2026-06-15

## Purpose

This standard defines the canonical format for the short runtime prompt that
accompanies a CVF work order when work is delegated across agents or when one
agent switches roles within a session.

A dispatch prompt envelope is a concise cover note. It reduces transfer errors
by surfacing current-time execution facts that the work order cannot know in
advance: which agent is active now, what the current HEAD is, whether a live key
has been authorized, and exactly what the return contract expects.

The prompt envelope does not replace the work order. The work order remains the
governed source of truth for scope, authority chain, source verification, and
forbidden actions. The envelope may not add scope, override the work order,
bypass source verification, or introduce hidden authority.

## Applies To

- Multi-agent handoffs where one orchestrator dispatches to a worker agent;
- single-agent multi-role sessions where one agent switches from orchestrator to
  worker, or from worker to reviewer;
- any CVF work order marked `DISPATCH_READY` or `DISPATCHED_TO_WORKER`.

## Required Fields

A dispatch prompt envelope must include all of the following fields, or record
`N/A with reason` for any field that does not apply to this dispatch:

| Field | Purpose | Required? |
|---|---|---|
| Role | Which role this agent plays (worker/implementer, reviewer/closer, orchestrator) | Yes |
| Canonical packet | Repo-relative path to the governing work order | Yes |
| Commit mode | `WORKER_MAY_COMMIT` or `WORKER_MUST_NOT_COMMIT` | Yes |
| executionBaseHead | The current `git rev-parse --short HEAD` at worker start | Yes |
| Current-time notes | Any overrides, constraints, or context not visible in the work order (live-key authorization, negative-sample boundaries, credential status, etc.) | Yes, or N/A with reason |
| Do-not-misread notes | Explicit corrections for common misreadings (e.g., which scope is forbidden, which step comes first) | Yes, or N/A with reason |
| Required first actions | Ordered list of documents or commands the agent must read/run before any other action | Yes |
| Return contract | Exact return token(s) expected (`COMPLETE_PENDING_REVIEW`, `BLOCKED_WITH_REASON`, etc.) with the evidence required in the return message | Yes |

## Envelope Placement

The dispatch prompt envelope must appear in the work order under a
`## Dispatch Prompt Envelope` section. For delegated or role-switching
dispatch-ready work orders, this section is a read-first cover note: it must be
the first `##` section in the file, appear before `## Purpose`, appear before
`## 1. Mission` or `## Mission`, and begin no later than line 25. Minimal
metadata such as title, memory class, status, owner, and base-head fields may
appear above it, but no prose section may precede it. This placement rule
exists because the envelope carries the worker's current role, commit mode,
first actions, and return contract; placing it after the long execution packet
or after purpose prose weakens its purpose.

The section must contain either:

1. A fenced code block with all required fields; or
2. A structured table or list with all required fields; or
3. An explicit `N/A with reason` when no runtime agent delegation or role-switch
   prompt will be issued for this work order (e.g., the operator executes
   directly, or the work order is a planning-only artifact).

Placement of `N/A with reason` must name the specific reason (e.g., "operator
executes directly; no agent handoff is expected for this batch").

Forward-only migration rule: existing closed work orders are not reopened solely
to move an envelope upward. New or changed dispatch-ready delegated work orders
must use the read-first placement.

## Prohibited Content

A dispatch prompt envelope must not:

- add scope beyond what the work order authorizes;
- override the work order's Allowed Scope, Forbidden Scope, or Source
  Verification findings;
- claim live governance proof, public readiness, production readiness, or
  runtime behavior not established by the canonical packet;
- include raw API keys, secrets, or credential values;
- introduce new authority claims not traceable to the work order's Authority
  Chain.

If a dispatch prompt contains any prohibited content, the dispatch author fast
gate checker must reject the work order.

## Machine Check

The machine gate for this standard is:

`governance/compat/check_dispatch_prompt_envelope.py`

This checker runs as part of the dispatch packet author fast gate:

`governance/compat/run_dispatch_packet_author_fast_gate.py`

A dispatch-ready work order that lacks a `## Dispatch Prompt Envelope` section
with the required fields, puts it below the read-first placement boundary, puts
any other `##` section before it, puts it after `## Purpose`, or uses no
explicit `N/A with reason`, fails the gate and must be kept in `HOLD` or
`DRAFT` until corrected.

## Envelope Template

Copy and complete this block inside the work order's `## Dispatch Prompt Envelope` section:

```text
Role: <worker/implementer | reviewer/closer | orchestrator>. <Co-role agent> is <other role>.
Canonical packet: <repo-relative path to work order>.
Commit mode: <WORKER_MAY_COMMIT | WORKER_MUST_NOT_COMMIT>.
Base: executionBaseHead <captured with git rev-parse --short HEAD at worker start>.
Current-time notes: <live-key authorization status, negative-sample boundary, credential
  status, or any current-time override not visible in the work order; or N/A with reason>.
Do-not-misread notes: <corrections for common misreadings, scope clarifications,
  step-order reminders; or N/A with reason>.
Required first actions: read <doc1>, <doc2>, ..., then run <command or N/A>.
Return contract: <COMPLETE_PENDING_REVIEW | BLOCKED_WITH_REASON> with <exact evidence
  required: changed paths, executionBaseHead, tests/gates run, HEAD unchanged>.
```

## Relationship To Other Standards

- The work order template (`docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`)
  requires a `## Dispatch Prompt Envelope` section. This standard defines what
  that section must contain.
- The dispatch packet author fast gate
  (`governance/compat/run_dispatch_packet_author_fast_gate.py`) wires this
  standard into the early authoring gate chain.
- The single-agent multi-role control standard
  (`docs/reference/CVF_SINGLE_AGENT_MULTI_ROLE_CONTROL_STANDARD_2026-06-11.md`)
  governs the broader role-separation contract of which this envelope is one
  component.
- The commit steward protocol
  (`docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md`)
  separates material and session-sync commits; the envelope must not conflate
  these phases.

## Verification

Evidence of standard compliance is established when:

- the dispatch-ready work order includes a `## Dispatch Prompt Envelope` section;
- the envelope is the first `##` section and appears before `## Purpose`;
- the section contains all required fields or explicit `N/A with reason`
  per-field;
- `check_dispatch_prompt_envelope.py` passes on the work order file;
- the dispatch packet author fast gate passes on the full dispatch range.

## Epistemic Process Block

Epistemic Process Applicability: EPISTEMIC_PROCESS_NA_WITH_REASON: canonical governance standard definition; no empirical claim, corpus classification, risk-model update, or evidence-comparison work is asserted. The standard defines contract vocabulary and prohibited actions; it does not predict or compare runtime evidence.

Expected Result / Prediction: N/A - standard definition artifact.

Evidence Comparison Requirement: N/A with reason: no empirical prediction to compare.

Contradiction Or Gap Disposition: N/A with reason: no contradictory evidence surface for a contract-definition document.

Claim Update Requirement: N/A with reason: no claim was predicted; no update is required.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex orchestrator/reviewer |
| Provider or surface | Codex local workspace |
| Session or invocation | 2026-06-18 prompt envelope first-section placement hardening |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, apply_patch, pytest |
| Target paths | prompt-envelope standard, work-order template, template family index, checker, tests, finding review |
| Allowed scope source | operator requested prompt placement finding remediation before Claude worker-return review |
| Before status evidence | base `8ce54d6b` |
| After status evidence | first-section placement rule and tests authored; pending material commit |
| Diff evidence | `git diff --name-status`; `git status --short` |
| Approval boundary | authoring-time dispatch prompt envelope placement only; no runtime/provider/live/public scope |
| Claim boundary | repo-local trace only; no OS/user attribution |
| Agent type | Codex orchestrator/reviewer |
| Invocation ID | `prompt-read-first-placement-finding-2026-06-18` |
| Expected manifest | `docs/reference/CVF_AGENT_DISPATCH_PROMPT_ENVELOPE_STANDARD_2026-06-15.md`; `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`; `docs/reference/work_order_template/README.md`; `governance/compat/check_dispatch_prompt_envelope.py`; `governance/compat/test_check_dispatch_prompt_envelope.py`; `docs/reviews/CVF_PROMPT_READ_FIRST_PLACEMENT_FINDING_2026-06-18.md` |
| Actual changed set | `docs/reference/CVF_AGENT_DISPATCH_PROMPT_ENVELOPE_STANDARD_2026-06-15.md`; `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`; `docs/reference/work_order_template/README.md`; `governance/compat/check_dispatch_prompt_envelope.py`; `governance/compat/test_check_dispatch_prompt_envelope.py`; `docs/reviews/CVF_PROMPT_READ_FIRST_PLACEMENT_FINDING_2026-06-18.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

Disposition: DEFERRED_PRIVATE_ONLY

Reason: private provenance governance standard. No public-sync batch is
authorized.

## Claim Boundary

This standard defines an authoring-time governance contract for dispatch prompt
envelopes. It does not prove runtime agent behavior, provider behavior,
cross-agent memory transfer, hosted freshness, production readiness, or
public readiness.
