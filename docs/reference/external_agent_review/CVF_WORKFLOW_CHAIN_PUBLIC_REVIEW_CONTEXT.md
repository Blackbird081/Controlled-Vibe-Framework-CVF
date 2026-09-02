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

CVF exposes seven canonical lifecycle decisions to make the framework readable
to humans and external reviewers. The labels are authoritative vocabulary for
the lifecycle, but they are not by themselves an executable state machine or
proof that a particular surface enforces every transition.

The internal workflow-chain system is a governed chain of authority,
state, evidence, and closure surfaces.

## Public / Simple Vocabulary

Public and educational surfaces use:

```text
INTAKE -> DESIGN -> SPEC -> WORK_ORDER -> BUILD -> REVIEW -> FREEZE
```

The seven decisions must remain distinguishable: `SPEC` is not merely design
prose, and `WORK_ORDER` is not implementation. They are not enough to define
current CVF runtime state, agent authority, MCP permission, or closure
readiness.

Some current runtime surfaces expose the five-value phase projection
`INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE`. This is not a competing
lifecycle. In that projection, `SPEC` and `WORK_ORDER` remain governed contract
and authority boundaries between runtime `DESIGN` and `BUILD`; they are not
additional runtime enum values unless a named, accepted adoption artifact says
otherwise.

Roadmaps commonly divide work into bounded tranches. A tranche may inherit
accepted earlier-stage evidence and enter at the earliest authorized stage; it
does not restart all seven stages from zero. Every transition requires enough
evidence for a gate, but CVF does not require a separate independent-review
artifact after every stage. Deterministic checks may validate paths, hashes,
manifests, schemas, coverage, and test results. Reviewers retain semantic
judgment and authority to advance, return, or block. `REVIEW` is the formal
result-evaluation stage before `FREEZE` records durable closure.

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
| `INTAKE`, `DESIGN`, or `SPEC` | a roadmap or proposal authorizes implementation | accepted source, design/spec evidence, current tranche state |
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

When reporting lifecycle conformance, distinguish these two claims:

- `LIFECYCLE_TRACEABLE`: the tranche preserves or inherits evidence for the
  applicable seven-stage decisions;
- `TRANSITION_MACHINE_ENFORCED`: the named runtime or workspace has current
  accepted evidence that the specific transition is machine-enforced.

Do not infer the second claim from the first.

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | public/simple CVF vocabulary |
| Chain map route | public lifecycle wording -> this interpretation context -> current CVF-governed lifecycle, runtime, roadmap, work-order, receipt, review, and freeze owners |
| Matching local-view guard | N/A with reason: this packet clarifies public vocabulary and makes no runtime or closure claim; repository-wide compatibility remains covered by `governance/compat/run_local_governance_hook_chain.py` |
| Owner surface | this public review context plus `README.md` and `docs/reference/CVF_GOVERNED_WORK_LIFECYCLE_AND_DESIGN_CONTROL_STANDARD_2026-06-11.md` |
| Disposition | source-verified clarification of CVF-owned public vocabulary; no external claim promoted |
| Claim boundary | explanation only; no runtime enum mutation, downstream adoption, provider/live action, public-sync, or closure authority |

## Claim Boundary

This context helps external reviewers reason about CVF. It does not expose
private provenance source, authorize public-sync, or define a new runtime state
machine.

EPISTEMIC_PROCESS_NA_WITH_REASON: governed vocabulary clarification only; no
new evidence comparison, provider execution, or runtime behavior claim.
