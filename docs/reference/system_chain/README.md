# CVF System Chain Map

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-10

## Purpose

Provide a stable, truthful whole-picture reference for how CVF connects
frozen doctrine to contract, contract to runtime, runtime to enforcement,
enforcement to evidence, and evidence to operator-visible surfaces. This
reference is Deliverable B: it exists only because reviewer-accepted MSEA-R90
Audit A already produced five bounded, source-backed lane verdicts. This
README does not re-derive those verdicts; it presents them as a durable
front door for operators, developers, and future agents, alongside a
machine-checkable freshness contract that detects when the underlying
sources drift.

## Scope / Applies To

Applies to any operator, developer, or agent who needs a single entry point
for "how does CVF's governance chain actually connect end to end, and is
that picture still current." Does not apply to runtime/product code and
does not itself implement, modify, or supersede any `governance/compat/check_*.py`
checker, the R72F lifecycle decision, or the MSEA-R90 Audit A findings it
summarizes.

## Canonical Source

- Audit: `docs/audits/CVF_MSEA_R90_SYSTEM_CHAIN_AUDIT_A_2026-07-10.md`
- Evidence: `docs/audits/CVF_MSEA_R90_SYSTEM_CHAIN_AUDIT_A_EVIDENCE_2026-07-10.json`
- Reviewer acceptance: `docs/reviews/CVF_MSEA_R90_SYSTEM_CHAIN_AUDIT_A_COMPLETION_2026-07-10.md`
  (`Status: REVIEWER_ACCEPTED_BOUNDED`, material commit `645df8b83`)
- Machine map: `docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json`
- Freshness contract: `docs/reference/system_chain/CVF_SYSTEM_CHAIN_FRESHNESS_STANDARD.md`
- Live-proof and learning standard:
  `docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_AND_LEARNING_LOOP_STANDARD.md`
- Live-proof coverage ledger:
  `docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_COVERAGE.json`

The semantic map and live-proof coverage ledger are orthogonal. `CURRENT` in
the semantic map means the exact source-backed conclusion is current; it does
not by itself mean a retained current runtime or provider receipt exists. The
coverage ledger classifies the required proof type and queues only the lanes
whose claims actually cross a runtime, operator-surface, or provider boundary.

This README and its JSON companion carry only findings already accepted by
the MSEA-R90 reviewer closure. No claim here is stronger than that
acceptance; several rows below explicitly preserve `PARTIAL` scope rather
than presenting a partial connection as `CURRENT`.

## The Five-Lane Whole Picture

Each lane below distinguishes **current** (proven and unqualified),
**partial** (proven for a bounded sample or with a documented gap),
**historical** (a past state or trace, not a live receipt), and **future**
(explicitly deferred, not yet authorized) surfaces. Do not read a `PARTIAL`
row as `CURRENT` coverage of the full named scope.

### Lane 1 - Doctrine to Contract

laneId: `DOCTRINE_TO_CONTRACT`

R94-T2 adds the active companion route
`docs/reference/system_chain/CVF_DOCTRINE_TO_CONTRACT_ROUTE_MAP.md`. It
cross-references the three CVF-governed independent numbering narratives
without treating them as equivalent. R96 retained L1 and L4 as unresolved with
search evidence. R99 closes the L1 owner gap with the compact
`CVF_SYSTEM_DEFINITION.md` pointer while retaining path and authority
boundaries. L4 remains unresolved. R98
ratifies `AGENTS.md` as the differently named active L2 operational owner with
an explicit boundary: responsibility coverage is proven, but textual
equivalence, `/protocols` path existence, and frozen-status transfer are not.
R97 adds
the missing module-inventory row for `EXTENSIONS/examples/`; consolidation and
root-path alignment remain open.

**Posture: PARTIAL.** Verdict: `PARTIAL_CHAIN_WITH_DOCUMENTED_DRIFT`.

