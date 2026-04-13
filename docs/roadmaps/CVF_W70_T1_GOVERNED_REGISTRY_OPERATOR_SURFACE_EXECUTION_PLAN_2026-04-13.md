# CVF W70-T1 Governed Registry Operator Surface Execution Plan — 2026-04-13

Memory class: SUMMARY_RECORD

## 1. Executive Decision

Recommended next bounded wave:

`W70-T1 — Governed Registry Operator Surface`

This wave follows the now-delivered `W69-T1 Governed Registry Lifecycle + Read Model` tranche.

Its purpose is not to reopen registry backend semantics.
Its purpose is to make the already-landed registry capabilities genuinely usable from the operator surface in `cvf-web`.

## 2. Why This Wave Exists

`W67-T1` delivered:

- prepare route
- register route
- bounded operator UI entrypoint

`W68-T1` delivered:

- duplicate gate
- detail read
- persistence hardening

`W69-T1` delivered:

- active/retired lifecycle semantics
- retire route
- filtered read model

What still remains thin is the operator-facing surface:

- lifecycle behavior exists, but the UI does not yet expose it as a first-class workflow
- filtered read/query is available, but not yet integrated into an operator review surface
- retirement exists as an API capability, but not yet as an operator action
- history/readability in the UI is still behind the route contract

So the next best move is not provider work and not storage migration.
It is a bounded operator-surface wave.

## 3. Product Goal

Desired outcome:

`prepare -> register -> inspect active/retired entries -> filter -> retire -> understand re-register path`

The governed registry should be operable from the `cvf-web` governance UI without requiring direct API usage.

## 4. Scope

### In Scope

- `cvf-web` governance UI consumption of existing register/filter/detail/retire capabilities
- operator-facing registry list filters
- operator-facing lifecycle badges and status readability
- operator-triggered retirement action
- operator guidance for re-register flow after retirement
- docs/handoff alignment required by those UI/route integrations

### Out Of Scope

- provider lanes
- PVV/API-key work
- `/api/execute`
- storage backend migration
- broad external-asset semantic redesign
- adding new lifecycle semantics beyond W69

## 5. Canonical UI Rule

The next agent must preserve this rule:

- the UI is a consumer of the route contract, not a new source of governance truth
- lifecycle/readiness decisions continue to live server-side
- the operator surface may improve visibility and controlled actions, but it must not bypass prepare/register/retire route semantics

If the agent believes UI work requires new lifecycle semantics or backend migration, it must stop and say so.

## 6. Control Points

### CP1 — Registry Read Surface

Deliver:

- registry list in the operator UI can display lifecycle state clearly
- operator can filter by at least `status`, `source_ref`, and `candidate_asset_type`
- detail rendering is legible for active vs retired entries

Acceptance criteria:

- UI consumes route filters rather than inventing local filter semantics
- active vs retired is obvious without reading raw JSON
- detail/read output matches current API contract

### CP2 — Operator Retirement Flow

Deliver:

- bounded retire action from the UI for active entries
- read-after-write refresh after retirement
- clear success/error messaging for retirement outcomes

Acceptance criteria:

- retired entries cannot present as still active after refresh
- active-only action posture is respected
- route errors surface intelligibly to the operator

### CP3 — Re-Register Guidance / Review UX

Deliver:

- clear guidance in the operator surface that duplicate blocking is lifecycle-aware
- clear explanation that re-registration requires retirement of the prior active entry
- warnings and registry status remain easy to interpret

Acceptance criteria:

- operator does not need to infer the lifecycle rule
- no fake “update in place” affordance is introduced
- UI language matches canon/docs

### CP4 — Closure Alignment

Deliver:

- handoff refreshed
- README / reference alignment only if required by the UI behavior
- explicit closure note for W70-T1

Acceptance criteria:

- next agent does not need to rediscover what W70 was meant to do
- docs and UI behavior say the same thing

## 7. Mandatory Execution Order

The next agent must execute in this order:

1. read the binding protocol
2. map current route contract to the existing governance UI
3. implement filter/read surface first
4. prove filter/read behavior
5. implement retire action
6. prove retire action behavior
7. add guidance/readability improvements
8. update docs/handoff last

Do not start with visual polish only.
Do not start by changing backend semantics.
Do not start by adding unrelated dashboard features.

## 8. Minimum Files Likely In Scope

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/governance/external-assets/page.tsx`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/register/route.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/retire/route.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/register/route.test.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/retire/route.test.ts`
- `docs/reference/CVF_W67_T1_EXTERNAL_ASSET_GOVERNANCE_API_CONTRACT.md`
- `AGENT_HANDOFF.md`

Additional files are allowed only if they are clearly required by the bounded operator-surface scope.

## 9. Mandatory Tests

Minimum proving commands:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/app/api/governance/external-assets/register/route.test.ts src/app/api/governance/external-assets/retire/route.test.ts
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx tsc --noEmit
```

Because this is an operator-surface tranche, if `page.tsx` changes materially the next agent must also run:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run test:run
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run build
```

## 10. Required Test Cases

The next agent must cover these cases if relevant to the implemented change:

- filtered registry read is reflected in the operator surface
- lifecycle badge/status display changes correctly for active vs retired
- retire action is available only for active entries
- retire action success path refreshes visible state
- retire action failure path is legible
- operator guidance for re-register flow is visible and not misleading

If one of these cases is intentionally deferred, the close-out must say so explicitly.

## 11. Definition Of Done

This wave is done when:

- the UI consumes the registry lifecycle/read model in a usable way
- retirement can be initiated from the operator surface
- lifecycle and re-register guidance are visible and correct
- route/UI behavior is proven with appropriate tests/build
- docs and handoff are aligned
- no provider-lane, PVV, storage migration, or backend-semantics scope was touched

## 12. Canonical References

- `docs/reference/CVF_W67_T1_EXTERNAL_ASSET_GOVERNANCE_API_CONTRACT.md`
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/roadmaps/CVF_W69_T1_GOVERNED_REGISTRY_LIFECYCLE_READMODEL_EXECUTION_PLAN_2026-04-13.md`
- `docs/reference/CVF_W69_T1_GOVERNED_REGISTRY_LIFECYCLE_READMODEL_AGENT_PROTOCOL_2026-04-13.md`
- `AGENT_HANDOFF.md`

## 13. Next-Agent Instruction

Do not improvise the wave goal.

The correct next move is:

`treat W70-T1 as an operator-surface tranche only, consume the existing registry contract faithfully, and stop if the work starts drifting toward provider execution, storage migration, or backend-semantics redesign`
