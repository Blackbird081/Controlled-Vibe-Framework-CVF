# CVF Review Cost And Diminishing Return Control Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

docType: reference

Date: 2026-08-29

Batch ID: SOT3-RCS-T1

## Purpose

Convert the machine-safe part of ADIF-0026 (sequential reviewer finding
cascade) into a provider-neutral, forward-only evidence-shape contract for
review-cost telemetry, without automating semantic value judgment. This
standard defines what every changed completion review must record and what
every changed work order must prove before dispatch. It does not decide
whether a review's findings are correct or whether a root cause is truly
independent.

## Scope / Applies To

Applies to every changed `docs/reviews/*.md` artifact declaring
`docType: completion_review`. Such an artifact must carry the exact standalone
declaration line `Review-Cost Telemetry: REQUIRED`. Unchanged historical
reviews and archived reviews are not reopened.

The completion-review telemetry declaration does not apply to work orders,
baselines, roadmaps, standards, tests, or this checker's own source file. The
separate dispatch control below applies forward-only to every changed,
non-archived work order declaring `docType: work_order`.

## Review Dispatch Convergence And Invocation Budget Control

Every changed work order must carry the exact standalone declaration
`Review-Dispatch Convergence Control: REQUIRED` and these scalar fields:

- `dispatchKind`, `dispatchSurface`, and `parentAssignmentId`;
- `reviewRoundCount` and `priorFindingSetDigest`;
- `dependencyAuditDisposition`, `reworkFindingDisposition`,
  `newIndependentCriticalEvidence`, and `regressionGuardDisposition`;
- `cumulativeExternalInvocationCount`, `externalInvocationCeiling`,
  `usageAvailability`, and `quotaAdmissionDisposition`;
- `nextDispatchDisposition`.
- `rootCauseClusterId`, `reworkGeneration`, and
  `consolidatedDefectClassSweep`;
- `successorTrancheOpened` and `implementationAutonomyDisposition`.
- `preExecutionReviewAdmission`, `preExecutionReviewTrigger`,
  `nextRoutineReviewBoundary`, and `reviewerWorkBoundary`.

An `INITIAL` dispatch uses round zero, a complete initial acceptance matrix,
baseline negative-test planning, and no prior finding digest. A `REWORK`
dispatch requires a SHA-256 binding to one consolidated finding set, a full
dependency audit completed before the first repair, and a regression guard for
every targeted defect. Round two additionally requires exact evidence IDs for
a genuinely new independent critical root cause. Round three and later are not
eligible for automatic re-dispatch.

For `EXTERNAL_AGENT_CLI_MCP`, the parent-assignment cumulative invocation count
must be strictly below its ceiling before the next invocation, and admission
usage must be known. Unknown usage, a reached ceiling, or a missing cumulative
envelope fails closed. `INTERNAL_AGENT` uses the explicit not-applicable
posture because provider-native helpers inside one already-authorized parent
session are outside this separately-dispatched invocation count.

This is a pre-dispatch evidence and admission interlock. It does not intercept
an out-of-band shell, IDE, MCP server, or provider call that bypasses CVF's
governed work-order/autorun path.

`successorTrancheOpened` is always `NO` at dispatch and worker return. A
dependent repair remains inside the current root-cause cluster; only the
reviewer/orchestrator may authorize a successor after identifying independent
critical evidence or a changed authority boundary. `reworkGeneration` equals
the review round for rework and is zero for initial dispatch.

## Worker Return Convergence Self-Proof

Every changed self-declared worker return must record one compact, observable
self-proof envelope before claiming readiness:

- stable `rootCauseClusterId`, non-negative `reworkGeneration`, and
  `consolidatedDefectClassSweep: COMPLETE_ALL_KNOWN_DEPENDENCIES`;
- non-placeholder `productionBindingEvidence` and
  `adversarialRegressionDisposition: PASS_TARGETED_DEFECT_CLASS`;
- `successorTrancheOpened: NO` and
  `implementationAutonomyDisposition: CONTRACT_AUTHORITY_EVIDENCE_OUTCOME_ONLY`;
- non-negative internal-agent, external-agent, and provider invocation counts,
  plus numeric quota usage or an explicit unavailable reason;
- `terminalReadinessVerdict: READY_FOR_REVIEW` or a reason-bearing blocked
  verdict.

This is not a reasoning trace and does not prescribe algorithms, prompts,
tool order, code structure, or provider-specific working style. CVF governs
authority, observable contracts, invariants, evidence, budgets, and outcomes.
The worker retains implementation autonomy inside those boundaries. The
reviewer remains the independent safety net, not the first party expected to
discover predictable dependent cases.

The canonical local helper is
`governance/compat/build_dispatch_packet_scaffold.py`. It emits checker-ready
INITIAL or REWORK envelopes and can include the paired worker-return skeleton.
It is deterministic, local-only, has zero provider/network calls, and rejects
round-three rework, malformed finding digests, or external invocation counts
at/above their ceiling before emitting a packet. The separate
`run_worker_return_scaffold.py` emits the same self-proof envelope so the two
worker-return generators cannot silently drift on this contract.

## Declaration

A changed completion review must include this exact standalone line
(its own paragraph, not inside a code fence or backtick span):

```text
Review-Cost Telemetry: REQUIRED
```

Once present, the review must include a `## Review Cost Telemetry And Stop
Disposition` section (or equivalently named telemetry section containing all
required fields below).

## Required Fields

An applicable review must declare all fields below:

