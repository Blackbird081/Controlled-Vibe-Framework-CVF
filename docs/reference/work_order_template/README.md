# CVF Work Order Template Family — Folder Index

Memory class: POINTER_RECORD

Status: ACTIVE_INDEX
EPISTEMIC_PROCESS_NA_WITH_REASON: pointer-record folder index; no evidence claims or source-backed assertions are made.


docType: reference

Text Encoding Exception: em dash and standard punctuation used in governance prose

## Scope / Target / Owner Boundary

Target: index and front door for the `docs/reference/work_order_template/`
folder. Stable addenda in this folder supplement the canonical work order
template; they do not replace it.

Owner boundary: this README owns the folder index, addendum list,
section-to-addendum mapping, naming rules, and archive policy for this family.
It does not own runtime behavior, live proof, or public-sync scope.

## Applies To

Any agent or author working with the CVF Agent Work Order Template who needs to
locate a specific rule addendum or understand the folder layout.

## Purpose

This folder is the indexed front door for the CVF Agent Work Order Template
family. It contains stable-path addenda that carry long-lived rule text
extracted from the canonical template for GC-023 maintainability.

An agent reading a work order should:

1. Start from the canonical template:
   `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
2. Confirm that any delegated dispatch-ready work order has
   `## Dispatch Prompt Envelope` as the first `##` section before `## Purpose`.
3. Follow a section pointer here to this README.
4. Read only the addenda relevant to the current work order type.

## Canonical Template

`docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`

This file is the front door. It defines the required section structure and
compact skeletons. All addenda in this folder supplement it; they do not
replace it.

## Foundation File Naming Rule

Durable addenda in this folder use **stable filenames without date suffixes**.
Dates are appropriate for roadmaps, GC-018 packets, reviews, worker returns,
and execution-only artifacts — not for reusable rule addenda.

When an addendum is materially revised:
- update it in place with a change note in the file header;
- do not create a new dated copy alongside the existing file;
- add an archive pointer here if the prior version must be preserved.

## Addenda In This Folder

| File | Covers | Mandatory? |
|---|---|---|
| `CVF_WORK_ORDER_SOURCE_VERIFICATION_ADDENDUM.md` | Source-fidelity pass rules, negative search discipline, intake role routing, single-agent multi-role block, source verification table rules, MA1 section lock | Conditional: required when work order names runtime or source facts |
| `CVF_WORK_ORDER_MACHINE_CLOSURE_PACKAGE_ADDENDUM.md` | Machine Closure Package table, Acceptance Receipt Assertion Matrix, External Artifact Hash Manifest, closure rules | Conditional: required for scan/classify/route/close/handoff work orders |

## Related Dated Addenda (In `docs/reference/`)

These were created before the stable folder existed. They remain authoritative
at their current paths; they are not date-sprawled duplicates.

| File | Covers | Mandatory? |
|---|---|---|
| `CVF_AGENT_WORK_ORDER_FINALITY_AND_REVIEW_CONVERSION_ADDENDUM_2026-06-12.md` | Commit mode lifecycle, dependency release, two-stage handoff finality, worker pending-return gate, reviewer closure conversion block | Conditional: required for `WORKER_MAY_COMMIT` / `WORKER_MUST_NOT_COMMIT` work orders |
| `CVF_AGENT_WORK_ORDER_EPISTEMIC_PROCESS_BLOCK_ADDENDUM_2026-06-13.md` | Epistemic Process Block full contract (FPC-T3-C04) | Conditional: required for high-evidence work orders (findings, claim updates, corpus, benchmarks) |
| `CVF_WORK_ORDER_AUTHORING_HARDENING_ADDENDUM_2026-06-11.md` | Machine Closure Package row/status token vocabulary, external evidence digest hash rules | Reference: cited by the Machine Closure Package addendum |

## Section-To-Addendum Mapping

| Template section | Relevant addendum |
|---|---|
| `## 6A. Source-Fidelity Pass` | `CVF_WORK_ORDER_SOURCE_VERIFICATION_ADDENDUM.md` |
| `## 6C. Worker Autonomy / No-Question Rule` | No addendum needed — rule is compact in template |
| `## 6D. Pending Artifact Evidence Finality` | `CVF_AGENT_WORK_ORDER_FINALITY_AND_REVIEW_CONVERSION_ADDENDUM_2026-06-12.md` |
| `## 6E. Self-Reported Gate Evidence Consistency` | `CVF_AGENT_WORK_ORDER_FINALITY_AND_REVIEW_CONVERSION_ADDENDUM_2026-06-12.md` |
| `## 6E.1 Machine Closure Package` | `CVF_WORK_ORDER_MACHINE_CLOSURE_PACKAGE_ADDENDUM.md` |
| `## 8C. Epistemic Process Block` | `CVF_AGENT_WORK_ORDER_EPISTEMIC_PROCESS_BLOCK_ADDENDUM_2026-06-13.md` |

## Mandatory vs Conditional Reads

**Always read the canonical template first.**

Then read addenda only when the work order type requires them:

| Work order type | Must also read |
|---|---|
| Names runtime fields, source paths, or role values | Source Verification Addendum |
| `WORKER_MAY_COMMIT` or `WORKER_MUST_NOT_COMMIT` | Finality and Review Conversion Addendum |
| Scan / classify / corpus / route / close / handoff | Machine Closure Package Addendum |
| High-evidence findings, claim updates, benchmarks | Epistemic Process Block Addendum |
| INDEX-tranche work orders (GC-018 for `INDEX type:` artifacts) | `docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md`; `governance/compat/check_index_classification.py` |

## Archive Policy

If an addendum in this folder is superseded by a newer version:
- rename the old file to `archive/<filename>` within this folder;
- update this README's addenda table to point to the new canonical file;
- add an archive note at the top of the archived file.

Dated execution artifacts (worker returns, GC-018 packets, completion reviews)
are not stored here. They belong in `docs/work_orders/`, `docs/baselines/`,
and `docs/reviews/`.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude worker |
| Provider or surface | Claude Code / IDE session |
| Session or invocation | 2026-06-16 CCLV-T1A work order template pointer refactor |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Write tool |
| Target paths | `docs/reference/work_order_template/README.md` |
| Allowed scope source | CCLV-T1A work order; operator-directed stable folder layout |
| Before status evidence | base `71b4f2ce`; file did not exist |
| After status evidence | file created; WORKER_MUST_NOT_COMMIT pending Codex review |
| Diff evidence | new file; no prior content |
| Approval boundary | folder index and naming rule; no runtime/provider/live/public scope |
| Claim boundary | repo-local trace only; no OS/user attribution |
| Agent type | Claude worker |
| Invocation ID | cclv-t1a-work-order-template-readme-2026-06-16 |
| Expected manifest | `docs/reference/work_order_template/README.md` |
| Actual changed set | `docs/reference/work_order_template/README.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This README is a pointer record. It does not authorize runtime behavior,
provider calls, live proof, public-sync, legacy absorption, or autonomous
mutation.
