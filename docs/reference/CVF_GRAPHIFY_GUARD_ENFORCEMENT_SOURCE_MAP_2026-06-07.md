# CVF Graphify Guard Enforcement Source Map

Memory class: FULL_RECORD

docType: source_map

Status: REVIEW_READY

Date: 2026-06-07

Worker: Claude (doc-only source verification, WORKER_MUST_NOT_COMMIT)

Worker base head: `74ba8033`

Authority: `docs/work_orders/CVF_AGENT_WORK_ORDER_GRAPHIFY_GUARD_ENFORCEMENT_SOURCE_VERIFICATION_FOR_CLAUDE_2026-06-07.md`

Roadmap: `docs/roadmaps/CVF_GRAPHIFY_GUARD_ENFORCEMENT_ROADMAP_2026-06-02.md`

Finding: `docs/corpus-intelligence/findings/legacy-cvf-important-graphify.md` (F2-guard-spec-absent)

---

## Scope / Target / Owner Boundary

Target: Graphify guard policies `G-GM-01` through `G-GM-08` as defined in
`CVF_GRAPH_MEMORY_GUARD_SPEC.md` (legacy) and absorbed into the KGR guard
policy registry in `knowledge-graph-store.ts`.

Owner: Claude (worker, doc-only source verification). Reviewer/closer: Codex or
operator-designated reviewer.

Boundary: private provenance documentation only. No runtime files, governance
checkers, session front doors, CLI commands, public-sync, or live provider calls
are within scope.

---

## Purpose

This source map refreshes the post-CI1 `F2-guard-spec-absent` finding against
current KGR source. It maps each `G-GM-01` through `G-GM-08` guard policy ID to
current registry evidence, enforcement evidence, retrieval-policy interaction,
and an implementation disposition.

This is a documentation and source-verification artifact only. It does not
implement guard enforcement, CLI behavior, or any runtime change.

---

## Key Source Finding: CI1 Negative-Search Evidence Is Now Historical

CI1-T2 recorded: `rg "G-GM-0" --include="*.ts"` across `EXTENSIONS/` → 0 results
(finding file line 99, `docs/corpus-intelligence/findings/legacy-cvf-important-graphify.md`).

**Current source contradicts this.** The present drift-check at HEAD `74ba8033` finds
`G-GM-01` through `G-GM-08` at:
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge-graph-store.ts` lines 75–83 (`KgrGuardPolicyId` type union)
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge-graph-store.ts` lines 191–244 (`KGR_GUARD_POLICIES` constant, all 8 entries)
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/index.ts` lines 127, 134, 140–141 (public re-exports)
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/knowledge-graph-store.test.ts` lines 4, 10, 15, 84–86 (test coverage)

The CI1 negative-search finding reflects the state at CI1 base head `6a40d096`
before KGR1 delivered the guard policy registry. It is historical. Current source
proves `policyRegistryExists=true` for all eight policies.

---

## Policy-Level Source Map

### Notes on Column Definitions

- **Registry source:** where the policy ID and metadata are defined in current TypeScript source.
- **Enforcement source:** whether current source contains behavior that corresponds to the policy rule. `cvfOwnerExists: false` means the KGR metadata explicitly records no CVF owner for enforcement. `cvfOwnerExists: true` with a path means a related owner surface exists, but named `G-GM-*` enforcement wiring still requires a follow-up implementation work order.
- **Retrieval-policy interaction:** whether `memory-retrieval-policy.ts` evaluates behavior relevant to this policy on `graph_search` requests.
- **Implementation disposition:** `ACCEPT_FOR_NEXT_IMPLEMENTATION` = registry-proven, bounded candidate ready for a follow-up work order; `DEFER_NO_ENFORCEMENT_SOURCE` = registry-proven but no CVF-owned enforcement point exists yet; `REJECT_SCOPE_MISMATCH` = not applicable to this CVF surface.

---

