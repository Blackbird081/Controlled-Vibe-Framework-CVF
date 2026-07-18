# CVF Memory Foundation Source-Derived Replay Contract

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference_contract

Date: 2026-06-28

Batch ID: EVEROS-T1

rawMemoryReleased=false

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a documentation reference contract surface; it does not make empirical or evidence-based claims that require prediction, evidence comparison, or contradiction disposition.

contractVersion: `cvf.memoryFoundation.sourceDerivedReplay.everosT1.v1`

## Purpose

Define the CVF-native memory foundation contract promoted from EVEROS-T0. The
contract absorbs the useful EverOS memory architecture pattern without copying
EverOS code, adopting its runtime, or creating a parallel memory system.

The governing chain is:

```text
canonical CVF source surface -> generated aggregate or derived index -> scoped retrieval -> receipt -> rebuild or denial when stale
```

## Scope / Target / Owner Boundary

In scope:

- canonical source surfaces and governed Markdown/source authority;
- generated aggregates and derived indexes as rebuildable views;
- stale, degraded, or conflicted derived-view denial;
- replay/rebuild receipt expectations;
- retrieval receipt minimum fields;
- privacy, retention, and redaction boundaries for future memory indexes;
- UTC-storage and display-time separation for future memory/index artifacts.

Out of scope:

- EverOS runtime, server, provider configuration, OME engine, cascade daemon, or
  watcher implementation;
- SQLite/LanceDB schema implementation, embedding/rerank, vector persistence,
  or database migrations;
- raw chat promotion, automatic skill promotion, prompt reinjection, public
  export, CLI/MCP adapter behavior, or MPI-T6 runtime reopening.

## Source Conversion Matrix

| Source input | Reused substance | CVF adaptation | Disposition |
|---|---|---|---|
| EVEROS-T0 roadmap | T1 contract route and audited value classification | converted into CVF-owned reference contract scope | ACCEPT_AS_CONTRACT |
| EverOS Markdown-first model | source material remains readable and rebuildable | mapped to CVF governed Markdown/source authority | ACCEPT_AS_DOCTRINE |
| EverOS SQLite/LanceDB split | system state and retrieval indexes are not truth | mapped to optional derived views, not required backend choices | ADAPT_WITH_BOUNDARY |
| EverOS cascade replay model | missed/failed derived updates need replay and recovery | mapped to derived-view rebuild/replay receipt rules | ADAPT_WITH_BOUNDARY |
| EverOS timestamp discipline | storage timestamps and display timestamps need separate rails | mapped to future CVF memory/index timestamp discipline | ACCEPT_AS_DOCTRINE |
| Operator-provided advisory package | read/write gates, retrieval receipts, privacy, rebuild | used as advisory phrasing; rewritten into CVF form | ADAPT_WITH_BOUNDARY |

## Source Authority Rule

CVF source authority is the governed source artifact, source file, or generated
aggregate source fragment that owns the claim.

Derived surfaces include:

- generated JSON aggregates;
- SQLite-style ledgers or metadata stores;
- graph, vector, semantic, or keyword indexes;
- cached summaries and context packs;
- readout projections;
- external-agent memory packs;
- prompt or retrieval packs assembled from prior sources.

Derived surfaces must not overrule source authority. If a derived surface and
source authority disagree, source authority wins and the affected derived
surface must be marked stale, degraded, or conflicted before use.

## Source And Derived Surface Classes

| Class | Examples | Authority |
|---|---|---|
| Canonical governed artifact | roadmap, GC-018, work order, review, reference contract | source authority within recorded scope |
| Runtime source file | checked implementation file with source-verified symbol | source authority for runtime behavior only |
| Generated aggregate source fragment | source fragment under a generated source layout | source authority for the aggregate |
| Generated aggregate | generated JSON or machine-readable read model | authority only if drift check passes |
| Derived index | graph, semantic/vector, FTS, metadata ledger, cache, context pack | advisory/rebuildable, never source authority |
| External input | external repo, copied folder, package, provider-local memory | advisory until mapped through a CVF owner surface |

## Derived View Rules

Derived views must satisfy these rules before a future worker may rely on them:

