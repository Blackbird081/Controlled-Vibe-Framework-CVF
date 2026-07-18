# CVF LSC-T2 Multi-Role Capture Contract And Eligibility Matrix

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-21

Path policy: stable reference-family file retained at an undated path; dated
closure evidence lives in the worker-return and completion-review artifacts.

EPISTEMIC_PROCESS_NA_WITH_REASON: reference contract - it defines role-specific
capture eligibility and routing rules; it makes no evidence comparison claim
that requires the full epistemic process block.

## Purpose

LSC-T1 bound worker-experience friction (`WORKER_EXPERIENCE_RETRO`) into the
Learning Signal Chain field model. That left reviewer, dispatch-author,
session-sync-steward, operator, and external-agent friction without a defined
capture surface, so that signal stayed chat-only or was lost after closure.

LSC-T2 defines, for each role, when a signal is eligible for capture, when a
no-signal assertion is enough, where the role records the signal, and how the
signal maps onto the existing LSC-T1 extension fields and existing Learning
Signal Intake fields. It also binds external-agent returned-output eligibility
to the external knowledge absorption chain map and keeps capture cheap so
routine pass/acceptance work does not turn into a mandatory retrospective.

## Scope

**Applies to:** documentation/reference capture-eligibility rules for the roles
named in the Capture Eligibility Matrix below. Does not apply to ledger store,
generator, drift checker, CLI/MCP adapter, read-receipt enforcement, or
runtime implementation, which remain future, separately authorized tranches
per the Claim Boundary section.

## Source Authority And Non-Authority Inputs

Source authority:

- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts`
  owns `LearningSignalIntakeInput`, `LearningSignalIntakeRecord`, and the
  `autonomousMutationAuthorized: false` invariant.
- `docs/reference/learning_signal_chain/CVF_LSC_T1_SIGNAL_LEDGER_SOURCE_LAYOUT_AND_DEDUP_CONTRACT.md`
  owns `sourceProjection`, `rootCauseGroupId`, `captureState`, `repeatRisk`,
  the severity-mapping table, and the disposition/captureState authority rule.
- `governance/compat/check_worker_experience_retrospective.py` and
  `docs/reference/worker_experience_retrospective/README.md` own the existing
  `WORKER_EXPERIENCE_RETRO` / `WORKER_EXPERIENCE_RETRO_NA_WITH_REASON` token
  syntax, eligibility rule, and enum values.
- `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md`
  owns the required routing order for any external-agent returned output.

Non-authority inputs: the LSC-T0 roadmap, this contract's own drafting
process, and any agent's chat-local reasoning are reconciliation inputs that
shaped this document. They are not source authority for runtime fields; the
interfaces and standards listed above are.

## Role Vocabulary

Role-neutral names only, per `docs/reference/guard_orientation/README.md`
Role-Neutrality Rule. No provider, model, or agent name is normative in this
contract.

| Role | Definition |
|---|---|
| Worker | Executes a work order and returns `COMPLETE_PENDING_REVIEW` or `BLOCKED_WITH_REASON`. Already covered by AAF-T5; LSC-T2 does not change worker eligibility. |
| Reviewer / reviewer-closer | Reviews a worker return, may repair allowed-scope defects, and closes if accepted. |
| Dispatch author / orchestrator | Authors a GC-018 baseline and work order, or otherwise sequences a multi-tranche roadmap. |
| Session-sync steward | Updates active handoff, session state, and next-move surfaces after closure. |
| Operator | Authorizes scope, approves checkpoints, and owns configuration and lane-selection decisions. |
| External reviewer / external agent | Reviews or returns output from outside the repository's governed role chain; treated as input, not authority, until routed through the external knowledge absorption chain map. |

## Capture Eligibility Matrix

Each row states when a signal is eligible, the no-signal alternative, and the
role-owned artifact surface where the signal may be declared
(`roleSignalSurface`).

| Role | Capture eligibility (`captureEligibility`) | No-signal alternative | `roleSignalSurface` |
|---|---|---|---|
| Worker | Already defined by AAF-T5: any self-declared worker-return artifact must carry `WORKER_EXPERIENCE_RETRO` or the exact `WORKER_EXPERIENCE_RETRO_NA_WITH_REASON` assertion. LSC-T2 does not add a second worker token. | Exact asserting NA reason already defined by the worker-experience standard. | The worker-return artifact itself. |
| Reviewer / reviewer-closer | Eligible when review surfaces friction that is not already a routine pass: a closure-package surprise, an unexpected scope-boundary question, a repair the reviewer had to make outside the worker's stated scope, or a gate result the reviewer did not expect from the work order text. Not eligible merely because review passed cleanly. | If the worker return was accepted with no repair and no surprise, the reviewer should record a one-line no-signal note in the completion review rather than a structured block. | The completion review artifact for the reviewed tranche, in a `Reviewer Signal` subsection. |
| Dispatch author / orchestrator | Eligible when dispatch authoring revealed a source-verification gap, a stale roadmap reference, an ambiguous scope boundary later corrected, or a sequencing error across tranches (for example a stale `nextAllowedMove`). Not eligible for routine dispatch that matched the roadmap with no correction. | If the GC-018/work order pair matched the roadmap with no correction needed, the dispatch author records a one-line no-signal note in the Agent Operation Trace Block of the dispatched work order rather than a separate retrospective file. | The GC-018 baseline or work order's Agent Operation Trace Block, in a `Dispatch Signal` line, or a dedicated `docs/reviews/` packet if the friction is substantial. |
| Session-sync steward | Eligible when session-sync revealed a stale field (for example a `nextAllowedMove` that did not match the latest closure), a handoff-rotation surprise, or a generated-state drift that required manual correction. Not eligible for a routine sync that matched expectations. | If sync matched expectations with no correction, the steward records a one-line no-signal note in the sync commit's session-state entry rather than a separate file. | The session-sync commit's changed entry under `CVF_SESSION/state/entries/` or the active handoff sync section. |
| Operator | Eligible whenever the operator identifies a system blind spot, a wrong priority, a process gap, or a correction to agent behavior that is not already covered by an existing rule. Operator signals are high-value by default because they represent direct human judgment outside the automated chain. | An operator is never required to assert a no-signal line; operator silence is not itself a signal. | An operator finding packet, an active checkpoint note, or direct text in the work order/roadmap that records the operator's instruction. |
| External reviewer / external agent | Eligible only after the returned output has been routed through the External Agent Returned-Output Routing section below and classified by the external knowledge absorption chain map. Raw, unclassified external text is never directly eligible for ledger-shaped capture. | If an external return contains no classifiable finding (pure agreement, pure restatement), the absorbing role records `EXTERNAL_AGENT_CRITIQUE: NONE_WITH_REASON` style prose in the absorption packet rather than a structured signal. | The external-agent finding absorption packet or absorption table required by the chain map, never the raw external file itself. |
| Runtime / provider / public-surface placeholders | Out of implementation scope for LSC-T2. `RUNTIME_SIGNAL`, `PROVIDER_OUTPUT_SIGNAL`, and `PUBLIC_SURFACE_SIGNAL` classes are named by the LSC-T0 roadmap signal-class table but have no capture surface defined here. | Not applicable; no role is required to assert anything for these classes under LSC-T2. | None defined by LSC-T2; future LSC-T5/T6 tranches own this surface per the LSC-T0 work plan. |

## No-Signal Assertion Guidance

The governing principle from LSC-T0 is `Fast capture, slow promotion`.
Multi-role capture must not multiply that cost across five new roles by
requiring a long retrospective on every return.

Rules:

- Routine pass/acceptance work (a worker return accepted without repair, a
  dispatch that matched its roadmap, a sync that matched expectations) is the
  default case and should produce a one-line no-signal note, not a structured
  block.
- A structured signal is warranted only when the role can name a concrete
  friction: an unexpected gate result, a repair outside stated scope, a stale
  field, a scope ambiguity, or a process gap.
- No role other than the worker (already governed by AAF-T5) is required by
  this contract to add a new machine-checked token. LSC-T2 defines eligibility
  and surface only; it does not add a new machine check. A future
  machine-check tranche (parked per Parking Ledger) may enforce capture for
  one or more of these roles after LSC-T2 is adopted in practice.
- Operators are never required to assert a no-signal line; their channel is
  opt-in by design because operator judgment is not a gated workflow step.

## False Positive Prevention Rules

- A role must not log a signal merely because a checker name, scope word, or
  governance term appeared in the text being reviewed; the signal must
  describe an actual friction event the role experienced, not a keyword match
  (see `KEYWORD_TRAP` / `ENUM_OR_TOKEN_MISMATCH` in the worker-experience
  standard's `frictionType` enum, which this contract reuses by reference
  rather than redefining).
- A reviewer must not log a `Reviewer Signal` for a defect the reviewer was
  expected to repair under the work order's "Worker Autonomy" or "Reviewer
  repair" clauses; routine allowed-scope repair is not friction.
- A dispatch author must not log a `Dispatch Signal` for a roadmap-anticipated
  follow-up tranche; only an actual correction or sequencing error qualifies.
- External-agent returned output must never be logged as a signal before
  classification; an unclassified external claim is advisory text, not a
  signal, per the chain map's Central Core rule that CVF remains source of
  truth.
- A signal about one root cause observed by two roles (for example a reviewer
  and the dispatch author both noticing the same stale field) must share one
  `rootCauseGroupId` once minted by a future ledger tranche; LSC-T2 states this
  rule but does not implement the de-dup enforcement, which remains LSC-T1's
  minting authority and a future generator/checker's enforcement responsibility.

## Mapping To LSC-T1 Fields

LSC-T2 introduces no new ledger fields. Every role signal, once promoted past
the no-signal stage, must map onto the existing LSC-T1 extension fields:

| LSC-T1 field | How a role signal maps |
|---|---|
| `sourceProjection` | `AAF_T5_TOKEN` for worker signals (unchanged); a future ledger tranche would need to add reviewer/dispatch/session-sync/operator/external projection values, since LSC-T1 only defines `AAF_T5_TOKEN`, `FINDING_TO_GOVERNANCE_ROW`, `MLW3_CANDIDATE`, and `CLI_MCP_EVENT`. LSC-T2 does not mint new `sourceProjection` enum values; it only names the role-owned artifact surface (`roleSignalSurface`) that a future ledger tranche would read from. |
| `rootCauseGroupId` | Remains LSC-T1-ledger-minted only; no role other than a future ledger implementation mints this id. Multi-role signals about the same root cause must converge on one id once a ledger exists. |
| `captureState` | Follows the LSC-T1 disposition/captureState allowed-pairs table unchanged; a role signal's `captureState` is derived from its eventual `disposition`, never role-assigned directly. |
| `repeatRisk` | Defaults to `POSSIBLE` for any role's first-observed signal, consistent with the LSC-T0 CLI/MCP fast-capture default; only a future ledger or helper tranche may upgrade it to `OBSERVED_REPEATED` after deterministic de-dup confirms recurrence. |

## Mapping To Existing Intake Fields

Role signals that are promoted to a governed finding must reuse the existing
`LearningSignalIntakeInput` fields rather than inventing role-specific
equivalents:

| Intake field | Role-signal mapping rule |
|---|---|
| `sourceId` | The role-owned artifact path or commit reference that carries the signal (completion review, work order trace line, session-state entry, absorption packet). |
| `sourceArtifact` | Same artifact as `sourceId`'s carrier, expressed as the full repo-rooted path. |
| `sourceSummary` | A short prose statement of the observed friction, written by the role that observed it. |
| `lane` | `GOVERNANCE_CONTROL_PLANE` for reviewer/dispatch/session-sync/operator process friction; `DOCUMENTATION_ONLY_LEARNING` or `GOVERNANCE_CONTROL_PLANE` for external-agent critique, per the LSC-T0 signal-class table. |
| `defectClass` | Reuse the existing `LearningSignalDefectClass` enum (`WORKER_EXECUTION_ERROR`, `ORCHESTRATOR_PACKET_GAP`, `RULE_GAP`, `MACHINE_GATE_GAP`, `PHASE_GATE_PLACEMENT_GAP`, `OPERATOR_SCOPE_CLARITY_GAP`, `RUNTIME_SIGNAL_GAP`); no new value is authorized by LSC-T2. |
| `severity` | Reuse the existing `critical`/`high`/`medium`/`low` enum; a role signal with no clear severity defaults to `low`, mirroring the LSC-T1 friction-to-severity caution against inflating routine notes. |
| `disposition` | Reuse the existing `LearningSignalDisposition` enum; the role's signal does not assign `disposition` itself, the role that triages it (typically the dispatch author or operator during Finding-To-Governance routing) does. |
| `nextControlAction` | The role states what it believes should happen next (for example "add an index row" or "tighten a work order clause"), but the governed disposition step decides the actual control action. |
| `evidenceBasis` | The concrete artifact, commit, or gate output the role is pointing to; never a bare chat recollection. |
| `autonomousMutationAuthorized` | Always `false`, unchanged from the intake bridge invariant; no role signal under LSC-T2 authorizes autonomous mutation. |

## External Agent Returned-Output Routing

External-agent returned output is eligible for capture only after it passes
through the external knowledge absorption chain map's Mandatory Chain:

1. Identify the input as "External-agent returned output" per the chain map's
   Input Type Router.
2. Route it through
   `docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md`
   and its Required Absorption Table.
3. Only after a disposition (`ABSORB`/`ADAPT`/`DEFER`/`REJECT`/`BLOCK`, per the
   chain map's per-input-type minimum disposition column) is recorded does the
   classified item become eligible for `EXTERNAL_AGENT_CRITIQUE` signal mapping
   under the Mapping To Existing Intake Fields table above.
4. The absorbing role (worker or dispatch author, per the chain map's owner
   column for "External-agent packet request" and "External-agent returned
   output") is the one that records the resulting signal, using the
   absorption packet as `sourceArtifact`, never the raw external file.

This routing rule is `externalReturnEligibility`: external-agent returned
output never becomes a CVF signal by direct quotation; it must be classified
first, exactly as the chain map's Central Core rule requires for any external
material becoming CVF authority.

## Latency Budget

| Stage | Role behavior under LSC-T2 |
|---|---|
| Capture | One short no-signal note or one short structured note per return; no role is asked to write a long retrospective for a routine pass. |
| Normalization | Left to a future helper/ledger tranche; LSC-T2 defines only where the role writes the raw signal. |
| Triage | Batched; multi-role signals about the same root cause are not required to be reconciled at capture time. |
| Promotion | Unchanged from LSC-T0: governed, slower, requires a fresh GC-018/work order/checker only when a signal justifies it. |
| Closure | No tranche under LSC-T2 is blocked from closure by an unresolved lower-severity role signal. Blocking remains reserved for `severity=critical` or `repeatRisk=OBSERVED_REPEATED`, per the LSC-T0 blocking rule, and LSC-T2 does not lower that bar for any new role. |

LSC-T2 explicitly does not introduce a new closure blocker. A reviewer,
dispatch author, session-sync steward, or operator signal recorded under this
contract is visible for future triage; it does not by itself stop a tranche
from being marked `CLOSED_PASS_BOUNDED`.

## Parking Ledger

| Lane | Status | Relationship to LSC-T2 |
|---|---|---|
| AAF-T6 Guard Orientation Read-Receipt Gate | parked | Future capture/control-plane signal tranche; LSC-T2 names the reviewer/dispatch/session-sync eligibility this gate would eventually feed, but does not implement read-receipt enforcement. |
| AAF-T7 friction-finding hardening | parked | Future helper/readout tranche; LSC-T2's eligibility rows are intended as input to a future AAF-T7-style hardening pass, not a reopening of it. |
| CGE-T3 external knowledge ledger | parked | Future `EXTERNAL_REPO_SIGNAL` input source; not a prerequisite for, and not implemented by, LSC-T2. |
| ACE-R1 Agent Coding Evidence Replay Roadmap | parked | Future `RUNTIME_SIGNAL` / coding-evidence input source; not a prerequisite for, and not implemented by, LSC-T2. |
| MLW7 / MLW8 optional Learning Plane follow-ups | parked | Not reopened by this contract. |

None of these lanes are required, reopened, or implemented by LSC-T2.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker role |
| Provider or surface | local workspace |
| Session or invocation | LSC-T2 worker execution, 2026-06-21 |
| Working directory | repository root |
| Command or tool surface | direct file read/write/edit tools |
| Target paths | `docs/reference/learning_signal_chain/CVF_LSC_T2_MULTI_ROLE_CAPTURE_CONTRACT_AND_ELIGIBILITY_MATRIX.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_LSC_T2_MULTI_ROLE_CAPTURE_CONTRACT_AND_ELIGIBILITY_MATRIX_FOR_WORKER_2026-06-21.md`; `docs/baselines/CVF_GC018_LSC_T2_MULTI_ROLE_CAPTURE_CONTRACT_AND_ELIGIBILITY_MATRIX_2026-06-21.md` |
| Before status evidence | HEAD `fe0e8f44`; file did not exist before this worker execution |
| After status evidence | new file created; uncommitted worker artifact |
| Diff evidence | new file; all sections match Required Contract Content from the work order |
| Approval boundary | worker role: create this file only; no commit |
| Claim boundary | documentation/reference contract authoring only; no enforcement, runtime, or public-sync claim |
| Agent type | worker role |
| Invocation ID | `lsc-t2-worker-2026-06-21` |
| Expected manifest | `docs/reference/learning_signal_chain/CVF_LSC_T2_MULTI_ROLE_CAPTURE_CONTRACT_AND_ELIGIBILITY_MATRIX.md` |
| Actual changed set | `docs/reference/learning_signal_chain/CVF_LSC_T2_MULTI_ROLE_CAPTURE_CONTRACT_AND_ELIGIBILITY_MATRIX.md` |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference contract for Learning Signal Chain work.
No public-sync remote, public commit, public artifact path, or public claim is
authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | LSC-T2 multi-role capture contract and eligibility matrix only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | documentation/reference contract authoring only |
| interceptionBoundary | no direct IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | multi-role capture eligibility, no-signal assertion, and external-return routing contract only |
| forbiddenExpansion | wrapper/proxy enforcement, arbitrary-command execution, EDIT/COMMIT execution, provider/live, public-sync, queue/daemon, watcher, readiness, full-hook equivalence, and universal control remain out of scope |

## Claim Boundary

This contract defines role-specific capture eligibility, no-signal assertion
guidance, mapping to existing LSC-T1 and Learning Signal Intake fields, and
external-agent returned-output routing only. It does not implement a ledger
store, generator, drift checker, helper readout, runtime Learning Plane
mutation, provider/live proof, CLI/MCP adapter behavior, public-sync, direct
interception, wrapper/proxy enforcement, queue/daemon, watcher, readiness, cost
optimization, full-hook equivalence, read-receipt enforcement, or universal
governed-coding control. It does not add a new machine check; eligibility
enforcement, if any, is a future, separately authorized tranche.

## Related Surfaces

- `docs/reference/learning_signal_chain/README.md` - reference front door
- `docs/reference/learning_signal_chain/CVF_LSC_T1_SIGNAL_LEDGER_SOURCE_LAYOUT_AND_DEDUP_CONTRACT.md` - field ownership and de-dup contract
- `docs/roadmaps/CVF_LSC_T0_LEARNING_SIGNAL_CHAIN_RECONCILIATION_ROADMAP_2026-06-20.md` - chain reconciliation roadmap
- `docs/reference/worker_experience_retrospective/README.md` - existing worker-experience token standard
- `governance/compat/check_worker_experience_retrospective.py` - existing worker-experience checker
- `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` - external knowledge intake routing
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts` - existing intake bridge fields
