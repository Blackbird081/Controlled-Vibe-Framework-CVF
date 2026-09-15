# CVF Architecture Readiness Admission Standard

Memory class: POINTER_RECORD

Status: ACTIVE_STANDARD

docType: reference

Date: 2026-09-07

Version: DARA-T2-R1

providerExecutionAuthority: FORBIDDEN

Text Encoding Exception: em dash and standard punctuation used in governance prose

Epistemic Process Applicability: EPISTEMIC_PROCESS_NA_WITH_REASON: Reference governance standard; schema and machine-contract definition document, not a worker-return or evidence packet; no prediction-evidence comparison cycle applies.

## Purpose

Full schema, applicability, binding, chain, fault attribution, quota, and echo
contract for Architecture Readiness Admission (DARA) pre-invocation gates.
Rotated from the work-order template owner surface at DARA-T2-R1 to satisfy
the near-threshold rotation requirement. The work-order template retains only
a compact canonical pointer to this document.

## Scope

Every active work order whose `dispatchSurface` is `EXTERNAL_AGENT_CLI_MCP`
must carry exactly one `Architecture-Readiness Admission:` declaration. Missing
or unknown declaration is `BLOCKED_ARCHITECTURE_APPLICABILITY_UNCLASSIFIED`;
it is never silently non-applicable.

Allowed external declarations:

- `REQUIRED`: HIGH or CRITICAL risk, authority-expanding, or otherwise
  design-bearing external dispatch; full matrix and admission checks apply.
- `NOT_APPLICABLE_ACCEPTED_DESIGN_ECHO`: a work order transcribed from a
  previously accepted immutable matrix; all six echo identities must match
  the accepted baseline.
- `NOT_APPLICABLE_EXTERNAL_LOW_RISK_WITH_REASON:<reason>`: explicitly low-risk,
  non-design-bearing, non-authority-expanding work with a non-empty reason.

Internal dispatch may use `NOT_APPLICABLE_INTERNAL_AGENT_WITH_REASON:<reason>`.

The checker determines external versus internal from `dispatchSurface`, not from
prose. Absence of any declaration on an EXTERNAL_AGENT_CLI_MCP packet is always
`BLOCKED_ARCHITECTURE_APPLICABILITY_UNCLASSIFIED`; never silently non-applicable.

## Schema cvf.dara.architectureBindingMatrix.v1

One `## Architecture Binding Matrix` row per acceptance criterion.

Required columns: `criterionId`, `riskClass`, `behaviorIdentity`,
`canonicalOwnerPath`, `canonicalOwnerLocator`, `implementationDisposition`,
`implementationPath`, `implementationSymbol`, `producerPath`, `producerSymbol`,
`trustSource`, `contextCarrierPath`, `contextField`, `exportPath`,
`exportSymbol`, `registrationPath`, `registrationSymbol`,
`compositionRootPath`, `compositionRootSymbol`, `runtimeConsumerPath`,
`runtimeConsumerSymbol`, `positiveTestPath`, `negativeTestPath`,
`bypassTestPath`, `compositionTestPath`, `compatibilityDisposition`,
`rollbackPaths`, `evidenceOutputPath`, `machineDisposition`,
`semanticAcceptance`, `semanticReviewPath`, `semanticReviewCommit`.

Field rules:

- `registrationPath`/`registrationSymbol` and `runtimeConsumerPath`/
  `runtimeConsumerSymbol` allow `NONE_WITH_REASON:<reason>`; the consumer
  variant uses `NONE_WITH_REASON:CONTRACT_ONLY_` prefix.
- `machineDisposition` is gate-only (`PASS_IDENTITY_AND_COVERAGE` /
  `BLOCKED_*` / `UNCLASSIFIED_*`); worker must not author this field as PASS.
- `semanticAcceptance` is reviewer-only (`PENDING_REVIEW` /
  `ACCEPTED_BOUNDED` / `REJECTED_WITH_REASON`).
