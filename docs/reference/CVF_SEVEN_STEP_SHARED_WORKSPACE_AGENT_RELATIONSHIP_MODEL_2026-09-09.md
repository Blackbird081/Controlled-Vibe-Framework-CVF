# CVF Seven-Step Shared-Workspace Agent Relationship Model

Memory class: governed-reference

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-09-09

## Purpose

Explain how people and agents cooperate across the canonical CVF lifecycle
when they share one workspace, without turning lifecycle stages into autonomous
agents or treating a shared filesystem as shared authority.

## Scope / Applies To

Applies to governed CVF work where an Operator, orchestrator/dispatcher,
worker, reviewer, closer/commit steward, or external agent exchanges evidence
through one repository or workspace. This document owns the relationship
model only; lifecycle semantics remain owned by the governed-work lifecycle
standard, and role assignment remains owned by the Agent Role Assignment
Matrix.

## Seven Decisions, Not Seven Agents

```text
INTAKE -> DESIGN -> SPEC -> WORK ORDER -> BUILD -> REVIEW -> FREEZE
```

The seven labels are evidence and decision boundaries. One actor may perform
several stages when the task and risk route allow it, or different actors may
own different stages. Duties, evidence, stop conditions, and authority do not
disappear when roles are combined. A separate reviewer is required only when
the governing packet, risk rule, or operator decision requires one.

## Relationship Model

| Role | Primary relationship to the seven steps | May do | Must not do |
| --- | --- | --- | --- |
| Operator | authority source and escalation owner across all steps | choose objectives, risk tolerance, topology, external effects, quota, public release, and scope expansion | be silently inferred from an agent assertion |
| Orchestrator / dispatcher | normally leads `INTAKE`, `DESIGN`, `SPEC`, and `WORK ORDER` | decompose bounded tranches, verify sources, pin base commits, discover dependencies, assign roles and paths, and define return/stop contracts | delegate unresolved architecture as accidental worker discovery or treat dispatch as implementation proof |
| Worker / implementer | normally owns bounded `BUILD` | modify only assigned paths, run required checks, preserve diagnostics, and return evidence | expand scope, self-approve, claim closure, use ungranted providers, or commit when commit mode forbids it |
| Reviewer | owns semantic evaluation in `REVIEW` | reconstruct claims from immutable source, diff, tests, receipts, and returned evidence; accept, return, or block | recreate the implementation by default, accept self-attestation as authority, or hide contradictions |
| Closer / commit steward | carries accepted `REVIEW` into `FREEZE` | integrate reviewed material, preserve commit choreography, record limitations, export disposition, and next move | predict future SHAs, mix unrelated lanes, or publish without an explicit public boundary |
| External agent | advisory research, audit, comparison, or detached proposal input to `INTAKE`/`DESIGN`/`REVIEW` | inspect the public repository and operator-supplied packet, cite immutable sources, return structured findings | become a CVF authority root, mutate the private SOT, approve its own absorption, or inherit credentials and deployment authority |

## Shared-Workspace Coordination

Sharing a workspace shares observable files, not permissions. Governed
coordination requires:

1. one active writer for a path at a time;
2. a captured execution base and verified source pins before mutation;
3. an exact or bounded manifest and explicit forbidden paths;
4. empty staging unless a named commit steward owns it;
5. no hidden stash, reset, checkout, worktree, or commit operation outside the
   dispatched contract;
6. a lane-release statement before another role takes control of the same
   paths;
7. reviewer evaluation of returned evidence rather than silent overwrite;
8. separate material and continuity commits when session synchronization would
   otherwise contaminate the implementation evidence range.

```text
Operator authority
  -> Orchestrator/dispatcher packet
  -> Worker-owned exact path lane
  -> Worker return and lane release
  -> Reviewer disposition
  -> Closer/commit steward integration
  -> FREEZE evidence and next move

External agent output
  -> advisory candidate evidence
  -> Internal Agent source verification and reconciliation
  -> accept, adapt, defer, or reject
```

## Authority And Evidence Rules

- Model or agent identity is provenance metadata, not source authority.
- The shared SOT consists of governed paths, immutable anchors, receipts,
  diffs, tests, accepted reviews, and explicit claim boundaries.
- Machine checks verify deterministic facts; they do not replace engineering
  judgment or operator authority.
- A worker return is candidate evidence until reviewer or closer acceptance.
- An external repository may supply knowledge or implementation candidates but
  never promotes itself into the CVF authority hierarchy.
- Public GitHub is the external reading surface; private provenance remains the
  audit SOT and is not copied wholesale into public distribution.

## External-Agent Round Trip

Before external research or audit, provide the refreshed
`EXTERNAL_AGENT_READ` bootstrap and task capsule pinned to the current public
commit. The external agent reads public sources, returns source-linked
findings, and stops. An Internal Agent then verifies the cited source, checks
overlap and current owners, and records one of accept, adapt, defer, or reject.
Only that internal reconciliation may influence a later design, spec, or work
order.

## Claim Boundary

This relationship model specifies governance responsibilities. It does not
claim a runtime daemon, automatic multi-agent dispatch, universal process
interception, provider availability, model equivalence, public/private memory
transfer, or production readiness. Actual enforcement is determined by the
current roadmap, work order, installed checks, receipts, and accepted review.

## Public Export Disposition

Disposition: `EXPORTED`
Public-sync remote: `https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`
Public-sync commit: `483c5e33d188b6b2d35d6cd19ee38a3c8548abc4`
Public artifact paths: `README.md` and
`docs/concepts/seven-step-shared-workspace-agent-model.md`
Public catalog paths: N/A; this export is a concept surface linked from the
public README and does not add a catalog entry.
Public pull request:
`https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/pull/8`
