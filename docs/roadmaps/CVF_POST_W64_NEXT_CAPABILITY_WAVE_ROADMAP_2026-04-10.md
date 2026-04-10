# CVF Post-W64 Next Capability Wave Roadmap

Memory class: SUMMARY_RECORD

> Date: 2026-04-10
> Status: PLANNING-ONLY
> Authorization posture: no active tranche; any implementation from this roadmap requires a fresh bounded `GC-018`
> Baseline: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (`v3.7-W46T1`, CLOSURE-ASSESSED) + `W64-T1 CLOSED DELIVERED`
> Context: `MC1` through `MC5` are complete; Post-MC5 continuation strategy is fully resolved; future work should proceed only as bounded capability waves rather than broad architecture rediscovery
> Last refreshed: 2026-04-11 — `W65-T1` closed delivered; Track 1 below is now complete and retained here as historical context plus post-closure reference

---

## 1. Objective

Define the next bounded development roadmap after `W64-T1`, focused on:

1. `Phase B packaging` for additional public-export candidates
2. `Sandbox Runtime Wave 2` with a real physical sandbox path
3. `cvf-web` uplift from contract-aligned sandbox stub to a true physical isolation execution path

This roadmap does **not** reopen the core architecture closure lane. It proposes the next capability waves that may be authorized after closure.

---

## 2. Canonical Starting Point

The following are treated as already settled:

- `MC1` through `MC5` are complete
- `CPF`, `GEF`, `LPF`, and `EPF` are canonically closed in the current baseline
- `W64-T1` delivered `ProviderRouterContract`, `SandboxIsolationContract`, and `WorkerThreadSandboxAdapter`
- `cvf-web` now inherits `Track 5A` in the live execute path
- `cvf-web` mirrors `Track 5B` only as a `contract-aligned stub` today; it does **not** yet provide physical runtime isolation

Therefore the next work should be framed as:

- `capability expansion`
- `product-surface integration`
- `packaging/publication readiness`

not as another repo-wide closure scan.

---

## 3. Why A New Roadmap Is Needed

The post-closure docs now point to three future-facing pressures:

1. `Phase B packaging` is the cleanest continuation of the pre-public lane once Phase A targets are ready for publication.
2. `SandboxIsolationContract` has a second-wave adapter opportunity (`docker`) that was explicitly left out of `W64-T1`.
3. `cvf-web` still stops at a typed sandbox stub. If the product needs to execute user-controlled code with real containment guarantees, web must be wired to a true physical sandbox backend.

These are related enough to plan together, but they should still execute as bounded sub-tracks with separate entry decisions if needed.

---

## 4. Strategic Tracks

### Track 1 — Packaging Phase B

- **Priority**: MEDIUM
- **Class**: PACKAGING
- **Purpose**: extend pre-public packaging beyond Phase A once publication boundaries and export readiness are proven stable
- **Status**: CLOSED DELIVERED via `W65-T1` on 2026-04-10

**Candidate scope**

- Additional package export-readiness review for:
  - `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
  - `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION`
  - `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION`
- README, package boundary, and dependency leakage review
- export metadata and publication posture standardization

**Out of scope**

- broad repo restructuring
- relocation reopen
- renaming or merging historical roots

**Exit criteria**

- Phase B target set explicitly named
- each target has export boundary notes and publication posture
- no internal dependency leakage is introduced
- package-level verify is green for all selected targets

**Delivered outcome (`W65-T1`)**

- `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` → `CANDIDATE`
- `CVF_GOVERNANCE_EXPANSION_FOUNDATION` → `CANDIDATE`
- `CVF_LEARNING_PLANE_FOUNDATION` → `CANDIDATE`
- `CVF_v1.7.1_SAFETY_RUNTIME` → `REVIEW_REQUIRED` with 4 blockers documented
- Combined Phase A + B candidate set is now `6` packages
- Follow-up packaging work is no longer “Phase B readiness”; it is now:
  - publication decision / publish execution for the candidate set
  - Safety Runtime package-boundary split if export candidacy is desired later

---

### Track 2 — Sandbox Runtime Wave 2

- **Priority**: HIGH if real containment is needed
- **Class**: REALIZATION / SECURITY / INFRA
- **Purpose**: add a true physical sandbox backend beyond `worker_threads`/stub semantics

**Core outcome**

Introduce a second concrete `SandboxExecutor` path using a real containment technology, with `docker` as the default candidate.

**Candidate scope**

- Create `DockerSandboxAdapter` for `SandboxIsolationContract`
- define runtime configuration surface for:
  - image selection
  - CPU / memory caps
  - network egress control
  - filesystem mount policy
  - temp workspace lifecycle
  - execution timeout / kill behavior
- add audit evidence and failure taxonomy for container launch / containment / cleanup
- expand tests from contract-only behavior into adapter-level integration behavior where feasible

**Out of scope**

- Kubernetes orchestration
- cloud-specific sandbox orchestration
- multi-tenant billing or quota platform
- browser-only sandbox tricks presented as physical isolation

**Exit criteria**

- `SandboxIsolationContract` has at least two concrete backends:
  - `worker_threads` for best-effort delegated execution
  - `docker` for physical isolation
- policy violations fail closed before or during execution
- cleanup behavior is deterministic enough for repeated test/dev use
- adapter documentation clearly distinguishes isolation guarantees by backend

---

### Track 3 — `cvf-web` Physical Sandbox Uplift

- **Priority**: HIGH if `cvf-web` must execute user-controlled code safely
- **Class**: PRODUCT INTEGRATION / SECURITY
- **Purpose**: replace the current web sandbox stub path with a real server-side physical sandbox execution flow

**Current state**

- `cvf-web` provider routing is live
- `cvf-web` sandbox adapter is contract-aligned only
- browser `createSandbox()` remains client-only and is not a substitute for server-side containment

**Target state**

`cvf-web` can submit bounded code-execution requests to a physical sandbox backend and receive:

- structured execution result
- containment violations
- audit trace
- bounded stdout/stderr
- deterministic deny/fail-closed behavior

**Candidate scope**

- introduce a server-side execution endpoint or service path that uses `SandboxIsolationContract`
- wire `cvf-web` sandbox execution to `DockerSandboxAdapter`
- keep non-code AI generation on the normal provider path
- split clearly between:
  - `LLM response generation`
  - `sandboxed code execution`
- define request types for:
  - code
  - language/runtime
  - resource budget
  - network/filesystem policy
  - execution labels and audit metadata
- add integration tests for:
  - valid run
  - timeout
  - denied filesystem/network policy
  - invalid config fail-closed
  - cleanup after failure

**Key design rule**

Do **not** pretend all `/api/execute` traffic belongs in a sandbox. Only code-execution workloads should flow into the sandbox path. General AI prompting should remain on the provider-routing path.

**Exit criteria**

- web no longer over-relies on a stub for server-side sandbox semantics
- sandboxed code execution uses a real physical backend
- docs/handoff can honestly state that web has physical sandbox support for the bounded execution path
- product tests cover both normal AI routing and sandbox execution routing

---

### Track 4 — Agent Definition Registry Reassessment

- **Priority**: LOW
- **Class**: ASSESSMENT / DECISION
- **Purpose**: revisit `Track 5C` only if architectural pressure reappears

**Candidate scope**

- determine whether registry consolidation is now a real operational need
- verify whether current freeze-in-place posture still outweighs consolidation benefits

**Exit criteria**

- either keep `5C` closed-by-default
- or file a separate future implementation candidate with explicit justification

---

## 5. Recommended Execution Sequence

If the user wants the smallest-risk progression after `W65-T1`, the recommended order is:

1. `Track 2` — Docker-backed sandbox runtime realization
2. `Track 3` — `cvf-web` physical sandbox integration on top of the realized backend
3. publication follow-up for the existing Phase A + B candidate packages
4. `Track 4` — Agent Definition Registry reassessment only if still needed

Reasoning:

- Packaging Phase B itself is already complete, so the next real capability pressure shifts to physical sandbox realization.
- `cvf-web` should not invent its own physical isolation layer before the shared runtime backend exists.
- The shared backend should become canonical first, then the product surface should consume it.

---

## 6. Proposed Control Points

### CP1 — Packaging Phase B Boundary Definition

- identify target packages
- record publication posture and export boundaries
- verify package-local build/check/test status
- state: CLOSED DELIVERED (`W65-T1`)

### CP2 — Docker Sandbox Adapter Foundation

- create adapter
- define config contract and cleanup rules
- add adapter-level tests and docs

### CP3 — `cvf-web` Sandbox Execution Integration

- add bounded web execution path for sandboxed workloads
- wire to shared sandbox contract + docker adapter
- add route tests and product-surface docs

### CP4 — Post-Integration Hardening

- add CI coverage if sandbox integration introduces new operational risk
- verify audit traces and deny/fail-closed behavior
- update handoff and quality assessment

---

## 7. File Manifest (Candidate)

| Action | Candidate file / area | Purpose |
|---|---|---|
| CREATE | `docs/roadmaps/CVF_GC018_W6X_PHASE_B_PACKAGING_ROADMAP_*.md` | bounded Phase B tranche if authorized |
| CREATE | `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/docker.sandbox.adapter.ts` | real physical sandbox backend |
| MODIFY | `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/tests/adapters.test.ts` or split docker test file | adapter verification |
| MODIFY | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.isolation.contract.ts` | backend selection / config support if needed |
| MODIFY | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/sandbox-contract-adapter.ts` | replace stub-only path with real backend wiring for server-side execution use cases |
| MODIFY | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` or new dedicated route | product integration path |
| CREATE | web integration tests for sandbox route | regression coverage |
| MODIFY | `AGENT_HANDOFF.md` + quality/assessment docs | truth-sync after delivery |

---

## 8. Risks And Constraints

| Risk | Why it matters | Mitigation |
|---|---|---|
| Docker dependency drift | local dev and CI may not have identical Docker availability | make docker-backed tests capability-aware and document prerequisites |
| Over-sandboxing the wrong path | normal LLM prompts do not need physical sandboxing | keep AI provider routing and code execution routing separate |
| Documentation overclaim | web may again be described as more isolated than it really is | require wording review in handoff + assessment at tranche close |
| Security theater | process wrappers without real isolation may look safer than they are | define explicit guarantee levels per backend |
| Packaging churn | publication prep can reopen dependency leaks | keep packaging as a bounded manifest-driven review, not ad hoc repo cleanup |

---

## 9. Authorization Rules

This roadmap is not self-authorizing.

Before implementation begins:

- open a fresh bounded `GC-018`
- choose the exact track or control point
- confirm whether the tranche is:
  - `PACKAGING`
  - `REALIZATION`
  - `PRODUCT INTEGRATION`
  - or a mixed lane with explicit boundaries

Do not combine all tracks into one oversized tranche unless there is a strong reason to do so.

---

## 10. Recommended Default Next Step

If one next roadmap candidate must be chosen now, the cleanest sequence is:

1. authorize a `Docker sandbox` tranche first
2. follow with a dedicated `cvf-web physical sandbox` integration tranche that consumes the shared backend
3. treat packaging as a publication follow-up lane for the existing candidate set, not as the next capability implementation wave

This keeps the shared runtime canon ahead of the product integration layer and avoids teaching `cvf-web` a one-off sandbox architecture.

---

*Generated: 2026-04-10*
*Scope: post-W64 bounded capability planning*
