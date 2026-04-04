# CVF Pre-Public Runtime Adapter Hub Export Surface — 2026-04-03

Memory class: POINTER_RECORD
Status: canonical candidate-scoped implementation reference for `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` in the first-wave export lane.

## Purpose

- preserve the canonical root entrypoint and explicit export map for `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
- make adapter-hub publication planning more precise than the legacy “manifest only” shape
- keep capability promises explicit and named

## Canonical Entry Rule

Preferred entry:

- root barrel:
  - `index.ts`

Explicit subpaths currently allowed:

- `./contracts`
- `./adapters`
- `./policy`
- `./explainability`
- `./risk-models/risk-matrix`
- `./risk-models/destructive-rules`
- `./risk-models/external-comm-rules`
- `./risk-models/escalation-thresholds`

## Explicitly Deferred

- wildcard subpaths
- any claim that all adapters share one undifferentiated safe-default capability posture
- additional assets beyond the four named JSON risk-model files
- `READY_FOR_EXPORT` uplift
- public package publication

## Packet Consequences

- package now has a real canonical root barrel
- package manifest now declares explicit `exports` and `files`
- package README now describes the bounded first-wave story
- package-level tests now lock both root-barrel availability and package boundary

## Related Artifacts

- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/package.json`
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/index.ts`
