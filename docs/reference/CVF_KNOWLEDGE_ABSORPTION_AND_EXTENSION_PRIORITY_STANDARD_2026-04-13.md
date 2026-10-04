# CVF Knowledge Absorption And Extension Priority Standard — 2026-04-13

Memory class: POINTER_RECORD

## 1. Purpose

This document is a binding standard for future CVF work that:

- absorbs new external knowledge into CVF
- promotes curated knowledge into canon
- proposes new uplift waves after knowledge intake
- attempts to widen CVF using newly absorbed doctrine, tooling, or runtime ideas

Its purpose is to prevent value dilution, architecture drift, and premature surface multiplication.

## 2. Binding Rule

Unless a fresh operator decision and explicit `GC-018` state otherwise, the default rule is:

`doctrine-first / governance-first absorption must be completed before implementation-first expansion`

This rule is binding for any future knowledge-absorption or CVF-extension wave.

## 2.1. Unified Development Direction - Operator Decision 2026-09-28

CVF develops its existing planes into a bounded system chain that can complete
real work and produce artifacts acceptable under CVF-owned governance. It then
reuses suitable external runtimes through adapters. Learning how another agent
is built, the number of repositories absorbed, and the number of modules CVF
owns are not the end goal or measures of success.

The development sequence is:

`bounded system chain -> one suitable real runtime -> end-to-end evidence ->
repair observed chain gaps -> stabilize the contract -> another runtime when
there is a concrete need`.

The runtime count in this sequence is clarified by the operator decision in
section 2.2: one bounded work chain may need complementary runtimes from the
outset. It is not a one-repository exclusivity rule.

Foundation-first means the selected work has a sufficient authority, execution,
evidence and acceptance path before its authorized proof. It does not require
completing every plane before trying one bounded integration. Runtime evidence
must feed back into existing chain owners; a successful run does not waive a
missing authority or acceptance boundary.

### Two Independent Reuse Decisions

| Decision | Required question | Evidence boundary |
|---|---|---|
| Pattern absorption | What knowledge, test, contract or failure lesson improves an existing CVF owner? | Conceptual overlap may reduce this value without deciding runtime value. |
| Runtime integration | Can this runtime deliver a named work artifact under the required CVF authority and evidence contract, at an acceptable integration and operating cost? | No new architectural idea is required; source/API availability alone is not integration or use proof. |

Record both decisions in the existing value/disposition record. Use the existing
disposition vocabulary and give a reason for DEFER, BLOCK, REJECT or no value.
An existing owner or a duplicate pattern cannot by itself reject operational
reuse. Pattern value cannot by itself admit an executable dependency either.
Do not invent a consumer to justify an attractive repository.

### Work Selection And Architecture Preservation

Start with the actual job, expected artifact, acceptance criteria, current
consumer or named unresolved consumer, owner and measurable gap. Compare reuse
through an adapter with the current route, native SDK/API where relevant, and
no change. Evaluate capability, control/observation limits, version/license,
maintenance, integration/review cost and task outcome before selecting a lane.
Stars, popularity, visual polish, benchmarks detached from the job and hot
trends may help discovery; none is admission or architecture-change evidence.

CVF retains task admission, authority/resource/model/credential bindings,
acceptance and evidence ownership. An adapter translates and verifies the
runtime contract; the runtime supplies execution capability. Keep the existing
planes and owner boundaries. A new owner or governance rewrite requires a
source-backed gap and its own explicit bounded decision, never a dependency's
preferred architecture. Do not rebuild upstream capability merely to own it.

Unsupported enforcement or observation must produce explicit rejection,
deferment or unknown state; prompt instructions and event logging cannot be
reported as enforced resource controls. Preserve distinctions among admission,
start, completion, cancellation requested/confirmed, unresolved side effects
and artifact acceptance. Fallback, retries, resume and descendant work must
retain the authorized envelope or be rejected/re-admitted by the existing owner.
Do not erase capability differences to make runtimes appear interchangeable.

### Success, Stop And Reopen

Measure accepted work artifacts with sufficient evidence, preserved authority,
truthful failure/cancel state, and the cost of integration and operation. A
runtime substitution succeeds when the required governance and acceptance
invariants remain valid without rebuilding governance; record unsupported
capabilities and any contract version migration. Do not claim replaceability
from an interface alone or connect a second runtime solely to inflate coverage.

Stop research when the bounded decision is supported. Reuse valid evidence;
reopen only for a named consumer need, material source drift or an observed
failure with expected information gain and cost reason. Preserve useful future
candidates with existing conditional reopen records. A missing value measure
is UNKNOWN, not zero or a claimed saving.