| Field | Shape |
|---|---|
| `reviewRoundCount` | non-negative integer |
| `workerRepairTurnCount` | non-negative integer |
| `newRootCauseCountThisRound` | non-negative integer |
| `dependentFindingCountThisRound` | non-negative integer |
| `elapsedReviewMinutes` | non-negative integer, or `NOT_AVAILABLE_WITH_REASON` followed by a reason |
| `providerCallCount` | non-negative integer |
| `tokenOrQuotaUsage` | non-negative integer, or `NOT_AVAILABLE_WITH_REASON` followed by a reason |
| `valueDelta` | non-empty reviewer statement (free text); never a bare number and never auto-scored |
| `stopDisposition` | one of the five allowed tokens below |
| `preRepairAuditDisposition` | one of the three audit tokens below |
| `materialCommitCount` | non-negative integer |
| `continuityCommitCount` | non-negative integer |
| `commitPlanDisposition` | one of the four normal tokens below, or `EXCEPTION_WITH_REASON` followed by a reason |
| `latencyDisposition` | one of the four normal tokens below, or `LATENCY_BUDGET_EXCEEDED_WITH_REASON` followed by a reason |
| `avoidableDelayClass` | one of the seven allowed delay tokens below |

`elapsedReviewMinutes` and `tokenOrQuotaUsage` are the only two fields where
ADIF-0026 permits an explicit unavailable reason instead of a number, because
cross-agent wall-clock and provider-neutral token accounting are not always
exposed in the governed workspace. Every other numeric field must be a
concrete non-negative integer; a worker or reviewer that cannot produce one
must not fabricate a number, and must instead route the review as
`BLOCKED_WITH_REASON` upstream of this telemetry section, not answer with
`NOT_AVAILABLE_WITH_REASON` on a field this standard does not exempt.

## Single-Pass Review Latency SOP

This is the default CVF reviewer and closer SOP for every agent and provider.
Before the first repair, the reviewer must inspect the entire bounded change as
one dependency graph and record a matrix covering contract/schema fields,
authority and source claims, path and repository boundaries, negative cases,
test adequacy, closure range, and commit choreography. Predictable dependent
findings return together. If that audit cannot be completed, the review stops
as `BLOCKED_REVIEW_MATRIX_INCOMPLETE`; it does not start a repair loop.

The fast-path target is at most 10 elapsed minutes for a bounded local review
when each focused command completes within 60 seconds and the work requires no
live provider, browser, corpus-scale scan, external service, operator wait, or
public-sync action. This target is operational telemetry, not a waiver of a
critical defect. An eligible review that exceeds it records
`LATENCY_BUDGET_EXCEEDED_WITH_REASON` and classifies the avoidable delay.

The default closure choreography is one material commit followed by at most
one continuity commit. Semantic inspection and bounded repairs finish before
the material commit. Committing early, discovering the committed-range split
afterward, or using repeated broad gates to discover literal requirements are
review-process defects. More than one commit in either lane requires
`EXCEPTION_WITH_REASON`; a hook-created retry does not by itself justify an
extra material commit.

Use this order:

1. Capture the review base and exact worker manifest.
2. Read the controlling packet, applicable checker sources, and the full
   changed set once.
3. Build the single-pass dependency-closure matrix and commit/range plan.
4. Run the return-time closeability test below and classify every blocker by
   its earliest prevention owner.
5. Return or apply one consolidated repair set.
6. Run focused tests and narrow checkers, then the phase gate once.
7. Create one material commit; run committed-range closure on its exact range.
8. Create one continuity commit only when mode or next-move state changed.

## Return-Time Closeability And Agent-Intelligence Preservation

Before a reviewer sends any repair prompt, the reviewer must determine whether
the current work order can reach its required terminal state without any role
violating its authority. A work order is closeable only when all of these are
true:

- every mandatory gate has a phase, an evidence owner, and, when a failure can
  require mutation, a role that owns the complete legitimate repair surface;
- a gate required before reviewer acceptance does not depend on a write owned
  only by a later closer or session-sync phase;
- exact paths, allowed path families, generated outputs, file-size splits,
  migrations, and catalog regeneration can coexist without contradiction;
- the worker can exercise implementation judgment inside the accepted outcome,
  invariants, risk, authority, protected-path, and external-effect envelope;
  and
- a required terminal token does not demand evidence that the current role is
  forbidden or technically unable to produce.

This is a responsibility-topology test, not an implementation-design review.
CVF constrains outcomes, authority, risks, external effects, protected paths,
evidence, and terminal claims. It must not require a reviewer or dispatcher to
pre-select ordinary internal decomposition merely to make the packet appear
exact. When physical implementation topology cannot be predicted honestly,
the packet should authorize a bounded path family or derived-output class. A
protected or authority-bearing path still requires explicit ownership.

If the test fails, set the worker route to fail-stop. Do not send another
worker repair prompt against the contradictory packet. Apply exactly one of:

1. reviewer-local repair, when the existing reviewer authority and the rules
   below permit it;
2. one consolidated orchestrator amendment, only when ordinary implementation
   topology or gate-phase wording must be corrected inside unchanged allowed
   path and artifact classes, authority ceiling, external-effect class, role
   route, protected-path boundary, and commit ownership; or
3. operator escalation, when business intent, risk, authority, external
   effects, irreversible action, budget, or claim ceiling must change.

The operator escalation must be understandable without reading code or a
governance packet. It states the desired outcome affected, the conflict, its
risk, what agents can resolve autonomously, and the smallest operator decision
still required. A non-coder operator is not the fallback debugger for worker
implementation, path manifests, role choreography, or gate ordering.

When the worker had no lawful route to PASS, classify the causal defect at the
earliest applicable owner, normally `ORCHESTRATOR_PACKET_GAP`,
`PHASE_GATE_PLACEMENT_GAP`, or `MACHINE_GATE_GAP`. Preserve any independent
`WORKER_EXECUTION_ERROR` findings separately; a packet defect neither erases
nor proves a worker defect.

