# CVF Multi-Agent Intake Review — Pre-Public Repository Restructuring

Memory class: FULL_RECORD

> Review mode: `MULTI_AGENT_INTAKE_REVIEW`
> Perspective: independent Enterprise Architect intake review for rebuttal by other EAs
> Purpose: evaluate whether the pre-public repository restructuring plan (P0-P5), lifecycle/exposure classification system, and publication decision posture are architecture-safe and governance-compliant before any physical relocation or publication authorization proceeds

---

## 1. Review Target

- Review ID: `PREPUBLIC_RESTRUCTURING_2026-04-02`
- Date: `2026-04-02`
- Proposal set: pre-public repository restructuring — lifecycle classification (GC-037), exposure classification (GC-038), publication model selection, and phased relocation planning
- Canonical source artifacts:
  - `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
  - `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
  - `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
  - `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
  - `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
  - `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`
  - `governance/toolkit/05_OPERATION/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md`
  - `governance/toolkit/05_OPERATION/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md`
  - `governance/compat/check_repository_lifecycle_classification.py`
  - `governance/compat/check_repository_exposure_classification.py`
  - `governance/compat/run_local_governance_hook_chain.py`
  - `.github/workflows/documentation-testing.yml`

## 2. Proposal Summary

- what is being proposed:
  - a governed, phased approach to preparing the CVF repository for potential public presentation or selective publication
  - Phase P0: inventory all roots + extensions and create machine-readable lifecycle registries with both lifecycle and exposure classifications
  - Phase P1: review root-level folders for architecture-facing clarity and mark obvious freeze/retire candidates
  - Phase P2: classify extension lifecycle families and tie legacy `CVF_ECO*` families to current ownership
  - Phase P3 (future, blocked): physical folder relocation under `GC-019` only after P0-P2 complete
  - Phase P4 (future, blocked): public navigation, packaging, and publication model selection
  - Phase P5 (future, blocked): retirement and archive closure
  - two new governance controls: `GC-037` (lifecycle classification guard) and `GC-038` (exposure classification guard)
  - a publication decision memo ranking four publication models, recommending `private-by-default, selective-publication-only`
- why it exists now:
  - CVF has accumulated 20 top-level root directories and 48 extension roots over multiple development waves from v1.0 through W34-T1
  - some roots are legacy, some merged, some frozen reference — but none had formal lifecycle classification until this batch
  - any future public GitHub decision requires knowing which surfaces are safe to expose
  - evidence: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:6-10`
- expected value:
  - prevent accidental IP exposure when public packaging is eventually considered
  - give future `GC-019` relocation waves a machine-readable classification baseline instead of appearance-based guessing
  - separate the concern of "what is this root architecturally" from "how may this root be published"

## 3. Four-Question Alignment

- model / phase fit:
  - strong fit — this is a classification and governance-preparation proposal, not an implementation wave
  - it correctly defers physical moves (P3) and publication decisions (P4) until classification is mature
  - evidence: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:14-20`, `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:147-152`
- authority / guard fit:
  - strong — two new guards (GC-037, GC-038) are properly registered, enforced in hook chain and CI
  - GC-037 enforced by `governance/compat/check_repository_lifecycle_classification.py` — verified: `run_local_governance_hook_chain.py:154-156`
  - GC-038 enforced by `governance/compat/check_repository_exposure_classification.py` — verified: `run_local_governance_hook_chain.py:157-160`
  - CI enforcement in `.github/workflows/documentation-testing.yml:449` and `.github/workflows/documentation-testing.yml:466`
  - evidence: `governance/toolkit/05_OPERATION/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md:1-7`, `governance/toolkit/05_OPERATION/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md:1-7`
- risk / R0-R3 fit:
  - P0-P2 are `R1` classification-only work — no runtime, code, or structural changes
  - P3 would be `R2-R3` structural relocation — correctly blocked pending future authorization
  - evidence: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:121-129`
- machine-enforceability / decision-value fit:
  - high machine-enforceability for lifecycle and exposure — both have JSON registries, Python checkers, hook + CI enforcement
  - decision value is high: classification data makes later publication decisions grounded rather than assumption-based
  - enforcement gap: root-level files (README.md, CLAUDE.md, etc.) are not covered by the current registry schema
  - evidence: `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json:42-63`, `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json:14-63`

## 4. Integration Mapping

- target plane / layer:
  - this is cross-cutting governance and repository-level structure — it does not belong to one specific plane
  - it affects docs, governance, extensions, and root-level organization simultaneously
- target ownership:
  - repository-level ownership decision; falls under Meta Governance authority
  - evidence: `ARCHITECTURE.md:8-14`
