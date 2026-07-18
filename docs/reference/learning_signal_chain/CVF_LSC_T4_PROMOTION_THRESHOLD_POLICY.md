# CVF LSC-T4 Promotion Threshold Policy

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-21

Path policy: stable reference-family file retained at an undated path; dated
closure evidence lives in the worker-return and completion-review artifacts.

EPISTEMIC_PROCESS_NA_WITH_REASON: reference policy - it defines promotion
thresholds, decision matrices, and blocking rules; it makes no evidence
comparison claim that requires the full epistemic process block.

## Purpose

LSC-T1 bound the field model and de-dup contract. LSC-T2 defined role-specific
capture eligibility. Neither defined when a captured signal should remain visible
but non-blocking, and when it should cross into a governance action.

LSC-T4 defines the promotion threshold policy so any role can read one document
and know:

- which signals stay visible but non-blocking (`READOUT_ONLY`);
- when repeated signals cross into governance action (`WATCH_FOR_REPEAT`,
  `GOVERNANCE_PROPOSAL_CANDIDATE`);
- when severity or repeat evidence can justify a rule, checker, or work-order
  candidate;
- when a signal should block closure (`CLOSURE_BLOCKER`);
- how promotion stays governed and does not authorize autonomous mutation.

This keeps the LSC promise: fast capture, slow promotion. Future helper/readout
work (LSC-T3) can surface signals and apply these thresholds without requiring a
long retrospective or per-signal operator decision.

## Scope

**Applies to:** documentation/reference promotion threshold policy for all signals
captured under LSC-T1 and LSC-T2 field models. Does not apply to ledger store,
generator, drift checker, helper readout, CLI/MCP adapter, read-receipt
enforcement, or runtime implementation, which remain future, separately
authorized tranches per the Claim Boundary section.

## Promotion Principles

| Principle | Rule |
|---|---|
| Fast capture, slow promotion | Capture remains cheap and local. Promotion requires concrete evidence, not just occurrence count. |
| Promotion recommendation is not promotion execution | A threshold outcome is a recommendation label. It does not itself authorize a rule change, checker creation, or work order dispatch. |
| No autonomous mutation | `autonomousMutationAuthorized=false` is invariant across all LSC tranches including T4. Promotion never overrides this invariant. |
| Outcome by control gap, not identity | Rule/checker/work-order candidate split is determined by the kind of control gap, not by provider, model, agent identity, or signal origin surface. |
| De-dup before promotion | Signals sharing a `rootCauseGroupId` are counted once for promotion eligibility, regardless of how many projections observe them. |
| Governed triage owns final disposition | The role that triages a signal (dispatch author or operator during Finding-To-Governance routing) assigns the final `disposition`; the threshold matrix is input, not override authority. |
| Operator authority preserved | Any promotion to actual governance action (rule update, checker creation, work order dispatch) requires operator authorization through the governed GC-018 / work-order chain. |

## Promotion Outcome Vocabulary

These terms are documentation/reference vocabulary introduced by LSC-T4. They
are doc-only labels (`DOC_ONLY_NEW`) that a future helper or triage role may
attach as advisory field values. They are not existing runtime fields, checker
fields, or active ledger schema.

