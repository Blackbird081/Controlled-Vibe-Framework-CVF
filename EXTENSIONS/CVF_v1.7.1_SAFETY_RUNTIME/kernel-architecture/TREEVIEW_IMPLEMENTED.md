CVF v1.7.1 Kernel Architecture - IMPLEMENTED (Current Snapshot)
Generated from current files in `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/`.
Validation commands:
- `npm run test:run`
- `npm run test:coverage`

EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/
|
|-- README.md
|-- Thong_tin.md
|-- TREEVIEW.md
|-- TREEVIEW_TARGET.md
|-- TREEVIEW_IMPLEMENTED.md
|-- ROLLOUT_PLAN.md
|-- package.json
|-- package-lock.json
|-- tsconfig.json
|-- vitest.config.mjs
|
|-- tests/
|   |-- contract_enforcer.test.ts
|   |-- contract_runtime_engine.test.ts
|   |-- contamination_guard.test.ts
|   |-- cvf_policy_parity.test.ts
|   |-- cvf_web_integration.test.ts
|   |-- domain_guard.test.ts
|   |-- entrypoint_enforcement.test.ts
|   |-- execution_orchestrator.test.ts
|   |-- kernel_expanded_coverage.test.ts
|   |-- orchestrator_benchmark.test.ts
|   |-- orchestrator_e2e.test.ts
|   |-- refusal_policy_golden.test.ts
|   |-- golden/
|   |   `-- refusal-policy.v1.json
|   `-- risk_refusal.test.ts
|
|-- kernel/
|   |
|   |-- 01_domain_lock/
|   |   |-- boundary_rules.ts
|   |   |-- domain_guard.ts
|   |   |-- domain_map.schema.ts
|   |   |-- domain.registry.ts
|   |   |-- domain.types.ts
|   |   |-- domain_classifier.ts
|   |   |-- domain_context_object.ts
|   |   |-- domain_lock_engine.ts
|   |   `-- scope_resolver.ts
|   |
|   |-- 02_contract_runtime/
|   |   |-- contract.types.ts
|   |   |-- contract.schema.ts
|   |   |-- consumer_authority_matrix.ts
|   |   |-- contract_enforcer.ts
|   |   |-- contract_validator.ts
|   |   |-- contract_runtime_engine.ts
|   |   |-- io_contract_registry.ts
|   |   `-- output_validator.ts
|   |
|   |-- 03_contamination_guard/
|   |   |-- assumption_tracker.ts
|   |   |-- drift_detector.ts
|   |   |-- lineage_graph.ts
|   |   |-- risk_propagation_engine.ts
|   |   |-- rollback_controller.ts
|   |   |-- risk.types.ts
|   |   |-- risk.matrix.ts
|   |   |-- risk_detector.ts
|   |   `-- risk_scorer.ts
|   |
|   |-- 04_refusal_router/
|   |   |-- alternative_route_engine.ts
|   |   |-- capability.guard.ts
|   |   |-- capability.registry.ts
|   |   |-- capability.types.ts
|   |   |-- clarification_generator.ts
|   |   |-- refusal.authority.policy.ts
|   |   |-- refusal.execution.ts
|   |   |-- refusal_policy.ts
|   |   |-- refusal_policy_registry.ts
|   |   |-- refusal.risk.ts
|   |   |-- refusal.router.ts
|   |   `-- safe_rewrite_engine.ts
|   |
|   `-- 05_creative_control/
|       |-- audit.logger.ts
|       |-- creative.controller.ts
|       |-- creative_permission.policy.ts
|       |-- creative_provenance.tagger.ts
|       |-- invariant.checker.ts
|       |-- lineage.store.ts
|       |-- lineage.types.ts
|       |-- refusal.registry.ts
|       `-- trace.reporter.ts
|
|-- runtime/
|   |-- execution_orchestrator.ts
|   |-- kernel_runtime_entrypoint.ts
|   |-- llm_adapter.ts
|   `-- session_state.ts
|
`-- internal_ledger/
    |-- boundary_snapshot.ts
    |-- lineage_tracker.ts
    `-- risk_evolution.ts