- identify their canonical source surface or source fragment;
- record their build or projection method;
- preserve source path, source hash, or source receipt pointer where possible;
- record scope filters and sensitivity filters;
- reject raw secret and private provenance indexing unless a future policy
  explicitly authorizes a safe metadata-only path;
- expose stale/degraded/conflicted state instead of silently returning data;
- remain rebuildable or explicitly mark why rebuild is blocked.

Derived views must not:

- widen role, workspace, project, risk, or sensitivity scope;
- convert unreviewed candidate memory into trusted fact;
- treat vector similarity as evidence;
- return raw memory where the source surface only permits summary readout;
- authorize prompt reinjection by existing in an index.

## Replay And Rebuild Contract

Future memory/index work should use these state tokens unless a later
source-verified contract supersedes them:

```text
VALID
STALE
DEGRADED
CONFLICTED
REBUILDING
PARTIAL_REBUILD
FAILED
DISABLED_BY_POLICY
```

Rebuild is required when:

- source hash changes;
- generated aggregate drift is detected;
- redaction changes source content;
- retention or sensitivity policy changes;
- source path or owner surface is moved;
- derived index build fails or is interrupted;
- derived rows cannot be traced to source authority.

When a derived view is stale, degraded, or conflicted, the safe responses are:

- rebuild first;
- return a denial receipt;
- fall back to authorized source lookup with explicit warning;
- block the operation if source lookup would violate scope or sensitivity.

Before executing a rebuild, the source hash must be verified against current source authority. Rebuilding from a stale or conflicted source must be blocked until the source path is restored or the index is marked DISABLED_BY_POLICY.

When only a subset of derived rows are affected by a source change, a partial rebuild may target those rows. A partial rebuild must:

- record which rows were rebuilt and which were left unchanged;
- set the index state to PARTIAL_REBUILD until full-coverage verification completes;
- complete full-coverage verification or escalate to a full rebuild before marking the index VALID.

## Retrieval Receipt Contract

A future retrieval receipt should include at least:

```yaml
receipt_id:
retrieval_id:
request_id:
actor_id:
actor_role:
workspace_id:
project_id:
session_id:
retrieval_purpose:
query_hash:
requested_classes:
filters_applied:
source_paths_returned:
source_hashes_returned:
derived_indexes_used:
returned_count:
excluded_count:
exclusion_reasons:
max_result_sensitivity:
raw_memory_released:
can_reinject:
index_state:
created_at_utc:
```

Receipt fields in this section are doc-only contract fields. They are not
runtime fields until a future source-verified implementation creates them.

Required invariants:

- `raw_memory_released` defaults to false;
- `can_reinject` defaults to false;
- query text should be hashed or redacted if it contains sensitive content;
- returned items must point back to source authority;
- excluded items must record aggregate reason counts without leaking secrets.

## Receipt Type Taxonomy

A retrieval operation produces one of two receipt types:

- `RETRIEVAL_RECEIPT`: a successful read gate pass that returned results or an empty result set within scope; carries the full retrieval field schema above.
- `DENIAL_RECEIPT`: the read gate denied the request or no authorized results exist; used in place of a retrieval receipt when a gate check fails.

A future denial receipt should include at least:

```yaml
receipt_type: DENIAL_RECEIPT
receipt_id:
retrieval_id:
actor_id:
actor_role:
denial_reason:
denied_field_count:
partial_return_count:
index_state:
created_at_utc:
```

`receipt_type` must be set by the gate at read time, not inferred from field presence. Both receipt types require `actor_id`, `actor_role`, and `created_at_utc`. These are doc-only contract fields until a future source-verified implementation creates them.

## Rebuild Receipt Contract

A future rebuild receipt should include at least:

```yaml
receipt_id:
rebuild_id:
index_kind:
scope:
source_roots:
source_hash_before:
source_hash_after:
records_scanned:
records_rebuilt:
records_blocked:
blocked_reasons:
state_before:
state_after:
created_at_utc:
```

Rebuild receipts do not prove runtime behavior by themselves. They are evidence
only for the rebuild operation they record.

## Memory Access Gate Rules

Future memory write and read operations should pass through a gate sequence before execution. Gate rule categories for writes:

- actor and role validation against current scope boundary;
- sensitivity classification check before write proceeds;
- retention and redaction policy check;
- conflict and consistency check for the target derived or canonical row;
- write gate receipt recording before execution;
- audit trail update after execution.

