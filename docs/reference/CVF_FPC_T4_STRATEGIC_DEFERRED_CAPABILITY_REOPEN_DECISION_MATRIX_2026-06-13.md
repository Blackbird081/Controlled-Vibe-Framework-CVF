# CVF FPC-T4 Strategic Deferred Capability Reopen Decision Matrix

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-13

Worker: Claude

Snapshot time: 2026-06-13 (execution HEAD 2360fcf8)

Commit mode: WORKER_MUST_NOT_COMMIT

rawMemoryReleased=false

## Purpose

Rank the strategic deferred CVF foundation capabilities from the FPC-T1 deferred
capability list. For each candidate, decide whether it should remain deferred or
become a future bounded planning tranche or implementation candidate. Record
anti-overconstraint discipline and co-work trace supervision analysis.

This matrix is decision-only. It does not authorize implementation, runtime
mutation, registry mutation, provider/live proof, public-sync, or any capability
beyond source-backed strategic ranking and disposition.

## Scope Boundary

Allowed scope: source-backed candidate ranking, anti-overconstraint analysis,
co-work supervision boundary, recommended next tranche, finding-to-governance
disposition.

Forbidden scope: Model Gateway or Sandbox Runtime implementation; provider/API
use; live proof; registry mutation; session-state mutation; public-sync;
Policy_Local; external Document Translator; corpus ingestion; T12; OS audit;
endpoint monitoring; agent computer-control; cowork product development.

## Source Authority Table

