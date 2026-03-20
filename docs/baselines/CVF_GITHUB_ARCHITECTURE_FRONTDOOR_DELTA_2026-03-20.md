# CVF GitHub Architecture Front-Door Delta

Date: `2026-03-20`
Type: Baseline delta
Parent checkpoint: `docs/reviews/CVF_INDEPENDENT_SYSTEM_CHECKPOINT_2026-03-20.md`

## Purpose

- add one visual architecture landing page at the repository root
- make the CVF structure easier to understand for GitHub readers at first glance
- separate front-door architectural orientation from deeper verification-oriented architecture artifacts

## Change Summary

This batch adds a new root-level architecture landing page:

- `ARCHITECTURE.md`

and aligns the repository front door so users can reach it quickly from:

- `README.md`

Updated files:

- `ARCHITECTURE.md`
- `README.md`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`

## Why This Delta Exists

The repository already contained detailed architecture records, but they were not optimized for first-contact reading on GitHub.

This delta adds a cleaner front-door layer with:

- one system-shape diagram
- one dependency-rule diagram
- one active-reference-path diagram
- one governed interaction sequence

The deeper references remain authoritative for detailed inspection:

- `docs/reference/CVF_ARCHITECTURE_MAP.md`
- `EXTENSIONS/ARCHITECTURE_SEPARATION_DIAGRAM.md`
- `CVF_ECOSYSTEM_ARCHITECTURE.md`

## Readout

- architecture visibility for new readers: improved
- root-level GitHub front-door navigation: improved
- architectural truthfulness: preserved
- detailed verification artifacts: retained without duplication pressure on `README.md`

## Verification

- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
