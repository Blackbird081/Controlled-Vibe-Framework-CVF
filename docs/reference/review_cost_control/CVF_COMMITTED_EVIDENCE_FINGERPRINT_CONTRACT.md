# CVF Committed Evidence Fingerprint Contract

Memory class: governed-standard

Status: ACTIVE_ADDITIVE_CONTRACT

docType: reference

Date: 2026-09-11

Batch ID: MFRP-FINGERPRINT-T1

## Purpose

Repair the recurring worktree-versus-committed-Git-blob fingerprint
contradiction inside the P2 pass-receipt / P4-C1 collector seam without
weakening raw worktree cache-invalidation identity, receipt integrity, or
collector safety. The prior P4 collector compared a receipt's raw
`worktreeFingerprint` (mutable checkout bytes, sensitive to `core.autocrlf`
line-ending conversion) directly against Git-blob bytes reconstructed from a
trusted commit. Any legitimate CRLF/LF checkout representation difference
made that comparison fail closed as `UNSAFE_FINGERPRINT_MISMATCH`, even
though nothing was actually unsafe. This contract adds a separate,
independently verifiable, immutable-blob-only identity that P4 uses instead.

## Scope

This contract governs the additive `committedEvidence` object on the
existing MFRP-P2 pass-receipt schema
(`cvf.autorun.pass-receipt.v3`) and the shared deterministic Git-blob hashing
recipe both the P2 producer and the P4-C1 collector must use to compute it.
It does not change, weaken, or reinterpret:

- the existing raw `worktreeFingerprint` / `changedPathPlanDigest` identity
  (owned by `governance/compat/run_agent_autorun_workflow_gate.py`'s
  `_worktree_fingerprint` and validated by
  `governance/compat/agent_autorun_machine_verification.py`), which remains
  the mutable-worktree cache-reuse identity and must still invalidate on any
  byte change including line endings;
- the P4-C1 safety-marker, pending-journal, or eligibility-selection
  mechanics in `governance/compat/mfrp_shadow_canary_autocollect.py`;
- any historical receipt or journal row.

## Canonical Machine Surfaces

- shared helper: `governance/compat/committed_evidence_fingerprint.py`;
- P2 receipt producer: `governance/compat/run_agent_autorun_workflow_gate.py`
  (`_run_phase`, which builds and binds `committedEvidence` only for a
  successful `pre-closure` pass on a clean worktree with a resolvable
  committed range);
- P2 canonical object/digest/validator owner:
  `governance/compat/agent_autorun_machine_verification.py`
  (`_machine_verification_object`, `_validate_receipt_integrity`);
- P4-C1 collector consumer:
  `governance/compat/mfrp_shadow_canary_autocollect.py`
  (`validate_and_reconcile_receipt`);
- focused tests: `governance/compat/test_committed_evidence_fingerprint.py`,
  `governance/compat/test_run_agent_autorun_workflow_gate.py`,
  `governance/compat/test_agent_autorun_machine_verification.py`,
  `governance/compat/test_mfrp_shadow_canary_autocollect.py`.

## Closed Record Shape

The optional `committedEvidence` object, when present, is a closed object
with exactly four fields under profile `cvf.committedEvidenceFingerprint.v1`:

| Field | Type | Meaning |
| --- | --- | --- |
| `profile` | string, const | `cvf.committedEvidenceFingerprint.v1` |
| `baseSha` | string | full 40-character lowercase commit SHA |
| `headSha` | string | full 40-character lowercase commit SHA |
| `fingerprint` | string | lowercase SHA-256 hex digest |

Extra keys, missing keys, wrong types, a short/abbreviated SHA, or an
uppercase/malformed fingerprint all reject the object
(`committed_evidence_fingerprint.validate_committed_evidence_shape`).

## Path-Set And Byte Recipe (Explicitly Versioned)

Policy identifier: `git-diff-no-renames-name-only-nul-delimited-v1`.

1. Enumerate changed paths with
   `git diff --no-renames --name-only -z <baseSha>..<headSha>`. `--no-renames`
   means a renamed file is reported as its old path (an ordinary deletion at
   `headSha`) and its new path (an ordinary addition) independently; this is
   normal Git deletion semantics, not a special case. Output is NUL-delimited
   so paths containing spaces or non-ASCII characters are preserved exactly.
2. Sort the resulting paths as ordinal Unicode code-point strings (Python's
   default string sort), not locale-sensitive collation.
