# CVF Agent Error To Governance Learning Philosophy

Memory class: POINTER_RECORD

Status: BINDING_GOVERNANCE_PHILOSOPHY

docType: reference

Date: 2026-05-28

---

## Purpose

Define how CVF learns from agent mistakes in mixed-agent workflows.

This philosophy exists because CVF is not built on trust in a single model,
worker, reviewer, or orchestrator. CVF is built so a non-coder can trust the
governance layer that controls those agents.

## Scope / Target / Owner Boundary

Target: CVF agent governance, mixed-agent orchestration, review findings,
work-order hardening, machine-gate hardening, and autorun phase-gate placement.

Owner: CVF governance control chain. This includes Orchestrator packet design,
Reviewer finding classification, machine guard implementation, autorun workflow
control, and session-continuity updates.

Boundary: this philosophy does not authorize runtime behavior, provider
behavior, public claims, new worker pools, hidden memory transfer, or live
subagent enforcement. It defines how observed defects should be absorbed into
CVF governance.

## Scope / Applies-To

This philosophy applies whenever CVF evaluates a meaningful agent defect in:

- roadmap or work-order authoring;
- delegated worker execution;
- source verification;
- closure review;
- live-proof scoping;
- public-sync preparation;
- session continuity;
- mixed-agent operator workflows.

It applies equally to Claude, Codex, Gemini, cheaper workers, stronger workers,
or any future agent/client surface.

## Core Philosophy

Every repeated agent error is a training sample for the governance layer, not
only a failure of the worker that happened to expose it.

When an agent makes a mistake, CVF must ask what control was missing:

- Was the work order ambiguous?
- Was the source fact unverifiable?
- Was the closure claim too easy to assert by hand?
- Did the machine gate run too late?
- Did the phase workflow allow a worker to continue after a defect should have
  returned to Orchestrator?

The answer becomes governance improvement work.

## Escalation Ladder

Use this ladder when reviewing a meaningful or repeated agent defect:

| Defect pattern | CVF response |
| --- | --- |
| One-off misunderstanding | clarify the work order or completion note |
| Repeated ambiguity | promote the expectation into a written rule |
| Rule still open to interpretation | promote the rule into a machine check |
| Machine check only catches the issue at the end | move the check into the earliest applicable autorun phase gate |
| Agent mix creates uneven compliance | make the Orchestrator packet and gate evidence model-agnostic |

The goal is not to find a perfect worker. The goal is to make the workflow
resilient when workers vary in model, cost, capability, memory, and style.

Concrete examples from connector-wave hardening:

- if a worker bundles unrelated archive cleanup into a tranche, promote
  "Allowed scope must match changed files" into a diff gate;
- if a final-tranche reviewer closes a whole wave, promote "whole-wave closure
  needs whole-wave range evidence" into the closure gate;
- if an agent writes `rawMemoryReleased: false` or `canReinject: boolean` in a
  Source Verification symbol cell, promote symbol hygiene from prose to parser;
- if an agent reports stale "actual line count" evidence, promote line-count
  claims to machine verification.

## Mixed-Agent Operating Rule

CVF must assume operators may choose different agents for planning,
implementation, review, public-sync, or live-proof phases.

Therefore:

- do not encode quality assumptions around one preferred model;
- do not treat Claude, Codex, Gemini, or a cheaper worker as inherently trusted;
- do not blame the worker when CVF failed to provide a clear work order,
  source-verification requirement, phase gate, or closure check;
- do record which failure mode each model exposed, so the governance layer can
  harden against it.

## Non-Coder Trust Boundary

The operator should not need to inspect every diff, table, checklist, or source
claim to know whether a worker followed the process.

The trusted object is the CVF control chain:

- source-verified work order;
- roadmap-to-work-order trace;
- phase-appropriate autorun gate;
- committed diff evidence;
- clean worktree at closure;
- explicit claim boundary;
- active session continuity sync.

If those controls are missing, a worker success claim is not enough.

## Closure Rule

A review finding should not close as "worker error" unless CVF also records why
the governance layer did or did not catch it.

Every material defect should be classified as one or more of:

- `WORKER_EXECUTION_ERROR`
- `ORCHESTRATOR_PACKET_GAP`
- `RULE_GAP`
- `MACHINE_GATE_GAP`
- `PHASE_GATE_PLACEMENT_GAP`
- `OPERATOR_SCOPE_CLARITY_GAP`

If the same class recurs, the next improvement must target the highest
governance layer that can prevent recurrence.

## Claim Boundary

This philosophy does not prove that every agent, client, MCP surface, or hosted
workflow obeys CVF automatically. It defines how CVF must absorb observed
failures into stronger governance, so future mixed-agent operation becomes more
trustworthy over time.
