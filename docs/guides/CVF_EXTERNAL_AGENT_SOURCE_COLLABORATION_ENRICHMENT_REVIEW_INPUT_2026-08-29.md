# CVF External Agent Source Collaboration Enrichment Review Input

Memory class: FULL_RECORD

Status: NON_AUTHORITATIVE_DESIGN_INPUT

Date: 2026-08-29

protocolVersion: 1.1.0

projectionOf: cvf.external-agent-round-trip

reviewMode: REVIEW_ONLY_DESIGN_ONLY

## Purpose

Provide a public-safe, bounded design input for adversarial review of a
long-running collaboration workflow between an Operator, an External Agent, a
Local Agent with current CVF context, and the governed CVF implementation
process.

This document proposes an enrichment of the existing
`cvf.external-agent-round-trip` protocol. It is not a protocol update, an
implementation specification, a new owner, or implementation authority.

## Scope / Target / Owner Boundary

Target: the candidate handoff semantics between External Agent source audit,
Local Agent current-owner reconciliation, Operator decision, and later governed
CVF work.

Owner boundary: the existing `cvf.external-agent-round-trip` protocol and its
current finding/owner-routing surfaces. This review input does not own protocol
authority, runtime behavior, source intake, public catalog truth, or
implementation authorization.

## Target / Source

The review target is the design contained in this public-safe projection. It
derives from the exact private design source and SHA-256 recorded below, current
public CVF protocol representation, and the operator-supplied portable packet.
The selected source repository for a future real intake is intentionally not
part of this design review.

## Scope / Methodology

- compare the proposed workflow against the pinned public CVF protocol and
  existing public owner-routing references;
- challenge every proposed field, state, owner, artifact, and compatibility
  claim;
- prefer current owners and smaller deltas;
- identify public-evidence limits and return current-local questions instead of
  private-owner conclusions;
- return design findings only, without implementation or external effects.

## Findings / Position

The local provisional position is that the end-to-end collaboration flow is
already owned and that only strict candidate-item semantics and explicit
provenance-class separation remain as bounded enrichment candidates. This is
the position the External Agent must attempt to falsify.

## Decision / Recommendation

Provisional disposition: `ENRICH_EXISTING_EXTERNAL_AGENT_ROUND_TRIP`.

Recommendation: perform one adversarial design review before any protocol,
contract, validator, test, public representation, or portable-packet change is
authorized.

## Provenance And Evidence Boundary

| Field | Value |
|---|---|
| Private design source | `CVF_EARTR_ESC_R0_SOURCE_COLLABORATION_ENRICHMENT_DESIGN_DECISION_2026-08-29.md` |
| Private design source SHA-256 | `53777b228417602a35bfd58bb3916ae4d2241ebf4269eca88b39f80f80a4642b` |
| Public CVF audit anchor before this review-input export | `06c3d040a3dc8fa22fa27f2f9c3e40739def075e` |
| Public protocol representation | `docs/guides/CVF_EXTERNAL_AGENT_ROUND_TRIP_KIT.md` |
| Portable context representation | operator-supplied current `EXTERNAL_AGENT_READ` packet |
| Public projection authorization | explicit Operator instruction on 2026-08-29 to push a review-visible artifact to public GitHub |
| Authority status | public review input only; current local CVF and explicit Operator decisions retain precedence |

The private source hash identifies the local design evidence from which this
public-safe projection was derived. The private artifact itself is not
published by this projection. Private paths, local workspace details, and
private continuity state are intentionally omitted.

## Local Audit Position Supplied For Review

The Local Agent audited current CVF and reached this provisional disposition:

`ENRICH_EXISTING_EXTERNAL_AGENT_ROUND_TRIP`

The review must challenge, not assume, the following local conclusions:

1. `cvf.external-agent-round-trip` already owns the collaboration protocol.
2. `SOURCE_PACK_PREPARATION` already represents the External Agent's
   source-first audit mode.
