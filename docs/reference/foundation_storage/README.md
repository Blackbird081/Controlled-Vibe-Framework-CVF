# CVF Foundation Storage Front Door

Memory class: POINTER_RECORD

Status: ACTIVE_INDEX

docType: reference

## Purpose

Provide the stable folder front door for CVF foundation-file storage and index
rules. Agents use this folder before creating, splitting, relocating, or
refactoring long-lived governance foundation artifacts.

## Scope / Target / Owner Boundary

Target: stable retrieval layout for durable CVF foundation files.

Owner boundary: this folder owns storage/index guidance for foundation
governance artifacts. It does not own runtime behavior, provider proof,
public-sync, or historical execution evidence.

## Central Standard

Current standard:

`docs/reference/foundation_storage/CVF_FOUNDATION_FILE_STORAGE_AND_INDEX_STANDARD.md`

## Required Read Trigger

Read this folder when a task:

- creates or refactors a durable CVF governance standard, template, addendum,
  folder index, front door, or reference family;
- extracts a large foundation file into smaller local-view artifacts;
- decides whether a file should have a stable path or a dated execution path;
- updates a folder that future agents must scan to understand CVF governance;
- records a finding that a reusable rule lived only in provider memory, chat, or
  a one-off completion packet.

## Stable Storage Rule

Foundation files use stable indexed paths. Execution and evidence files use
dated paths and may later be archived.

This folder is the central lookup point for that distinction. Family-specific
folders, such as `docs/reference/work_order_template/`, remain local views and
must point back to this central rule when they define their own folder index.

## Current Local Views

| Folder or file | Role | Boundary |
|---|---|---|
| `docs/reference/work_order_template/README.md` | Work-order template family front door | Local view for work-order addenda only |
| `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md` | Canonical work-order skeleton | Still dated by historical convention; points to stable local-view addenda |
| `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md` | Cross-CVF operational lookup index | Points agents to this folder when foundation storage/layout is in scope |

## Archive Policy

Archive obsolete stable foundation files inside the nearest family folder's
`archive/` subfolder, or under `docs/reference/archive/` when no family folder
exists. Do not leave superseded durable rules side by side with active stable
rules without an index entry explaining which one is canonical.

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

## Claim Boundary

This README is a pointer record. It does not authorize runtime behavior,
provider calls, public-sync, autonomous mutation, or production/public readiness
claims.
