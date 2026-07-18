# ADIF-0011 - Non-ASCII Unicode Characters In Governed Markdown Trigger Encoding Violation

Memory class: POINTER_RECORD

Status: ACTIVE

EPISTEMIC_PROCESS_NA_WITH_REASON: ADIF registry entry; canonical sources and
trace evidence are recorded, but this entry does not perform a separate
evidence-comparison process.

```text
defectId: ADIF-0011
title: Non-ASCII Unicode characters in governed markdown trigger encoding violation
defectCategory: GATE_TRIGGER_FRICTION
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: general authoring pattern across all roles
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Worker return authoring; Completion review authoring; Audit authoring; Contract authoring; Closure
roles: worker; reviewer; dispatcher
lifecyclePhases: pre-closure; pre-push
surfaceSelectors: docs/**/*.md; docs/reference/**/*.md -- any newly committed governed markdown file
detectionSignals: pre-commit hook "agent packet authority and encoding" reports "newly added non-ASCII text without Text Encoding Exception" at specific line numbers; common offenders are Unicode right-arrow U+2192 written as -> in prose/tables, and em dash U+2014 written as -- in table cells
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_agent_packet_authority_and_encoding.py
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: 489ff38a
roadmapSeedId: NONE
```

## Purpose

Record that governed markdown files must use only ASCII characters unless
a Text Encoding Exception is declared. AI agents naturally produce Unicode
typographic characters -- especially U+2192 RIGHT ARROW (as in A -> B flow
diagrams) and U+2014 EM DASH (as in table cells that say "No -- display only")
-- which are rejected by the pre-commit encoding checker.

## Scope / Applies To

Applies to all governed markdown files under `docs/`. Does not apply to
JSON or TypeScript source files, which have their own encoding rules.

## Bad Example

```markdown
| `OUT_OF_SCOPE` | Web type bridge (`corpusClass` -> `certificationState`) |
```

where `->` is actually U+2192 (RIGHT ARROW), not two ASCII characters.

```markdown
| May become CERTIFIED? | No -- display only |
```

where `--` is actually U+2014 (EM DASH), not two hyphens.

## Good Example

```markdown
| `OUT_OF_SCOPE` | Web type bridge (`corpusClass` -> `certificationState`) |
```

where `->` is ASCII hyphen-greater-than (U+002D U+003E).

```markdown
| May become CERTIFIED? | No -- display only |
```

where `--` is two ASCII hyphens (U+002D U+002D).

## Canonical Sources

- `governance/compat/check_agent_packet_authority_and_encoding.py`:
  encoding violation detection (confirmed by pre-commit hook output during
  ASSF-T6, 2026-06-25)
- `docs/reference/CVF_TEXT_ENCODING_AND_SYMBOL_DISCIPLINE_STANDARD_2026-06-07.md`:
  canonical encoding policy

## Remediation

When writing flow diagrams or table cells that need an arrow, use two ASCII
characters `->` (hyphen + greater-than), never the Unicode arrow U+2192.
When writing table cells that need a dash separator, use two ASCII hyphens
`--`, never the em dash U+2014. If a Text Encoding Exception is needed for a
legitimate Unicode character, declare it following the encoding standard before
committing. IDE auto-correction and smart-quotes settings may silently convert
ASCII to Unicode -- verify with a hex editor or `grep -P '[\x80-\xFF]'` before
committing.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude worker/reviewer |
| Provider or surface | local workspace |
| Session or invocation | ASSF-T6 gate repair, 2026-06-25 |
| Working directory | repository root |
| Command or tool surface | pre-commit hook output analysis; multi_edit replacements |
| Target paths | this entry file |
| Allowed scope source | AGENTS.md: new repeated defect patterns must be added to ADIF registry before tranche close |
| Before status evidence | pattern existed only in session memory, not in any CVF-governed artifact |
| After status evidence | entry created under ADIF defect registry, discoverable by run_adif_defect_resolver.py |
| Diff evidence | new-file creation in this commit |
| Approval boundary | ADIF entry addition only; no checker code change |
| Claim boundary | records observed defect pattern; does not modify the encoding checker |
| Agent type | worker/reviewer |
| Invocation ID | cvf-adif-0011-entry-2026-06-25 |
| Expected manifest | this entry, plus README table row |
| Actual changed set | this entry, plus README table row |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry. No public-sync claim.

## Claim Boundary

This entry records one observed defect pattern and its confirmed checker
binding. It does not modify `check_agent_packet_authority_and_encoding.py`
or the encoding standard.
