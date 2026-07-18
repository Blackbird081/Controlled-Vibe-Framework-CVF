# ADIF-0009 - Backtick-Quoted Heading Name Truncates Real Section

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0009
title: Backtick-quoted heading name truncates real section
defectCategory: GATE_TRIGGER_FRICTION
defectClass: PHASE_GATE_PLACEMENT_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Completion review authoring; Closure
roles: dispatcher; reviewer; closer
lifecyclePhases: pre-implementation; pre-closure
surfaceSelectors: prose sentences (Findings tables, risk sections, narrative) in any GC-018, work order, worker return, or completion review that quote a real `##`/`###` heading name in backticks for narrative reference
detectionSignals: a Findings/Risk row reads like "`## <Exact Heading Text>` was missing X" where `<Exact Heading Text>` is also a real heading elsewhere in the same document; several section-scoped checkers locate their target section via a bare `text.find(heading)` and match the FIRST literal occurrence, including one inside backticks in prose, instead of the real heading
enforcementLevel: PARTIAL_CHECK
checkerBindings: governance/compat/check_rescan_intelligence_hardening.py (confirmed root cause: `_extract_section` uses `text.find(heading)`); likely also affects other section-scoped checkers using the same pattern (e.g. corpus-completeness, delta-execution-claim-boundary, epistemic-process) but each has not been individually confirmed
promotionState: MACHINE_CHECK_CANDIDATE
supersedes: NONE
lastVerifiedCommit: 3746bd48
roadmapSeedId: NONE
```

## Core Guard Self-Protection Authorization

The Core Guard Self-Protection Authorization block for the paired
`governance/compat/test_run_adif_defect_resolver.py` count-assertion update
is recorded in `AGENT_HANDOFF_V22_2026-06-22.md`, the active handoff at the
time of this entry's addition. This entry itself does not modify any
protected guard/control file.

## Purpose

Record one observed defect pattern so an agent can recognize it before
writing a Findings-table or Risk-section row that quotes a real section
heading in backticks, which can silently truncate that same section's real
content out of a section-scoped checker's parse window.

## Scope / Applies To

Applies to prose sentences in any GC-018, work order, worker return, or
completion review that reference a real `##`/`###` heading by name inside
backticks. Does not apply to runtime, provider, or public-sync behavior.

## Bad Example

> In a completion review's Findings table: `` `## Rescan Intelligence
> Hardening` was missing the routing lanes and semantic-sampling table ``
> - this row appears earlier in the same document than the real
> `## Rescan Intelligence Hardening` heading. `_extract_section`'s
> `text.find(heading)` matches the backtick-quoted mention first, so the
> checker's parsed "section" is the Findings-table row plus everything
> after it up to the next `##`, not the real section. The real section's
> fields are invisible to the checker and it reports them all as missing,
> even though they are fully populated further down.

## Good Example

> The same row without the literal heading string: "the Rescan Intelligence
> Hardening section was missing the routing lanes and semantic-sampling
> table" - conveys the same finding without a backtick-quoted match for
> `text.find()` to latch onto.

## Canonical Sources

- `governance/compat/check_rescan_intelligence_hardening.py` (`_extract_section`,
  confirmed via direct source read during ASSF-T2 reviewer closure: a bare
  `start = text.find(heading)` with no disambiguation against
  backtick-quoted mentions)
- `docs/reviews/CVF_ASSF_T2_GENERATED_INDEX_AND_PROGRESSIVE_RESOLVER_COMPLETION_2026-06-23.md`
  (the artifact where this defect was found and repaired)

## Remediation

When writing a Findings table, Risk section, or any narrative prose that
needs to refer to a real section heading by name, do not wrap the exact
heading text in backticks. Use a plain-prose reference instead (e.g. "the
Rescan Intelligence Hardening section" rather than `` `## Rescan
Intelligence Hardening` ``). This applies to every heading string that
exactly matches a real `##`/`###` heading elsewhere in the same file, not
only the rescan-intelligence section. Until a dedicated checker patch
disambiguates backtick-quoted mentions from real heading starts (e.g. by
requiring the match to begin at the start of a line), authors must avoid
the literal pattern by hand.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | ASSF-T2 completion review repair, 2026-06-23 |
| Working directory | repository root |
| Command or tool surface | direct source read of `check_rescan_intelligence_hardening.py`; manual Python reproduction of `_extract_section`'s `text.find` behavior against the affected document |
| Target paths | this entry file |
| Allowed scope source | `docs/reference/CVF_AGENT_ERROR_TO_GOVERNANCE_LEARNING_PHILOSOPHY_2026-05-28.md`: repeated/observed agent mistakes must be promoted into a written rule |
| Before status evidence | defect pattern existed only in Claude provider memory (B28), not in any CVF-governed artifact |
| After status evidence | entry created under the ADIF defect registry, discoverable by `run_adif_defect_resolver.py` and any agent reading this folder |
| Diff evidence | new-file creation in this commit |
| Approval boundary | ADIF entry registry addition only; no checker code change |
| Claim boundary | records an observed defect pattern and its confirmed root cause in one checker; does not implement a fix or claim the pattern is fully machine-checked everywhere it could occur |
| Agent type | reviewer/closer |
| Invocation ID | `cvf-adif-0009-entry-2026-06-23` |
| Expected manifest | this entry, plus a README table row |
| Actual changed set | this entry, plus a README table row |
| Manifest delta | MATCH |

## Claim Boundary

This entry records an observed defect pattern and its confirmed root cause
in `check_rescan_intelligence_hardening.py`. It does not implement,
modify, or extend that checker, and it does not claim the same root cause
has been independently confirmed in any other section-scoped checker named
under `checkerBindings`.