| Outcome | Meaning | Default context |
|---|---|---|
| `READOUT_ONLY` | Signal is visible to helper/readout output but does not trigger governance action. No triage, proposal, or escalation is required at this stage. | First-observed low/medium signals without a concrete repeated root cause. |
| `WATCH_FOR_REPEAT` | Signal has a plausible repeatable root cause but lacks enough evidence for immediate governance action. A future ledger/helper tranche groups it by `rootCauseGroupId` and upgrades `repeatRisk` if the same cause recurs. | Low/medium signals with a named root cause that could recur but have not yet been confirmed repeated. |
| `GOVERNANCE_PROPOSAL_CANDIDATE` | Signal has concrete evidence and a named owner surface that together justify writing a formal governance proposal or finding. Requires review before becoming a proposal. | Medium/high signals with clear owner surface and documented evidence basis. |
| `RULE_CANDIDATE` | Signal identifies a prose governance gap where a written rule or policy update would prevent recurrence. | Repeated or high-impact process/policy gaps not yet covered by a checker. |
| `CHECKER_CANDIDATE` | Signal identifies a deterministic, machine-verifiable gap that has either recurred, caused closure latency, or escaped earlier phase gates. | Repeated or latency-causing machine-detectable gaps. |
| `WORK_ORDER_CANDIDATE` | Signal identifies bounded implementation or documentation work that should be dispatched through GC-018 and source verification. | Well-scoped gaps that require a governed tranche to resolve. |
| `CLOSURE_BLOCKER` | Signal is severe or confirmed-repeated enough that closure of the current tranche should pause until it is addressed or explicitly deferred by a governing work order. | Only under the three conditions defined in the Blocking-Vs-Readout Policy section. |

## Threshold Decision Matrix

The matrix maps signal field values to promotion outcome recommendations. Triage
roles use this matrix as input; they are not required to follow it mechanically
when contradicting evidence exists. Outcome assignment is a recommendation label
only; it does not itself trigger a governance action.

| `severity` | `repeatRisk` | `rootCauseGroupId` shared | Leading `disposition` | Recommended outcome |
|---|---|---|---|---|
| `low` | `POSSIBLE` | no | any | `READOUT_ONLY` |
| `low` | `POSSIBLE` | yes (first observation) | any | `WATCH_FOR_REPEAT` |
| `low` | `OBSERVED_REPEATED` | yes | `MACHINE_CHECK_CANDIDATE` | `CHECKER_CANDIDATE` |
| `low` | `OBSERVED_REPEATED` | yes | `DESIGN_REVIEW_REQUIRED` | `RULE_CANDIDATE` |
| `medium` | `POSSIBLE` | no | `PHASE_GATE_PLACEMENT_GAP` / `DESIGN_REVIEW_REQUIRED` | `READOUT_ONLY` |
| `medium` | `POSSIBLE` | yes | `MACHINE_CHECK_CANDIDATE` | `WATCH_FOR_REPEAT` |
| `medium` | `OBSERVED_REPEATED` | yes | `MACHINE_CHECK_CANDIDATE` | `CHECKER_CANDIDATE` |
| `medium` | `OBSERVED_REPEATED` | yes | `DESIGN_REVIEW_REQUIRED` | `GOVERNANCE_PROPOSAL_CANDIDATE` |
| `high` | `POSSIBLE` | no | any | `GOVERNANCE_PROPOSAL_CANDIDATE` |
| `high` | `POSSIBLE` | yes | `MACHINE_CHECK_CANDIDATE` | `CHECKER_CANDIDATE` |
| `high` | `OBSERVED_REPEATED` | yes | `MACHINE_CHECK_CANDIDATE` or `DESIGN_REVIEW_REQUIRED` | `WORK_ORDER_CANDIDATE` |
| `high` | `OBSERVED_REPEATED` | yes | `PHASE_GATE_PLACEMENT_GAP` | `CLOSURE_BLOCKER` (triage confirms) |
| `critical` | any | any | any | `CLOSURE_BLOCKER` |

Notes on matrix application:

- When `repeatRisk=OBSERVED_REPEATED` is confirmed by a future ledger/helper
  tranche through `rootCauseGroupId` de-dup, the promotion floor rises by one
  level compared to the same signal's first-observed state.
- Triage may override any matrix row with documented reasoning; the matrix is
  a fast-path heuristic, not an automated promotion engine.
- `CLOSURE_BLOCKER` from a `high`/`OBSERVED_REPEATED` row requires explicit
  triage confirmation; it is not automatic.
- `RULE_GAP` is the informal label for a missing prose-rule surface; it maps
  onto `DESIGN_REVIEW_REQUIRED` disposition in the intake bridge enum.

