# CVF WOAS-R1 Dispatch Packet Authoring Scaffold Standard

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-01

Batch ID: WOAS-R1

## Purpose

Define the helper-first scaffold that generates prefilled CVF GC-018 baseline
and work-order markdown skeletons, so a dispatch author starts from a form
that already carries required machine-shape sections instead of blank-page
authoring that discovers required literal tokens one gate failure at a time.

## Scope / Applies To

Applies to `governance/compat/build_dispatch_packet_scaffold.py` and its
generated text output. Does not apply to runtime, provider, live-proof, Web,
MCP, CLI, package-lifecycle, model-router, or public-sync behavior. The
helper is a local text-generation tool only; it does not write files, does
not mutate git or session state, and does not call any live provider.

## Helper

`governance/compat/build_dispatch_packet_scaffold.py`

## Packet Kinds

| Packet kind | Meaning |
| --- | --- |
| `generic-worker-dispatch` | Default kind; emits a paired baseline and work order for a standard delegated-worker tranche. |
| `held-dependency` | Same as generic, and always activates the held-dependency trigger even without `--dependency`. |
| `source-intake` | Hints at source-intake trigger text in the title for testing/authoring convenience. |
| `runtime-provider-live` | Hints at runtime/provider/live trigger text. |
| `package-skill` | Hints at package-skill trigger text. |
| `web-ui-dashboard` | Hints at Web/UI/dashboard trigger text. |
| `mcp-cli-adapter` | Hints at MCP/CLI trigger text. |
| `public-sync` | Hints at public-sync trigger text. |
| `protected-governance-path` | Hints at protected-governance-path trigger text. |

Trigger activation is driven by matching indicator words in `--title` and
`--dependency` text (see Trigger Map Requirements below), not solely by
`--packet-kind`. `--packet-kind` selects a default profile; the underlying
word-boundary match against title/dependency text is what actually decides
which stub sections appear.

## CLI Usage

```
python governance/compat/build_dispatch_packet_scaffold.py \
  --packet-kind generic-worker-dispatch \
  --batch-id <BATCH-ID> \
  --title "<Human Title>" \
  --date YYYY-MM-DD \
  --base <dispatchBaseHead> \
  --commit-mode WORKER_MUST_NOT_COMMIT \
  --dependency "<optional dependency text>" \
  --stdout

python governance/compat/build_dispatch_packet_scaffold.py --explain-trigger-map
```

`--explain-trigger-map` takes no other arguments and prints the static
reference trigger-family table. Packet generation mode requires `--stdout`,
`--batch-id`, `--title`, `--date`, `--base`, and `--commit-mode`; missing any
of these exits 2 with an error listing the missing flag(s). Supplying all
generation fields without `--stdout` also exits 2 so the helper cannot
silently succeed without emitting scaffold text.

## Trigger Map Requirements

| Trigger family | Input indicator examples | Required generated stub |
| --- | --- | --- |
| held dependency | dependency text or `--status HOLD_*` | `## Dependency Release Evidence` |
| no-commit worker | `--commit-mode WORKER_MUST_NOT_COMMIT` | `## Agent Handoff Contract Control Block`; `## Reviewer Closure Conversion` |
| source-intake | source intake, outside-source, repo folder review, copied folder | source-intake decision packet fields and negative-search rows |
| runtime/provider/live | runtime, provider, live proof, model gateway | live-proof boundary and diagnostic reminder |
| package-skill | package skill, ASSF, skill registry | package-skill productionization boundary stub |
| Web/UI/dashboard | Web, UI, dashboard, frontend | DESIGN.md read reminder and UI claim boundary |
| MCP/CLI | MCP, CLI, adapter | adapter boundary and no-runtime-overclaim stub |
| public-sync | public export, public-sync | public/provenance boundary and export disposition stub |
| Unicode/evidence reuse | Unicode, encoding, prior evidence, receipt reuse | evidence-reuse and encoding plan stub |
| protected governance path | checker, hook catalog, autorun catalog, session state | core guard self-protection authorization stub |

Detection uses case-insensitive whole-word matching against the combined
`--title`, `--packet-kind`, and `--dependency` text, except for the
`held dependency` and `no-commit worker` families, which are driven directly
by whether `--dependency` was supplied (or `--packet-kind held-dependency`)
and by the literal `--commit-mode` value.

## Required Generated Sections - GC-018 Baseline Forms

