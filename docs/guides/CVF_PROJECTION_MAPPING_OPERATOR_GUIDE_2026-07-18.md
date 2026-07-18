# CVF Projection Mapping Operator Guide

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: guide

Date: 2026-07-18

Batch ID: CVF-PROJECTION-AUTO-T2

EPISTEMIC_PROCESS_NA_WITH_REASON: operator guide documentation - no evidence
claims or source-backed assertions are made or updated by this document; the
mapper behavior it documents is proven by the accepted T1 focused suite and
the T2 three-root proof runner.

## Purpose

Document safe operator usage of `scripts/get_cvf_projection_map.ps1`: exact
commands, prerequisites, action meanings, receipt interpretation, failure
codes, and explicit boundaries.

## Scope / Applies To

Applies to any operator or reviewer who wants to run the accepted T1
dry-run projection mapper against the real private provenance root, the
real public-sync clone, and the real cvf-web package root to see how they
currently compare. It does not document, authorize, or enable any apply/copy
capability; none exists in the current mapper.

## Owner / Source

Owner: this guide is maintained alongside the accepted T1/T2 projection
automation tooling. Source of truth for behavior: `scripts/get_cvf_projection_map.ps1`
and `scripts/cvf_projection_policy.json`; source of truth for the receipt
contract: `docs/reference/CVF_PROJECTION_MAPPING_RECEIPT_SCHEMA_2026-07-18.md`.
This guide documents that behavior; it does not itself define or enforce it.

## Prerequisites

Before running the mapper against real roots:

1. The provenance root's git worktree must be clean (`git status --short`
   produces no output).
2. The public-sync clone's git worktree must be clean.
3. The provenance root's `origin` remote must exactly equal the
   `expectedRemotes.provenanceRemote` value in
   `scripts/cvf_projection_policy.json`.
4. The public-sync clone's `origin` remote must exactly equal the
   `expectedRemotes.publicRemote` value in the same policy file.
5. `scripts/cvf-public-sync.ps1` must exist at the expected path under the
   provenance root; the mapper reads it for policy-parity comparison only
   and never executes or dot-sources it.
6. Every value in `scripts/cvf_projection_policy.json` must currently match
   `scripts/cvf-public-sync.ps1`'s live allowlist/denylist/mapped-export
   groups. If any group has drifted, the mapper fails closed with
   `POLICY_PARITY_FAILED` before emitting any candidate row; update the
   policy file (a separate governed change, not a mapper option) to restore
   parity before re-running.

## Exact Dry-Run Stdout Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\get_cvf_projection_map.ps1 `
  -ProvenanceRoot "<path to the real provenance repository root>" `
  -PublicSyncRoot "<path to the real public-sync clone root>" `
  -CvfWebRoot "<path to EXTENSIONS\CVF_v1.6_AGENT_PLATFORM\cvf-web under the provenance root>" `
  -PolicyPath "<path to scripts\cvf_projection_policy.json under the provenance root>"
```

With no `-ReceiptOutputPath`, the receipt JSON is printed to stdout only.
Nothing is written to disk.

## Optional Receipt Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\get_cvf_projection_map.ps1 `
  -ProvenanceRoot "<provenance root>" `
  -PublicSyncRoot "<public-sync root>" `
  -CvfWebRoot "<cvf-web root>" `
  -PolicyPath "<policy path>" `
  -ReceiptOutputPath "receipt.json"
