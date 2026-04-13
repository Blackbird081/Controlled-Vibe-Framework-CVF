# CVF W69-T1 Governed Registry Lifecycle + Read Model Execution Plan — 2026-04-13

Memory class: SUMMARY_RECORD

## 1. Executive Decision

Recommended next bounded wave:

`W69-T1 — Governed Registry Lifecycle + Read Model`

This wave follows the now-delivered `W68-T1 Governed Registry Hardening` tranche.

Its purpose is not to reopen registry hardening from scratch.
Its purpose is to make the governed registry operationally usable after hardening:

- assets can be retired without mutating history
- a previously retired logical asset can be re-registered cleanly
- operators can query and inspect registry state without reading raw JSONL

## 2. Why This Wave Exists

`W68-T1` already delivered:

- duplicate gate
- detail query by `?id=`
- helper-level persistence tests
- canon/docs alignment for the hardening wave

What still remains incomplete for day-to-day governed registry use:

- the duplicate rule currently blocks legitimate replacement flows forever
- the API contract already says "retire first, then update" but retire does not exist yet
- list/read behavior is still too coarse for operator review
- append-only storage exists, but lifecycle semantics are not yet explicit

So the next best move is not provider work and not storage migration.
It is a bounded lifecycle/read-model wave.

## 3. Product Goal

Desired outcome:

`register -> read/filter -> retire -> re-register -> inspect lineage`

The governed registry should behave like an auditable operator surface, not just a write-safe sink.

## 4. Scope

### In Scope

- append-only lifecycle semantics for governed registry entries
- retirement of an active logical asset without deleting history
- re-registration behavior after retirement
- filtered registry list/read behavior
- detail/history behavior that makes active vs retired state legible
- docs/handoff alignment required by those changes

### Out Of Scope

- external storage/backend migration
- provider-lane or PVV/API-key work
- `/api/execute`
- sandbox posture changes
- broad external-asset semantic redesign
- in-place mutation of historical registry lines

## 5. Canonical Lifecycle Rule

The next agent must adopt this rule unless implementation evidence forces a stop:

- logical identity key remains `source_ref + candidate_asset_type`
- at most one **active** entry may exist per logical identity
- retirement must preserve historical auditability
- re-registration is allowed only after the previous active entry has been retired
- append-only posture must remain intact

If the agent believes this rule must change, it must stop and explain why before widening scope.

## 6. Control Points

### CP1 — Lifecycle Semantics

Deliver:

- explicit active/retired model for registry entries
- bounded retire action/route contract
- duplicate gate aligned to active-entry semantics

Acceptance criteria:

- active duplicate still returns refusal
- retired entry remains visible in history
- re-registration after valid retirement is accepted
- no historical JSONL line is edited in place

### CP2 — Read / Query Model

Deliver:

- filtered read behavior for operator use
- minimal query support by fields that matter operationally
- detail/history output that distinguishes active vs retired

Acceptance criteria:

- operator can query by at least `source_ref`, `candidate_asset_type`, and lifecycle status
- detail view is not ambiguous about whether an entry is active or retired
- route contract and UI remain aligned if UI is changed

### CP3 — Docs / Handoff Closure

Deliver:

- API contract updated for lifecycle/read semantics
- handoff refreshed to point at W69 closure state
- any README/reference alignment only if directly required by the route contract

Acceptance criteria:

- next agent does not need to infer lifecycle rules
- docs, handoff, and route behavior say the same thing

## 7. Mandatory Execution Order

The next agent must execute in this order:

1. read the binding protocol
2. define lifecycle rule in code-facing terms
3. implement helper/storage semantics first
4. prove helper/storage semantics with tests
5. implement route behavior
6. prove route behavior with tests
7. add UI/readability changes only if required by the new route contract
8. update docs/handoff last

Do not start with UI polish.
Do not start with storage migration.
Do not skip directly to list filters before the lifecycle rule is explicit.

## 8. Minimum Files Likely In Scope

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/asset-registry.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/asset-registry.test.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/register/route.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/register/route.test.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/governance/external-assets/page.tsx`
- `docs/reference/CVF_W67_T1_EXTERNAL_ASSET_GOVERNANCE_API_CONTRACT.md`
- `AGENT_HANDOFF.md`

Additional files are allowed only if they are clearly required by the bounded lifecycle/read-model scope.

## 9. Mandatory Tests

Minimum proving commands:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/lib/server/asset-registry.test.ts src/app/api/governance/external-assets/register/route.test.ts
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx tsc --noEmit
```

If UI behavior changes materially, rerun:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run test:run
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run build
```

## 10. Required Test Cases

The next agent must cover these cases if relevant to the implemented change:

- duplicate registration while an active entry still exists
- retire active entry
- re-register the same logical asset after retirement
- list/filter by lifecycle status
- list/filter by `source_ref`
- list/filter by `candidate_asset_type`
- detail/history readability for retired vs active entries
- missing file / malformed-line tolerance remains intact

If one of these cases is intentionally deferred, the close-out must say so explicitly.

## 11. Definition Of Done

This wave is done when:

- lifecycle semantics are explicit and append-only
- re-registration after retirement works deterministically
- filtered read behavior is operator-usable
- tests prove both helper and route behavior
- docs and handoff are aligned
- no provider-lane, PVV, or storage-migration scope was touched

## 12. Canonical References

- `docs/reference/CVF_W67_T1_EXTERNAL_ASSET_GOVERNANCE_API_CONTRACT.md`
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/roadmaps/CVF_W68_T1_GOVERNED_REGISTRY_HARDENING_EXECUTION_PLAN_2026-04-13.md`
- `docs/reference/CVF_W68_T1_GOVERNED_REGISTRY_HARDENING_AGENT_PROTOCOL_2026-04-13.md`
- `AGENT_HANDOFF.md`

## 13. Next-Agent Instruction

Do not improvise the wave goal.

The correct next move is:

`treat W69-T1 as a lifecycle/read-model tranche only, preserve append-only auditability, and stop if the work starts drifting toward provider execution, storage migration, or broad ingestion redesign`