## Same-Scope Authority Continuity And Micro-Checkpoint Prevention

An operator instruction to continue, handle, or finish a bounded task after an
escalation remains effective for dependent corrections within that same task.
An agent must not silently reinterpret it as authority for exactly one repair
turn unless the operator or controlling packet explicitly states that limit.

Continue without another operator checkpoint only while all of these remain
unchanged:

- objective and acceptance item;
- allowed path and artifact classes;
- risk and authority ceiling;
- external-effect class, including provider, network, public, destructive,
  secrets, and quota posture; and
- role routing and commit ownership.

A reviewer finding that narrows an already-open acceptance item to another
source-backed dependent detail is not by itself a new scope event. Consolidate
and repair the full dependency once, then perform one independent re-review.

Return to the operator only when at least one boundary above changes, an
operator-set budget is actually exhausted, or the evidence reveals a new
independent critical authority, fail-open, integrity, or irreversible-action
root cause. Without such a change, another confirmation request is
`AVOIDABLE_OPERATOR_WAIT`; it adds latency without adding governance value.

This rule preserves fail-closed behavior. It does not let an agent widen scope,
ignore an explicit numerical cap, perform a forbidden action, or self-authorize
live/provider/public/destructive work. The current checker does not infer these
semantic facts; reviewers and closers must apply them from evidence.

## Independent Review Probe Admission Boundary

A recurring failure class exists across worker/model quality: a worker's own
passing test suite, or a second assertion over the same implementation
oracle, is not independent evidence for high-risk work. ACEL-G1-T3A-C2's R3-R1
history is the concrete recurrence: worker self-tests reached 50/50 and 81/81
green while an independent Local probe still found a caller-controlled
authority-override path and a raw-text JSON duplicate-member defect that the
worker's own suite never exercised. This section extends this standard's
existing review-admission and dispatch-convergence ownership to close that
gap without creating a parallel review system.

### Trigger Vocabulary

Work is `independentProbeRequired: YES` when it touches at least one of:
high-risk authority, canonicalization, integrity, secret, irreversible, live,
or public-effect surfaces. Work with none of these is
`independentProbeRequired: NOT_APPLICABLE_WITH_REASON` followed by a
non-empty reason. Every active changed work order (`docType: work_order`,
outside `/archive/`) must declare exactly one `independentProbeRequired`
occurrence; a work order that omits it entirely is not exempt by omission.

A narrow, deterministic high-risk marker set makes the N/A choice illegal
regardless of the dispatcher's own preference, so a risky packet cannot
opt out by never writing `YES`: a literal `## Core Guard Self-Protection
Authorization` heading (protected/authority-bearing path); a
`providerExecutionAuthority` field whose value is not `FORBIDDEN` (an
actually-granted provider/live surface); a literal `canonicaliz` substring
(canonicalization surface); or a literal `Party A` mention (secret/
irreversible key-ceremony surface). Any changed work order carrying one of
these markers must declare `independentProbeRequired: YES`; declaring
`NOT_APPLICABLE_WITH_REASON` next to a present marker is rejected. This
marker set is a narrow, literal, low-false-positive floor, not a claim that
absence of a marker proves the work is genuinely low-risk; a dispatcher may
still and should still declare `YES` for a risk the marker set does not
name. The machine boundary below enforces only marker-triggered token
selection, field presence, and reason non-emptiness -- not that a `YES`
declaration made without a marker present was the semantically correct
call. Trigger classification beyond the marker floor remains reviewer/
dispatcher judgment, consistent with the Trigger-Based Review Admission
Boundary above.

### Dispatch-Time Plan Requirement

A changed work order (`docType: work_order`) declaring
`independentProbeRequired: YES` must carry a complete
`Independent Review Probe Admission Contract` block naming:
`independentProbeRiskClass`, `independentProbeDispositionAtDispatch`,
`probeExecutorRole`, `implementationOracleSeparation`, `positiveControl`,
`negativeMutationClasses`, `expectedInformationGain`, `rerunCostReason`, and
`reviewerDecisionOwner`. `probeExecutorRole` must name a non-worker role (for
example `LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER`), never the implementation
worker itself. This is the minimal sufficient dispatch-time plan, not a
broader mandatory review stage; it does not override the existing
Trigger-Based Review Admission Boundary for when a *pre-execution* review is
separately admitted.

### Closure-Time Evidence Requirement

A changed, closure-claiming review or completion artifact answering
high-risk work carries `independentProbeDisposition`, one of:

- `PENDING_REVIEWER_EXECUTION` -- valid only while the artifact's own status
  is a non-terminal worker-return state (for example
  `COMPLETE_PENDING_REVIEW` or `BLOCKED_WITH_REASON`); never valid on an
  artifact whose status or disposition claims a terminal accepted/closed
  outcome.
- `PASS_INDEPENDENT_PROBE` -- valid only when the artifact also names a
  `probeExecutorActor` distinct from the implementation worker, a
  `probeCommandOrMethod`, a `probeObservedResult`, and an
  `oracleSeparationBasis` stating why the probe used a different execution
  and assertion path than the worker's own suite. A worker's own test suite
  name, or a probe whose command or oracle is identical to the worker's own
  implementation/test oracle, does not satisfy `oracleSeparationBasis`.
- `FAIL_INDEPENDENT_PROBE` or `BLOCKED_INDEPENDENT_PROBE_WITH_REASON` --
  reviewer-owned negative outcomes; both block a closure claim exactly as
  `PENDING_REVIEWER_EXECUTION` does.

Only `PASS_INDEPENDENT_PROBE` may accompany a terminal closed/accepted
disposition on an artifact whose dispatch declared
`independentProbeRequired: YES`. This is a structural evidence-shape and role-
separation check. It does not judge whether the named probe was semantically
sufficient, whether `oracleSeparationBasis` is truthfully independent in
substance, or whether the reviewer's disposition was the correct call; those
remain exclusively reviewer/orchestrator judgment, identical in kind to this
standard's existing `stopDisposition` and review-admission-trigger boundaries.