3. For each path, in that sorted order, feed into a single running SHA-256:
   the UTF-8 path bytes, then a NUL byte, then either the SHA-256 digest of
   the raw blob bytes at `headSha` (read via `git ls-tree` to resolve the
   blob SHA, then `git cat-file blob`) or the literal sentinel
   `<missing-or-directory>` bytes when the path does not exist at `headSha`
   (an actual deletion), then a second NUL byte.
4. No text decoding, newline translation, or clean/smudge filter execution
   occurs anywhere in this recipe; every byte is read through `git`
   plumbing, never `Path.read_bytes()` against the worktree.
5. A symlink entry (tree mode `120000`) or a gitlink/submodule entry (tree
   mode `160000`, kind `commit`) is explicitly unsupported: the helper raises
   `CommittedEvidenceUnavailable` naming the entry kind. It is never silently
   skipped as a deletion and never followed into the link target or a nested
   repository.
6. Any Git command failure, an unresolved or ambiguous ref, or a `baseSha`
   that is not an ancestor of `headSha` raises `CommittedEvidenceUnavailable`
   as an explicit failure, never a fabricated missing-entry result.

## Binding Into The Receipt

`committedEvidence`, when present, is bound into `machineVerification`
(participating in `receiptDigest`, so tampering it invalidates the receipt
through the existing digest check) and mirrored at the receipt's top level.
`agent_autorun_machine_verification._validate_receipt_integrity` requires
strict equality between the top-level and nested copies; a one-sided
declaration (present at only one location) fails closed, as does a
`baseSha`/`headSha` that does not match the receipt's own (short-form)
`baseSha`/`headSha` context fields. No new receipt schema version or
`machineVerification` profile version is introduced; `RECEIPT_SCHEMA`
remains `cvf.autorun.pass-receipt.v3` and `MACHINE_VERIFICATION_PROFILE`
remains `cvf.autorun.machineVerification.v1`. A receipt that omits
`committedEvidence` entirely is byte-identical in shape to the prior v3
receipt: no new key appears anywhere in its `machineVerification` object.

## Producer Admission Condition

The P2 producer (`_run_phase` in
`run_agent_autorun_workflow_gate.py`) computes and binds `committedEvidence`
only when all of the following hold in the same run:

- `phase == "pre-closure"`;
- the resolved base and head commits differ (a real committed range, not an
  empty no-op range);
- every gate in the bundle passed (`failures == 0`), including the existing
  `pre-closure` worktree-finality check
  (`_closure_worktree_finality_failures`, which itself requires
  `git status --short` to report no uncommitted, untracked, or otherwise
  unresolved changes).

Any other phase, an empty range, a failed gate, or a dirty worktree produces
a receipt with no `committedEvidence` object; the raw
`worktreeFingerprint`/`changedPathPlanDigest` identity and full legacy gate
behavior are entirely unaffected. If the shared helper itself cannot resolve
the range (`CommittedEvidenceUnavailable`), the producer logs the reason and
still writes the receipt without the binding rather than failing the whole
gate run.

Even when every condition above holds, three further checks must all pass
before the binding is produced (MFRP-FINGERPRINT-T1 rework-2, F1):

1. **Ref-movement guard.** The full `baseSha`/`headSha` resolved after the
   gate commands ran must still start with the short SHAs captured before
   they ran. A mismatch means the ref moved during execution (e.g. a
   concurrent commit landed on a mutable ref such as literal `HEAD`).
2. **During-run drift guard.** Two `_worktree_fingerprint` reads of the
   same `base..head` range -- one taken before the gate commands ran, one
   taken after -- must agree, proving the worktree was stable for the
   whole run.
3. **Historical-target admission guard.** The worktree content the gate
   commands actually read for every `base..head` changed path must be
   equivalent to `headSha`'s own committed blob for that path
   (`committed_evidence_fingerprint.verify_worktree_matches_committed_target`).
   Equivalence is decided by direct byte comparison only: worktree bytes
   read via `Path.read_bytes()` against committed bytes read via `git
   cat-file blob` -- never `git hash-object`/`git add`/`git diff`/`git
   status` against the worktree file, so no configured
   `clean`/`smudge`/`process` filter and no `core.autocrlf` conversion can
   execute during this check. (MFRP-FINGERPRINT-T1 rework-3 correction: an
   earlier revision of this guard used `git hash-object`, which does
   execute a configured `clean` filter; a filter that maps arbitrary input
   to one fixed output could make genuinely different worktree content
   hash identically to the committed target, so filtered blob equality is
   not semantic equivalence and must never be treated as this guard's
   proof.) Exact bytes are accepted without normalization. The sole
   exception reproduces LF-to-CRLF checkout expansion: the index must
   retain the target blob, effective attributes must not disable text or
   declare a filter/encoding/ident transform, and `eol=crlf` or
   `core.autocrlf=true` must authorize CRLF checkout (explicit `eol=lf`
   overrides that setting). The target must contain no CR or binary/control
   bytes other than tab/LF. The expanded target must match disk exactly.
   Binary, `-text`, mixed endings, historical index drift and unsupported
   metadata fail closed on byte differences. Fingerprint recipes are
   unchanged; no generic normalization or external filter is executed.