- likely adjacent modules:
  - `docs/INDEX.md` — updated to reference new restructuring artifacts: `docs/INDEX.md:130-137`
  - `docs/reference/CVF_RELEASE_MANIFEST.md` — affected if publication model changes
  - `governance/compat/core-manifest.json` — affected if guard numbering changes
  - `AGENT_HANDOFF.md` — not yet updated with restructuring context
- likely downstream governed move:
  - if P0-P2 close successfully: `GC-019` structural audit for P3 physical relocation
  - publication model decision after P2 per `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md:212-220`

## 5. Overlap / Conflict Scan

- overlapping concepts:
  - lifecycle classification partially overlaps with the existing `CVF_EXTENSION_LIFECYCLE_REGISTRY` concept already tracking extensions — but the root-level registry is genuinely new
  - exposure classification is a completely new axis — no prior CVF artifact covers this
- duplicate runtime or ownership risk:
  - low — the two registries share the same JSON file schema but enforce different things (lifecycle vs exposure)
  - the `check_repository_lifecycle_classification.py` and `check_repository_exposure_classification.py` are separate scripts with no shared runtime
- conflicting assumptions:
  - **finding C1**: the roadmap says "P0-P2 may proceed now" as a single authorization block, but there is no formal phase-gate between P0, P1, and P2 — this could lead to P2 being declared complete without P1 review
  - **finding C2**: `docs/` is tagged `PUBLIC_DOCS_ONLY` but contains 173KB `CVF_INCREMENTAL_TEST_LOG.md`, 74KB `CVF_ARCHITECTURE_DECISIONS.md`, and 45KB `CVF_CORE_KNOWLEDGE_BASE.md` — these are internal-density files that would be unusual in a public docs mirror
  - evidence: `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json:52`, `docs/CVF_INCREMENTAL_TEST_LOG.md` (173,804 bytes per filesystem)
  - **finding C3**: 14 extensions tagged `PUBLIC_EXPORT_CANDIDATE` vary drastically in maturity — `CVF_CONTROL_PLANE_FOUNDATION` has 2561 tests while `CVF_PLANE_FACADES` is a thin facade layer
  - evidence: `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json:15-17,31-36`, `AGENT_HANDOFF.md:17`
  - **finding C4**: root-level files (README.md, LICENSE, CLAUDE.md, AGENT_HANDOFF.md, .dt.log, .git_commit_error.log, package.json, netlify.toml) have no lifecycle or exposure classification
  - evidence: filesystem listing of repository root — 18 root files exist but only directories are registered in `CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
  - **finding C5**: the Publication Decision Memo has no time boundary — classification data can become stale if the publication decision is deferred indefinitely without re-assessment

## 6. Risk Register

- key risk 1:
  - **phase-gate absence** — P0/P1/P2 run as one authorized block without formal closure gates, creating a risk that later phases (P3) are authorized based on incomplete intermediate work
  - severity: MEDIUM
  - mitigation: add a lightweight phase-gate tracking artifact
- key risk 2:
  - **false export readiness signal** — `PUBLIC_EXPORT_CANDIDATE` tag may be misread as "ready to export" when many tagged extensions are concept-only or thin facades
  - severity: MEDIUM-HIGH
  - mitigation: add `exportReadiness` sub-classification (READY / NEEDS_PACKAGING / CONCEPT_ONLY) before any actual export decision
- key risk 3:
  - **root-level file exposure** — if a `PUBLIC_CORE_REDUCED` or `FULL_PUBLIC_MONOREPO` model is chosen, root-level files like `CLAUDE.md`, `AGENT_HANDOFF.md`, `.dt.log` would be exposed without classification
  - severity: HIGH (if full-public or reduced-public model is chosen)
  - mitigation: extend registry schema or create a separate root-file classification
- defer risk:
  - if the publication decision is deferred too long, classification data becomes stale as new modules, roots, or wave outputs change the repository shape
  - mitigation: `Decision-By` deadline in the memo
- rollback confidence:
  - HIGH for P0-P2 — classification is documentation-only, fully reversible
  - MEDIUM for P3 — folder moves may break paths, imports, scripts
  - LOW for P4 — once published publicly, re-closing is practically impossible

## 7. Decision

- current decision: `GO WITH FIXES`
- rationale:
  - the overall approach is **architecturally sound**: classify first, move second, publish last
  - the governance enforcement (GC-037 + GC-038 across script, hook chain, CI) is **complete and verified**
  - the publication posture (`private-by-default`) is the **safest possible starting point**
  - however, five findings (C1-C5) need resolution before P3 authorization
  - P0-P2 classification work is safe to continue immediately
  - the `GO WITH FIXES` decision applies to the overall restructuring plan; P3-P5 remain `BLOCKED` as designed

## 8. Required Pass Conditions

- condition 1:
  - **phase-gate mechanism** — before P3 authorization, a formal P0/P1/P2 closure document or tracking artifact must exist confirming each phase's exit conditions are met
  - gating evidence: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:77-80,94-97,110-113`
