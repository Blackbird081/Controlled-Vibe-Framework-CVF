# CVF External Absorption Core Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-29

## Purpose

Define the invariant core for any CVF work that absorbs an external repository,
copied folder, archived external pack, or retained legacy source folder.

Different repositories may contain different value. The core process is not
different: every external absorption output must prove what corpus existed,
what was read, what value was dispositioned, where accepted value maps in CVF,
what remains unresolved, and which valuable source concepts should become
CVF-owned doctrine, package, runtime, or checker candidates.

## Scope / Applies To

This standard applies to governed roadmaps, baselines, work orders, reviews,
audits, and external-agent reference artifacts that absorb, audit, reabsorb,
reopen, classify, or close value from an external repository, copied folder,
archived external pack, or retained legacy source folder.

It does not apply to internal-only CVF maintenance that does not consume an
external source set. It also does not apply to guard-maintenance completion
reviews that implement this checker without claiming any external corpus
absorption.

## Central Core

External absorption is not complete because an agent says it inspected the
source. It is complete only within a bounded corpus after the artifact records:

- a filesystem-backed or source-backed manifest;
- a file-level processing ledger;
- an absorption disposition ledger;
- an owner-surface map for accepted value;
- unresolved, deferred, rejected, and blocked items;
- a value-conversion matrix that explicitly evaluates package, runtime, and
  checker opportunities instead of stopping at pattern adaptation;
- a claim boundary that prevents runtime, provider, public, or production
  expansion without fresh governed work.

This standard extends the external knowledge chain map. It does not make
external material canonical, authorize implementation, execute providers,
install plugins, mutate runtime, publish public artifacts, or prove semantic
quality by itself.

## Source Mirror Discipline

High-value external repository absorption should use the original upstream
repository as the source authority when it is available. A derived
external-agent pack, summary, or absorption folder is secondary evidence, not a
replacement for the upstream source.

Private local source mirrors are managed under:

`.private_reference/source_mirrors/`

The mirror control-plane files are:

- `.private_reference/source_mirrors/README.md`
- `.private_reference/source_mirrors/INDEX.md`
- `.private_reference/source_mirrors/.gitignore`

The cloned repository payloads under that folder are local reference material
and must remain ignored by git. Track only the control-plane files above.

Forward enforcement:

`governance/compat/check_source_mirror_migration.py`

Any changed governed absorption artifact that still cites
`.private_reference/external_repos/` must include a
`## Source Mirror Migration Control` table with the legacy path, source mirror
path, mirror index row, pinned upstream commit, migration disposition, legacy
cleanup disposition, and claim boundary. Allowed migration dispositions are
`MIGRATED_TO_SOURCE_MIRROR`, `LEGACY_REFERENCE_ONLY_WITH_REASON`, and
`BLOCKED_SOURCE_MIRROR_WITH_REASON`.

Before closing a high-value external-repo absorption, the reviewer must check
whether a pinned upstream source mirror exists or should be created. If a
derived external-agent pack is the only local source and the upstream repo is
available, the closeout must not claim full upstream absorption unless it
either creates or requests a pinned source mirror, or records
`BLOCKED_SOURCE_MIRROR_WITH_REASON`.

If both a source mirror and an external-agent pack exist, source-verification
for upstream facts must prefer the pinned source mirror. The external-agent
pack may still be used as comparison material, gap-finding input, or a
secondary interpretation artifact.

Clone presence is not absorption evidence by itself. Absorption still requires
the manifest, processing ledger, value-conversion matrix, owner-surface map,
conditional reopen handling, and reviewer semantic value audit defined below.

## Required Artifact Block

Any governed artifact that absorbs, audits, reabsorbs, reopens, classifies, or
closes value from an external repo or copied folder must include this block:

```text
## External Absorption Core

| Field | Value |
|---|---|
| Standard | docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md |
| Input root or repository | <repo URL, commit, local root, or bounded file list> |
| Enumeration command | <filesystem-backed command or structured source listing> |
| Manifest artifact or inline manifest | <path or inline table> |
| Processing ledger artifact or inline ledger | <path or inline table with file-level rows> |
| Ledger terminal statuses | READ, ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB, ADAPT, DEFER, REJECT, BLOCK, NO_NEW_VALUE |
| Owner-surface map | <CVF owner reference, roadmap, work order, source path, or BLOCKED_SOURCE_NOT_FOUND> |
| Unresolved items | <0 or explicit list> |
| Completion claim boundary | <bounded claim; no runtime/provider/public/production expansion> |
```

When a high-value upstream repo has a local source mirror, the `Input root or
repository` row must include the upstream URL, pinned commit, and local mirror
path. When the mirror is missing but needed, record
`BLOCKED_SOURCE_MIRROR_WITH_REASON` instead of promoting a derived pack to
upstream authority.

Do not use placeholder text in the block. Do not use
`NOT_APPLICABLE_WITH_REASON` for the paired `Corpus Completeness And Report Integrity` block when the artifact is actually absorbing an external repo or copied folder.

## Required Ledger Semantics

The processing ledger proves that each manifest item reached a terminal
processing status. The disposition ledger proves what CVF did with the value.

Allowed processing statuses:

| Status | Meaning |
|---|---|
| `READ` | The file was opened or parsed and considered. |
| `ADAPTED` | Value was rewritten into CVF language or owner surfaces. |
| `DEFERRED` | Value is real but intentionally parked with a reopen condition. |
| `REJECTED` | Direct adoption is rejected with a reason. |
| `NO_NEW_VALUE` | File was read but adds no new value beyond existing owner surfaces. |
| `BLOCKED_UNREADABLE` | File could not be processed and must stay visible. |

Allowed disposition outcomes:

| Disposition | Meaning |
|---|---|
| `ABSORB` | Promote directly into a CVF-owned artifact in this tranche. |
| `ADAPT` | Rewrite the concept into CVF terms or an existing owner surface. |
| `DEFER` | Park for a future governed tranche with a concrete reopen condition. |
| `REJECT` | Reject direct use and keep only as contrast or evidence. |
| `BLOCK` | Stop or return because source authority or access is missing. |
| `NO_NEW_VALUE` | No meaningful delta after reading the source. |

## Required Value Conversion Matrix

Every external absorption artifact must include this additional section:

```text
## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| <source row or group> | <specific value> | <lane token> | <CVF owner or pending owner> | <action or explicit none-with-reason> | <boundary statement> |
```

Allowed conversion lanes:

| Lane | Meaning |
|---|---|
| `DOCTRINE_ADAPTED` | Value was rewritten into CVF doctrine, standards, reviews, roadmaps, or advisory references. |
| `PACKAGE_CANDIDATE` | Value could become a CVF-owned skill, capability package, template package, or reusable package contract after fresh governed authorization. |
| `RUNTIME_CANDIDATE` | Value could become executable runtime behavior only after fresh GC-018/work order/source verification and live/provider proof when behavior is claimed. |
| `CHECKER_CANDIDATE` | Value could become a CVF-native machine guard or checker after source-verified guard work. |
| `REJECT_DIRECT_IMPORT` | Direct import/copy/wiring is rejected, while a CVF-native rewrite may still be considered through a separate governed tranche. |
| `NO_PACKAGE_OR_RUNTIME_VALUE` | The row was evaluated and has no package, runtime, or checker value; the reason must be explicit. |

This matrix is mandatory even when the processing ledger already has
`ADAPTED`, `DEFERRED`, `REJECTED`, or `NO_NEW_VALUE` rows. `ADAPTED` alone is
not a sufficient absorption claim. A reviewer must ask whether the value should
enrich CVF doctrine only, become a CVF-owned package or skill candidate, become
a runtime candidate, become a checker candidate, be rejected for direct import,
or be explicitly closed as having no package/runtime/checker value.

Package, runtime, and checker candidates are opportunity classifications only.
They do not activate packages, install plugins, wire hooks, mutate runtime,
authorize provider execution, or create production claims. Those actions still
require the normal CVF authorization chain.

