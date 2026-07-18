# CVF ADIF-T0 Owner Reconciliation And Taxonomy Contract

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference_standard

Date: 2026-06-22

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This contract
defines ownership boundaries and taxonomy for a future defect-intelligence
lookup surface; it does not itself enumerate, map, or project CVF state, so
it carries no `INDEX type` label.

Batch ID: ADIF-T0

EPISTEMIC_PROCESS_NA_WITH_REASON: ownership-reconciliation and taxonomy
contract; it defines vocabulary and ownership boundaries, not an
evidence-comparison or hypothesis-testing artifact.

## Purpose

Freeze the ownership relationships between the future Agent Defect
Intelligence Foundation (ADIF) lookup surface and CVF's existing canonical
owners, before any schema, source layout, resolver, or integration code is
authored. This contract is the gate ADIF-T1 must satisfy: ADIF-T1 may not
invent a field that this contract already assigns to a canonical owner.

## Scope / Applies To

Applies to ADIF-T1 (schema and source layout), ADIF-T2 (resolver), ADIF-T3
(preflight integration), ADIF-T4 (intake bridge), and ADIF-T5 (integrity
guard). It does not implement any of those tranches. It does not change any
canonical standard's enforcement semantics.

## Canonical-Reuse Fields Versus ADIF-Owned Lookup Metadata

| Field | Owner | ADIF disposition |
|---|---|---|
| `defectClass` | F2G (`CVF_FINDING_TO_GOVERNANCE_LEARNING_TRIGGER_STANDARD.md`, Minimum defect classes) | CANONICAL_REUSE - ADIF entries cite the existing enum value; ADIF never adds a new value to this enum |
| `defectRole` | FPRC (`CVF_FINDING_PROPAGATION_AND_ROOT_CAUSE_GROUPING_STANDARD_2026-06-16.md`, Defect Role Field) | CANONICAL_REUSE - ADIF entries cite the existing enum value when a root-cause role applies |
| `frictionLevel`, `frictionType`, `observedStep`, `preventiveControlCandidate` | Worker Experience Retrospective (`docs/reference/worker_experience_retrospective/README.md`) | CANONICAL_REUSE - ADIF-T4 cites these fields when bridging worker-return friction into a candidate entry; ADIF does not redefine them |
| Task class / role guard map | Guard Orientation Index (`docs/reference/guard_orientation/README.md`, Task Class Guard Map) | CANONICAL_REUSE - ADIF's `taskClasses` selector values must align with (not duplicate) Guard Orientation's task-class column; ADIF-T1 must reuse Guard Orientation's task-class vocabulary rather than inventing a parallel one |
| `defectCategory` | ADIF (new) | ADIF_OWNED - orthogonal retrieval axis; see below |
| `severity` | ADIF (new) | ADIF_OWNED - bounded triage level; exact enum decided at ADIF-T1, not here |
| `enforcementLevel` | ADIF (new) | ADIF_OWNED - GUIDANCE_ONLY, PARTIAL_CHECK, MACHINE_CHECKED, or RETIRED |
| `earliestBlockingPhase` | ADIF (new) | ADIF_OWNED - names an existing autorun phase; does not create a new phase |
| `lifecyclePhases`, `surfaceSelectors`, `detectionSignals`, `badExample`, `goodExample`, `canonicalSources`, `checkerBindings`, `remediation`, `promotionState`, `supersedes`, `lastVerifiedCommit` | ADIF (new) | ADIF_OWNED - bounded lookup metadata defined at ADIF-T1 |

Rule: a field is `CANONICAL_REUSE` if an existing standard already defines its
enum or meaning. ADIF entries must cite the canonical value, not restate or
fork it. A field is `ADIF_OWNED` only when no existing standard defines it.

## `defectCategory` Is Orthogonal To `defectClass`

`defectClass` (F2G-owned) answers: *what kind of governance failure is this
for promotion-direction purposes* (e.g. `MACHINE_GATE_GAP`,
`RULE_GAP`). `defectCategory` (ADIF-owned) answers a different question:
*what observable pattern should an agent recognize before it starts a task*
(e.g. `SOURCE_FIDELITY`, `CLOSURE_EVIDENCE`).