Guard 2 alone cannot distinguish "the worktree reflects `headSha`" from "the
worktree is stable at some later commit whose evidence paths have already
drifted away from `headSha`'s own committed content" -- a worktree can be
perfectly stable across one run while parked at a commit `C` that is a
descendant of `headSha` and has since changed the same evidence path again.
Guard 3 is what closes that gap: it independently proves the worktree
equals the committed target, not merely that it did not move during this
one execution. A later commit that changes only continuity/session-sync
paths (never a `base..head` evidence path) still passes guard 3, so the
continuity case in the section below remains supported.

## P4-C1 Collector Consumption

`mfrp_shadow_canary_autocollect.validate_and_reconcile_receipt` first
validates the candidate receipt through the unchanged canonical P2 owner
(`read_receipt_readonly`, which calls
`agent_autorun_machine_verification._validate_receipt_integrity`), then
checks the exact expected parent/trusted commit range exactly as before.
After that:

- if the receipt declares no `committedEvidence`, collection is explicitly
  **skipped** with `SKIPPED_NO_COMMITTED_EVIDENCE`. This is a legacy v3
  receipt: it remains a valid P2 receipt under the old rules, but it is
  explicitly ineligible for new P4 committed-evidence collection. It is
  never upgraded, silently rehashed against its raw `worktreeFingerprint`,
  or otherwise treated as equivalent to a receipt carrying the new binding;
- if the declared `committedEvidence` fails the shared shape validator, or
  its `baseSha`/`headSha` do not correspond to the receipt's own context,
  collection raises `CollectionUnsafe` (`UNSAFE_COMMITTED_EVIDENCE_MALFORMED`
  or `UNSAFE_COMMITTED_EVIDENCE_RANGE_MISMATCH`);
- otherwise the collector recomputes the fingerprint through the same shared
  helper (`committed_evidence_fingerprint.compute_committed_evidence_fingerprint`)
  and compares it to the declared value, raising `CollectionUnsafe`
  (`UNSAFE_COMMITTED_EVIDENCE_FINGERPRINT_MISMATCH`) on any mismatch.

The collector never compares committed Git-blob bytes against
`worktreeFingerprint` at any point in this path. The former
`_reconstruct_fingerprint_from_commit` recipe (still present as a private
helper for direct callers that need it) is no longer invoked by
`validate_and_reconcile_receipt`.

## Continuity Case

A later commit that changes only continuity/session-sync files (not the
trusted target paths) can still satisfy this contract's own admission
condition for its own range; this contract makes no claim that a
`committedEvidence` binding for one range certifies execution against a
different, later-edited target. Reviewers must not misrepresent a
continuity-only binding as re-proof of an earlier semantic decision.

## Limitations

This is a declaration/binding validator over deterministic Git-object
identity. It proves that specific committed bytes existed at a specific
resolvable commit range; it does not prove which commands were executed
against those bytes, does not prevent arbitrary shell operations outside
this metadata contract, and does not itself constitute AI-governance runtime
proof.

## Rollback

Removing this contract removes only: the optional `committedEvidence`
schema/shape addition, the producer's admission branch that computes and
binds it, the collector's binding-based validation branch (P4 collection
reverting to `SKIPPED_NO_COMMITTED_EVIDENCE` for every receipt, i.e. fully
disabled rather than reverting to the pre-existing bytes-vs-worktree
comparison), the shared helper module, and their focused tests. It must
leave the prior raw `worktreeFingerprint`/`changedPathPlanDigest` identity,
the v3 receipt schema for receipts that never declared
`committedEvidence`, and all other P2/P4 behavior valid and unchanged.

## Claim Boundary

This contract activates a deterministic, additive, opt-in identity-binding
mechanism only. It grants no runtime, provider, public, or production
authority; authorizes no historical receipt rewrite, safety-marker removal,
or sample promotion; and makes no claim beyond immutable Git-object identity
matching a declared range.