| Section | Requirement |
| --- | --- |
| Purpose | Always present with a fillable mission prompt. |
| Dependency Release Evidence | Present when `--dependency` is supplied or packet kind is `held-dependency`. |
| ADIF Defect Registry Disclosure | Always present with exact resolver query field names. |
| Checker Source Read-Ahead Block | Always present with `applicableCheckersRead`, `literalTokensReviewed`, `gateRunPurpose`, `claimBoundary`. |
| Source Verification Block | Always present with the required source verification columns. |
| Negative Search And Collision Discipline | Always present with command and disposition rows. |
| Public Export Disposition | Always present with a default `DEFERRED_PRIVATE_ONLY` value unless the author overrides with real evidence. |
| Current Runtime Freshness Verification | Present when runtime/provider/live trigger text is present. |
| Package Skill Productionization Control Block | Present when package-skill trigger text is present. |

## Required Generated Sections - Work Order Forms

| Section | Requirement |
| --- | --- |
| Dispatch Prompt Envelope | Always the first `##` section. |
| Purpose | Always present after the envelope. |
| Dependency Release Evidence | Present when `--dependency` is supplied or packet kind is `held-dependency`. |
| Worker Autonomy / No-Question Rule | Always present for delegated worker packets. |
| ADIF Defect Registry Disclosure | Always present with exact resolver query line. |
| Checker Source Read-Ahead Block | Always present with checker and literal-token fields. |
| Source Verification Block | Always present with dispatch-quality source columns. |
| Agent Handoff Contract Control Block | Present when `--commit-mode WORKER_MUST_NOT_COMMIT`. |
| Reviewer Closure Conversion | Present when `--commit-mode WORKER_MUST_NOT_COMMIT`. |
| Work-Order Fulfillment Manifest | Always present. |
| Worker Return Packet Shape Contract | Always present; for `WORKER_MUST_NOT_COMMIT`, emits compact `WORKER_RETURN_FULL_GATE_V1` profile plus required fast gate and skeleton requirement. |
| Verification Commands | Always present; for `WORKER_MUST_NOT_COMMIT`, includes `python governance/compat/run_worker_return_fast_gate.py`. |
| Agent Operation Trace Block | Always present with before-status and expected-manifest fields. |
| Delta Execution Claim Boundary Control Block | Always present with no runtime/provider/live/public overclaim defaults. |
| Public Export Disposition | Always present with default `DEFERRED_PRIVATE_ONLY` unless overridden. |

All generated sections are scaffolds: fields marked `FILL_ME` require the
dispatching agent to supply real, source-verified content before dispatch.
The helper does not run the ADIF resolver, does not read checker source, and
does not perform negative searches on the author's behalf; it only prints
the required shape so those steps are not discovered late via gate failure.

## Opt-In Worker Return Skeleton (WOAS-R3)

The helper supports an optional `--include-worker-return-skeleton` CLI flag
that appends a `=== Generated Worker Return Skeleton ===` section after the
baseline and work-order skeletons. This skeleton is a fillable worker-return
markdown document with all required machine-shape sections:

| Skeleton element | Requirement |
| --- | --- |
| `Status: COMPLETE_PENDING_REVIEW` | Present as fillable default. |
| `dispatchWorkOrder:` | Present and points to the generated canonical work-order path. |
| `executionBaseHead:` | Present and marked `WORKER_MUST_CAPTURE_AT_START`. |
| `rawMemoryReleased=false` | Present as literal default. |
| `## Purpose` through `## No-Commit Statement` | All required top-level sections present. |
| Agent Operation Trace Block | All labels from `check_agent_operation_trace.py` present. |
| Delta Execution Claim Boundary Control Block | All eight required Delta fields with claim-rejection defaults. |
| Public Export Disposition | `DEFERRED_PRIVATE_ONLY` default. |
| Worker Experience Retrospective | Present with `WORKER_EXPERIENCE_RETRO_NA_WITH_REASON` default. |
| Command Evidence | Includes `python governance/compat/run_worker_return_fast_gate.py`. |
| Conditional sections | `External Knowledge Intake Routing`, `Rescan Intelligence Hardening`, `Corpus Completeness And Report Integrity`, `Finding-To-Governance Learning Disposition`, `Epistemic Process Block`, `Machine Closure Package` present with compact N/A placeholders. |
| KIOD-R8 marker safety | Must not emit standalone `Source intake decision packet: REQUIRED` or exact `## Source Intake Decision Packet`. |

