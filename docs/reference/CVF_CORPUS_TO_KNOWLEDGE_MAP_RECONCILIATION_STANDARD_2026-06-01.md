# CVF Corpus-To-Knowledge-Map Reconciliation Standard

Memory class: FULL_RECORD

Status: canonical and machine-enforced knowledge-map reconciliation standard

docType: reference

Date: 2026-06-01

## Purpose

Prevent corpus-derived architecture maps, semantic-region maps, graph plans,
Memory maps, and knowledge-system reports from hiding orphan files, stale
snapshots, or authority confusion behind a coherent-looking diagram.

## Scope / Applies To

Apply this standard whenever an agent creates, refreshes, or relies on a
corpus-derived knowledge map, semantic-region ledger, architecture
reconciliation, Memory synthesis, graphification plan, or retrieval-readiness
claim.

## Rule

Knowledge-map work inherits GC-047 corpus inventory evidence. It must then
reconcile manifest assets into visible semantic-region dispositions and
distinguish primary authority from derived rebuildable views.

The invariant is:

```text
authority assets = mapped assets + deferred assets + unmapped assets
```

`RECONCILED_VERIFIED` requires zero deferred and zero unmapped assets.

## Enumeration Safety

Enumeration must use filesystem-backed source truth or a structured complete
API. A bare `rg --files` command is ignore-sensitive and is not completeness
evidence. When ripgrep is used for inventory, it must include both
`--hidden` and `--no-ignore`, or the map must remain partial.

## Required Gates

### Gate 1 - Authority Manifest

Reference the source manifest, its hash, and the intake or processing ledger.

### Gate 2 - Semantic Region Ledger

Record mapped, deferred, and unmapped dispositions. Keep cross-region links
visible.

### Gate 3 - Authority / Derived Separation

List authority assets separately from graph, Palace, summary, compiled context,
cache, snapshot, and retrieval views.

### Gate 4 - Arithmetic Reconciliation

Reconcile every authority asset into one visible disposition.

### Gate 5 - Drift And Rebuildability

Confirm the corpus snapshot is current and derived views can be rebuilt from
governed authority.

### Gate 6 - Retrieval Boundary

State what retrieval can answer and what still requires deeper source review.

### Gate 7 - Adversarial Verification

Recompute counts and challenge orphan, stale-map, and authority-confusion risk.

## Required Evidence Block

```text
## Knowledge System Reconciliation

- Knowledge task class: ARCHITECTURE_MAP | SEMANTIC_REGION_MAP | MEMORY_SYNTHESIS |
  GRAPHIFICATION | RETRIEVAL_READINESS | CORPUS_ABSORPTION | OTHER
- Source manifest: <path or inline manifest>
- Source manifest hash: <hash or N/A with reason>
- Enumeration safety: <filesystem-backed command or structured complete API evidence>
- Intake registry or ledger: <path or inline ledger>
- Authority assets: <source-backed assets or ledger evidence>
- Derived views: <graph, regions, Palace, summary, cache, snapshot, or N/A with reason>
- Semantic region ledger: <path or inline ledger>
- Region reconciliation: assets=<N>; mapped=<N>; deferred=<N>; unmapped=<N>
- Orphan or unmapped assets: <none or explicit paths>
- Cross-region links: <evidence or N/A with reason>
- Drift check: <PASS, STALE_MAP, or N/A with reason>
- Rebuildability check: <PASS or bounded reason>
- Retrieval boundary: <bounded capability and deeper-review lane>
- Adversarial verification: <recomputed totals and challenged risks>
- Knowledge-map verdict: RECONCILED_VERIFIED | RECONCILED_WITH_DECLARED_GAPS |
  PARTIAL | BLOCKED | STALE_MAP
```

## Verdict Semantics

| Verdict | Meaning |
| --- | --- |
| `RECONCILED_VERIFIED` | Current source manifest is fully mapped with zero deferred and zero unmapped assets. |
| `RECONCILED_WITH_DECLARED_GAPS` | Current source manifest has zero unmapped assets; visible deferred work remains bounded. |
| `PARTIAL` | Mapping, source review, or reconciliation remains incomplete. |
| `BLOCKED` | Missing authority, unsafe enumeration, inaccessible assets, or unresolved defects prevent reliance. |
| `STALE_MAP` | Source corpus changed after the mapped snapshot. |

## Enforcement / Verification

```powershell
python governance/compat/check_corpus_to_knowledge_map_reconciliation.py --base <baseHead> --head HEAD --enforce
```

Machine checks validate evidence shape, enumeration safety, arithmetic,
verdict semantics, stale-map handling, and enforcement bindings. They do not
prove deep semantic understanding.

## Relationship To GC-047

GC-047 proves what source files existed and how processing coverage was
handled. GC-048 proves whether a corpus-derived knowledge map accounts for
those assets without confusing derived views with authority.

## Claim Boundary

This standard creates a traceable reconciliation layer. It does not ingest a
corpus, prove semantic correctness, authorize runtime changes, or permit
autonomous mutation.