### Closure-Linkage Resolution

Closure-time applicability is not limited to an artifact that already
declares `independentProbeDisposition` on its own. An artifact carrying an
exact repo-relative `dispatchWorkOrder` or `Responds to work order`
reference is also applicable: the referenced active work order is loaded,
and when it declares `independentProbeRequired: YES`, the referencing
artifact must carry exactly one `independentProbeDisposition`. A reference
that is missing, ambiguous (two disagreeing reference fields), empty,
non-`.md`, traversal-bearing, pointing to a non-existent file, or pointing
into an archived path fails closed as an admission-boundary violation, not
as silently not-applicable; a document that plainly intends to link to a
work order does not escape the control by linking incorrectly. This closes
the class of defect where a terminal review omits the disposition field
entirely while its linked work order required independent review.

### Oracle Fingerprint And Evidence Binding

A terminal `PASS_INDEPENDENT_PROBE` additionally carries exactly one each of
`workerOracleSha256`, `probeOracleSha256`, `workerEvidenceRef`, and
`probeEvidenceRef`. The two digests are canonical lowercase 64-hex SHA-256
values and must be unequal; the two evidence references are normalized,
non-empty, repo-relative, non-traversing paths and must be unequal. These
fields bind the closure claim to concrete, distinguishable artifacts on both
the worker and reviewer side, beyond the invocation-ID and command-
fingerprint separation this standard already required, so an arbitrary
label pair can no longer satisfy the machine shape. As with every other
control in this section, the guard validates the declared binding's shape
and distinctness only; whether the cited oracle and evidence artifacts are
themselves the correct, substantively independent proof remains reviewer
judgment.

### Status Authority And Field Grammar

Only the metadata preamble -- the document text before its first level-two
(`## `) section heading -- is ever read for the authoritative `Status:`
declaration. Exactly one preamble `Status:` occurrence is required; zero or
more than one, even when every occurrence carries the identical value, is
treated as missing/ambiguous and rejects an applicable closure evaluation.
Body prose, tables, blockquotes, inline code, and fenced examples never
count toward this or any other field's cardinality, including an empty
duplicate declaration, which must be counted before value validation rather
than silently dropped. Every reason-bearing token
(`NOT_APPLICABLE_WITH_REASON`, `BLOCKED_INDEPENDENT_PROBE_WITH_REASON`)
requires the token's exact `PREFIX`, `PREFIX: reason`, or `PREFIX-reason`
grammar; a suffix token such as `NOT_APPLICABLE_WITH_REASONX` is not the
same token and is rejected, not accepted as a reasoned variant.
Dispatch-plan fields are read only from the
text inside exactly one `## Independent Review Probe Admission Contract`
section, never from unrelated historical or body prose elsewhere in the
document; a second such heading is itself a violation. `probeExecutorRole`
and `reviewerDecisionOwner` require their exact controlled tokens
(`LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER` and `LOCAL` respectively), not a
substring match, so a malicious composite string naming the worker role
inside a longer value cannot pass by containing the exempting phrase.

### Integrated Root Contract: Shared Parsing Substrate

Every dispatch-time, link-resolution, closure-time, and status-authority read
in this boundary is served by one shared declaration-scanning primitive, not
independent ad hoc parsing per call site; identical masking and cardinality
semantics therefore apply everywhere a field is read. A fenced block is
recognized whether it opens with three or more backtick characters or three
or more tilde characters, and closes only on a line using the SAME delimiter
character whose run length is at least as long as the opener's, per the
CommonMark fence-closing rule; a `Status:` or any other field declaration
appearing only inside such a fence, regardless of its delimiter length or
character, never counts as a real declaration. A controlled scalar's
cardinality (`EXACTLY_ONE` or `ZERO_OR_ONE`) is evaluated by counting
declarations, including empty ones, before any value is interpreted, so an
empty duplicate can never hide behind a valid later value.

An HTML comment is masked through its closing `-->`, or through end of file
when no closer exists, so an unterminated comment cannot manufacture a
declaration. When a caller explicitly supplies `--active-work-order` under
`--changed-lane-only`, failure to resolve that work order and exactly one valid
declared worker-return path is itself a gate violation; an invalid binding is
never silently treated as though no active binding had been requested.

The two supported link field names (`dispatchWorkOrder` and `Responds to
work order`) are resolved as aliases for one logical reference: cardinality
is checked per field name (each may occur at most once), and when both are
declared they must name the same target; declaring both once each with
matching values -- this repository's own established template convention --
is the normal case, not a duplicate, while a true duplicate (the same field
name declared twice) or a disagreeing pair both fail closed.

An evidence reference (`workerEvidenceRef`, `probeEvidenceRef`) must be a
canonical repo-relative path: no URI scheme, no UNC or absolute or drive
path, no backslashes, no empty/`.`/`..` segments, no repeated separators,
and no path resolving outside the repository. A terminal `PASS_INDEPENDENT_
PROBE`'s declared `workerOracleSha256`/`probeOracleSha256` is not merely
checked for canonical hex syntax; it is independently recomputed as the
SHA-256 of the actual bytes at its paired evidence reference on disk, and
the declared digest must equal that recomputed value. An evidence reference
that does not exist as a regular file, or that names the closure document
itself, fails closed before any digest comparison is attempted.

