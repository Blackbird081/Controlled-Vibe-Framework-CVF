# CVF Projection Mapping Receipt Schema

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-18

Batch ID: CVF-PROJECTION-AUTO-T1

EPISTEMIC_PROCESS_NA_WITH_REASON: reference schema documentation - no
evidence claims or source-backed assertions are made or updated by this
document; the fields it documents are proven by the paired focused test
matrix and governed JSON receipt.

## Purpose

Document the field types, enums, canonical ordering, hashing input, count
reconciliation, failure envelope, secret boundary, and no-target-write claim
for the JSON receipt produced by `scripts/get_cvf_projection_map.ps1`.

## Scope / Applies To

Applies to any reader or future tranche (T2 or later) that consumes a
receipt produced by the T1 dry-run mapper. This schema documents the
contract; it does not implement, validate at runtime, or enforce it beyond
the mapper's own emission logic and the paired focused test matrix in
`scripts/test_get_cvf_projection_map.ps1`.

## Top-Level Fields

| Field | Type | Description |
|---|---|---|
| `receiptId` | string (hex, 64 chars) or `null` | SHA-256 hex digest of the canonical-ordered receipt body (excluding `receiptId` itself), computed over compact UTF-8 JSON. `null` only in the failure envelope. |
| `schemaVersion` | string | Copied from the policy manifest's `schemaVersion` field. |
| `sourceRoot` | string literal `"PROVENANCE_ROOT"` | Fixed label; never an operator-specific absolute path. |
| `targetRoot` | string literal `"PUBLIC_SYNC_ROOT"` | Fixed label; never an operator-specific absolute path. |
| `cvfWebRoot` | string literal `"CVF_WEB_ROOT"` | Fixed label; never an operator-specific absolute path. |
| `rootsValidated` | object | `{ "provenance": "PASS" \| "FAIL", "publicSync": "PASS" \| "FAIL" }`. |
| `policyParity` | object | Present only on a successful run. See Policy Parity Fields below. |
| `candidates` | array of objects | Present only on a successful run. See Candidate Row Fields below. Always a JSON array, even for zero or one candidate. |
| `summary` | object | Present only on a successful run. See Summary Fields below. |
| `cvfWebObservation` | object | Present only on a successful run. See cvf-web Observation Fields below. |
| `pathEscapeChecksRun` | integer | Present only on a successful run. Count of `Assert-PathContainment` invocations performed (one for the receipt path when supplied, one per candidate target). |
| `noTargetWriteConfirmation` | string | Fixed assertion string confirming zero filesystem writes occurred inside `ProvenanceRoot`, `PublicSyncRoot`, or `CvfWebRoot` during this run. Present on both success and failure. |
| `errors` | array of objects | Empty array `[]` on success. On failure, exactly one object `{ "code": string, "message": string }`. Always a JSON array. |

## Policy Parity Fields

`policyParity` is an object whose keys are policy group names
(`allowedTrees`, `allowedRootFiles`, `allowedScriptFiles`,
`allowedWorkspaceTemplateFiles`, `allowedDocsPaths`, `denyPatterns`,
`publicRemote`, `mappedFiles`) and whose values are one of:

- `MATCH` - the parsed `scripts/cvf-public-sync.ps1` literal assignment for
  this group equals the policy JSON group after path-separator
  normalization.
- `MISMATCH` - internal diagnostic value when parsed and policy values differ.
- `SOURCE_MISSING` - internal diagnostic value when the source script is absent.

A successful receipt must contain `MATCH` for every parity key. Any
`MISMATCH` or `SOURCE_MISSING` result fails closed with
`POLICY_PARITY_FAILED`; it is never accepted in a successful receipt.

Parity is computed by regular-expression text parsing of the sync script's
source, never by dot-sourcing or executing it.

## Candidate Row Fields

Each element of `candidates` is an object:

| Field | Type | Description |
|---|---|---|
| `sourcePath` | string | Repository-relative path (forward-slash separated) under `ProvenanceRoot`. |
| `targetPath` | string | Repository-relative path under `PublicSyncRoot` this source would map to. Equal to `sourcePath` except for `mappedFiles` entries, which use the declared destination. |
| `candidateAction` | enum | One of `COPY_CANDIDATE_ABSENT_TARGET`, `FLAG_SEMANTIC_REVIEW_CHANGED`, `SKIP_UNCHANGED`, `SKIP_DENIED`, `SKIP_NOT_ALLOWLISTED`. |
| `matchedAllowlistRule` | string or `null` | Which policy group matched (`allowedRootFiles`, `allowedScriptFiles`, `allowedWorkspaceTemplateFiles`, `allowedTrees`, `allowedDocsPaths`, `mappedFiles`), or `null` for denied/not-allowlisted rows. |
| `matchedDenyPattern` | string or `null` | The specific deny regex that matched, or `null` if no deny pattern matched. |

Candidate ordering is ordinal ascending by `sourcePath` then `targetPath`
(`Sort-Object -Property sourcePath, targetPath`), making the array order
deterministic and independent of filesystem enumeration order.

## Summary Fields

