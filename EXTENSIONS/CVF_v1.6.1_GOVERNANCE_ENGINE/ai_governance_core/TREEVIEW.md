ai_governance_core/
│
├── domain_layer/
│   ├── ui_domain.py
│   ├── prompt_domain.py
│   ├── llm_output_domain.py
│   ├── data_exposure_domain.py
│   └── domain_registry.py
│
├── policy_dsl/
│   ├── policies.dsl
│   ├── dsl_parser.py
│   ├── dsl_executor.py
│   ├── dsl_engine.py
│   └── dsl_schema.json
│
├── enforcement_layer/
│   ├── enforcement_engine.py
│   ├── decision_matrix.py
│   └── action_router.py
│
├── identity_layer/
│   ├── role_registry.json
│   ├── user_registry.json
│   ├── permission_matrix.json
│   └── rbac_engine.py
│
├── approval_layer/
│   ├── approval_engine.py
│   ├── approval_workflow.py
│   ├── escalation_engine.py
│   └── approval_registry.json
│
├── override_layer/
│   ├── override_engine.py
│   ├── override_validator.py
│   ├── approval_token_engine.py
│   ├── override_registry.json
│   └── override_schema.json
│
├── telemetry_layer/
│   ├── telemetry_exporter.py
│   ├── risk_calculator.py
│   ├── trend_tracker.py
│   ├── project_scorecard.py
│   └── metrics_schema.json
│
├── ledger_layer/
│   ├── immutable_ledger.py
│   ├── block_builder.py
│   ├── hash_engine.py
│   ├── ledger_validator.py
│   └── ledger_chain.json
│
├── tamper_detection/
│   ├── registry_integrity.py
│   ├── integrity_snapshot.json
│   └── tamper_alert_engine.py
│
├── simulation_layer/
│   ├── simulation_engine.py
│   ├── scenario_loader.py
│   ├── impact_analyzer.py
│   ├── sample_scenarios.json
│   └── simulation_report.json
│
├── ci/
│   ├── pr_gate.py
│   ├── exit_codes.py
│   └── github_action.yml
│
├── data/
│   ├── governance_history.json
│   └── project_scores.json
│
├── core_orchestrator.py
├── main_ci.py
└── README.md