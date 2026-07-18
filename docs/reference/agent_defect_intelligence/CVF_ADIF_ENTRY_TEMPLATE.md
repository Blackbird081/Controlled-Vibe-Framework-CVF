# CVF ADIF Entry Template

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference_standard

Date: 2026-06-23

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This file
defines a machine-readable field template; it does not itself enumerate,
map, or project CVF state.

Batch ID: ADIF-T1

EPISTEMIC_PROCESS_NA_WITH_REASON: field-template reference; it defines a
fixed schema, not an evidence-comparison or hypothesis-testing artifact.

## Purpose

Fix one entry shape that every ADIF entry under
`docs/reference/agent_defect_intelligence/entries/` must follow. The field
list and ownership rules come from
`docs/reference/agent_defect_intelligence/CVF_ADIF_T0_OWNER_RECONCILIATION_TAXONOMY_CONTRACT.md`.
This template does not redefine any canonical-reuse field's meaning.

## Scope / Applies To

Applies to every file created under
`docs/reference/agent_defect_intelligence/entries/`. Does not apply to the
ADIF-T0 owner-reconciliation contract, the ADIF front door, or any future
resolver/checker/generator implementation.

## Required Fields

Every entry file must declare exactly these fields, in this order, as a
fenced block at the top of the file followed by prose sections:

```text
defectId: <stable identifier, format ADIF-NNNN>
title: <short human label>
defectCategory: <one ADIF-owned category from the twelve named in the
  ADIF-T0 contract, or a later ADIF-T1-merged value>
defectClass: <canonical F2G value, cited not redefined>
defectRole: <canonical FPRC value when a root-cause role applies, or
  NOT_APPLICABLE_WITH_REASON>
severity: <bounded triage level - this template fixes the enum as
  LOW | MEDIUM | HIGH, ordered ascending by impact>
lifecycleState: <PROPOSED | ACTIVE | SUPERSEDED | RETIRED | REJECTED>
taskClasses: <one or more values drawn from Guard Orientation's Task Class
  Guard Map; never an ADIF-invented task class>
roles: <one or more of operator | dispatcher | worker | reviewer | closer |
  session-sync steward, per Guard Orientation's Role Glossary>
lifecyclePhases: <one or more autorun phase names, e.g. pre-dispatch,
  pre-implementation, pre-closure, pre-push>
surfaceSelectors: <bounded path family or artifact/symbol class; never an
  unrestricted glob>
detectionSignals: <narrow observable signs; never secret or
  provider-memory content>
enforcementLevel: <GUIDANCE_ONLY | PARTIAL_CHECK | MACHINE_CHECKED |
  RETIRED>
checkerBindings: <exact governance/compat path(s) if MACHINE_CHECKED or
  PARTIAL_CHECK, else NOT_APPLICABLE_WITH_REASON>
promotionState: <relationship to the F2G escalation ladder, e.g.
  RULE_EXISTS | MACHINE_CHECK_ADDED | DESIGN_REVIEW_REQUIRED>
supersedes: <prior defectId or NONE>
lastVerifiedCommit: <short commit hash this entry's evidence was last
  checked against>
roadmapSeedId: <originating ADIF-SEED-NNN placeholder ID, or NONE for
  entries created after T1>
```

Followed by:

- `badExample`: short synthetic anti-pattern (prose section);
- `goodExample`: short corrected pattern (prose section);
- `canonicalSources`: bulleted list of governed authority paths and
  sections this entry cites;
- `remediation`: bounded corrective action (prose section);
- `Agent Operation Trace Block`: exact trace table defined below;
- `Public Export Disposition`: one allowed export disposition;
- `Claim Boundary`: bounded entry claim.

## Required Agent Operation Trace Block

Every ADIF entry must include a complete `## Agent Operation Trace Block`.
This requirement is checked by
`governance/compat/check_adif_entry_integrity.py`; do not rely on the
general trace checker to infer whether an entry is in scope. Copy these labels
exactly:

