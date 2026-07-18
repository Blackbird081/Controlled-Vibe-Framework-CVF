# CVF Operational Reference Index

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-05-23

rawMemoryReleased=false

## Purpose

Provide the front-door pointer table that future CVF agents must consult when
scoping memory, graph, provider, public-sync, pain-point, or legacy-adjacent
work. This closes the operational lookup gap that allowed legacy knowledge to
exist in the repository without being pulled into implementation scope.

## Owner / Source

Owner: CVF operator and active implementation agent.

Source lineage:

- `docs/audits/archive/CVF_LEGACY_SPEC_ABSORPTION_BLINDSPOT_AUDIT_2026-05-23.md`
- `docs/reviews/archive/CVF_LEGACY_SPEC_ABSORPTION_BLINDSPOT_CODEX_REVIEW_2026-05-23.md`
- `docs/reference/archive/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md`
- `docs/roadmaps/archive/CVF_AGENT_INTELLIGENCE_FOUNDATIONS_ROADMAP_2026-05-23.md`

## Scope / Target / Owner Boundary

This index is a routing reference only. It does not authorize code changes,
provider calls, public-sync pushes, persistence, release claims, or governance
semantic changes. When a row points to demand-gated work, the referenced work
order and GC-018 packet still control authorization.

## Lookup Table

