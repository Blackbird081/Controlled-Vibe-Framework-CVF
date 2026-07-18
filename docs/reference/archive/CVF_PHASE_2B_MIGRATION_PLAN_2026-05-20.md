# CVF Phase 2.B Migration Plan

Memory class: FULL_RECORD

Status: MIGRATION_PLAN_AUTHORITATIVE

docType: reference

Date: 2026-05-20

---

## Purpose

This artifact locks the remaining Phase 2.B migration plan: migration order,
owner assignment, done criterion, and dependency graph for 46 primary targets.

It is a static dispatch plan. It does not implement adapters, edit runtime
code, lift the governance-kernel freeze, or prove broad CVF runtime coherence.

---

## Authority Chain

- Doctrine: `ECOSYSTEM/doctrine/CVF_DOCTRINE_RULES.md`
- HN2.a inventory:
  `docs/reviews/CVF_HN2A_GOVERNANCE_KERNEL_OWNER_INVENTORY_2026-05-20.md`
- HN2.b owner map:
  `docs/reference/CVF_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-20.md`
- HN2.c freeze-release rule:
  `governance/toolkit/05_OPERATION/CVF_GOVERNANCE_KERNEL_FREEZE_RELEASE_RULE.md`
- Phase 2.B GC-018:
  `docs/baselines/CVF_GC018_PHASE_2B_MIGRATION_PLAN_2026-05-20.md`
- Phase 2.B work order:
  `docs/work_orders/CVF_WO_PHASE_2B_MIGRATION_PLAN_IMPLEMENTATION_2026-05-20.md`

---

## Owner Surface / Source Lineage

Owner surface: static dispatch planning for remaining Phase 2.B adapter
migration targets.

Source lineage:

1. Phase 1 adapter maps identified candidate surfaces.
2. Phase 2.A left `availableFrom: 'Phase-2B'` as a placeholder, not execution.
3. The bounded fixture-driven Phase 2.B slice closed separately on
   2026-05-18.
4. This plan closes only the broader order/owner/done/dependency gap.

---

## Protocol / Contract / Requirements

Future per-surface work must:

- cite this plan and the row id;
- keep implementation scoped to one row unless a new GC-018 explicitly
  authorizes a grouped slice;
- satisfy the row's done criterion tier;
- respect dependency edges and stage gates;
- cite HN2.c release evidence before any frozen owner change.

---

## Target Set

The plan contains exactly 46 primary migration targets:

- Policy targets: 8
- Risk targets: 16
- Role targets: 7
- Receipt targets: 7
- Memory targets: 8

Selection excludes test-only fixtures, generated `node_modules` copies, and
false-positive references unless a row explicitly uses a source as a migration
anchor. Excluded references remain useful evidence, but they are not primary
Phase 2.B dispatch rows.

---

## Stage Table

| Stage | Meaning | Gate to enter | Gate to exit |
| --- | --- | --- | --- |
| Stage A | Contract-only/data adapter alignment with no runtime side effect and no kernel owner replacement | Plan row exists and owner/reviewer assigned | Test + type + closure review cited in later per-surface work order |
| Stage B | Runtime-lane or pack-local adapter alignment with no kernel owner replacement | All listed dependencies closed; Stage A anchors for the row closed | Test + type + governance receipt when runtime path is used + closure review |
| Stage C | Kernel-touching adapter or canonical owner replacement | HN2.c release packet approved before work starts | Test + type + governance receipt + freeze-release citation + closure review |

No row in this plan is pre-approved for Stage C. A later per-surface GC-018 may
move a row to Stage C only through the HN2.c freeze-release process.

---

## Done Criterion Tiers

| Tier | Required evidence |
| --- | --- |
| `contract_only_adapter` | Test evidence, type evidence, and completion review. No live runtime claim. |
| `pack_local_data_adapter` | Test evidence, type evidence, and completion review. Claim is limited to the pack or lane. |
| `runtime_adapter_no_kernel_touch` | Test evidence, type evidence, governance receipt/audit evidence if a runtime path is exercised, and completion review. |
| `kernel_touching_adapter` | Test evidence, type evidence, governance receipt/audit evidence, HN2.c-compliant freeze-release citation, and completion review. |