Default-output stability: without `--include-worker-return-skeleton`, the
helper's baseline and work-order output remains byte-identical to the
pre-WOAS-R3 behavior. The WOAS-R2 source-intake golden fixture test
continues to guard this stability.

The skeleton generator is `build_worker_return_skeleton(args: ScaffoldArgs)`
- a deterministic pure function that takes the same `ScaffoldArgs` used for
baseline/work-order generation and returns the skeleton markdown string.

Claim boundary: the skeleton is a text-generation scaffold only. No runtime,
provider, live-proof, Web, MCP, CLI, package-lifecycle, model-router,
public-sync, action-authority, or automatic-invocation behavior is
implemented or claimed.

## External Knowledge Intake Routing

NOT_APPLICABLE_WITH_REASON: this standard documents an internal governance
authoring helper implemented under WOAS-R1. It is not itself an absorption,
intake, or external-agent review artifact, and it does not route or classify
any external source material.

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: this standard documents a deterministic
text-generation helper's fixed behavior. It does not make evidence-heavy
predictions, run experiments, or compare competing hypotheses about live
system behavior.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
| --- | --- |
| claimScope | WOAS-R1 dispatch packet authoring scaffold standard - documentation and helper-behavior specification only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made by this standard |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | local helper invoked manually via CLI by a dispatching agent |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | text-generation scaffold helper and reference standard only |
| forbiddenExpansion | enforcement wrapper, proxy enforcement, interception, arbitrary-command execution, EDIT/COMMIT execution, provider/live, public-sync, queue/daemon, watcher, readiness claims, or universal control remain out of scope |

## Claim Boundary

This standard documents a local text-generation scaffold helper only. It
does not implement, wire, or authorize any blocking checker; does not claim
runtime, provider, live-proof, Web, MCP, CLI, package-lifecycle,
model-router, or public-sync behavior; and does not reduce the dispatching
agent's obligation to read applicable checker source, run the ADIF resolver,
and perform real source verification before dispatch.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: WOAS-R1 is private provenance governance-helper work. Public-sync is
outside this packet's public-sync boundary.

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | WOAS-R3 no-commit worker |
| Provider or surface | local workspace |
| Session or invocation | WOAS-R3 worker execution, 2026-07-01 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | write_to_file, edit, multi_edit, run_command (unit tests, smoke commands, governance gates) |
| Target paths | `docs/reference/work_order_authoring/CVF_WOAS_R1_DISPATCH_PACKET_AUTHORING_SCAFFOLD_STANDARD.md`; `governance/compat/build_dispatch_packet_scaffold.py`; `governance/compat/test_build_dispatch_packet_scaffold.py`; `governance/compat/fixtures/woas_r3_worker_return_skeleton_golden.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_WOAS_R3_WORKER_RETURN_SKELETON_SCAFFOLD_2026-07-01.md` Allowed Scope |
| Before status evidence | clean worktree at HEAD `4317eef3`; `git status --short` returned no changed paths before edits |
| After status evidence | `git status --short` shows this standard, the helper, the helper test, and the golden fixture as changed; HEAD unchanged |
| Diff evidence | `git diff --name-status` |
| Approval boundary | worker execution only; reviewer/closer owns material commit |
| Claim boundary | governance-helper standard update only; no runtime/provider/live/public/package/Web/MCP/model-router claim |
| Agent type | worker |
| Invocation ID | `woas-r3-worker-return-skeleton-scaffold-2026-07-01` |
| Expected manifest | `docs/reference/work_order_authoring/CVF_WOAS_R1_DISPATCH_PACKET_AUTHORING_SCAFFOLD_STANDARD.md`; `governance/compat/build_dispatch_packet_scaffold.py`; `governance/compat/test_build_dispatch_packet_scaffold.py`; `governance/compat/fixtures/woas_r3_worker_return_skeleton_golden.md` |
| Actual changed set | `docs/reference/work_order_authoring/CVF_WOAS_R1_DISPATCH_PACKET_AUTHORING_SCAFFOLD_STANDARD.md`; `governance/compat/build_dispatch_packet_scaffold.py`; `governance/compat/test_build_dispatch_packet_scaffold.py`; `governance/compat/fixtures/woas_r3_worker_return_skeleton_golden.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename in this batch |