A CommonMark inline code span (a run of N backticks closed by the next run
of exactly N, which may itself span multiple lines) is masked in full,
except a single-line span sitting directly after a bare `fieldName:` prefix
-- the one legitimate backtick-wrapped value shape. A declaration-shaped
line (for example `Status: CLOSED_PASS_BOUNDED`) sitting only inside a
multi-line inline code quote, regardless of delimiter length, never counts
as a real declaration; only masking a single fixed backtick-and-colon
pattern left this class of quote unmasked.

Role separation under a terminal `PASS_INDEPENDENT_PROBE` is a structural
contract, not a keyword blacklist against free-form actor prose: the
closure carries exactly one controlled `probeExecutorRole` token (the same
exact non-worker token a dispatch plan requires) plus two distinct
canonically normalized actor IDs, `implementationWorkerActor` and
`probeExecutorActor`. Canonicalization inserts a separator at camelCase word
boundaries, collapses whitespace/hyphens/underscores to one underscore, and
uppercases, so `Claude implementation worker`, `implementation_worker`, and
`ImplementationWorker` all normalize identically; separation is judged by
these two canonical IDs being unequal, never by scanning either actor
string for a worker-identity keyword. A free-form phrase naming the worker
without using any enumerated marker word (for example a plain provider or
agent label) is therefore still caught when declared as both actors,
because the two canonical IDs are then equal, not because the phrase itself
was recognized.

### Forward-Only Changed-Lane Boundary

The admission gate always diagnoses every applicable artifact in the full
working-tree surface (the requested base..head range, the live and staged
diff, and every untracked file), so a real applicable artifact is never
silently skipped. A separate, narrower changed-lane filter -- invoked by the
worker-return fast gate as `--changed-lane-only` -- additionally restricts
which violations can fail that gate to paths inside the base..head diff or
the live/staged diff only, excluding the blanket untracked-file sweep. Git
trackedness alone cannot distinguish an artifact the current dispatch is
actively producing (necessarily untracked while `WORKER_MUST_NOT_COMMIT`
holds) from a pre-existing untracked artifact abandoned by an unrelated,
already-parked tranche; the caller therefore names the current dispatch's
own work order explicitly via `--active-work-order`, and the checker reads
that file's own `Worker return path:` declaration to add the artifact it
names to the lane unconditionally, regardless of tracked status. A
violation on a pre-existing untracked artifact not named this way is still
printed as a known finding, but does not block an unrelated dispatcher's
commit; a violation on a path actually inside the current lane -- including
the active dispatch's own return -- still fails the gate exactly as before.
This closes the class of defect where policing an entire repository
snapshot let a stale, disconnected finding block unrelated work indefinitely,
while also closing the narrower defect where the CURRENT dispatch's own
untracked return could itself escape the lane it was meant to police.

### Machine-Enforceable Boundary Addendum

| Control | Machine disposition |
|---|---|
| dispatch-time plan field presence for `independentProbeRequired: YES` | ENFORCE |
| `probeExecutorRole` and `reviewerDecisionOwner` use their exact controlled tokens | ENFORCE |
| dispatch-plan fields are read only from exactly one contract section | ENFORCE |
| closure-time `independentProbeDisposition` token shape and reason grammar | ENFORCE |
| closure applicability resolves from an exact linked work-order reference | ENFORCE |
| unresolvable linked work-order reference fails closed | ENFORCE |
| `PENDING_REVIEWER_EXECUTION`/fail/blocked tokens rejected on a terminal closed/accepted disposition | ENFORCE |
| exactly one authoritative metadata-preamble `Status:` declaration | ENFORCE |
| fenced-block recognition covers any matching-delimiter backtick or tilde run | ENFORCE |
| evidence references are canonical repo-relative paths to existing, non-self-referential files | ENFORCE |
| declared oracle digests are recomputed against actual evidence-file bytes | ENFORCE |
| worker-identity comparison is structural (camelCase/case/separator-normalized), not an enumerated substring list | ENFORCE |
| a multi-line inline code span never creates a real declaration | ENFORCE |
| `PASS_INDEPENDENT_PROBE` requires a controlled role token plus two distinct normalized actor IDs | ENFORCE |
| changed-lane-only gate scope excludes pre-existing unrelated untracked findings | ENFORCE |
| `--active-work-order`'s declared return path is always in the changed lane regardless of tracked status | ENFORCE |
| an explicitly supplied invalid `--active-work-order` binding fails closed | ENFORCE |
| closed and unterminated HTML comments cannot create declarations | ENFORCE |
| `PASS_INDEPENDENT_PROBE` requires actor, command, result, and separation-basis fields | ENFORCE |
| `PASS_INDEPENDENT_PROBE` requires distinct oracle digest and evidence-reference bindings | ENFORCE |
| worker-identical actor or worker-identical command/oracle literal match under `PASS_INDEPENDENT_PROBE` | ENFORCE |
| whether `independentProbeRequired` trigger classification is correct | REVIEWER_JUDGMENT |
| whether a named probe was semantically sufficient | REVIEWER_JUDGMENT |
| whether `oracleSeparationBasis` is truthfully independent in substance | REVIEWER_JUDGMENT |
| whether a cited oracle/evidence artifact is substantively the correct proof | REVIEWER_JUDGMENT |

## Trigger-Based Review Admission Boundary

Review is admitted by a control event, not by the number of artifacts, roles,
steps, commits, or handoffs in a workflow. A routine independent review belongs
at the returned-result boundary where the reviewer owns a disposition such as
accept, return to design, freeze, or closure. Pre-execution review is admitted
only when at least one of these triggers is present:

- a frozen identity mismatch or unresolved source/authority contradiction;
- a new independent critical integrity, fail-open, secret, irreversible, live,
  provider, public, destructive, or production-risk boundary;
- a requested scope or authority expansion beyond the accepted design;
- machine evidence is incomplete or materially `UNCLASSIFIED` for the decision
  being requested; or
- the operator explicitly requests that specific review.

