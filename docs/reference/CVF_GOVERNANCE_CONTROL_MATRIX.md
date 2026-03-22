# CVF Governance Control Matrix

Status: canonical ownership map for critical governance controls in the active CVF baseline.

## Purpose

- map each critical governance rule to exactly one primary enforcement owner
- distinguish runtime blocking controls from repository hygiene controls
- make future audit, reassessment, and roadmap closure faster and less ambiguous

## Enforcement Classes

| Enforcement class | Meaning | Typical location |
|---|---|---|
| `RUNTIME_GUARD` | action-time guard evaluation inside the active runtime path | guard engines, SDK runtime, shared contract |
| `GATEWAY_PRECONDITION` | single entry gate that must run before execution starts | mandatory gateway, entry adapters |
| `APPROVAL_CHECKPOINT` | human decision boundary before governed execution may continue | pipeline orchestrator, governed workflow steps |
| `CI_REPO_GATE` | repository or historical evidence enforcement | compat scripts, hooks, CI workflows |
| `GOVERNANCE_DECISION_GATE` | mandatory scored decision before roadmap deepening or breadth expansion continues | roadmap depth-audit register, governance policy records |

## Control Matrix

| Control ID | Governance rule | Primary owner | Enforcement class | Active entrypoints | Primary evidence |
|---|---|---|---|---|---|
| `GC-001` | AI agents cannot act in human-only phases | `PhaseGateGuard` | `RUNTIME_GUARD` | shared guard engine, runtime SDK, Web/API adapters | `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/phase-gate.guard.ts`, `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/guard.runtime.test.ts` |
| `GC-002` | high-risk actions must escalate or block | `RiskGateGuard` | `RUNTIME_GUARD` | shared guard engine, runtime SDK, multi-agent runtime | `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/risk-gate.guard.ts`, `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/conformance.runner.test.ts` |
| `GC-003` | non-human actors cannot approve, deploy, merge, or override gates | `AuthorityGateGuard` | `RUNTIME_GUARD` | shared guard engine, runtime SDK, Web execute path | `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/authority-gate.guard.ts`, `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/sdk.test.ts` |
| `GC-004` | mutating AI actions require `ai_commit` evidence | `AiCommitGuard` | `RUNTIME_GUARD` | shared guard engine, runtime SDK defaults | `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/ai-commit.guard.ts`, `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.test.ts` |
| `GC-005` | mutations must stay within budget | `MutationBudgetGuard` | `RUNTIME_GUARD` | shared guard engine, runtime SDK defaults | `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/mutation-budget.guard.ts`, `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/guard.runtime.test.ts` |
| `GC-006` | file mutations must stay inside declared file scope | `FileScopeGuard` | `RUNTIME_GUARD` | shared guard engine, runtime SDK, multi-agent runtime | `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/file-scope.guard.ts`, `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/multi.agent.runtime.test.ts` |
| `GC-007` | protected governance/root paths cannot be modified freely | `ScopeGuard` | `RUNTIME_GUARD` | shared guard engine, runtime SDK defaults | `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/scope.guard.ts`, `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.test.ts` |
| `GC-008` | request, agent, and trace evidence must exist for governed actions | `AuditTrailGuard` | `RUNTIME_GUARD` | shared guard engine, runtime SDK defaults | `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/audit-trail.guard.ts`, `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/guard.runtime.test.ts` |
| `GC-009` | every execution channel must pass through guard evaluation first | `MandatoryGateway` | `GATEWAY_PRECONDITION` | guard contract runtime helpers, channel entry wrappers | `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/mandatory-gateway.ts`, `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/mandatory-gateway.test.ts` |
| `GC-010` | governed helper runtime must stop on approval-required escalations | `AgentExecutionRuntime` | `GATEWAY_PRECONDITION` | guard contract runtime helpers, governed helper sessions | `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/agent-execution-runtime.ts`, `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/agent-execution-runtime.test.ts` |
| `GC-011` | governed `BUILD` requires plan evidence before execution proceeds | `PipelineOrchestrator` | `APPROVAL_CHECKPOINT` | runtime orchestrator, SDK bridge workflows | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/pipeline.orchestrator.ts`, `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/pipeline.orchestrator.test.ts` |
| `GC-012` | governed `BUILD` and `FREEZE` checkpoints require explicit approval when risk or metadata demands it | `PipelineOrchestrator` | `APPROVAL_CHECKPOINT` | runtime orchestrator, SDK bridge workflows | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/sdk.test.ts`, `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/pipeline.orchestrator.test.ts` |
| `GC-013` | governed `FREEZE` requires execution and review evidence before closure | `PipelineOrchestrator` | `APPROVAL_CHECKPOINT` | runtime orchestrator, SDK bridge workflows | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/pipeline.orchestrator.ts`, `docs/baselines/CVF_SYSTEM_UNIFICATION_PHASE2_CONTROL_LOOP_DELTA_2026-03-20.md` |
| `GC-014` | rollback actions must preserve failure reason and rollback evidence | `ExtensionBridge` | `APPROVAL_CHECKPOINT` | cross-extension workflow runtime | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/wiring/extension.bridge.ts`, `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/extension.bridge.test.ts` |
| `GC-015` | baseline artifact must be updated after every substantive change | `check_baseline_update_compat.py` | `CI_REPO_GATE` | CI, local pre-push hook chain | `governance/compat/check_baseline_update_compat.py`, `governance/toolkit/05_OPERATION/CVF_BASELINE_UPDATE_GUARD.md` |
| `GC-016` | docs, bug, and test evidence must remain historically consistent | `docs governance + bug/test compat gates` | `CI_REPO_GATE` | CI, local hooks | `governance/compat/check_docs_governance_compat.py`, `governance/compat/check_bug_doc_compat.py`, `governance/compat/check_test_doc_compat.py` |
| `GC-017` | release/readiness claims must stay aligned with actual reference docs | `check_release_manifest_consistency.py` | `CI_REPO_GATE` | CI, release-readiness verification | `governance/compat/check_release_manifest_consistency.py`, `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md` |
| `GC-018` | roadmap deepening and breadth expansion must stop unless depth-audit scoring justifies continuation | `CVF_DEPTH_AUDIT_GUARD` + roadmap depth-audit register + `check_depth_audit_continuation_compat.py` | `GOVERNANCE_DECISION_GATE` | roadmap continuation decisions, CI, local pre-push hook chain | `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`, `governance/compat/check_depth_audit_continuation_compat.py`, `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`, `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md` |
| `GC-019` | major structural changes must complete `audit -> independent review -> explicit decision -> execution` before code moves or merges begin | `CVF_STRUCTURAL_CHANGE_AUDIT_GUARD` + structural audit packet + independent review packet | `GOVERNANCE_DECISION_GATE` | restructuring roadmap execution, structural merge packets, user approval checkpoints | `governance/toolkit/05_OPERATION/CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md`, `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_AUDIT_TEMPLATE.md`, `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_REVIEW_TEMPLATE.md`, `docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md` |
| `GC-020` | governed work pauses/transfers must leave one truthful handoff before another worker continues | `CVF_AGENT_HANDOFF_GUARD` + canonical handoff template | `APPROVAL_CHECKPOINT` | pause/resume checkpoints, agent-to-agent transfer, governed tranche continuation | `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md`, `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md` |

## Notes

- The matrix assigns one primary owner per rule to avoid ambiguous governance claims.
- Secondary evidence or helper layers may support the same rule, but they are not the primary owner unless listed above.
- Runtime guards exist for action-time blocking or escalation.
- CI/repository gates remain valid on purpose for historical evidence, baseline continuity, and release-truth controls.
- Governance decision gates exist to prevent low-yield semantic deepening even when no runtime or CI gate is appropriate.
- `GC-019` is intentionally separate from `GC-018`: one governs whether a wave should open, the other governs whether a specific structural merge inside a wave is safe to execute.
- `GC-020` covers continuity truth at pause/transfer time so resumed work does not depend on hidden agent memory.

## Current Closure Statement

At the active `2026-03-20` local baseline:

- critical runtime blocking rules have an explicit executable owner
- governed approval and freeze-closure rules have an explicit approval-checkpoint owner
- repository-history and evidence continuity rules have an explicit CI or hook owner

This closes the major ambiguity previously identified in the independent system review, while still allowing future refinement of secondary controls and ecosystem-wide coverage depth.
