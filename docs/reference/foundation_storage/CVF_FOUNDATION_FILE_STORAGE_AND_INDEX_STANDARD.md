# CVF Foundation File Storage And Index Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD_AND_MACHINE_ENFORCED

docType: reference

## Purpose

Define how durable CVF foundation artifacts are stored, indexed, and retrieved
so future agents do not have to rediscover long-lived governance rules from
chat memory, provider-local memory, dated one-off artifacts, or scattered
addenda.

## Scope / Target / Owner Boundary

Target: storage discipline for long-lived CVF governance foundation files and
their local-view folders.

Owner boundary: this standard governs folder/index expectations for foundation
artifacts. It does not rewrite historical artifacts by itself, authorize broad
archive cleanup, or change runtime behavior. The machine gate below enforces
the storage/index surface for changed artifacts.

## Source Authority

| Source | Path | Role |
|---|---|---|
| AHB-T2-F1 finding | `docs/reviews/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_COMPLETION_2026-06-16.md` | Immediate governance finding requiring remediation |
| Work-order template folder precedent | `docs/reference/work_order_template/README.md` | Local-view precedent for stable addendum folder |
| CCLV-T1A baseline | `docs/baselines/CVF_GC018_CCLV_T1A_WORK_ORDER_TEMPLATE_POINTER_REFACTOR_2026-06-16.md` | Precedent for stable filenames without date suffixes |
| Operational reference index | `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md` | Cross-CVF lookup front door |
| Provider memory boundary | `AGENTS.md` | Requires reusable lessons to be verified against CVF-governed surfaces |

## Rule

Foundation files are stable, indexed, and locally discoverable. Execution and
evidence files are dated, range-bound, and archiveable.

When a governance refactor creates or updates durable rules, the refactor must
include storage layout work in the same governed batch unless explicitly marked
deferred with a path, owner, and next control action.

## Artifact Classes

| Class | Examples | Path rule | Index rule |
|---|---|---|---|
| Central foundation standard | durable governance rule, family-wide contract, reusable addendum | stable path preferred; dated path allowed only when legacy convention already controls the family | must appear in a folder README or operational index |
| Local-view family folder | template addenda, stable rule family, grouped foundation references | folder under `docs/reference/<family>/` with `README.md` | README must list canonical files, reads, archive policy, and owner boundary |
| Execution artifact | GC-018, work order, roadmap tranche, worker return, completion review | dated path under existing execution folders | indexed only when it becomes an active operational front door |
| Evidence artifact | receipts, scan outputs, proof packets, closure evidence | dated or batch-scoped path | referenced from completion or evidence index; archiveable after active value ends |
| Historical/superseded rule | replaced foundation rule or old folder layout | archive path with active index pointer | active index must name the replacement |

## Required Folder Front Door

Any stable foundation folder must include `README.md` with:

- purpose and owner boundary;
- current canonical files;
- mandatory and conditional read triggers;
- archive policy;
- relationship to Central Core and Local View;
- claim boundary;
- Agent Operation Trace Block when changed by an agent batch.

## Date Policy

Use stable filenames without date suffixes for durable foundation files when the
file is intended to remain the active canonical rule for a family.

Use dated filenames for:

- GC-018 baselines;
- work orders;
- roadmaps and tranche plans;
- completion reviews and worker returns;
- evidence packets;
- one-off audits and assessments;
- public-sync or release summaries.

Do not create a new dated copy of a stable foundation file merely to update the
rule. Update the stable file in place and record provenance in the changed
batch's GC-018, work order, completion packet, and git history.

## Central Core And Local View

This standard is the Central Core for storage/index discipline.

Family-specific folders are Local Views. A Local View may add family-specific
read triggers and archive policy, but it must not contradict the Central Core.

## Work Order Requirement

Any work order that creates, splits, relocates, or refactors durable governance
foundation files must include a Foundation Storage Layout Block with:

| Field | Required content |
|---|---|
| Foundation files touched | Stable rule/template/addendum/index paths |
| Storage class | Central foundation standard, local-view folder, execution artifact, evidence artifact, or historical/superseded rule |
| Index/front door | README or operational index path that future agents must read |
| Date policy | Stable-path or dated-path rationale |
| Archive disposition | N/A with reason, archive path, or future archive action |
| Deferred layout work | N/A with reason or explicit follow-up path/owner |

## Completion Requirement