These two axes are independent and many-to-many:

- one `defectClass` value can map to several `defectCategory` values across
  different entries (a `MACHINE_GATE_GAP` finding can be `SOURCE_FIDELITY` in
  one entry and `CLOSURE_EVIDENCE` in another);
- one `defectCategory` value can map to several `defectClass` values across
  different entries.

ADIF must never collapse `defectCategory` into `defectClass` or treat one as
a synonym for the other. An ADIF entry record always carries both fields:
the F2G-owned `defectClass` (cited, not redefined) and the ADIF-owned
`defectCategory` (assigned by ADIF-T1).

The twelve `defectCategory` values proposed in the ADIF roadmap
(`docs/roadmaps/CVF_AGENT_DEFECT_INTELLIGENCE_FOUNDATION_ROADMAP_2026-06-22.md`,
Proposed Defect Category Axis) are accepted as the ADIF-T0 starting taxonomy.
ADIF-T1 may merge, rename, or reject individual values when it builds the
schema, but it must preserve the orthogonality rule above and may not retarget
`defectCategory` to duplicate `defectClass`.

## Task-Class Alignment With Guard Orientation

ADIF must not build a second task-class taxonomy. When ADIF-T1 defines the
`taskClasses` selector field, its allowed values must be drawn from (or be a
documented bounded refinement of) the `Task class` column already enumerated
in Guard Orientation's Task Class Guard Map. If ADIF-T1 needs a task class
not present in that map, the correct action is to propose an addition to
Guard Orientation first, not to fork a parallel vocabulary inside ADIF.

## Guidance Versus Enforcement Distinction

Every ADIF entry must declare exactly one `enforcementLevel`:

| Value | Meaning | What it may claim |
|---|---|---|
| `GUIDANCE_ONLY` | No machine check exists for this pattern | The entry may describe the pattern and a remediation; it may not claim a gate will catch a violation |
| `PARTIAL_CHECK` | A machine check exists but only covers part of the pattern | The entry must name the partial coverage and the residual gap |
| `MACHINE_CHECKED` | A named checker/test in `governance/compat/` enforces this pattern | The entry must cite the exact checker path in `checkerBindings`; if the citation is missing or stale, the entry must fall back to `PARTIAL_CHECK` or `GUIDANCE_ONLY` |
| `RETIRED` | The pattern no longer applies (the underlying control changed, or the finding was reclassified) | The entry is kept for audit history; it must cite its replacement or closure reason in `supersedes` |

An entry must never claim `MACHINE_CHECKED` without a verifiable
`checkerBindings` citation. This is the guard against "fake enforcement
claims" named in the ADIF roadmap's Design Control Gate.

## Retirement And Supersession Without Deleting Audit History

ADIF entries are never deleted once committed. Retirement is a state
transition, not a removal:

1. A retired or superseded entry keeps its `defectId` and file location.
2. Its `enforcementLevel` becomes `RETIRED`.
3. Its `supersedes` field (or, for the entry that replaces it, a forward
   pointer) records the relationship.
4. A resolver (ADIF-T2) must exclude `RETIRED` entries from default results
   but must not make them unreadable.

This preserves the FPRC principle that audit history must remain traceable
even after a defect's surface-level fix.

## INDEX Classification Decision For The Future ADIF Cross-Reference Surface

This ADIF-T0 contract itself is a `GOVERNED_DOC` (it defines ownership rules
and taxonomy), not an `INDEX_ARTIFACT`, per
`docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md` Core
Distinction: a `GOVERNED_DOC` must never carry an `INDEX type` label.

The future ADIF lookup surface that ADIF-T1/T2 will build (a bounded
cross-reference from task/role/phase/surface to defect entries, each entry
citing its canonical source) is the kind of artifact the INDEX standard
calls `IDX-2: PLANE_OWNER_MAP` - it maps a lookup key (task class, role,
phase) to the authoritative source/entry that governs it, and it must cite
GOVERNED_DOC source authority rather than become authority itself.

