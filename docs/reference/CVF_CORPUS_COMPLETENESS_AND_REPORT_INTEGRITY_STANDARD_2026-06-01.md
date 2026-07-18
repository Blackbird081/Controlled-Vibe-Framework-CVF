# CVF Corpus Completeness And Report Integrity Standard

Memory class: FULL_RECORD

Status: canonical and machine-enforced corpus evidence standard

docType: reference

Date: 2026-06-01

## Purpose

Prevent an agent from publishing a complete-sounding report, comparison,
inventory, extraction, audit, migration, or knowledge-absorption decision
without proving that it processed the bounded source corpus the operator asked
it to use.

This standard generalizes the legacy-absorption blind-spot lesson. The control
is not limited to `.private_reference/legacy/`, CVF documentation, or Markdown.
It applies whenever an agent is expected to derive output from an enumerable
set of existing project files.

## Scope / Applies To

This standard applies to agent tasks that:

- read a folder, subfolder tree, file list, archive, or project source set;
- inventory, classify, compare, summarize, extract, audit, migrate, or report;
- absorb existing knowledge into a roadmap, work order, specification, or
  implementation decision;
- claim that all relevant files, all files, a complete corpus, or a full scan
  were processed;
- calculate totals, categories, contradictions, duplicates, or omissions from
  a bounded project corpus.

It applies to Markdown, source code, configuration, PDF, spreadsheet, document,
image, archive, and other file formats. Format-specific extraction may require
additional tools, but unsupported or unreadable files must remain visible.

## Rule

A bounded-corpus task may not claim completeness until it records a reviewable
`Corpus Completeness And Report Integrity` block and passes the repository
checker.

The required evidence model has two parts:

1. a `Corpus Manifest` proving what existed at snapshot time;
2. a `Processing Ledger` proving what happened to each included item.

The reconciliation invariant is:

```text
manifest files
  MINUS
processing-ledger files with an allowed terminal status
  =
unresolved files
```

`COMPLETE_VERIFIED` requires `unresolved files = 0`.

## Corpus Manifest

The manifest must record:

| Field | Requirement |
| --- | --- |
| `Corpus root` | Root path or explicit bounded file list. |
| `Snapshot time` | When filesystem enumeration occurred. |
| `Enumeration command` | Exact shell/tool command, not an agent-recalled count. |
| `Manifest artifact or inline manifest` | File-level inventory or inline table. |
| `Manifest hash` | Stable hash, or `N/A with reason` when the environment cannot produce one. |
| `File count by folder` | Reconciled folder totals. |
| `File count by extension` | Reconciled format totals. |
| `Declared exclusions` | Excluded paths with reasons. |
| `Unreadable or unsupported files` | Explicitly listed; never silently omitted. |

For a folder tree, raw enumeration evidence must come from the filesystem or a
structured API that lists the complete source set. A summary file, prior report,
or model assertion is not inventory evidence.

A bare `rg --files` command is ignore-sensitive and is not completeness
evidence. When ripgrep is used for inventory, it must include both `--hidden`
and `--no-ignore`, or the task must retain a bounded non-complete verdict.

## Processing Ledger

Every manifest file must appear in a processing ledger with one allowed
terminal status:

| Status | Meaning |
| --- | --- |
| `READ` | File was opened or parsed and considered. |
| `SKIPPED_WITH_REASON` | Intentionally excluded after inventory, with reason. |
| `DEFERRED` | Visible but intentionally deferred, with follow-up owner or lane. |
| `BLOCKED_UNREADABLE` | Could not be processed; output completeness is blocked or bounded. |

The ledger should also record parser/tool, extracted fact or `NO_NEW_VALUE`,
output section or disposition, and source locator such as page, sheet, section,
line, or symbol when the format supports it.

## Required Gates

### Gate 1 - Corpus Enumeration

Enumerate the corpus from source truth. Record exact commands and raw or
artifact-backed output. Self-reported counts are invalid.

### Gate 2 - Format And Access Visibility

List unreadable, unsupported, encrypted, binary, generated, archived, or
otherwise exceptional items. An agent may bound the claim, but may not silently
drop them.

### Gate 3 - Processing Coverage

Record one ledger row for every included manifest file. A folder-level summary
does not replace file-level coverage.

### Gate 4 - Reconciliation

Calculate manifest count, ledger terminal count, declared exclusion count,
unresolved count, and any duplicate/hash groups. Totals must reconcile.

### Gate 5 - Extraction Traceability

