# CVF MPI-T2 Scan Registry Episodic Read Projection

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-22

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This is a canonical
reference contract for a runtime helper, authorized by the MPI-T2 GC-018
baseline. Per the INDEX classification standard, a GOVERNED_DOC is not labeled
with an INDEX type.

EPISTEMIC_PROCESS_NA_WITH_REASON: reference contract - it defines the IO shape
and boundary of a deterministic read projection helper; it makes no evidence
comparison claim requiring the full epistemic process block.

## Purpose

Define the contract for the MPI-T2 scan-registry episodic read projection
helper. The helper turns GC-051 Corpus Scan Registry findings into summary-only
Memory readout candidate-compatible records, so an internal agent can retrieve
prior scan findings through the existing summary-only Memory readout surface
without making the scan registry a write authority and without changing the
authenticated Memory readout route.

This tranche delivers a helper and focused tests only. It does not wire the
projection into the route as an automatic data source.

## Scope / Applies To

Applies to the MPI-T2 read projection helper
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/scan-registry-memory-projection.ts`
and its focused tests. It governs how GC-051 registry findings are projected
into Memory readout candidate-compatible records.

Does not apply to the Memory readout route, the Memory write route, the registry
sources or generated aggregate, the durable store, or any route wiring. Those
surfaces are unchanged by this tranche and remain governed by their own
contracts.

## Source Authority

| Source | Role |
|---|---|
| `docs/baselines/CVF_GC018_MPI_T2_SCAN_REGISTRY_EPISODIC_READ_PROJECTION_2026-06-22.md` | GC-018 authorization |
| `docs/reference/CVF_CORPUS_SCAN_REGISTRY_STANDARD_2026-06-02.md` | GC-051 registry/finding field authority and Finding Discovery Rule |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | existing authenticated route and candidate schema |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/memory-runtime-readout.ts` | existing summary-only sanitization invariants |
| `docs/reference/CVF_MEMORY_PLANE_MAP.md` | Memory Plane front-door map (MPI-T1) |

## Helper Location

- Helper: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/scan-registry-memory-projection.ts`
- Tests: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/scan-registry-memory-projection.test.ts`

## Input Contract

The helper accepts already-parsed registry entries. It does not read the
filesystem and does not parse the generated aggregate itself; the caller is
responsible for supplying parsed `ScanRegistryEntry[]` from a governed source.

Narrow consumed subset of a GC-051 registry entry:

| Field | Type | Use |
|---|---|---|
| `id` | string | source attribution and candidate id |
| `scopePaths` | string[] (optional) | candidate scope (first path, else entry id) |
| `semanticRegions` | string[] (optional) | keyword match surface (Finding Discovery Rule) |
| `findings` | ScanRegistryFinding[] (optional) | projected one candidate per matched finding |

Narrow consumed subset of a GC-051 finding:

| Field | Type | Use |
|---|---|---|
| `id` | string | source attribution and candidate id |
| `summary` | string | candidate summary (bounded) and keyword match surface |

Other finding fields (`disposition`, `nextAction`, `defectClass`,
`learningLane`) are accepted in the type but are not copied into projected
candidates in this tranche.

## Matching Rule

The helper reuses the GC-051 Finding Discovery Rule:

1. Extract deterministic lowercase keyword tokens from the query (tokens shorter
   than 3 characters are dropped, duplicates removed).
2. Match keywords against entry `semanticRegions` and against
   `findings[].summary` (case-insensitive substring).
3. If a `semanticRegion` matches, every well-formed finding of that entry is
   projected (the region match makes the whole entry relevant).
4. If only a `findings[].summary` matches, only that finding is projected.
5. No query keywords, no entries, or no match returns an empty list.

## Output Contract

Each projected candidate is a Memory readout candidate-compatible record with no
raw content:

| Field | Value |
|---|---|
| `id` | `scan-registry:<entryId>:<findingId>` |
| `scope` | entry first `scopePath`, else entry `id` |
| `summary` | finding summary, bounded to 280 characters |
| `createdAt` | deterministic option (default 0) |
| `auditTrust` | deterministic option (default 0.5) |
| `lifecycleState` | `episodic` |
| `source` | `{ kind: 'scan-registry-finding', entryId, findingId, matchedOn }` |

`createdAt`, `auditTrust`, and `lifecycleState` are projection metadata, not
source authority. They exist so the projected record is shape-compatible with
the Memory readout candidate schema. They do not assert a real memory lifecycle
state, audit-trust score, or creation time of the underlying finding.

A projected candidate carries no `content` field. The summary is a bounded copy
of the finding summary only. The helper preserves input immutability and emits
one stable candidate per matched finding, de-duplicated by `entryId:findingId`.

## Readout Compatibility

Projected candidates can be passed as the `candidates` array to the existing
Memory readout body or to `buildMemoryRuntimeReadout`. Doing so preserves the
existing summary-only invariants: `rawMemoryReleased=false`,
`canReinject=false`, candidate `content` stripped, and no RAW sentinel leakage.
A focused test passes projected candidates through `buildMemoryRuntimeReadout`
to prove these invariants hold.

## Boundary

- No Memory readout route edit, route auth change, or route schema change.
- No registry write, registry source/aggregate edit, registry generator run, or
  registry Markdown edit.
- No durable store write, no Learning Plane runtime mutation.
- No filesystem write and no direct filesystem read inside the helper.
- No provider/live proof, no public-sync, no CLI/MCP adapter behavior, no vector
  DB, no graph persistence, no readiness or production claim.
- The projection is a rebuildable derived view of the registry per-entry
  sources. It is never a source of authority that overrules the registry.

## Route Wiring Status

This tranche does not wire the projection into `POST /api/memory/readout` as an
automatic data source. The route continues to accept caller-supplied candidates
unchanged. Wiring the projection as a route-side data source (so the route
itself loads and projects registry findings) is a separate future tranche that
requires its own GC-018 because it would change route behavior.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | MPI-T2 read projection helper contract only |
| claimDisposition | N/A with reason: no Delta execution-control behavior is implemented or claimed |
| receiptEvidence | N/A with reason: no Delta receipt is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | deterministic local helper called by a caller that supplies parsed registry data |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | summary-only read projection helper and reference contract only |
| forbiddenExpansion | route edit, registry write, durable write, provider/live, public-sync, CLI/MCP adapter, queue/daemon, watcher, readiness, full-hook equivalence, cost optimization, and universal control remain out of scope |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance MPI-T2 helper contract. No public-sync remote, public
commit, public artifact path, or public claim is authorized.

## Claim Boundary

This contract governs only the MPI-T2 read projection helper and its focused
tests. It does not authorize Memory readout route edits, route schema changes,
registry writes, durable writes, registry generator changes, provider/live
proof, public-sync, CLI/MCP adapter behavior, vector DB, graph persistence,
direct interception, queue/daemon, watcher, readiness, cost optimization, or
universal governed-coding control.
