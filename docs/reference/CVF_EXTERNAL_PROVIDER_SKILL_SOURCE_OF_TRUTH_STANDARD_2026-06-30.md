# CVF External Provider Skill Source Of Truth Standard

Memory class: FULL_RECORD

Status: ACTIVE

Date: 2026-06-30

docType: reference_standard

## Purpose

Define the CVF source-of-truth rule for provider-owned external skill surfaces.
CVF does not control provider runtime internals. CVF controls what a governed
artifact may claim, consume, promote, and preserve as trace evidence.

## Scope

This standard covers provider-owned skill surfaces outside CVF runtime
authority, including Codex skills, Claude skills, Gemini skills, plugin skills,
connector skills, and provider-side instruction bundles.

It applies when a governed CVF artifact claims that an agent consumed output
from one of those surfaces for a CVF decision, source fact, work order,
completion review, roadmap, baseline, handoff, or reference standard.

## Required External Provider Skill Usage Trace

Any governed artifact that must record such consumption must include this
heading and field table:

```text
## External Provider Skill Usage Trace

| Field | Value |
|---|---|
| Usage disposition | USED_WITH_TRACE or NOT_USED_WITH_REASON |
| Provider skill name | concrete provider skill name or N/A with reason |
| Provider owner | concrete provider owner or N/A with reason |
| Invocation context | concrete invocation context or N/A with reason |
| Output consumed by CVF | concrete consumed output or N/A with reason |
| CVF source-of-truth promotion path | governed promotion path or N/A with reason |
| Evidence artifact | governed evidence artifact or N/A with reason |
| Authority boundary | provider output is not CVF canonical authority |
```

Allowed `Usage disposition` tokens:

- `USED_WITH_TRACE`
- `NOT_USED_WITH_REASON`

If consumption occurred, `USED_WITH_TRACE` is required and every other field
must be concrete. The `Authority boundary` value must include this exact phrase:
`not CVF canonical authority`.

## Taxonomy

| Term | CVF meaning |
|---|---|
| `EXTERNAL_PROVIDER_SKILL` | Provider-owned skill, plugin, connector, instruction bundle, or tool-routing surface outside CVF runtime authority. |
| `CVF_ASSF_METADATA` | CVF metadata-only skill record admitted through ASSF governance. |
| `CVF_ASSF_PACKAGE_ROOT` | CVF package-root source layout accepted as package anatomy, not automatically active. |
| `CVF_RUNTIME_PACKAGE` | CVF runtime-loadable package root admitted through governed runtime package criteria. |
| `CVF_ACTIVE_PACKAGE` | Future active resolver or adapter admission; not created by this standard. |
| `CVF_WEB_PROJECTION` | UI/read-model projection of governed state, not source authority by itself. |

## Invariants

- Provider skill output is not CVF canonical authority.
- Provider-owned runtime is not a CVF source of truth.
- Any consumed output must route through Source Verification, External
  Knowledge Intake, or another governed artifact before promotion.
- Raw secrets, raw API keys, hidden provider trace, and provider-private logs
  must not be copied into CVF artifacts.
- CVF may record invocation context, owner, consumed output summary, evidence
  artifact, and promotion path without claiming provider runtime control.

## Checker Binding

Machine guard:

`governance/compat/check_external_provider_skill_usage_trace.py`

The guard is forward-only over changed governed Markdown. It checks explicit
current or past consumption claims, then requires the trace table above.

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a reference control standard with a
machine checker binding, not an evidence-heavy outcome comparison packet.

## Claim Boundary

This standard does not implement provider runtime interception, provider-side
audit collection, CLI/MCP adapters, active package activation, runtime package
promotion, live proof, public sync, or web UI. Those require separate GC-018
authority, source verification, implementation, and proof.

## External Provider Skill Usage Trace

| Field | Value |
|---|---|
| Usage disposition | NOT_USED_WITH_REASON |
| Provider skill name | N/A with reason: no provider-owned skill surface was consumed to author this standard |
| Provider owner | N/A with reason: no provider-owned skill surface was consumed to author this standard |
| Invocation context | N/A with reason: local repository standard authoring only |
| Output consumed by CVF | N/A with reason: no provider-owned skill output was consumed |
| CVF source-of-truth promotion path | N/A with reason: this standard is the governed source |
| Evidence artifact | `docs/reference/CVF_EXTERNAL_PROVIDER_SKILL_SOURCE_OF_TRUTH_STANDARD_2026-06-30.md` |
| Authority boundary | no provider output; provider output would be not CVF canonical authority |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | local workspace |
| Session or invocation | EPSOT-T1 standard authoring, 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | apply_patch, local governance checker design, tests |
| Target paths | `docs/reference/CVF_EXTERNAL_PROVIDER_SKILL_SOURCE_OF_TRUTH_STANDARD_2026-06-30.md` |
| Allowed scope source | operator request for provider skill source-of-truth trace |
| Before status evidence | base `09a753ea` |
| After status evidence | standard added in working tree |
| Diff evidence | `git diff --name-status` before closure |
| Approval boundary | source-of-truth trace standard only |
| Claim boundary | no provider runtime, adapter, live, public, activation, or package-promotion claim |
| Agent type | Codex |
| Invocation ID | `epsot-t1-provider-skill-sot-standard-2026-06-30` |
| Expected manifest | `docs/reference/CVF_EXTERNAL_PROVIDER_SKILL_SOURCE_OF_TRUTH_STANDARD_2026-06-30.md` |
| Actual changed set | `docs/reference/CVF_EXTERNAL_PROVIDER_SKILL_SOURCE_OF_TRUTH_STANDARD_2026-06-30.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private governance standard; no public-sync authorization in this
tranche.
