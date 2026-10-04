# CVF NCR Q001 Timeout And Ledger Reconciliation Profile

Memory class: POINTER_RECORD

Status: LOCAL_READ_ONLY_ATTEMPT_RECONCILIATION_BOUNDED

docType: reference

Date: 2026-09-29

## Purpose

Record a read-only way to investigate a Q001 receipt attempt whose Web request timed out or returned no receipt. Local owns the private-CVF technical disposition. This profile does not authorize retry, ledger repair, retention policy, or artifact acceptance.

## Scope / Applies To

Applies to the selected local Q001 HTML export path and an explicitly named ledger snapshot. It does not query or mutate a hosted engine.

## Source And Risk Boundary

The Web receipt helper in `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/artifacts/export/proof.ts` generates one `artifact-proof-...` request ID before posting to `/api/governance/evaluate`. It exposes that attempt ID when the receipt is `TIMED_OUT`, `UNAVAILABLE`, or `INVALID_RESPONSE`. A 4-second default timeout can be configured within 1-30 seconds. Aborting Web's wait does not prove the engine did not receive or append the request. The UI shows the attempt ID and keeps the HTML draft/unaccepted, but has no automatic ledger reconciliation or retry.

The current engine's `ImmutableLedger.append_event` in `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/ledger_layer/immutable_ledger.py` reads the JSON array, appends a hash-linked block, and rewrites the whole file under a process-local thread lock. Source does not show atomic replacement, fsync, interprocess locking, retention/deletion policy, or backup scheduling. The `/api/v1/ledger` endpoint reads recent blocks, but its limit-based view is insufficient to prove an attempt absent from the entire chain. A quiescent snapshot was previously restored; online consistency and failure recovery remain unproved.

## Local Read-Only Check

`scripts/reconcile_cvf_q001_receipt_attempt.py` requires an explicit ledger snapshot path and exact attempt ID. It reads once, records the file SHA-256, recomputes the engine's sorted-key JSON SHA-256 for every block, checks every previous-hash link, and counts exact request-ID matches. It emits only `FOUND_ONE`, `NOT_FOUND_IN_SNAPSHOT`, `DUPLICATE_OR_CONFLICT`, or `INVALID_SNAPSHOT`; the latter three return a nonzero exit. Every result has `safeToRetry=false`. A unique valid match returns its index, hash and engine decision. The tool prints no payload, source content, raw ledger, cookie or secret. A valid local hash chain does not prove resistance to a malicious actor able to rewrite and rehash the whole file.

On the ignored local eight-block Q001 ledger, the synthetic P08 export attempt `artifact-proof-q001-p08-1790670333887-1790670333924` returned `FOUND_ONE`, block index 7, decision `ALLOW`, tip hash `5ffa72bbbb1ffad2f8265bdfb6782789b0c38bc6e658714209d643551f73d058`, and ledger file SHA-256 `25e9a6e305d0a8e68c5eb7a07fd73a4d93dd6e1f6c5e933d395dd2a1d447428d`. A deliberately absent ID returned `NOT_FOUND_IN_SNAPSHOT`, not permission to retry. `python -m unittest scripts/test_reconcile_cvf_q001_receipt_attempt.py -v` passed 2/2: unique, absent, duplicate, unreadable, corrupted hash and malformed decision states remained fail-closed.

The local ledger check is a snapshot observation. A missing ID may still be in flight, in another ledger, lost to an unproven write, or omitted by a stale copy. No retry should follow until the authoritative engine instance and persistence boundary are established. `ALLOW` is an evaluation decision, not HTML acceptance.

## Next Design Requirement

Before Q001/R0 timeout recovery or retention can close, the owning profile must define the authoritative ledger location and writer model, atomic/durable append or transaction boundary, full-chain query/auth boundary, retention/deletion and backup schedule, consistent snapshot/recovery method, RPO/RTO targets, and an operator-visible reconciliation state. Failure injection and restore under failure must be tested on isolated data. This read-only tool does not implement those controls.

## Claim Boundary

The local ledger result is a read-only snapshot observation. It does not approve a retry, prove online durability, accept the HTML artifact, or close Q001/R0.

## Epistemic Process Block

### Expected Result / Prediction

An exact attempt present in a valid snapshot should be found once; absent, duplicate or malformed evidence must never be interpreted as safe to retry.

### Evidence Comparison

The eight-block local chain yielded one exact match and the absent control returned a distinct non-success state. Synthetic tests exercised duplicate, corrupted, unreadable and malformed variants without mutating the live ledger.

### Contradiction Or Gap Disposition

The current file rewrite and process-local lock do not support a durability or multi-writer claim. A local snapshot cannot resolve an in-flight write or authoritative-host mismatch. Those remain Q001 design and proof gaps.

### Claim Update

Manual, read-only local attempt reconciliation is available for investigation; automatic retry, retention/backup under failure and Q001/R0 exit remain open.
