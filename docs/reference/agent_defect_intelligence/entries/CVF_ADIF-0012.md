# ADIF-0012 - Worker Return Missing dispatchWorkOrder Header Field

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0012
title: Worker return missing dispatchWorkOrder header field
defectCategory: CLOSURE_EVIDENCE
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: general worker authoring pattern
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Worker return authoring; Closure
roles: worker
lifecyclePhases: pre-closure; pre-push
surfaceSelectors: docs/reviews/*_WORKER_RETURN_*.md
detectionSignals: pre-commit hook "agent packet authority and encoding" reports "pending worker return lacks dispatchWorkOrder path"; the worker return header contains Status: COMPLETE_PENDING_REVIEW and a ## Work Order Reference section but no top-level dispatchWorkOrder: field
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_agent_packet_authority_and_encoding.py
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: 489ff38a
roadmapSeedId: NONE
```

## Purpose

Record that a worker return with `Status: COMPLETE_PENDING_REVIEW` must
include a `dispatchWorkOrder:` field in its document header (alongside
`Status:`, `Date:`, `docType:`, etc.), containing the backtick-quoted path to
the dispatching work order. Without this field, the
`check_agent_packet_authority_and_encoding.py` checker reports the artifact as
a pending worker return lacking a verifiable dispatch link.

The trigger relationship is non-obvious: the checker activates for any file
matching `CVF_.+_WORKER_RETURN_.*.md` with `Status: COMPLETE_PENDING_REVIEW`,
and then looks for `dispatchWorkOrder:` in the document body. A `## Work Order
Reference` section with the path in prose does NOT satisfy this check -- the
field must be in the header metadata block.

## Scope / Applies To

Applies to all files matching the pattern
`CVF_.+_WORKER_RETURN_<date>.md` that carry
`Status: COMPLETE_PENDING_REVIEW`. Does not apply to completion reviews,
baselines, or audits.

## Bad Example

```markdown
Status: COMPLETE_PENDING_REVIEW

Date: 2026-06-25

docType: worker_return

## Work Order Reference

Work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md`
```

The `## Work Order Reference` section is present but the checker requires
the `dispatchWorkOrder:` key at the header level.

## Good Example

```markdown
Status: COMPLETE_PENDING_REVIEW

Date: 2026-06-25

docType: worker_return

dispatchWorkOrder: `docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md`

## Work Order Reference

Work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md`
```

Both the header field and the prose section may coexist; the checker only
requires the header field.

## Canonical Sources

- `governance/compat/check_agent_packet_authority_and_encoding.py`:
  `DISPATCH_WORK_ORDER_RE` and `_validate_pending_worker_return` (confirmed
  by source read and violation output during ASSF-T6 gate repair, 2026-06-25)

## Remediation

When authoring a worker return, add `dispatchWorkOrder:` as a top-level
header metadata field immediately after `docType:`, with the value being the
backtick-quoted relative path to the dispatching work order. The value must
be readable from the repository root -- the checker calls `_read_rel` on the
path and will report a secondary violation if the file cannot be found.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude worker/reviewer |
| Provider or surface | local workspace |
| Session or invocation | ASSF-T6 gate repair, 2026-06-25 |
| Working directory | repository root |
| Command or tool surface | pre-commit hook output analysis; read_file on check_agent_packet_authority_and_encoding.py |
| Target paths | this entry file |
| Allowed scope source | AGENTS.md: new repeated defect patterns must be added to ADIF registry before tranche close |
| Before status evidence | pattern existed only in session memory, not in any CVF-governed artifact |
| After status evidence | entry created under ADIF defect registry, discoverable by run_adif_defect_resolver.py |
| Diff evidence | new-file creation in this commit |
| Approval boundary | ADIF entry addition only; no checker code change |
| Claim boundary | records observed defect pattern; does not modify the checker |
| Agent type | worker/reviewer |
| Invocation ID | cvf-adif-0012-entry-2026-06-25 |
| Expected manifest | this entry, plus README table row |
| Actual changed set | this entry, plus README table row |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry. No public-sync claim.

## Claim Boundary

This entry records one observed defect pattern and its confirmed checker
binding. It does not modify `check_agent_packet_authority_and_encoding.py`
or any other governance automation.
