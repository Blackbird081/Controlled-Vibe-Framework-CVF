---
name: cvf-governance-worker-return-review
description: Review a CVF worker return, decide reviewer-local repair versus REWORK, and close only evidence-supported governed tranches. Use for Local reviewer or closer work after an internal worker returns; not for ordinary code-quality review or external Web research.
---

# CVF Governance Worker-Return Review

Memory class: FULL_RECORD

Status: ACTIVE

docType: assf_package

skillId: cvf-governance-worker-return-review

## Purpose

Help a Local reviewer apply existing CVF review and closure rules before
judging an internal worker return. This skill is a compact route to the
canonical owners below, not a replacement for their current text or gates.

## Scope / Applies-To

Use only for an internal CVF worker return in the Local workspace when the
current assignment names a reviewer or closer. The governing work order and
canonical standards determine whether any edit, test, commit, or closure step
is allowed. External Web agents remain advisory research sources.

## Invocation Boundary

| Field | Value |
| --- | --- |
| Task classes | internal worker-return review, reviewer-local repair decision, bounded closure |
| Roles and phases | Local reviewer or closer; REVIEWER_CLOSURE after worker return |
| Inputs | active work order and baseline, returned artifacts, exact Git range and status, worker evidence, current bootstrap and handoff |
| Outputs | source-backed finding set, repair/REWORK/stop disposition, bounded verification and completion evidence when authorized |
| Risk ceiling | R1 advisory guidance; task authority and current CVF owners always control |
| Exclusions | external Web research, initial worker execution, generic code review alone, automatic package activation or provider/live proof |

## Review Procedure

1. Rehydrate the current session using `AGENTS.md`, the bootstrap read model,
   front door, and active handoff. Identify role, phase, decision owner, exact
   work-order scope, protected paths, effect boundary, commit owner, and
   current Git status. Treat same-workspace workers as internal agents even
   when their provider differs.
2. Read the applicable reviewer rows in
   `docs/reference/guard_orientation/README.md` and the canonical
   `docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md`.
   Read the closeability and commit standards for a closure or REWORK decision.
   Check current checker source and required literal fields before writing a
   governed review artifact.
3. Compare the worker's claimed result with the authorized changed set and
   returned evidence. Inspect the bounded dependency graph once: authority,
   source claims, contracts, negative cases, tests, paths, and commit range.
   Consolidate connected findings before the first repair. Consume valid
   returned and machine evidence; rerun only for a named contradiction or
   insufficiency with expected information gain and cost reason.
4. Default to one disclosed reviewer-local repair when the correction is
   localized, source-determined, within the unchanged scope and authority,
   verifiable by focused checks, and cheaper than worker context reload.
   Return REWORK only when design or semantics must materially change, scope
   or effects expand, new evidence is needed, the correction recreates the
   deliverable, or the work order forbids reviewer repair. If authority or
   closeability is contradictory, stop and use the route in the canonical
   closeability standard; do not send an uncloseable packet back to a worker.
5. Record the selected route and evidence in the existing return/completion
   packet. A REWORK packet must carry the current `reviewerLocalRepairBoundary`
   and `reviewerLocalRepairBasis` fields and pass pre-dispatch. Do not create a
   new review round solely to preserve actor labels.
6. Verify only claims made. For closure, follow
   `docs/reference/CVF_TRANCHE_COMMIT_CHOREOGRAPHY_STANDARD_2026-06-03.md`:
   reviewer-owned material commit, dedicated continuity sync, then clean
   split-range pre-closure. Inspect the receipt's `committedEvidence` binding
   directly; `COMPLIANT` alone does not prove that field exists. For checkout
   line-ending questions, use the current committed-evidence contract and
   checker, not a visual diff or an assumed CRLF explanation.
   If `committedEvidence` is missing, stop closure and diagnose the receipt
   locally. Repair or rerun the bounded reviewer-owned evidence step when
   current authority permits. Missing receipt binding alone is not REWORK;
   return to a worker only if a material implementation change or new
   worker-owned evidence is actually required under the governing packet.

## Risk And Authority

This skill grants no path mutation, commit, provider call, host installation,
public sync, or production authority. Reviewer edits and closure are permitted
only by the current work order and canonical CVF role rules. A provider-native
skill may assist with code quality, but cannot override these governance
boundaries. If the source, role, or authority is missing, state the precise
blocker and stop the dependent action.

## Progressive Disclosure And Evidence

The registry/index exposes metadata before the body. Read this body only after
an explicit, authorized selection. Local UAT and reviewer certification are recorded in the NCR-SRA1 UAT review.
Truth and usage receipts plus package-specific dry/live proof are recorded by
the NCR-SRA1 completion. ACTIVE permits explicit receipt-backed selection in
the existing CVF production executor and CLI/MCP envelope. Host delivery and
automatic invocation remain separate work. Behavioral use must not be claimed from
source authorship or a passing syntax check.

## External Disposition

The existing CVF CLI/MCP envelope is implemented for explicit receipt-backed
package selection; no full MCP server or remote host installation is claimed. Local owns private-CVF
verification and technical disposition; an external research return is
advisory input only.

## Source Authority

- `AGENTS.md` and the active startup/role owners.
- `docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md`.
- `docs/reference/CVF_GATE_TO_ROLE_CLOSEABILITY_MACHINE_STANDARD.md`.
- `docs/reference/CVF_TRANCHE_COMMIT_CHOREOGRAPHY_STANDARD_2026-06-03.md`.
- `docs/reference/review_cost_control/CVF_COMMITTED_EVIDENCE_FINGERPRINT_CONTRACT.md`.
- `docs/reviews/CVF_CVF_NCR_R1_S01_SKILL_LIFECYCLE_BODY_COMPLETION_2026-09-27.md`.
- `docs/reviews/CVF_MIXED_EOL_COMMITTED_EVIDENCE_CORRECTION_2026-09-27.md`.

## Claim Boundary

This is a CVF-owned ACTIVE package body for reviewer guidance. It neither
proves agent comprehension nor grants action authority through the ACTIVE runtime. Existing machine gates remain the enforceable boundary for
governed repository packets.