| Source | Path | Role in this matrix |
| --- | --- | --- |
| FPC-T1 deferred capability list | `docs/reference/CVF_FPC_T1_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_AUDIT_MATRIX_2026-06-13.md` lines 376-388 | authoritative candidate list with deferral reasons and re-activation conditions |
| FPC roadmap FPC-T4 row | `docs/roadmaps/CVF_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_COMPLETION_ROADMAP_2026-06-13.md` line 276 | defines FPC-T4 as deferred capability reopen decision lane |
| FPC roadmap forbidden scope | `docs/roadmaps/CVF_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_COMPLETION_ROADMAP_2026-06-13.md` line 141 | Model Gateway and Sandbox Runtime implementation forbidden in current FPC scope |
| FPC roadmap FPC-T3-C04+C01 closure | `docs/roadmaps/CVF_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_COMPLETION_ROADMAP_2026-06-13.md` lines 497-539 | FPC-T4 held behind operator decision; FPC-T3 now closed |
| FPC roadmap claim boundary | `docs/roadmaps/CVF_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_COMPLETION_ROADMAP_2026-06-13.md` lines 683-690 | no implementation, Model Gateway, Sandbox, or readiness claim |
| FPC-T2 matrix FPC-T2-C05 row | `docs/reference/CVF_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_MATRIX_2026-06-13.md` line 497 | FPC-T3-C01 is hard prerequisite for C05 registry entry |
| FPC-T3 coverage plan | `docs/reference/CVF_FPC_T3_FOUNDATION_CHECKER_TEMPLATE_COVERAGE_PLAN_2026-06-13.md` | FPC-T3-C01 priority 1; C04+C01 now implemented |
| GC-018 baseline | `docs/baselines/CVF_GC018_FPC_T4_STRATEGIC_DEFERRED_CAPABILITY_REOPEN_DECISION_2026-06-13.md` | dispatch authorization and forbidden boundary |
| Work order | `docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_T4_STRATEGIC_DEFERRED_CAPABILITY_REOPEN_DECISION_FOR_CLAUDE_2026-06-13.md` | candidate requirements, co-work supervision boundary, anti-overconstraint instructions |
| Model Gateway capability registry | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts` line 43 | `PROVIDER_CAPABILITY_REGISTRY` (existing source surface) |
| Model Gateway provider registry | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts` line 31 | `ProviderRegistry` class (existing source surface) |
| Model Gateway method gate | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-gate.ts` lines 62, 78, 90 | `getProviderMethodContract`, `assertRegistryProviderMethodSupported`, `listRegistrySupportedMethods` |
| Model Gateway public exports | `EXTENSIONS/CVF_MODEL_GATEWAY/src/index.ts` lines 67, 122, 132-133 | `ProviderRegistry`, `PROVIDER_CAPABILITY_REGISTRY`, `getProviderMethodContract`, `listRegistrySupportedMethods` exported |
| Trust Sandbox package | `EXTENSIONS/CVF_TRUST_SANDBOX/package.json` lines 2, 4 | coordination package `cvf-trust-sandbox` |
| Trust Sandbox README | `EXTENSIONS/CVF_TRUST_SANDBOX/README.md` | coordination-only, no physical merge; CVF_v1.7.1_SAFETY_RUNTIME remains full runtime |
| Trust Sandbox runtime-module entry | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/runtime-modules.ts` lines 152-159 | `trust-sandbox` entry: `NOT_EXPOSED`, coordination package until sandbox action proven |
| Sandbox contract adapter | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/sandbox-contract-adapter.ts` line 11 | no physical/server-side execution isolation in web API surface |
| Sandbox audit/execute surfaces | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/sandbox-contract-adapter.ts` lines 113, 139, 214 | `auditLog`, `executeInSandbox`, `getSandboxAuditLog` (simulated/stub execution) |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Disposition |
| --- | --- | --- | --- | --- |
| Model Gateway (EPF provider routing) is formally deferred at MC4 | `docs/reference/CVF_FPC_T1_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_AUDIT_MATRIX_2026-06-13.md` | line 378 | `Model Gateway (EPF provider routing)` | ACCEPT |
| Sandbox Runtime (full physical isolation) is formally deferred at MC4 | `docs/reference/CVF_FPC_T1_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_AUDIT_MATRIX_2026-06-13.md` | line 379 | `Sandbox Runtime (full physical isolation)` | ACCEPT |
| PROVIDER_CAPABILITY_REGISTRY exists as current source surface | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts` | line 43 | `PROVIDER_CAPABILITY_REGISTRY` | ACCEPT |
| ProviderRegistry class exists as current source surface | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts` | line 31 | `ProviderRegistry` | ACCEPT |
| getProviderMethodContract, assertRegistryProviderMethodSupported, listRegistrySupportedMethods exist | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-gate.ts` | lines 62, 78, 90 | `getProviderMethodContract`, `assertRegistryProviderMethodSupported`, `listRegistrySupportedMethods` | ACCEPT |
| Trust Sandbox is a coordination package, NOT_EXPOSED, no sandbox action proven | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/runtime-modules.ts` | lines 152-159 | `trust-sandbox` entry | ACCEPT |
| sandbox-contract-adapter states no physical/server-side execution isolation | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/sandbox-contract-adapter.ts` | line 11 | `no physical/server-side execution isolation` | ACCEPT |
| sandbox-contract-adapter exposes simulated execution (stub platform) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/sandbox-contract-adapter.ts` | line 143 | `platform ?? 'stub'` | ACCEPT |
| FPC-T2-C05 requires FPC-T3-C01 as hard prerequisite | `docs/reference/CVF_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_MATRIX_2026-06-13.md` | line 497 | `FPC-T2-C05` | ACCEPT |
| FPC-T3-C04+C01 is now closed | `docs/roadmaps/CVF_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_COMPLETION_ROADMAP_2026-06-13.md` | lines 501-503 | `Status: CLOSED_PASS_BOUNDED` | ACCEPT |

## Strategic Reopen Candidate Matrix

Candidates drawn from FPC-T1 deferred capability list
(`docs/reference/CVF_FPC_T1_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_AUDIT_MATRIX_2026-06-13.md`
lines 376-388) plus FPC-T2-C05 as a planning-tranche comparator.

