# CVF Corpus Path Normalization Algorithm Standard (NR-05)

Memory class: FULL_RECORD

Status: canonical corpus path normalization standard

docType: reference

Date: 2026-06-02

## Purpose

Define the canonical algorithm that a corpus intelligence readiness packet
author uses to compute the `normalizedPath` field for each classification-ledger
row. This standard is the written precursor that CI1-T6 marked
`STANDARD_REQUIRED_FIRST` for the deferred NR-05 checker spec stub.

It exists so that cross-packet path matching (e.g. LPCI query routing across two
or more corpora) uses one deterministic path form instead of ad-hoc per-packet
normalization. Without it, the same source file can appear under different path
strings in different packets and fail to join.

## Scope / Applies To

Applies to: every corpus intelligence readiness packet authored under the
CVF corpus intelligence workflow that records a `normalizedPath` per
classification-ledger row.

Source lineage:

- gap origin: `docs/corpus-intelligence/CVF_CI1_T5_CLASSIFICATION_SAMPLING_RESULTS.json` (NR-05)
- decision: `docs/reference/CVF_CI1_T6_CHECKER_DECISION_2026-06-02.md` (NR-05 row, `STANDARD_REQUIRED_FIRST`)
- model field: `docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json` normalizationRules NR-05
- authoring authority: `docs/baselines/CVF_GC018_CSA1_CORPUS_STANDARD_AUTHORING_2026-06-02.md`

Owner surface: CVF corpus intelligence governance layer.

## Canonical Form

A `normalizedPath` is the source file path expressed in the following canonical
form:

1. **Root-relative.** The path is relative to the corpus root recorded in the
   packet manifest. The corpus root prefix is removed; no absolute path,
   drive letter, or `.private_reference/legacy/<corpus>/` prefix is retained.
2. **Forward-slash separators.** All path separators are `/`. Windows
   backslashes (`\`) are converted to `/`.
3. **All lowercase.** The entire path string is lowercased.
4. **No trailing separator.** A trailing `/` is stripped. Directory entries are
   not recorded as ledger rows; only files are.
5. **No leading separator.** A leading `/` (after root-relative reduction) is
   stripped, so the path begins with the first path segment.
6. **No redundant segments.** `./` segments are removed; `../` must not appear
   in a normalized path (a packet whose source escapes the corpus root is a
   manifest defect, not a normalization case).

The canonical form is a string transformation only. It does not resolve
symlinks, query the filesystem, or assert that the file currently exists.

## Application Rule

For each classification-ledger row, the packet author records:

- `sourcePath` — the path as discovered/displayed (may retain original case and
  corpus-root prefix for human readability);
- `normalizedPath` — the canonical form of the same path per this standard.

When two packets reference the same underlying file, their `normalizedPath`
values must be byte-identical. Cross-packet joins key on `normalizedPath`, not
`sourcePath`.

Worked example:

| Input `sourcePath` | Canonical `normalizedPath` |
| --- | --- |
| `.private_reference/legacy/CVF ADD/code-review-graph/README.md` (corpus root = `.private_reference/legacy/CVF ADD/code-review-graph/`) | `readme.md` |
| `Knowledge Base_Graphify\CVF_GRAPH_MEMORY_DATA_MODEL.md` (corpus root = `Knowledge Base_Graphify/`) | `cvf_graph_memory_data_model.md` |
| `./Sub Dir/Spec File.md` | `sub dir/spec file.md` |

## Edge Cases

| Case | Rule |
| --- | --- |
| Spaces in path | Preserved as literal spaces (lowercased). Do not URL-encode or collapse. |
| Non-ASCII / Unicode | Preserved as-is after lowercasing; apply Unicode NFC normalization before lowercasing so visually identical paths compare equal. |
| Windows backslash paths | Convert every `\` to `/` before applying other rules. |
| Case-insensitive filesystems | The lowercase rule makes the canonical form filesystem-case-agnostic; two rows differing only in case collapse to one `normalizedPath`. |
| Mixed separators in one path | Normalize all separators to `/`. |
| File with no extension | Allowed; the path is normalized without an extension. |
| Path escaping corpus root (`../`) | Forbidden in a normalized path; flag as a manifest/scope defect, not a normalization output. |

## Checker Readiness Note

This standard was the precondition for the deferred NR-05 checker spec stub
`check_corpus_packet_normalized_path` recorded in
`docs/reference/CVF_CI1_T6_CHECKER_DECISION_2026-06-02.md` (Stub 2). CI2-T2
implemented `governance/compat/check_corpus_packet_normalized_path.py`, focused
tests, and hook/autorun wiring after this standard defined the canonical form.

This standard remains the authoring authority for `normalizedPath`; the checker
is the structural enforcement layer.

## Enforcement / Verification

Conformance is verified by the CI2-T2 structural checker for changed readiness
packets and by reviewer inspection during packet review: the reviewer confirms
that `normalizedPath` values follow the canonical form and that cross-packet
rows for the same file share an identical `normalizedPath`.

## Relationship To NR-11

NR-05 (path normalization) and NR-11 (disposition merge rule) are sibling
cross-packet join precursors authored together under CSA1. NR-05 makes the
file-identity key deterministic; the NR-11 disposition merge rule (in
`docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md`)
makes the disposition value comparable across packets.

## Claim Boundary

This standard is authoring guidance for a deterministic string transformation.
It does not perform runtime path resolution, filesystem access, symlink
resolution, or existence checks. It does not implement retrieval runtime or any
LPCI component, and it makes no production, hosted, or public-readiness claim.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY
