ai_governance_core/
│
├── adapters/                          # ← NEW: CVF Integration Adapters
│   ├── __init__.py
│   ├── cvf_risk_adapter.py            # R0-R4 ↔ LOW/MEDIUM/HIGH/CRITICAL
│   ├── cvf_quality_adapter.py         # 4-dimension CVF quality scoring
│   └── cvf_enforcement_adapter.py     # Decisions → CVF enforcement actions
│
├── api/                               # ← NEW: FastAPI REST Server
│   ├── __init__.py
│   └── server.py                      # /evaluate, /approve, /ledger, /health
│
├── domain_layer/
│   ├── ui_domain.py
│   ├── prompt_domain.py
│   ├── llm_output_domain.py
│   ├── data_exposure_domain.py
│   └── domain_registry.py
│
├── policy_dsl/
│   ├── policies.dsl                   # Now includes CVF phase/risk rules
│   ├── dsl_parser.py
│   ├── dsl_executor.py                # Safe AST-based (no eval)
│   ├── dsl_engine.py
│   └── dsl_schema.json
│
├── policy_layer/
│   └── base_policy.py                 # ABC + BasePolicyEngine default impl
│
├── enforcement_layer/
│   ├── enforcement_engine.py
│   ├── decision_matrix.py
│   ├── action_router.py
│   └── shared_enums.py                # GovernanceDecision, ActionTarget
│
├── identity_layer/
│   ├── role_registry.json
│   ├── user_registry.json
│   ├── permission_matrix.json
│   ├── rbac_engine.py
│   └── cvf_role_mapper.py             # ← NEW: CVF role mapping
│
├── approval_layer/
│   ├── approval_engine.py
│   ├── approval_workflow.py           # Enterprise: multi-level, SLA, override
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
├── governance_layer/
│   ├── governance_orchestrator.py     # DEPRECATED → use CoreOrchestrator
│   ├── approval_workflow.py           # DEPRECATED → use approval_layer
│   ├── audit_logger.py               # Thread-safe audit logging
│   └── scoring_engine.py
│
├── telemetry_layer/
│   ├── telemetry_exporter.py          # Thread-safe
│   ├── risk_calculator.py
│   ├── trend_tracker.py               # Thread-safe
│   ├── project_scorecard.py
│   └── metrics_schema.json
│
├── ledger_layer/
│   ├── immutable_ledger.py            # Thread-safe
│   ├── block_builder.py
│   ├── hash_engine.py
│   ├── ledger_validator.py
│   └── ledger_chain.json
│
├── brand_control_layer/
│   ├── brand_guardian.py
│   ├── drift_engine.py
│   ├── freeze_engine.py
│   └── token_engine.py
│
├── compliance_layer/
│   ├── compliance_engine.py
│   ├── contrast_engine.py
│   └── html_analyzer.py
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
├── reports/
│   ├── json_report_builder.py
│   ├── markdown_builder.py
│   └── report_formatter.py
│
├── ci/
│   ├── pr_gate.py
│   ├── exit_codes.py
│   ├── github_action.yml              # CVF-integrated GitHub Action
│   └── pre_commit_hook.py             # ← NEW: Pre-commit governance check
│
├── tests/                             # ← NEW: Comprehensive test suite
│   ├── conftest.py
│   ├── test_approval.py
│   ├── test_cvf_enforcement_adapter.py
│   ├── test_cvf_quality_adapter.py
│   ├── test_cvf_risk_adapter.py
│   ├── test_dsl.py
│   ├── test_enforcement.py
│   ├── test_integration.py
│   ├── test_ledger.py
│   ├── test_role_mapper.py
│   └── test_utils.py
│
├── core/
│   └── utils.py                       # Thread-safe JSON I/O + hashing
│
├── config/
│   └── governance_config.json
│
├── data/
│   ├── governance_history.json
│   └── project_scores.json
│
├── core_orchestrator.py               # Unified 8-step DI pipeline
├── main.py                            # Local execution entry point
├── main_ci.py                         # CI execution entry point
├── requirements.txt                   # ← NEW: Python dependencies
├── pytest.ini                         # ← NEW: Test configuration
├── ASSESSMENT_2026-02-21.md
├── CVF_INTEGRATION_PLAN.md
├── TREEVIEW.md
├── README.md
└── __init__.py