# CVF Prior Verification Reuse And Unicode Evidence Handling Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-11

Owner: CVF governance control plane

---

## Purpose

This standard prevents redundant evidence work and Unicode-path failures in
governed work orders that consume previously verified corpora, source bundles,
external evidence, or extracted-text artifacts.

It is promoted from the EC-T4 worker finding where a worker recomputed SHA-256
for already verified binary corpus files and then hit avoidable Unicode path
handling friction while reading extracted text.

---

## Scope / Target / Owner Boundary

Target owner surfaces:

- work-order authoring;
- source-verification evidence planning;
- worker return packet evidence reuse;
- reviewer closure review for evidence lineage.

Owner boundary:

- governance/control-plane evidence handling only;
- no runtime parser, retriever, model, provider, or application behavior claim;
- no public-sync or release authority;
- no autonomous mutation authority.

---

## Prior Verification Reuse Rule

If a current, source-backed prior verification artifact already proves the same
source file identity, a downstream work order must prefer reuse over fresh
binary recomputation.

Reuse is allowed only when the prior artifact records all applicable items:

- source path or canonical source identifier;
- `Test-Path -LiteralPath` or equivalent path existence result;
- SHA-256 or declared hash comparison result;
- size comparison result when a manifest size exists;
- role, lineage, bundle, or parent-id confirmation when the downstream task
  relies on artifact role or provenance;
- verification verdict such as `HASH_MATCH`, `PASS`, or an equivalent bounded
  token;
- prior verification artifact path and commit/base anchor.

When these items pass and the downstream task does not need freshness beyond
the prior artifact, the work order must state:

```text
verificationMode: REUSE_PRIOR_VERIFICATION
priorVerificationArtifact: `<path>`
freshRecomputeRequired: NO
```

---

## Fresh Recompute Rule

Fresh recomputation is required only when at least one condition applies:

- the source file changed after the prior verification anchor;
- the prior artifact lacks path existence, hash, size, or lineage evidence
  needed by the downstream task;
- the prior verification method is incompatible with the downstream claim;
- the work order is explicitly testing hash computation behavior;
- the reviewer records a concrete drift, tamper, or stale-artifact concern;
- a higher-risk closure standard requires current recomputation and names the
  reason.

When recomputation is required, the work order must state:

```text
verificationMode: RECOMPUTE_REQUIRED
recomputeReason: `<specific reason>`
priorVerificationInsufficientBecause: `<specific gap>`
```

Do not ask a worker to "compute SHA-256" for already verified large binary
corpora unless the recompute reason is explicit.

---

## Reviewer Recompute Rule

A reviewer may recompute selectively when reviewing a returned packet, but that
reviewer recomputation is a closure audit action, not a default worker task.

Use:

```text
verificationMode: REVIEWER_RECOMPUTE_ONLY
workerAction: adopt prior verification artifact and cite it
reviewerAction: recompute only if closure review detects drift or mismatch
```

---

## Unicode Path And Extracted Text Rule

Work orders that cite source or extracted-text paths containing non-ASCII
characters must include an encoding-safe handling note.

Minimum note:

```text
unicodePathHandling: use literal paths and UTF-8-safe readers
powerShellLiteralPathRequired: YES
fallbackReader: Python UTF-8 reader or equivalent structured reader
normalizationAllowed: NO unless separately authorized
```

Binding instructions:

- use `Test-Path -LiteralPath` or equivalent literal-path checks for filesystem
  evidence;
- do not rename, normalize, transliterate, or copy Unicode-named evidence files
  merely to make a shell command easier;
- if PowerShell text reading fails on a Unicode path, use an explicit UTF-8-safe
  reader and record the fallback;
- external extracted text is auxiliary evidence unless the work order also
  verifies the source-file identity and extraction lineage;
- do not treat extracted text as proof of source authenticity without a
  matching source identity or prior verification record.

---

## Required Work Order Block

Any work order that consumes a prior manifest, T11B-style verification result,
source bundle, external evidence digest, or Unicode-path extracted text must
include:

```text
## Evidence Reuse And Encoding Plan

verificationMode: REUSE_PRIOR_VERIFICATION | RECOMPUTE_REQUIRED | REVIEWER_RECOMPUTE_ONLY
priorVerificationArtifact: `<path or N/A with reason>`
priorVerificationAnchor: `<commit/base/manifest id or N/A with reason>`
freshRecomputeRequired: YES | NO
recomputeReason: `<reason or N/A with reason>`
unicodePathHandling: `<required handling or N/A with reason>`
extractedTextAuthority: SOURCE_AUTHORITY | AUXILIARY_ONLY | N/A with reason
```

Dispatch is incomplete if the block says `REUSE_PRIOR_VERIFICATION` but omits
the prior artifact path or anchor.

Dispatch is incomplete if the block says `RECOMPUTE_REQUIRED` but omits a
specific recompute reason.

---

## Worker Return Requirements

When a worker reuses prior verification, the return packet must cite:

- the prior verification artifact path;
- the reused record IDs or source paths;
- the prior verdict tokens;
- any fields adopted without recomputation;
- any encoding fallback used for Unicode paths.

If a worker recomputes despite `REUSE_PRIOR_VERIFICATION`, the worker must
record why prior evidence was insufficient. Otherwise the extra recomputation is
a governance learning finding, not stronger proof.

---

## Claim Boundary

This standard proves only evidence-handling discipline. It does not prove
extraction accuracy, legal/policy freshness, runtime parser behavior, retrieval
quality, production readiness, public readiness, provider behavior, or release
readiness.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private governance-control-plane hardening standard. Public export
requires a separate public-sync decision and artifact mapping.
