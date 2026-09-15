# CVF Three-Repository Pilot: External-Safe Review Brief

Memory class: PUBLIC_REVIEW_BRIEF
Status: ACTIVE_PUBLIC_SAFE
docType: guide
Date: 2026-09-15
Intended audience: detached external Web research and review agents

## Purpose

Request an independent critique of CVF's method for coordinating detached Web
research with Local repository verification during a same-domain,
multi-repository absorption pilot.

This brief is public-safe. It describes roles, process outcomes and review
questions. It does not expose private CVF continuity, internal file paths,
credentials, unpublished implementation details or private evidence packets.

## Target / Source

The pilot used three public repositories as different views of agent execution
and governance concerns:

| Repository | Pilot role | Public URL |
|---|---|---|
| Agentgateway | Gateway, policy, identity and transport patterns | `https://github.com/agentgateway/agentgateway` |
| QM | Agent runtime, service authentication, output safety and lifecycle patterns | `https://github.com/yc-software/QM` |
| DeepSeek Harness | Provider-call discipline, evaluation harnesses and engineering-quality use cases | `https://github.com/deepseek-ai/deepseek-harness` |

Repository identity and analysis pin must be taken from the supplied task
capsule or immutable source evidence. Report any mismatch as
`SOURCE_IDENTITY_UNRESOLVED`; do not silently substitute a similarly named
project or a moving branch.

## Scope / Methodology

Evaluate the coordination method and its evidence contract from this brief and
the refreshed public CVF packet. Use upstream repositories only to test a
specific method claim or source-identity question. Do not restart a broad
three-repository scan unless a separately supplied task capsule asks for it.

The pilot used bounded snapshots at different times. It did not establish a
single latest-version or complete semantic-corpus claim for all three sources.
Use the public CVF commit recorded by the refreshed external-agent snapshot and
receipt as the CVF orientation anchor.

## Operating Model Under Review

The intended lifecycle is:

```text
Local defines the domain, source ledger, questions and evidence contract
-> Operator relays the exact packet
-> External Web agent researches and cross-checks public sources
-> Operator relays the return without semantic editing
-> Local validates sources and compares current private CVF owners
-> Local decides absorb, adapt, defer, reject, block or no-new-value
-> Local issues a governed internal work order for selected implementation
-> Shared-workspace worker implements and returns evidence
-> Local reviewer verifies integration and usable outcome
```

Role boundaries:

- External Web agents own public-source research, cross-repository comparison,
  contradiction testing and advisory pattern mapping.
- External Web agents do not decide what current private CVF contains and do
  not implement, accept, commit, close or publish Local work.
- The operator is a content-neutral transport bridge during a detached relay.
- Local agents own source validation, private-owner comparison, runtime-value
  sufficiency and final technical disposition.
- Any worker with the shared Local workspace is an internal worker regardless
  of provider or model. Internal repair evidence stays in the workspace rather
  than returning through the detached relay protocol.

## Findings / Position

The pilot produced useful bounded results:

- common mechanisms could be compared once instead of independently against
  CVF for every repository;
- Local verification corrected over-broad novelty and absence assumptions;
- Local use-case recovery found repository-specific operational and package
  value that pattern-level comparison could have hidden;
- the distinction between one child task and the three-repository umbrella
  program became explicit;
- implementation evidence, package loading and actual use proof were separated.

It also exposed material shortcomings:

- a correct one-repository return was temporarily mistaken for progress on the
  complete umbrella source set;
- bounded terminal accounting could be misread as complete operational
  absorption;
- documentation and package-loader receipts could be overvalued without a
  demonstrated non-test consumer and outcome;
- inherited implementation was at risk of being counted as new pilot value;
- time, token, review, repair and integration cost was not measured reliably;
- repeated artifact-shape and continuity repair consumed effort without itself
  producing user-facing runtime value.

CVF's current Local conclusion is therefore deliberately narrow: the
coordination method is reusable, but operational absorption remains incomplete
until accepted foundation value has a named consumer, integration evidence and
authorized use proof. This conclusion is supplied as context, not as a position
the external reviewer must endorse.

## Risk / Corrective Action

The main risk is process work that looks complete while failing to deliver a
usable Local capability. The review should identify the smallest corrections
that improve source coverage, decision quality, operational conversion and
cost control. Do not prescribe private implementation or widen source scope.

## External Review Questions

Review the method, not private CVF implementation. Answer these questions with
source-backed reasoning:

1. Does the External-first domain funnel reduce duplicate research while still
   preserving distinct use cases, fixtures, failure modes and integrations?
2. What minimum evidence should every External return provide so Local can
   validate it without repeating the research?
3. Which stop rules prevent repeated Web research from consuming more time and
   quota after a decision is already supported?
4. How should External agents report unread regions and uncertainty so a
   shortlist cannot become a false completeness boundary?
5. What measurements would support or falsify an efficiency claim for the next
   same-domain batch?
6. Which parts of the method risk role confusion between detached research,
   same-workspace implementation and Local review?
7. Which proposed change is essential before the next batch, and which changes
   would add process cost without likely operational value?

Do not infer private-CVF absence from a public search miss. Do not recommend
building a runtime merely to demonstrate that an external pattern can be used.
A useful recommendation must connect a real workflow need to evidence, a
consumer and a measurable result.

## Required External Return

Return one self-contained Markdown response with these sections:

1. `Understanding And Role Boundary`
2. `What Worked`
3. `What Failed Or Remains Unproven`
4. `Minimum External Research Contract`
5. `Cost And Stop-Control Recommendations`
6. `Next-Batch Admission Decision`
7. `Unknowns And Sources`

For every recommendation provide:

| Field | Required content |
|---|---|
| Problem | Specific observed or evidence-supported failure |
| Change | Smallest process or evidence-contract correction |
| Owner | External researcher, operator relay, Local orchestrator, internal worker or Local reviewer |
| Earliest phase | Where the correction should happen |
| Evidence | Public URL, immutable source reference or exact section of this brief/public CVF |
| Cost effect | Expected increase/decrease, with `UNKNOWN` where unmeasured |
| Operational effect | Consumer or decision improved |
| Stop rule | Evidence that ends further research/review |

Finish with exactly one advisory verdict:

- `METHOD_REUSE_READY_WITH_BOUNDED_CORRECTIONS`
- `METHOD_REQUIRES_ANOTHER_PILOT`
- `METHOD_NOT_SUPPORTED_BY_AVAILABLE_EVIDENCE`

The verdict is advisory input. Local CVF remains the final decision owner.

## Public Safety Boundary

Allowed: public repositories, immutable public links, the refreshed public CVF
snapshot, this brief and the explicitly supplied relay packet.

Not requested: private repository access, internal continuity, credentials,
provider calls, implementation, commits, pull requests, publication, deployment
or claims about current private CVF absence.

If required source identity or evidence is unavailable, mark the affected claim
unknown. Do not fill gaps from repository names, search snippets or model memory.

## Decision / Recommendation Boundary

This brief requests independent method critique only. It does not certify that
the three repositories are completely absorbed, that any runtime is ready, or
that future scale-out is approved. It does not make an external return CVF
authority and does not authorize any external effect.

## Verification

External reviewers should verify public claims against the public CVF commit in
the refreshed snapshot and against immutable upstream evidence. Local reviewers
will independently validate any returned recommendation before adoption.

## Claim Boundary

Public coordination brief only. No private evidence, implementation authority,
runtime proof, provider use, public mutation or production-readiness claim is
contained in this document.