| ID | Strategic Reopen Candidate | Current Status | Foundation Value | Source Confidence | Dependency Ready | Anti-Overconstraint / Latency Impact | Co-Work Supervision Value | Reopen Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-01 | FPC-T2-C05: Evidence-to-claim interlock registry entry | FPC-T2-C05 PARKED: FPC-T3-C01 prerequisite now satisfied (FPC-T3-C04+C01 CLOSED_PASS_BOUNDED 2026-06-13) | MEDIUM-HIGH: closes a real FPC system-loop interlock gap, but it is a narrow registry follow-up rather than a strategic deferred capability reopen | HIGH: source surfaces verified; `check_epistemic_process_packet.py` and template block are now in place | YES: FPC-T3-C01 prerequisite now satisfied; no additional runtime mutation needed; requires only a registry-edit work order | LOW LATENCY IMPACT: registry-only edit; no blocking gate added to normal workflow; narrow scope; does not slow ordinary CVF commits | MEDIUM: strengthens co-work trace by ensuring evidence-to-claim steps are machine-registered interlocks; Codex/Claude interactions will be checked by the epistemic packet gate | REOPEN_AS_PLANNING_TRANCHE |
| C-02 | Model Gateway: EPF provider routing reopen | `Model Gateway (EPF provider routing)` DEFERRED: requires provider/API authorization (FPC-T1 line 378) | HIGH: `PROVIDER_CAPABILITY_REGISTRY` and `ProviderRegistry` are current source surfaces (verified); provider routing is a large CVF Execution Plane gap | HIGH for planning: source surface found and verified; capability registry and method-gate contracts are complete | PARTIAL: GC-018 + operator decision required; provider/API authorization required before any implementation | MEDIUM RISK IF BROAD: a broad implementation gate would block all provider calls; must be a future bounded planning tranche only with narrow scope | HIGH: every Codex/Claude/future agent execution call routes through provider surfaces; a trace gate here gives CVF high co-work supervision coverage | REOPEN_AS_PLANNING_TRANCHE |
| C-03 | Sandbox Runtime: full physical isolation reopen | `Sandbox Runtime (full physical isolation)` DEFERRED: requires infrastructure authorization (FPC-T1 line 379); current adapter is stub-only (`platform ?? 'stub'`) | HIGH for long-term: physical isolation closes the largest CVF safety gap; Trust Sandbox package is coordination-only; `executeInSandbox` currently uses stub | MEDIUM: source surfaces exist (stub adapter verified) but physical implementation requires infrastructure/operator decision | NO: infrastructure authorization + GC-018 required; no physical implementation path exists today | HIGH LATENCY IF UNIVERSAL: physical sandbox on every agent execution would impose high latency; must be scoped to high-risk operations only; favor phase-placement | HIGH: physical isolation of agent-executed code is the strongest CVF co-work supervision mechanism; but implementation is not ready | REOPEN_AS_IMPLEMENTATION_CANDIDATE_LATER |
| C-04 | Co-work trace supervision hardening (AOT + expected-manifest breadth) | AOT-T2 closed; `check_agent_operation_trace.py` currently covers docs/work_orders and docs/reviews; template file exclusion and manifest-candidate preference fixed by FPC-T3-C04+C01 closure | HIGH for control plane integrity: widens the AOT enforcement surface to additional changed artifact classes; strengthens the manifest delta check as Codex/Claude interactions grow | HIGH: AOT checker is current, verified, and already wired into pre-commit and reviewer-fast | YES: FPC-T3 closed; AOT boundary fixes already committed; further scope expansion requires separate GC-018 | MEDIUM IF BROADLY GATED: adding AOT requirements to every small non-governed change would slow rapid governance patches; must remain scoped to trace artifacts | VERY HIGH: AOT is CVF's primary co-work supervision mechanism; breadth increase directly improves Codex/Claude interaction traceability | REOPEN_AS_PLANNING_TRANCHE |
| C-05 | LearningOrchestrator / TaskSchema source re-identification | BLOCKED_NO_SOURCE_FOUND (MLW0 source map); no current runtime path | LOW NOW: blocked until source is found; does not address a critical gap while blocked | BLOCKED: MLW0 source map found no current path | NO: requires source owner decision | LOW LATENCY IMPACT IF KEPT DEFERRED: no gate added | LOW: cannot supervise what has no source | KEEP_DEFERRED |
| C-06 | MLW6 high-risk escalation wiring | PARKED: proposal-only; no runtime wiring | MEDIUM: closes a learning-plane escalation gap | MEDIUM: proposal exists but no implementation source | NO: requires separate MLW6 work order | LOW LATENCY IF NARROW: wiring to a specific learning-plane signal only | MEDIUM: escalation wiring improves learning-loop supervision | KEEP_DEFERRED |
| C-07 | Live Redis connectivity | PARKED_PENDING_CREDENTIALS | LOW NOW: infrastructure credential gap blocks all progress | BLOCKED: credential path not available | NO: operator must provide UPSTASH credentials | N/A (blocked) | LOW UNTIL UNBLOCKED | KEEP_DEFERRED |
| C-08 | LPCI full runtime (vector embedding, live retrieval) | PARKED: operator decision + separate product roadmap | LOW NOW: downstream adapter, not CVF foundation | MEDIUM | NO | MEDIUM IF ADDED: embedding + retrieval on every query is expensive | LOW: product adapter, not control-plane supervision | KEEP_DEFERRED |

