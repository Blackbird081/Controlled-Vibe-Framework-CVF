# CVF GC-051 Corpus Scan Registry Guard

Memory class: FULL_RECORD

**Control ID:** `GC-051`

**Guard Class:** `CONTINUITY_AND_KNOWLEDGE`

**Status:** Active mandatory continuity rule for all corpus scan, classification,
and knowledge-absorption work in CVF and CVF-governed projects.

**Applies to:** All AI agents and human operators opening a corpus scan, running
GC-047/048/050 evidence gates, or implementing features derived from a scanned
corpus.

**Enforced by:** `governance/compat/check_corpus_scan_registry.py`

**Standard:** `docs/reference/CVF_CORPUS_SCAN_REGISTRY_STANDARD_2026-06-02.md`

**Generated registry:** `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json`

**Authoring sources:** `docs/corpus-intelligence/registry/`

---

## Purpose

Stop agents from:

1. Re-scanning a corpus that was already scanned by a prior agent or session.
2. Missing prior findings when implementing features in a domain that has already
   been analyzed.
3. Accumulating blind spots across sessions by scattering scan evidence in
   audit/review files that future agents cannot discover.

---

## Rule

### Before opening a corpus scan

1. Read `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json`.
2. Check whether the target corpus path matches any `scopePaths` entry.
3. Act on the match:
   - `NOT_STARTED` -> proceed with new scan; register entry before starting.
   - `PARTIALLY_SCANNED` -> continue from prior state; do not restart from zero.
   - `SCANNED` / `SCANNED_WITH_FINDINGS` / `DEEP_CLASSIFIED` -> inherit prior
     state; get explicit operator authorization before re-scanning.
   - `DEFERRED` / `OUT_OF_SCOPE` -> do not scan without operator authorization.

### After completing a corpus scan

1. Update the per-entry registry source under
   `docs/corpus-intelligence/registry/entries/`.
2. Add new `findings[]` entries.
3. Run `python governance/compat/generate_corpus_scan_registry.py --generate`.
4. Include the entry source and generated aggregate update in the same governed
   commit as the scan evidence.

### Before implementing features derived from a scanned corpus

1. Search `findings[]` for the relevant corpus entries.
2. Cite any pre-existing finding in the new work order.
3. Do not claim a gap as newly discovered if it is already in the registry.

---

## Machine Check

`governance/compat/check_corpus_scan_registry.py` checks:

1. **Required fields** - every entry has all mandatory fields.
2. **Finding disposition** - `SCANNED_WITH_FINDINGS` entries have at least one
   dispositioned finding.
3. **Manifest hash** - `COMPLETE_VERIFIED` GC-047 entries have non-null
   `manifestHash`.
4. **Changed audit coverage** - any changed `docs/audits/` file mentioning a
   corpus path has a registry entry for that path.
5. **Status vocabulary** - all `status` and `disposition` values are from allowed
   enums.
6. **Generated aggregate drift** - when per-entry sources exist,
   `CVF_CORPUS_SCAN_REGISTRY.json` must match the registry generated from
   `docs/corpus-intelligence/registry/`.

---

## Exemptions

No exemptions. If a corpus cannot be registered (e.g. transient test corpus),
the agent must add a `TEST_CORPUS` entry with `status: OUT_OF_SCOPE` and a
`nextScanRecommendation` explaining why.

---

## Enforcement Surface

`governance/compat/check_corpus_scan_registry.py` - wired into autorun gate
(gate 20) and local hook chain pre-commit. Checks required fields, finding
dispositions, manifest hashes, audit file coverage, and generated aggregate
drift.

`governance/compat/generate_corpus_scan_registry.py` - generates the aggregate
registry from reviewable per-entry source files and bootstraps the source
directory from the current aggregate.

## Related Artifacts

Standard: `docs/reference/CVF_CORPUS_SCAN_REGISTRY_STANDARD_2026-06-02.md`
Registry: `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json`
Registry source: `docs/corpus-intelligence/registry/`
Human companion: `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.md`
Findings folder: `docs/corpus-intelligence/findings/`

## Claim Boundary

This guard claims: enforcement of corpus scan registry consultation before
scanning and registry update after scanning. Does not claim semantic
correctness of registry entries; full coverage of all possible corpora;
production readiness.

## Final Clause

GC-051 is active from 2026-06-02. Any corpus scan without a registry entry
is a governance violation. The registry grows over time as new corpora are
scanned and new projects are onboarded.

## Relationship to Other Guards

| Guard | Relationship |
| --- | --- |
| GC-041 Surface Scan Registry | GC-041 covers CVF EXTENSION plane scans; GC-051 covers all other corpora including legacy, project, policy, and company docs |
| GC-047 Corpus Completeness | GC-047 produces the GC-047 verdict and manifest that GC-051 registers |
| GC-048 Knowledge Map Reconciliation | GC-048 verdict is registered in the GC-051 registry entry |
| GC-050 Corpus Intelligence Classification | GC-050 verdict is registered in the GC-051 registry entry |
| Knowledge Absorption Blind-Spot Standard | GC-051 registry is the machine-readable companion to the 7-gate blind-spot control block |
