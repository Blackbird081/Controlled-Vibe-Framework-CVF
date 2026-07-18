# CVF Memory Plane Map

Memory class: POINTER_RECORD

Status: ACTIVE_FORWARD_ONLY

docType: reference

Date: 2026-06-21

Authority:
- Work order: `docs/work_orders/CVF_WO_MPI_T1_MEMORY_PLANE_FRONT_DOOR_MAP_2026-06-21.md`
- GC-018 baseline: `docs/baselines/CVF_GC018_MPI_T1_MEMORY_PLANE_FRONT_DOOR_MAP_2026-06-21.md`
- Dependency release: `docs/reviews/CVF_MPI_T0_INDEX_LEGACY_MEMORY_GRAPH_RECHECK_COMPLETION_2026-06-21.md` (CLOSED_PASS_BOUNDED)

Text Encoding Exception: ASCII-only content; no Unicode arrow, em-dash, or other non-ASCII characters are used in this document.

## Scope

**Applies to:** any CVF agent or operator that needs to identify a memory-facing surface, verify
its runtime status, find its owner, or route a memory-related task to the correct surface. This
map is the entry point for all MPI-series work.

**Does not apply to:** runtime implementation work (MPI-T2/T3/T4), provider/live proof, public-sync,
registry writes, durable writes, adapter behavior, or source-of-truth authority for LPF readout
invariants (use cited source files for authoritative runtime claims).

## Purpose

Navigation POINTER_RECORD for the CVF Memory Plane after MPI-T1 dispatch. Relates all
memory-facing CVF surfaces by purpose, owner, reader/authenticated surface, classification,
plane/layer index role, boundary, and runtime status. Does not implement, redefine, or mutate
any surface.

MKG7 closed (CLOSED_PASS_BOUNDED) and owns the LPF Memory operational contract. MPI closes
three integration gaps MKG7 left untouched: (1) no single front-door map, (2) Corpus Scan
Registry not reachable through Memory readout (MPI-T2, helper implemented), (3) no external
read contract (MPI-T3, active reference), (4) no current parent-map record
for the already implemented federated helper (MPI-T4, reconciled on
2026-06-27), and (5) no current parent-map record for the already implemented
Memory Access Claim checker (MPI-T5, reconciled on 2026-06-27). MPI-T1
originally addressed gap (1) only.

## How To Use This Map

1. Find the surface in the Surface Inventory.
2. Check runtime status: RUNNING, CONTRACT_ONLY, PARKED, or CLOSED.
3. Follow the owner/source citation for authoritative detail.
4. Do not treat this map as runtime configuration, schema, or policy source.
5. Do not present CONTRACT_ONLY or PARKED surfaces as running capabilities.

## Plane-Wide Invariants

Source authority: `docs/reference/CVF_MEMORY_PLANE_OPERATIONAL_CONTRACT_2026-06-01.md`

| Invariant | Value | Source |
|---|---|---|
| rawMemoryReleased (readout surface) | false (fixed) | `route.ts` lines 202-204; `memory-runtime-readout.ts` lines 41-54 |
| canReinject (readout surface) | false (fixed) | `route.ts` lines 202-204; `memory-runtime-readout.ts` lines 41-54 |
| RAW sentinel guard | RAW_MEMORY_CONTENT_MUST_NOT_LEAK -- HTTP 500 if triggered | `route.ts` lines 7, 193-196 |
| Durable write fail-closed | write() denies unless actorAuthorized=true AND policyDecision==='allow' | `durable-memory-store.ts` lines 195-211 |
| Provenance floor | MIN_PROVENANCE_SCORE = 0.7 | `durable-memory-store.ts` line 98 |
| Raw payload in durable write | rejected (raw_memory_payload_rejected) | `durable-memory-store.ts` lines 256-259 |
| Durable write wired into route | NO -- fail-closed write present but NOT wired | MKG7 operational contract; `durable-memory-store.ts` |
| GC-051 inherit-before-rescan | read registry; inherit if SCANNED/DEEP_CLASSIFIED; no restart | GC-051 standard Rule 1 (lines 209-220) |

## Surface Inventory