## Candidate Ranking

Ranked by combined foundation value, source confidence, dependency readiness,
anti-overconstraint/latency impact (lower = better), and co-work supervision
value:

| Rank | Candidate | Reopen Disposition | Rationale |
| --- | --- | --- | --- |
| 1 | C-02: Model Gateway EPF provider routing boundary planning | REOPEN_AS_PLANNING_TRANCHE | Large Execution Plane gap; source surfaces verified; high co-work supervision value; planning can define provider-routing boundaries without provider/API calls or implementation. This best matches the operator constraint to avoid use cases and narrow registry-only work. |
| 2 | C-04: Co-work trace supervision (AOT breadth) | REOPEN_AS_PLANNING_TRANCHE | Very high co-work supervision value; AOT is current and verified; further scope expansion is a natural continuation. Requires new GC-018 but no infrastructure, and must remain phase-placed to avoid latency. |
| 3 | C-03: Sandbox Runtime physical isolation boundary | REOPEN_AS_IMPLEMENTATION_CANDIDATE_LATER | Highest safety value long-term but infrastructure authorization is not available; stub-only adapter confirmed; next useful step is boundary/readiness planning, not implementation. |
| 4 | C-01: FPC-T2-C05 evidence-to-claim interlock registry entry | REOPEN_AS_PLANNING_TRANCHE | Valid and now unblocked, but it is a narrow registry follow-up. Keep ready as a later small governance tranche; do not make it the first FPC-T4 strategic reopen move. |
| 5 | C-06: MLW6 high-risk escalation wiring | KEEP_DEFERRED | Valuable but blocked on MLW6 work order; lower foundation value than C-01/C-02/C-04. |
| 6 | C-05: LearningOrchestrator / TaskSchema | KEEP_DEFERRED | Blocked: no source found. Cannot advance without source re-identification. |
| 7 | C-07: Live Redis | KEEP_DEFERRED | Infrastructure credential gap blocks all progress. |
| 8 | C-08: LPCI full runtime | KEEP_DEFERRED | Downstream product adapter; not a CVF foundation gap. |

## Dependency Map

| Candidate | Depends on | Blocking or non-blocking |
| --- | --- | --- |
| C-01: FPC-T2-C05 registry entry | FPC-T3-C04+C01 CLOSED (SATISFIED 2026-06-13) | Non-blocking: prerequisite now satisfied |
| C-02: Model Gateway planning tranche | Operator decision + fresh GC-018; no implementation until separate authorization | Blocking for implementation; planning tranche is unblocked |
| C-03: Sandbox Runtime implementation | Infrastructure authorization + GC-018; no physical path yet | Blocking: cannot implement until operator provides authorization |
| C-04: AOT breadth planning | Separate GC-018; FPC-T3 AOT boundary fixes already committed | Non-blocking: planning GC-018 is the only gate |
| C-05: LearningOrchestrator | Source re-identification decision | Blocking: no source found |
| C-06: MLW6 escalation | Separate MLW6 work order | Blocking |
| C-07: Live Redis | UPSTASH credentials from operator | Blocking |
| C-08: LPCI full runtime | Operator + product roadmap | Blocking |

## Anti-Overconstraint / Latency Impact

CVF governance should not impose broad high-latency blocking gates on ordinary
CVF development work. The analysis below applies the FPC roadmap principle that
deferred Execution Plane capabilities must not preempt foundation audit and that
controls must be phase-placed rather than universally blocking.

