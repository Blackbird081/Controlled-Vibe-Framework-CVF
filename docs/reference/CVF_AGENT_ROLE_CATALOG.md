# CVF Agent Role Catalog

Memory class: POINTER_RECORD

Status: AUTHORIZED

docType: reference

Date: 2026-05-20

---

## Purpose

Define the canonical CVF agent role templates absorbed from legacy predecessor
evidence.

The catalog describes execution roles. It is not a runtime gate, auth system,
RBAC replacement, or permission self-upgrade mechanism.

---

## Scope

This file is absorption-only. Runtime enforcement remains unchanged in the
active CVF role resolver and governed pack policy files.

The 11 role IDs below are preserved as role templates. The runtime pack policy
roles `OPERATOR`, `BUILDER`, `REVIEWER`, and `SERVICE_AGENT` remain the
current execution authority labels for governed packs.

---

## Source

Predecessor evidence:

- `.private_reference/legacy/CVF 16.5/Claude Kit/CVF_AGENT_ROLE_CATALOG.md`
- `docs/reviews/archive/CVF_LANE_G_RUNTIME_ACTOR_ENFORCEMENT_COMPLETION_2026-05-19.md`
- `docs/baselines/archive/CVF_GC018_G1_ROLE_CATALOG_ABSORPTION_2026-05-20.md`

---

## Contract

Each role definition carries four canonical fields:

- `allowed_outputs`
- `permission_model`
- `execution_boundary`
- `receipt_ownership`

Role templates do not override governed pack authority labels.

---

## Role Definitions

### planner_agent

- **allowed_outputs**: plan, task_breakdown, dependency_map
- **permission_model**: read-only planning authority
- **execution_boundary**: may decompose and sequence work; may not mutate code
- **receipt_ownership**: must cite handoff and planning receipt evidence

### coder_agent

- **allowed_outputs**: patch, code_change, implementation_note
- **permission_model**: scoped code-write authority
- **execution_boundary**: may edit approved files only; may not deploy
- **receipt_ownership**: owns implementation evidence and changed-path summary

### reviewer_agent

- **allowed_outputs**: review_report, issue_list, approval_recommendation
- **permission_model**: read-only review authority unless separately upgraded
- **execution_boundary**: reviews behavior, risk, and tests; does not self-merge
- **receipt_ownership**: owns findings, residual risks, and approval posture

### test_agent

- **allowed_outputs**: test_plan, test_case, test_result, failure_report
- **permission_model**: local test execution authority
- **execution_boundary**: may run scoped tests; may not alter production config
- **receipt_ownership**: owns command evidence and failure reproduction notes

### security_agent

- **allowed_outputs**: security_report, vulnerability_note, risk_assessment
- **permission_model**: read-only security assessment with escalation authority
- **execution_boundary**: may identify and escalate risk; may not suppress risk
- **receipt_ownership**: owns risk evidence and mitigation recommendations

### docs_agent

- **allowed_outputs**: markdown_doc, changelog_entry, usage_guide
- **permission_model**: scoped documentation-write authority
- **execution_boundary**: may edit approved documentation paths only
- **receipt_ownership**: owns doc diffs, source anchors, and claim boundaries

### refactor_agent

- **allowed_outputs**: refactor_patch, migration_note, behavior_preservation_report
- **permission_model**: limited code-write authority
- **execution_boundary**: may simplify structure while preserving behavior
- **receipt_ownership**: owns equivalence rationale and regression evidence

### db_agent

- **allowed_outputs**: sql_patch, migration_plan, schema_report
- **permission_model**: database-limited authority
- **execution_boundary**: destructive migrations require explicit approval
- **receipt_ownership**: owns schema diffs, migration risks, and rollback notes

### frontend_agent

- **allowed_outputs**: ui_patch, component_update, frontend_test_note
- **permission_model**: scoped frontend-write authority
- **execution_boundary**: may change approved UI paths and client behavior
- **receipt_ownership**: owns UI test evidence and visual/regression notes

### backend_agent

- **allowed_outputs**: api_patch, service_update, backend_test_note
- **permission_model**: scoped backend-write authority with stricter validation
- **execution_boundary**: auth, payment, permission, and data paths require care
- **receipt_ownership**: owns API/service evidence and risk controls

### deployment_agent

- **allowed_outputs**: deployment_plan, release_checklist, deployment_receipt
- **permission_model**: deployment-guarded authority
- **execution_boundary**: deployment execution always requires explicit approval
- **receipt_ownership**: owns release evidence and deployment receipts

---

## Pack Policy Alignment

The three governed pack policy files currently use:

- `OPERATOR`
- `BUILDER`
- `REVIEWER`
- `SERVICE_AGENT`

Those are runtime authority labels, not replacements for the 11 role-template
IDs above. Alignment result: consistent with current runtime ownership because
pack policies govern execution authority while this catalog governs agent role
templates.

Reviewed pack policies:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-packs/app_builder_complete/execution.policy.json`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-packs/documentation/execution.policy.json`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-packs/strategy_analysis/execution.policy.json`

---

## Enforcement / Verification

Enforcement remains outside this file:

- Runtime pack authorization remains in governed pack policy files.
- Role resolution remains in the active runtime role resolver.
- This catalog is verified by structural completeness and closure review only.

---

## Related Artifacts

- `docs/work_orders/archive/CVF_WO_RESIDUAL_G1_ROLE_CATALOG_ABSORPTION_2026-05-20.md`
- `docs/reviews/archive/CVF_G1_ROLE_CATALOG_ABSORPTION_CLOSURE_REVIEW_2026-05-20.md`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execute-role-resolver.ts`

---

## Claim Boundary

This catalog is reference-only. It does not change runtime enforcement,
authorize new roles, alter pack policies, or redesign RBAC.
