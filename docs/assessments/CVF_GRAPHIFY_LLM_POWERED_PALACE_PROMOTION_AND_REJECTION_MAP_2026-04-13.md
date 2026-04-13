# CVF Promotion and Rejection Map — Graphify / LLM-Powered / Palace

Memory class: SUMMARY_RECORD

> **Date:** 2026-04-13
> **Document Type:** FILE-LEVEL DECISION MAP / NOT IMPLEMENTATION AUTHORITY
> **Purpose:** Give any future agent a clean file-level decision trail so that the 21 source files never need to be re-audited from scratch.
> **Source Packet:** Assessment family closed 2026-04-13 (independent evaluation → expert rebuttal → arbitration → focused rebuttal round 2 → errata closure)

---

## How To Read This Map

| Posture | Meaning |
|---|---|
| `ADAPT_MEDIUM` | Usable as design input after medium editing (owner-mapping, term correction, header addition). Not canon as-is. |
| `ADAPT_HEAVY` | Usable as design input after significant restructuring (reframe surface claims, remove approval language, add governance checkpoints). |
| `SALVAGE_VOCABULARY` | Only specific terms, field names, or conceptual vocabulary is reusable. File as a whole is not promotable. |
| `REFERENCE_ONLY` | High provenance/commentary value. Not for promotion. Ideas may be re-derived in CVF-native language. |
| `REJECT_CURRENT_FORM` | File is not usable in any form without full rewrite. Rejected for specific evidence-backed reasons. |
| `REJECT_DEFERRED` | File addresses a surface not yet open in CVF (e.g., CLI runtime). Rejectable now but reopenable under specific conditions. |

---

## Knowledge Base_Graphify (5 files)

| # | File | Posture | CVF Owner Surface | Reason | Reopen Condition |
|---|---|---|---|---|---|
| 1 | `CVF_GRAPH_MEMORY_LAYER_SPEC.md` | `ADAPT_HEAVY` | Knowledge Layer + Context Builder | Strongest Graphify spec; addresses real structural-index gap. Must: remove "Graph Memory Layer" surface claim, remove "Approved for Integration," reframe as Knowledge Layer enhancement. | GC-018 wave for structural index implementation |
| 2 | `CVF_GRAPH_MEMORY_DATA_MODEL.md` | `ADAPT_HEAVY` | Knowledge Layer | Useful initial graph vocabulary. Must: tighten to W7 provenance/audit semantics, remove standalone surface framing. | Same as #1 |
| 3 | `CVF_GRAPH_MEMORY_GUARD_SPEC.md` | `REJECT_CURRENT_FORM` | — | All 6 proposed guard families (G-GM-01→06) map to existing CVF guards. Guard-family inflation risk. Provenance and integrity concerns already covered by `AuditTrailGuard`. | Only if a future audit identifies a guard gap not covered by existing 8+15 guards |
| 4 | `CVF_GRAPHIFY_CLI_COMMAND_SPEC.md` | `REJECT_DEFERRED` | — | 8 CLI commands for a surface that does not exist. W7/CLI family remains deferred by design per whitepaper. | W7/CLI family explicitly reopened via fresh bounded wave |
| 5 | `Thong_tin.md` | `REFERENCE_ONLY` | — | Community synthesis of `safishamsi/graphify` repo. High provenance value, not canon text. Provenance: no date/author on opening paragraph. | N/A — permanent reference status |

---

## Knowledge Base_LLM-Powered (6 files)

| # | File | Posture | CVF Owner Surface | Reason | Reopen Condition |
|---|---|---|---|---|---|
| 6 | `CVF_KNOWLEDGE_COMPILATION_INTEGRATION_SPEC.md` | `ADAPT_HEAVY` | Knowledge Layer + Context Builder + Governance Layer + Learning Plane | Strongest file in entire intake. Must: correct 5-loop to 6-loop (`Ingest→Compile→Govern→Query→Maintain→Refactor`), remove "APPROVED FOR INTEGRATION," soften `Schema→Governance Layer` mapping to `Schema→Context Builder input`, add governance checkpoint. | GC-018 wave for knowledge compilation |
| 7 | `CVF_KNOWLEDGE_COMPILATION_POLICY.md` | `ADAPT_MEDIUM` | Knowledge Layer + Context Builder | Compact policy core. Edits needed: add CVF doc header, remove redundant "CVF là gốc," add `Govern` step in lifecycle, add contract/barrel owner references, remove marketing conclusion, verify no policy ID conflicts. | Same as #6 |
| 8 | `CVF_COMPILED_CONTEXT_POLICY.md` | `ADAPT_MEDIUM` | Context Builder | Very compatible with deterministic context doctrine. Edits needed: add CVF doc header, define or replace "Verified Knowledge" term, reference specific governance surface, alias CCP-03 to `ScopeGuard`, cross-reference CCP-05 to W9-T1. | Same as #6 |
| 9 | `CVF_KNOWLEDGE_LINT_ENGINE_SPEC.md` | `SALVAGE_VOCABULARY` | Learning Plane | Knowledge maintenance vocabulary (lint, orphan detection, staleness, contradiction) is useful. Must not launch as standalone engine — absorb into existing `FeedbackLedger → PatternInsight → TruthModel` chain. | Same as #6 |
| 10 | `CVF_KNOWLEDGE_SCHEMA_TEMPLATE.md` | `SALVAGE_VOCABULARY` | Knowledge Layer | Template seed for knowledge artifact schema. Field set is still drafty. Must not imply TruthScore authority by template alone. | Same as #6 |
| 11 | `Thong_tin.md` | `REFERENCE_ONLY` | — | Synthesis of Andrej Karpathy's gist + DAIR.AI + Obsidian ecosystem. Named sources but informal attribution (no URLs). Strongest conceptual commentary in the intake. | N/A — permanent reference status |