The following events do not independently admit another review:

- authoring a work order from an already accepted design;
- changing agent, provider, role label, or single/multi-agent topology;
- a worker handoff, material commit, continuity sync, or session resume;
- passing deterministic machine gates; or
- correcting dependent findings inside the same accepted objective, path
  classes, risk ceiling, external-effect class, role route, and commit owner.

When no admission trigger exists, successful mechanical preflight moves the
packet directly to dispatch readiness. Do not add a just-in-case reviewer and
do not split one authority transition into packet review plus a second operator
micro-checkpoint. If an unplanned review has already occurred, consume its
valid evidence without converting that historical event into a mandatory stage
for the current or future workflow.

Reviewers inspect and challenge returned evidence; they do not recreate the
worker's implementation or repeat every upstream role's work. A later terminal
review may verify that earlier mechanical corrections were applied as part of
its bounded evidence sample, without opening a separate review cycle.

### Universal Discovery And Active Measurement Binding

This rule is a standing reviewer invariant, not an operator-reminder-driven
exception. P4-C1 automatic evidence collection was materially activated at
`b9bdba712`; the current eligible count and checkpoint state must be resolved
from the bootstrap read model and active handoff at every dispatch, review,
closure, and resumed session. The activation commit is an immutable historical
anchor, while continuity owns the moving measurement state.

Every reviewer applies
`EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION`. Valid returned and
machine evidence is consumed. Per-row review and broad duplicate reruns are
not admitted. A focused rerun requires a named insufficiency or contradiction,
a bounded claim, expected information gain, and a cost/latency reason. P4-C1
routine aggregation remains at M5, M10, M20, or an existing safety trigger.
Agents must apply this binding proactively; absence of an operator reminder
does not suspend it.

Review-admission trigger classification remains reviewer/orchestrator judgment.
Machine checks may enforce declared evidence shape and objective trigger facts,
but must not manufacture semantic criticality or require review merely because
a new artifact or role boundary exists.

The forward-only machine contract uses these exact values:

- `preExecutionReviewAdmission` is either
  `NOT_REQUIRED_BEFORE_EXECUTION` or `REQUIRED_TRIGGERED`;
- `preExecutionReviewTrigger` is `NONE`,
  `FROZEN_IDENTITY_MISMATCH`, `SOURCE_AUTHORITY_CONTRADICTION`,
  `NEW_INDEPENDENT_CRITICAL_RISK`, `AUTHORITY_SCOPE_EXPANSION`,
  `MATERIAL_UNCLASSIFIED`, or `OPERATOR_EXPLICIT_REQUEST`;
- `nextRoutineReviewBoundary` is `WORKER_RETURN`, `TERMINAL_RESULT`, or
  `PRE_EXECUTION_REVIEW`; and
- `reviewerWorkBoundary` is
  `EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION`.

`NOT_REQUIRED_BEFORE_EXECUTION` requires trigger `NONE` and cannot route to
`PRE_EXECUTION_REVIEW`. `REQUIRED_TRIGGERED` requires a non-`NONE` trigger and
routes to `PRE_EXECUTION_REVIEW`. The checker also rejects the obvious
contradiction where a packet declares review unnecessary but its status or
prose still requires independent review before worker execution. This is a
closed contradiction check, not semantic inference over arbitrary prose.

## Reviewer-Local Repair Versus Worker Return Routing

A reviewer does not return every defect to the worker merely because the
worker authored the implementation. Agent or role purity is not a control
objective. Once the result and its evidence are at the ordinary review
boundary, the default is one consolidated reviewer-local correction when all
of these conditions hold:

- the objective, accepted design, allowed path set, authority ceiling,
  external-effect class and commit owner remain unchanged;
- the correction is localized and fully determined by evidence already read
  during review;
- the correction does not redesign the algorithm, recreate the deliverable,
  acquire new source evidence or require hidden worker context;
- focused tests or existing deterministic evidence can verify it; and
- applying the correction is cheaper than making another agent reload the
  controlling authority, sources, changed set and finding context.

Return the finding set to a worker only when at least one of these boundaries
is crossed:

- algorithm, architecture, design, source-of-truth interpretation or semantic
  implementation must materially change;
- allowed paths, risk, authority or external effects must expand;
- new evidence must be acquired or the reviewer cannot determine the repair
  from the closed review input set;
- the correction is broad enough that reviewer implementation would recreate
  the worker's work rather than repair its returned evidence; or
- a controlling work order expressly forbids reviewer repair.

Context reload is governance tax. Its cost includes the additional agent
invocation and the repeated reading needed to reconstruct authority, source
identity, changed-set intent and prior findings. Do not incur that tax solely
to preserve role labels. In multi-agent or multi-role work, changing the actor
does not itself increase independence; independence comes from source-bound
evidence, deterministic checks and reviewer-owned disposition.

The reviewer must still consolidate connected findings before the first
repair and must not silently widen scope. A reviewer-local correction remains
disclosed in the existing return or completion evidence and is verified with
the narrowest sufficient tests. This rule adds no mandatory packet, field,
checker invocation or separate review round. Machine checks do not attempt to
infer whether a semantic repair is small; the reviewer applies this routing
boundary from the evidence and the operator may override it explicitly.

## Audit, Commit, Latency, And Delay Vocabularies

`preRepairAuditDisposition` must be exactly one of:

- `COMPLETE_BEFORE_FIRST_REPAIR`
- `NO_REPAIR_REQUIRED`
- `BLOCKED_REVIEW_MATRIX_INCOMPLETE`

`commitPlanDisposition` must be exactly one of:

- `DEFAULT_ONE_MATERIAL_ONE_CONTINUITY`
- `MATERIAL_ONLY`
- `NO_COMMIT_REVIEW`
- `CONTINUITY_ONLY`
- `EXCEPTION_WITH_REASON: <reason>`

