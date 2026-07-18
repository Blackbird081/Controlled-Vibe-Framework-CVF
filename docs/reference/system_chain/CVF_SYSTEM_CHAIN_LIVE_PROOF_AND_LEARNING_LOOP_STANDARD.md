# CVF System Chain Live Proof And Learning Loop Standard

Memory class: POINTER_RECORD

Status: ACTIVE_STANDARD

docType: reference_standard

Date: 2026-07-14

Standard ID: CVF-SCLPLL-2026-07-14

## Purpose

Prevent CVF from treating source inspection, design review, unit tests, mocks,
or historical receipts as proof that a system chain works now in its real
operating environment. The standard also makes every bounded live run a source
of architecture and governance learning, not a disposable test event.

SOT3 activation is the first retained use case under this standard. It proves
one selected knowledge-context path only. It does not prove the other CVF
system chains.

## Scope / Applies To

This standard applies whenever a roadmap, review, release gate, system-chain
map, Catalog/GAP update, or operator-facing claim concludes that a chain is
connected, enforced, visible, recoverable, or live.

It applies to provider calls, local runtime invocations, CI execution chains,
operator CLI and Web surfaces, durable evidence paths, and static governance
chains. It does not require an external provider call when the claimed property
is static or deterministic and has no provider boundary.

## Orthogonal Proof Model

Every system-chain conclusion has two independent dimensions:

1. `semanticPosture`: the existing source-backed conclusion such as `CURRENT`
   or `PARTIAL`.
2. `operationalProofStatus`: whether the conclusion has the execution proof
   required by its actual boundary.

A valid static conclusion remains valid when live execution is not applicable.
A runtime conclusion may remain source-backed while its operational status is
`LIVE_PROOF_MISSING`. Agents must not silently upgrade one dimension from the
other.

## Proof Classes

| Proof class | What it proves | What it does not prove |
|---|---|---|
| `STATIC_SOURCE_VERIFIED` | current source, schema, path, or contract fact | invocation or runtime behavior |
| `LOCAL_DETERMINISTIC_EXECUTION` | current real local execution without mocks | external provider or hosted behavior |
| `MOCK_OR_SIMULATED_EXECUTION` | harness shape and expected controlled branch | real runtime/provider behavior |
| `CURRENT_RUNTIME_INVOCATION` | real current invocation of the named runtime chain | provider behavior unless the provider is in the chain |
| `REAL_PROVIDER_BOUNDED` | a real provider call through the named bounded governance path | production scale, universal coverage, or user value |
| `REAL_USER_OBSERVED` | field evidence from actual user operation | universal correctness or certification |

Proof classes form an evidence ladder, not interchangeable labels. A higher
class can include lower-class evidence, but the receipt must still identify the
exact chain, scenario, environment, and evidence window.

## Live Applicability Classes

| Applicability | Required evidence |
|---|---|
| `STATIC_RECOMPUTE_REQUIRED` | fresh source/path/schema recomputation; no live invocation |
| `RUNTIME_LIVE_REQUIRED` | current deterministic invocation of the real runtime chain |
| `OPERATOR_SURFACE_LIVE_REQUIRED` | current operation through the actual CLI, CI, or Web surface |
| `PROVIDER_LIVE_REQUIRED` | real provider call through the governed route |
| `FIELD_VALIDATION_REQUIRED` | actual user feedback after shipment |

`NOT_APPLICABLE` is forbidden without a reason naming why the claim is a
static property. Provider availability or cost is not a reason to relabel a
runtime claim as static.

## Mandatory Conclusion Rule

Before accepting a system-chain conclusion, the reviewer must record:

- the exact claim;
- the required proof class and live applicability;
- the strongest evidence actually observed;
- freshness date or evidence window;
- a bounded status: `PROVEN`, `PARTIAL`, `MISSING`, `STALE`, or
  `NOT_APPLICABLE_STATIC_WITH_REASON`;
- the next use case or a concrete value-based park/reopen condition.

If the observed proof class is lower than the required class, retain any valid
static finding but label the operational claim `MISSING` or `PARTIAL`. Do not
close it as live-proven.

## Bounded Live Use-Case Ladder

Every selected runtime, operator-surface, or provider use case must proceed in
this order:

1. source-verify the owners, caller, consumer, route, and evidence fields;
2. state the exact bounded claim and proof class;
3. pass focused local deterministic and negative tests;
4. start the real development runtime or real CI/CLI surface;
5. prove zero-call or zero-side-effect rejection paths before paid or external
   calls when applicable;
6. perform the smallest live invocation that can change the conclusion;
7. record a secret-safe diagnostic before any rerun;
8. correlate the invocation with durable receipts and authority identifiers;
9. reconcile expected and observed behavior;
10. reverse-project the result into the system-chain map, Catalog/GAP owners,
    tests, diagnostics, and reusable governance learning.