---

## Knowledge Base_Palace (10 files)

| # | File | Posture | CVF Owner Surface | Reason | Reopen Condition |
|---|---|---|---|---|---|
| 12 | `CVF_MEMPALACE_ABSORPTION_SPEC.md` | `SALVAGE_VOCABULARY` | Knowledge Layer + Context Builder + W7MemoryRecord | Memory routing vocabulary and governed absorption concepts useful. Must: remove "Approved for Integration" and all "Adopt" labels, extract vocabulary only. Lower priority than its own `Thong_tin.md`. | GC-018 wave for W7MemoryRecord enrichment |
| 13 | `cvf_mem_memory_schema.py` | `SALVAGE_VOCABULARY` | W7MemoryRecord | Only field names salvageable (`wing`, `hall`, `room`, `drawer`, `closet_summary`, `tunnel_links`, `confidence_score`, `truth_score`, `contradiction_flag`). Code itself is dead (wrong import paths, TypeScript repo). | Same as #12 |
| 14 | `cvf_mem_context_mapper.py` | `REFERENCE_ONLY` | — | Thin pseudo-adapter. Useful only as vocabulary hint for context shaping. No functional value. | N/A |
| 15 | `cvf_w7_memory_record.py` | `REFERENCE_ONLY` | — | Too thin vs actual W7 dependency chain (Runtime→Artifact→Trace→Planner→Decision→Eval/Builder→Memory). Claims W7 compliance but enforces no dependency. | N/A |
| 16 | `cvf_mempalace_adapter.py` | `REJECT_CURRENT_FORM` | — | Substring-scan retrieval bypasses palace hierarchy. Logic fundamentally wrong — does not use wing/hall/room in retrieval. Not salvageable; rewrite from scratch if ever needed. | Full rewrite required if MemPalace concept revivals |
| 17 | `cvf_memory_evaluator.py` | `REJECT_CURRENT_FORM` | — | `recall_at_k` formula is semantically incorrect (measures result-set coverage, not actual recall). Metrics not trustworthy. Not salvageable. | Full rewrite with correct metric definitions |
| 18 | `CVF_MEMPALACE_INTEGRATION_EXECUTION_PLAN.md` | `REJECT_CURRENT_FORM` | — | All 8 checklist items marked ✅ but: code fails import, test fails, modules don't exist in repo. Checklist contradicts repo evidence. | Cannot reopen without corrected checklist matching repo truth |
| 19 | `test_memory_schema.py` | `REJECT_CURRENT_FORM` | — | Fails at import (`ModuleNotFoundError: No module named 'control_plane'`). Too thin. Tests import from package paths that don't exist. | Full rewrite with correct import paths and meaningful assertions |
| 20 | `mempalace_config.yaml` | `REFERENCE_ONLY` | — | Useful only as naming seed for future config discussion. | N/A |
| 21 | `Thong_tin.md` | `REFERENCE_ONLY` | — | Best provenance of the three `Thong_tin.md` files. Explicit GitHub URL (`milla-jovovich/mempalace`), clear source-to-analysis boundary. Commentary is more CVF-faithful than the code in the same folder. | N/A — permanent reference status |

---

## Summary Statistics

| Category | Count | Files |
|---|---|---|
| `ADAPT_MEDIUM` | 2 | #7, #8 |
| `ADAPT_HEAVY` | 3 | #1, #2, #6 |
| `SALVAGE_VOCABULARY` | 4 | #9, #10, #12, #13 |
| `REFERENCE_ONLY` | 6 | #5, #11, #14, #15, #20, #21 |
| `REJECT_CURRENT_FORM` | 5 | #3, #16, #17, #18, #19 |
| `REJECT_DEFERRED` | 1 | #4 |
| **Total files** | **21** | |

### By Folder

| Folder | Promotable (ADAPT) | Salvage | Reference | Reject |
|---|---|---|---|---|
| Graphify (5) | 2 | 0 | 1 | 2 |
| LLM-Powered (6) | 3 | 2 | 1 | 0 |
| Palace (10) | 0 | 2 | 4 | 4 |

---

## Implementation Gate

No file in this map is cleared for implementation.

All `ADAPT_MEDIUM` and `ADAPT_HEAVY` files require:
1. The edits listed in their `Reason` column
2. A fresh `GC-018` wave authorization
3. Owner-surface mapping verified against current whitepaper
4. GC-019 structural audit before any source-tree changes

Until those gates are met, all files remain in `.private_reference/legacy/CVF ADDING NEW/` and should not be moved into canonical directories.

---

*Promotion and Rejection Map Agent | 2026-04-13*
*This map covers all 21 files across 3 source folders. It is the canonical file-level audit trail for this intake.*
