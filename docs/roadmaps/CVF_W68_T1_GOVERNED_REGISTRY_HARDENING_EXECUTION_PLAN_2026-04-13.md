# CVF W68-T1 Governed Registry Hardening Execution Plan — 2026-04-13

Memory class: SUMMARY_RECORD

## 1. Executive Decision

Recommended next bounded wave:

`W68-T1 — Governed Registry Hardening`

This wave starts only after the now-delivered `W67-T1 External Asset Productization` wave.

The purpose is not to reopen external-asset architecture exploration.
The purpose is to harden the newly delivered registry path so it behaves like a trustworthy governed product surface rather than a thin MVP sink.

## 2. Why This Wave Exists

`W67-T1` already delivered:

- bounded external-asset prepare route
- operator-facing UI
- registry write path
- server-side registry gate re-derive
- canonical API contract

What still remains weak is registry maturity:

- duplicate handling is not yet explicit
- read/query model is minimal
- file-backed persistence posture is still MVP-grade
- audit/readability of registry entries can be strengthened

So the next best move is not another capability wave.
It is a hardening wave.

## 3. Scope

### In Scope

- governed registry write safety
- duplicate detection / idempotency posture
- registry read/query/detail usability
- bounded file-backed persistence hardening
- docs/handoff updates needed to explain registry behavior

### Out Of Scope

- reopening PVV/API-key/provider work
- modifying `/api/execute`
- changing provider adapters or run lanes
- broadening external asset intake semantics again
- new architecture exploration outside registry hardening

## 4. Product Goal

Desired outcome:

`prepare -> server re-derive -> register -> deterministic registry behavior -> auditable read model`

The registry should no longer behave like a write-only MVP append log from the operator perspective.

## 5. Control Points

### CP1 — Registry Safety Rules

Deliver:

- explicit duplicate handling rule
- explicit idempotency or collision policy
- refusal behavior for invalid duplicate writes

Acceptance criteria:

- duplicate policy documented canonically
- route behavior matches doc
- tests cover repeat registration attempts

### CP2 — Registry Read Model

Deliver:

- list/read/detail behavior that is useful for operators
- minimal filtering or structured query support
- stable response shape for registry browsing

Acceptance criteria:

- operator can inspect one entry in detail without reading raw JSONL
- registry list is no longer the only read surface
- route contract and UI stay aligned

### CP3 — Persistence Hardening

Deliver:

- malformed-line handling posture documented and tested
- file existence / initialization / append behavior verified
- retention and backup posture written down for local-store MVP

Acceptance criteria:

- file-backed behavior is deterministic and tested
- docs clearly state MVP limits and recovery posture
- no accidental overlap with PVV evidence or unrelated data files

### CP4 — Closure Alignment

Deliver:

- handoff refreshed
- roadmap / contract / readme alignment if required
- clear “done” statement for W68-T1

Acceptance criteria:

- next agent does not need to infer scope
- canon docs and handoff say the same thing

## 6. Mandatory Execution Order

The next agent must execute in this order:

1. read the binding protocol for W68-T1
2. implement CP1 first
3. prove CP1 with tests before touching CP2
4. implement CP2
5. implement CP3
6. finish with CP4 documentation alignment

Do not start with UI polish.
Do not start with unrelated docs cleanup.
Do not skip directly to “nice to have” filtering before write-safety is nailed down.

## 7. Minimum Files Likely In Scope

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/asset-registry.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/register/route.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/register/route.test.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/governance/external-assets/page.tsx`
- `docs/reference/CVF_W67_T1_EXTERNAL_ASSET_GOVERNANCE_API_CONTRACT.md`
- `AGENT_HANDOFF.md`

Additional files are allowed only if they are clearly required by the bounded registry-hardening scope.

## 8. Mandatory Tests

Minimum proving commands:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/app/api/governance/external-assets/register/route.test.ts
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx tsc --noEmit
```

If `asset-registry.ts` behavior changes materially, add direct tests for the helper itself, not only route-mock tests.

If the UI changes materially, rerun:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run test:run
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run build
```

## 9. Definition Of Done

This wave is done when:

- duplicate/idempotency behavior is explicit and tested
- registry browsing is operator-usable
- local persistence posture is documented and less fragile
- docs and handoff are aligned
- no provider-lane or PVV scope was touched

## 10. Canonical References

- `docs/roadmaps/CVF_W67_T1_EXTERNAL_ASSET_PRODUCTIZATION_EXECUTION_PLAN_2026-04-13.md`
- `docs/reference/CVF_W67_T1_EXTERNAL_ASSET_GOVERNANCE_API_CONTRACT.md`
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/assessments/CVF_NEXT_DEVELOPMENT_DIRECTION_REVIEW_2026-04-13.md`
- `AGENT_HANDOFF.md`

## 11. Next-Agent Instruction

Do not improvise the wave goal.

The correct next move is:

`treat W68-T1 as a registry-hardening tranche only, follow the binding protocol, and stop if the work starts drifting toward provider execution, new ingestion theory, or unrelated UI churn`
