# CVF CI1-T5 Classification Sampling Protocol

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-02

## Purpose

Document the method, evidence, new gaps, and claim boundary for the CI1-T5
adversarial sampling of the committed CI1-T4 cross-corpus index model.

CI1-T5 checks classification discipline and claim boundaries over the first two
pilot packets (CI1-T2 Graphify and CI1-T3 code-review-graph). It does not
broaden the legacy corpus, implement runtime, or claim semantic correctness.

## Scope / Target / Owner Boundary

Scope: adversarial sampling of the committed CI1-T4 cross-corpus index model
over the two registered CI1 pilot packets (CI1-T2 Graphify and CI1-T3
code-review-graph). Bounded source cross-checks inside the two registered pilot
roots only.

Target: orchestrator and reviewer verification of T4 model classification
discipline, normalization rules, and claim boundaries. Primary downstream
consumer: CI1-T6 checker decision.

Owner boundary: worker reads T4 model, T2 packet, T3 packet, and GC-051
registry; creates sampling JSON, protocol, and completion review; adds GC-052
route. Worker does not scan new legacy roots, modify runtime source, implement
runtime, commit, or push.

## Authority Chain

| Authority | Path | Disposition |
| --- | --- | --- |
| CI1-T5 GC-018 | `docs/baselines/CVF_GC018_CI1_T5_CLASSIFICATION_SAMPLING_PROTOCOL_2026-06-02.md` | ACCEPT |
| CI1-T5 work order | `docs/work_orders/CVF_WO_CI1_T5_CLASSIFICATION_SAMPLING_PROTOCOL_2026-06-02.md` | ACCEPT |
| T4 cross-corpus model | `docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json` | ACCEPT |
| T2 packet | `docs/audits/CVF_CI1_T2_GRAPHIFY_READINESS_PACKET_2026-06-02.md` | ACCEPT |
| T3 packet | `docs/audits/CVF_CI1_T3_GRAPH_GOVERNANCE_CORPUS_READINESS_PACKET_2026-06-02.md` | ACCEPT |
| GC-051 registry | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` | ACCEPT — consulted |

## Execution Context

- `executionBaseHead`: `4674c86d`
- `git status --short` at execution start: clean working tree
- Commit mode: WORKER_MUST_NOT_COMMIT

## Method

### GC-051 Registry Consultation

Registry consulted at `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json`
before any source cross-check. Two registered pilot roots confirmed:

| corpusId | corpusRoot | fileCount | manifestHash |
| --- | --- | --- | --- |
| `legacy-cvf-important-graphify` | `.private_reference/legacy/CVF_Important/Knowledge Base_Graphify/` | 5 | `a88e3412` |
| `legacy-cvf-add-code-review-graph` | `.private_reference/legacy/CVF ADD/code-review-graph/` | 7 | `d921f708` |

No new legacy root enumerated. No sibling folder scanned.

### Selection Method

Rows drawn from T2 and T3 classification/adversarial ledgers by category.
Bounded source cross-checks performed only inside the two registered pilot roots
to verify file existence and content alignment with packet claims. No runtime
TypeScript or Python source scanned in CI1-T5.

### Categories Required vs Sampled

| Category | Required | Sampled | Pass | Pass-with-Gap | Fail |
| --- | --- | --- | --- | --- | --- |
| ACCEPTED | 3 | 4 | 4 | 0 | 0 |
| DEFERRED | 2 | 3 | 2 | 1 | 0 |
| REJECTED | 2 | 2 | 2 | 0 | 0 |
| ZERO_RESULT | 2 | 3 | 3 | 0 | 0 |
| HIGH_RISK | 2 | 3 | 2 | 1 | 0 |
| **Total** | **11** | **15** | **13** | **2** | **0** |

## Normalization Gaps Confirmed and New Gaps Found

### Confirmed Gaps (from T4 model)

| Gap | Field | Impact | T6 Category |
| --- | --- | --- | --- |
| NR-04 | `sourceHash` | manifest-level only; no per-file hash in either packet | STRUCTURAL_CHECK_CANDIDATE |
| NR-05 | `normalizedPath` | T2 absent; T3 declared but deferred | STRUCTURAL_CHECK_CANDIDATE |
| NR-06 | `sensitivity` | T2 corpus-level only; T3 per-file | DOCUMENTATION_ONLY_GAP |
| NR-07 | Language field | no canonical equivalent | DOCUMENTATION_ONLY_GAP |

### New Gaps Identified in T5 Sampling

| Gap | Field | Description | T6 Category |
| --- | --- | --- | --- |
| NR-11 | `disposition` | T2 `DEFER` and T3 `ACCEPT_SUMMARY_ONLY` used for same semantic state (deferred implementation); no merge rule in T4 | STRUCTURAL_CHECK_CANDIDATE |
| NR-03-vocab | `ownerSurface` | T4 NR-03 vocabulary list omits `CONTROL_PLANE_ADAPTERS` which appears in T3 classification ledger row C4 | STRUCTURAL_CHECK_CANDIDATE |

### Patterns Confirmed Valid

- File-level ACCEPT + content-level boundary annotation is a valid normalization
  pattern (LAYER_SPEC 7-phase roadmap, Thong_tin.md performance claims).
- ACCEPT at file level is not contradicted by zero-result for runtime
  implementation (DATA_MODEL node types absent from CVF TypeScript source).
- Operator analysis files in both corpora correctly bounded as HIGH_RISK with
  UNVERIFIED_CLAIM learning lane routing.

## CI1-T6 Inputs Summary

### Structural Check Candidates (4)

1. **Per-file sourceHash** (NR-04) — Both pilot packets lack per-file hash. A
   structural checker could enforce this for all future packets.

2. **normalizedPath algorithm definition** (NR-05) — Algorithm undefined.
   T3 declares field but defers application. Checker needs defined algorithm.

3. **Disposition merge rule DEFER vs ACCEPT_SUMMARY_ONLY** (NR-11) — New gap.
   Cross-packet queries require canonical merge rule for semantically equivalent
   bounded acceptance states.

4. **ownerSurface vocabulary completeness** (NR-03-vocab) — New gap.
   `CONTROL_PLANE_ADAPTERS` absent from T4 NR-03 vocabulary list.

### Documentation-Only Gaps (2)

1. **sensitivity per-file vs corpus-level** (NR-06) — Documentation guidance
   sufficient for uniform-sensitivity corpora.

2. **Language field** (NR-07) — Vocabulary addition (topicTags or primaryLanguage
   extension). Not a structural gate.

### Non-Candidates (5)

NR-01, NR-02, NR-08, NR-09, NR-10 — alias and split rules that function
correctly as documentation conventions without requiring machine enforcement.

## GC-052 Interlock Connection

Added connection `cross-corpus-index-to-classification-sampling` to:
`docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json`

Route:

```text
docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json
  -> bounded adversarial samples with evidence pointers
  -> docs/corpus-intelligence/CVF_CI1_T5_CLASSIFICATION_SAMPLING_RESULTS.json
  -> CI1-T6 checker decision
```

## Downstream Routing

| Downstream | Input from T5 | Status |
| --- | --- | --- |
| CI1-T6 Checker Decision | `t6Inputs` block in results JSON; 4 structural-check candidates, 2 doc-only gaps, 5 non-candidates | HOLD_UNTIL_T5_CLOSED |
| CI1-T7 LPCI Intake Bridge | T4 model `downstreamRoutes.CI1-T7` (unchanged) | HOLD_UNTIL_T6_DECIDED |

## Overall Verdict

`PASSED_SAMPLING_WITH_GAPS`

All 15 sample records returned PASS or PASS_WITH_GAP. Zero FAIL verdicts.
Two new normalization gaps identified (NR-11, NR-03-vocab) and routed to CI1-T6.
All T4 claim boundaries verified intact across 15 samples.

Reviewer disposition: CLOSED_PASS_BOUNDED. Reviewer normalized the
machine-readable `categorySummary` to distinguish PASS from PASS_WITH_GAP while
preserving the worker verdict and sample records.

## Rebuildability Statement

This sampling result is rebuildable from:

- `docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json`
- `docs/audits/CVF_CI1_T2_GRAPHIFY_READINESS_PACKET_2026-06-02.md`
- `docs/audits/CVF_CI1_T3_GRAPH_GOVERNANCE_CORPUS_READINESS_PACKET_2026-06-02.md`
- `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` (GC-051 consultation)
- The two registered pilot roots for bounded source cross-checks

No runtime index, vector store, or retrieval cache produced.

## Pending Artifacts (worker handoff)

| Path | Status |
| --- | --- |
| `docs/corpus-intelligence/CVF_CI1_T5_CLASSIFICATION_SAMPLING_RESULTS.json` | CREATED — pending review |
| `docs/reference/CVF_CI1_T5_CLASSIFICATION_SAMPLING_PROTOCOL_2026-06-02.md` | CREATED — this file, pending review |
| `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | UPDATED — GC-052 connection added |
| `docs/reviews/CVF_CI1_T5_CLASSIFICATION_SAMPLING_PROTOCOL_COMPLETION_2026-06-02.md` | CREATED — pending review |

No commit or push performed by worker.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: CI1-T5 reads and cross-checks private legacy corpus content from
`.private_reference/legacy/`. No public-sync remote, public artifact path,
hosted proof, or public README claim is included.

## Claim Boundary

CI1-T5 adversarially samples the committed T4 cross-corpus index model over two
pilot packets. It does not authorize broad legacy rescans, runtime indexing,
graph execution, LPCI implementation, legal advice, provider use, production
readiness, hosted readiness, or public readiness. Sampling verdict
`PASSED_SAMPLING_WITH_GAPS` does not prove semantic correctness of all
classifications — it verifies classification discipline and claim boundaries only.