## Blocking-Vs-Readout Policy

This policy preserves the LSC-T0/T2 closure-blocking rule exactly.

| Condition | Closure behavior |
|---|---|
| `severity=critical` | `CLOSURE_BLOCKER`; closure should pause until resolved or explicitly deferred |
| `repeatRisk=OBSERVED_REPEATED` (confirmed by ledger de-dup) | `CLOSURE_BLOCKER`; closure should pause until resolved or explicitly deferred |
| A governing work order explicitly tightens the closure rule for the current tranche | `CLOSURE_BLOCKER`; closure should pause per that work order's stated terms |
| All other conditions | `READOUT_ONLY` or a higher non-blocker outcome; closure is not blocked |

Lower-severity unresolved signals (`low` or `medium` without confirmed repeat)
appear in helper/readout output only. They do not block routine closure unless
one of the three `CLOSURE_BLOCKER` conditions above is met. This rule may only
be tightened by a governing work order that names the specific condition; a
threshold matrix row alone cannot tighten the closure rule.

Routine `READOUT_ONLY` accumulation must not be treated as a latent blocker.
A future helper (LSC-T3) surfacing many `READOUT_ONLY` signals is expected
behavior, not evidence that closure is at risk.

## Repeated-Signal And De-Dup Policy

This policy extends the LSC-T1 de-dup field rules for promotion eligibility.

| Rule | Detail |
|---|---|
| One signal per root cause | Signals sharing a `rootCauseGroupId` (LSC-T1-ledger-minted) are counted once for promotion eligibility, regardless of how many projections (AAF-T5 token, Finding-To-Governance row, MLW3 candidate) observe them. |
| `repeatRisk` upgrade requires ledger confirmation | A triage role may not upgrade `repeatRisk` from `POSSIBLE` to `OBSERVED_REPEATED` based on memory or chat recollection. A future ledger or helper tranche must confirm recurrence through deterministic de-dup before `OBSERVED_REPEATED` is asserted. |
| `POSSIBLE` is the correct default | `repeatRisk=POSSIBLE` is the correct default for any signal's first ledger entry, consistent with LSC-T1 and the LSC-T0 CLI/MCP fast-capture default. |
| Multiple projections, same root cause, one count | If a worker-experience token and a Finding-To-Governance row both describe the same root cause, they must share one `rootCauseGroupId` and must not inflate the promotion count. The ledger generator (future tranche) enforces this at write time; LSC-T4 states the policy rule. |
| `WATCH_FOR_REPEAT` is the pre-confirmation staging outcome | When a first-observed signal has a plausible repeatable root cause but `repeatRisk` has not yet been confirmed as `OBSERVED_REPEATED`, the recommended outcome is `WATCH_FOR_REPEAT`. This tells a future helper to group by `rootCauseGroupId` without triggering governance action yet. |
| Promotion re-evaluation after confirmation | When a future ledger tranche confirms `repeatRisk=OBSERVED_REPEATED` for a previously `WATCH_FOR_REPEAT` signal, the threshold matrix should be re-applied from the confirmed state, not carried forward from the original first-observed evaluation. |

## Rule / Checker / Work-Order Candidate Split

The split is determined by the **kind of control gap**, not by provider, model,
agent identity, tranche author, or signal origin surface.

| Candidate type | Control gap kind | Distinguishing test | Example |
|---|---|---|---|
| `RULE_CANDIDATE` | A prose governance gap where the absence of a written rule or policy clause allows the same mistake to recur. The fix is a new or updated written rule, standard, or policy section. | Would a single policy sentence prevent recurrence without needing a machine check? | A work-order clause that is consistently misread; adding a `Worker Autonomy` clarification would prevent repeated reviewer repair. |
| `CHECKER_CANDIDATE` | A deterministic, machine-verifiable gap that a script or checker could catch at gate time. The gap has repeated, caused closure latency, or escaped a prior gate. | Is the defect machine-detectable with a deterministic rule and source-verified file patterns? | A packet-shape field that is consistently missing from worker returns; a dispatch-quality script could detect it automatically. |
| `WORK_ORDER_CANDIDATE` | A bounded implementation or documentation gap that requires GC-018 authorization, source verification, and a governed work order before it can be resolved. The gap is too large for a rule update or checker change alone. | Does resolution require new source code, a new reference contract, or a tranche-level authorization? | A missing reference policy for a new LSC tranche; a GC-018 and worker dispatch packet must be created before the gap can be filled. |