| Control need | Preferred CVF placement | Why not universal blocking |
| --- | --- | --- |
| Evidence-to-claim interlock (C-01) | System-loop interlock registry entry + existing epistemic packet gate | Registry entry is read-only governance data; gate already exists in reviewer-fast; no new blocking |
| Model Gateway provider routing (C-02) | Planning tranche first; implementation only after operator authorization + GC-018 | Universal provider-routing gate before implementation would block all provider tests; narrow scope required |
| Sandbox Runtime physical isolation (C-03) | Phase-placed to high-risk operations only when implemented | Universal sandbox on every execution would impose seconds of latency; must be opt-in per risk class |
| AOT breadth (C-04) | Extend TRACE_ARTIFACT_PREFIXES or eligibility rules incrementally; test gate after extension | Adding AOT to every small non-governed change would slow rapid governance patches |
| FPC-T2-C05 prerequisite already gated by checker | check_epistemic_process_packet.py runs in reviewer-fast; gating is already light (structure only) | Semantic truth checks would be high-latency and unverifiable; structural-only check is the right scope |

No candidate in this matrix recommends a universal blocking gate that would slow
ordinary CVF commits or governance patches. The recommended first tranche
(C-02) is planning-only and must not introduce provider calls, live proof, or a
universal blocking route gate.

## Co-Work Supervision Value

CVF supervises Codex/Claude/future agent work through repo-local traces,
expected manifests, source verification, execution attribution, and closure
evidence. CVF does not build cowork products, agent computer-control features,
endpoint telemetry, or provider-internal logs.

| Candidate | CVF supervision mechanism | Supervision value |
| --- | --- | --- |
| C-01 | Registry entry formally names the evidence-to-claim step as an interlock; existing checker gates structure | MEDIUM: adds discoverability and machine-registration to an already-guarded step |
| C-02 | Provider routing trace and method-gate enforcement; every agent/provider call can be traced | HIGH: all Codex/Claude provider interactions routed through a verifiable gate |
| C-03 | Physical code isolation; agent-executed code cannot escape sandbox limits | VERY HIGH (when implemented): strongest available co-work boundary |
| C-04 | AOT breadth forces every governed artifact change to carry a trace block and expected manifest | VERY HIGH: widening AOT coverage increases traceability across all agent-produced artifacts |
| C-05 | N/A (blocked) | N/A |
| C-06 | Learning-plane escalation wiring gives CVF visibility into high-risk agent learning decisions | MEDIUM |
| C-07 | N/A (blocked) | N/A |
| C-08 | N/A (product adapter, not control-plane) | LOW |

CVF does not authorize agent computer-control permission changes, OS-level
attribution, hidden telemetry, or provider-internal log inspection. Co-work
supervision is limited to what CVF can observe and enforce through repo-local
artifacts and registered interlocks.

## Recommended First Tranche

**Recommended: C-02 (Model Gateway EPF provider-routing boundary planning).**

Source basis:

- FPC-T1 marks `Model Gateway (EPF provider routing)` as formally deferred and
  requiring separate GC-018 plus operator decision.
- Current source surfaces exist and are verified:
  `PROVIDER_CAPABILITY_REGISTRY`, `ProviderRegistry`,
  `getProviderMethodContract`, `assertRegistryProviderMethodSupported`, and
  `listRegistrySupportedMethods`.
- A planning tranche can define route boundary, provider-method authority,
  trace requirements, and forbidden implementation claims without invoking any
  provider, changing runtime code, or asserting readiness.

This tranche has higher strategic foundation value than a narrow registry-only
follow-up because it decides how CVF controls provider-routing surfaces as
agent/provider cowork grows. It must remain planning-only: no provider/API
call, routing implementation, cost/quality claim, live proof, or public-sync.

**Candidate for second tranche: C-04 (AOT breadth planning for co-work supervision).**

A small planning GC-018 could scope which artifact prefixes should be added to
the AOT eligibility list and whether the manifest delta check should be extended
to cover additional completion review classes. This requires no infrastructure
and no provider authorization.

**Candidate for third tranche: C-03 (Sandbox Runtime physical-isolation boundary planning).**

A planning tranche would distinguish current stub/coordination surfaces from
future physical isolation requirements and identify the operator/infrastructure
decision needed before any implementation.

**Small follow-up, not first FPC-T4 tranche: C-01 (FPC-T2-C05 registry entry).**