---

## Per-Target Migration Table

Sort key: topological order by dependency group, then surface family order
`Policy -> Risk -> Role -> Receipt -> Memory`, then stable row id.

| id | surfaceName | stage | ownerRole | reviewerRole | doneCriterionTier | dependsOn | freezeReleaseRequired | adapterTargetPath |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P-01 | governance-engine-policy-engine-py | Stage A | Builder | Reviewer | contract_only_adapter | none | false | `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/core/policy_engine.py` |
| P-02 | governance-engine-server-py | Stage A | Builder | Reviewer | contract_only_adapter | P-01 | false | `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/api/server.py` |
| P-03 | governance-engine-orchestrator-py | Stage A | Builder | Reviewer | contract_only_adapter | P-01 | false | `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/core_orchestrator.py` |
| P-04 | governance-engine-main-py | Stage A | Builder | Reviewer | contract_only_adapter | P-02, P-03 | false | `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/main.py` |
| P-05 | model-gateway-index | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | P-06 | false | `EXTENSIONS/CVF_MODEL_GATEWAY/src/index.ts` |
| P-06 | model-gateway-routing-policy | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | P-01 | false | `EXTENSIONS/CVF_MODEL_GATEWAY/src/routing-policy.ts` |
| P-07 | external-integration-certification-state-machine | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | P-01 | false | `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/certification/certification.state.machine.ts` |
| P-08 | external-integration-policy-decision-engine | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | P-01 | false | `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/policies/policy.decision.engine.ts` |
| R-01 | eco-llm-risk-engine-scorer | Stage A | Builder | Reviewer | contract_only_adapter | none | false | `EXTENSIONS/CVF_ECO_v1.2_LLM_RISK_ENGINE/src/risk.scorer.ts` |
| R-02 | safety-runtime-risk-engine | Stage A | Builder | Reviewer | contract_only_adapter | none | false | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/policy/risk.engine.ts` |
| R-03 | safety-runtime-risk-detector | Stage A | Builder | Reviewer | contract_only_adapter | R-02 | false | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/kernel/03_contamination_guard/risk_detector.ts` |
| R-04 | safety-runtime-risk-evolution | Stage A | Builder | Reviewer | contract_only_adapter | R-02 | false | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/internal_ledger/risk_evolution.ts` |
| R-05 | safety-runtime-refusal-risk | Stage A | Builder | Reviewer | contract_only_adapter | R-02 | false | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/kernel/04_refusal_router/refusal.risk.ts` |
| R-06 | eco-llm-risk-aggregator | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | R-01 | false | `EXTENSIONS/CVF_ECO_v1.2_LLM_RISK_ENGINE/src/risk.aggregator.ts` |
| R-07 | eco-agent-guard-sdk-risk-module | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | R-01 | false | `EXTENSIONS/CVF_ECO_v2.0_AGENT_GUARD_SDK/src/risk.module.ts` |
| R-08 | mcp-server-risk-gate-guard | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | R-01 | false | `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/guards/risk-gate.guard.ts` |
| R-09 | guard-contract-risk-gate-guard | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | R-01 | false | `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/risk-gate.guard.ts` |
| R-10 | phase-governance-risk-gate-guard | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | R-01 | false | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guards/risk.gate.guard.ts` |
| R-11 | external-integration-risk-scoring-hook | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | R-01 | false | `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/governance_hooks/risk.scoring.hook.ts` |
| R-12 | skill-governance-risk-scorer | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | R-01 | false | `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/skill_system/governance/risk.scorer.ts` |
| R-13 | safety-runtime-risk-propagation-engine | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | R-02, R-03 | false | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/kernel/03_contamination_guard/risk_propagation_engine.ts` |
| R-14 | safety-runtime-contamination-risk-scorer | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | R-02, R-03 | false | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/kernel/03_contamination_guard/risk_scorer.ts` |
| R-15 | safety-hardening-risk-lock | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | R-02 | false | `EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/core/risk/risk.lock.ts` |
| R-16 | safety-hardening-risk-scorer | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | R-02 | false | `EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/core/risk/risk.scorer.ts` |
| I-01 | cpf-agent-definition-boundary-contract | Stage A | Builder | Reviewer | contract_only_adapter | none | false | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts` |
| I-02 | cpf-design-contract | Stage A | Builder | Reviewer | contract_only_adapter | I-01 | false | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.contract.ts` |
| I-03 | cpf-orchestration-contract | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | I-02 | false | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.contract.ts` |
| I-04 | cpf-continuity-checkpoint-contract | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | I-01 | false | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/continuity.checkpoint.contract.ts` |
| I-05 | cpf-continuation-barrel | Stage A | Builder | Reviewer | contract_only_adapter | I-04 | false | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.continuation.barrel.ts` |
| I-06 | cpf-coordination-barrel | Stage A | Builder | Reviewer | contract_only_adapter | I-03 | false | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.coordination.barrel.ts` |
| I-07 | cpf-boardroom-barrel | Stage A | Builder | Reviewer | contract_only_adapter | I-02 | false | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.design.boardroom.barrel.ts` |
| E-01 | cpf-agent-governed-session-contract | Stage A | Builder | Reviewer | contract_only_adapter | none | false | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.governed.session.contract.ts` |
| E-02 | cpf-gateway-consumer-contract | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | E-01 | false | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.consumer.contract.ts` |
| E-03 | epf-execution-bridge-consumer-contract | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | E-01 | false | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.bridge.consumer.contract.ts` |
| E-04 | model-gateway-gateway-receipt | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | E-02 | false | `EXTENSIONS/CVF_MODEL_GATEWAY/src/gateway-receipt.ts` |
| E-05 | model-gateway-index-receipt | Stage A | Builder | Reviewer | contract_only_adapter | E-04 | false | `EXTENSIONS/CVF_MODEL_GATEWAY/src/index.ts` |
| E-06 | guard-contract-types | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | E-01 | false | `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts` |
| E-07 | phase-governance-extension-bridge | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | E-01, E-03 | false | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/wiring/extension.bridge.ts` |
| M-01 | cpf-agent-governed-session-contract-working | Stage A | Builder | Reviewer | contract_only_adapter | E-01 | false | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.governed.session.contract.ts` |
| M-02 | epf-execution-pipeline-contract-task | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | E-03 | false | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.pipeline.contract.ts` |
| M-03 | epf-execution-bridge-consumer-contract-task | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | E-03 | false | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.bridge.consumer.contract.ts` |
| M-04 | lpf-controlled-memory-gateway-contract-skill | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | none | false | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts` |
| M-05 | guard-contract-trace-emitter-audit | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | E-06 | false | `EXTENSIONS/CVF_GUARD_CONTRACT/src/audit/trace-emitter.ts` |
| M-06 | guard-contract-sqlite-db-audit | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | M-05 | false | `EXTENSIONS/CVF_GUARD_CONTRACT/src/audit/sqlite-db.ts` |
| M-07 | guard-contract-receipt-envelope-receipt | Stage A | Builder | Reviewer | contract_only_adapter | E-01 | false | `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/receipt-envelope.contract.ts` |
| M-08 | model-gateway-gateway-receipt-receipt | Stage B | Worker | Reviewer | runtime_adapter_no_kernel_touch | E-04, M-07 | false | `EXTENSIONS/CVF_MODEL_GATEWAY/src/gateway-receipt.ts` |

