# CVF Dispatch Scaffold Provenance Standard

Memory class: governed-reference-standard

Status: ACTIVE_REFERENCE

Date: 2026-07-01

EPISTEMIC_PROCESS_NA_WITH_REASON: this reference standard defines a structural
provenance gate for dispatch artifacts and does not compare implementation
evidence against predictions.

## Purpose

Define the required `Scaffold Provenance Block` that dispatch-ready GC-018
baselines and work orders must carry so reviewers and workers can verify
scaffold origin, manual edits, checker read-ahead, and doc-only field
declarations before worker execution begins.

## Applies To

Applies to changed Markdown files under `docs/baselines/` and `docs/work_orders/`
that contain `Status: DISPATCH_READY` or `Status: DISPATCHED`. Archived docs,
completion reviews, worker returns, roadmaps, and reference standards are out
of scope.

## Required Scaffold Provenance Block Fields

| Field | Required value shape |
| --- | --- |
| `scaffoldHelperCommand` | Concrete CLI command string showing how the scaffold was generated; must not be `FILL_ME` or empty. |
| `generatedProfile` | Packet-kind and commit-mode profile used for generation; must not be `FILL_ME` or empty. |
| `generatedSkeletonStatus` | One of: `USED_AS_STARTING_POINT`, `GENERATED_BUT_REPLACED`, `NOT_USED_WITH_REASON`. |
| `manualEditsAfterScaffold` | Description of manual edits made after scaffold generation; must not be `FILL_ME` or empty. |
| `checkerReadAheadConfirmation` | List of checker source paths read before authoring; must not be `FILL_ME` or empty. |
| `docOnlyNewFields` | List of new doc-only field names introduced by this dispatch; must not be `FILL_ME` or empty. |
| `claimBoundary` | Boundary statement for the provenance block; must not be `FILL_ME` or empty. |

## Exclusions

The following are excluded from the checker:

- Files under `docs/baselines/archive/` or `docs/work_orders/archive/`
- Files that do not contain `Status: DISPATCH_READY` or `Status: DISPATCHED`
- Completion reviews under `docs/reviews/`
- Worker returns under `docs/reviews/`
- Reference standards under `docs/reference/`
- Quoted examples inside code fences

## Claim Boundary

This standard defines a structural provenance gate for dispatch artifacts only.
It does not prove worker implementation correctness, runtime/provider behavior,
public-sync readiness, MCP/CLI adapter behavior, model-router work, action
authority, automatic invocation, or production readiness.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private governance-control reference standard; no public-sync artifact
is created by this tranche.

## Delta Execution Claim Boundary Control Block

| Field | Value |
| --- | --- |
| claimScope | dispatch scaffold provenance standard |
| claimDisposition | CLAIM_REJECTED: this standard defines structural provenance checks only |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt is created or consumed |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no runtime action is executed or observed |
| invocationBoundary | local checker/helper invocation only |
| interceptionBoundary | no direct interception, wrapper/proxy enforcement, runtime gate, or agent coding control |
| claimLanguage | structural dispatch provenance guidance only |
| forbiddenExpansion | no runtime/provider/live/public/package/Web/MCP/model-router behavior without fresh source-verified authorization |

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | WOAS-R5 worker |
| Provider or surface | local workspace |
| Session or invocation | WOAS-R5 scaffold-first dispatch quality gate, 2026-07-01 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | read_file, write_to_file, edit, run_command |
| Target paths | `docs/reference/work_order_authoring/CVF_DISPATCH_SCAFFOLD_PROVENANCE_STANDARD.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_WOAS_R5_SCAFFOLD_FIRST_DISPATCH_QUALITY_GATE_2026-07-01.md` Allowed Scope |
| Before status evidence | no scaffold provenance standard existed before this tranche |
| After status evidence | standard created with required fields, eligibility, exclusions, and claim boundary |
| Diff evidence | `git diff --name-status` |
| Approval boundary | worker execution only; reviewer/closer owns material commit |
| Claim boundary | no runtime/provider/public/source-import/Web/MCP/model-router claim |
| Agent type | worker |
| Invocation ID | `woas-r5-scaffold-provenance-standard-2026-07-01` |
| Expected manifest | `docs/reference/work_order_authoring/CVF_DISPATCH_SCAFFOLD_PROVENANCE_STANDARD.md` |
| Actual changed set | `docs/reference/work_order_authoring/CVF_DISPATCH_SCAFFOLD_PROVENANCE_STANDARD.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename in this batch |