FPC-T2-C05 is now unblocked and valid. It should be kept ready for a separate
small registry-edit GC-018 after the strategic FPC-T4 planning move, because
the operator explicitly excluded narrow-lane work as the next priority.

**C-03 (Sandbox Runtime physical isolation) is an implementation candidate for
later**: after infrastructure authorization is obtained and a separate operator
decision names the risk class and platform target.

## Rejected Or Kept-Deferred Candidates

| Candidate | Disposition | Reason |
| --- | --- | --- |
| C-05: LearningOrchestrator / TaskSchema | KEEP_DEFERRED | BLOCKED_NO_SOURCE_FOUND; cannot advance |
| C-06: MLW6 high-risk escalation wiring | KEEP_DEFERRED | Requires separate MLW6 work order; not a high-priority foundation gap now |
| C-07: Live Redis | KEEP_DEFERRED | Credential gap; unblock condition: operator provides UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN |
| C-08: LPCI full runtime | KEEP_DEFERRED | Downstream product adapter; not a CVF foundation capability |

## Negative Search And Collision Discipline

| Search query | Search roots | Result summary | Disposition |
| --- | --- | --- | --- |
| `rg -l "Model Gateway\|Sandbox Runtime\|trust-sandbox\|ProviderRegistry\|PROVIDER_CAPABILITY_REGISTRY\|executeInSandbox\|FPC-T4\|FPC-T2-C05"` docs EXTENSIONS | `docs`, `EXTENSIONS` | Collisions found in: roadmap, FPC reference plans, capability registry source, provider-registry source, sandbox adapter source, audit archives, and work orders | COLLISION_RECORDED_AS_SOURCE_INPUT: all collisions are source verification inputs or prior governance artifacts; no unauthorized new claim |
| `rg -l "Policy_Local\|Document Translator\|DT-CVF\|public-sync\|DASHSCOPE_API_KEY\|Sysmon\|T12\|rawMemoryReleased"` docs/reference docs/roadmaps | `docs/reference`, `docs/roadmaps` | Collisions found in: work-order template (mentions as forbidden scope), SOP, and roadmaps that reference these as forbidden boundaries | COLLISION_RECORDED_AS_FORBIDDEN_SCOPE_CONTEXT: collisions are governance documents that mention forbidden tokens to define exclusion; this matrix does not use any of these tokens as capability claims |
| `git status --short` | repo root | Clean worktree; two new files only (this matrix + worker return) after edits | MANIFEST_BOUNDARY_RECORDED |
| `git diff --name-status` | repo root | No tracked file mutations; two new untracked files | MANIFEST_BOUNDARY_CONFIRMED |

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| FPC-T3-C04+C01 closure satisfies the last FPC-T2-C05 prerequisite, but the operator excluded narrow-lane work as the next priority | ORCHESTRATOR_SCOPE_PRIORITY_GAP | GOVERNANCE_CONTROL_PLANE | RULE_EXISTS | Keep FPC-T2-C05 ready as a later small registry-edit GC-018; do not treat it as the first FPC-T4 strategic reopen tranche |
| Sandbox Runtime physical isolation has no current implementation path; stub adapter is confirmed | PHASE_GATE_PLACEMENT_GAP | GOVERNANCE_CONTROL_PLANE | DESIGN_REVIEW_REQUIRED | Operator decision required before any Sandbox Runtime implementation GC-018 |
| AOT breadth is a high-value co-work supervision improvement with low implementation risk | RULE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | Codex may authorize a planning-tranche GC-018 for AOT eligibility breadth after the Model Gateway boundary planning tranche |
| Runtime/provider/cost findings | N/A_WITH_REASON | RUNTIME_BEHAVIOR_LEARNING | N/A_WITH_REASON | No runtime, provider, cost, or quality behavior was changed by this planning matrix |

## Epistemic Process Block

Epistemic Process Applicability: HIGH_EVIDENCE

Expected Result / Prediction: The dispatch GC-018 and work order predicted that
Trust Sandbox / Sandbox Runtime boundary and Model Gateway capability registry
boundary would likely rank above the narrow FPC-T2-C05 registry-entry follow-up
because they decide larger CVF foundation surfaces.

