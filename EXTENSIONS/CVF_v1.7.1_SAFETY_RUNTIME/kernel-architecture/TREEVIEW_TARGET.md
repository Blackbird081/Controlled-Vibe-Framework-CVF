CVF v1.7.1 Kernel Architecture - TARGET (Design Intent)

Principle:
- CVF core is the base.
- Kernel additions must extend CVF safety depth, not break existing CVF structure.
- Runtime entrypoint must remain mandatory (`kernel_runtime_entrypoint.ts`) for all execution paths.

EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/
|
|-- README.md
|-- Thong_tin.md
|-- TREEVIEW_TARGET.md
|-- TREEVIEW_IMPLEMENTED.md
|-- ROLLOUT_PLAN.md
|
|-- kernel/
|   |
|   |-- 01_domain_lock/
|   |   |-- domain.types.ts
|   |   |-- domain_context_object.ts
|   |   |-- domain_classifier.ts
|   |   |-- scope_resolver.ts
|   |   |-- boundary_rules.ts
|   |   `-- domain_map.schema.ts
|   |
|   |-- 02_contract_runtime/
|   |   |-- contract.types.ts
|   |   |-- io_contract_registry.ts
|   |   |-- consumer_authority_matrix.ts
|   |   |-- transformation_guard.ts
|   |   `-- contract_validator.ts
|   |
|   |-- 03_contamination_guard/
|   |   |-- risk.types.ts
|   |   |-- assumption_tracker.ts
|   |   |-- lineage_graph.ts
|   |   |-- risk_propagation_engine.ts
|   |   |-- drift_detector.ts
|   |   `-- rollback_controller.ts
|   |
|   |-- 04_refusal_router/
|   |   |-- refusal_policy.ts
|   |   |-- refusal_policy_registry.ts
|   |   |-- safe_rewrite_engine.ts
|   |   |-- clarification_generator.ts
|   |   `-- alternative_route_engine.ts
|   |
|   `-- 05_creative_control/
|       |-- creative.controller.ts
|       |-- creative_permission.policy.ts
|       `-- creative_provenance.tagger.ts
|
|-- runtime/
|   |-- execution_orchestrator.ts
|   |-- kernel_runtime_entrypoint.ts
|   |-- llm_adapter.ts
|   `-- session_state.ts
|
`-- internal_ledger/
    |-- lineage_tracker.ts
    |-- risk_evolution.ts
    `-- boundary_snapshot.ts