A signal may qualify for more than one candidate type. In that case, triage
assigns the type that matches the lowest-cost control action that would prevent
recurrence. If checker enforcement alone suffices, `CHECKER_CANDIDATE` is
preferred over `WORK_ORDER_CANDIDATE`. If a rule update alone suffices,
`RULE_CANDIDATE` is preferred over `CHECKER_CANDIDATE`.

No candidate assignment authorizes autonomous action. Each candidate type has a
distinct required governed path:

| Candidate type | Required governed path before action |
|---|---|
| `RULE_CANDIDATE` | Reviewer or operator must accept the rule change through a governed review or work order. |
| `CHECKER_CANDIDATE` | A new work order with GC-018 authorization and source verification must be opened before checker implementation begins. |
| `WORK_ORDER_CANDIDATE` | A GC-018 baseline and worker dispatch packet must be created and accepted by reviewer/closer before any implementation starts. |

## Role-Signal Promotion Rules

Role signals captured under LSC-T2 eligibility rules follow the same threshold
matrix as all other signals. No role receives a special promotion escalation
by virtue of its role identity alone.

| Role | Promotion note |
|---|---|
| Worker | Worker-experience tokens are already governed by AAF-T5 / LSC-T1 severity mapping. The threshold matrix applies after friction-to-severity conversion. |
| Reviewer / reviewer-closer | Reviewer signals are eligible for promotion only when they describe actual friction (unexpected repair, scope-boundary surprise, gate result mismatch), not routine accepted review. `READOUT_ONLY` is the default for routine reviewer no-signal notes. |
| Dispatch author / orchestrator | Dispatch signals are eligible for promotion when they identify a source-verification gap, stale roadmap reference, or sequencing error. Roadmap-anticipated follow-up tranches are not friction signals. |
| Session-sync steward | Steward signals are eligible for promotion when they identify a stale field, handoff-rotation surprise, or generated-state drift requiring manual correction. Routine sync matched to expectations is not a signal. |
| Operator | Operator signals are high-value by default because they represent direct human judgment outside the automated chain. However, they still enter the threshold matrix as input; they do not automatically become `CLOSURE_BLOCKER` unless the conditions in the Blocking-Vs-Readout Policy are met. |

No role's signal bypasses the Repeated-Signal De-Dup Policy. If a reviewer and a
dispatch author both observe the same root cause, they must share one
`rootCauseGroupId` once a future ledger mints it, and they count as one signal
for promotion purposes.

## External-Agent Signal Promotion Rules

External-agent returned output must pass through the External Knowledge
Absorption Chain Map before it is eligible for any promotion outcome.

| Step | Rule |
|---|---|
| Pre-classification | Raw, unclassified external text is not eligible for a promotion outcome. It is advisory input only, per the chain map's Central Core rule. |
| Classification required | The absorbing role (worker or dispatch author) must classify the external return through `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` before attaching any threshold outcome. |
| Post-classification | Once classified with a disposition (`ABSORB`/`ADAPT`/`DEFER`/`REJECT`/`BLOCK`), the resulting finding is eligible for promotion through the standard threshold matrix. |
| De-dup applies | External-agent-derived signals share `rootCauseGroupId` with internally-captured signals if they describe the same root cause, per the LSC-T1 de-dup rule. A future ledger mints the shared id. |
| No identity exception | Promotion outcome is determined by control gap kind, not by whether the signal originated from an external agent, an operator, or an internal role. |

