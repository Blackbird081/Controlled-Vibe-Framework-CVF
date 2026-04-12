# CVF W7 CLI Schema Contracts

> **Document Type:** INTERNAL DESIGN DRAFT
> **Status:** Promoted from private reference after Round 3 rebuttal on 2026-04-12
> **Source Quality:** internal_design_draft
> **Scope:** Request/response, error, trace, artifact, and validation contracts for the CVF W7 CLI
> **Scope Boundary:** This document governs the W7/CLI intake surface only. It is unrelated to the separate PVV Alibaba provider/API-key evaluation work referenced in `AGENT_HANDOFF.md`.

## 1. Purpose

This document defines the stable contract surface for the CVF W7 CLI.

The goal is:

- consistency
- traceability
- governance integrity
- machine-readable operator behavior

Every command must emit envelopes that can be validated, logged, traced through W7, and consumed by automation without ambiguity.

## 2. Contract Principles

### 2.1 One Envelope Model

All CLI commands must use one common top-level envelope.
Domain payloads may vary, but the outer structure must remain stable.

### 2.2 Governance-first Metadata

Every envelope must answer:

- what was requested
- which CVF module handled it
- whether governance checks were applied
- whether execution was authorized
- which trace ids were emitted

### 2.3 No Hidden Mutation

If a command mutates state, the response must declare:

- what state changed
- whether the change committed
- which artifacts or registry entries were affected

## 3. Common Request Envelope

```yaml
request_envelope:
  request_id: string
  command:
    domain: string
    verb: string
    full_name: string
  actor:
    actor_id: string
    actor_type: user|service|automation
  workspace:
    workspace_id: string
    root_path: string
  input:
    mode: flags|file|stdin
    payload_ref: string
  options:
    output: table|json|yaml
    dry_run: boolean
    profile: string
  governance:
    require_policy_eval: boolean
    require_guard_eval: boolean
    require_authorization: boolean
  timestamp: string
```

Notes:

- `payload_ref` may point to a file or a normalized stdin snapshot
- `require_authorization` is mandatory for execution-capable commands

## 4. Common Response Envelope

```yaml
response_envelope:
  request_id: string
  command:
    domain: string
    verb: string
    full_name: string
  status:
    outcome: success|partial_success|failed|blocked|rejected
    code: string
    message: string
  cvf_mapping:
    layer: string
    module: string
    w7_path: string
  governance:
    policy_eval_applied: boolean
    guard_eval_applied: boolean
    authorization_applied: boolean
    decision: allowed|blocked|conditional
    decision_ref: string
  result:
    kind: inspection|bundle|normalized_units|asset_batch|plan|run|trace|artifact|eval|memory|system
    payload: object
  state_change:
    changed: boolean
    commit_status: none|planned|committed|rolled_back
    affected_refs: []
  trace:
    trace_id: string
    trace_refs: []
  timing:
    started_at: string
    finished_at: string
    duration_ms: integer
```

## 5. Error Envelope

```yaml
error_envelope:
  request_id: string
  status:
    outcome: failed|blocked|rejected
    code: string
    message: string
  error:
    category: input|schema|dependency|policy|guard|authorization|runtime|registry|system
    detail: string
    remediation: string
    retryable: boolean
  cvf_mapping:
    layer: string
    module: string
    w7_path: string
  trace:
    trace_id: string
    trace_refs: []
```

Required categories:

- `input`
- `schema`
- `dependency`
- `policy`
- `guard`
- `authorization`
- `runtime`
- `registry`
- `system`

## 6. Minimal Result Payloads

### 6.1 Asset Ingest

```yaml
result:
  kind: bundle
  payload:
    bundle_id: string
    source_type: repo|folder|archive
    source_ref: string
    file_count: integer
```

### 6.2 Asset Classify

```yaml
result:
  kind: normalized_units
  payload:
    bundle_id: string
    candidates:
      - component_path: string
        candidate_type: command|policy|context|skill|agent|planner|tool|learning
        confidence: number
```

### 6.3 Asset Compile

```yaml
result:
  kind: asset_batch
  payload:
    batch_id: string
    asset_count: integer
    assets:
      - asset_id: string
        asset_type: string
        source_component: string
        spec_path: string
        validation_status: pending|passed|failed
```

### 6.4 Plan Build

```yaml
result:
  kind: plan
  payload:
    plan_id: string
    planner_asset_id: string
    steps:
      - step_id: string
        kind: skill|agent|tool|policy_check|context_build
        dependency_on: []
    authorization_required: boolean
```

### 6.5 Run Exec

```yaml
result:
  kind: run
  payload:
    run_id: string
    run_status: queued|running|completed|failed|cancelled|blocked
    plan_id: string
    current_step: string
    artifact_refs: []
```

## 7. Validation Report Contract

```yaml
validation_report:
  validation_id: string
  target_kind: asset|plan|run_request|context
  target_ref: string
  passed: boolean
  checks:
    - check_name: string
      status: passed|failed|warning
      detail: string
      blocking: boolean
  summary:
    passed_count: integer
    failed_count: integer
    warning_count: integer
```

## 8. Trace Contract

```yaml
trace_record:
  trace_id: string
  parent_trace_id: string
  request_id: string
  operation:
    domain: string
    verb: string
    stage: intake|classification|normalization|compilation|validation|registration|planning|execution|evaluation|memory
  cvf_mapping:
    layer: string
    module: string
    w7_record_type: string
  status: started|completed|failed|blocked
  refs:
    related_assets: []
    related_plan: string
    related_run: string
    related_artifacts: []
```

## 9. Artifact Contract

```yaml
artifact_record:
  artifact_id: string
  artifact_type: compiled_spec|run_output|report|trace_bundle|eval_report
  producer_ref: string
  producer_kind: compile|run|trace|eval
  location: string
  checksum: string
  trace_id: string
  created_at: string
```

## 10. Exit Code Contract

```text
0  success
1  generic failure
2  input error
3  schema validation failure
4  dependency failure
5  policy blocked
6  guard blocked
7  authorization failure
8  runtime failure
9  registry failure
10 system failure
```

## 11. Stability Rule

The outer envelope is the stable surface.
The following keys must remain backward-compatible:

- `request_id`
- `command`
- `status`
- `cvf_mapping`
- `governance`
- `result`
- `state_change`
- `trace`
- `timing`

## 12. Final Rule

A W7 CLI contract is valid only if it preserves this chain:

```text
operator input
-> governed request envelope
-> mapped CVF module
-> W7 traceable outcome
```

If a contract cannot express that chain, it is not acceptable for the CVF CLI.
