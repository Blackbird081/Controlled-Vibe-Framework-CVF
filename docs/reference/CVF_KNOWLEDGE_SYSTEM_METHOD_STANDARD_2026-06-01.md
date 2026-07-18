# CVF Knowledge System Method Standard

Memory class: FULL_RECORD

Status: canonical CVF knowledge-system method

docType: reference

Date: 2026-06-01

## Purpose

Define one CVF method for turning existing project knowledge into a governed,
traceable, retrievable system without mistaking a graph, summary, or semantic
classification for source truth.

## Scope / Applies To

Use this method for corpus absorption, repository review, architecture
reconciliation, knowledge-base construction, Memory design, graphification,
retrieval planning, and report generation from existing project files.

## Canonical Method

```text
filesystem-backed source manifest
  -> governed intake registry and receipts
  -> semantic-region ledger and structural relations
  -> derived rebuildable views
  -> retrieval router and deterministic fusion
  -> governed use, audit, drift, and learning signals
  -> reviewed maintenance proposal
```

The method has eight cooperating layers:

| Layer | Responsibility | Authority boundary |
| --- | --- | --- |
| Source intake | Enumerate assets from filesystem or structured source truth. | Authority starts here. |
| Controlled gateway | Admit, reject, or defer assets with explicit receipts. | Registry state is governed evidence. |
| Lifecycle | Preserve snapshot, version, drift, and maintenance signals. | Changes require traceable proposals. |
| Retrieval and fusion | Select bounded context for a task. | Retrieval is a view, not full corpus truth. |
| Structural index | Preserve graph, relation, impact, and neighborhood views. | Graph output is rebuildable derived state. |
| Compiled artifacts | Package bounded context snapshots, caches, and summaries. | Compiled artifacts are disposable views. |
| Semantic regions | Group related material for routing and deeper review. | Classification is not proof of understanding. |
| Continuity and learning | Record drift, unresolved gaps, and follow-up lanes. | Learning signals do not authorize autonomous mutation. |

## Authority Model

Primary authority:

- filesystem or structured-API source manifest;
- governed intake registry;
- source locator and processing receipts;
- explicit operator-approved canonical contracts.

Derived, rebuildable views:

- knowledge graphs and relation indexes;
- semantic-region maps;
- Memory Palace layouts;
- summaries, compiled context packs, caches, and snapshots;
- retrieval results and ranking output.

A derived view may improve navigation and retrieval. It must remain
reconcilable to primary authority and must never silently replace it.

## Semantic Region Model

Semantic regions organize related assets into reviewable areas such as Memory,
governance, runtime execution, provider integration, learning, UX, evidence,
or public packaging.

Each manifest asset must receive one visible disposition:

- mapped to one or more semantic regions;
- deferred with reason and owner;
- unmapped and therefore blocking any zero-gap claim.

Cross-region relations must remain visible when one concept spans multiple
areas. A region ledger is an index for deeper review, not a semantic-proof
substitute.

## Reconciliation Boundary

Every corpus-derived knowledge map must satisfy:

```text
manifest assets = mapped assets + deferred assets + unmapped assets
```

Before a current reconciled claim, rerun source enumeration or compare a
manifest hash. A changed corpus makes the map stale until refreshed.

Canonical enforcement:

- `docs/reference/CVF_CORPUS_TO_KNOWLEDGE_MAP_RECONCILIATION_STANDARD_2026-06-01.md`
- `governance/toolkit/05_OPERATION/CVF_CORPUS_TO_KNOWLEDGE_MAP_RECONCILIATION_GUARD.md`
- `governance/compat/check_corpus_to_knowledge_map_reconciliation.py`

## Existing Owner Mapping

Current owner surfaces already provide bounded pieces of this method:

| Capability | Current owner |
| --- | --- |
| Vault intake, graph build, snapshot packaging, drift, reinjection proposal | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.vault.intake.contract.ts` |
| Structural indexing and neighborhood query | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.structural.index.contract.ts` |
| AST graph build and impact query | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/schema/graph-schema.ts` |

GC-048 does not replace these owners or claim they form a fully integrated
runtime. It adds the governance method needed to reconcile future synthesis
and implementation work against source truth.

## Operating Sequence

1. Enumerate the actual corpus with GC-047 evidence.
2. Create or refresh a manifest-backed intake ledger.
3. Group assets into semantic regions with visible deferred and unmapped rows.
4. Identify cross-region relations and current owner surfaces.
5. Build derived views only from the governed ledger.
6. Reconcile counts, drift, orphan assets, and rebuildability.
7. Use bounded retrieval or deeper review for the next question.
8. Route gaps into a reviewed roadmap, not autonomous mutation.

## Claim Boundary

This method establishes evidence discipline and a system architecture for
knowledge work. It does not prove semantic correctness, complete Legacy
absorption, runtime integration, production readiness, or autonomous learning.