```

`-ReceiptOutputPath` is resolved relative to the current working directory
and validated with a path-containment check. The mapper refuses to write the
receipt if the resolved path would land inside `ProvenanceRoot`,
`PublicSyncRoot`, or `CvfWebRoot` (`RECEIPT_TARGET_ROOT_FORBIDDEN`), or if it
would resolve outside the current working directory
(`PATH_ESCAPE`). Always choose a receipt path outside all three roots, for
example a dedicated evidence or scratch directory.

## Requirements: Root / Remote / Clean Preflight

The mapper validates, in order, before classifying any file: provenance
root exists, public-sync root exists, cvf-web root exists, policy file
exists, provenance remote matches exactly, public-sync remote matches
exactly, provenance worktree is clean, public-sync worktree is clean. Any
failure here stops the run before any candidate classification and before
any receipt (other than the failure envelope) is produced.

## Action Meanings

| Action | Meaning |
|---|---|
| `COPY_CANDIDATE_ABSENT_TARGET` | The source file is allowlisted and has no file at the corresponding target path. A mechanical copy would be safe to consider, but this mapper never performs it. |
| `FLAG_SEMANTIC_REVIEW_CHANGED` | The source file is allowlisted and the target file exists but differs byte-for-byte. This always requires human review; content drift can be intentional (public-only wording) or a real regression. |
| `SKIP_UNCHANGED` | The source and target files are byte-identical. No action needed. |
| `SKIP_DENIED` | The source path matches a deny pattern (for example `docs/reviews/`, `AGENT_HANDOFF*`, `.env*`). Never a candidate for export regardless of allowlist status. |
| `SKIP_NOT_ALLOWLISTED` | The source path matches no allow group. Not exported by design. |

## Semantic-Review Workflow

Every `FLAG_SEMANTIC_REVIEW_CHANGED` and `COPY_CANDIDATE_ABSENT_TARGET` row
is a classification label, not an action already taken and not an implicit
recommendation to copy. An operator or reviewer should:

1. Open the `sourcePath` in the provenance root and the `targetPath` in the
   public-sync root (if it exists) side by side.
2. Confirm the change is intentional and safe for public export (no secret,
   no internal-only path, no unresolved draft content).
3. Perform any actual file copy manually, through the existing
   `scripts/cvf-public-sync.ps1` workflow, or through a future explicitly
   authorized and separately governed apply tool. This mapper does not copy
   files itself.

## Receipt Interpretation

See `docs/reference/CVF_PROJECTION_MAPPING_RECEIPT_SCHEMA_2026-07-18.md` for
the full field-by-field contract. In short:

- `errors: []` and a non-null `receiptId` mean the run succeeded.
- `policyParity` should show `MATCH` for all nine groups; any `MISMATCH`
  value means `scripts/cvf_projection_policy.json` has drifted from
  `scripts/cvf-public-sync.ps1` and the run would have failed closed with
  `POLICY_PARITY_FAILED` (a `MISMATCH` value only appears if you are reading
  a receipt captured before that fail-closed check was added; the current
  mapper never returns a successful receipt with a non-`MATCH` parity
  value).
- `summary.reconciliationMatch: true` confirms the five action counts sum to
  `summary.totalCandidates`.
- `cvfWebObservation.sot3ObservedEntries` shows whether each expected SOT3
  package is present in `cvf-web/package.json` dependencies and in the
  `runtime-modules.ts` registry text; this is read-only observation, never a
  registry edit.
- Two runs against unchanged roots and policy always produce byte-identical
  stdout and the same `receiptId`.

## Failure Codes

| Code | Meaning |
|---|---|
| `MISSING_PROVENANCE_ROOT` | `-ProvenanceRoot` does not exist. |
| `MISSING_PUBLIC_ROOT` | `-PublicSyncRoot` does not exist. |
| `MISSING_CVF_WEB_ROOT` | `-CvfWebRoot` does not exist. |
| `MISSING_POLICY` | `-PolicyPath` does not exist. |
| `WRONG_PROVENANCE_REMOTE` | Provenance root's `origin` remote does not exactly equal the policy's expected value. |
| `WRONG_PUBLIC_REMOTE` | Public-sync root's `origin` remote does not exactly equal the policy's expected value. |
| `DIRTY_PROVENANCE_ROOT` | Provenance root has uncommitted changes. |
| `DIRTY_PUBLIC_ROOT` | Public-sync root has uncommitted changes. |
| `POLICY_PARITY_FAILED` | One or more policy groups no longer match `scripts/cvf-public-sync.ps1`. |
| `RECEIPT_TARGET_ROOT_FORBIDDEN` | The requested receipt path would land inside a read-only root. |
| `PATH_ESCAPE` | A resolved path (receipt or candidate target) would leave its required container. |
| `MAPPER_ERROR` | An unclassified error; read the `message` field for detail. |

On any failure the process exits nonzero and the receipt's `errors` array
contains exactly one `{ "code": ..., "message": ... }` object.

## Safe Cleanup

The mapper itself creates no temporary files or directories in normal
operation; the only possible write is the explicit `-ReceiptOutputPath`
file, and only after that path is confirmed to be outside all three
read-only roots. If you asked for a receipt file, delete it manually once
you are done reviewing it - the mapper does not delete it for you and does
not need to, since it never lived inside the provenance, public-sync, or
cvf-web roots.

## Explicit Boundaries

- **No apply/copy.** This mapper has no flag, mode, or code path that
  copies, writes, or deletes any file inside `ProvenanceRoot`,
  `PublicSyncRoot`, or `CvfWebRoot`. `COPY_CANDIDATE_ABSENT_TARGET` and
  `FLAG_SEMANTIC_REVIEW_CHANGED` are labels only.
- **No target mutation.** All three roots are read-only for the entire
  duration of every run; this is proven by both the accepted T1 focused
  suite and the T2 three-root proof runner via before/after git-status and
  file-inventory comparison.
- **No automatic Web repair.** `cvfWebObservation` only reads
  `package.json` and `runtime-modules.ts` text; it never edits the registry
  or any cvf-web source file, even when it detects a
  `SOT3_DEPENDENCY_PRESENT_REGISTRY_MISSING` inconsistency.
- **No commit or push.** The mapper performs no `git add`, `git commit`, or
  `git push` of any kind, in any root, at any point.
- **No network or provider call.** The mapper reads local files and runs
  local `git` commands (`status`, `remote get-url`) only; it never fetches,
  clones, pushes, or calls an external API.

## Verification

Every behavior documented in this guide is proven, not merely asserted, by
two governed test suites: `scripts/test_get_cvf_projection_map.ps1` (T1
focused suite, positive/negative fixture matrix) and
`scripts/test_cvf_projection_three_root_proof.ps1` (T2 disposable
three-root proof runner). Re-running either suite reproduces the evidence
this guide describes.

## Related Artifacts

- `scripts/get_cvf_projection_map.ps1` - the mapper this guide documents.
- `scripts/cvf_projection_policy.json` - the policy manifest the mapper reads.
- `docs/reference/CVF_PROJECTION_MAPPING_RECEIPT_SCHEMA_2026-07-18.md` - the full receipt field contract.
- `scripts/test_get_cvf_projection_map.ps1` - the T1 focused test suite.
- `scripts/test_cvf_projection_three_root_proof.ps1` - the T2 three-root proof runner.
- `docs/reviews/CVF_PROJECTION_AUTOMATION_T2_FINAL_CLOSURE_AUDIT_2026-07-18.md` - the closure audit reconciling this tranche against the automation roadmap.

## Claim Boundary

This guide documents the accepted, read-only T1/T2 dry-run mapper only. It
does not authorize, describe, or imply an apply/copy capability, a
public-sync mutation path, a cvf-web repair path, or any commit/push/
provider/network behavior. Any future apply tooling requires a separate,
explicitly authorized, source-verified governed tranche.
