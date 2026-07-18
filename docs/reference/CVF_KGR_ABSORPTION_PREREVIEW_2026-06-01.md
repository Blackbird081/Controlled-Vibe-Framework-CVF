# CVF Knowledge Graph Retrieval — Absorption Pre-Review

Memory class: FULL_RECORD

Status: PENDING_ABSORPTION

docType: reference

Date: 2026-06-01

## Scope / Applies To

Applies to: any agent or operator preparing to absorb
`.private_reference/legacy/CVF_Important/Knowledge Base_Graphify/` into CVF
runtime surfaces, or evaluating whether a KGR absorption tranche should be
opened. Also applies to future guard-hardening work targeting the
`check_legacy_absorption_coverage` gap identified in this document.

## Purpose

Record the pre-absorption analysis of the Knowledge Graph Retrieval (KGR)
knowledge domain — sourced from `.private_reference/legacy/CVF_Important/
Knowledge Base_Graphify/` — before a formal LHW absorption tranche is opened.
This file exists so any future agent or operator can pick up the absorption
without losing the analysis already done.

## Source Corpus (Pending Deep Re-Absorption)

Location: `.private_reference/legacy/CVF_Important/Knowledge Base_Graphify/`

Files (5):

| File | Content summary |
| --- | --- |
| `CVF_GRAPH_MEMORY_LAYER_SPEC.md` | Full spec for Graph Memory Layer — nodes/edges, Context Builder, governance-first principle, integration architecture |
| `CVF_GRAPH_MEMORY_DATA_MODEL.md` | Data model: node types, edge types, Graph Memory Builder → Store → Knowledge Layer → Context Builder pipeline |
| `CVF_GRAPH_MEMORY_GUARD_SPEC.md` | 8 guard policies (G-GM-01 to G-GM-08): Priority Guard, No-Bypass, Provenance, Integrity, Access Control, Confidentiality, Drift Detection, Compliance |
| `CVF_GRAPHIFY_CLI_COMMAND_SPEC.md` | CLI spec: `cvf graph build` / `/graphify` alias, 8 sub-commands (build/update/query/visualize/export/validate/status/purge) |
| `Thong_tin.md` | Operator analysis: Graphify (safishamsi/graphify) as external reference; comparison grep vs graph; 71.5x token reduction claim; PreToolUse hook pattern |

## Why This Is NOT Memory Plane

Memory Plane (MKG/MKE series) and Knowledge Graph Retrieval are different
layers. The distinction is critical to avoid mis-scoping:

| Dimension | Memory Plane (MKG/MKE) | Knowledge Graph Retrieval (KGR) |
| --- | --- | --- |
| What it stores | Session/actor/project decisions, eligibility states | Codebase structure, AST relationships, concept map |
| Source of records | Runtime execution, durable store writes | Pre-computed build artifact (AST parse + concept extract) |
| Access pattern | Actor-scoped, authorization-gated readout | Query-based navigation, graph traversal |
| Timing | Runtime (per request) | Build-time (pre-computed) |
| Current CVF status | **OPERATIONAL** (MKG7 complete, MKE1 proposed) | **SHALLOW_INVENTORY_ONLY** under 2026-06-01 GC-047/048 standards — prior Graphify/W72/Palace synthesis artifacts exist; current corpus has not been deeply re-absorbed under current standards |
| Token impact | Advisory readout in response envelope | 71.5x token reduction per query (Graphify claim) |
| Enforcement | MKE1 will wire REVOKED → BLOCK | No enforcement yet; no runtime exists |

They are complementary, not competing. KGR provides the *structural context map*
that Memory Plane can reference — e.g., graph-derived candidates feed into
`MemoryRetrievalCandidate`.

## CVF Owner Surface Mapping (Candidate)

Where KGR concepts would land in the current CVF architecture:

| KGR concept | Candidate CVF owner surface | Status |
| --- | --- | --- |
| Graph Memory Store | New LPF module: `knowledge-graph-store.ts` | NOT YET CREATED |
| Graph Memory Builder (AST parse) | New LPF or CLI module | NOT YET CREATED |
| Knowledge Layer / Context Builder | `memory-context-packager.ts` (partial overlap) | EXISTS — needs extension |
| G-GM-07 Drift Detection Guard | `CVF_MEMORY_DERIVED_GRAPH_BOUNDARY_2026-06-01.md` | EXISTS (doc-only) |
| G-GM-03 Provenance Guard | `durable-memory-store.ts` provenance ≥ 0.7 | EXISTS |
| G-GM-05 Access Control Guard | `actorAuthorized` gate in durable store | EXISTS |
| `cvf graph build` CLI | `tools/` or `scripts/` CLI extension | NOT YET CREATED |
| PreToolUse hook pattern | `.claude/settings.json` hooks | AVAILABLE — not wired for KGR |
| NetworkX / Leiden community detection | External dependency — needs evaluation | NOT EVALUATED |

