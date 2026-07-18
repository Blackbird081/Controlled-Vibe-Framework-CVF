# CVF Operational Reference Index

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-05-23

## Purpose

Provide the front-door pointer table that future CVF agents must consult when
scoping memory, graph, provider, public-sync, pain-point, or legacy-adjacent
work. This closes the operational lookup gap that allowed legacy knowledge to
exist in the repository without being pulled into implementation scope.

## Owner / Source

Owner: CVF operator and active implementation agent.

Source lineage:

- `docs/audits/CVF_LEGACY_SPEC_ABSORPTION_BLINDSPOT_AUDIT_2026-05-23.md`
- `docs/reviews/CVF_LEGACY_SPEC_ABSORPTION_BLINDSPOT_CODEX_REVIEW_2026-05-23.md`
- `docs/reference/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md`
- `docs/roadmaps/CVF_AGENT_INTELLIGENCE_FOUNDATIONS_ROADMAP_2026-05-23.md`

## Scope / Target / Owner Boundary

This index is a routing reference only. It does not authorize code changes,
provider calls, public-sync pushes, persistence, release claims, or governance
semantic changes. When a row points to demand-gated work, the referenced work
order and GC-018 packet still control authorization.

## Lookup Table

| Trigger / question | Required first reads | Current owner surface | Boundary |
| --- | --- | --- | --- |
| Scoping any memory or hierarchy tranche | `.private_reference/legacy/CVF 16.5/agentmemory/`; `docs/reference/CVF_LEGACY_SPEC_ABSORPTION_REGISTRY_2026-05-23.md`; `docs/audits/CVF_LEGACY_SPEC_ABSORPTION_BLINDSPOT_AUDIT_2026-05-23.md` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-lifecycle-policy.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts` | AIF-C Phase 2a is local and in-memory; durable persistence and live prompt reinjection remain out of scope. |
| Scoping graph or context-builder work | `.private_reference/legacy/CVF ADD/code-review-graph/`; registry graph row; AIF-B GC-018 | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/context_builder/graph/` | Graph output is advisory evidence, not approval authority. Durable graph storage is deferred. |
| Checking Post-AIF operational readiness | `docs/roadmaps/CVF_POST_AIF_OPERATIONALIZATION_ROADMAP_2026-05-24.md`; `docs/reference/CVF_POST_AIF_OPERATIONAL_READINESS_MATRIX_2026-05-24.md`; `docs/reviews/CVF_POST_AIF_CLAIM_BOUNDARY_PACKET_2026-05-24.md` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/aif-operational-context-preview.ts`; active session state | O1 preview is local summary-only; live reinjection, provider repeatability, public-sync, hosted readiness, production readiness, and freeze release require fresh GC-018/work order. |
| Checking Qwen3 / Alibaba hosted proof status | `docs/reference/CVF_QWEN3_HOSTED_PROOF_PREREQUISITES_2026-05-23.md`; `docs/reviews/CVF_D10_QWEN3_R1_COMPATIBLE_HOSTED_PROOF_COMPLETION_2026-05-23.md`; active state registry | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/providers.ts`; `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/provider-router-adapter.ts` | D10 proves one R1-compatible hosted call only; no broad Qwen3 stability or hosted readiness. |
| Adding a provider or model | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts`; `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/providers.ts`; provider capability tests | Model Gateway and web provider router | Do not change route/provider semantics or risk ceilings without fresh GC-018. |
| Reviewing pain-point closure / delivery gaps | `docs/reviews/archive/CVF_REVIEW_CVF_POST_BC_REMAINING_PAIN_POINTS_ASSESSMENT_2026-05-22.md`; `docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_DELIVERY_GAP_ROADMAP_CODEX_REVIEW_2026-05-22.md`; registry | Docs/reviews and active roadmap queue | Do not convert a review finding into implementation scope without work order and evidence packet. |
| Filing new GC-018 touching legacy-adjacent scope | GC-018 template; registry; this index; relevant `.private_reference/legacy/` folder | `docs/baselines/` | Must include Legacy Spec Scan Block with file-by-file absorb/defer table. |
| Public-facing README, contributor, setup, governance, provider, cost, or evidence-summary work | `AGENTS.md` critical repository boundary; `CLAUDE.md`; public-sync clone rules | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF-public-sync` | Never push provenance tree to public repo; run `git remote -v` in public-sync before public push. |
| Scoping T-H2 / AIF-C memory gateway phase 2 | `docs/work_orders/CVF_WO_AIF_C_MEMORY_GATEWAY_PHASE2_2026-05-23.md`; AIF-C GC-018; all agentmemory implementation specs | Learning Plane AIF-C modules and tests | Operator override is required for new memory tiers beyond Lane H; Phase 2a remains in-memory. |
| Scoping T-GRAPH / AIF-B graph knowledge phase 1 | `docs/work_orders/CVF_WO_AIF_B_GRAPH_KNOWLEDGE_PHASE1_2026-05-23.md`; AIF-B GC-018; actual code-review-graph file list | Learning Plane graph modules and tests | Work order scoring-spec reference was corrected: no `CVF_GRAPH_SCORING_SPEC.md` exists in the source bundle. |
| Starting or resuming a session | `CVF_SESSION_MEMORY.md`; `CVF_SESSION/ACTIVE_SESSION_STATE.json`; active handoff named by the registry | Active session registry and root active handoff | Do not append status to archived handoffs. |
| Checking GC-023 file-size posture | `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`; local hook chain | Governance compatibility scripts | File-size guard is advisory unless the hook reports blocking status. |
| Authoring or dispatching a work order | `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`; `AGENTS.md` Mandatory Work Order Source Verification section; any canonical source contract named by the work order | `docs/work_orders/` and current source/canonical contracts | Source facts require source file plus line/section before dispatch. Runtime/source vocabulary cannot be verified from memory alone. New doc-only connector fields must be separated from source facts. MA1 section references must match the canonical MA1 standard exactly. |
| Checking Pain H memory status | `docs/reviews/CVF_H2_WORKING_MEMORY_RUNTIME_PROOF_COMPLETION_2026-05-22.md`; `docs/reviews/archive/CVF_T5_RUNTIME_MEMORY_WIRING_COMPLETION_2026-05-22.md`; registry agentmemory row; AIF-C completion | Learning Plane runtime-memory and AIF-C modules | H/AIF-C prove bounded memory surfaces, not durable or live provider memory. |
| Checking graph knowledge status | Registry code-review-graph row; `docs/reference/CVF_SCOPED_KNOWLEDGE_PROVIDER_BOUNDARY_DOCTRINE_2026-05-07.md`; AIF-B completion | Learning Plane graph schema/parser/index/task-query modules | Phase 1 is in-memory AST/index/blast-radius foundation only. |

## Maintenance Rule

Update this index in the same commit whenever a tranche adds or closes a new
operational front-door path. If a referenced source folder contains a missing
or renamed spec, record the actual file list and the corrected boundary instead
of preserving a stale work-order assumption.

## Claim Boundary

This index improves agent scoping and reference discovery. It does not prove
runtime governance behavior, live provider behavior, public readiness, release
readiness, or automatic legacy absorption.
