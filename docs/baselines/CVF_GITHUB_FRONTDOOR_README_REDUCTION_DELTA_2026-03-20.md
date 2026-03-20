# CVF GitHub Front-Door README Reduction Delta

Date: `2026-03-20`
Type: Baseline delta
Parent checkpoint: `docs/reviews/CVF_INDEPENDENT_SYSTEM_CHECKPOINT_2026-03-20.md`

## Purpose

- reduce the top-level GitHub README back to a true front-door artifact
- improve scanability for new readers, reviewers, and future maintainers
- replace oversized inlined reference content with compact navigation into the authoritative docs set

## Change Summary

This batch restructures `README.md` into a shorter landing page with:

- one short system overview
- a quick-link navigation bar that acts as tab-like front-door routing
- compact start paths for new user, non-coder, coder, and auditor personas
- one truthful current-status snapshot
- a concise repository map
- grouped links into the canonical docs, governance, and evidence set

Updated files:

- `README.md`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`

## Why This Delta Exists

The previous root README had grown into a mixed-purpose document containing:

- entrypoint guidance
- architecture summary
- version catalogue
- feature catalogue
- governance framing
- project status

That made the GitHub landing page harder to scan and pushed authoritative details away from their canonical homes.

This delta restores the intended split:

- `README.md` as the repository front door
- `docs/` as the authoritative long-form record

## Reconciliation Readout

- front-door readability: improved
- active-wave status truthfulness: preserved
- canonical doc ownership: improved
- detailed reference content: retained in dedicated docs rather than duplicated at the repository root

## Verification

- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
