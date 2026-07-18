# CVF ADIF-T2 Resolver Contract

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference_standard

Date: 2026-06-23

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This contract
documents an implemented function's input/output shape; it does not itself
enumerate, map, or project CVF state.

Batch ID: ADIF-T2

EPISTEMIC_PROCESS_NA_WITH_REASON: implementation contract reference; it
documents a deterministic function's input/output shape, not an
evidence-comparison or hypothesis-testing artifact.

## Purpose

Document the input/output contract for
`governance/compat/run_adif_defect_resolver.py`, the first ADIF tranche
with executable code. The resolver is a deterministic, read-only function
that returns a bounded defect packet from the eight ADIF-T1 seed entries.

## Scope / Applies To

Applies to direct internal Python calls of `resolve_defect_packet` and
`load_entries`. Does not apply to any CLI, MCP, or external adapter
surface - none exists or is authorized by ADIF-T2.

## Inputs

| Parameter | Type | Required | Source |
|---|---|---|---|
| `task_class` | `str \| None` | no | caller-supplied; should align with Guard Orientation's Task Class Guard Map |
| `role` | `str \| None` | no | caller-supplied; should align with Guard Orientation's Role Glossary |
| `lifecycle_phase` | `str \| None` | no | caller-supplied; an autorun phase name |
| `surface_selector` | `str \| None` | no | caller-supplied; case-insensitive substring match against an entry's `surfaceSelectors` |
| `risk_ceiling` | `str \| None` | no | caller-supplied; one of `LOW`, `MEDIUM`, `HIGH` |
| `max_results` | `int` | no (default 10) | caller-supplied; must be a positive integer |
| `entries` | `tuple[DefectEntry, ...] \| None` | no | repository-governed; defaults to `load_entries()` reading `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-*.md` |

All inputs are either caller-supplied parameters or read directly from the
committed entry files. No provider, model, or external service supplies any
input.

## Output

`resolve_defect_packet` returns a `DefectPacket` with:

- `items`: an ordered tuple of `ResolvedDefectPacketItem`, each carrying
  `defect_id`, `title`, `defect_category`, `defect_class`, `severity`,
  `enforcement_level`, `checker_bindings`, and a portable repository-relative
  `source_path` for governed ADIF entry files;
- `truncated`: `True` if more candidates matched than `max_results`;
- `total_candidates`: the full match count before bounding;
- `to_dict()`: a JSON-serializable projection including an explicit
  `claimBoundary` string stating that returning the packet is not evidence
  of comprehension.

## Determinism And Ordering

Results are sorted by severity descending (`HIGH` > `MEDIUM` > `LOW`), then
by `defectId` ascending as a stable tiebreaker. The same inputs against the
same entry set always produce the same output order.

## Lifecycle Exclusion

Only entries with `lifecycleState: ACTIVE` are eligible for resolver results.
`PROPOSED`, `REJECTED`, `RETIRED`, and `SUPERSEDED` entries remain readable in
their source files but are excluded from returned packets, per the ADIF-T0
contract's rule that only reviewed active entries are resolver-eligible.

An unknown non-null `risk_ceiling` is rejected with `ValueError` instead of
silently disabling the ceiling.

## Read-Only Guarantee

`resolve_defect_packet` and `load_entries` perform filesystem reads only.
Neither function writes, deletes, renames, or creates any file. Neither
function selects a provider/model, executes a prompt, or reinjects agent
memory.

## Mandatory Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Disposition |
|---|---|---|---|---|
| `INTERNAL_AGENT` | direct Python import / function call of `governance/compat/run_adif_defect_resolver.py` | read-only function call inside CVF-governed workspace; no commit/action authority | `governance/compat/test_run_adif_defect_resolver.py` (13 passing focused tests) | `IMPLEMENTED` |
| `EXTERNAL_AGENT_CLI_MCP` | future separately authorized CLI/MCP adapter | no ingress, authentication, approval, receipt, raw-data release, mutation, runtime, or public claim exists | ADIF-T1 checkpoint review's deferred disposition; ADIF-T2 GC-018 Forbidden Scope | `DEFERRED_WITH_REASON` - no adapter exists; requires a separate source-verified GC-018/work order |

## Claim Boundary

This contract documents the resolver's input/output shape and determinism
guarantees only. It does not claim that any caller who receives a packet
read, understood, or acted on it. It does not authorize any CLI, MCP, or
external adapter.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference contract. No public-sync repository
work or public catalog claim is authorized.