Gate rule categories for reads:

- actor and role validation;
- scope validation against workspace and project boundary;
- sensitivity and staleness check on the target derived view;
- retention policy check;
- retrieval receipt or denial receipt recording before results are returned;
- result filtering by scope and sensitivity;
- denial receipt issued when any gate check fails.

Gate categories are doc-only contract classifications. They do not implement or activate a runtime gate until a future source-verified work order creates them.

## Privacy, Retention, And Redaction Boundary

Future memory/index work must keep these boundaries:

- secrets are not indexed or embedded;
- private provenance is not exported through public handoff;
- expired or redacted memory must remove or invalidate derived rows;
- sensitive data requires classification before indexing;
- public examples must use synthetic data;
- memory candidates remain candidate-only until reviewed or frozen by a
  CVF-governed surface.

If redaction changes a canonical source, every affected derived view must be
marked stale, rebuilt, or disabled by policy.

Future memory-facing work should classify records using these sensitivity levels before indexing or retrieval:

- `PUBLIC`: safe for public export and open retrieval within scope;
- `INTERNAL`: accessible to internal agents and authorized operators only;
- `CONFIDENTIAL`: restricted; not indexed without explicit operator policy;
- `RESTRICTED`: highest sensitivity; redaction required before any derived view is built.

Future memory-facing work should assign records to these retention classes:

- `EPHEMERAL`: expires at session end; derived rows must be purged after session close;
- `SESSION_SCOPED`: bounded to the active session or project; purged after project close;
- `GOVERNED`: persists under explicit retention policy; requires redaction-on-delete;
- `PERMANENT`: retained until explicit operator deletion action; highest audit trail requirement.

Sensitivity levels and retention classes are doc-only contract classifications. They do not implement a classification engine or policy enforcer until a future source-verified implementation creates them.

## Timestamp Discipline

Future memory/index artifacts should separate storage time from display time:

- persisted receipt/index timestamps use UTC;
- display timezone is presentation-only;
- naive storage timestamps must not be interpreted through process-local time;
- a future runtime implementation should provide one storage-time helper and
  one display-time helper instead of mixing responsibilities;
- docs may show local display dates only when evidence scope is explicit.

This section is a documentation contract, not a runtime helper implementation.

## Relationship To Existing Memory Plane Surfaces

| Surface | Relationship |
|---|---|
| `docs/reference/CVF_MEMORY_PLANE_MAP.md` | navigation entrypoint for current memory-facing surfaces and runtime status |
| `docs/reference/CVF_MEMORY_DERIVED_GRAPH_BOUNDARY_2026-06-01.md` | predecessor boundary for derived graph and retrieval indexes |
| `docs/reference/CVF_MLW1_GOVERNED_MEMORY_OPERATION_RECEIPT_MODEL_2026-06-05.md` | predecessor receipt model; this contract adds derived-index/rebuild emphasis |
| `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md` | durable memory class guidance for docs/reference artifacts |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | External repo or copied folder |
| Chain map route | External repo or copied folder -> Root/folder lifecycle classification plus absorption map when retained -> CVF-owned reference contract -> ABSORB, ADAPT, DEFER, REJECT, or BLOCK |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | `docs/reference/memory_foundation/CVF_MEMORY_FOUNDATION_SOURCE_DERIVED_REPLAY_CONTRACT.md` |
| Disposition | ADAPT selected EverOS and advisory-package patterns into CVF-owned reference language |
| Claim boundary | external materials remain inputs; this contract is the CVF-owned adapted surface |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this reference contract | may use as documentation guidance for future source-verified work | EVEROS-T1 closure packet | N/A with reason: no runtime adapter | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future public-safe or adapter readout | no external interface, MCP tool, CLI command, or public package behavior is created | deferred by this contract | separate GC-018/source-verified work order required | `DEFERRED_WITH_REASON` |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance contract derived from an external repository audit.
Public wording requires a separate public-sync decision.

## Claim Boundary

This contract defines documentation-only memory foundation rules. It does not
implement a memory runtime, database, vector store, embedding/rerank pipeline,
watcher, daemon, provider/live proof, route behavior, public export, adapter,
package activation, certification, generated aggregate, or MPI-T6 runtime.