- Placeholders (`TBD`, `TODO`, `<...>`, worker-selection language) are
  forbidden in any field that is not a legitimate NONE_WITH_REASON.

## Required Scalars

Scalars accompanying a REQUIRED matrix: `architectureMatrixSchema`,
`architectureMatrixRowCount`, `architectureMatrixCanonicalDigest`,
`architectureMatrixDigestRecipe`, `architectureMachineDisposition`,
`architectureSemanticDisposition`, `architectureSemanticReviewPath`,
`architectureSemanticReviewCommit`, `architectureSemanticReviewFileSha256`.

## Digest Recipe

UTF-8, no BOM, LF row separation, forward-slash repo-relative paths,
ordinal code-point order by `criterionId`, one trailing LF, over
`criterionId` through `evidenceOutputPath` only (immutable authoring columns).

## Immutable Semantic Review Binding

For `ACCEPTED_BOUNDED` and accepted-design echo:

1. `architectureSemanticReviewCommit` must be exactly 40 lowercase hexadecimal
   characters and resolve to a git commit.
2. The commit must be an ancestor of current `HEAD`.
3. The normalized review path must exist in that commit.
4. Validation must read bytes from `git show <commit>:<review-path>`, not
   working-tree bytes.
5. `architectureSemanticReviewFileSha256` must equal SHA-256 of those committed
   bytes (not working-tree file hash).
6. The committed review blob must contain every matrix `criterionId` and its
   accepted disposition.

Tests must reject nonexistent, non-ancestor, wrong-path, wrong-blob-hash,
stale working-tree, and missing-criterion cases. No fabricated commit may
appear in a positive test.

## Closed-Chain Machine Contract

The row validator enforces a continuous link from authority to evidence:

authority -> owner -> implementation symbol -> producer/trust -> carrier ->
export -> registration or accepted absence -> composition root ->
non-test runtime consumer or contract-only boundary ->
positive + negative + bypass + composition tests -> literal evidence output.

Blocks: missing pairs, nonexistent identities, duplicate `behaviorIdentity`
per behavior (one owner path may serve several distinct behaviors),
placeholders, out-of-scope rollback, unbound review evidence. Reports
`UNCLASSIFIED_*` instead of a silent pass on unprovable equivalence.
Machine PASS is never architecture approval.

### Trust Source Validation

`trustSource` must be `<normalized-repo-relative-path>:<non-empty-locator>`.
Both the path and the locator must be present and non-empty. The path must
resolve in the repository, and the locator must be found in the cited
authority's bytes (a nonempty locator string alone is insufficient). Archive
paths (`.private_reference/`, `/archive/`, `ECOSYSTEM/private/`),
provider-specific or provider-private memory carriers (`.claude/`, `.codex/`,
`.cursor/`), traversal (`..`), and absolute paths are rejected for all
authority, owner, and trust-source identities via one shared normalized
rejection helper.

### Context Carrier Validation

`contextCarrierPath` and `contextField` must resolve as a pair: the carrier
path must exist on disk, and `contextField` must appear within it.

### Evidence Output Path Validation

`evidenceOutputPath` must be a normalized repo-relative dated Markdown path
(`YYYY-MM-DD` in the file name) under an authorized evidence directory:
`docs/reviews/`, `docs/assessments/`, `docs/baselines/`, `docs/work_orders/`,
or `docs/audits/`. The parent directory must exist.

### Rollback Paths Validation

`rollbackPaths` is a semicolon-delimited list. Every entry must be normalized
repo-relative (no absolute paths, no traversal). Entries should be within the
work order's writable artifact manifest; entries that use absolute or traversal
paths are always rejected.

## Fault Attribution

Per non-zero count, `faultAttributionEvidenceIds` must name the class:

- `dispatcherDefectCount` -- `ORCHESTRATOR_ARCHITECTURE_DEFECT`
- `workerExecutionDefectCount` -- `WORKER_CONTRACT_EXECUTION_DEFECT`
- `reviewerLateDiscoveryCount` -- `REVIEWER_LATE_DISCOVERY`
- `repairIntroducedDefectCount` -- `REPAIR_INTRODUCED_DEFECT`
- `machineCoverageGapCount` -- `MACHINE_COVERAGE_GAP` (charged to checker
  owner, not worker)
- `unattributedDefectCount` -- `UNATTRIBUTED_PENDING_EVIDENCE`

A missing upstream binding is always an orchestrator defect.

## Quota And Admission Progression

DRAFT -> MATRIX_MACHINE_COMPLETE -> SEMANTIC_REVIEW_ACCEPTED ->
EXISTING_USAGE_AND_CEILING_CHECK ->
ADMITTED_WITHIN_CUMULATIVE_CEILING -> EXTERNAL_INVOCATION_1.

Fail-closed codes: `BLOCKED_ARCHITECTURE_MATRIX_INCOMPLETE`,
`BLOCKED_ARCHITECTURE_UNCLASSIFIED`, `BLOCKED_SEMANTIC_REVIEW_MISSING_OR_STALE`,
`BLOCKED_USAGE_UNKNOWN`, `BLOCKED_INVOCATION_CEILING_REACHED`,
`BLOCKED_SOURCE_AUTHORITY_CONTRADICTION`.

Admission requires: `architectureMachineDisposition: PASS_IDENTITY_AND_COVERAGE`
plus `architectureSemanticDisposition: ACCEPTED_BOUNDED` (bound to review
path/commit/SHA-256) plus `preExecutionReviewAdmission: REQUIRED_TRIGGERED`
plus `reviewerWorkBoundary: EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION`
plus usage strictly below `externalInvocationCeiling` plus
`quotaAdmissionDisposition: ADMITTED_WITHIN_CUMULATIVE_CEILING`. No second
ceiling is added. Any owner, path, symbol, scope, risk, authority, or effect
change stales acceptance back to the existing review boundary.

## Echo Contract

Carry the accepted identity verbatim into the worker return via six fields:
`architectureMatrixSchema`, `architectureMatrixCanonicalDigest`,
`architectureSemanticReviewPath`, `architectureSemanticReviewCommit`,
`architectureSemanticReviewFileSha256`, `architectureBindingEchoDisposition`
(`EXACT_MATCH` / `BLOCKED_IDENTITY_DRIFT`). Exact match passes without a
second review; drift blocks dispatch. Composes with, never replaces, MFRP's
receipt/readout/collector ownership.

## Evidence Truth Contract

Command results with any failed test or non-zero exit are `FAIL`,
`KNOWN_FAILURE_WITH_REASON`, or `BLOCKED_WITH_REASON`; never PASS. A test
family is PASS only when every required case in that family passes. A worker
may prove a failure is pre-existing by base replay, but that does not change
the command exit status. `COMPLETE_PENDING_REVIEW` requires every mandatory
gate to pass; otherwise the return status is `BLOCKED_WITH_REASON`.

## Agent Operation Trace Block

| Label | Value |
|---|---|
| Actor | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Agent type | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Provider or surface | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Session or invocation | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Invocation ID | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Working directory | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Command or tool surface | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Target paths | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Allowed scope source | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Before status evidence | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| After status evidence | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Diff evidence | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Approval boundary | NOT_APPLICABLE_WITH_REASON: Reference governance standard; not a worker-return artifact |
| Claim boundary | NOT_APPLICABLE_WITH_REASON: See Claim Boundary section below |
| Expected manifest | N/A with reason: Reference governance standard; not a worker-return artifact |
| Actual changed set | N/A with reason: Reference governance standard; not a worker-return artifact |
| Manifest delta | N/A with reason: Reference governance standard; not a worker-return artifact |

## Claim Boundary

This standard defines governance schema and machine-contract requirements
only. It does not accept designs, authorize dispatches, grant invocation quota,
or make runtime, provider, live-proof, deployment, or public-sync claims.