| Policy ID | Policy name | Registry source | Enforcement source | Retrieval-policy interaction | Implementation disposition | Evidence pointer | Later action |
|---|---|---|---|---|---|---|---|
| `G-GM-01` | Graph Priority Guard | `knowledge-graph-store.ts` L193–198: `KGR_GUARD_POLICIES[0]`, `cvfOwnerExists: false` | None proven in current source. `cvfOwnerExists: false` in registry metadata. PreToolUse hook pattern would require agent-settings change, not CVF TypeScript. | No direct enforcement path in `memory-retrieval-policy.ts`. `graph_search` routing is advisory, not priority-gating. | `DEFER_NO_ENFORCEMENT_SOURCE` | `knowledge-graph-store.ts` L193–198; finding F2 note on PreToolUse pattern | Define enforcement scope in a follow-up WO: advisory graph-priority note in retrieval result vs. hard agent-settings gate (separate authorization required) |
| `G-GM-02` | No Bypass Guard | `knowledge-graph-store.ts` L199–204: `KGR_GUARD_POLICIES[1]`, `cvfOwnerExists: false` | None proven in current source. No bypass-check logic found in retrieval policy or store. | `graph_search` path in `memory-retrieval-policy.ts` L124–218 provides advisory routing but does not enforce no-bypass semantics. | `DEFER_NO_ENFORCEMENT_SOURCE` | `knowledge-graph-store.ts` L199–204; `memory-retrieval-policy.ts` L124 | Depends on G-GM-01 enforcement decision; no standalone CVF enforcement point identified |
| `G-GM-03` | Provenance Guard | `knowledge-graph-store.ts` L205–211: `KGR_GUARD_POLICIES[2]`, `cvfOwnerExists: true`, `cvfOwnerPath: durable-memory-store.ts` | `cvfOwnerExists: true` points to `durable-memory-store.ts` as the owner surface. Source provenance is tracked via `KgrNode.sourcePath` (L99 in store). No active provenance-check guard logic proven in current retrieval path. | `kgrNodeToMemoryCandidate` in `memory-retrieval-policy.ts` L82–95 preserves `node.sourcePath`-derived identity in candidate `id` field. Provenance is carried but not enforced as a gate. | `ACCEPT_FOR_NEXT_IMPLEMENTATION` | `knowledge-graph-store.ts` L205–211; `memory-retrieval-policy.ts` L82–95; `durable-memory-store.ts` (owner path) | First enforcement candidate — see §First Enforcement Candidate below |
| `G-GM-04` | Integrity Guard | `knowledge-graph-store.ts` L212–217: `KGR_GUARD_POLICIES[3]`, `cvfOwnerExists: false` | Orphaned-edge rejection exists in `buildKgrStore` L154–157 (edges with missing endpoints are silently dropped). This is partial structural integrity only; no explicit guard-ID check or violation logging. | Not directly addressed in retrieval policy. | `DEFER_NO_ENFORCEMENT_SOURCE` | `knowledge-graph-store.ts` L154–157, L212–217 | Orphaned-edge drop is a start; explicit integrity-violation logging and a named guard check would be the bounded next step |
| `G-GM-05` | Access Control Guard | `knowledge-graph-store.ts` L218–224: `KGR_GUARD_POLICIES[4]`, `cvfOwnerExists: true`, `cvfOwnerPath: memory-retrieval-policy.ts` | `memory-retrieval-policy.ts` L109–122: `actorAuthorized` gate denies unauthorized actors before the `graph_search` branch executes. This is a source-visible behavior connection for graph-readout access control. | Source-visible behavior: `evaluateRetrievalRequest` L109 checks `actorAuthorized`; denial returns before any KGR node is read. Tests: `memory-retrieval-policy.kgr.test.ts` L75–92. | `ACCEPT_FOR_NEXT_IMPLEMENTATION` | `knowledge-graph-store.ts` L218–224; `memory-retrieval-policy.ts` L109–122; `memory-retrieval-policy.kgr.test.ts` L75–92 | Existing behavior is functional but not named as `G-GM-05`. Named guard annotation is the bounded next step |
| `G-GM-06` | Confidentiality Guard | `knowledge-graph-store.ts` L225–231: `KGR_GUARD_POLICIES[5]`, `cvfOwnerExists: true`, `cvfOwnerPath: memory-retrieval-policy.ts` | `memory-retrieval-policy.ts`: `containsSecret` filtering at L208–214 excludes secret-bearing candidates from graph search results; `rawMemoryReleased: false` is returned throughout. | Source-visible behavior: secret candidates are excluded from `graph_search` results; `rawMemoryReleased: false` is a result contract value on `MemoryRetrievalResult`. | `ACCEPT_FOR_NEXT_IMPLEMENTATION` | `knowledge-graph-store.ts` L225–231; `memory-retrieval-policy.ts` L208–214, L49; `MemoryRetrievalResult.rawMemoryReleased` contract | Named guard annotation linking the existing behavior to `G-GM-06` is the bounded next step |
| `G-GM-07` | Drift Detection Guard | `knowledge-graph-store.ts` L232–237: `KGR_GUARD_POLICIES[6]`, `cvfOwnerExists: false` | No drift-detection logic found in current retrieval policy or store. KGR roadmap (`CVF_KGR1_KNOWLEDGE_GRAPH_RETRIEVAL_ROADMAP_2026-06-01.md`) states views are rebuildable derived views, which is the conceptual basis, but no checker exists. | Not addressed in `memory-retrieval-policy.ts`. | `DEFER_NO_ENFORCEMENT_SOURCE` | `knowledge-graph-store.ts` L232–237 | Requires a separate checker or rebuild-trigger design; no current enforcement point |
| `G-GM-08` | Compliance Guard | `knowledge-graph-store.ts` L238–244: `KGR_GUARD_POLICIES[7]`, `cvfOwnerExists: true`, `cvfOwnerPath: memory-retrieval-policy.ts` | `memory-retrieval-policy.ts` L93: `kgrNodeToMemoryCandidate` maps nodes with `governanceTag !== "CVF_COMPLIANT"` to `lifecycleState: "disputed"`, which causes them to be excluded from `graph_search` results (L146 exclusion path). Tests: `memory-retrieval-policy.kgr.test.ts` L69–72 prove a `PENDING_REVIEW` node is excluded. | Source-visible behavior: non-compliant nodes enter `disputed` lifecycle and are excluded from selected candidates. This is the strongest current behavior connection of any guard. | `ACCEPT_FOR_NEXT_IMPLEMENTATION` | `knowledge-graph-store.ts` L238–244; `memory-retrieval-policy.ts` L93, L146; `memory-retrieval-policy.kgr.test.ts` L69–72 | Named guard annotation and a dedicated test asserting the `G-GM-08` semantic would make enforcement explicit |

---

## Disposition Summary

| Disposition | Count | Policy IDs |
|---|---|---|
| `ACCEPT_FOR_NEXT_IMPLEMENTATION` | 4 | G-GM-03, G-GM-05, G-GM-06, G-GM-08 |
| `DEFER_NO_ENFORCEMENT_SOURCE` | 4 | G-GM-01, G-GM-02, G-GM-04, G-GM-07 |
| `REJECT_SCOPE_MISMATCH` | 0 | — |

---

## First Enforcement Candidate

**Recommended: G-GM-08 (Compliance Guard) + G-GM-06 (Confidentiality Guard)**

Rationale: both already have source-visible behavior in `memory-retrieval-policy.ts`
that corresponds to the guard intent. The bounded next step is not implementing new logic, but adding named guard
annotations (a comment, a constant reference, or a lightweight test assertion)
that explicitly link the runtime behavior to the `G-GM-08` and `G-GM-06` IDs.
This creates a machine-verifiable chain from guard spec to enforcement without
requiring new runtime paths.

**Bounded claim for that follow-up work order:**

> `G-GM-08` compliance-tag exclusion and `G-GM-06` secret-candidate exclusion are
> annotated and explicitly covered by named test assertions in
> `memory-retrieval-policy.kgr.test.ts`.

**Second candidate if a new enforcement point is needed: G-GM-03 (Provenance Guard)**

The `cvfOwnerExists: true` pointer to `durable-memory-store.ts` and the
`sourcePath`-based candidate identity in `kgrNodeToMemoryCandidate` provide a
natural anchor. A bounded enforcement step would assert that graph retrieval
candidates lacking a `sourcePath` are rejected or flagged — verifiable in tests
without agent-settings changes.

**Deferred (G-GM-01, G-GM-02):** These require a PreToolUse hook or agent-settings
change — outside the CVF TypeScript runtime scope and requiring a separate
authorization and work order.

---

## CLI Boundary

`cvf graph` commands are **absent from `command.registry.ts`** (drift-check
confirms: `rg "cvf graph" EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src` → 0 results).
CLI graph command work belongs to the separate parked roadmap:
`docs/roadmaps/CVF_GRAPH_CLI_PHASED_BACKLOG_ROADMAP_2026-06-02.md`.
This source map does not address CLI implementation; it is out of scope.