Evidence Comparison: Source verification confirms that Model Gateway and
Sandbox Runtime remain the strategic deferred capability gaps, while FPC-T2-C05
is now unblocked as a smaller registry follow-up. The latest operator boundary
requires high CVF foundation value without use-case or narrow-lane drift.

Contradiction Or Gap Disposition: FPC-T2-C05 has the lowest barrier, but lowest
barrier is not the same as highest strategic FPC-T4 value. Ranking it first
would violate the operator's "no narrow niche" constraint. The ranking
principle is therefore: strategic foundation value first, then readiness and
latency as tie-breakers.

Claim Update: Prediction CONFIRMED after reviewer repair. Model Gateway
provider-routing boundary planning (C-02) ranks first; AOT/co-work trace
supervision breadth (C-04) ranks second; Sandbox Runtime boundary planning
(C-03) ranks third; FPC-T2-C05 (C-01) remains a valid later small registry
follow-up.

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Claude (worker) |
| Provider or surface | Claude Code CLI / VSCode extension |
| Session or invocation | dispatchBaseHead `7fd250ad`; executionBaseHead `2360fcf8` |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read (source files, required first reads); Bash (git rev-parse, git status, git diff, rg); Write (two new files) |
| Target paths | `docs/reference/CVF_FPC_T4_STRATEGIC_DEFERRED_CAPABILITY_REOPEN_DECISION_MATRIX_2026-06-13.md`; `docs/reviews/CVF_FPC_T4_STRATEGIC_DEFERRED_CAPABILITY_REOPEN_DECISION_WORKER_RETURN_2026-06-13.md` |
| Allowed scope source | GC-018 `docs/baselines/CVF_GC018_FPC_T4_STRATEGIC_DEFERRED_CAPABILITY_REOPEN_DECISION_2026-06-13.md`; operator authorization 2026-06-13; FPC roadmap FPC-T4 row |
| Before status evidence | `git status --short` clean before worker edits (executionBaseHead `2360fcf8`) |
| After status evidence | Two new untracked files only; no tracked file mutations |
| Diff evidence | `git diff --name-status` shows no tracked-file mutations; `git status --short` shows two `??` untracked files |
| Approval boundary | Operator authorized high-value CVF foundation continuation; FPC roadmap lines 276, 498-539; GC-018 baseline |
| Claim boundary | Decision planning and source-backed candidate ranking only. No implementation, Model Gateway routing, Sandbox Runtime isolation, provider/live proof, public-sync, registry mutation, OS/user attribution, endpoint telemetry, production readiness, or autonomous mutation claim. |
| Agent type | Claude |
| Invocation ID | executionBaseHead `2360fcf8` |
| Expected manifest | `docs/reference/CVF_FPC_T4_STRATEGIC_DEFERRED_CAPABILITY_REOPEN_DECISION_MATRIX_2026-06-13.md`; `docs/reviews/CVF_FPC_T4_STRATEGIC_DEFERRED_CAPABILITY_REOPEN_DECISION_WORKER_RETURN_2026-06-13.md` (GC-018 and work order committed by Codex at executionBaseHead 2360fcf8; not in current uncommitted changed set) |
| Actual changed set | `docs/reference/CVF_FPC_T4_STRATEGIC_DEFERRED_CAPABILITY_REOPEN_DECISION_MATRIX_2026-06-13.md`; `docs/reviews/CVF_FPC_T4_STRATEGIC_DEFERRED_CAPABILITY_REOPEN_DECISION_WORKER_RETURN_2026-06-13.md` (worker return is self-excluded from delta comparison as the manifest candidate per AOT checker rules) |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no protected path deleted or renamed; two new files created |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance foundation planning. Public-sync is not authorized.

## Claim Boundary

This decision matrix ranks deferred CVF foundation capabilities and recommends
the smallest safe first tranche. It does not authorize, claim, or prove:
implementation of any capability; provider/live readiness; completed Model
Gateway; completed Sandbox Runtime; physical execution isolation; OS/user
attribution; endpoint telemetry; production readiness; public readiness; cost
optimization; output quality; raw memory release; autonomous mutation; registry
mutation; or any change beyond this matrix and its paired worker-return packet.

rawMemoryReleased=false
