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

## Isolation Guarantee Claim Boundary (RFR-R5 / F9)

`WorkerThreadSandboxAdapter` (`./adapters`) declares
`WORKER_THREAD_GUARANTEE_PROFILE`: every one of the eight canonical isolation
dimensions (`filesystem`, `network`, `process`, `environment`, `credential`,
`ipc`, `persistence`, `host`) is `false`. Node `worker_threads` share the host
process's memory space, filesystem access, and network stack; they are not a
security boundary for any of these dimensions. `SandboxIsolationContract`
(Safety Runtime) evaluates a caller's `isolationRequirement` against this
profile before the adapter, worker, or child process is ever created, so a
`SECURITY_BOUNDARY_REQUIRED` requirement can never select this adapter; only
an explicit `BEST_EFFORT_EXPLICIT` requirement with zero required dimensions
may execute on `worker_threads`, and the resulting admission evidence never
describes that execution as a guaranteed containment boundary. This package's
export surface makes no physical-isolation, container, or production-security
claim for `worker_threads`; a real security boundary requires a different
platform (`docker`, `v8_isolate`) behind the same `SandboxExecutor` interface.

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