---

## Corpus Completeness And Report Integrity

**Bounded corpus (files reviewed for this source map):**

| File | Status | Role |
|---|---|---|
| `docs/roadmaps/CVF_GRAPHIFY_GUARD_ENFORCEMENT_ROADMAP_2026-06-02.md` | READ | Authority roadmap |
| `docs/corpus-intelligence/findings/legacy-cvf-important-graphify.md` | READ | F2 finding source |
| `docs/audits/CVF_CI1_T2_GRAPHIFY_READINESS_PACKET_2026-06-02.md` | READ (header + key sections) | CI1-T2 evidence |
| `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge-graph-store.ts` | READ (full, 249 lines) | Primary registry source |
| `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts` | READ (full, 259 lines) | Enforcement owner surface |
| `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/knowledge-graph-store.test.ts` | READ (full, 90 lines) | Registry test coverage |
| `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/memory-retrieval-policy.kgr.test.ts` | READ (full, 93 lines) | Retrieval policy KGR test coverage |
| `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/command.registry.ts` | READ (180 lines) | CLI registry drift check |
| `docs/roadmaps/CVF_GRAPH_CLI_PHASED_BACKLOG_ROADMAP_2026-06-02.md` | READ (header + boundary) | CLI scope boundary |
| `docs/roadmaps/CVF_KGR1_KNOWLEDGE_GRAPH_RETRIEVAL_ROADMAP_2026-06-01.md` | READ (status + claim boundary) | KGR1 bounded-claim boundary |

**Reconciliation:** All source files named in the work order Source Verification Block
are accounted for above. No file listed in the work order is unresolved.

**Exclusions:**
- Runtime implementation files under `EXTENSIONS/` beyond the KGR/retrieval surfaces listed: out of scope per work order §4.
- `governance/compat/` machine check files: forbidden per work order §4.
- `CVF_GRAPH_MEMORY_GUARD_SPEC.md` (legacy private reference): the finding packet already summarizes its content; direct re-read would be redundant and the file is in `.private_reference/legacy/` (read-only, not for modification). Content is already captured in CI1-T2 audit and finding file.

**Drift check commands run:**

```
rg -n "G-GM-0|KgrGuardPolicy|KGR_GUARD_POLICIES|getKgrGuardPolicy"
  EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src
  EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests
→ 30+ hits confirming registry, type, and test coverage at HEAD 74ba8033

rg -n "graph_search|kgr_graph_search_policy_applied_local_only|graph_search_policy_applied_advisory_only"
  EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src
  EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests
→ 14 hits confirming graph_search method, advisory routing reasons, and test coverage

rg -n "cvf graph|graph command|CommandRegistry|registerBuiltInCommands"
  EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src docs/roadmaps
→ CommandRegistry confirmed present; no "cvf graph" command entry in registry source
```

**Adversarial no-enforcement-overclaim check:**
Verified that `cvfOwnerExists: true` in `KGR_GUARD_POLICIES` records for G-GM-03,
G-GM-05, G-GM-06, G-GM-08 does **not** prove named guard enforcement; it is a
pointer to an owner surface where enforcement could be wired. The behavior
connection, where applicable, is supported by reading `memory-retrieval-policy.ts`
logic directly. G-GM-03 owner path `durable-memory-store.ts` was not verified to
contain active provenance enforcement; it is classified
`ACCEPT_FOR_NEXT_IMPLEMENTATION` (not yet enforced), not `ENFORCE_PROVEN`.

**Corpus verdict:** `COMPLETE_WITH_DECLARED_EXCLUSIONS`

Exclusions: legacy private-reference guard spec file (content already captured
in CI1-T2 finding); CLI surface beyond command.registry.ts.

---

## Claim Boundary

This source map claims only:

> Graphify guard enforcement source verification and mapping are complete for the
> bounded source corpus, with each G-GM policy mapped to current registry evidence,
> enforcement evidence, and a later implementation disposition.

This source map does **not** claim:
- Named runtime Graphify guard enforcement is wired for any policy
- `cvf graph` CLI is implemented or ready
- Knowledge graph product readiness
- Public readiness or production readiness
- Live provider behavior proven
- Release readiness
- F-1 output-quality parity, QBS parity, L4/L5 score, or benchmark improvement
