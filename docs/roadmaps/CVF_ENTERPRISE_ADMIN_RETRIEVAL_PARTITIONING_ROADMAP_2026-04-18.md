# CVF Enterprise Admin — Retrieval Partitioning Wave Roadmap

**Date:** 2026-04-18  
**Status:** Proposed next tranche  
**Recommended class:** REALIZATION / HARDENING  
**Why now:** Enterprise Admin Phase D is closed, but D1.4 stops at plumbing only. CVF now passes `orgId`/`teamId` into the knowledge builder contract, yet no real retrieval adapter exists to enforce tenant-scoped chunk filtering at runtime.

---

## 1. Goal

Convert the current D1.4a scope-plumbing into real D1.4b runtime enforcement:

- knowledge retrieval must query actual scoped collections or chunks,
- `orgId` / `teamId` must be enforced before context reaches `/api/execute`,
- Enterprise Admin must expose and persist collection scope metadata,
- cross-tenant leakage must be testable and auditable.

This wave should close the only intentional gap left in the Enterprise Admin lane.

---

## 2. Why This Is The Right Next Move

Do this before any fresh knowledge-absorption wave.

Reason:

- new absorbed knowledge has lower product value if CVF cannot enforce tenant boundaries at retrieval time,
- Enterprise Admin already introduced the governance and audit substrate needed to support scoped retrieval,
- this is a runtime/product truth gap, not a doctrine gap.

If a new knowledge-absorption wave happens first, the repo gains more content but still lacks the most important enterprise control on that content.

---

## 3. Scope

### R1 — Retrieval Adapter Introduction

Create a real retrieval adapter instead of relying on pre-built `knowledgeContext` strings.

**Target shape:**

```ts
export interface KnowledgeChunk {
  id: string;
  collectionId: string;
  content: string;
  orgId?: string;
  teamId?: string;
  sourceRef?: string;
}

export async function queryKnowledgeChunks(input: {
  intent: string;
  orgId?: string;
  teamId?: string;
  limit?: number;
}): Promise<KnowledgeChunk[]>
```

**Rules:**

- adapter returns structured chunks, not a preformatted context string,
- adapter may use mock/in-memory storage first if no production store exists yet,
- formatting into system prompt happens only after filtering is complete.

### R2 — Knowledge Scope Persistence

Persist collection-level scope metadata for the knowledge layer.

**Suggested surfaces:**

- extend the existing policy/event substrate, or
- extend the existing tool-registry admin surface if that is already the intended control point.

**Admin requirement:**

- admin can assign `orgId` / `teamId` scope per collection,
- unscoped collections are treated explicitly, not implicitly,
- UI must make scope visibility obvious.

### R3 — Execute-Path Enforcement

Update `/api/execute` so the knowledge path becomes:

1. determine requester scope from session,
2. query chunks via adapter,
3. filter chunks by `orgId` / `teamId`,
4. build governed context block from only allowed chunks,
5. pass filtered context into the system prompt.

**Important:**  
Do not claim enforcement complete if the path still accepts arbitrary raw `knowledgeContext` from request bodies without tenant filtering.

### R4 — Auditability

Add explicit audit evidence when knowledge scope filtering materially changes retrieval.

**Candidate event:**

```ts
eventType: 'KNOWLEDGE_SCOPE_FILTER_APPLIED'
```

**Payload suggestions:**

- requestedOrgId
- requestedTeamId
- retrievedChunkCount
- allowedChunkCount
- droppedChunkCount
- affectedCollectionIds

### R5 — Live And Regression Validation

Run both offline and live proving commands:

- unit tests for scope matching,
- integration tests for cross-tenant exclusion,
- execute-path tests proving only allowed chunks reach the prompt,
- optional Alibaba live smoke proving the governed execute path still works after retrieval integration.

---

## 4. File Targets

Exact paths may shift slightly once the adapter location is chosen, but the wave should likely touch:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/knowledge-context-injector.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts`
- new retrieval adapter under `src/lib/`
- new or extended policy reader/event types for collection scope
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/admin/tool-registry/page.tsx`
- admin controls for collection scope editing
- new tests around retrieval + execute integration

---

## 5. Acceptance Gate

- user `orgId=org_a` never receives chunks scoped only to `org_b`
- user `teamId=team_a` never receives chunks scoped only to `team_b`
- execute-path tests prove filtered chunks, not raw cross-tenant chunks, are injected into the prompt
- admin can set and review collection scope from the Enterprise Admin surface
- audit evidence exists when chunk filtering drops ineligible results
- previous D1.4a wording is retired: runtime now enforces, not just forwards, tenant scope

---

## 6. Non-Goals

- do not start a broad new knowledge-absorption program here
- do not redesign the entire knowledge-native doctrine lane
- do not claim production-grade vector search if the tranche only adds a bounded retrieval adapter

---

## 7. Wave 2 — Alibaba-First Runtime / Product Validation

After retrieval partitioning is in place, run an Alibaba-first runtime/product validation wave on the real enterprise-admin knowledge path.

### V1 — Governed Execute Validation

Validate that `/api/execute` still behaves correctly after retrieval integration:

- allowed knowledge is injected,
- disallowed knowledge is excluded,
- DLP + quota + enforcement + audit still work together,
- output remains usable for real end-user scenarios.

### V2 — Retrieval-Aware Live Validation

Use Alibaba as the primary live-test lane:

- canonical env: `ALIBABA_API_KEY`
- preferred because it is low-cost, high-quota, and already authorized by operator policy for routine live validation
- use real provider calls only after offline regression tests are green

### V3 — Evidence Focus

This wave is not a generic multi-provider benchmark by default.

It is a product/runtime proof wave focused on:

- real governed runtime behavior,
- real retrieval enforcement behavior,
- real output quality on the integrated path.

Multi-provider comparison is optional and only becomes necessary if portability or provider-routing behavior is itself the tranche goal.

---

## 8. Execution Order Rule

### Preferred rule

Run `Retrieval Partitioning Wave` first, then `Alibaba-first Runtime / Product Validation Wave`.

This is the default because the validation wave is materially stronger once the retrieval path is real and tenant-scoped.

### Exception — parallel execution allowed

Run the two waves in parallel only if they are truly independent.

That means:

- validation does not depend on unfinished retrieval changes,
- retrieval work and validation work have disjoint write scopes or low-conflict surfaces,
- the validation wave can still produce meaningful evidence without waiting for the final retrieval implementation,
- no agent is forced to validate a moving target.

### If parallel is not cleanly justified

Do not parallelize by default.

Required order:

1. finish `Retrieval Partitioning Wave`
2. then run `Alibaba-first Runtime / Product Validation Wave`

---

## 9. Recommendation

Treat this document as a two-wave continuation plan:

1. `Wave 1` — Retrieval Partitioning
2. `Wave 2` — Alibaba-first Runtime / Product Validation

Priority rule:

- if the waves are proven independent, parallel execution is priority #1
- if not, execute them sequentially in the order above

Only after these two waves are resolved should CVF consider another broad knowledge-absorption tranche, because new absorbed knowledge becomes materially more valuable once tenant-scoped retrieval and the integrated runtime path are both proven.
