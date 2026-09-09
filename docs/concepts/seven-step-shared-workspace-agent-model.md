# Seven-Step Shared-Workspace Agent Model

CVF uses seven decision boundaries:

```text
INTAKE -> DESIGN -> SPEC -> WORK ORDER -> BUILD -> REVIEW -> FREEZE
```

They are not seven autonomous agents. One actor may hold several roles when
the task and risk route allow it, or different actors may own different
stages. Combining roles does not erase duties, evidence, stop conditions, or
authority boundaries.

## Role Relationships

| Role | Main lifecycle relationship | May do | Must not do |
| --- | --- | --- | --- |
| Operator | authority and escalation owner across all stages | choose objectives, risk tolerance, topology, external effects, quota, public release, and scope expansion | be silently inferred from an agent assertion |
| Orchestrator / dispatcher | leads `INTAKE`, `DESIGN`, `SPEC`, and `WORK ORDER` | decompose work, verify sources, pin commits, discover dependencies, assign roles and paths, define stop and return contracts | pass unresolved architecture to a worker as accidental discovery or treat dispatch as proof |
| Worker / implementer | owns bounded `BUILD` | change only assigned paths, run required checks, preserve diagnostics, and return evidence | expand scope, self-approve, claim closure, or use ungranted providers and commit authority |
| Reviewer | owns semantic evaluation in `REVIEW` | reconstruct claims from source, diff, tests, receipts, and returned evidence; accept, return, or block | recreate implementation by default or accept self-attestation as authority |
| Closer / commit steward | carries accepted `REVIEW` into `FREEZE` | integrate reviewed material, preserve commit choreography, record limitations, export status, and next move | predict future SHAs, mix unrelated lanes, or publish without an explicit boundary |
| External agent | advisory research, audit, comparison, or detached proposal input | inspect public sources and an operator-supplied packet, cite immutable evidence, return structured findings | become a CVF authority root, mutate private provenance, approve its own absorption, or inherit credentials/deployment authority |

## Sharing Files Is Not Sharing Authority

In one shared workspace, coordination requires:

1. one active writer for a path at a time;
2. a captured execution base and verified source pins;
3. an exact or bounded manifest plus forbidden paths;
4. empty staging unless a named commit steward owns it;
5. no hidden stash, reset, checkout, worktree, or commit outside the contract;
6. explicit lane release before another role controls the same paths;
7. reviewer evaluation of returned evidence instead of silent overwrite;
8. separate material and continuity commits when session files would pollute
   the implementation evidence range.

```text
Operator authority
  -> Orchestrator/dispatcher packet
  -> Worker-owned path lane
  -> Worker return and lane release
  -> Reviewer disposition
  -> Closer/commit steward integration
  -> FREEZE evidence and next move

External agent output
  -> advisory candidate evidence
  -> Internal Agent verification and reconciliation
  -> accept, adapt, defer, or reject
```

Model identity is provenance metadata, not source authority. Machine checks
verify deterministic facts but do not replace engineering judgment. Worker
returns and external-agent outputs remain candidate evidence until an Internal
Agent verifies them against current governed sources and records a disposition.

## External-Agent Boundary

An external agent should receive a refreshed bootstrap and task capsule pinned
to the current public commit. It may research, audit, compare, and propose. It
does not gain write access to private provenance and its output cannot promote
itself into CVF authority. Internal source verification and overlap/owner
reconciliation must occur before an external finding influences a later
design, specification, or work order.

## Claim Boundary

This page describes the governance relationship. It does not claim a runtime
daemon, automatic multi-agent dispatch, universal process interception,
provider availability, model equivalence, private-memory transfer, or
production readiness. Check the current roadmap, work order, installed checks,
receipts, and accepted review for actual enforcement.