Important report claims, comparisons, and aggregations must trace back to source
files and a locator or structured extraction record. Reading every file is not
enough if the output cannot be audited.

### Gate 6 - Aggregation Check

Totals by folder, extension, category, or comparison class must sum back to the
manifest or state the bounded reason they do not.

### Gate 7 - Corpus Drift Check

Before publication or closure, rerun enumeration or compare the manifest hash.
If the corpus changed after the snapshot, use `STALE_SNAPSHOT` or regenerate the
report.

### Gate 8 - Adversarial Verification

Review at least the high-risk sources and a bounded random sample. For
high-impact reports, independently recompute key totals or comparison results.

## Required Evidence Block

```text
## Corpus Completeness And Report Integrity

- Corpus task class: INVENTORY | REPORT | EXTRACTION | COMPARISON | AUDIT |
  MIGRATION | KNOWLEDGE_ABSORPTION | OTHER
- Corpus root: <path or explicit bounded list>
- Snapshot time: <timestamp>
- Enumeration command: <exact command>
- Manifest artifact or inline manifest: <path or inline table>
- Manifest hash: <hash or N/A with reason>
- Processing ledger artifact or inline ledger: <path or inline table>
- Allowed terminal statuses: READ | SKIPPED_WITH_REASON | DEFERRED |
  BLOCKED_UNREADABLE
- Reconciliation: manifest=<N>; ledger_terminal=<N>; exclusions=<N>;
  unresolved=<N>
- Unresolved files: <0 or explicit paths>
- Declared exclusions: <none or paths + reasons>
- Unreadable or unsupported files: <none or paths + reasons>
- Aggregation check: <PASS or bounded reason>
- Drift check: <PASS, STALE_SNAPSHOT, or N/A with reason>
- Output traceability: <source locator evidence>
- Adversarial verification: <sample/recompute evidence>
- Corpus verdict: COMPLETE_VERIFIED | COMPLETE_WITH_DECLARED_EXCLUSIONS |
  PARTIAL | BLOCKED | STALE_SNAPSHOT
```

## Verdict Semantics

| Verdict | Meaning |
| --- | --- |
| `COMPLETE_VERIFIED` | Manifest and terminal ledger reconcile with zero unresolved files and no undeclared exclusions. |
| `COMPLETE_WITH_DECLARED_EXCLUSIONS` | Report is complete only within declared exclusions; every exclusion is visible and justified. |
| `PARTIAL` | Some source coverage or extraction work remains open. |
| `BLOCKED` | Missing, unreadable, unsupported, or unverified evidence prevents a safe result. |
| `STALE_SNAPSHOT` | Corpus changed after enumeration; refresh before publishing a current report. |

`CLEAR` may remain as a legacy absorption verdict only when paired with a
compatible corpus verdict and the required evidence block.

## Enforcement / Verification

Machine enforcement:

```powershell
python governance/compat/check_corpus_completeness_report_integrity.py --base <baseHead> --head HEAD --enforce
```

The checker is wired into:

- `governance/compat/run_agent_autorun_workflow_gate.py`;
- `governance/compat/run_local_governance_hook_chain.py`;
- `.github/workflows/documentation-testing.yml`.

The machine checker validates evidence shape, required bindings, verdict
semantics, and obvious reconciliation defects. It cannot prove semantic
understanding of every file. Gate 8 remains necessary for high-impact reports.

## Failure Modes

The following are blocking defects:

- claiming `all files read`, `full scan`, `complete inventory`, or equivalent
  without filesystem-backed enumeration;
- using ignore-sensitive default listing such as bare `rg --files` as
  completeness evidence;
- omitting unsupported or unreadable formats;
- using folder totals without file-level processing coverage;
- claiming `COMPLETE_VERIFIED` with unresolved files;
- publishing aggregation results that do not reconcile;
- publishing a report after corpus drift without `STALE_SNAPSHOT`;
- treating a prior report as proof that the current filesystem was fully read.

## Relationship To Legacy Absorption

The active legacy blind-spot standard remains a specialized companion:

`docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-06-01.md`

Future legacy rescans must satisfy both standards. The legacy standard owns
absorption semantics and owner-surface disposition. This standard owns corpus
enumeration, processing coverage, reconciliation, drift, and report integrity.

## Claim Boundary

This standard proves evidence discipline for bounded-corpus work. It does not
prove that an agent semantically understood every nuance, that every extracted
fact is correct, or that every downstream recommendation is optimal.
Traceability and adversarial verification remain required where impact
justifies them.
