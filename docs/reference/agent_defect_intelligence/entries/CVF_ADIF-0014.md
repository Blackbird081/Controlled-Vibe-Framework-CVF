# ADIF-0014 - Scope-Triggered Absorption Control Evaded By Completeness Silence

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0014
title: Scope-triggered absorption control evaded by completeness silence
defectCategory: SOURCE_FIDELITY
defectClass: MACHINE_GATE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (WORKER_MUST_NOT_COMMIT); Knowledge absorption
roles: dispatcher; worker; reviewer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: work orders, GC-018 baselines, and completion reviews whose changed set touches .private_reference/legacy/ or .private_reference/external_repos/ absorption sources
detectionSignals: an absorption artifact touches a legacy/external source path but omits the `## Mandatory Blind-Spot Control Block` heading and a `## Corpus Completeness And Report Integrity` block, and never states a completeness claim, so claim-triggered checkers stay silent
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_absorption_blindspot_control_presence.py
promotionState: PROMOTED
supersedes: NONE
lastVerifiedCommit: a9c79eb8
roadmapSeedId: NONE
```

## Purpose

Record one observed defect pattern so an agent recognizes it before authoring
a GC-018, work order, or completion review for a lane that absorbs knowledge
from a legacy or external source folder.

The pattern: CVF's two strongest absorption-integrity controls
(Mandatory Knowledge Absorption Blind-Spot Control and Mandatory Corpus
Completeness And Report Integrity) are both **claim-triggered** - their
machine checks fire only when an artifact *asserts* completeness ("all files
read", "complete scan") or *includes* the required section heading. An agent
that simply stays silent about completeness, and never adds the Blind-Spot
Control Block, can close an absorption lane with a valid `PASS` while having
read only a thin slice of the source corpus. The control was never refused; it
was never invoked.

This is the inverse of [ADIF-0001](CVF_ADIF-0001.md): 0001 catches an agent
who *over-claims* exhaustive coverage; 0014 catches an agent who *under-claims*
to avoid the gate entirely.

## Scope / Applies To

Applies to work orders, GC-018 baselines, and completion reviews whose changed
set touches `.private_reference/legacy/` or `.private_reference/external_repos/`
absorption sources. Does not apply to runtime, provider, or public-sync
behavior.

## Bad Example

> An AGSG absorption lane sources `.private_reference/legacy/CVF 28.06/CVF_Agent_Skills_Governance_Absorption_Pack`
> (12 absorption docs + 3 Python guards + a SKILL_GOVERNANCE_ENGINE extension)
> and the upstream `addyosmani/agent-skills` clone (23 `SKILL.md` files,
> ~6,800 lines). The lane closes `PASS` with a 155-line advisory that promotes
> only the meta-anatomy. No Blind-Spot Control Block, no corpus manifest of the
> 23 skills or the 3 pre-built guards, and no completeness claim - so no gate
> fires. The unmapped skill content and pre-built checkers are discovered only
> when the operator manually inspects the source pack.

## Good Example

> The absorption GC-018 includes `## Mandatory Blind-Spot Control Block` with
> all seven gates and a verdict, plus a corpus manifest enumerating every
> source file in scope (`rg --files --hidden --no-ignore` over the pack and the
> upstream clone) with a mapped/deferred/unmapped reconciliation. Skills and
> checkers left for a later tranche are listed as `DEFERRED` with a reopen
> condition, not silently omitted.

## Canonical Sources

- `docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-06-01.md`
  (`## Mandatory Blind-Spot Control Block`)
- `docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md`
- `docs/reference/CVF_AGENT_ERROR_TO_GOVERNANCE_LEARNING_PHILOSOPHY_2026-05-28.md`
  (rule-to-machine-check-to-earliest-gate escalation)
- `docs/baselines/CVF_GC018_AGSG_T1_SOURCE_VERIFIED_ASSF_RECONCILIATION_2026-06-28.md`
  (observed instance: absorption baseline with neither control block present)

## Remediation

When a lane's changed set touches a legacy or external absorption source,
require the artifact to carry the Blind-Spot Control Block and a corpus
manifest unconditionally - driven by the source path in scope, not by whether
the artifact happens to claim completeness. Promote this from rule to a
scope-triggered machine check at the earliest applicable autorun phase
(pre-dispatch / pre-implementation), so the control cannot be evaded by
silence.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude dispatch-author orchestrator |
| Provider or surface | local workspace |
| Session or invocation | AGSG blind-spot hardening dispatch authoring, 2026-06-28 |
| Working directory | repository root |
| Command or tool surface | governed source reads, grep over AGSG artifacts, file write tool |
| Target paths | this entry file; ADIF entries README/index if present |
| Allowed scope source | operator instruction 2026-06-28 to patch the recurring absorption blind-spot and record the defect |
| Before status evidence | AGSG-T1 baseline and paired artifacts carry neither a Blind-Spot Control Block nor a Corpus Completeness block; both claim-triggered checkers stayed silent |
| After status evidence | defect pattern discoverable in the ADIF registry; resolver can surface it at pre-dispatch and pre-implementation |
| Diff evidence | new-file creation in the AGSG blind-spot hardening dispatch batch |
| Approval boundary | records an observed defect pattern only; does not implement the planned scope-triggered checker |
| Claim boundary | defect-record only; no runtime or checker implementation claim |
| Agent type | dispatcher |
| Invocation ID | `agsg-blindspot-hardening-adif-2026-06-28` |
| Expected manifest | this entry, plus an index row if the entries README enumerates entries |
| Actual changed set | this entry |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry. No public-sync claim.

## Claim Boundary

This entry records an observed defect pattern. The scope-triggered presence
checker is implemented at
`governance/compat/check_absorption_blindspot_control_presence.py` and wired
into the governance hook chain. The `enforcementLevel` is `MACHINE_CHECKED`
and `checkerBindings` reference the implemented checker.

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: this defect entry records a pattern observation, not an evidence comparison or hypothesis evaluation.