Decision: when ADIF-T1/T2 builds the resolver-facing index or aggregate
view (if one is required at all), it must declare `INDEX type: IDX-2
PLANE_OWNER_MAP` and the seven required INDEX metadata fields
(`INDEX type`, `Source authority`, `Status`, `Date`, `Human-reviewable`,
`Claim boundary`, `Public Export Disposition`). The individual per-entry
compact source files are `GOVERNED_DOC` content, not the index itself - only
an aggregate/lookup view over them would qualify as `IDX-2`. This decision
does not authorize building that aggregate now; it only resolves which INDEX
type applies if and when ADIF-T1/T2 builds it, per the roadmap's own
generated-aggregate discipline requirement.

## Entry Lifecycle

| State | Meaning | Allowed transition |
|---|---|---|
| `PROPOSED` | A candidate entry exists but has not been reviewed against canonical evidence | -> `ACTIVE` or `REJECTED` |
| `ACTIVE` | Entry is reviewed, cites canonical evidence, and is eligible for resolver results | -> `SUPERSEDED` or `RETIRED` |
| `SUPERSEDED` | Entry was replaced by a newer entry covering the same pattern more precisely | terminal; cites successor in `supersedes` |
| `RETIRED` | Entry's underlying pattern no longer applies | terminal; cites closure reason |
| `REJECTED` | Candidate was reviewed and declined (e.g. not generalizable, duplicate, unsafe) | terminal; cites rejection reason |

These lifecycle states govern ADIF-internal entry status. They are distinct
from F2G's `Minimum disposition values` (which govern the *promotion*
decision for a finding into governance, not an ADIF entry's own lifecycle).
An ADIF entry's `promotionState` field (ADIF-owned) records its relationship
to the F2G escalation ladder; it does not replace the F2G disposition value
recorded on the originating finding.

## Severity Semantics

Severity is a bounded triage level distinct from F2G's defect class and
distinct from FPRC's `blockingLevel` (which describes a specific finding row
in a root-cause table, not a general defect pattern). ADIF-T1 owns the exact
severity enum; it must be small (3-5 values), ordered, and must not be
conflated with `enforcementLevel` (severity describes impact if the pattern
occurs; `enforcementLevel` describes whether a machine check currently
catches it).

## What ADIF-T0 Does Not Decide

This contract does not decide:

- the exact `severity` enum values (ADIF-T1);
- the exact stable `defectId` format (ADIF-T1);
- the per-entry source file layout (ADIF-T1);
- whether a generated aggregate view is required at all (ADIF-T1, subject to
  generated-aggregate discipline if one is built);
- resolver ranking/ordering logic (ADIF-T2).

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action | Handled or deferred |
|---|---|---|---|---|---|
| Without an upfront ownership contract, a future ADIF schema could duplicate F2G/FPRC enums or fork a parallel task-class taxonomy | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | DESIGN_REVIEW_REQUIRED | This contract fixes canonical-reuse vs. ADIF-owned field boundaries before ADIF-T1 schema work begins | handled by this tranche |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance governance-reference contract. No public-sync
repository work or public catalog claim is authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | ADIF-T0 ownership and taxonomy contract only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | governed documentation/reference classification only |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | ownership and taxonomy contract only |
| forbiddenExpansion | schema/entry/generator/checker/hook implementation, runtime/provider/live, public-sync, and universal control remain out of scope for ADIF-T0 |

## Claim Boundary

This contract defines ownership boundaries, the `defectCategory` orthogonal
axis, entry lifecycle, severity semantics, and the INDEX classification
decision for a future ADIF lookup surface. It does not create any schema
file, entry, directory, resolver, helper, checker, generator, or hook. It
does not change any canonical F2G/FPRC/Worker Experience/Guard
Orientation/INDEX enum or enforcement semantics. It does not prove that any
future ADIF tranche prevents agent errors.