## Overlap And Novelty Classification Rule

External repositories often repeat value already present in CVF, in prior
absorbed repos, or in existing package/runtime/checker candidates. Before an
agent opens a new owner surface, package lane, runtime lane, checker lane, or
roadmap item, it must compare the incoming source value against existing CVF
owner surfaces and record whether the source confirms, enriches, adds, rejects,
or closes value.

Any external absorption artifact must include this additional section:

```text
## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| <source row or group> | <existing CVF path or OWNER_SURFACE_NOT_FOUND> | <disposition token> | <specific delta or no-new-value reason> | <adapt, enrich, park, reject, or close action> |
```

Allowed overlap dispositions:

| Disposition | Meaning |
|---|---|
| `CONFIRMED_EXISTING` | Source confirms existing CVF doctrine or candidate value without changing the owner surface. |
| `ENRICH_EXISTING` | Source adds a concrete delta to an existing owner surface, candidate, or reopen condition. |
| `NEW_FINDING` | Source provides value with no current owner surface; it must be mapped, parked, or blocked explicitly. |
| `REJECT_DIRECT_IMPORT` | Source implementation or artifact is rejected for direct use even if CVF-native value may remain. |
| `NO_NEW_VALUE` | Source was compared against an existing owner surface and adds no meaningful delta. |
| `OWNER_SURFACE_NOT_FOUND` | No existing owner surface was found; the artifact must name the next owner decision or blocker. |

This section is a pre-write warning and a machine-checkable overlap ledger. It
prevents two failure modes: silently missing valuable deltas because a row was
marked `NO_NEW_VALUE` too quickly, and duplicating CVF capability surfaces when
an existing doctrine/package/runtime/checker owner should be enriched instead.

Forward enforcement:

`governance/compat/check_external_absorption_overlap_discipline.py`

## Conditional Reopen Index Rule

Candidate lanes are not allowed to disappear into closeout prose. Any external
absorption closeout that records `PACKAGE_CANDIDATE`, `RUNTIME_CANDIDATE`,
`CHECKER_CANDIDATE`, `DEFERRED`, `DEFER_WITH_REOPEN_CONDITION`,
`DEFERRED_WITH_REOPEN_CONDITION`, or `VALUE_PARKED` must do one of these before
closure:

- add or update the matching row in
  `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md`;
- cite the existing row in that index and state why it remains current;
- state `NO_CONDITIONAL_REOPEN_INDEX_ENTRY_WITH_REASON` because the value was
  fully adapted, rejected with no remaining CVF-native value, or already owned
  by another governed index.

Do not treat "not authorized in this tranche" as a value decision. Direct
import may be rejected while CVF-native runtime, package, checker, or doctrine
value remains conditionally reopenable.

The index is not implementation authority. A row in the index cannot activate
packages, install plugins, wire hooks, mutate runtime, authorize provider
execution, publish public artifacts, or create production claims. It only
preserves the candidate, its owner surface, and its concrete reopen condition
until a fresh governed value probe, GC-018, work order, source-verification
pass, package promotion review, checker tranche, or runtime authorization
exists.

## Reviewer Semantic Value Audit

Machine gates make external absorption reviewable; they do not prove semantic
value conversion. Before accepting an absorption closeout, the reviewer must
audit the disposition ledger after all fast gates pass:

- inspect every `DEFERRED` row or group and decide whether its value can be
  adapted now into CVF doctrine, a package candidate, a runtime candidate, or a
  checker candidate;
- inspect representative and high-risk `REJECTED` rows to confirm that direct
  import is rejected but reusable CVF-native doctrine has not been discarded;
- inspect `NO_NEW_VALUE` rows to confirm they are structural duplicates or
  already-covered material, not unexamined source files;
- if a `DEFERRED` item has value but no concrete reopen condition, either adapt
  it in the current allowed scope or keep it visible with a source-backed
  reopen condition;
- treat `run_worker_return_fast_gate.py` and the external absorption guards as
  necessary pre-review hygiene, not as proof that value-bearing files have been
  fully converted.

