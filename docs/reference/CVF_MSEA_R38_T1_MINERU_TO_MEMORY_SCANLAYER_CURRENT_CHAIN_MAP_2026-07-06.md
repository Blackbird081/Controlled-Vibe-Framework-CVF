# CVF MSEA R38 T1 - MinerU To Memory ScanLayer Current Chain Map

Memory class: reference-audit

docType: reference

Status: ACTIVE_REFERENCE

Created: 2026-07-06

rawMemoryReleased: false

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a source-to-map classification
reference, not an empirical prediction-versus-outcome comparison; each row's
evidence is the Source Verification citation itself.

## Purpose

This reference maps, from current repository source only, every link in the
MinerU-to-memory/scanlayer chain: receipt writer, scan-layer surfaces,
durable-store invocation candidate, memory/RAG route candidate, system-chain
route candidate, internal harness, and Python receipt bridge. It answers
whether these surfaces currently form one connected, source-backed chain or
remain a set of separately bounded links.

## Scope / Applies To

Applies to the current MinerU output, memory candidate, and scan-layer
surfaces under `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/` and
`EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/`, plus the R33/R34/R35 closed
audit artifacts that already classified their release boundary. It does not
apply to use-case/legal workflow, extraction-truth claims, or any surface not
cited in the Source Verification Block below.

## Current Chain Map

| Link | Source file | Verified symbol | Verified line(s) | Status | Boundary |
| --- | --- | --- | --- | --- | --- |
| Metadata receipt object | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | `MineruMetadataReceipt` | line 96 | SOURCE_EXISTS | foundation-only |
| Durable memory write adapter candidate builder | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | `build_mineru_durable_memory_write_adapter_candidate` | line 777 | IMPLEMENTED_INTERNAL | foundation-only |
| Durable memory write adapter candidate class | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | `MineruDurableMemoryWriteAdapterCandidate` | line 198 | IMPLEMENTED_INTERNAL | foundation-only, metadata-only, never invokes the durable store |
| Scan-layer route decision | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/scan_route_decision.py` | `decide_scan_route` | line 69 | SOURCE_EXISTS | internal-only; consumes caller-supplied signals, never raw document content |
| Scan outcome report writer | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/scan_outcome_report.py` | `write_scan_outcome_report_files` | line 272 | IMPLEMENTED_INTERNAL | internal-only, bounded operator-visible report |
| Durable-store invocation candidate | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-durable-store-invocation.ts` | `invokeMineruDurableStoreWrite` | line 105 | IMPLEMENTED_INTERNAL | foundation-only; `MEMORY_WRITE_NOT_AUTHORIZED_BY_T20_INVOCATION_ONLY` (line 30-31) is a literal invariant |
| Memory/RAG route release candidate | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-memory-rag-route-release.ts` | `releaseMineruMemoryRagRouteCandidate` | line 93 | IMPLEMENTED_INTERNAL | held; `MEMORY_RAG_ROUTE_RELEASE_NOT_PRODUCTION_AUTHORIZED_BY_T22` (line 33-34) is a literal invariant |
| System-chain route candidate | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | `buildMineruSystemChainRouteCandidate` | line 78 | IMPLEMENTED_INTERNAL | held; `persistenceMode` type is restricted to `"in-process-only"` (line 34) and `PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY` (line 28-29) is a literal invariant |
| Internal system-chain harness | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-internal-system-chain-harness.ts` | `runMineruInternalSystemChainHarness` | line 126 | IMPLEMENTED_INTERNAL | internal-only pass token `MINERU_INTERNAL_SYSTEM_CHAIN_HARNESS_PASS_BOUNDED` (line 32-33); records `PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33` (line 38-39) |
| Python receipt bridge mapping | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-python-receipt-bridge.ts` | `mapMineruPythonReceiptFixtureToDurableStoreInvocationInput` | line 188 | FIXTURE_ONLY | fixture-only proof; `MINERU_PYTHON_RECEIPT_BRIDGE_PROOF_FIXTURE_ONLY` (line 25-26) and `PYTHON_RECEIPT_BRIDGE_PROOF_NOT_PRODUCTION_WIRED_BY_R34_T1` (line 28-29) are literal invariants |
| Production memory/RAG route release | N/A - no source authorizes this | N/A | N/A | HELD_NOT_RELEASED | every TypeScript surface above keeps an explicit not-authorized hold token; no accepted packet lifts it |
| File-backed production persistence | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | `createFileBackedDurableMemoryStore` (cited by R35-T2) | R35-T2 lines 73-74 | HELD_NOT_RELEASED | exists in source; no accepted packet authorizes calling it for production persistence |
| Use-case/legal workflow | N/A - out of scope by this packet | N/A | N/A | SCOPE_EXCLUDED | excluded by the R38 work order Forbidden Scope; no source surface implements it |

## Chain Continuity Finding

The chain is source-connected in the following order: Python receipt writer
(`mineru_metadata_receipt_writer.py`) produces a durable memory write adapter
candidate; the Python receipt bridge
(`mineru-python-receipt-bridge.ts`) maps a **fixture** of that candidate's
shape into a durable-store invocation input; the durable-store invocation
candidate (`mineru-durable-store-invocation.ts`) is the only link that
actually calls an in-process `DurableMemoryStore.write`; the memory/RAG route
release candidate (`mineru-memory-rag-route-release.ts`) and the system-chain
route candidate (`mineru-system-chain-route-candidate.ts`) wrap that
invocation with explicit non-production authorization checks; the internal
harness (`mineru-internal-system-chain-harness.ts`) exercises the TypeScript
side of this chain deterministically and records, as a literal field, that
the Python-to-TypeScript bridge is fixture-only and not wired into the
harness for a live Python receipt.

This means: the TypeScript foundation chain (T20/T22/T25/harness) is
internally continuous and internally testable end-to-end. The Python-to-
TypeScript boundary is the one link that is fixture-only rather than
source-wired, and the production memory/RAG route is held at every layer by
a literal not-authorized token, not merely by prose.

## Claim Boundary

This reference states only what current source and the cited R33/R34/R35
closure artifacts establish. It does not claim the MinerU chain is a
production-usable system, does not claim extraction accuracy or document
truth, does not claim the Python receipt writer is wired to the TypeScript
harness by live execution, and does not authorize MinerU runtime, provider/
live proof, private/generated content reads, memory/RAG writes, file-backed
production persistence, public-sync, or use-case/legal workflow. It records
mapping and status classification only.