`latencyDisposition` must be exactly one of:

- `WITHIN_FAST_PATH_TARGET`
- `EXPECTED_LONG_RUNNING_PROOF`
- `EXTERNAL_WAIT`
- `NOT_MEASURED_WITH_REASON: <reason>`
- `LATENCY_BUDGET_EXCEEDED_WITH_REASON: <reason>`

`avoidableDelayClass` must be exactly one of:

- `NONE`
- `SEQUENTIAL_FINDING_CASCADE`
- `PREMATURE_COMMIT`
- `RANGE_RECOMPUTATION`
- `GATE_DISCOVERY_LOOP`
- `WORKTREE_CHURN`
- `MULTIPLE_AVOIDABLE_DELAYS`

If `materialCommitCount > 1` or `continuityCommitCount > 1`,
`commitPlanDisposition` must start with `EXCEPTION_WITH_REASON:`.

## Stop-Disposition Vocabulary

`stopDisposition` must be exactly one of:

- `CONTINUE_NEW_CRITICAL_EVIDENCE`
- `CONSOLIDATE_SINGLE_REPAIR`
- `PARK_LOW_INCREMENTAL_VALUE`
- `COMPLETE_REVIEW`
- `REVIEW_COST_ESCALATION_REQUIRED`

No other token, synonym, or free-text substitute is accepted. Choosing which
token is semantically correct for a given round remains reviewer judgment;
this standard and its checker enforce only that the declared token is one of
the five, not that it is the right one for the evidence.

## Round-Three Escalation Rule

If `reviewRoundCount >= 3`, `stopDisposition` must be exactly
`REVIEW_COST_ESCALATION_REQUIRED` or `CONTINUE_NEW_CRITICAL_EVIDENCE`; the
other three tokens are rejected at round three and beyond. This mirrors
ADIF-0026's Mandatory Stop Control item 2. Whether the round-three evidence
is truly a new critical contradiction remains reviewer judgment; this
standard only fixes the two allowed exit tokens once the round threshold is
crossed.

`CONTINUE_NEW_CRITICAL_EVIDENCE` additionally requires
`newRootCauseCountThisRound > 0`. At round two or later,
`CONSOLIDATE_SINGLE_REPAIR` also requires a new independent root cause; a
dependent-only finding at that point is review-by-drip and cannot open another
automatic repair dispatch.

## Machine-Enforceable Boundary

| Control | Machine disposition |
|---|---|
| completion-review docType applicability and exact declaration | ENFORCE |
| presence of all required fields | ENFORCE |
| integer-or-explicit-unavailable value shape per field | ENFORCE |
| `stopDisposition` is one of the five allowed tokens | ENFORCE |
| round-three escalation token restriction | ENFORCE |
| audit, commit-plan, latency, and delay vocabularies | ENFORCE |
| multi-commit exception-reason requirement | ENFORCE |
| changed work-order dispatch kind, convergence fields, and cross-field rules | ENFORCE |
| parent-assignment invocation-count ceiling before external dispatch | ENFORCE |
| round-two new-critical-evidence requirement and round-three dispatch stop | ENFORCE |
| worker-return consolidated sweep, production binding, adversarial regression, cost ledger, and terminal verdict | ENFORCE |
| implementation-autonomy boundary and closed successor-tranche flag | ENFORCE |
| review-admission field shape, cross-field consistency, and obvious pre-execution-review contradiction | ENFORCE |
| eligibility for the 10-minute fast path | REVIEWER_JUDGMENT |
| whether a root cause is truly independent | REVIEWER_JUDGMENT |
| whether `valueDelta` is substantively high or low | REVIEWER_JUDGMENT |
| whether a critical contradiction justifies continuation past round three | REVIEWER_JUDGMENT |
| whether the chosen `stopDisposition` token is the semantically correct one | REVIEWER_JUDGMENT |
| whether a review-admission trigger is semantically present | REVIEWER_ORCHESTRATOR_JUDGMENT |

## Epistemic Process Block

### Expected Result / Prediction

Artifact-shaped applicability plus deterministic field and round rules should
make review cost visible without pretending to judge finding value.

### Evidence Comparison

The checker validates the full telemetry field set, controlled vocabularies,
the round-three route, multi-commit exception reason, and the declaration for
every changed completion review. Focused tests cover valid, missing, invalid,
escalation, commit-exception, archive, and non-review cases.

### Contradiction Or Gap Disposition

Marker-only opt-in was insufficient because omission evaded enforcement. The
reviewer repaired applicability to use completion-review docType while keeping
unchanged and archived history outside the forward-only gate.

### Claim Update

The standard machine-enforces review evidence shape plus forward-only work-order
dispatch convergence and cumulative invocation admission. Root-cause
independence, criticality, and incremental value remain reviewer judgment.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer and governance maintainer |
| Provider or surface | local private provenance workspace |
| Session or invocation | shared single-pass review latency SOP hardening, 2026-07-20 |
| Working directory | repository root |
| Command or tool surface | governed reads, rg, apply_patch, focused unit tests, structural checks, autorun gates |
| Target paths | this standard; review-cost checker/tests; ADIF-0026; guard orientation; commit steward standard; completion review |
| Allowed scope source | operator instruction to raise the lesson into the common CVF SOP for all future agents |
| Before status evidence | telemetry exposed review cost but did not require a pre-repair audit, latency disposition, avoidable-delay class, or commit plan |
| After status evidence | single-pass review SOP and forward-only evidence-shape enforcement implemented |
| Diff evidence | exact eight-path git status and diff before reviewer commit |
| Approval boundary | review-cost evidence-shape governance only |
| Claim boundary | no semantic scoring, runtime, provider/live, or public claim |
| Agent type | reviewer/closer and governance maintainer |
| Invocation ID | `cvf-single-pass-review-latency-sop-2026-07-20` |
| Expected manifest | seven SOP owner, checker, test, orientation, ADIF, commit-steward, and completion-review paths |
| Actual changed set | same seven paths |
| Manifest delta | MATCH |

