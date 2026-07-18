# CVF Metadata Evidence And Operator Resolution Contract

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-12

Contract version: `cvf.metadataEvidenceResolution.meor.t1.v1`

## Purpose

This contract defines a domain-agnostic representation for metadata
requirements, observed evidence, operator resolution, and downstream
disposition.

It allows extraction and control-plane components to report what is known,
what evidence supports it, what action remains, and whether a blocked workflow
may be re-evaluated. It does not determine domain truth or mutate downstream
state.

## Scope

The contract owns:

- profile-scoped metadata requirement identity;
- observed metadata state;
- evidence basis and evidence pointers;
- resolution state and required operator action;
- downstream block or re-evaluation disposition;
- deterministic validation failure tokens.

The contract does not own:

- legal, regulatory, technical, financial, or other domain-specific fields;
- source authenticity or semantic truth;
- OCR, corpus ingestion, retrieval, or provider behavior;
- autonomous metadata correction;
- descriptor, profile, corpus, index, or gate mutation.

## Authority And Ownership

Each metadata requirement has an owning domain profile. A requirement is valid
only when its `requirementId` is declared by its `ownerProfileId`.

Domain-specific field names remain inside the owning profile. Foundation
consumers may carry them as profile-scoped identifiers, but must not promote
them into global CVF defaults.

## Canonical Record

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `requirementId` | non-empty string | yes | Profile-scoped requirement identity |
| `ownerProfileId` | non-empty string | yes | Domain profile that declares the requirement |
| `observedState` | enum | yes | State observed by the producing component |
| `evidenceBasis` | enum | yes | Authority class supporting the observation |
| `evidencePointers` | string array | conditional | Secret-safe references, never raw source content |
| `resolutionState` | enum | yes | Current resolution posture |
| `downstreamDisposition` | enum | yes | Whether a blocked workflow remains blocked or may be re-evaluated |
| `requiredAction` | string or null | conditional | Operator-facing next action |
| `failureToken` | enum or null | conditional | Deterministic validation failure |

## Canonical Values

### Observed State

- `PRESENT`
- `MISSING`
- `AMBIGUOUS`
- `CONFLICTING`
- `UNSUPPORTED`
- `NOT_APPLICABLE`

### Evidence Basis

- `SOURCE_EMBEDDED`
- `OPERATOR_SUPPLIED`
- `DERIVED_HINT`
- `NONE`

`SOURCE_EMBEDDED` and `OPERATOR_SUPPLIED` are distinct authority classes.
Operator evidence must never be relabeled as source-embedded evidence.

`DERIVED_HINT` is non-authoritative. A filename, heuristic, model inference, or
other derived clue may help an operator investigate, but cannot release a
blocked workflow.

### Resolution State

- `RESOLVED`
- `OPERATOR_ACTION_REQUIRED`
- `BLOCKED`

### Downstream Disposition

- `RETAIN_BLOCK`
- `ELIGIBLE_FOR_REEVALUATION`

`ELIGIBLE_FOR_REEVALUATION` does not activate a gate or approve downstream
work. It allows the owning downstream component to run its own decision logic
again.

## Deterministic Resolution Matrix

Rules are evaluated in the listed order.

| Rule | Observed state | Evidence basis | Required resolution | Required downstream disposition | Evidence pointer | Required action |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | `NOT_APPLICABLE` | `NONE` | `RESOLVED` | `ELIGIBLE_FOR_REEVALUATION` | optional | null |
| R2 | `PRESENT` | `SOURCE_EMBEDDED` | `RESOLVED` | `ELIGIBLE_FOR_REEVALUATION` | required | null |
| R3 | `PRESENT` | `OPERATOR_SUPPLIED` | `RESOLVED` | `ELIGIBLE_FOR_REEVALUATION` | required | null |
| R4 | `PRESENT` | `DERIVED_HINT` or `NONE` | `OPERATOR_ACTION_REQUIRED` | `RETAIN_BLOCK` | optional | required |
| R5 | `MISSING` or `AMBIGUOUS` | any | `OPERATOR_ACTION_REQUIRED` | `RETAIN_BLOCK` | optional | required |
| R6 | `CONFLICTING` or `UNSUPPORTED` | any | `BLOCKED` | `RETAIN_BLOCK` | optional | required |