## Guard Analysis: Why GC-047 and GC-048 Cannot Catch This Blind Spot

This section records the architectural reason these guards passed even though
the current `CVF_Important/Knowledge Base_Graphify/` corpus was not deeply
re-absorbed under the 2026-06-01 GC-047/GC-048 standards.

Root cause: GC-047 and GC-048 are **report-quality gates**, not **corpus
discovery or absorption-coverage tools**.

### What the guards DO

- **GC-047** (Corpus Completeness And Report Integrity): verifies that a corpus
  *report* — once written by an agent — has the required sections: manifest,
  processing ledger, reconciliation, exclusions, adversarial verification, and
  an allowed verdict.
- **GC-048** (Corpus-To-Knowledge-Map Reconciliation): verifies that a
  knowledge-map *report* has source-authority, semantic-region, mapped/deferred/
  unmapped reconciliation, drift, and rebuildability evidence.

### What the guards DO NOT do

Neither guard performs **discovery of unabsorbed knowledge**. They are
*report-quality gates*, not *coverage-completeness detectors*.

They do not:

- scan the entire `.private_reference/legacy/` tree to discover unabsorbed
  folders;
- compare "what exists on disk" against "what has terminal absorption
  disposition";
- warn that a folder has no deep absorption packet, no explicit deferral, or
  only a shallow inventory mention.

In short: the guards validate reports after an agent writes them. They do not
create reports for knowledge the agent never selected.

### Three specific gaps

**Gap 1 — `.private_reference/` is git-ignored**

`.gitignore` line 82: `.private_reference/`

`git ls-files` returns nothing for this path. Both guards run on
`--base <hash> --head HEAD` changed-file ranges. Legacy files that have never
been committed are never in scope.

**Gap 2 — Guards only trigger on changed files in the diff range**

`Knowledge Base_Graphify` has never been modified in any commit. It will never
enter a `--base ... --head HEAD` range. Even if an agent runs
`rg --files --hidden --no-ignore`, the guard only checks *whether the report
cites that command* — it does not independently verify that all discovered files
were deep-interpreted.

**Gap 3 — LHW-RESCAN-A scanned correctly but shallow**

LHW-RESCAN-A used `rg --files --hidden --no-ignore` and saw all 230 files in
CVF_Important, including `Knowledge Base_Graphify/`. GC-047 and GC-048 verified
the RESCAN-A report as structurally complete. But the report recorded
`deep interpretation remains explicitly open` — a **valid declared gap**,
not a violation. The guards read that declaration and passed.

### Guard coverage summary

| Guard | Checks | Does not check |
| --- | --- | --- |
| GC-047 | Report has manifest, hash, file ledger, reconciliation, exclusions, adversarial verification, and allowed verdict | Folder has a deep absorption report |
| GC-048 | Knowledge map report has source authority, semantic-region reconciliation, mapped/deferred/unmapped totals, drift, and rebuildability evidence | Every knowledge domain on disk has been mapped deeply |
| Both | Report quality for changed governed artifacts | Corpus coverage completeness across ignored legacy folders |

### Root cause summary

```
Guards verify:   report quality (format, sections, hash, verdict)
Guards do not:   compare "what exists on disk" vs "what has terminal
                 absorption disposition"

Missing machine check:
  "For each folder in .private_reference/legacy/, verify at least one
   review, work order, or prereview in docs/ records a terminal disposition:
   absorbed deeply, absorbed doc-only, explicitly deferred, shallow inventory
   only, or unabsorbed/untracked."
```

### Recommended future guard (not yet built)

`check_legacy_absorption_coverage.py` — scans all subfolders under
`.private_reference/legacy/`, then checks that each folder has a terminal
absorption disposition in an appropriate governed artifact.

Allowed dispositions:

- `ABSORBED_DEEP`;
- `ABSORBED_DOC_ONLY`;
- `DEFERRED_WITH_REASON`;
- `SHALLOW_INVENTORY_ONLY`;
- `UNABSORBED_UNTRACKED`;
- `BLOCKED_UNREADABLE`.