Coverage assertion: 46 rows are listed. No row assigns owner and reviewer to
the same role. No row requires freeze release at plan-lock time.

---

## Dependency Graph

Textual DAG edges:

```text
P-01 -> P-02
P-01 -> P-03
P-02 -> P-04
P-03 -> P-04
P-01 -> P-06
P-06 -> P-05
P-01 -> P-07
P-01 -> P-08

R-02 -> R-03
R-02 -> R-04
R-02 -> R-05
R-01 -> R-06
R-01 -> R-07
R-01 -> R-08
R-01 -> R-09
R-01 -> R-10
R-01 -> R-11
R-01 -> R-12
R-02 -> R-13
R-03 -> R-13
R-02 -> R-14
R-03 -> R-14
R-02 -> R-15
R-02 -> R-16

I-01 -> I-02
I-02 -> I-03
I-01 -> I-04
I-04 -> I-05
I-03 -> I-06
I-02 -> I-07

E-01 -> E-02
E-01 -> E-03
E-02 -> E-04
E-04 -> E-05
E-01 -> E-06
E-01 -> E-07
E-03 -> E-07

E-01 -> M-01
E-03 -> M-02
E-03 -> M-03
E-06 -> M-05
M-05 -> M-06
E-01 -> M-07
E-04 -> M-08
M-07 -> M-08
```