## Non-Goals

- This standard does not implement token-level live provider accounting. It
  enforces a provider-neutral cumulative external-invocation ceiling and fails
  closed when admission usage is unavailable.
- This standard does not implement semantic scoring, automatic review
  closure, or automatic criticality judgment.
- This standard does not reopen unchanged or archived historical reviews.
- This standard does not modify Continuous Projection runtime, provider/live,
  public-sync, or production surfaces.

## Related Surfaces

- `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0026.md` - source
  guidance this standard machine-enforces the shape of.
- `governance/compat/check_review_cost_control.py` - the forward-only checker
  implementing this standard.
- `governance/compat/check_worker_experience_retrospective.py` - narrow
  forward-only declaration-shape precedent this checker follows.
- `docs/reference/guard_orientation/README.md` - task-first guard routing.

## Core Guard Self-Protection Authorization

Authorized guard-maintenance scope: promote the observed 30-minute bounded T1
review into the provider-neutral single-pass review latency SOP, extend the
existing evidence-shape checker, and bind the new fields to future changed
completion reviews.

Protected paths:

- `AGENTS.md`
- `docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md`
- `governance/compat/check_active_archive_hygiene.py`
- `governance/compat/test_check_active_archive_hygiene.py`
- `governance/compat/check_agent_instruction_carriers.py`
- `governance/compat/test_check_agent_instruction_carriers.py`
- `governance/compat/check_review_cost_control.py`
- `governance/compat/test_check_review_cost_control.py`
- `governance/compat/agent_autorun_command_catalog.py`
- `governance/compat/test_run_agent_autorun_workflow_gate.py`
- `governance/compat/build_dispatch_packet_scaffold.py`
- `governance/compat/test_build_dispatch_packet_scaffold.py`
- `governance/compat/fixtures/woas_r2_source_intake_scaffold_golden.md`
- `governance/compat/build_worker_return_skeleton_scaffold.py`
- `governance/compat/run_worker_return_scaffold.py`
- `governance/compat/test_run_worker_return_scaffold.py`
- `governance/compat/review_convergence_scaffold.py`

Operator authorization: the operator explicitly requested that this become the
common CVF foundation and SOP for all future agents using CVF, later required
the same control to prevent review-by-drip and unbounded external MCP/CLI
re-dispatch cost, on 2026-09-02 rejected step-by-step review admission after an
R1B authoring checkpoint recreated the governance tax being removed, and then
directed reviewer-local repair for bounded findings because returning work to
another agent forces a fresh authority/source/changed-set context reload.
On 2026-09-06 the operator further required the active P4-C1 boundary and
measurement posture to become universally discoverable without reminders.

Rollback boundary: revert only the trigger-based review-admission addendum if
it conflicts with higher authority; preserve earlier SOP, checker/test, ADIF,
orientation, commit-steward, completion-review, R1B review, and packet evidence.

### P4-C1 Universal Discovery Hardening - 2026-09-06

Authorized guard-maintenance scope: make the already-active MFRP P4-C1
reviewer non-duplication and measurement boundary unavoidable at the root
carrier, route it to existing owners, and make carrier validation fail if the
binding is later removed.

Protected paths:

- `AGENTS.md`
- `governance/compat/check_agent_instruction_carriers.py`
- `governance/compat/test_check_agent_instruction_carriers.py`

Operator authorization: on 2026-09-06 the operator explicitly required a
stronger universal constraint so future agents know P4-C1 is active, reviewer
duplication is already constrained, measurement is ongoing, and no operator
reminder is needed.

Rollback boundary: revert only this universal-discovery addendum and the
matching carrier/routing/orientation/archive-hygiene/checker/test edits if
rejected; preserve
P4-C1 material commit `b9bdba712` and all collected evidence.

Not authorized: no new reviewer workflow, receipt, collector, checkpoint,
runtime/provider/live/public action, DARA-T1/T2 implementation, or change to
P4-C1 eligibility semantics.

## Single-Pass SOP Epistemic Process Block - 2026-07-20

### Expected Result / Prediction

A mandatory pre-repair audit plus explicit commit and latency telemetry should
prevent a bounded semantic review from becoming a sequence of predictable
repairs, premature commits, range recomputation, and worktree churn.

### Evidence Comparison

Continuous Projection T1 reached the correct accepted result, but the review
took about 30 minutes and required avoidable sequential discovery, an early
implementation commit, extra continuity handling, closure-range correction,
and worktree recovery. The earlier telemetry shape exposed cost but did not
require the pre-repair audit or commit-plan evidence that would prevent it.

### Contradiction Or Gap Disposition

The worker defects remain valid findings. The additional defect was the review
workflow: connected findings and closure mechanics were not fully consolidated
before repair and commit.

### Claim Update

CVF now requires single-pass audit evidence and commit/latency dispositions for
future changed completion reviews. Semantic completeness and fast-path
eligibility remain reviewer-owned judgments.

## Claim Boundary

This standard defines an evidence-shape and cooperative pre-dispatch contract.
It does not certify
that a review's findings are correct, that its root-cause classification is
accurate, that its `valueDelta` narrative is substantively true, or that its
`stopDisposition` choice was the right call. Semantic review quality,
criticality judgment, and the decision to continue or stop repair remain
exclusively reviewer-owned. This standard does not authorize SOT3 runtime,
provider/live token metering, out-of-band launcher interception, or public-sync.