Frozen doctrine (`ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md`) declares seven
layers L0 through L6. L0 (`ECOSYSTEM/doctrine/`) and L3
(`ECOSYSTEM/operating-model/`) exist in the active tree and match the
doctrine's named contents. L1 and L2 doctrine-named content exists only
under a legacy-reference mirror, not the active `ECOSYSTEM/` tree. R99 now
provides a differently located active L1 pointer owner. R96 found
a substantial L2 responsibility match in `AGENTS.md`; R98 resolves that
candidate as `NAMED_DIFFERENTLY_ACTIVE_OWNER_WITH_BOUNDARY`. Three additional
module-map documents (`ARCHITECTURE.md`, `docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md`,
`docs/CVF_CORE_KNOWLEDGE_BASE.md`) use independent layer-numbering schemes
not cross-referenced to the doctrine; this is recorded drift, not an error
in any of the four documents individually.

### Lane 2 - Contract to Runtime

laneId: `CONTRACT_TO_RUNTIME`

**Posture: PARTIAL.** Verdict: `PARTIAL_RUNTIME_CONNECTION_FULL_INVENTORY`.

MSEA-R94-T0 inventoried all fifty matrix rows. MSEA-R94-T1A then corrected
the six contract/protocol test-pairing mismatches for GC-001, GC-002, GC-003,
GC-005, GC-006, and GC-008 to the existing direct contract test owner
`EXTENSIONS/CVF_GUARD_CONTRACT/src/index.test.ts`; its focused suite passes
34/34. R94-T1B then confirmed that GC-009 and GC-010 are implemented and
tested but have no proven non-test production caller or active package export.
Their matrix rows now state `IMPLEMENTED_NOT_INVOCATION_PROVEN` instead of
implying active entrypoints.

R94-T1C confirms direct semantic tests for GC-012 and GC-013. Remaining bounded
rows stay explicit: GC-009/010 are implemented without proven production
invocation, while GC-019/046 remain contract-only with reason.

SCLP-UC03-T2 then selected GC-011 and executed one current provider-free proof
through `CvfSdk.runReferenceGovernedLoop` into `PipelineOrchestrator`. The
positive and missing-PLAN fail-closed cases passed two of two. Operational
coverage for this representative route is `PROVEN`; the lane's semantic
posture remains `PARTIAL`, GC-009/010 remain invocation-unproven, and the
receipt's lost per-case display names are retained as a bounded evidence
limitation rather than grounds for another proof call.

### Lane 3 - Runtime to Enforcement

laneId: `RUNTIME_TO_ENFORCEMENT`

**Posture: CURRENT.** Verdict: `PROVEN_CONNECTED_VIA_DATA_DRIVEN_REGISTRY`.

The nine deep-chain cross-family checkers
(`check_cross_family_approval_artifact_external_revocation_issuer_proof_authority_*.py`,
CF-076 through CF-084) are invoked through a real, data-driven,
parameterized chain: the documentation-testing CI workflow runs
`scripts/run_cvf_cross_extension_conformance.py`, which reads
`docs/reference/CVF_CONFORMANCE_SCENARIOS.json`'s CF-076..CF-084 command
arrays and subprocess-executes
`scripts/run_cvf_packet_posture_gate_conformance.py --gate` against each of
the nine checkers over four canonical packet postures.
`governance/compat/check_conformance_artifact_consistency.py` enforces
registry/report/summary mutual consistency.

The R72F `RETIREMENT_HOLD_SOURCE_GAP` lifecycle disposition for these nine
checkers is unchanged by this map. Execution-edge existence and
retirement-safety are separate questions; this reference does not reopen
or re-decide the R72F disposition.

### Lane 4 - Enforcement to Evidence

laneId: `ENFORCEMENT_TO_EVIDENCE`

**Posture: CURRENT** (for the corrected citations). Verdict:
`TWELVE_OF_TWELVE_DISPOSITIONED`.

All twelve prior path candidates across the seven-document evidence
manifest were recomputed fresh by MSEA-R90 Audit A: eleven were
`STALE_ARCHIVE_MOVE` (each with a confirmed archive successor) and one was
confirmed `MISSING`
(`CVF_H2_WORKING_MEMORY_RUNTIME_PROOF_COMPLETION_2026-05-22.md`, verified
absent by full-repository basename search). This R91 tranche corrects the
GC-019 roadmap citation in `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
and the ten distinct stale/missing citations in
`docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md` to their
confirmed archive-qualified successors, and marks the H2 citation
explicitly missing rather than substituting the distinct sibling artifact
`CVF_T5_RUNTIME_MEMORY_WIRING_COMPLETION_2026-05-22.md` as an unproven
equivalent.

### Lane 5 - Evidence to Operator Surface

laneId: `EVIDENCE_TO_OPERATOR_SURFACE`

**Posture: PARTIAL.** Verdict: `PARTIAL_OPERATOR_VISIBILITY_BY_ENFORCEMENT_CLASS`.

`RUNTIME_GUARD` class evidence (GC-001 through GC-014) has a confirmed Web
UI route at
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/governance`.