3. The current round trip already separates candidate return, local semantic
   review, Operator decision, later governed work, independent review, and
   freeze.
4. Current owner and overlap routing already exists through the public KIOD
   owner-surface taxonomy, pre-scan packet, routing matrix, and source-intake
   decision packet.
5. No new protocol, profile, registry, runtime, truth owner, receipt owner,
   authority owner, or global state machine is justified.
6. Two bounded gaps remain:
   - non-empty `suggestedAbsorptionCandidates` records lack a strict item
     contract and fail-closed semantic validation;
   - source-origin value and an incidental CVF internal finding are separated
     conceptually but not by explicit machine-visible provenance classes.

The External Agent does not have authority to confirm current private/local
owner absence. Public-source findings must be worded as public evidence,
likely-owner hypotheses, or questions for local verification.

## Proposed Collaboration Flow

```text
0. REFRESH CVF EXTERNAL PACKET
        |
1. PIN SOURCE REPOSITORY
   repository + exact commit + license evidence
        |
2. EXTERNAL SOURCE AUDIT
   source-first + atomic reusable patterns
        |
3. PUBLIC CVF PRE-MAPPING
   likely owners + preliminary overlap + local questions
        |
4. EXTERNAL RETURN PACKAGE
   non-authoritative provenance-rich candidate corpus
        |
5. LOCAL CVF INTAKE AND RECONCILIATION
   validate return -> reverify source -> split provenance lanes
   -> resolve current owner -> inspect implementation
   -> actively try to disprove novelty
        |
6. LOCAL ABSORPTION DECISION
   value disposition + overlap disposition + recommended owner
   implementation_authorized=false
        |
7. OPERATOR DECISION
   accept + reject + prioritize + park
        |
8. GOVERNED OWNER BINDING
   reuse current owner OR prove an owner gap through negative search
        |
9. SEPARATE GOVERNED CVF WORK ORDER
   complete authority chain + exact scope + verification
        |
10. BUILD -> REVIEW -> FREEZE
```

Step 6 is proposed as the reviewed state of the existing local reconciliation
artifact, not as a new registry. Step 8 confirms a locally verified owner route
after Operator selection; it does not allow owner discovery to be skipped
before the Operator decision.

## Role Boundaries

### External Agent

May:

- audit the pinned source source-first;
- identify atomic reusable patterns;
- cite immutable source paths and symbols;
- propose public-CVF owner candidates and overlap hypotheses;
- return questions for local verification.

May not:

- conclude that current local CVF lacks a capability;
- bind a current private/local owner;
- create a CVF owner;
- promote its return to CVF authority;
- authorize implementation or external effects.

### Local Agent

Must:

- validate return integrity before semantic review;
- reverify source and license evidence;
- resolve current owners and implementation seams;
- actively seek evidence disproving novelty;
- split source value from incidental CVF findings;
- keep value, overlap, direct import, runtime, authority, and implementation
  decisions separate.

### Operator

Decides acceptance, priority, scope, park/reopen policy, and whether to open the
prerequisites for later governed work. Operator acceptance does not by itself
authorize implementation.

## Candidate Item Contract For Review

This proposed shape references normalized top-level `sources` rows instead of
duplicating repository, commit, and license fields in every candidate.

```yaml
candidate_id: ESC-001

preliminary_provenance_class: EXTERNAL_SOURCE_VALUE

source_refs:
  - SRC-001

immutable_references:
  - https://github.com/owner/repository/blob/<40-char-sha>/path/to/file

source_locations:
  - path: path/to/file
    symbols:
      - SymbolName

pattern: one atomic reusable pattern

claimed_value: source-bounded statement of possible value

source_evidence:
  - exact source-backed observation

public_cvf_owner_candidates:
  - path: public/path/or/OWNER_SURFACE_NOT_FOUND
    symbol: symbol-or-NOT_AVAILABLE_WITH_REASON
    basis: why public evidence suggests this owner

public_overlap:
  status: PRELIMINARY_CONFIRMED_EXISTING_OR_ENRICH_OR_GAP
  basis: public-evidence-only comparison

preliminary_value_disposition: ADAPT

questions_for_local_agent:
  - exact current-owner or implementation question

authority_status: NON_AUTHORITATIVE_UNTIL_REVIEWED
```

Candidate rules proposed for review:

1. `candidate_id` is unique within one return.
2. Each `source_refs` value resolves to an existing manifest `sources.id`.
3. Immutable references use the exact commit from the referenced source row.
4. One candidate contains one atomic pattern or one incidental finding.
5. Preliminary dispositions are advisory only.
6. Missing public owner evidence does not authorize a new owner name.
7. Unsupported hypotheses remain unresolved questions rather than candidates.

## Local Reconciliation Shape For Review

This shape is proposed as an enrichment of the existing Required Absorption
Table and owner/overlap/value sections, not a standalone artifact class.

```yaml
candidate_id: ESC-001

verified_provenance_class: EXTERNAL_SOURCE_VALUE

source_reverification:
  status: PASS
  evidence:
    - immutable source or current local source-mirror evidence

resolved_cvf_owner:
  status: FOUND
  paths:
    - current/local/owner/path
  symbols:
    - CurrentOwnerSymbol

local_paths_checked:
  - current/local/path

existing_semantics:
  - semantics already owned by CVF

semantic_overlap: bounded comparison

real_delta: concrete residual delta or NONE

authority_overlap: current authority-owner comparison

implementation_overlap: current implementation and test comparison

tests_or_evidence:
  - exact path, symbol, test, command, or BLOCKED_SOURCE_NOT_FOUND

value_disposition: NO_NEW_VALUE

overlap_disposition: CONFIRMED_EXISTING

rationale: source-backed local decision

recommended_owner_binding: current/local/owner/path

operator_decision_status: PENDING

implementation_authorized: false
```

Local reconciliation may correct preliminary provenance, owner, overlap, and
value hypotheses. The original candidate ID and correction rationale must
remain traceable.

## Provenance Separation For Review

| Provenance class | Meaning | Evidence requirement | Forbidden attribution |
|---|---|---|---|
| `EXTERNAL_SOURCE_VALUE` | reusable pattern or delta originates in the audited source | exact source path/symbol and evidence | attributing an incidental CVF defect to source innovation |
| `CVF_INTERNAL_DEFECT` | a CVF issue is incidentally observed during comparison | current CVF evidence; the source audit is trigger context only | treating the CVF issue as value contributed by the audited source |

The proposed classes are mutually exclusive per atomic row. A mixed
observation must split into two rows. The External Agent class is preliminary;
the Local Agent owns verified classification.

## Taxonomy Separation

The design must not collapse these axes:

1. Value disposition:
   `ABSORB`, `ADAPT`, `DEFER`, `REJECT`, `BLOCK`, `NO_NEW_VALUE`.
2. Overlap disposition:
   `CONFIRMED_EXISTING`, `ENRICH_EXISTING`, `NEW_FINDING`,
   `REJECT_DIRECT_IMPORT`, `NO_NEW_VALUE`, `OWNER_SURFACE_NOT_FOUND`.
3. Direct-import decision.
4. Runtime-activation decision.
5. Authority-promotion decision.
6. Implementation authorization.

`ENRICH_EXISTING_OWNER` is not proposed as a second value disposition.
Enrichment is an owner/overlap route paired with a separate value disposition.

## State And Authority Discipline

No new state machine is proposed. Existing CVF semantics remain:

```text
INTAKE -> DESIGN -> SPEC -> WORK ORDER -> BUILD -> REVIEW -> FREEZE

discovered != admitted != assigned != distributed != authorized
!= invoked != accepted != frozen
```

`WORK_ORDER_AUTHORIZED` is rejected as a state label. Current public CVF states
that a Work Order does not authorize work by itself; it remains subordinate to
the cited authority chain.

