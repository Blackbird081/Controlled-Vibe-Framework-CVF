# CVF Front-Door Rewrite Roadmap

Memory class: SUMMARY_RECORD

> Date: 2026-04-20
> Class: PRODUCT / CORPUS_QUALITY / EXECUTION_ROADMAP
> Status: CLOSED DELIVERED — strict front door all-trusted as of 2026-04-21
> Authority: `docs/assessments/CVF_FRONT_DOOR_PACKET_CLASSIFICATION_2026-04-20.md`

---

## Goal

Finish the front-door cleanup now, before any unrelated expansion work, so the public/default non-coder corpus becomes uniformly trusted instead of merely packet-consistent.

Success means:

- front-door packet/export/runtime behavior stays standardized
- every linked front-door template becomes `TRUSTED_FOR_VALUE_PROOF`
- reject/unscreened/review-only surfaces stop leaking into the strict front door

---

## Program Rule

Until this roadmap is complete:

1. no new front-door template should be added unless it lands already packet-ready and classified
2. rewrite work should prioritize removing non-trusted linked surfaces from visible skills before expanding the corpus
3. benchmark truth remains anchored to the frozen trusted subset, not the broader visible corpus

---

## Progress Update — 2026-04-21 Closeout

Wave 0 through Wave 4 are now delivered.

Delivered outcomes:

- trusted benchmark metadata corrected so `api_design` is no longer falsely counted as benchmark-trusted
- `web_build_handoff` formally promoted out of `UNSCREENED_LEGACY`
- `architecture_review` removed from strict front-door linkage
- all 10 former `REVIEW_REQUIRED` linked templates were rewritten into plain-language packet-safe front-door mode
- strict front door now carries **50/50 linked templates as `TRUSTED_FOR_VALUE_PROOF`**
- strict front door carries **0 linked review**, **0 linked reject**, and **0 linked unscreened** surfaces

Reference notes:

- `docs/baselines/CVF_FRONT_DOOR_WAVE1_EXECUTION_NOTE_2026-04-21.md`
- `docs/baselines/CVF_FRONT_DOOR_WAVE2_EXECUTION_NOTE_2026-04-21.md`

---

## Wave 0 — Governance Sync

Purpose: make the inventory truthful before broad rewrites.

Deliverables:

- keep `trusted benchmark subset` parsing exact so explanatory notes cannot promote a template by accident
- rebuild `skills-index.json` from the corrected governance source
- file the current 42-skill / 51-template front-door classification baseline

Exit:

- benchmark-trusted count is 9, matching D3
- `api_design` is no longer surfaced as benchmark-trusted in generated metadata

Status: DELIVERED 2026-04-20

---

## Wave 1 — Immediate Front-Door Hygiene

Purpose: remove the two highest-risk posture mismatches first.

Targets:

- `web_build_handoff`
- `architecture_review`

Required outcomes:

- `web_build_handoff` receives formal D2/D3-style rescreen treatment and lands as either `TRUSTED_FOR_VALUE_PROOF` or downgraded from the strict front door
- `architecture_review` is removed from strict non-coder linkage unless it is replaced by a truly non-coder system review surface

Exit:

- zero `UNSCREENED_LEGACY` linked templates remain on the strict front door
- zero `REJECT_FOR_NON_CODER_FRONTDOOR` linked templates remain on the strict front door

Status: DELIVERED 2026-04-21

---

## Wave 2 — Plain-Language Rewrite Batch

Purpose: convert the review-only templates whose main problem is user-facing technicality.

Targets:

- `code_review`
- `documentation`
- `data_analysis`
- `ab_test_review`
- `api_security`
- `data_handling`
- `api_design`
- `vibe_logic_mapping`

Rewrite rule:

- inputs must ask for goals, examples, user flows, constraints, and evidence in plain language
- hidden technical framing must move into the generated packet, not stay in the form
- outputs must end with an action layer a non-coder can review and hand off

Exit:

- each rewritten surface passes packet audit
- each rewritten surface is ready for re-classification from `REVIEW_REQUIRED` toward `TRUSTED_FOR_VALUE_PROOF`

Status: DELIVERED 2026-04-21

---

## Wave 3 — Lane Split And Advanced Surface Decision

Purpose: resolve the templates that may belong on a different lane rather than just needing wording cleanup.

Targets:

- `app_builder_complete`
- `web_ux_redesign_system`

Decision rule:

- if the template can be simplified without losing quality, rewrite for strict front-door use
- if the template fundamentally depends on expert review, move it to an explicit review-required or power-user lane and keep the strict front door on the simpler companion surface

Exit:

- no visible skill mixes a strict non-coder lane with an uncontained advanced lane

Status: DELIVERED 2026-04-21

---

## Wave 4 — Reclassification Closeout

Purpose: lock repo truth after the rewrites land.

Deliverables:

- update the corpus rescreen baseline for any promoted or downgraded surfaces
- refresh `skills-index.json`
- rerun front-door packet audit and relevant governed-path tests
- file a short closeout note stating whether the strict front door is now all-trusted

Exit:

- every linked front-door template is packet-ready and `TRUSTED_FOR_VALUE_PROOF`
- the strict front door is ready for further product work without corpus debt

Status: DELIVERED 2026-04-21

---

## Priority Order

1. preserve the all-trusted posture as the default gate for any new front-door surface
2. require packet-ready + classified status before expansion work touches the public front door
3. keep benchmark truth anchored to the frozen trusted subset unless a separate benchmark authority updates it
4. treat Wave 1 and Wave 2 notes as the closeout authority for the current 42-skill / 50-template front door

---

*Filed: 2026-04-20 — front-door rewrite roadmap; closed 2026-04-21*
