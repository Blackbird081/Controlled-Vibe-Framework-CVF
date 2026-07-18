# CVF MEOR Regulated-Domain Adapter Contract

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-12

Contract version: `cvf.meor.regulatedDomainAdapter.rda.t1.v1`

## Purpose

This contract defines how a regulated domain may map lifecycle metadata into
the generic MEOR metadata evidence contract without making regulated fields
global CVF defaults.

The adapter is specification-only. It does not correct metadata, inspect
external Policy_Local files, activate EC gates, mutate retrieval behavior, or
decide legal/current status.

## Scope

The adapter owns:

- profile-scoped regulated lifecycle requirement names;
- mapping from regulated concepts to MEOR requirement records;
- evidence-basis rules for regulated lifecycle observations;
- non-regulatory `NOT_APPLICABLE` behavior;
- invalid-combination tokens for later implementation.

The adapter does not own:

- legal validity, current-law status, or source authenticity;
- OCR, corpus ingestion, retrieval, response generation, or provider calls;
- DSCP profile mutation, corpus record mutation, or EC gate activation;
- public-sync, production readiness, public readiness, or autonomous
  correction.

## Authority Chain

| Authority | Path | Disposition |
| --- | --- | --- |
| MEOR contract | `docs/reference/CVF_METADATA_EVIDENCE_AND_OPERATOR_RESOLUTION_CONTRACT_2026-06-12.md` | ACCEPT |
| MEOR semantics | `docs/reference/CVF_METADATA_EVIDENCE_AND_OPERATOR_RESOLUTION_SEMANTICS_2026-06-12.json` | ACCEPT |
| DSCP domain profile contract | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/dscp.domain.profile.contract.ts` | ACCEPT |
| DSCP requirement bridge | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/dscp.metadata.requirement.bridge.ts` | ACCEPT |
| LPCI lifecycle fields | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/lpci/types.ts` | ACCEPT |
| EC-02 semantics | `docs/reference/CVF_EC02_GATE_SEMANTICS_2026-06-11.json` | ACCEPT_AS_REGULATED_INPUT |

## Adapter Eligibility

A domain profile may use this adapter only when it explicitly declares
regulated lifecycle support.

Required profile posture:

- `supportsDocumentStatus=true`;
- profile-owned `metadataRequirements`;
- requirement IDs owned by the same profile;
- no global injection of regulated lifecycle fields into unrelated domains.

Profiles without regulated lifecycle support must not receive
`documentStatus`, `promulgationDate`, or `effectiveDate` by default. They may
emit `NOT_APPLICABLE` MEOR records only when a downstream report needs to
explain why regulated lifecycle evidence is not required for that profile.

## Regulated Concept Mapping

| Regulated concept | Metadata key | MEOR requirement ID | Required evidence posture |
| --- | --- | --- | --- |
| Document lifecycle status | `documentStatus` | `regulated.document_status` | `SOURCE_EMBEDDED` or `OPERATOR_SUPPLIED` |
| Promulgation date | `promulgationDate` | `regulated.promulgation_date` | `SOURCE_EMBEDDED` or `OPERATOR_SUPPLIED` |
| Effective date | `effectiveDate` | `regulated.effective_date` | `SOURCE_EMBEDDED` or `OPERATOR_SUPPLIED` |
| Jurisdiction | `jurisdiction` | `regulated.jurisdiction` | `SOURCE_EMBEDDED` or `OPERATOR_SUPPLIED` |

These requirement IDs are adapter-level examples. A later runtime
implementation may map them into profile-specific IDs such as
`legal_policy.document_status`, but it must keep owner-profile declarations
explicit and must not infer global requirements.

## Evidence Basis Rules

The adapter inherits MEOR evidence basis semantics:

- `SOURCE_EMBEDDED` and `OPERATOR_SUPPLIED` may resolve a present metadata
  requirement when a secret-safe evidence pointer exists.
- `DERIVED_HINT` is non-authoritative and must retain a downstream block.
- `NONE` with `PRESENT` is not authoritative and must retain a downstream
  block.
- `MISSING`, `AMBIGUOUS`, `CONFLICTING`, and `UNSUPPORTED` retain a downstream
  block until resolved through a separate evidence path.

Operator-supplied evidence must remain labeled `OPERATOR_SUPPLIED`. It must
not be relabeled as source-embedded evidence.

## Downstream Gate Candidate

The EC-02 token `QUERY_CLASS_GATED` is documented here only as a downstream
candidate for later EC/runtime work.

RDA-T1 does not authorize:

- writing `QUERY_CLASS_GATED` into a DSCP profile;
- changing `boundaryRules` behavior;
- clearing `BLOCKED_UNTIL_2026-07-01`;
- retrieval disclosure behavior;
- any T12 or Policy_Local readiness claim.

## Invalid Combinations

The adapter fails closed for these combinations:

| Failure token | Condition |
| --- | --- |
| `REGULATED_FIELD_ON_NON_REGULATORY_PROFILE` | `documentStatus`, `promulgationDate`, or `effectiveDate` appears on a profile without regulated lifecycle support |
| `IN_FORCE_WITHOUT_EFFECTIVE_DATE_EVIDENCE` | `documentStatus=IN_FORCE` appears without authoritative effective-date evidence |
| `DERIVED_HINT_CANNOT_RELEASE_DOWNSTREAM` | derived evidence is paired with downstream re-evaluation eligibility |
| `CROSS_PROFILE_REGULATED_REQUIREMENT_BLEED` | a regulated requirement appears under a profile that did not declare it |

Each invalid combination must retain the downstream block in later
implementation.

## Examples

### Regulated Profile, Missing Effective Date

```json
{
  "requirementId": "regulated.effective_date",
  "ownerProfileId": "legal_policy.vn_regulatory",
  "observedState": "MISSING",
  "evidenceBasis": "NONE",
  "evidencePointers": [],
  "resolutionState": "OPERATOR_ACTION_REQUIRED",
  "downstreamDisposition": "RETAIN_BLOCK",
  "requiredAction": "Provide authoritative effective-date evidence.",
  "failureToken": null
}
```

### Regulated Profile, Operator-Supplied Effective Date

```json
{
  "requirementId": "regulated.effective_date",
  "ownerProfileId": "legal_policy.vn_regulatory",
  "observedState": "PRESENT",
  "evidenceBasis": "OPERATOR_SUPPLIED",
  "evidencePointers": ["operator-resolution:ec-t4#candidate-effective-date"],
  "resolutionState": "RESOLVED",
  "downstreamDisposition": "ELIGIBLE_FOR_REEVALUATION",
  "requiredAction": null,
  "failureToken": null
}
```

This record may only allow the downstream component to re-run its own
decision logic. It does not activate a gate by itself.

### Non-Regulatory Profile

```json
{
  "requirementId": "regulated.document_status",
  "ownerProfileId": "technical_project.software_delivery",
  "observedState": "NOT_APPLICABLE",
  "evidenceBasis": "NONE",
  "evidencePointers": [],
  "resolutionState": "RESOLVED",
  "downstreamDisposition": "ELIGIBLE_FOR_REEVALUATION",
  "requiredAction": null,
  "failureToken": null
}
```

This example is explanatory only. The technical-project profile does not
inherit regulated lifecycle fields.

## Evidence Pointer Discipline

Evidence pointers must be secret-safe references. They must not include raw
source text, OCR text, hidden prompts, credentials, or extracted document
content.

## Claim Boundary

This contract proves only adapter semantics for mapping regulated lifecycle
requirements into MEOR. It does not prove metadata truth, legal/current
status, source authenticity, OCR quality, retrieval quality, Policy_Local
readiness, EC activation, provider behavior, production readiness, public
readiness, or autonomous correction.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private adapter contract; no public-sync authorized.
