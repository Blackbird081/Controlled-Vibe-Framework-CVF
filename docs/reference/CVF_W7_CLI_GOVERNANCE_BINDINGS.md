# CVF W7 CLI Governance Bindings

> **Document Type:** DEFERRED BY DESIGN
> **Status:** W71-T1 posture finalized 2026-04-13; CLI runtime not yet built; no CPF/LPF/cvf-web implementation evidence; intentionally deferred until a future CLI-build wave receives GC-018 authorization
> **Source Quality:** internal_design_draft
> **Scope:** Governance bindings for CLI commands into existing CVF modules
> **Scope Boundary:** This document covers the W7/CLI operator surface only. It does not modify or overlap with the separate PVV Alibaba provider/API-key assessment flow.

## 1. Purpose

This document defines how each CLI domain binds to governance and authorization surfaces already present in CVF.

For every command class, it answers:

1. which CVF module owns the path
2. which governance checks must apply
3. which W7 records must be emitted
4. when the command is allowed, blocked, or conditional

## 2. Binding Principles

### 2.1 No Direct Path Rule

No CLI command may directly invoke:

- raw skill execution
- raw agent execution
- raw tool or MCP invocation
- registry mutation
- memory mutation

without first passing through the mapped CVF governance chain.

### 2.2 Mutation Class Matters

Every command must be classified as one of:

- `read-only`
- `build-only`
- `mutate-registry`
- `execute-runtime`

### 2.3 Authorization Is Mandatory for Runtime

Any command that leads to runtime execution must bind to:

- Policy Gate
- Execution Authorization
- appropriate trust/isolation boundary

## 3. Domain Binding Matrix

| CLI Domain | Primary CVF Owner | Required Governance | Required W7 Outputs |
| --- | --- | --- | --- |
| context | Knowledge Layer / Context Builder | policy if source scope applies | trace |
| policy | Policy Engine / Guard Engine | always | trace + decision refs |
| asset | W7 Governance Integration Layer | schema, dependency, policy, guard | compile or validation trace |
| plan | Boardroom / Orchestrator | dependency + policy readiness | planner trace or decision |
| run | Execution Plane | policy + guard + authorization + isolation | runtime/artifact/eval trace |
| trace | Learning Plane / Observability | access control only | trace access log |
| system | CLI surface / environment | config and environment checks | system trace |

## 4. Context Bindings

### 4.1 `context inspect`

Classification:

- `read-only`

Required governance:

- source-scope policy if protected sources are involved
- access visibility check

### 4.2 `context build`

Classification:

- `build-only`

Required governance:

- source-scope policy
- context size or packaging guard
- trust boundary check for external material
- explicit context validation guard alias: `CONTEXT_VALIDATION_REQUIRED`

Decision model:

- allowed if all source and trust checks pass
- blocked if external material cannot be validated inside declared boundary

## 5. Policy Bindings

### 5.1 `policy inspect`

Classification:

- `read-only`

### 5.2 `policy eval`

Classification:

- `build-only`

Required governance:

- Policy Engine
- Guard Engine
- Audit / Consensus when configured for sensitive paths

Decision model:

- `allowed` if policy and guard pass
- `blocked` if any blocking rule fails
- `conditional` if approval or refinement is required

## 6. Asset Bindings

### 6.1 `asset ingest`

Classification:

- `build-only`

Required governance:

- external source trust check
- bundle path safety
- workspace write boundary

### 6.2 `asset classify`

Classification:

- `build-only`

Required governance:

- classification profile validity
- source boundary continuity

### 6.3 `asset normalize`

Classification:

- `build-only`

Required governance:

- normalization schema check
- structural consistency check

### 6.4 `asset compile`

Classification:

- `build-only`

Required governance:

- compile profile validity
- target asset type compatibility
- policy compatibility for generated asset classes
- guard binding completeness

Decision model:

- allowed if all required mappings are satisfiable
- blocked if any component cannot be mapped into an approved W7 asset type

### 6.5 `asset validate`

Classification:

- `build-only`

Required governance:

- schema validity
- dependency integrity
- scope boundary integrity
- policy compliance
- registration readiness

### 6.6 `asset register`

Classification:

- `mutate-registry`

Required governance:

- only validated assets can register
- batch atomicity or explicit partial-registration policy
- watchdog visibility

### 6.7 `asset remove`

Classification:

- `mutate-registry`

Required governance:

- dependency impact check
- removal policy
- watchdog notification

## 7. Plan Bindings

### 7.1 `plan build`

Classification:

- `build-only`

Required governance:

- planner compatibility check
- dependency graph integrity pre-check
- policy readiness markers

Fast-path allowance:

- a planner trigger may emit a single `candidate_ref` when confidence is very high, prerequisites are satisfied, `risk_level = R0`, and the governed plan/build/check chain remains intact
- this is not a bypass; it still flows through plan build and later governance checks

### 7.2 `plan inspect`

Classification:

- `read-only`

### 7.3 `plan validate`

Classification:

- `build-only`

Required governance:

- dependency graph checks
- runtime readiness checks

## 8. Run Bindings

### 8.1 `run exec`

Classification:

- `execute-runtime`

Required governance:

- policy evaluation
- guard evaluation
- authorization check
- trust or isolation check
- watchdog visibility

Decision model:

- allowed only if all execution gates pass
- blocked if policy, guard, authorization, or isolation fails
- conditional if additional approval is required

### 8.2 `run status`

Classification:

- `read-only`

### 8.3 `run cancel`

Classification:

- `mutate-runtime-state`

### 8.4 `run resume`

Classification:

- `execute-runtime`

Required governance:

- resume eligibility check
- state integrity check
- policy and authorization re-check

## 9. Trace and System Bindings

`trace` commands remain read-only access surfaces over:

- W7 trace store
- artifact store
- evaluation store
- memory store

`system` commands remain environment and configuration inspection surfaces with secret masking always enforced.

## 10. Minimum Governance by Mutation Class

| Mutation Class | Minimum Required Governance |
| --- | --- |
| read-only | access visibility + trace access log |
| build-only | schema checks + source boundary checks + trace |
| mutate-registry | validation passed + registry compatibility + watchdog + trace |
| execute-runtime | policy + guard + authorization + isolation + watchdog + full W7 trace |

## 11. Blocking Conditions

A CLI command must be blocked if:

- the requested operation cannot be mapped to an approved CVF module
- the requested output would bypass W7 traceability
- the requested execution would bypass authorization or isolation
- asset compile produces an unmappable raw artifact type
- registry mutation would violate dependency integrity
- trace access exceeds visibility policy

## 12. Final Binding Rule

Every CLI operation must preserve this chain:

```text
CLI command
-> owning CVF module
-> required governance checks
-> W7 record emission
-> governed outcome
```

If any link is missing, the command is not valid for the CVF CLI.