This clarification makes operational reuse a first-class independent decision
within doctrine-first / governance-first absorption. Existing proof of fit may
be reused; conceptual novelty and repeated doctrine rewrites are not required.
It grants no implementation, provider, install, dispatch or release authority,
changes no frozen doctrine, and reopens no parked tranche. Existing GC-018,
owner admission and proof requirements still control execution.

## 2.2. Complementary Runtime Reuse And End-User Choice - Operator Decision 2026-10-03

Authority: the operator's 2026-10-03 instruction to make repository composition
a lasting CVF foundation rule and keep hosted alternatives open for end-user
selection. Decision D100 and its authority/reconciliation review are recorded in
`docs/roadmaps/CVF_NONCODER_CONTROLLED_CAPABILITY_RUNTIME_ROADMAP_2026-09-26.md`
and `docs/reviews/CVF_NCR_COMPLEMENTARY_RUNTIME_REUSE_AND_USER_CHOICE_REVIEW_2026-10-03.md`.
This section enriches this existing owner under section 2.1.

### Select For The Whole Work Artifact

Select an adequate existing capability for each required part of the work.
A repository does not need to satisfy 100 percent of the requirements alone.
When one capability has a named gap, evaluate complementary repositories or
services against that gap. Compare a sufficient single-runtime route with the
smallest sufficient combination, including integration and operating cost.
Do not rebuild an adequate upstream capability merely to keep the job inside
one repository. More repositories are not a measure of success.

Each component must have a named consumer, required capability and CVF owner.
Record its individual fit, the unresolved gaps and the composition's acceptance
criteria. An individual component's fit does not establish end-to-end fit.
Source support, executable integration and accepted work remain separate claims.

### Declare Where Each Runtime Executes

Keep source provenance mirrors separate from execution environments. A clone
is source evidence, not an installed runtime. Update and pin sources before use;
also identify dependency, model, codec and asset versions needed for execution.
Declare the execution location for each component independently:

| Lane | Execution location | Local requirements |
|---|---|---|
| Local | End user's machine | Selected runtime, dependencies and required models/assets in an isolated environment. |
| Self-hosted | User-controlled server or container host | Client/adapter and connectivity; runtime requirements belong on the declared host. |
| Hosted/API | Service provider | Client/adapter and connectivity; the corresponding server runtime need not be installed locally. |

A composition may mix these lanes. Local process invocation, file exchange,
SDK calls or APIs are acceptable when their contracts fit the job. A local
runtime does not require an API server merely to be callable by CVF. Declare
dependency isolation and execution controls separately; a virtual environment
does not prove a sandbox, offline operation or enforced resource limits.

### Preserve End-User Selection In The Design

Here, the end user is the operator in the CVF root workspace, or the project
owner acting within the operator-granted authority in a downstream workspace.
This identifies the selection authority; it creates no new agent execution role.
An agent must not independently select or change the execution lane. It may
recommend a lane, or apply an explicit user selection or authorized selection
policy within its declared scope.

Design applicable local, self-hosted and hosted/API alternatives as selectable
lanes. Do not omit a suitable hosted or paid option solely because it incurs
cost, uses credentials or sends data outside the local machine. End users
choose the lane or combination for their project within applicable authority
and service terms. No universal local-only default follows from this standard.
A proposed default must have a stated fit/cost reason and remain distinguishable
from the end user's explicit selection.

For each selectable lane, expose capability/quality differences, prerequisites,
cost or UNKNOWN cost, data destinations, credential needs and current readiness.
An unimplemented or unverified lane is a design option with its status shown,
not a claim that the product already supports it. Record a specific reason for
an unavailable option and a condition for reconsidering it.

Designing an option with a readiness status does not reopen a provider lane,
create a runtime or introduce a new CVF owner surface under sections 3 and 5.
Actual implementation and execution still require their applicable bounded
GC-018 admission. Optional design does not imply executable support.

Selection may bind the execution envelope once when it includes sufficient
scope, budget, credential and data-egress authority; do not request the same
approval again for work already inside that envelope. Design availability alone
does not authorize a charge or data transfer. A fallback that changes the
selected lane, budget, credentials or data destination needs prior authorization
covering that change, or a new user/operator selection before execution.

### Use Explicit Composition Contracts And End-To-End Acceptance

Keep upstream components independently versioned unless evidence justifies
tighter coupling. Use a thin adapter to translate and verify inputs/outputs;
do not merge repositories or copy their governance merely to connect them.
The existing CVF owners retain admission, resource/credential bindings,
evidence and acceptance responsibilities.

Before executing a composition, its bounded contract records:

- component identities, versions and selected execution lanes; separate rights
  evidence for code, model weights, codecs, fonts and other assets, including
  required attribution and any unverified rights;
- rights and consent evidence for a person's voice or likeness when used for
  cloning or derived media; bundled presets still need their applicable rights
  evidence, while a license declaration alone is not independent consent proof;