`CI_REPO_GATE` class evidence (the 186 `governance/compat/check_*.py`
scripts, including the nine cross-family checkers from Lane 3) has proven
**current** CLI aggregate/per-check human-readable output:
`governance/compat/run_agent_autorun_workflow_gate.py` prints a
`[PASS]`/`[FAIL] <name> (<duration>)` line per configured checker, and
`governance/compat/run_local_governance_hook_chain.py` prints a
`PASS`/`FAIL` line per hook-chain step plus an aggregate summary. Web

UC-04A is now proven bounded for the CLI surface. The retained
`negative_pre_closure` case exposed the expected non-empty range and dirty
worktree readout. The R1 recovery then ran the committed 39-test suite and one
direct positive CLI call from a clean base: 75/75 checks passed, aggregate
output was COMPLIANT, and a structured PASS receipt retained all 75 named
results. The negative case was not repeated. This closes the CLI boundary only;
UC-04B Web remains unproven.

The first UC-04B attempt is closed `CLOSED_BLOCKED_BOUNDED`. Both browser
attempts stopped before Web submission; checker and provider call counts were
zero. Reviewer reconciliation rejected the claimed global Vitest and missing
environment root causes: the focused suite passed 20/20, the required local
environment file exists, and auth source retains fallback configuration. The
actionable defect was proof-procedure/evidence divergence: two Playwright
invocations versus a one-call/zero-retry packet and a receipt that initially
reported only one. Recovery requires a fresh packet; no Web claim follows.

The fresh UC-04B-R1 recovery is also closed `CLOSED_BLOCKED_BOUNDED`. Direct
NextAuth authentication returned the developer role, but the real Operations
page projected `anonymous_local`; the run stopped before submission. The exact
counters are one Playwright invocation, zero Web submissions, zero checker
executions, zero retries, and zero provider calls. This is tracked as
`cvf.asc.gap.web_nextauth_application_projection_split.v1`. A source-verified
auth-boundary repair packet is required before another UC-04B proof.

UC-04B-R2 is closed `CLOSED_BLOCKED_BOUNDED`. The request-bound auth adapter
repair is reviewer-accepted through 12/12 focused tests and clean typecheck,
but browser projection remains unproven. Reviewer trace inspection corrected
the worker diagnosis: the actual browser navigation used `127.0.0.1` and
carried the session cookie; the mixed-host redirect occurred inside the API
request context, and no client auth/jobs request followed page load. One fresh
`localhost`-normalized recovery proof is required; R2 must not be rerun.

UC-04B-R2R1 is closed `CLOSED_PASS_BOUNDED`. The retained proof spec remained
byte-identical, the focused auth suite passed 12/12 with clean typecheck, and
one canonical `http://localhost:3001` Playwright invocation passed both the
developer and anonymous projection cases. Exact counters are one invocation
and zero business submissions, checker executions, retries, and provider
calls. The auth-projection GAP is closed for this bounded pair. UC-04B business
submission and visible job outcome remain unexecuted and require a fresh
source-verified packet.

## UC-04B-R2R1 Epistemic Process Block

### Expected Result / Prediction

If the R2 blocker came from mixed canonical-host evidence rather than a
remaining request-auth defect, the unchanged proof would pass both cases when
all relative requests and navigation used one localhost origin.

### Evidence Comparison

The frozen proof hash matched R2 and one explicit localhost invocation passed
both developer and anonymous projection cases without retained-owner changes.

### Contradiction Or Gap Disposition

The outcome resolves the R2 environment blocker and closes the bounded
auth-projection GAP. It does not resolve the unexecuted business chain.

### Claim Update

