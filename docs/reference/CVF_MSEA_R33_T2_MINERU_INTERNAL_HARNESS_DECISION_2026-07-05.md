# CVF MSEA R33 T2 MinerU Internal Harness Decision

Memory class: governed-reference

Status: CLOSED_PASS_BOUNDED

Date: 2026-07-05

rawMemoryReleased: false

## Purpose

Select the R33 implementation route for an internal deterministic system-chain
harness.

## Decision

Selected disposition:
`R33_INTERNAL_HARNESS_IMPLEMENTATION_AUTHORIZED_BOUNDED_IN_PROCESS_ONLY`

The harness may call the existing T25 system-chain candidate with deterministic
metadata-shaped input and an in-process durable store. It must record the Python
receipt bridge as not wired by R33 and must keep production route authorization
false.

## Scope / Applies To

Allowed:

- TypeScript harness source under Learning Plane Foundation.
- Focused Vitest test with pass and fail-closed cases.
- Registry source entries for the new harness source/test.

Forbidden:

- Python-to-TypeScript bridge wiring.
- MinerU runtime execution.
- Private/generated output content read.
- File-backed production persistence.
- Retrieval, vectorization, provider/live proof, public runtime claim, or use-case workflow.

## Decision Matrix

| Option | Evidence | Decision |
| --- | --- | --- |
| Do nothing after R30 | Leaves chain unproven as a readable internal system | REJECT |
| Production memory/RAG release | R30 selected no-go without fresh authority | REJECT |
| Python-to-TypeScript bridge | No source-verified bridge packet exists | REJECT_FOR_R33 |
| Internal TypeScript harness | T25/T22/T20 already have bounded in-process helpers | ACCEPT |

## Source Verification Block

| Claimed item | Source fact type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|---|
| T25 system-chain candidate helper | EXISTS | EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts | line 77 | buildMineruSystemChainRouteCandidate | MinerU system-chain candidate | ACCEPT |
| in-process durable store factory | EXISTS | EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts | line 99 | createInProcessDurableMemoryStore | Durable memory store | ACCEPT |
| Python bridge hold token | DOC_ONLY_NEW | EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-internal-system-chain-harness.ts | line 37 | PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33 | R33 harness | ACCEPT |

## Checker Source Read-Ahead Block

| Field | Value |
| --- | --- |
| applicableCheckersRead | `governance/compat/check_governed_artifact_checker_read_ahead.py`; `governance/compat/check_agent_operation_trace.py`; `governance/compat/check_epistemic_process_packet.py` |
| literalTokensReviewed | Status: CLOSED_PASS_BOUNDED; Source Verification Block; Public Export Disposition; Agent Operation Trace Block |
| gateRunPurpose | confirmation/evidence after checker source read-ahead; not first discovery |
| claimBoundary | checker read-ahead evidence for T2 decision only; no production/provider/live/private-output/use-case claim |

## Public Export Disposition

Disposition: `DEFERRED_PRIVATE_ONLY`
Reason: T2 is private provenance decision evidence; public-safe summary is
handled by R33 T5 after public-sync.
Public-sync boundary: public-facing changes must be made from the sibling
public-sync clone, not this provenance workspace.

## Epistemic Process Block

| Field | Value |
| --- | --- |
| Expected Result / Prediction | T2 should choose a lane that proves internal chain readiness without opening production or bridge wiring. |
| Evidence Comparison | The decision matrix rejected production release and bridge wiring, then accepted the internal TypeScript harness lane. |
| Contradiction Or Gap Disposition | No contradiction; the accepted lane preserves `PYTHON_RECEIPT_BRIDGE_NOT_WIRED_BY_R33`. |
| Claim Update | T2 authorizes only bounded harness implementation. |

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Codex reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | MSEA-R33-T2, 2026-07-05 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | `Get-Content`; `rg`; `apply_patch`; `git` |
| Target paths | this T2 reference |
| Allowed scope source | R33 work order |
| Before status evidence | T1 map authored |
| After status evidence | T2 harness decision authored |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | internal harness decision only |
| Claim boundary | no production/runtime/provider/use-case claim |
| Agent type | reviewer/closer |
| Invocation ID | `msea-r33-t2-harness-decision-2026-07-05` |
| Expected manifest | this T2 reference |
| Actual changed set | this T2 reference |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

T2 authorizes only the bounded internal harness route. It does not authorize
production memory/RAG release, bridge wiring, private-output reads, provider
proof, retrieval, vectorization, or use-case work.
