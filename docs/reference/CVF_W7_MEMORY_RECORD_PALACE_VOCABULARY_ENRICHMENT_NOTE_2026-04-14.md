# CVF W7 Memory Record — Palace Vocabulary Enrichment Note

Memory class: POINTER_RECORD

> Date: 2026-04-14
> Tranche: W72-T3
> Authority: GC-021 Fast Lane audit `CVF_W72_T3_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_GC021_FAST_LANE_AUDIT_2026-04-14.md`
> Source: Palace cluster `cvf_mem_memory_schema.py` (SALVAGE_VOCABULARY, file #13 in promotion map)
> Status: VOCABULARY NOTE — candidate enrichment only; NOT canon; NOT implementation authority

---

## 1. Purpose

The Palace cluster contributed field vocabulary for hierarchical context routing
(`wing/hall/room/drawer/closet_summary/tunnel_links`). The promotion/rejection map classified
`cvf_mem_memory_schema.py` as `SALVAGE_VOCABULARY` — field names are reusable but the Python
code itself is dead (wrong import paths, TypeScript repo).

This note establishes these vocabulary seeds in CVF-native terms as documented candidates for a
future W7MemoryRecord enrichment wave. They are not canon. They are not implemented. They are
recorded here so that a future wave can reference them without re-auditing the Palace source folder.

---

## 2. Current W7 Surface in CVF

The W7 governance integration layer currently contains:

| Contract | Purpose |
|---|---|
| `W7NormalizedAssetCandidateContract` | Normalize external assets into W7-routing-ready candidates |
| `W7NormalizedAssetCandidateBatchContract` | Batch wrapper for asset normalization |
| `RegistryReadyGovernedAssetContract` | Promote normalized candidates to registry-ready governed assets |

`W7NormalizedAssetCandidate` carries routing metadata (`triggers`, `domain`, `phase_hints`) and
enrichment fields (`references`, `examples`, `tools`, `templates`, `execution_environment`).
It does **not** currently carry hierarchical memory-routing metadata.

A W7MemoryRecord surface does not yet exist as a contract in CVF. The Palace vocabulary would be
most naturally absorbed into an enrichment layer on top of this existing W7 surface.

---

## 3. Palace Vocabulary Seeds (CVF-Native Mapping)

All field names are from Palace `cvf_mem_memory_schema.py` (file #13 in promotion map).
CVF-native descriptions are derived from synthesis note §2.3 and §4.A — not from the Palace source code.

| Palace field | CVF-native meaning | Candidate owner surface | Status |
|---|---|---|---|
| `wing` | Broadest routing scope — the top-level context domain a memory belongs to (analogous to a CVF plane or major governance area) | Context Builder routing metadata | Candidate |
| `hall` | Mid-level routing scope — a specific workflow area or phase within a wing (analogous to a CVF workflow phase) | Context Builder routing metadata | Candidate |
| `room` | Narrow routing scope — a specific task or activity area within a hall | Context Builder routing metadata | Candidate |
| `drawer` | Most specific routing scope — a leaf-level item within a room (analogous to a specific contract or artifact) | Context Builder routing metadata | Candidate |
| `closet_summary` | A governed summary of a room's contents for fast routing without full retrieval | Knowledge Layer — Summary Artifact type (W72-T2) | Candidate |
| `tunnel_links` | Cross-scope references — pointers from one routing node to related nodes in other parts of the hierarchy | Knowledge Layer + Context Builder | Candidate |
| `confidence_score` | Quality signal for memory routing reliability | Learning Plane — `PatternInsight` | Deferred — requires calibration evidence |
| `truth_score` | Consistency signal for memory content | Learning Plane — `TruthModel` | Deferred — same as TruthScore in W72-T2 rejection |
| `contradiction_flag` | Boolean flag indicating a known contradiction with another memory artifact | Learning Plane — `TruthModel` | Candidate (equivalent to contradiction detection in W72-T2 owner map) |

### Notes on deferred fields

`confidence_score` and `truth_score` are deferred for the same reason as TruthScore in W72-T2:
no calibration evidence exists. A score field without calibration is arbitrary metadata. These
fields should not be added until a separate scoring calibration wave provides evidence.

`contradiction_flag` (boolean, not a score) is more tractable — it maps directly to W72-T2's
contradiction detection operation. It is listed as Candidate rather than Deferred.

---

## 4. Hierarchical Routing Model

The Palace `wing → hall → room → drawer` hierarchy describes **progressive context narrowing**:
retrieving at the broadest scope first, then narrowing to the most specific match.

In CVF terms this maps to the Context Builder's context-shaping responsibility:

```
wing (plane-level scope)
  └── hall (workflow/phase-level scope)
        └── room (task/activity-level scope)
              └── drawer (artifact/contract-level scope)
```

`closet_summary` is a governed summary attached to a `room` — it enables fast routing without
full artifact retrieval (consistent with compiled-knowledge preference in W72-T2).

`tunnel_links` are cross-hierarchy pointers — consistent with the structural relationship types
in `StructuralIndexContract` (depends_on, related_to, extends, supersedes from W72-T1).

The hierarchy does not create a new CVF architectural surface. It is a routing metadata enrichment
for the existing Context Builder context-shaping capability.

---

## 5. Implementation Path for Future Wave

W72-T6 later landed these vocabulary fields at the `W7NormalizedAssetCandidate` enrichment layer.
That delivery closed the candidate-layer carry-through path, but it did **not** create a W7MemoryRecord
surface. The remaining future wave is therefore narrower:

1. Verify that the T6 candidate-layer fields are still coherent with current Context Builder behavior
2. If a real `W7MemoryRecord` contract is later introduced, decide which of `wing`, `hall`, `room`,
   `drawer`, `closet_summary`, `tunnel_links`, `contradiction_flag` should also live at that deeper layer
3. Keep all fields **optional** — existing W7-normalized candidates and future memory records must not require them
4. Require GC-018 authorization before any further CPF contract change
5. Add tests using the established W7 normalization pattern if any new carrier surface is introduced
6. Do NOT add `confidence_score` or `truth_score` until scoring calibration is available

This note is the authorized intake reference for that future wave. The source folder
(`.private_reference/legacy/CVF ADDING NEW/Knowledge Base_Palace/`) should not be re-read for
this vocabulary — this note is the canonical CVF-native form.

---

## 6. What This Note Does NOT Do

- Does not implement W7MemoryRecord — no contract, no barrel, no tests
- Does not, by itself, authorize fields beyond the W72-T6 candidate-layer enrichment already landed
- Does not absorb Palace code (`cvf_mem_memory_schema.py` remains in `.private_reference/`)
- Does not grant canon status to any Palace vocabulary — all fields remain Candidate
- Does not activate `confidence_score` or `truth_score` — both remain Deferred
- Does not create a new architecture surface

---

*Filed: 2026-04-14 — W72-T3 CP1 Knowledge Preference Benchmark Criteria + W7 Vocabulary Enrichment*