Web auth projection is proven bounded for the selected pair; UC-04B business
submission and visible job outcome remain unproven.

UC-04B-R3 is closed `CLOSED_BLOCKED_BOUNDED`. One canonical Playwright
invocation proved the developer `docs_governance_check` business path through
submission, checker execution, succeeded readout, and the expected three-event
audit sequence. The reviewer case stopped before POST because its retained
unscoped reviewer-text locator matched five rendered elements. Exact counters
were 1/1/1/0/0 for invocation, Web submission, selected checker, retry, and
provider calls. The positive edge is retained; reviewer browser denial remains
unproven and routes to one locator-only R3R1 recovery packet.

UC-04B-R3R1 is closed `CLOSED_BLOCKED_BOUNDED`. The scoped exact locator
eliminated the prior five-match ambiguity, but the canonical-origin trace
contained no `/api/auth/me` request, the Operations role remained
`anonymous_local`, and the reviewer POST was not attempted. Fresh reviewer
evidence therefore satisfies the recorded reopen condition for
`cvf.asc.gap.web_nextauth_application_projection_split.v1`. Prior bounded
developer/anonymous projection and developer business evidence remain retained.
A source-verified R3R2 packet must prove deterministic reviewer client-role
projection before another browser invocation; timeout-only tuning is excluded.

UC-04B-R3R2 is closed `CLOSED_PASS_BOUNDED`. A server wrapper now projects the
ambient session role and user into the Operations client before hydration, and
the client retains its `/api/auth/me` refresh. The focused five-file regression
passes 34/34 and TypeScript typecheck passes. This is local source/test proof,
not reviewer browser-denial proof: no browser, Web submission, checker job,
retry, or provider call occurred. One R3R3 negative-only canonical-origin proof
is the next allowed packet; the positive developer path must not be repeated.

UC-04B-R3R3 is closed `CLOSED_PASS_BOUNDED`. One canonical-origin negative-only
invocation rendered reviewer, submitted exactly one `docs_governance_check`
request, and received HTTP 403 with `blocked_by_policy` and
`read_only_role_cannot_trigger`. Its isolated audit sequence is exactly
`requested` then `blocked_by_policy`; checker execution, retry, and provider
calls are zero. Together with retained R3 developer success, the selected Web
pair is proven bounded and the auth-projection GAP is closed with evidence.
No unified Web checker inventory, other role/job, or provider-governance claim
is implied.

Operations exposes a bounded five-job-type subset
(`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/web-governance-jobs.ts`),
of which exactly one job type (`docs_governance_check`) wires directly to
one named checker (`check_docs_governance_compat.py`). **No unified Web
inventory across all 186 checkers exists** - this remains an explicit
**future** gap, not something to infer from the presence of the
`/governance` route directory alone.

SCLP-T5 (2026-07-15) performed the final reverse-projection audit across
UC-01 through UC-04. It independently reconciled all four use cases and all
five lanes against their accepted completion reviews. Reviewer closure retired
a stale UC-03 sequencing pointer, routed the repeated dispatch omission to
ADIF-0039, and confirmed every finding has a governed destination (focused
regression, diagnostic, ADIF, coverage, GAP, or architecture owner). T5 also strengthened
`cvf.asc.gap.web_checker_inventory_not_unified.v1`'s reopen condition into two
concrete, checkable triggers instead of vague operator interest. See
`docs/reviews/CVF_SYSTEM_CHAIN_T5_FINAL_SEQUENCE_CLOSURE_COMPLETION_2026-07-15.md`
for the accepted `CLOSED_PASS_BOUNDED` decision and
`docs/reviews/CVF_SYSTEM_CHAIN_T5_FINAL_REVERSE_PROJECTION_AUDIT_2026-07-15.md`
for the full matrices.

## SCLP-X Exhaustive-Proof Chain Final Readout

