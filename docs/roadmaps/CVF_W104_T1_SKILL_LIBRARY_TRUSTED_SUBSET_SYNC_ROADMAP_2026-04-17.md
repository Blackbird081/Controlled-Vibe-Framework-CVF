# CVF W104-T1 Skill Library Trusted Subset Sync Roadmap

Memory class: POINTER_RECORD

> Purpose: sync the public `/skills` surface to the GC-044 governed corpus posture so the front-door skill library no longer mixes trusted benchmark surfaces with quarantined legacy inventory
> Status: CLOSED DELIVERED
> Scope class: PRODUCT / FRONT_DOOR_SYNC

## Target

Move the web `Skill Library` front door from a mixed legacy explorer to a governed subset explorer aligned with:

- `CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md`
- `CVF_CORPUS_RESCREEN_D2_MATRIX_2026-04-15.md`
- `CVF_CORPUS_RESCREEN_D3_TRUSTED_SUBSET_2026-04-15.md`

## Delivered Sequence

1. Derive corpus-governance truth from D2/D3 authorities plus template-to-skill mappings.
2. Regenerate `public/data/skills-index.json` as a governed payload with:
   - front-door visible categories
   - archive/quarantine categories
   - governance summary metadata
3. Sync `SkillLibrary`, detail pages, search, and planner to the same front-door subset.
4. Keep quarantined skills out of public discovery while preserving direct detail resolution for provenance/debug.
5. Upgrade spec export wording so generated specs inherit current CVF non-coder, governed-response, and knowledge-context posture.
6. Sync README, whitepaper, tracker, public claim statement, and handoff to the new truth boundary.

## Closure Outcome

- Front-door `/skills` now exposes only `TRUSTED_FOR_VALUE_PROOF` and `REVIEW_REQUIRED` surfaces.
- `LEGACY_LOW_CONFIDENCE`, `REJECT_FOR_NON_CODER_FRONTDOOR`, and unscreened legacy surfaces are quarantined from front-door discovery.
- Search and planner now consume the same governed front-door subset as the main library.
- Benchmark/value-proof claims remain bound to `TRUSTED_FOR_VALUE_PROOF` only.

## Boundaries

- This tranche does **not** prove that every visible front-door skill is benchmark-trusted.
- This tranche does **not** reopen multi-provider work.
- This tranche does **not** delete legacy files from repo history; it removes them from public discovery and places them in archive/quarantine handling.