Completion reviews for foundation refactor work must state whether storage and
index layout was handled in the same batch. If not handled, the completion must
record `MACHINE_CHECK_CANDIDATE` or `STANDARD_CANDIDATE` with a concrete next
control action.

## Machine Enforcement

The mandatory guard is:

```powershell
python governance/compat/check_foundation_storage_layout.py --base <baseHead> --head HEAD --enforce
```

The guard runs in the autorun workflow and local governance hook chain. It
checks changed work orders and stable `docs/reference/<family>/` files for
these defects:

- detect new stable foundation folders without `README.md`;
- detect work orders that refactor foundation files without a Foundation Storage
  Layout Block;
- detect stable addenda created with dated duplicate names inside a stable
  family folder;
- detect active indexes that point to superseded foundation files without an
  archive disposition.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | Codex local workspace |
| Session or invocation | 2026-06-16 AHB-T2-F1 foundation storage remediation |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, rg, apply_patch |
| Target paths | `docs/reference/foundation_storage/README.md`; `docs/reference/foundation_storage/CVF_FOUNDATION_FILE_STORAGE_AND_INDEX_STANDARD.md`; `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md`; `docs/roadmaps/CVF_AGENT_HANDOFF_BOUNDARY_SYSTEMIZATION_ROADMAP_2026-06-16.md`; `docs/baselines/CVF_GC018_AHB_T2_F1_FOUNDATION_STORAGE_LAYOUT_REMEDIATION_2026-06-16.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_AHB_T2_F1_FOUNDATION_STORAGE_LAYOUT_REMEDIATION_FOR_CODEX_2026-06-16.md`; `docs/reviews/CVF_AHB_T2_F1_FOUNDATION_STORAGE_LAYOUT_REMEDIATION_COMPLETION_2026-06-16.md` |
| Allowed scope source | AHB-T2-F1 finding in `docs/reviews/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_COMPLETION_2026-06-16.md` |
| Before status evidence | HEAD `073407d3`; worktree clean |
| After status evidence | AHB-T2-F1 material closure pending commit |
| Diff evidence | `git diff --name-status 073407d3..HEAD` |
| Approval boundary | documentation-only foundation storage/index remediation |
| Claim boundary | no runtime/provider/live/public/registry/checker implementation claim |
| Agent type | Codex implementer/closer |
| Invocation ID | `ahb-t2-f1-foundation-storage-layout-remediation-2026-06-16` |
| Expected manifest | `docs/reference/foundation_storage/README.md`; `docs/reference/foundation_storage/CVF_FOUNDATION_FILE_STORAGE_AND_INDEX_STANDARD.md`; `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md`; `docs/roadmaps/CVF_AGENT_HANDOFF_BOUNDARY_SYSTEMIZATION_ROADMAP_2026-06-16.md`; `docs/baselines/CVF_GC018_AHB_T2_F1_FOUNDATION_STORAGE_LAYOUT_REMEDIATION_2026-06-16.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_AHB_T2_F1_FOUNDATION_STORAGE_LAYOUT_REMEDIATION_FOR_CODEX_2026-06-16.md`; `docs/reviews/CVF_AHB_T2_F1_FOUNDATION_STORAGE_LAYOUT_REMEDIATION_COMPLETION_2026-06-16.md` |
| Actual changed set | `docs/reference/foundation_storage/README.md`; `docs/reference/foundation_storage/CVF_FOUNDATION_FILE_STORAGE_AND_INDEX_STANDARD.md`; `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md`; `docs/roadmaps/CVF_AGENT_HANDOFF_BOUNDARY_SYSTEMIZATION_ROADMAP_2026-06-16.md`; `docs/baselines/CVF_GC018_AHB_T2_F1_FOUNDATION_STORAGE_LAYOUT_REMEDIATION_2026-06-16.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_AHB_T2_F1_FOUNDATION_STORAGE_LAYOUT_REMEDIATION_FOR_CODEX_2026-06-16.md`; `docs/reviews/CVF_AHB_T2_F1_FOUNDATION_STORAGE_LAYOUT_REMEDIATION_COMPLETION_2026-06-16.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance governance standard. No public-sync batch is
authorized.

## Claim Boundary

This standard creates a governed retrieval and storage rule. It does not move
existing files, rewrite history, implement a checker, run live proof, public-sync,
or claim production/public readiness.