This rule is the reviewer-side complement to the value-conversion matrix. It
closes the CGE-R1 lesson where a worker repaired gate-shape failures but still
left 16 value-bearing template, example, and schema files parked until reviewer
repair.

## Machine Guard

Machine guards:

`governance/compat/check_external_absorption_core.py`

`governance/compat/check_external_absorption_value_conversion.py`

`governance/compat/check_external_absorption_overlap_discipline.py`

The guard is forward-only and range-aware. It checks changed active governed
Markdown artifacts that reference external absorption sources, external
repository URLs, copied-folder intake, or the explicit marker:

`External absorption core: REQUIRED`

The core guard requires the external absorption core block, corpus completeness
evidence that is not `NOT_APPLICABLE_WITH_REASON`, external knowledge intake
routing, non-empty manifest and ledger fields, allowed status vocabulary, and
an owner-surface map.

The value-conversion guard requires the value conversion matrix, all required
conversion lane tokens, and next-action plus boundary evidence for package,
runtime, and checker candidates.

The overlap-discipline guard requires the overlap and novelty classification
section, owner-surface comparison column, allowed overlap disposition tokens,
and per-row novelty/action evidence before an absorption artifact can close.

The guards do not prove semantic understanding. They make the corpus,
disposition, and conversion-opportunity evidence reviewable and block
narrative-only closure.

## Epistemic Process Block

Epistemic Process Applicability: EPISTEMIC_PROCESS_NA_WITH_REASON: canonical
governance standard definition; no empirical corpus result, provider behavior,
runtime behavior, or external-source absorption claim is asserted by this
standard.

Expected Result / Prediction: N/A - standard definition artifact.

Evidence Comparison: N/A with reason: direct evidence belongs to the paired
checker tests and completion review, not this reference definition.

Contradiction Or Gap Disposition: N/A with reason: future absorption artifacts
may reveal semantic-quality gaps, but this standard only defines the required
evidence shape.

Claim Update: no predicted corpus or runtime claim is updated by this
reference artifact.

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | external repo or copied folder |
| Chain map route | external repo or copied folder -> external absorption core -> corpus manifest and ledger -> owner-surface disposition -> value conversion matrix -> GC-018/work order/source verification if implementation is needed |
| Matching local-view guard | `governance/compat/check_external_absorption_core.py`; `governance/compat/check_external_absorption_value_conversion.py`; `governance/compat/check_external_absorption_overlap_discipline.py`; `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_corpus_completeness_report_integrity.py` |
| Owner surface | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Disposition | ADAPT as central external absorption core standard and machine-check candidate |
| Claim boundary | routing and evidence-shape standard only; no semantic-completeness, runtime, provider, public, or production claim |

## Claim Boundary

This standard defines required evidence shape for external absorption work. It
does not claim that any external source has been fully absorbed, does not make
external material canonical, does not install runtime behavior, does not prove
provider or live behavior, and does not authorize public-sync or production
readiness.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer role |
| Provider or surface | local workspace |
| Session or invocation | CGE-R1 absorption lesson hardening, 2026-06-29 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read, rg, apply_patch, governance gates |
| Target paths | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`; `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md`; `docs/reference/external_agent_review/README.md` |
| Allowed scope source | operator instruction to make conditionally reopenable external-absorption value visible in a separate governed index |
| Before status evidence | candidate values could be correctly excluded from current closeout yet remain scattered across individual closeout prose |
| After status evidence | standard now requires conditional reopen candidates to be registered, cited, or explicitly excluded with reason |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | documentation standard and reference-index update only; no checker, runtime, provider/live, public-sync, package activation, or adapter behavior |
| Claim boundary | reviewer guidance and index-routing rule only; machine guards remain necessary but not sufficient |
| Agent type | reviewer/closer |
| Invocation ID | `external-absorption-conditional-reopen-index-2026-06-29` |
| Expected manifest | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`; `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md`; `docs/reference/external_agent_review/README.md` |
| Actual changed set | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`; `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md`; `docs/reference/external_agent_review/README.md` |
| Manifest delta | MATCH |