DAG verification: all edges point from an earlier prerequisite row to a later
or same-family dependent row. No dependency points from Stage A to Stage C, and
no Stage C row exists.

Critical path:

`E-01 -> E-02 -> E-04 -> M-08`

Equivalent three-edge paths also exist in Policy, Risk, Role, and Receipt
families. The named path is operationally critical because it links receipt
envelope anchoring to memory-tier receipt alignment.

---

## Freeze-Release Callouts

All rows currently have `freezeReleaseRequired=false` because this plan only
authorizes adapter planning that preserves existing canonical owners.

If a future per-surface GC-018 needs to replace a canonical owner, add a new
kernel surface, strengthen an alias class, introduce a new engine, introduce a
new receipt envelope, introduce a new memory tier, or change provider execution
semantics, that work must first cite an HN2.c-compliant release packet.

---

## Forbidden Expansion Register

This plan forbids:

- bulk migration;
- new role taxonomy;
- new policy, risk, or guard engine;
- new receipt envelope;
- new memory tier;
- new provider method or provider runtime behavior;
- new execution phase;
- new kernel surface beyond the HN2.a inventory;
- public runtime coherence claim;
- using a legacy fixture or generated dependency copy as a production owner.

---

## Citation Rule

Every future Phase 2.B per-surface GC-018 and work order must cite:

1. this migration plan;
2. its row id;
3. the HN2.b owner-map classification for the touched surface;
4. the HN2.c release packet if `freezeReleaseRequired=true` or if the proposed
   implementation changes a frozen kernel owner.

If a future work order cannot identify a row id, it is not Phase 2.B work and
must file a new roadmap or a new GC-018.

---

## Change Protocol

Changing this plan requires a new Phase 2.B GC-018 and rebuttal when the change
does any of the following:

- adds, removes, or reorders a primary migration target;
- changes owner or reviewer role;
- changes done criterion tier;
- changes dependency edges;
- changes freeze-release posture;
- converts a planning row into an implementation authorization.

Typographical fixes that do not alter the table semantics may proceed through
the documentation maintenance path.

---

## Enforcement / Verification

Enforcement is through reviewer intake, GC-018 baselines, work-order review,
and completion review citation checks.

Verification for this version:

- exactly 46 target rows;
- no owner/reviewer self-review rows;
- no Stage C row pre-approved;
- dependency graph contains no cycles by inspection;
- every future implementation must cite a row id.

---

## Boundaries / Non-Goals

Non-goals:

- implement adapters;
- edit runtime source;
- change provider behavior;
- change memory behavior;
- change Maika behavior;
- update public-sync;
- prove runtime coherence;
- lift governance-kernel freeze globally.

---

## Related Artifacts

- `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/policy-engine-adapter-map.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/risk-engine-adapter-map.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/role-axis-adapter-map.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/receipt-envelope-adapter-map.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/memory-tier-adapter-map.ts`
- `docs/reviews/CVF_PHASE_2B_MIGRATION_PLAN_COMPLETION_2026-05-20.md`

---

## Claim Boundary

This artifact may be cited as evidence that Phase 2.B now has a locked
migration order, owner map, done criterion tiering, and dependency graph for 46
primary targets.

It must not be cited as evidence that any adapter has been implemented, any
runtime path has been proven, any provider behavior has changed, or any
governance-kernel freeze has been lifted.
