# GC-018 Continuation Candidate Authorization

**Tranche:** W96-T1 — Wave 2 Alibaba-first Retrieval Live Validation  
**Date:** 2026-04-18  
**Class:** VALIDATION_EVIDENCE / GOVERNED_RUNTIME_BENCHMARK  
**Authorized by:** Operator (this session)  
**GC-018 reference:** `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`

---

## Mandate

Wave 1 (Retrieval Partitioning) is CLOSED DELIVERED 2026-04-18. This tranche implements Wave 2: Alibaba-first Runtime / Product Validation as specified in:

`docs/roadmaps/CVF_ENTERPRISE_ADMIN_RETRIEVAL_PARTITIONING_ROADMAP_2026-04-18.md` — Section 7 (V1–V3)

The purpose is to prove, with a real Alibaba live inference call, that the integrated `/api/execute` path:

1. correctly injects tenant-scoped knowledge chunks into the AI context (V1 — Governed Execute Validation)
2. drops cross-tenant chunks and emits `KNOWLEDGE_SCOPE_FILTER_APPLIED` audit evidence (V1 + V2 — Retrieval-Aware Live Validation)
3. allows global collections to reach all authorized sessions (V1)
4. produces usable output on the integrated path (V3 — Evidence Focus)

---

## Scope

**New file:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.retrieval.live.test.ts`

**Tests authorized (4 live, skipIf no ALIBABA_API_KEY):**

| Test ID | Scenario | Gate |
|---------|----------|------|
| W96-L-001 | exec team session → exec-playbook chunk injected | V1/V2 positive injection |
| W96-L-002 | engineering team session → engineering-runbooks chunk injected | V1/V2 team scope |
| W96-L-003 | org_a session drops org_b chunk → KNOWLEDGE_SCOPE_FILTER_APPLIED | V1/V2 cross-tenant isolation |
| W96-L-004 | global governance collection available to all sessions | V1/V2 global availability |

---

## Acceptance Gates

Matches Wave 1 roadmap R5 gate:

- `user orgId=org_a` never receives chunks scoped only to `org_b` ✓ (W96-L-003)
- execute-path tests prove filtered chunks, not raw cross-tenant chunks, are injected ✓ (W96-L-001, W96-L-002)
- audit evidence exists when chunk filtering drops ineligible results ✓ (W96-L-003)
- previous D1.4a plumbing-only posture retired: runtime now enforces at live inference time ✓ (all 4 tests)

---

## Constraints

- Do not alter test scenarios, intents, or assertion thresholds after any live run is observed.
- Live tests skip automatically if `ALIBABA_API_KEY` is absent; offline baseline is unaffected.
- Model and quota: tests use whatever Alibaba model the route selects by default; no model pinning in this tranche.
- Mocks retained from Wave 1 pattern: `evaluateEnforcement` (ALLOW), `checkTeamQuota` (not exceeded), `verifySessionCookie` (injected per test). Guard engine is **not mocked** — tests validate the complete governed path.

---

## Non-Goals

- Not a multi-provider comparison benchmark.
- Not a full PVV corpus run (that is the W86-T1 tranche).
- Not a load or performance test.
