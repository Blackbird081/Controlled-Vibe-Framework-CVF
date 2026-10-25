# CVF Product Milestone Coverage Contract

Memory class: POINTER_RECORD
Status: ACTIVE_STANDARD
docType: reference
Date: 2026-10-23

## Purpose

Bind product outcomes to roadmap decisions, dispatch scope and terminal evidence.
This contract extends the existing governed lifecycle; it adds no lifecycle phase,
parallel acceptance ledger or authority to execute a roadmap.

## Scope / Owner Boundary

Applies prospectively to new or materially revised roadmaps, milestone admission,
internal and external dispatch, direct Local work and terminal review. Historical
closed artifacts retain their original evidence. Existing active projects adopt
at the next authorized planning/dispatch boundary; operator-parked projects wait.
The orchestrator owns coverage and selection; workers own their admitted slice;
Local review owns semantic evidence assessment; the operator owns product scope,
business acceptance and changes to authority. Equivalent compact sections suffice
for small direct work; no extra work order is required solely to repeat fields.
External research remains advisory under the existing external-local methods;
Local owns private-source verification and final disposition. This contract grants
no external implementation or closure authority.

## Contract / Requirements

### Roadmap Creation And Progressive Detail

At creation, record the user/receiving consumer, observable final outcome, scope
and exclusions, milestone IDs, acceptance criteria IDs, major dependencies,
uncertainties and accountable roles. A milestone describes usable value or a
necessary decision with an observable result, not a count of commits or tests.
Keep implementation choices provisional until their decision boundary. A draft
with explicit unknowns is valid planning, never an execution grant.
Approved acceptance criteria are mandatory by default. Making one optional,
removing it or changing its acceptance threshold requires the scope owner's decision.

Each checkpoint names its trigger (date, deliverable, budget exhaustion or material
change), evidence required, decision owner and allowed next decisions: continue,
repair within authority, revise through the scope owner, hold or stop. Record the
actual decision and its evidence. A missed date is disclosed, never silently moved.

### Milestone Coverage Reconciliation

Before admitting work, reconcile every acceptance criterion of the selected
approved milestone against identified source versions and current evidence.
Show later milestones and known cross-milestone dependencies at roadmap depth;
do not invent full implementation detail or demand a whole-repository scan.

Use one authoritative table in the roadmap or its existing linked acceptance
surface. A work order references its exact revision/section and selected IDs.

| Criterion ID / user result | State and source/evidence | Remaining gap or unknown | Selected tranche/action | Remainder owner | Destination / re-entry condition |
|---|---|---|---|---|---|
| stable ID from approved milestone | state plus source revision/hash and evidence locator | concrete gap, or explicit none with reason | assigned action ID, or outside this slice | accountable role for unresolved remainder | exact work item/checkpoint and trigger |

States are NOT_STARTED, IMPLEMENTED_UNPROVED, VERIFIED, BLOCKED and UNKNOWN.
VERIFIED requires evidence for the exact relevant version and required acceptance
role; a technical check does not supply human/business acceptance. Record an
exclusion only with the scope owner's decision; deleting a criterion or moving it
outside a tranche cannot make it disappear from the milestone.

Every criterion appears once in the authoritative table. Multiple actions may
reference it, but their proof and remaining responsibility must be distinguishable.
Every unresolved part outside the selected action has an accountable role and a
concrete destination. A role label alone or "later backlog" is insufficient.

### Dispatch And Finite Verification

No coverage table means no implementation dispatch. Unknown coverage of the
selected milestone permits only finite verification: name the unresolved question,
source boundary, output, owner, effort/run ceiling, stop condition and the decision
that follows. Exhaustion returns the unresolved fact to its decision owner; it
does not automatically renew the investigation or create a successor tranche.

An UNKNOWN row can be fully accounted for in a table. Implementation elsewhere
may proceed only after Local establishes, with source evidence, that the unknown
cannot alter that slice's outcome, prerequisites, scope, authority or acceptance.
Record that independence decision; otherwise hold the dependent implementation.

Before dispatch, Local checks the table against the milestone's authoritative
criteria and available sources, not merely against the dispatcher-selected subset.
The work-order acceptance ledger still owns fulfillment of the selected slice.
Coverage admission and fulfillment are separate responsibilities.

### Supporting Work And Change Control

