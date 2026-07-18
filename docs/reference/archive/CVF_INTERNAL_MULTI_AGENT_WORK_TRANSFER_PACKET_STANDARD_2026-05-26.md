# CVF Internal Multi-Agent Work Transfer Packet Standard

Memory class: TEMPLATE_RECORD

docType: reference

Date: 2026-05-26

Status: CANONICAL_TEMPLATE

Contract version: `cvf.internalMultiAgentTransfer.ma1.v1`

## Purpose

Define the English-only packet that CVF uses when an orchestrator transfers
bounded work to role agents, subagents, reviewers, auditors, providers, or
future MCP/API clients.

The packet exists to make internal work transfer precise, auditable, and safe.
It is not a runtime scheduler and does not claim live subagent isolation.

## Scope / Target / Owner Boundary

Owner: CVF internal orchestration and work-transfer protocol.

In scope:

- orchestrator-to-role assignment;
- multi-provider or multi-agent lane handoff;
- role output schema;
- review, dissent, and integration handoff;
- evidence and stop-condition capture.

Out of scope:

- autonomous worker pools;
- live role isolation;
- provider routing;
- secret handling beyond existing CVF rules;
- public-facing non-coder export specs.

## Required Packet Structure

Every MA1 transfer packet must use this structure.

```text
# CVF Internal Multi-Agent Work Transfer Packet - <Topic>

Contract version: cvf.internalMultiAgentTransfer.ma1.v1
Date: <YYYY-MM-DD>
Status: <DRAFT | DISPATCHED | IN_PROGRESS | RETURNED | INTEGRATED | HOLD>

## 0. Surface Fidelity Gate

- Target surface:
- Source code path or governed artifact path:
- Output artifact path or response field:
- Audience:
- Language layer:
- Generation trigger:
- Operator verdict, if any, references this same surface:
- Surface fidelity verdict: <PASS | HOLD>

If any field is unknown, stop before assignment.

## 1. Authority Chain

- Operator instruction:
- Active session mode:
- Active handoff:
- Governing roadmap:
- GC-018 baseline:
- Work order:
- Relevant standards:
- Blocked work classes:

## 2. Transfer Objective

- Outcome required:
- Why this role/lane is needed:
- Definition of done:
- Non-goals:

## 3. Source Packet

- Source artifacts to read:
- Facts already established:
- Assumptions allowed:
- Assumptions forbidden:
- User/operator values that must not be overwritten:

## 4. Role Assignment

| Role lane | Actor/provider/client | Scope | Required output | Forbidden actions |
| --- | --- | --- | --- | --- |
| Orchestrator | | | | |
| Implementer | | | | |
| Reviewer | | | | |
| Auditor | | | | |
| Integrator | | | | |

If one actor holds multiple roles, state the conflict-control method.

## 5. Execution Instructions

- Allowed writes:
- Allowed commands:
- Required tests:
- Live API/provider proof requirement:
- Secret handling:
- Commit expectation:
- Public/provenance boundary:

## 6. Role Output Schema

Each role must return:

- Role name:
- Work performed:
- Evidence:
- Files changed or reviewed:
- Findings:
- Risks:
- Recommended disposition:
- Open questions:

## 7. Dissent And Review Ledger

| Issue | Role position | Counter-position | Evidence | Integrator disposition |
| --- | --- | --- | --- | --- |

Disposition values: `ACCEPT`, `REJECT`, `MERGE`, `DEFER`, `UNRESOLVED`.

## 8. Integration Decision

- Accepted findings:
- Rejected findings:
- Deferred findings:
- Final implementation decision:
- Next allowed move:

## 9. Completion Evidence

- Tests run:
- Receipts or traces:
- Screenshots or exported samples:
- Commit SHA:
- Active session update:
- Handoff update:

## 10. Claim Boundary

This packet does not claim:

- live subagent runtime;
- provider independence;
- hosted readiness;
- production readiness;
- public release readiness;
- operator acceptance unless explicitly recorded.
```

## Mandatory Rules

1. Use English for all control chrome.
2. Preserve user-entered source values as evidence, even when they are not
   English.
3. Do not translate operator authority into agent preference.
4. Do not start implementation when the Surface Fidelity Gate is `HOLD`.
5. Do not let a role expand its scope without an updated transfer packet.
6. Do not treat simulated roles inside one model as independent agents unless
   the packet says so.
7. Do not claim runtime enforcement from a documentation packet.
8. Do not hide dissent; integrate or defer it explicitly.

## Acceptance Checklist

Before a transfer packet may be used:

- [ ] The target surface is identified.
- [ ] The active authority chain is recorded.
- [ ] Every role has a bounded scope.
- [ ] Forbidden actions are explicit.
- [ ] Evidence requirements are concrete.
- [ ] Live proof requirements are classified.
- [ ] Secret handling is stated.
- [ ] The claim boundary rejects runtime overclaims.

## Relationship To Existing CVF Forms

MA1 complements, but does not replace:

- Agent Work Orders;
- GC-018 baselines;
- Multi-Role Orchestrated Convergence Capture Form;
- completion reviews;
- active handoff and session state.

Use MA1 when work is transferred between role lanes. Use the convergence form
when role outputs disagree or a decision must be reconciled before dispatch.

## Claim Boundary

This standard defines a packet format. It does not implement a scheduler,
subagent runtime, MCP client behavior, provider routing, or public product
surface.
