# CVF Workflow Chain Public Review Context

Memory class: FULL_RECORD

Status: ACTIVE_CONTEXT

docType: reference

## Scope / Target / Owner Boundary

Target: public-facing and external-agent interpretation of CVF workflow chain
vocabulary.

Owner boundary: this context owns explanation only. It does not redefine CVF
runtime state, roadmap state, AHB route tokens, or closure authority.

## Scope / Applies-To

Applies when external agents, public readers, or package authors see simplified
CVF lifecycle vocabulary and need to map it to internal governed surfaces.

Does not apply as an executable state machine.

## Purpose

Give external agents a short, accurate explanation of how to read CVF workflow
surfaces without confusing public-facing lifecycle vocabulary with the internal
governed workflow-chain system.

## Review Context

CVF may expose simplified lifecycle labels to make the framework readable to
humans and external reviewers. Those labels are a facade, not the full control
plane.

The internal workflow-chain system is a governed chain of authority,
state, evidence, and closure surfaces.

## Public / Simple Vocabulary

Public or educational surfaces may use labels such as:

```text
INTAKE -> DESIGN -> SPEC -> WORK_ORDER -> BUILD -> REVIEW -> FREEZE
```

These labels are useful for explaining a product journey. They are not enough
to define current CVF runtime state, agent authority, MCP permission, or
closure readiness.

## Internal Governed Workflow-Chain Surfaces

External reviewers should evaluate CVF internal workflow-chain behavior through
these surfaces:

| Surface | Role |
|---|---|
| Active session state | Current mode and next allowed move. |
| Active handoff | Current cross-agent continuity and parked checkpoints. |
| Roadmap tranche | Work sequencing and terminal/parked state. |
| GC-018 | Fresh authorization and source boundary. |
| Work order | Assigned scope, source verification, allowed paths, and prompt envelope. |
| Agent Handoff Contract | Route mode, role pattern, base-head, trace, commit, and closure ownership. |
| Autorun gates | Machine enforcement for dispatch, implementation, closure, and push. |
| Reviews/completions | Acceptance, dissent, claim boundary, and evidence. |
| Receipts/evidence | Proof of runtime, live, or closure claims. |
| Session sync | Final alignment of front doors after material closure. |

## Correct Interpretation

If a public surface uses a simple stage label, map it to CVF internal authority
before making architectural claims.

Example:

| Public label | Do not assume | Check instead |
|---|---|---|
| `WORK_ORDER` | any worker may execute | current work order, GC-018, AHB route, source verification |
| `BUILD` | runtime implementation is authorized | active next move, roadmap tranche, allowed scope, live/provider boundary |
| `REVIEW` | closure is complete | completion packet, reviewer acceptance, closure gate, session sync |
| `FREEZE` | public readiness is proven | public export disposition, public-sync evidence, live governance proof |

## External-Agent Instruction

When reviewing CVF, state explicitly whether a finding comes from:

- public/simple vocabulary;
- current CVF-governed source;
- private provenance source supplied for the review;
- an external comparison repository;
- inference.

If the source is public/simple vocabulary only, mark the finding as a question
or hypothesis, not as a CVF fact.

## Claim Boundary

This context helps external reviewers reason about CVF. It does not expose
private provenance source, authorize public-sync, or define a new runtime state
machine.