## Future-Tranche Routing

| Tranche | Relationship to LSC-T4 | Status |
|---|---|---|
| LSC-T3 Fast Helper Readout | Consumes LSC-T4 promotion outcome vocabulary to label unresolved signals in its readout. LSC-T3 helper must apply the threshold matrix when surfacing signals so reviewers see recommended outcomes, not raw field values. | Parked; future operator-selected tranche. |
| LSC-T5 Learning Plane Bridge | Maps promoted signals (`disposition=RULE_ADDED`, `MACHINE_CHECK_ADDED`) to the RT2/RT3/MLW3 proposal pipeline. LSC-T4 thresholds tell LSC-T5 which signals are worth bridging. | Parked; future operator-selected tranche. |
| LSC-T6 External Agent CLI/MCP Signal Contract | Defines portable CLI/MCP payload for external agents. LSC-T4 promotion vocabulary is a candidate advisory field in the CLI/MCP payload so external agents can see threshold recommendation for their captured signal. | Parked; future operator-selected tranche. |
| LSC-T7 Latency Guard And Fast Path | Enforces capture-fast/promotion-slow budget. LSC-T4 defines the blocking conditions LSC-T7 must enforce: only `CLOSURE_BLOCKER` signals may pause closure; `READOUT_ONLY` accumulation must not increase gate latency. | Parked; future operator-selected tranche. |

None of these tranches are implemented, reopened, or authorized by LSC-T4.

## Latency Budget

| Stage | LSC-T4 behavior |
|---|---|
| Threshold lookup | Read-only policy application; no ledger write, no gate delay added. |
| `READOUT_ONLY` signal | No triage action required; appears in helper readout when LSC-T3 is available. |
| `WATCH_FOR_REPEAT` signal | No triage action required at capture time; batched grouping by `rootCauseGroupId` when ledger exists. |
| `GOVERNANCE_PROPOSAL_CANDIDATE` | May be batched; does not block closure. |
| `RULE_CANDIDATE` / `CHECKER_CANDIDATE` / `WORK_ORDER_CANDIDATE` | May be batched; each requires a governed path before action; none blocks closure unless separately elevated to `CLOSURE_BLOCKER`. |
| `CLOSURE_BLOCKER` | Must be resolved or explicitly deferred by a governing work order before closure; applies only under the three conditions in the Blocking-Vs-Readout Policy. |

LSC-T4 adds no new gate commands, helper invocations, or capture tokens. The
latency impact during worker execution is zero. Triage-phase impact is bounded
by the number of unresolved signals in scope, all of which are advisory.

## Parking Ledger

| Lane | Status | Relationship to LSC-T4 |
|---|---|---|
| LSC-T3 Fast Helper Readout | parked; future operator-selected tranche | LSC-T4 defines the vocabulary LSC-T3 will consume; LSC-T3 is not implemented or reopened by LSC-T4. |
| LSC-T5 Learning Plane Bridge Alignment | parked; future operator-selected tranche | LSC-T4 thresholds feed LSC-T5 bridge routing; LSC-T5 is not implemented or reopened by LSC-T4. |
| LSC-T6 External Agent CLI/MCP Signal Contract | parked; future operator-selected tranche | LSC-T4 promotion vocabulary is candidate input to LSC-T6 schema design; LSC-T6 is not implemented or reopened by LSC-T4. |
| LSC-T7 Latency Guard And Fast Path | parked; future operator-selected tranche | LSC-T4 blocking conditions are the policy LSC-T7 must enforce; LSC-T7 is not implemented or reopened by LSC-T4. |
| AAF-T6 Guard Orientation Read-Receipt Gate | parked | Not reopened by LSC-T4. |
| AAF-T7 friction-finding hardening | parked | Not reopened by LSC-T4. |
| CGE-T3 external knowledge ledger | parked | Not reopened by LSC-T4. |
| ACE-R1 Agent Coding Evidence Replay | parked | Not reopened by LSC-T4. |
| MLW7 / MLW8 | parked | Not reopened by LSC-T4. |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference policy for Learning Signal Chain work. No
public-sync remote, public commit, public artifact path, or public claim is
authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | LSC-T4 promotion threshold policy authoring only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | documentation/reference policy authoring only |
| interceptionBoundary | no direct IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | promotion threshold, readout-vs-promotion, and closure-blocking policy only |
| forbiddenExpansion | wrapper/proxy enforcement, arbitrary-command execution, EDIT/COMMIT execution, provider/live, public-sync, queue/daemon, watcher, readiness, full-hook equivalence, and universal control remain out of scope |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker role |
| Provider or surface | local workspace |
| Session or invocation | LSC-T4 worker execution, 2026-06-21 |
| Working directory | repository root |
| Command or tool surface | direct file read/write/edit tools |
| Target paths | `docs/reference/learning_signal_chain/README.md`; `docs/reference/learning_signal_chain/CVF_LSC_T4_PROMOTION_THRESHOLD_POLICY.md`; `docs/reviews/CVF_LSC_T4_PROMOTION_THRESHOLD_POLICY_WORKER_RETURN_2026-06-21.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_LSC_T4_PROMOTION_THRESHOLD_POLICY_FOR_WORKER_2026-06-21.md`; `docs/baselines/CVF_GC018_LSC_T4_PROMOTION_THRESHOLD_POLICY_2026-06-21.md` |
| Before status evidence | HEAD `57a8adc1`; clean worktree before worker execution |
| After status evidence | three worker artifacts created/updated; uncommitted |
| Diff evidence | README updated with LSC-T4 row; new policy file and new worker-return file created |
| Approval boundary | worker role: update/create only the three required paths; no commit |
| Claim boundary | documentation/reference policy authoring only; no enforcement, runtime, or public-sync claim |
| Agent type | worker role |
| Invocation ID | `lsc-t4-worker-2026-06-21` |
| Expected manifest | `docs/reference/learning_signal_chain/README.md` (update); `docs/reference/learning_signal_chain/CVF_LSC_T4_PROMOTION_THRESHOLD_POLICY.md` (create); `docs/reviews/CVF_LSC_T4_PROMOTION_THRESHOLD_POLICY_WORKER_RETURN_2026-06-21.md` (create) |
| Actual changed set | same as expected manifest |
| Manifest delta | MATCH |

## Related Surfaces

- `docs/reference/learning_signal_chain/README.md` - reference front door
- `docs/reference/learning_signal_chain/CVF_LSC_T1_SIGNAL_LEDGER_SOURCE_LAYOUT_AND_DEDUP_CONTRACT.md` - field ownership and de-dup contract
- `docs/reference/learning_signal_chain/CVF_LSC_T2_MULTI_ROLE_CAPTURE_CONTRACT_AND_ELIGIBILITY_MATRIX.md` - role capture and eligibility contract
- `docs/roadmaps/CVF_LSC_T0_LEARNING_SIGNAL_CHAIN_RECONCILIATION_ROADMAP_2026-06-20.md` - chain reconciliation roadmap and latency budget
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts` - existing intake bridge fields and autonomous-mutation invariant
- `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` - external knowledge intake routing

## Claim Boundary

This policy defines promotion thresholds, blocking-vs-readout behavior, and
outcome vocabulary for captured Learning Signal Chain entries only. It does not
implement a ledger store, generator, drift checker, helper readout, runtime
Learning Plane mutation, provider/live proof, CLI/MCP adapter behavior,
public-sync, direct interception, wrapper/proxy enforcement, queue/daemon,
watcher, readiness, cost optimization, full-hook equivalence, or universal
governed-coding control.

Promotion recommendations are documentation-only labels. They do not authorize
autonomous mutation, rule changes, checker creation, or work order dispatch.
`autonomousMutationAuthorized=false` remains invariant for all LSC tranches
including T4.