Historical receipts can select and scope a use case. They cannot substitute for
a current invocation when the conclusion says the chain works now.

## Diagnostic And Rerun Discipline

The active live-run diagnostic authority remains the archived canonical
standard at
`docs/reference/archive/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md`.
Before rerunning a failed, partial, timed-out, or empty live attempt, record its
stage, failure class, retryability, user action, provider/model when relevant,
HTTP status and latency when available, receipt/trace when available, and a
secret-safe message.

Alibaba provider calls may be unmetered for the operator, but time, latency,
review effort, and false conclusions still have cost. Unmetered access does not
waive diagnostic-first rerun control or diminishing-return stopping.

## Value And Branch Stop Rule

Open a live use case only when it can change at least one of:

- admission or rejection behavior;
- authority or identity binding;
- runtime invocation reachability;
- operator visibility;
- durable evidence or recovery;
- release or bounded product claim.

Stop expanding a branch after one positive and one materially different
negative case establish the boundary, unless a new failure class appears.
Near-duplicate cases must be parked with a concrete reopen condition under the
value-parked lane discipline.

## Learning And Reverse Projection

Every materially new live-run finding must receive all applicable
dispositions before closure:

| Finding destination | When required |
|---|---|
| focused runtime regression | behavior can recur in code |
| diagnostic standard or runner | failure was hard to classify or retry safely |
| ADIF registry | repeated or non-obvious agent/workflow defect pattern |
| system-chain coverage ledger | proof status, freshness, or next use case changed |
| Catalog/GAP registry | owner, edge, missing edge, or close/reopen condition changed |
| architecture/reference owner | the observed chain contradicts or refines the as-built model |
| roadmap/work-order template | future execution needs a new mandatory step or evidence field |

This is reverse absorption: implementation evidence improves the architecture
map, and the improved map controls the next implementation. A chat-only lesson
or provider-local memory note does not satisfy this rule.

## SOT3 Use-Case Boundary

SOT3 UC-01 reached `REAL_PROVIDER_BOUNDED` for one selected CVF Web
knowledge-context path and its defined failure/recovery cases. Its retained
claim is `LIVE_GOVERNANCE_PROVEN_BOUNDED`.

UC-01 does not establish current live proof for the five generic system-chain
lanes, every SOT3 consumer, production deployment, public shipment, scale, or
real-user value. Those require their own use cases and correct proof classes.

## Required Maintenance

Any governed review that refreshes
`docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json` must also refresh
`docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_COVERAGE.json`.
Any new runtime or operator claim discovered outside the five current lanes
must be added to the coverage ledger before closure or explicitly marked
`BLOCKED_SOURCE_NOT_FOUND` in its governing packet.

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: this artifact defines a governance and proof
classification standard. The initial empirical classification is recorded in
the companion coverage ledger and roadmap, not asserted as universal fact by
this standard.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: the first use-case evidence and current chain inventory belong to the
private provenance repository. Public export needs a separate public-safe
review.

## Claim Boundary

This standard controls how CVF classifies and learns from live proof. It does
not itself execute a chain, call a provider, certify production readiness, or
prove real-user value.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex architect/reviewer |
| Provider or surface | local private provenance repository |
| Session or invocation | system-chain live-proof standardization, 2026-07-14 |
| Working directory | repository root |
| Command or tool surface | governed reads, source search, apply_patch, local gates |
| Target paths | system-chain standard, coverage ledger, roadmap, and front door |
| Allowed scope source | operator requested a durable standard, system-chain audit, future use cases, and continuous learning loop |
| Before status evidence | SOT3 retained bounded live proof, but generic system-chain map had no orthogonal live-applicability ledger |
| After status evidence | proof classes, applicability, use-case ladder, stop rule, and reverse projection are governed |
| Diff evidence | material changed set captured before commit |
| Approval boundary | documentation, governance process, audit classification, and roadmap only |
| Claim boundary | no new live execution or universal system-chain proof |
| Agent type | architect/reviewer |
| Invocation ID | system-chain-live-proof-learning-loop-2026-07-14 |
| Expected manifest | standard, JSON coverage ledger, roadmap, README update, freshness standard, freshness checker, and focused checker tests |
| Actual changed set | `docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_AND_LEARNING_LOOP_STANDARD.md`; `docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_COVERAGE.json`; `docs/roadmaps/CVF_SYSTEM_CHAIN_LIVE_PROOF_USE_CASE_ROADMAP_2026-07-14.md`; `docs/reference/system_chain/README.md`; `docs/reference/system_chain/CVF_SYSTEM_CHAIN_FRESHNESS_STANDARD.md`; `governance/compat/check_system_chain_map_freshness.py`; `governance/compat/test_check_system_chain_map_freshness.py` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename planned |