The guard must not treat a bare citation, manifest row, or semantic-region
label as deep absorption. RESCAN-A would count as `SHALLOW_INVENTORY_ONLY` for
`Knowledge Base_Graphify/`, not `ABSORBED_DEEP`. That would have made the
remaining KGR work visible immediately after RESCAN-A without turning a valid
shallow report into a GC-047/GC-048 violation.

## Prior Absorption History

KGR-related knowledge has been partially absorbed in earlier CVF iterations.
Known prior artifacts:

- `CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md` —
  earlier roadmap for Palace synthesis using Graphify
- Promotion/rejection maps from prior LHW waves covering graph/knowledge domain

These artifacts confirm Graphify was known and partially evaluated before 2026.
The claim in this document is precise: the **current
`CVF_Important/Knowledge Base_Graphify/` 5-file corpus has not been deeply
re-absorbed under the 2026-06-01 GC-047/048 standards** (manifest-backed,
terminal disposition per file, semantic-region reconciliation). Prior work
counts as `ABSORBED_DOC_ONLY` at best for those specific artifacts, not as a
complete re-absorption of this corpus under current standards.

## Absorption Readiness Assessment

| Criterion | Assessment |
| --- | --- |
| Corpus size | Small — 5 files, well-structured |
| Conceptual clarity | High — operator analysis already done in `Thong_tin.md`; prior absorption artifacts also exist |
| CVF integration path | Clear — new LPF module + CLI extension |
| External dependency risk | Medium — Graphify uses NetworkX, tree-sitter, Leiden; CVF would define its own bounded contract, not import external libs |
| Prerequisite for T4/T5 | MKE1-E1 non-live gates PASS or `MemoryRetrievalCandidate` contract stable — required before KGR wires into retrieval |
| Prerequisite for T1/T2/T3 | None — can proceed independently |
| Live proof required? | Yes for T5 — graph query reducing token usage requires a live-proof benchmark |
| Suggested tranche label | `KGR1` — Knowledge Graph Retrieval, Wave 1 |

## Suggested Absorption Sequence

| Tranche | Scope | MKE1 dependency | Can start now? |
| --- | --- | --- | --- |
| KGR1-T1 | Doc-only: absorb 5 files, map to CVF owner surfaces, terminal disposition per file | None | Yes |
| KGR1-T2 | Schema: `KnowledgeGraphNode`, `KnowledgeGraphEdge`, `KnowledgeGraphStore` interfaces in LPF. No persistence, not wired into Memory runtime | None | Yes |
| KGR1-T3 | Builder stub: `buildKnowledgeGraph(files)` — deterministic in-process graph from file list. No external AST lib | None | Yes |
| KGR1-T4 | Retrieval integration: wire graph nodes as `MemoryRetrievalCandidate` candidates into `evaluateRetrievalRequest` | `MemoryRetrievalCandidate` contract stable (after MKE1-E1 non-live gates or earlier if contract frozen) | HOLD |
| KGR1-T5 | Live proof: benchmark token reduction with real provider call | T4 complete + MKE1-E3 | HOLD |

**Dependency rationale for T4/T5:** `MemoryRetrievalCandidate` is the
integration surface between KGR and Memory Plane. MKE1-E1 moves eligibility
evaluation earlier in the execution flow and may modify how candidates are
consumed. Wiring KGR into retrieval before that contract is stable risks a
breaking re-wire. T1/T2/T3 have no such dependency — they build internal KGR
schema and builder without touching Memory runtime.

## Blocked Work

- Do not wire KGR into `MemoryRetrievalCandidate` (T4) before MKE1-E1
  non-live gates PASS or the `MemoryRetrievalCandidate` interface is explicitly
  frozen by operator.
- Do not import external graph libraries (NetworkX, tree-sitter, Leiden) without
  a separate GC-018 evaluating dependency risk.
- Do not add `cvf graph build` CLI without a separate operator instruction.
- Do not treat prior Palace/Graphify absorption artifacts as satisfying the
  2026-06-01 GC-047/048 deep re-absorption requirement for this 5-file corpus.

## Claim Boundary

This document is a pre-absorption analysis only. It does not authorize any
runtime implementation, live proof, public-sync, or graph mutation. It is
private provenance reference material intended for agent reading before a
formal KGR absorption tranche is opened.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY
