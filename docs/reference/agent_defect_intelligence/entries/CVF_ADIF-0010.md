# ADIF-0010 - EKI Routing Table Uses Free-Form Input Type Instead Of Canonical Enum

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0010
title: EKI routing table uses free-form Input type instead of canonical enum
defectCategory: GATE_TRIGGER_FRICTION
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: general worker/reviewer authoring pattern, not a single finding row
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Worker return authoring; Completion review authoring; Audit authoring; Closure
roles: worker; reviewer
lifecyclePhases: pre-implementation; pre-closure
surfaceSelectors: docs/reviews/*_WORKER_RETURN_*.md; docs/reviews/*_COMPLETION_*.md; docs/audits/*.md -- any governed artifact that contains ## External Knowledge Intake Routing
detectionSignals: check_external_knowledge_intake_routing.py reports "`Input type` must be one of the canonical chain-map input types"; the authored `Input type` row contains a descriptive phrase like "Internal source evidence from CVF Web repository files" instead of an exact enum token
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_external_knowledge_intake_routing.py
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: 489ff38a
roadmapSeedId: NONE
```

## Purpose

Record that the `## External Knowledge Intake Routing` table's `Input type`
row must contain an exact value from the `ALLOWED_INPUT_TYPES` set defined in
`check_external_knowledge_intake_routing.py`, not a free-form description.
Agents routinely write descriptive prose for this field because the canonical
values are not visible in any template or standard document -- only in the
checker source.

## Scope / Applies To

Applies to every governed artifact containing `## External Knowledge Intake
Routing`: worker returns, completion reviews, audits, and baselines. Does not
apply to runtime, provider, or session surfaces.

## Bad Example

```
| Input type | Internal source evidence from CVF Web repository files |
```

This value is not in `ALLOWED_INPUT_TYPES` and the checker rejects it.

## Good Example

```
| Input type | legacy source family |
```

Full canonical enum (as of lastVerifiedCommit):
- `legacy source family`
- `external repo or copied folder`
- `external-agent packet request`
- `external-agent returned output`
- `public/simple cvf vocabulary`
- `corpus scan or extraction intake`
- `runtime/provider/mcp/readiness claim`
- `operator-provided external comparison, critique, or recommendation`
- `external knowledge intake routing guard implementation`

For tranches that consume only internal CVF repository files, `legacy source
family` is the correct value.

## Canonical Sources

- `governance/compat/check_external_knowledge_intake_routing.py`:
  `ALLOWED_INPUT_TYPES` set (confirmed by direct source read during ASSF-T6
  gate repair, 2026-06-25)

## Remediation

Before authoring the `## External Knowledge Intake Routing` section, read
`ALLOWED_INPUT_TYPES` in `check_external_knowledge_intake_routing.py` and
select the closest matching canonical value. For documentation/audit tranches
that read CVF-owned repository files as internal sources, use
`legacy source family`. Do not write descriptive prose -- the checker does an
exact-match lookup against the enum set.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude worker/reviewer |
| Provider or surface | local workspace |
| Session or invocation | ASSF-T6 gate repair, 2026-06-25 |
| Working directory | repository root |
| Command or tool surface | read_file on check_external_knowledge_intake_routing.py; gate output analysis |
| Target paths | this entry file |
| Allowed scope source | AGENTS.md: new repeated defect patterns must be added to ADIF registry before tranche close |
| Before status evidence | pattern existed only in session memory, not in any CVF-governed artifact |
| After status evidence | entry created under ADIF defect registry, discoverable by run_adif_defect_resolver.py |
| Diff evidence | new-file creation in this commit |
| Approval boundary | ADIF entry addition only; no checker code change |
| Claim boundary | records observed defect pattern; does not modify the checker |
| Agent type | worker/reviewer |
| Invocation ID | cvf-adif-0010-entry-2026-06-25 |
| Expected manifest | this entry, plus README table row |
| Actual changed set | this entry, plus README table row |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry. No public-sync claim.

## Claim Boundary

This entry records one observed defect pattern and its confirmed checker
binding. It does not modify `check_external_knowledge_intake_routing.py`
or any other governance automation.