The SCLP-X roadmap (`docs/roadmaps/CVF_SYSTEM_CHAIN_EXHAUSTIVE_E2E_PROOF_ROADMAP_2026-07-15.md`)
ran a separate exhaustive-inventory question across four canonical source
families (5 map lanes, 20 interlock connections, 50 governance controls, 24
catalog entities; 99 source records) distinct from the five-lane picture
above. T0 built a 99-claim inventory (5 `PROVEN`, 78
`STATIC_NOT_APPLICABLE`, 13 `VALUE_PARKED`, 3 `MISSING_PROOF`). T1 ranked the
three `MISSING_PROOF` claims and selected GC-009 (`MandatoryGateway`) and
GC-010 (`AgentExecutionRuntime`) for future read-only caller verification. T2
ran a repository-wide read-only search (22,026 files, 500 raw hits, 329
terminal match-ledger rows, zero ambiguous rows) and found
`NO_NON_TEST_PRODUCTION_CALLER_FOUND` for both controls. T2G1 recorded that
finding as one paired architecture GAP,
`cvf.asc.gap.gc009_gc010_no_production_caller.v1` (see
`docs/reference/system_chain/gaps/README.md`). T4 built a final 99-row
reverse projection reconciling all four tranches with zero silent rows and
zero unmapped destinations; see
`docs/reference/system_chain/CVF_SYSTEM_CHAIN_EXHAUSTIVE_PROOF_FINAL_PROJECTION.json`
and
`docs/audits/CVF_SYSTEM_CHAIN_EXHAUSTIVE_PROOF_T4_FINAL_REVERSE_PROJECTION_AUDIT_2026-07-15.md`.

SCLP-X claim boundary: this chain accounts for 99 claims across four
canonical source families and records GC-009/GC-010 as
invocation-unproven with a discoverable architecture GAP. T3 (an
operator-surface or provider proof batch) remains
`VALUE_PARKED_WITH_REOPEN_CONDITION`: reopen only if a current non-test
production caller or active package export is later source-proven for
GC-009 or GC-010. This chain does not claim universal CVF end-to-end proof,
does not claim GC-009 or GC-010 is production-invoked, and does not claim
production, public, scale, certification, shipment, or real-user readiness.

## Operator Readout

If you need to know "is CVF's governance chain actually wired together,"
read the five lane postures above before trusting any single component's
own claim. If you need to know whether this map itself is still trustworthy,
run:

```
python governance/compat/check_system_chain_map_freshness.py --as-of-date <YYYY-MM-DD> --json --enforce
```

A `CURRENT` result means every fingerprinted source still matches its
recorded hash, the Markdown and JSON lane records still agree, and the map
was reviewed within the last 30 days. Any other result names a specific
remediation action - see
`docs/reference/system_chain/CVF_SYSTEM_CHAIN_FRESHNESS_STANDARD.md`.

## No-Auto-Semantics Guarantee

Detecting source drift or review-age expiry **never** rewrites a lane's
`currentPosture` or `verdict` automatically. Only a fresh governed review
that reads the changed source and issues a new accepted finding may update
those fields. The freshness checker's role is limited to flagging that a
review is due, not deciding what the review should conclude.

## Claim Boundary

This reference presents the five lane verdicts reviewer-accepted by
MSEA-R90 Audit A at material commit `645df8b83`. It does not certify
semantic correctness of every governed artifact in the repository, does not
prove all fifty Governance Control Matrix rows are runtime-connected, does
not claim a unified Web inventory exists for all 186 `governance/compat`
checkers, does not reopen or re-decide the R72F lifecycle disposition for
the nine cross-family checkers, and does not authorize a Web dashboard,
runtime/provider/live behavior, public export, or session-state mutation.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | repo-local reference summarizing reviewer-accepted MSEA-R90 Audit A findings |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE: five lane postures with source citations; no new semantic finding beyond R90 acceptance |
| receiptEvidence | N/A with reason: this reference has no runtime execution receipt of its own; its evidence is the cited R90 audit and reviewer completion artifacts |
| actionEvidence | ACTION_EVIDENCE_PRESENT: source fingerprints recomputed and verified against current repository content at authoring time |
| invocationBoundary | manually authored governed reference plus a companion machine-checkable freshness checker |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, or Web interception claim |
| claimLanguage | source-backed summary and freshness-detection reference, not a new audit |
| forbiddenExpansion | no Web dashboard, runtime/provider/live behavior, public export, R72F lifecycle re-decision, session-state mutation, or automatic semantic-verdict rewrite |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: no public-sync authorization exists for MSEA-R91.