For R5 and R6, an evidence pointer is required when `evidenceBasis` is
`SOURCE_EMBEDDED` or `OPERATOR_SUPPLIED`.

## Invalid Combinations

The following combinations are invalid:

- `NOT_APPLICABLE` with any evidence basis other than `NONE`;
- `RESOLVED` with `RETAIN_BLOCK`;
- `OPERATOR_ACTION_REQUIRED` or `BLOCKED` with
  `ELIGIBLE_FOR_REEVALUATION`;
- `PRESENT` plus `SOURCE_EMBEDDED` or `OPERATOR_SUPPLIED` without at least one
  evidence pointer;
- any non-null `failureToken` on a valid record;
- any requirement not declared by its `ownerProfileId`;
- raw source text, OCR text, chunks, secrets, or sensitive payloads inside an
  evidence pointer;
- a requirement from one profile appearing as a requirement of another
  profile without an explicit declaration by that second profile.

## Failure Tokens

- `INVALID_REQUIREMENT_ID`
- `INVALID_OWNER_PROFILE_ID`
- `INVALID_STATE_COMBINATION`
- `MISSING_EVIDENCE_POINTER`
- `RAW_CONTENT_FORBIDDEN`
- `UNDECLARED_REQUIREMENT`
- `CROSS_PROFILE_REQUIREMENT_BLEED`

Validation must fail closed. An invalid record retains the downstream block.

## Evidence Pointer Discipline

Evidence pointers identify where acceptable evidence may be inspected. They
may contain artifact IDs, receipt IDs, document-relative anchors, hashes, or
other secret-safe references.

They must not contain raw source content, extracted text, OCR output, provider
prompts, credentials, or hidden chain-of-thought.

## Operator Resolution

An operator may supply evidence or mark a requirement not applicable only
through an explicit, attributable resolution path.

Operator-supplied evidence:

- retains `evidenceBasis=OPERATOR_SUPPLIED`;
- requires at least one evidence pointer;
- may produce `ELIGIBLE_FOR_REEVALUATION`;
- does not become source-embedded evidence;
- does not directly activate a gate or mutate a downstream record.

## Reporting And Mutation Boundary

Rendering a JSON or Markdown report is observational. Report generation must
not:

- change a requirement declaration;
- rewrite an evidence basis;
- modify a domain profile or descriptor;
- clear a gate;
- activate retrieval;
- mutate a corpus, index, or source file.

Downstream components consume the record and make their own bounded decision.

## Cross-Domain Examples

### Legal-Policy Profile

Profile `legal_policy.vn_regulatory` declares
`legal_policy.current_status`.

```json
{
  "requirementId": "legal_policy.current_status",
  "ownerProfileId": "legal_policy.vn_regulatory",
  "observedState": "MISSING",
  "evidenceBasis": "NONE",
  "evidencePointers": [],
  "resolutionState": "OPERATOR_ACTION_REQUIRED",
  "downstreamDisposition": "RETAIN_BLOCK",
  "requiredAction": "Provide attributable current-status evidence.",
  "failureToken": null
}
```

This example does not make `current_status` a global requirement.

### Technical-Project Profile

Profile `technical_project.software_delivery` declares
`technical_project.target_runtime`.

```json
{
  "requirementId": "technical_project.target_runtime",
  "ownerProfileId": "technical_project.software_delivery",
  "observedState": "PRESENT",
  "evidenceBasis": "SOURCE_EMBEDDED",
  "evidencePointers": ["artifact:project-manifest#runtime"],
  "resolutionState": "RESOLVED",
  "downstreamDisposition": "ELIGIBLE_FOR_REEVALUATION",
  "requiredAction": null,
  "failureToken": null
}
```

This profile does not inherit legal-policy dates or current-status fields.

## Claim Boundary

Conformance proves only deterministic contract handling. It does not prove
metadata correctness, source authenticity, domain expertise, legal validity,
technical correctness, retrieval quality, provider behavior, production
readiness, public readiness, or autonomous correction.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private foundation contract; no public-sync authorized.