| Surface | INDEX type | Runtime status | Owner / source | Reader / auth surface |
|---|---|---|---|---|
| LPF Memory runtime readout route | IDX-4 RUNTIME_READOUT | RUNNING | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | POST /api/memory/readout; service-token OR session auth |
| LPF Memory readout projection | IDX-4 support layer | RUNNING (paired with route) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/memory-runtime-readout.ts` | called by readout route only |
| LPF durable store | (future IDX-4 input) | CONTRACT_ONLY (present, fail-closed, UNWIRED) | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | not wired; no active read/write route |
| Corpus Scan Registry / GC-051 | IDX-1 CORPUS_FAMILY_INDEX | RUNNING (generated aggregate) | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` from `registry/entries/*.json` | read directly; read-only projection into Memory readout candidates available via MPI-T2 helper `scan-registry-memory-projection.ts` (not yet route-wired) |
| Federated Memory read helper | IDX-4 support layer | RUNNING (local helper, not route-wired) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/federated-memory-read.ts` | direct library call by separately authorized local caller/tests only |
| Memory Access Claim checker | Governance static guard | RUNNING (local checker, hook/autorun wired) | `governance/compat/check_memory_access_claim.py` | local governance CLI over changed governed Markdown only |
| LSC signal reference and helper readout | (signal reference; adapterContractOnly) | RUNNING helper stdout; CONTRACT_ONLY adapter | `docs/reference/learning_signal_chain/`; `governance/compat/run_agent_automation_assist.py` | Python stdout only; adapterContractOnly=true |
| docs/ GC-022 memory records | IDX-6 (absorption/review records) | RUNNING (human read) | `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md` | read directly by agents and humans; GC-023 applies |
| Governed docs and active markdown | IDX-2 PLANE_OWNER_MAP support | RUNNING (human read, source-of-truth) | GC-023: `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md` | read directly; NOT the fast retrieval layer |
| CI1-T11 / MLW0 / MLW1-MLW6 | Predecessor absorption authority | CLOSED_PASS_BOUNDED | CI1-T11 roadmap; MLW0 source map; MLW1-MLW6 completion review | cite as predecessor authority only; no direct runtime adoption |
| KGR1 bounded LPF local graph retrieval | IDX-3 STRUCTURAL_GRAPH_INDEX | RUNNING (bounded local); Graphify/KGR legacy: PARTIAL_RECHECK_REQUIRED | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge-graph-store.ts`; `knowledge-graph-builder.ts` | local graph_search only; no vector DB, web-route, or durable graph persistence |
| Ephemeral task memory | (ephemeral; not indexed) | RUNNING (current session only; lost on exit) | agent working context | current task session only; no cross-session persistence |
| Provider / private agent memory | IDX-7 PROVIDER_PRIVATE_MEMORY_INDEX | provider-local; NOT_CVF_SOURCE | CLAUDE.md and provider equivalents -- NOT_CVF_SOURCE; not cited as CVF authority | provider-specific only; re-verify against governed CVF sources before use |

## Surface Details

### LPF Memory Runtime Readout

- **Status:** RUNNING -- authenticated, summary-only, RAW-sentinel guarded.
- **Route:** POST /api/memory/readout (local Next.js route).
- **Auth:** verifyServiceTokenRequest OR verifySessionCookie; 401 if neither. Source: `route.ts` lines 136-163.
- **Projection:** buildMemoryRuntimeReadout strips candidate content; sets rawMemoryReleased=false, canReinject=false. Source: `memory-runtime-readout.ts` lines 15-54.
- **Response shape:** { success:true, routeVersion, memoryRuntimeReadout, rawMemoryReleased:false, canReinject:false }. Source: `route.ts` lines 198-204.
- **RAW sentinel:** RAW_MEMORY_CONTENT_MUST_NOT_LEAK -- HTTP 500 if serialized projection contains it. Source: `route.ts` lines 7, 193-196.
- **Operational contract:** `docs/reference/CVF_MEMORY_PLANE_OPERATIONAL_CONTRACT_2026-06-01.md` (MKG7, PENDING documentation-only).
- **MPI gap:** Corpus Scan Registry findings have a bounded MPI-T2 helper but are not route-wired; route wiring remains a separate later tranche.

### LPF Durable Store

- **Status:** CONTRACT_ONLY -- present, fail-closed, NOT WIRED into any route.
- **Write gate:** write() denies unless actorAuthorized===true AND policyDecision==='allow' AND durable tier (skill/long-term) AND provenanceScore >= 0.7. Source: `durable-memory-store.ts` lines 195-211, 98, 113-114.
- **Raw payload:** rejected (raw_memory_payload_rejected). Source: `durable-memory-store.ts` lines 256-259.
- **Receipts:** summaryOnly:true, canReinject:false, rawMemoryReleased:false. Source: `durable-memory-store.ts` lines 172-175.
- **Wiring status:** no route imports durable store as a write path; future T5 readiness only. Source: MKG7 operational contract.

### Corpus Scan Registry (GC-051)

- **Status:** RUNNING -- generated from per-entry sources.
- **Generated aggregate:** `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json`.
- **Per-entry sources:** `docs/corpus-intelligence/registry/entries/*.json`.
- **Standard:** `docs/reference/CVF_CORPUS_SCAN_REGISTRY_STANDARD_2026-06-02.md`.
- **Rule 1 (inherit-before-rescan):** read registry before scanning; inherit prior state if SCANNED/DEEP_CLASSIFIED. Source: GC-051 standard lines 209-220.
- **Finding Discovery rule:** read all findings[] before working in the same corpus area.
- **Read projection:** MPI-T2 helper `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/scan-registry-memory-projection.ts` projects findings into Memory readout candidate-compatible summary records (read-only, derived view, no registry write, no route edit). Contract: `docs/reference/CVF_MPI_T2_SCAN_REGISTRY_EPISODIC_READ_PROJECTION.md`. The helper produces candidates usable by `buildMemoryRuntimeReadout`; it is NOT yet wired into the route as an automatic data source (route wiring remains a separate later tranche).
- **Do not hand-edit aggregate:** add/update per-entry source, then run generate_corpus_scan_registry.py.

### Learning Signal Chain Reference And Helper Readout

- **Status:** RUNNING (helper stdout only); CONTRACT_ONLY for CLI/MCP adapter.
- **adapterContractOnly:** true. Source: `CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT.md` lines 38-50.
- **Helper readout:** governance/compat/run_agent_automation_assist.py -- read-only signalReadout via Python stdout; no mutation, no ledger store, no durable write.
- **No ledger store:** LSC has no ledger store, no source directory for a store, and no durable store implementation.
- **External read contract:** defined by `docs/reference/CVF_MPI_T3_EXTERNAL_AGENT_MEMORY_READ_CONTRACT.md` as `adapterContractOnly=true`.

### Memory Access Claim Checker

- **Status:** RUNNING (local static governance checker).
- **Checker:** `governance/compat/check_memory_access_claim.py`.
- **Focused tests:** `governance/compat/test_check_memory_access_claim.py`.
- **Scope:** changed governed Markdown under docs baselines, work orders,
  reviews, and reference surfaces.
- **Boundary:** static source-fidelity guard only; no route, provider,
  adapter, durable store, vector store, graph persistence, public-sync, or
  runtime memory behavior.
- **MPI-T5 reconciliation:** current-state reconciliation on 2026-06-27
  confirms the checker exists, focused tests pass, and parent navigation may
  record it without reopening MPI-T6 runtime-candidate work.

### Legacy Absorption Predecessor Authority (CI1-T11, MLW0, MLW1-MLW6)

- **Status:** CLOSED_PASS_BOUNDED -- predecessor absorption authority only; not direct runtime source.
- **CI1-T11 roadmap:** `docs/roadmaps/CVF_CI1_T11_MEMORY_LEARNING_ABSORPTION_CONSOLIDATED_ROADMAP_2026-06-05.md` -- memory/learning/RAG/context/execution-continuity/audit legacy scan absorption.
- **MLW0 source map:** `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` (CLOSED_PASS_BOUNDED) -- maps legacy vocabulary to current LPF/cvf-web source authority.
- **MLW1-MLW6 contracts:** `docs/reviews/CVF_MLW1_MLW6_MEMORY_LEARNING_CORE_WORKFLOW_CHAIN_COMPLETION_2026-06-05.md` (CLOSED_PASS_BOUNDED) -- bounded contract/workflow-chain closure.
- **Boundary:** cite as predecessor absorption authority; do not use legacy vocabulary as direct runtime source without mapping through current CVF source.

### KGR1 Structural Graph Context Index

- **Status:** RUNNING (bounded local LPF only). Graphify/KGR legacy folders: PARTIAL_RECHECK_REQUIRED per MPI-T0 bounded recheck (2026-06-21).
- **Owner sources:** `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge-graph-store.ts`; `knowledge-graph-builder.ts`.
- **KGR1 review:** `docs/reviews/CVF_KGR1_KNOWLEDGE_GRAPH_RETRIEVAL_LOCAL_REVIEW_2026-06-02.md` (CLOSED_PASS_BOUNDED).
- **KGR1 roadmap:** `docs/roadmaps/CVF_KGR1_KNOWLEDGE_GRAPH_RETRIEVAL_ROADMAP_2026-06-01.md`.
- **KGR prereview:** `docs/reference/CVF_KGR_ABSORPTION_PREREVIEW_2026-06-01.md` -- distinguishes Memory Plane from KGR; records Graphify/KGR legacy prior absorption boundary.
- **MPI-T0 recheck result:** BLI-01 Graphify folder reconciled to 5/5 files after reviewer correction; four Graphify spec files are ALREADY_ABSORBED_CURRENT_OWNER and BLI-01 `Thong_tin.md` is ACCEPT_AS_INDEX_INPUT. BLI-02 code-review-graph and BLI-03 tolaria remain ACCEPT_AS_INDEX_INPUT pending a further scan tranche.
- **Boundary:** local graph_search only; no durable graph persistence, vector DB, web-route graph integration, or production-readiness claim.

## Running vs Contract-Only vs Parked

| Surface | Status | Reason |
|---|---|---|
| LPF Memory runtime readout route + projection | RUNNING | active authenticated web route; summary-only |
| Corpus Scan Registry / GC-051 | RUNNING (generated) | generated aggregate over per-entry sources |
| LSC helper readout (run_agent_automation_assist.py) | RUNNING (stdout only) | Python helper reads signalReadout; no mutation |
| KGR1 local LPF graph retrieval | RUNNING (bounded local) | KGR1 CLOSED_PASS_BOUNDED; local store/builder |
| docs/ GC-022 memory records | RUNNING (human read) | governed source-of-truth; GC-023 line limits |
| LPF durable store | CONTRACT_ONLY (present, fail-closed, UNWIRED) | write() exists with gates; not wired into any route |
| LSC-T6 CLI/MCP adapter | CONTRACT_ONLY | adapterContractOnly=true; no adapter implementation |
| CI1-T11 / MLW0 / MLW1-MLW6 | CLOSED (predecessor authority) | absorption closed; cite as authority, not as runtime |
| Scan-registry read projection | RUNNING (helper) | MPI-T2 helper `scan-registry-memory-projection.ts` produces readout-compatible candidates; deterministic, read-only, derived view; not auto-wired into the route |
| External read contract (LSC read side) | ACTIVE_REFERENCE (MPI-T3) | `docs/reference/CVF_MPI_T3_EXTERNAL_AGENT_MEMORY_READ_CONTRACT.md`; `adapterContractOnly=true`; no CLI/MCP adapter implementation |
| Federated helper | RUNNING (local helper, not route-wired) | `buildFederatedMemoryRead` composes caller-supplied LPF candidates and caller-supplied parsed scan-registry entries; no route, filesystem, provider, registry-write, durable-store, adapter, or public behavior |
| Memory Access Claim checker | RUNNING (local checker, hook/autorun wired) | `check_memory_access_claim.py` scans changed governed Markdown for Memory Plane overclaims; no runtime/provider/adapter behavior |

## MPI Tranche Progression

| Tranche | Scope | Status |
|---|---|---|
| MPI-T0 | INDEX legacy memory/KGR/graph recheck; INDEX classification standard | CLOSED_PASS_BOUNDED (2026-06-21) |
| MPI-T1 | Memory Plane front-door map (this document) | CLOSED_PASS_BOUNDED; reviewer correction applied |
| MPI-T2 | Scan-registry read projection through Memory readout surface | CLOSED_PASS_BOUNDED; read-only derived view, not route-wired |
| MPI-T3 | External-agent read contract (read side mirroring LSC-T6) | ACTIVE_REFERENCE -- `adapterContractOnly=true`; no CLI/MCP adapter implementation |
| MPI-T4 | Federated helper for memory + scan-registry federated read | CLOSED_PASS_BOUNDED; current-state reconciled on 2026-06-27; no route wiring or adapter behavior |
| MPI-T5 | Memory Access Claim checker | CLOSED_PASS_BOUNDED; current-state reconciled on 2026-06-27; local static checker only; no runtime behavior |

## External Knowledge Intake Routing

Chain map: `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md`

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | legacy source family |
| Chain map route | legacy source family -> Knowledge Absorption Blind-Spot Control Block -> existing plane/workflow-chain/roadmap/reference owner -> ALREADY_ABSORBED_CURRENT_OWNER |
| Matching local-view guard | governance/compat/check_rescan_intelligence_hardening.py (rescan evidence gate for prior absorption tranches) |
| Owner surface | `docs/reference/CVF_MEMORY_PLANE_MAP.md`; all cited legacy absorption artifacts are already governed by CI1-T11/MLW0/MLW1-MLW6 chain |
| Disposition | ALREADY_ABSORBED_CURRENT_OWNER -- CI1-T11/MLW chain CLOSED_PASS_BOUNDED; no new external knowledge is absorbed by this navigation map |
| Claim boundary | POINTER_RECORD navigation only; no new external knowledge absorption; no runtime promotion; all surface citations are back-references to governed CVF artifacts |

## Claim Boundary

This POINTER_RECORD navigation map does not implement, redefine, or mutate any memory-facing
surface. It does not authorize:

- runtime projection, helper, test, schema, route, registry write, durable write, or generator run;
- provider/live proof, public-sync, CLI/MCP adapter behavior, or external-agent adapter implementation;
- any MPI-T4 expansion beyond the existing local helper, any MPI-T5 expansion beyond the existing static checker, or any MPI-T2/MPI-T3 runtime expansion;
- re-absorption of legacy artifacts or direct legacy runtime promotion;
- new vector DB, embedding index, or graph persistence capability.

Claims in this map are documentation-level. Every runtime claim cites a source file. No claim
is authoritative without the cited source. Reviewer/closer must verify source citations before
accepting.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | MPI-T5 current-state reconciliation, 2026-06-27 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | source reads, focused Vitest, TypeScript check, apply_patch, governance gates |
| Target paths | `docs/reference/CVF_MEMORY_PLANE_MAP.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_MPI_T5_CURRENT_STATE_RECONCILIATION_FOR_CODEX_2026-06-27.md`; `docs/baselines/CVF_GC018_MPI_T5_CURRENT_STATE_RECONCILIATION_2026-06-27.md` |
| Before status evidence | HEAD `33f7ab42`; map recorded current MPI progression only through MPI-T4 |
| After status evidence | map records current MPI-T5 local static checker as RUNNING with no runtime behavior |
| Diff evidence | current-state reconciliation diff; no runtime/source/test path changed |
| Approval boundary | parent navigation reconciliation only |
| Claim boundary | map remains POINTER_RECORD navigation; no route/provider/public/adapter/registry/durable/MPI-T6 runtime expansion |
| Agent type | single-agent dispatcher/implementer/reviewer/closer |
| Invocation ID | mpi-t5-current-state-reconciliation-2026-06-27 |
| Expected manifest | `docs/reference/CVF_MEMORY_PLANE_MAP.md`; `docs/roadmaps/CVF_MPI_MEMORY_PLANE_INTEGRATION_ROADMAP_2026-06-21.md`; `docs/baselines/CVF_GC018_MPI_T5_CURRENT_STATE_RECONCILIATION_2026-06-27.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_MPI_T5_CURRENT_STATE_RECONCILIATION_FOR_CODEX_2026-06-27.md`; `docs/reviews/CVF_MPI_T5_CURRENT_STATE_RECONCILIATION_COMPLETION_2026-06-27.md` |
| Actual changed set | Memory Plane map; MPI parent roadmap; MPI-T5 reconciliation baseline; work order; completion review |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance navigation reference for the CVF Memory Plane. No public-sync remote,
public commit, public artifact path, or public claim is authorized.

EPISTEMIC_PROCESS_NA_WITH_REASON: POINTER_RECORD navigation map -- all content is back-reference navigation and surface classification only; no experimental prediction, evidence comparison, or hypothesis was made or tested; no observable outcome was predicted or measured.