```markdown
## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | <role and provider/surface, role-neutral when possible> |
| Provider or surface | <local workspace, external packet, or other surface> |
| Session or invocation | <bounded session or invocation label> |
| Working directory | repository root |
| Command or tool surface | <commands, tool names, or manual source reads used> |
| Target paths | <entry file and any registry row changed> |
| Allowed scope source | <operator instruction, standard, or work order authority> |
| Before status evidence | <where the pattern existed before this entry> |
| After status evidence | <entry discoverability or resolver/checker state after change> |
| Diff evidence | <git diff, new-file creation, or committed range evidence> |
| Approval boundary | <what this entry may change or not change> |
| Claim boundary | <defect-record only; no runtime or checker claim unless true> |
| Agent type | <dispatcher, worker, reviewer, closer, or session-sync steward> |
| Invocation ID | <stable short invocation id> |
| Expected manifest | <entry path and any README/index row> |
| Actual changed set | <actual changed path list for this entry batch> |
| Manifest delta | MATCH or explicit mismatch with reason |
```

If the entry is authored in the same conversation as a session-sync action,
split commits: first commit the ADIF material entry or entry group, then let
the session-sync steward commit active handoff/session surfaces separately.
Do not mix `docs/reference/agent_defect_intelligence/entries/` changes with
`AGENT_HANDOFF_*.md`, `CVF_SESSION_MEMORY.md`, or `CVF_SESSION/` changes in
one material commit unless a specific session-sync standard explicitly
authorizes that shape.

## Severity Enum

This template fixes `severity` as `LOW | MEDIUM | HIGH`, ordered ascending
by impact. This is distinct from FPRC's `blockingLevel` (which describes one
finding row in a root-cause table, not a general defect pattern) and from
`enforcementLevel` (which describes whether a machine check currently exists,
not how bad the pattern is when it occurs).

## Enforcement Level Verification Rule

An entry may declare `enforcementLevel: MACHINE_CHECKED` or
`PARTIAL_CHECK` only if its `checkerBindings` field names a
`governance/compat/*.py` path that exists in the repository at the time the
entry is authored or last re-verified. If the cited path cannot be confirmed,
the entry must fall back to `PARTIAL_CHECK` or `GUIDANCE_ONLY` per the
ADIF-T0 contract's Guidance Versus Enforcement Distinction.

## Dual Agent Surface Matrix

This package-level matrix applies to every compact entry that conforms to this
template. Individual entries record defect evidence; they do not independently
create an agent interface.

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | direct governed file read of this template and `entries/` | read-only guidance; no execution, mutation, comprehension, or prevention claim | this template and committed entry files | local file read only; no adapter behavior | `IMPLEMENTED` |
| `EXTERNAL_AGENT_CLI_MCP` | future ADIF resolver/adapter owner | no CLI/MCP ingress, authentication, approval, receipt, raw-data release, mutation, runtime, or public behavior exists in T1 | T1 claim boundary and Dual Agent Surface Accounting Standard | deferred adapter; separately authorize and source-verify any external adapter after the local resolver contract exists | `DEFERRED_WITH_REASON` |

Adapter boundary: this template is readable by external agents only as a
governed repository file or resolver result. It does not create CLI/MCP
ingress, an adapter contract, external authentication, receipts, mutation
rights, runtime behavior, public export, or automatic prevention.

## Lifecycle And Retirement

An entry is never deleted once committed. Retirement or supersession is a
state transition recorded in `lifecycleState` and `supersedes`, per the
ADIF-T0 contract's Entry Lifecycle section. A future resolver (ADIF-T2) must
exclude `RETIRED` and `SUPERSEDED` entries from default results without
making them unreadable.

## Claim Boundary

This template fixes entry shape only. It does not implement a resolver,
generator, checker, or hook. Declaring `enforcementLevel: MACHINE_CHECKED`
in an entry is a claim about an existing checker, not a guarantee that the
checker is wired into any particular autorun phase.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference template. No public-sync repository
work or public catalog claim is authorized.