| Trigger / question | Required first reads | Current owner surface | Boundary |
| --- | --- | --- | --- |
| Scoping any memory or hierarchy tranche | `.private_reference/legacy/CVF 16.5/agentmemory/`; `docs/reference/archive/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md`; `docs/audits/archive/CVF_LEGACY_SPEC_ABSORPTION_BLINDSPOT_AUDIT_2026-05-23.md` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-lifecycle-policy.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts` | AIF-C Phase 2a is local and in-memory; durable persistence and live prompt reinjection remain out of scope. |
| Scoping graph or context-builder work | `.private_reference/legacy/CVF ADD/code-review-graph/`; registry graph row; AIF-B GC-018 | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/context_builder/graph/` | Graph output is advisory evidence, not approval authority. Durable graph storage is deferred. |
| Checking Post-AIF operational readiness | `docs/roadmaps/archive/CVF_POST_AIF_OPERATIONALIZATION_ROADMAP_2026-05-24.md`; `docs/reference/archive/CVF_POST_AIF_OPERATIONAL_READINESS_MATRIX_2026-05-24.md`; `docs/reviews/archive/CVF_POST_AIF_CLAIM_BOUNDARY_PACKET_2026-05-24.md` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/aif-operational-context-preview.ts`; active session state | O1 preview is local summary-only; live reinjection, provider repeatability, public-sync, hosted readiness, production readiness, and freeze release require fresh GC-018/work order. |
| Checking Qwen3 / Alibaba hosted proof status | `docs/reference/archive/CVF_QWEN3_HOSTED_PROOF_PREREQUISITES_2026-05-23.md`; `docs/reviews/archive/CVF_D10_QWEN3_R1_COMPATIBLE_HOSTED_PROOF_COMPLETION_2026-05-23.md`; active state registry | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/providers.ts`; `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/provider-router-adapter.ts` | D10 proves one R1-compatible hosted call only; no broad Qwen3 stability or hosted readiness. |
| Adding a provider or model | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts`; `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/providers.ts`; provider capability tests | Model Gateway and web provider router | Do not change route/provider semantics or risk ceilings without fresh GC-018. |
| Reviewing pain-point closure / delivery gaps | `docs/reviews/archive/CVF_REVIEW_CVF_POST_BC_REMAINING_PAIN_POINTS_ASSESSMENT_2026-05-22.md`; `docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_DELIVERY_GAP_ROADMAP_CODEX_REVIEW_2026-05-22.md`; registry | Docs/reviews and active roadmap queue | Do not convert a review finding into implementation scope without work order and evidence packet. |
| Filing new GC-018 touching legacy-adjacent scope | GC-018 template; registry; this index; relevant `.private_reference/legacy/` folder | `docs/baselines/` | Must include Legacy Spec Scan Block with file-by-file absorb/defer table. |
| Public-facing README, contributor, setup, governance, provider, cost, or evidence-summary work | `AGENTS.md` critical repository boundary; public-sync clone rules | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF-public-sync` | Never push provenance tree to public repo; run `git remote -v` in public-sync before public push. |
| Scoping T-H2 / AIF-C memory gateway phase 2 | `docs/work_orders/archive/CVF_WO_AIF_C_MEMORY_GATEWAY_PHASE2_2026-05-23.md`; AIF-C GC-018; all agentmemory implementation specs | Learning Plane AIF-C modules and tests | Operator override is required for new memory tiers beyond Lane H; Phase 2a remains in-memory. |
| Scoping T-GRAPH / AIF-B graph knowledge phase 1 | `docs/work_orders/archive/CVF_WO_AIF_B_GRAPH_KNOWLEDGE_PHASE1_2026-05-23.md`; AIF-B GC-018; actual code-review-graph file list | Learning Plane graph modules and tests | Work order scoring-spec reference was corrected: no `CVF_GRAPH_SCORING_SPEC.md` exists in the source bundle. |
| Starting or resuming a session | `CVF_SESSION_MEMORY.md`; `CVF_SESSION/ACTIVE_SESSION_STATE.json`; active handoff named by the registry | Active session registry and root active handoff | Do not append status to archived handoffs. |
| Checking GC-023 file-size posture | `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`; local hook chain | Governance compatibility scripts | File-size guard is advisory unless the hook reports blocking status. |
| Authoring or dispatching a work order | `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`; `docs/reference/CVF_TRANCHE_COMMIT_CHOREOGRAPHY_STANDARD_2026-06-03.md`; `AGENTS.md` Mandatory Work Order Source Verification section; any canonical source contract named by the work order | `docs/work_orders/` and current source/canonical contracts | Source facts require source file plus line/section before dispatch. Runtime/source vocabulary cannot be verified from memory alone. New doc-only connector fields must be separated from source facts. MA1 section references must match the canonical MA1 standard exactly. Commit choreography must separate archive hygiene, artifact, closure, session sync, and handoff sync. |
| Creating, splitting, relocating, or refactoring durable governance foundation files | `docs/reference/foundation_storage/README.md`; `docs/reference/foundation_storage/CVF_FOUNDATION_FILE_STORAGE_AND_INDEX_STANDARD.md`; affected family README or reference index | `docs/reference/` foundation folders and operational indexes | Foundation files need stable indexed paths. Execution/evidence files stay dated and archive-bound. Storage layout is part of the refactor, not optional cleanup. |
| Authoring or reviewing agent handoff boundaries | `docs/reference/agent_handoff/README.md`; `docs/reference/agent_handoff/CVF_AGENT_HANDOFF_BOUNDARY_MACHINE_CHECK_STANDARD.md`; `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md` | Work orders, dispatch envelopes, commit steward records, AOT trace blocks, session-sync surfaces | Agent Handoff Contract is the Central Core. Per-batch handoff evidence is the Local View and must include route, role pattern, phase, base-head, changed-set, trace, commit-owner, isolation, and next-move dispositions. |
| Proposing, designing, or building an agent-interaction workspace | `docs/reference/agent_workspace/README.md`; `docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md`; `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md`; `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md`; `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_ITEM_TEMPLATE.json`; `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPTION_READINESS_MATRIX.md`; `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md`; `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md`; `CVF_SESSION/agent_workspace/workspace/README.md`; `CVF_SESSION/agent_workspace/workspace/lanes/README.md`; `CVF_SESSION/agent_workspace/runtime_queue/README.md`; `CVF_SESSION/agent_workspace/runtime_queue/queues/README.md`; `CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json`; `governance/compat/check_agent_workspace_design.py`; `governance/compat/check_agent_workspace_state.py`; `governance/compat/check_agent_workspace_skeleton.py`; `governance/compat/check_agent_workspace_runtime_boundary.py`; `docs/reference/agent_handoff/README.md`; `docs/reference/foundation_storage/README.md` | Future Claude/Codex/other-agent coordination workspace surfaces | AHB-Tn.1 authorizes design foundation only. AHB-Tn.2 machine-enforces the design control block. AHB-Tn.3 defines state topology. AHB-Tn.4 adds generated workspace state source/checker foundation. AHB-Tn.5 makes the future options explicit and parked. AHB-Tn.6 closes richer lanes and foundation hardening into stable taxonomy/template/checker controls. AHB-Tn.7 closes the bounded workspace build option at skeleton level only. AHB-Tn.8 closes the runtime expansion readiness contract. AHB-Tn.9 closes a queue skeleton only. AHB-Tn.10 closes the operator read-model plan only. Any executable runtime state, provider proof, public-sync, registry edit, UI implementation, production readiness, or public readiness needs fresh GC-018 and a separate work order. |
| Reading guard orientation or identifying required guards before governed work | `docs/reference/guard_orientation/README.md` | `docs/reference/guard_orientation/README.md` | Orientation layer only; canonical standards, work orders, and machine checkers still control. |
| Setting up project role assignment, delegation scope, or provider-lane selection before agents start | `docs/reference/project_role_provider_delegation/README.md`; `docs/reference/CVF_AGENT_ROLE_ASSIGNMENT_MATRIX_2026-05-19.md`; `docs/reference/CVF_AGENT_DELEGATION_AND_SUBAGENT_BOUNDARY_STANDARD_2026-05-19.md` | `docs/reference/project_role_provider_delegation/README.md` | Documentation/reference envelope only; operator approves role/provider lanes and cost/quota ceiling. Not an automated provider selector or runtime router; automated provider selection, runtime routing, provider/live proof, and public-sync need fresh GC-018. |
| Recording worker execution friction in a worker-return packet | `docs/reference/worker_experience_retrospective/README.md`; `governance/compat/check_worker_experience_retrospective.py` | `docs/reference/worker_experience_retrospective/README.md` | Self-declared worker-return artifacts must carry a `WORKER_EXPERIENCE_RETRO:` block or the exact `WORKER_EXPERIENCE_RETRO_NA_WITH_REASON:` assertion. Artifact-level capture only; proves a declared claim, not comprehension. Advisory/classification packets are exempt. |
| Preparing external-agent review context or absorbing external MCP/workspace ideas | `docs/reference/external_agent_review/README.md`; `docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_REVIEW_CONTEXT_STANDARD.md`; `docs/reference/external_agent_review/CVF_WORKFLOW_CHAIN_PUBLIC_REVIEW_CONTEXT.md`; `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_EXTERNAL_PACKAGE_ABSORPTION_MAP.md`; `docs/reference/mcp_gateway/README.md`; `docs/reference/agent_workspace/README.md` | External-agent review context and non-canonical package absorption | CVF remains the source of truth. Public/simple lifecycle labels are display vocabulary unless mapped to current governed workflow-chain surfaces. External packages and repositories are reference inputs only; useful material must be classified as absorb/adapt/defer/reject before entering CVF-owned reference surfaces. |
| Checking Pain H memory status | H2 working-memory runtime-proof completion citation confirmed missing repository-wide by MSEA-R90 Audit A (basename search, no active or archived copy found; not replaced by an unproven equivalent); `docs/reviews/archive/CVF_T5_RUNTIME_MEMORY_WIRING_COMPLETION_2026-05-22.md` is a distinct sibling artifact, not a renamed H2 file; registry agentmemory row; AIF-C completion | Learning Plane runtime-memory and AIF-C modules | H2 citation is confirmed missing, not equivalent to T5. H/AIF-C prove bounded memory surfaces, not durable or live provider memory. |
| Checking graph knowledge status | Registry code-review-graph row; `docs/reference/CVF_SCOPED_KNOWLEDGE_PROVIDER_BOUNDARY_DOCTRINE_2026-05-07.md`; AIF-B completion | Learning Plane graph schema/parser/index/task-query modules | Phase 1 is in-memory AST/index/blast-radius foundation only. |
| Checking the whole-picture doctrine-to-operator system-chain map or its freshness state | `docs/reference/system_chain/README.md`; `docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json`; `docs/reference/system_chain/CVF_SYSTEM_CHAIN_FRESHNESS_STANDARD.md` | `docs/reference/system_chain/` reference family and `governance/compat/check_system_chain_map_freshness.py` | Map reflects only reviewer-accepted MSEA-R90 Audit A findings; source-hash drift and review age are machine-detected, but semantic verdict changes require a governed review, never an automatic rewrite. |
| Scoping SOT3, governed knowledge authority, controlled quotation, or related source-to-recall work | `docs/reference/sot_three_layer/README.md`; `ARCHITECTURE.md` SOT3 Knowledge Authority Path section; `docs/reference/CVF_ARCHITECTURE_MAP.md` SOT3 Bounded Cross-Plane Overlay section; `docs/reference/sot_three_layer/CVF_SOT3_ACTIVATION_ARCHITECTURE_DECISION.md`; `docs/reviews/CVF_SOT3_APP_T5_COMPLETION_REVIEW_2026-07-18.md` | `docs/reference/sot_three_layer/` contract family; `EXTENSIONS/CVF_REFINERY/`; `EXTENSIONS/CVF_TRUTH_KERNEL/`; `EXTENSIONS/CVF_TRUTH_FLOW/`; `EXTENSIONS/CVF_SOT_THREE_LAYER_SLICE/` (bounded, `LOCAL_READY` owner surfaces; no universal activation implied) | Flow is source intake -> Refinery -> Truth Kernel -> Truth Flow -> governed context/execution -> review/freeze -> impact/recall. Refinery holds no truth authority; Kernel alone owns decision/receipt/reference authority; Flow is strictly post-Kernel. Bounded to one ratified activation seam and one accepted downstream application proof; no provider/live, public, or production-availability claim beyond that bounded seam. |

## Maintenance Rule

Update this index in the same commit whenever a tranche adds or closes a new
operational front-door path. If a referenced source folder contains a missing
or renamed spec, record the actual file list and the corrected boundary instead
of preserving a stale work-order assumption.

## Claim Boundary

This index improves agent scoping and reference discovery. It does not prove
runtime governance behavior, live provider behavior, public readiness, release
readiness, or automatic legacy absorption.

## Epistemic Process Block

### Expected Result / Prediction

Adding the external-agent review row was expected to improve lookup routing
without changing runtime behavior.

### Evidence Comparison

The row points to stable reference front doors and does not claim runtime,
provider, public-sync, or readiness evidence.

### Contradiction Or Gap Disposition

No contradiction is introduced. The update closes a retrieval gap for external
review context.

### Claim Update

This index now routes external-agent review and external package absorption to
CVF-owned context surfaces.
