# CVF P4 CP4 Audit - Shortlist Packaging Boundary Definition

Memory class: FULL_RECORD

> Decision type: `GC-019` structural/publication-planning audit
> Pre-public phase: `P4`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID:
  - `GC019-P4-CP4-SHORTLIST-PACKAGING-BOUNDARY-DEFINITION-2026-04-02`
- Date:
  - `2026-04-02`
- Proposed target:
  - define the first bounded packaging boundary for the `P4/CP3` export shortlist
  - keep future export-planning work candidate-scoped rather than backlog-shaped
- proposed outputs:
  - one canonical shortlist-packaging-boundary reference
  - explicit candidate-by-candidate boundary notes for the three shortlisted modules
  - one rule that all three remain `NEEDS_PACKAGING`
- proposed change class:
  - `boundary-definition / packaging-scope refinement`

## 2. Scope

- in scope:
  - define packaging-boundary expectations for `CVF_GUARD_CONTRACT`
  - define packaging-boundary expectations for `CVF_v3.0_CORE_GIT_FOR_AI`
  - define packaging-boundary expectations for `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
  - record cross-cutting packaging rules for first-wave export work
- out of scope:
  - package publication
  - `exportReadiness` changes
  - manifest or source-code edits inside the shortlisted extensions
  - release automation

## 3. Source-Truth Context

- `P4/CP3` already narrowed first-wave export planning to:
  - `CVF_GUARD_CONTRACT`
  - `CVF_v3.0_CORE_GIT_FOR_AI`
  - `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
- all three remain classified in `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json` as:
  - `ACTIVE_CANONICAL`
  - `PUBLIC_EXPORT_CANDIDATE`
  - `NEEDS_PACKAGING`
- without a packaging-boundary packet, the shortlist is still too easy to interpret as an unbounded future export program

## 4. Candidate Reality Check

### `CVF_GUARD_CONTRACT`

- strengths:
  - explicit package identity already exists
  - root barrel and subpath exports already exist
  - test coverage and module family shape look package-oriented
- packaging caution:
  - current manifest exposes broad wildcard runtime subpaths and an enterprise subpath
  - provider-specific runtime integrations and SQLite-backed audit persistence should not become accidental first-wave support promises

### `CVF_v3.0_CORE_GIT_FOR_AI`

- strengths:
  - explicit package identity already exists
  - root barrel already groups the exported primitive families coherently
  - the module reads like a bounded foundational toolkit rather than a plane-scale family
- packaging caution:
  - the public boundary still needs explicit export mapping in a later implementation packet
  - packaging should stay limited to the core primitive families already surfaced by the barrel

### `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`

- strengths:
  - explicit package identity already exists
  - internal structure already separates contracts, adapters, explainability, policy, and risk models
  - the candidate fits the selective-export narrative better than a broad plane foundation
- packaging caution:
  - the root currently lacks a canonical `index.ts` barrel and an explicit package `exports` map
  - adapter capability levels are materially different from each other
  - risk-model JSON assets require explicit packaging treatment

## 5. Recommended Boundary Rule

- define first-wave packaging as candidate-scoped boundary planning, not readiness escalation
- require future implementation packets to anchor on:
  - canonical entrypoints
  - explicit export maps
  - documented optional vs stable surfaces
  - explicit non-code asset inclusion where applicable

## 6. Recommended Per-Candidate Boundary

- `CVF_GUARD_CONTRACT`:
  - first-wave scope should center on root barrel, types, engine, explicit guard family, and already-root-barreled coordination/handoff helpers
  - provider-specific runtime integrations and SQLite persistence should remain boundary-cautioned
- `CVF_v3.0_CORE_GIT_FOR_AI`:
  - first-wave scope should center on the root barrel plus `ai_commit`, `artifact_staging`, `artifact_ledger`, `process_model`, and `skill_lifecycle`
  - broader workflow promises should remain out of scope
- `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`:
  - first-wave scope should center on `contracts`, `adapters`, `policy`, `explainability`, and `risk_models`
  - any later release must stratify adapter capability/safety expectations explicitly

## 7. Risk Assessment

- no packaging-boundary definition after shortlist:
  - `MEDIUM`
  - shortlist remains bounded in name only
- bounded packaging-boundary definition with no readiness change:
  - `LOW`
  - clarifies the next packet without widening exposure posture
- treating shortlist members as implicitly release-shaped:
  - `HIGH`
  - would overstate support and publication readiness

## 8. Recommendation

- recommended outcome:
  - `APPROVE P4/CP4`
- rationale:
  - this is the smallest planning refinement after `P4/CP3`
  - it improves later implementation clarity without changing public posture
  - it calls out the real packaging gaps, especially for `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`

## 9. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this packet defines boundaries only
  - it does not authorize package publication or export-readiness promotion