| Field | Type | Description |
|---|---|---|
| `totalCandidates` | integer | Total row count in `candidates`. |
| `copyCandidateAbsentCount` | integer | Count of `COPY_CANDIDATE_ABSENT_TARGET` rows. |
| `semanticReviewFlagCount` | integer | Count of `FLAG_SEMANTIC_REVIEW_CHANGED` rows. |
| `skipUnchangedCount` | integer | Count of `SKIP_UNCHANGED` rows. |
| `deniedPathCount` | integer | Count of `SKIP_DENIED` rows. |
| `notAllowlistedCount` | integer | Count of `SKIP_NOT_ALLOWLISTED` rows. |
| `reconciliationMatch` | boolean | `true` when the five counts above sum to `totalCandidates`. |

## cvf-web Observation Fields

| Field | Type | Description |
|---|---|---|
| `dependencyCount` | integer | Number of keys in `cvf-web/package.json`'s `dependencies` object. |
| `registryEntryCount` | integer | Number of `id:` entries found in `runtime-modules.ts`'s `MODULES` array text. |
| `sot3ObservedEntries` | array of objects | One row per `expectedSot3RegistryIds` policy entry: `{ "id": string, "presentInDependencies": boolean, "presentInRegistry": boolean }`. Always a JSON array. |
| `semanticReviewFlags` | array of strings | `SOT3_DEPENDENCY_PRESENT_REGISTRY_MISSING:<id>` for any entry present as a dependency but absent from the registry text. Always a JSON array, empty when no inconsistency is found. This array is a review flag only; the mapper never edits the registry source. |

## Hashing Input

`receiptId` is the SHA-256 hex digest (lowercase, no separators) of the
UTF-8 bytes of the compact-form (`-Compress`) JSON serialization of the
receipt body with `receiptId` itself excluded from the hashed object. No
timestamp, random value, machine-specific path, or volatile git HEAD
participates in the hashed content or in any other field that participates
in deterministic equality. Two runs against byte-identical fixture inputs
produce byte-identical `receiptId` values and byte-identical full JSON
output (verified by the paired focused test cases
`deterministic_repeated_run_byte_identical` and
`deterministic_repeated_run_receipt_id`).

## Canonical Ordering

Top-level keys are emitted in a fixed order (`receiptId` first, followed by
the order listed in Top-Level Fields above). `candidates` rows are sorted as
described in Candidate Row Fields. `policyParity` and `cvfWebObservation`
keys follow their declaration order in the mapper source. This fixed
ordering, not alphabetical or insertion-order coincidence, is what makes
repeated runs byte-identical.

## Count Reconciliation

`summary.reconciliationMatch` must be `true` whenever the run succeeds:
`copyCandidateAbsentCount + semanticReviewFlagCount + skipUnchangedCount +
deniedPathCount + notAllowlistedCount == totalCandidates`. A `false` value
indicates a classification defect in the mapper, not an acceptable receipt
state.

## Failure Envelope

On any fail-closed condition (missing root, wrong remote, dirty root, path
escape, or any other guard failure), the receipt instead contains:

- `receiptId: null`
- `schemaVersion`, `sourceRoot`, `targetRoot`, `cvfWebRoot` (same fixed
  labels as success)
- `rootsValidated` reflecting whichever checks passed before the failure
- `errors`: exactly one object `{ "code": "<UPPER_SNAKE_CASE_CODE>",
  "message": "<human-readable message>" }`
- `noTargetWriteConfirmation` (same fixed assertion string as success)

No `policyParity`, `candidates`, `summary`, `cvfWebObservation`, or
`pathEscapeChecksRun` field is present in the failure envelope. The process
exit code is `1` on any failure and `0` on success.

## Secret Boundary

The receipt never includes environment variable values, file contents
beyond `sourcePath`/`targetPath` labels, or any value read from a
`.env`-pattern-matched file (those files are classified `SKIP_DENIED` and
only their path, not their content, appears in the receipt). The paired
focused test case `secret_like_fixture_value_not_emitted` proves a
secret-like fixture value placed in a denied file does not appear anywhere
in mapper output.

## No-Target-Write Claim

`noTargetWriteConfirmation` is a fixed assertion string present on every
run, success or failure. The mapper's only permitted filesystem write is the
optional `-ReceiptOutputPath` file, which is written only after containment
inside the current working directory and explicit rejection when the resolved
path falls inside `ProvenanceRoot`, `PublicSyncRoot`, or `CvfWebRoot`. Those
three roots are read-only for the entire duration of a mapper run. The
paired focused test cases `no_target_git_status_change_provenance`,
`no_target_git_status_change_public`,
`no_target_filesystem_change_provenance`, and
`no_target_filesystem_change_public` prove this directly by comparing git
status and file listings before and after a mapper run.

## Claim Boundary

This schema documents the JSON contract emitted by
`scripts/get_cvf_projection_map.ps1` as implemented in this T1 tranche. It
does not itself validate, enforce, or generate a receipt; it does not
authorize a T2 apply/copy mapper, and it makes no claim about public-sync or
cvf-web runtime behavior beyond the read-only observation fields documented
above.
