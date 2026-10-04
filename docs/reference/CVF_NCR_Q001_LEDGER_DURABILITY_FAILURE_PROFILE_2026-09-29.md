# CVF NCR Q001 Ledger Durability Failure Profile

Memory class: POINTER_RECORD

Status: FAILURE_REPRODUCED_DESIGN_GATE_OPEN

docType: reference

Date: 2026-09-29

## Purpose

Record the observed failure boundary of the current local Governance Engine ledger and the acceptance contract for a later Q001 persistence repair. This is Local private-CVF verification, not a release or artifact-acceptance decision. The operator's selected GitHub HTML route remains the use case; Web research remains advisory and Local owns technical disposition.

## Scope / Applies To

Applies to the JSON ledger implementation in `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/ledger_layer/immutable_ledger.py` and the selected local Q001 receipt path. The probes use new disposable files under ignored `.cvf/runtime`, never the eight-block GitHub ledger or a user artifact. No engine code, provider call, hosted service, backup policy, or live user content is changed by this profile.

## Source Boundary

`ImmutableLedger.append_event` reads the full JSON chain, appends a block and opens the same path with `"w"` before `json.dump`. The lock is a Python `threading.Lock` in that process. `api/server.py` binds one ledger instance to `CVF_GOVERNANCE_LEDGER_PATH`; `/api/v1/ledger` independently opens the JSON file for reading and returns a limited tail. Source has no atomic replace, fsync, interprocess writer guard, retention scheduler or online backup transaction. `core_orchestrator.py` sets `ledger_attached` after `append_event` returns, but that signal currently does not prove a crash-durable commit. The tracked default seed and isolated runtime ledger are separate; the local profile explicitly uses the isolated path.

## Reproducible Isolated Failure Evidence

`python scripts/probe_cvf_q001_ledger_failure.py` imports the production ledger class and creates only disposable synthetic ledgers. One injected `json.dump` failure writes a single byte after the destination has been opened. The last run observed `injectedFailureObserved=true`, prior file size 303 bytes, post-failure size 1 byte, `priorCommittedBytesPreserved=false`, and `restartRejectedCorruptSnapshot=true`. The post-failure SHA-256 was `245843abef9e72e7efac30138a994bf6301e7e1d7d7042a33d42e863d2638811`. This is a deterministic application-level fault after truncation; it is not a power-loss or filesystem-durability test.

A second probe uses explicit thread events to pause a successful append after opening the destination. A reader observed zero bytes while the writer was paused; after release, the append completed with two blocks and no worker error. The five-second waits are deadlock safety only; the `entered` and `release` events establish the observed order. This demonstrates a transient invalid read window even when the final write succeeds. It does not prove behavior across OS processes or storage devices.

The live GitHub ledger, CVF Web and Governance Engine were untouched by the fault injection. Prior local snapshot restore and exact-attempt reconciliation are useful diagnostics but do not repair this write boundary.

## Technical Disposition And Next Contract

Disposition: `REPAIR_REQUIRED_BEFORE_Q001_DURABILITY_OR_RECOVERY_CLAIM`. Do not label a receipt or accepted artifact crash-durable merely because a hash-linked block exists or `ledger_attached=true`. Keep automatic retry disabled. An absent attempt in a local snapshot is not proof of non-execution.

For the local single-host Q001 profile, the next implementation packet should select a transactional persistence backend behind the ledger interface, with an exact one-writer or multi-process admission model. A local SQLite transaction store is a candidate because the current whole-file JSON rewrite cannot satisfy the observed failure cases; it is not selected for hosted or multi-host deployment by this profile. PostgreSQL/object storage remains a separate Q004/hosted decision. The packet must define migration from a verified JSON chain, unique request-ID/idempotency semantics, authoritative exact-ID lookup, schema/version and rollback boundary, and which storage commit must precede `ledger_attached` and HTTP receipt emission. It must not infer artifact acceptance from an `ALLOW` evaluation.

Required isolated acceptance cases are: pre-commit failure retains the previous accepted state; readers see either old or new complete state; two real processes cannot lose an append; duplicate request IDs do not create duplicate effects; crash after commit but before HTTP response is reconciled by exact ID; corrupt or incompatible migration input fails without overwrite; backup is taken from a consistent state and restored into a clean instance; restored request IDs, chain links, permissions and artifact references reconcile. A declared retention/deletion schedule, backup location/encryption/key recovery, and RPO/RTO measurement are separate profile gates. The roadmap's pilot RPO <= 24 hours and RTO <= 4 hours are proposed targets awaiting R0 confirmation, not achieved service levels.

A future work order that authorizes the durable write repair triggers `docs/reference/CVF_HIGH_RISK_LOCAL_TRANSACTION_PROOF_STANDARD_2026-09-22.md`: the dispatcher must declare applicability and bind the machine-checkable contract, real second-process peer, deterministic barriers, post-acquire fault injection, independent Local probe, and final evidence hash before implementation is admitted. This reference profile is design and fault evidence only; it does not authorize the target transaction or substitute for that work order.

## Claim Boundary

The current JSON ledger demonstrably loses its prior valid contents on one injected write failure and exposes an empty read window during an otherwise successful append. This is bounded local source-path evidence. It does not quantify real crash frequency, hosted storage behavior, retention, backup success, RPO/RTO, provider governance, or Q001/R0 completion.

## Epistemic Process Block

### Expected Result / Prediction

If the current `"w"` rewrite is non-atomic, a failure after truncation will damage the earlier chain, and a reader can observe an incomplete state before a successful write finishes.

### Evidence Comparison

The isolated failure left one byte and a restart-rejected JSON file. The event-controlled reader saw zero bytes before the writer released; the final successful file held two blocks. Neither probe used the live ledger.

### Contradiction Or Gap Disposition

The earlier restart and quiescent restore checks remain true for completed writes, but they do not cover this failure window. A high-risk transactional-store work order and clean restore drill are required before a durability claim.

### Claim Update

Q001 durability/retention is `REPAIR_REQUIRED`; the immediate behavior is characterized and the next acceptance contract is defined. Pilot effect, P11, deployment and public export remain parked.