## Proposed Minimum Future Delta

No change below is authorized by this review input. The local hypothesis is
that accepted implementation should modify existing owners only:

```text
docs/reference/external_agent_review/
|-- CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md
`-- CVF_EXTERNAL_AGENT_PROTOCOL_REPRESENTATION_CONTRACT.md

scripts/
|-- external_agent_packet.py
`-- test_external_agent_packet.py
```

The reviewer must try to prove that this set is incomplete, excessive, or can
be reduced without losing the stated invariants. A new schema file is not
justified unless the reviewer proves that current-owner enrichment would create
ambiguous or duplicated validation logic.

## Compatibility Hypothesis

`PROTOCOL_1_X_COMPATIBLE_ENRICHMENT_PENDING_REVIEW`

The hypothesis is valid only if empty candidate arrays remain valid,
historical evidence is not retroactively promoted, new non-empty rows are
validated fail-closed, and both public compact and portable expanded
representations are refreshed in the same logical protocol release.

The reviewer must decide whether this requires a minor version update or is a
genuinely breaking required-artifact change. No major-version conclusion is
authorized in advance.

## Required Adversarial Review

Review questions:

1. Which candidate fields are necessary, redundant, or underspecified?
2. Are source-row references safer than duplicating repository/license data?
3. Are the two provenance classes sufficient and mutually exclusive?
4. Which negative cases expose provenance contamination?
5. Is candidate-to-local linkage deterministic and audit-friendly?
6. Does any proposed field collapse distinct CVF decision axes?
7. Does the workflow accidentally treat a Work Order as authority?
8. Is any new artifact, owner, protocol profile, registry, or state genuinely
   required?
9. Is the compatibility hypothesis correct?
10. What is the smallest viable future delta?

Allowed verdicts:

- `ACCEPT`;
- `ACCEPT_WITH_REQUIRED_REVISIONS`;
- `REJECT`;
- `BLOCKED_SOURCE_MISMATCH`.

Required return sections:

1. Verdict;
2. Blocking Findings;
3. Non-Blocking Findings;
4. Field-Level Candidate Contract Review;
5. Provenance-Contamination Test Matrix;
6. Candidate-To-Local Reconciliation Mapping;
7. Compatibility And Version Assessment;
8. Minimum Viable Delta;
9. Explicit Rejected Parallel-Owner Proposals;
10. Final Recommendation.

Required output filename:

`CVF_EARTR_ESC_R0_EXTERNAL_ADVERSARIAL_REVIEW_2026-08-29.md`

## Review Authority Boundary

- Review/design only.
- Return exactly one review artifact.
- Do not modify CVF code, schema, checker, protocol, or packet files.
- Do not commit, push, publish, deploy, call providers, or use credentials.
- Do not claim current private/local CVF knowledge.
- Do not declare a new CVF owner from public-source absence.
- Leave final owner resolution, design acceptance, and implementation authority
  to Local CVF and the Operator.

## Publication Boundary

This document is published solely so an External Agent can perform a bounded
adversarial design review. Publication does not make the proposal canonical,
change protocol version `1.1.0`, refresh the portable packet, authorize source
intake, authorize implementation, or prove runtime, provider, security,
production, or universal-workflow behavior.

## Risk / Corrective Action

Primary risks are duplicated source metadata, provenance contamination,
parallel owner creation, taxonomy-axis collapse, Work Order authority
overstatement, and public/portable representation drift. The corrective action
is to reject any field or artifact that does not add a testable invariant and
to require Local Agent reconciliation plus Operator disposition before a later
implementation Work Order is considered.

## Claim Boundary

This public-safe file proves only that a bounded design-review input was made
available to an External Agent. It does not prove design acceptance, current
private/local owner completeness, source intake, protocol compatibility,
implementation, packet refresh, runtime/provider behavior, security efficacy,
production readiness, or universal applicability.
