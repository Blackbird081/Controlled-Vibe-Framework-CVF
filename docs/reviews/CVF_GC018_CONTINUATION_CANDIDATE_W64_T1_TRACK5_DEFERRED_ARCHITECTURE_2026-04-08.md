# CVF GC-018 Continuation Candidate — W64-T1: Track 5 Deferred Architecture (5A+5B)

Memory class: FULL_RECORD

> Date: 2026-04-08
> Candidate: W64-T1 — Track 5 Deferred Architecture: Model Gateway Router + Sandbox Runtime
> Quality assessment: `docs/assessments/CVF_POST_W63_CONTINUATION_QUALITY_ASSESSMENT_2026-04-08.md` (existing)
> Pre-authorization assessment: `docs/assessments/CVF_TRACK5_DEFERRED_ARCHITECTURE_READINESS_ASSESSMENT_2026-04-08.md`
> Decision: AUTHORIZED

---

## Candidate Summary

Implement the two doctrine-resolved Track 5 sub-items from the Post-MC5 Continuation Strategy:

+ **5A — Model Gateway Provider Router (Option B)**: Governance routing contract that validates
  which LLM providers an agent is ALLOWED to use. CVF governs intent, does not call providers.
  Decision forced by Supreme Doctrine §2, §9, §10 + Whitepaper §7.3 rule 4.
+ **5B — Sandbox Runtime Physical Isolation (worker_threads)**: Typed isolation contract
  replacing boolean stub, with `worker_threads` adapter wired into EPF `CommandRuntimeContract`
  `case "sandbox"` branch. Platform forced by doctrine §7, §11 + Windows dev environment.

Sub-item 5C (Agent Definition Registry) is NOT included — remains CLOSED-BY-DEFAULT per W55-T1.

---

## GC-018 Packet

```
GC-018 Continuation Candidate
- Candidate ID: W64-T1
- Date: 2026-04-08
- Parent roadmap: docs/roadmaps/CVF_POST_MC5_CONTINUATION_STRATEGY_ROADMAP_2026-04-08.md (Track 5)
- Proposed scope: Track 5A (ProviderRouterContract — governance routing, Option B) +
  Track 5B (SandboxIsolationContract + WorkerThreadSandboxAdapter)
- Continuation class: REALIZATION
- Active quality assessment: docs/assessments/CVF_POST_W63_CONTINUATION_QUALITY_ASSESSMENT_2026-04-08.md
- Pre-authorization assessment: docs/assessments/CVF_TRACK5_DEFERRED_ARCHITECTURE_READINESS_ASSESSMENT_2026-04-08.md
- Assessment date: 2026-04-08
- Quality-first decision: EXPAND_NOW
- Why expansion is the correct move:
  (1) All 4 prior tracks CLOSED DELIVERED (W60-W63)
  (2) CI coverage 100% (8294 tests green)
  (3) Architectural decisions resolved via doctrine audit (not opinion — 5 evidence sources for 5A, 6 for 5B)
  (4) EPF wiring point for sandbox already exists (DELEGATED_TO_SANDBOX status)
  (5) Calendar boundary (2026-05-01) was default, not binding — real blockers were decisions, now resolved
- Quality protection commitments:
  CPF 2929 tests must remain green after 5A changes;
  EPF 1301 tests must remain green after 5B wiring;
  No modification of FROZEN/FIXED_INPUT gateway surfaces;
  All new files must stay under GC-023 advisory limit (700 lines for .ts)
- Why now: Doctrine audit in §8 of pre-authorization assessment proves both decisions are
  architecturally forced — there is no legitimate alternative option. Waiting until 2026-05-01
  produces no new information (the doctrine is FROZEN and will not change).
- Active-path impact: 2 new CPF contracts, 1 new Safety Runtime contract, 1 new Adapter Hub
  adapter, ~50 tests total, barrel export updates, whitepaper box updates
- Risk if deferred: Model Gateway and Sandbox Runtime remain [DEFERRED] indefinitely with no
  technical blocker — only a calendar convention that has been superseded by doctrine resolution
- Lateral alternative considered: YES (wait for 2026-05-01) — rejected per §8 of assessment:
  the binding blockers were decisions, not time, and the decisions are now resolved
```

---

## Scope Boundaries

### In Scope

+ `ProviderRouterContract` — governance policy routing (Option B per doctrine)
+ `ProviderRouterConsumerPipelineContract` — consumer pipeline variant
+ `ProviderRouterBatchContract` — batch variant
+ `SandboxIsolationContract` — typed contract at `CVF_v1.7.1_SAFETY_RUNTIME/contracts/`
+ `WorkerThreadSandboxAdapter` — concrete adapter at `CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/`
+ Wiring: `CommandRuntimeContract` sandbox branch executor
+ Barrel exports: `control.plane.gateway.barrel.ts` (5A), adapter index (5B)
+ Whitepaper: Model Gateway `[DEFERRED]` → `DELIVERED`; Sandbox Runtime `[DEFERRED]` → `DELIVERED`
+ Tests: ~50 new tests total

### Out of Scope

+ Concrete LLM provider implementations (Option A — ruled out by doctrine)
+ API key management, secret rotation, cost tracking (Option A artifacts)
+ Docker adapter (future second adapter — not first wave)
+ Agent Definition Registry consolidation (5C — CLOSED-BY-DEFAULT)
+ Modification of any FIXED_INPUT gateway surface

---

## Doctrine Traceability

| Decision | Doctrine source | Status |
| --- | --- | --- |
| Option B for Model Gateway | `CVF_ARCHITECTURE_PRINCIPLES.md` §2, §9; `CVF_PRODUCT_POSITIONING.md` §3, §10; Whitepaper §7.3 #4 | FROZEN — cannot be overridden |
| `worker_threads` first | `CVF_ARCHITECTURE_PRINCIPLES.md` §7, §11; Whitepaper diagram "Worker Agents"; Windows 11 dev env | Platform-constrained |
| 5C excluded | `AGENT_HANDOFF.md` W55-T1; CLOSED-BY-DEFAULT posture | Governance gate |

---

*Filed by: CVF Agent (Strategic Audit)*
*Date: 2026-04-08*
*Governance: GC-018 Continuation Candidate — REALIZATION class*