- implicit component behavior: ambient credential or `.env` loading, telemetry,
  automatic updates/installation, background or child processes and first-run
  downloads; declare configured controls, observation limits and residual effects;
- input/output formats, encoding, units, timing and compatibility at each join;
- artifact provenance/hashes, validation and custody across component boundaries;
- resource, download/network and cost envelopes, with measurement gaps explicit;
- failure, timeout, retry/resume and cancellation behavior, including partial
  artifacts, unresolved effects and cleanup responsibilities;
- the smallest end-to-end proof and final acceptance criteria for the work.

Start with one representative bounded artifact through the complete proposed
chain. Separate successful component runs do not prove that their combination
works. Expand after the joined output meets the named acceptance criteria and
the required authority/evidence boundaries. Reuse valid component evidence;
reopen it only for a decision-changing gap, source drift or observed failure.

This is a normative design/selection rule. It does not admit any particular
repository, install a runtime, authorize provider use or close a parked tranche.
Existing GC-018 and execution-proof requirements still apply. These provisions
claim no enforcement at runtime and change no frozen doctrine.

## 3. What This Means In Practice

When CVF absorbs a new knowledge packet, the next step must default to:

1. accepted-value extraction
2. deduplicated concept mapping
3. owner-surface mapping
4. explicit rejection / defer list
5. future reopen conditions

The next step must **not** default to:

1. new runtime creation
2. new CLI creation
3. new guard-family creation
4. parallel subsystem creation
5. provider-lane reopening

## 4. Required Priority Order

Future agents must follow this priority order:

1. **Doctrine fit**
- determine what the new knowledge actually adds to CVF in conceptual terms

2. **Governance fit**
- determine which accepted concepts can be governed safely inside existing CVF owner surfaces

3. **Owner-surface mapping**
- map accepted value into existing CVF owners such as Knowledge Layer, Context Builder, Learning Plane, W7-aligned governance, or already delivered bounded `cvf-web` surfaces

4. **Value concentration**
- choose the smallest uplift that increases reuse, clarity, or governed operability the most

5. **Implementation only after proof of fit**
- implementation may open only after the doctrine/governance layer is clean and the boundary is explicit

## 5. No-New-Surface Default

The default rule for absorbed knowledge is:

`enhance an existing CVF owner surface first`

not:

`create a new CVF surface first`

A future agent must assume:

- no new graph runtime
- no new memory runtime
- no new wiki runtime
- no new CLI family
- no new guard family

unless a fresh bounded wave proves that an existing owner surface cannot absorb the value safely.

## 6. Mandatory Questions Before Any Uplift

Before opening a new uplift wave from absorbed knowledge, the agent must answer:

1. What exact value is accepted?
2. What existing CVF owner surface should own it?
3. What is explicitly rejected?
4. What remains deferred?
5. Why is a new surface not sufficient or not necessary?
6. Why is the chosen next step the highest-leverage move rather than just the easiest move?

If these answers are not explicit, the wave is not ready.

## 7. What Counts As Highest-Leverage

A next step is higher-leverage only if it does at least one of these:

- makes future knowledge absorption narrower and safer
- reduces terminology drift
- increases governed reuse of accepted knowledge
- improves owner-surface clarity
- prevents parallel architecture sprawl
- strengthens existing official CVF surfaces instead of multiplying new ones

If a proposed step mainly adds implementation volume without improving these things first, it is not the priority move.

## 8. Explicit Exceptions

A future wave may skip doctrine-first / governance-first priority only if all of the following are true:

1. the operator explicitly authorizes an implementation-first exception
2. a fresh bounded `GC-018` is issued
3. the exception states why the doctrine/governance fit is already sufficiently closed
4. the exception states why existing owner surfaces cannot absorb the value without a new surface

Without all four, the default priority rule remains active.

## 9. Best-Practice Exemplar

The repository should treat the `Graphify / LLM-Powered / Palace` lane as the current best-practice example of this standard in action:

- canonical roadmap: `docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md`

- broad intake happened first
- independent evaluation happened
- rebuttal and synthesis happened
- accepted value was narrowed
- rejected/deferred value was made explicit
- implementation remained blocked
- the next recommended move stayed in a doctrine/governance-first lane

This exemplar does not make that packet canon automatically.
It demonstrates the correct sequencing discipline.

## 10. Relation To Existing Files

Use this standard together with:

- `CVF_SESSION_MEMORY.md` (routes to the active handoff)
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/assessments/CVF_EXECUTIVE_VALUE_PRIORITIZATION_NOTE_2026-04-13.md`
- `docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md`

The executive note explains **why** this ordering creates the most value.
This standard defines the ordering as a **binding default rule**.