- condition 2:
  - **export readiness sub-classification** — every `PUBLIC_EXPORT_CANDIDATE` extension must have a secondary readiness indicator before any actual export packaging wave
  - gating evidence: `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json:14-62`
- condition 3:
  - **root-level file classification** — extend the classification system to cover root-level files (not just directories), or explicitly document which root files are internal-only
  - gating evidence: filesystem root listing — `README.md`, `LICENSE`, `ARCHITECTURE.md`, `CLAUDE.md`, `AGENT_HANDOFF.md`, `.dt.log`, etc.
- condition 4:
  - **content audit for PUBLIC_DOCS_ONLY roots** — before P3, verify that every root tagged `PUBLIC_DOCS_ONLY` contains only content appropriate for public docs mirrors, not internal test logs or dense ADR archives
  - gating evidence: `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json:52,56`, `docs/CVF_INCREMENTAL_TEST_LOG.md` (173,804 bytes)
- condition 5:
  - **decision timeline** — add a `Decision-By` or `Re-assessment-By` clause to the Publication Decision Memo to prevent indefinite deferral
  - gating evidence: `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md:232-238`

## 9. Evidence Ledger

- evidence 1: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:1` — roadmap header and purpose
- evidence 2: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:14-20` — guiding rule: classify before move
- evidence 3: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:34-48` — four publication models
- evidence 4: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:67-80` — P0 exit conditions
- evidence 5: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:82-97` — P1 exit conditions
- evidence 6: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:99-113` — P2 exit conditions
- evidence 7: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:121-129` — P3 requires GC-019
- evidence 8: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:147-152` — P0-P2 authorized now, P3-P5 blocked
- evidence 9: `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md:1-4` — canonical lifecycle classification document
- evidence 10: `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md:14-19` — four lifecycle classes defined
- evidence 11: `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md:25` — machine-readable registry reference
- evidence 12: `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md:72-78` — public GitHub cloning implication
- evidence 13: `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md:1-4` — canonical exposure classification document with `private-by-default` rule
- evidence 14: `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md:21-26` — four exposure classes defined
- evidence 15: `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md:36-38` — root exposure summary
- evidence 16: `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md:55-61` — public GitHub cloning warning
- evidence 17: `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md:14-21` — recommended model ordering
- evidence 18: `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md:25-27` — private-by-default posture
- evidence 19: `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md:31-37` — core reality: public repo = full clone
- evidence 20: `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md:222-230` — what should not happen
- evidence 21: `governance/toolkit/05_OPERATION/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md:3-7` — GC-037 control definition
- evidence 22: `governance/toolkit/05_OPERATION/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md:3-7` — GC-038 control definition
- evidence 23: `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json:42-63` — 20 root directories classified
- evidence 24: `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json:14-63` — 48 extensions classified
- evidence 25: `governance/compat/run_local_governance_hook_chain.py:153-160` — GC-037 + GC-038 in pre-push chain
- evidence 26: `.github/workflows/documentation-testing.yml:449` — GC-037 in CI
- evidence 27: `.github/workflows/documentation-testing.yml:466` — GC-038 in CI
- evidence 28: `AGENT_HANDOFF.md:7` — current state: W34-T1 CLOSED DELIVERED, no active tranche
- evidence 29: `AGENT_HANDOFF.md:17-20` — test counts verifying foundational health
- evidence 30: `docs/assessments/CVF_POST_W32_CONTINUATION_QUALITY_ASSESSMENT_2026-04-01.md:39` — weighted quality total 9.17/10 EXCELLENT
- evidence 31: `docs/INDEX.md:130-137` — INDEX.md updated with restructuring references
- evidence 32: `ARCHITECTURE.md:8-14` — system shape and meta governance authority
- evidence 33: `governance/compat/check_repository_lifecycle_classification.py:1-4` — lifecycle gate script exists and is functional (verified: 0 violations)
- evidence 34: `governance/compat/check_repository_exposure_classification.py:1-4` — exposure gate script exists and is functional (verified: 0 violations)
- evidence 35: `governance/compat/check_repository_exposure_classification.py:92-93` — cross-validation: FROZEN_REFERENCE cannot be PUBLIC_EXPORT_CANDIDATE
- evidence 36: `governance/compat/check_repository_exposure_classification.py:121-126` — content checks: doc must say "private-by-default", "cloned as a whole", guard must say "does not itself authorize publication"