Before changing an approved target, distinguish an operator verification question,
product feedback, a new source fact, an explicit scope decision and a technical
repair within existing authority. A question about how something works or whether
a repository is open source is not by itself a decision to change milestone,
execution lane, provider, acceptance criteria or candidate. Answer from evidence
and retain the approved direction. Do not label an agent inference as operator
clarification. Explicit user changes still apply; record their exact substance,
affected criteria and existing change-control authority without asking again for
authority already granted. If material intent remains unclear, hold only the
dependent scope change and continue independent authorized work.

Select work by its contribution to the current user outcome. Keep one active
product outcome by default; complementary components may serve it together.
Before opening a successor tranche, state the specific missing criterion, why
the current bounded action cannot include it, the evidence it will add and its
return to the product. A new label, failed administrative gate or fresh unknown
does not reset the existing effort budget or justify a new investigation chain.

For capability adapters, apply the existing reuse standard's sections 2.1/2.2:
identify the native provider/repository capability, supported invocation surface,
reused CVF owner and smallest missing connection. Reuse suitable native auth,
execution, tooling and recovery facilities; add only demonstrated CVF contract,
permission, evidence or noncoder interaction gaps. Reimplementation requires a
named capability gap and comparison with native reuse and no-change. Open-source
provenance does not imply local execution; API use alone does not justify rejection.
User taste about an output is distinct from repository capability evidence.

Each supporting repair, investigation or governance task identifies the criterion
or evidenced blocker it serves, why it is necessary now, its bounded cost/effort,
stop condition and the next product action it enables. General improvements go
to an owned backlog destination. Scope changes require their existing authority.

Reconcile affected rows when source identity, acceptance criteria, scope, important
dependencies or evidence change, and at checkpoint/terminal review. Preserve valid
unaffected evidence. Record invalidated proof and the bounded verification needed;
do not rerun unrelated suites or silently reset a spent budget.

### Two Terminal Conclusions

Every terminal return/review states both:

1. Tranche outcome: selected requirements satisfied or blocked, with evidence and
   limits. Preserve the existing work-order terminal vocabulary.
2. Product milestone position: what the user can demonstrably do, outstanding
   criterion IDs and required acceptance, plus owner/destination of the next work.

Workers report slice evidence, affected rows and the last Local-approved milestone
position with its revision; Local reconciles and owns the aggregate conclusion.
Workers cannot infer acceptance for work outside their slice. Business acceptance
remains with the operator or the explicitly authorized acceptance role.

Never derive product completion or a percentage from test, patch, commit or tranche
counts. Close a milestone only when all its mandatory criteria and required role
acceptances are evidenced. A parked product remains parked after foundation work.

## Verification And Enforcement Boundary

Local reviews criterion coverage, semantic evidence and necessity. Existing Core
F2G dispatch bindings may require a declared action/verification plan for this
control; they do not compute coverage completeness. Existing acceptance-ledger
checks validate selected requirements, not the completeness of their selection.

Downstream carriers project this written rule. Profile1.1's APPL control checks
work-order status/closeability; it does not inspect roadmap coverage. Profile1.2
adds CVF-DG-COV-01 and Core dispatch quality uses the same stdlib validator under
`docs/reference/downstream_gate_profile/CVF_MILESTONE_COVERAGE_MACHINE_CONTRACT.md`.
Local-admitted milestone pointers, section identity, exact criterion sets, owned
remainder and phase/conclusion joins are checked mechanically. File presence or a passing shape check never
proves agent compliance, installed-project adoption or runtime AI enforcement.

The 2026-10-25 intent-preservation and native-reuse clarification is a written
semantic review obligation. Existing validators bind declared criteria and control
identity; they do not infer conversational intent or detect redundant native code.

## Related Artifacts

- docs/reference/CVF_GOVERNED_WORK_LIFECYCLE_AND_DESIGN_CONTROL_STANDARD_2026-06-11.md
- docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md
- docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md
- docs/reference/work_order_template/CVF_WORK_ORDER_ACCEPTANCE_LEDGER_ADDENDUM.md
- docs/reference/downstream_gate_profile/CVF_PROJECT_LEARNING_LOOP_STANDARD.md
- docs/reference/downstream_gate_profile/CVF_DOWNSTREAM_GATE_PROFILE_STANDARD.md

## Public Projection Boundary

Public normative projection authorized on 2026-10-25. Private project evidence and session state are excluded. This copy states requirements and mechanical limits; it does not prove agent compliance, installed-workspace adoption or product acceptance.

## Claim Boundary

EPISTEMIC_PROCESS_NA_WITH_REASON: normative contract and declared boundaries;
source observations, adoption and validation evidence belong to the linked learning.
Written rule plus bounded mechanical joins; no runtime AI control, automatic
semantic reviewer or public rollout.
