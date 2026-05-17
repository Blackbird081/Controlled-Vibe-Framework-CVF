# CVF W7 CLI Workspace And State

> **Document Type:** DEFERRED BY DESIGN
> **Status:** W71-T1 posture finalized 2026-04-13; explicitly deferred — heavier structural runtime review required; CLI not yet built; intentionally deferred until a future CLI-build wave receives GC-018 authorization
> **Review Class:** medium_or_heavy_edit_required before final canon adoption — still outstanding
> **Scope:** Workspace layout, local state model, run state, cache, and persistence behavior for the CVF W7 CLI
> **Scope Boundary:** This document is part of the W7/CLI intake path only. It does not apply to the separate PVV Alibaba provider/API-key workstream.

## 1. Purpose

This document captures the current design draft for CLI workspace and local state behavior.

It is promoted into `docs/reference` so future review happens against a shared draft inside CVF core, not against private-reference copies.

It is not final canon yet because the proposed local `.cvf/` layout is a structural commitment that still requires compatibility review.

## 2. Design Intent

Workspace and local state exist to support governed CVF operations, not to create a parallel system.

The operator-local persistence layer must be able to retain:

- inputs
- intermediate bundles
- compiled specs
- run state
- trace references
- artifacts
- validation reports

## 3. Workspace Principles

### 3.1 Single-root Rule

Every CLI session must resolve to one effective workspace root.

### 3.2 No Hidden Write Rule

Every mutating command must write only to declared workspace paths.

### 3.3 Trace-linked Storage

Every significant stored object must link to at least one of:

- request id
- bundle id
- compile batch id
- plan id
- run id
- trace id

## 4. Current Draft Layout

```text
.cvf/
  config/
  state/
    requests/
    bundles/
    normalized/
    compile_batches/
    plans/
    runs/
    locks/
  registry_cache/
  traces/
    roots/
    indexes/
  artifacts/
    compile/
    run/
    reports/
  eval/
  logs/
```

## 5. Current Draft State Objects

### 5.1 Request State

```yaml
request_state:
  request_id: string
  command_name: string
  created_at: string
  input_ref: string
  trace_id: string
```

### 5.2 Bundle State

```yaml
bundle_state:
  bundle_id: string
  source_ref: string
  source_type: string
  manifest_path: string
  created_at: string
  trace_id: string
```

### 5.3 Compile Batch State

```yaml
compile_batch_state:
  batch_id: string
  source_bundle_id: string
  asset_refs: []
  validation_status: pending|passed|failed
  registration_status: unregistered|registered|partial|rejected
  trace_id: string
```

### 5.4 Plan State

```yaml
plan_state:
  plan_id: string
  planner_asset_id: string
  step_count: integer
  validation_status: pending|passed|failed
  trace_id: string
```

### 5.5 Run State

```yaml
run_state:
  run_id: string
  plan_id: string
  status: queued|running|paused|completed|failed|cancelled|blocked
  current_step: string
  last_checkpoint: string
  artifact_refs: []
  trace_id: string
```

## 6. Locking And Resume Requirements

The CLI must prevent unsafe concurrent mutations.

Lock classes:

- bundle lock
- compile batch lock
- plan lock
- run lock
- registry mutation lock

Resume support is needed only for:

- compile batches interrupted after spec generation but before registration
- runs interrupted after a checkpointable step

## 7. Cache Rules

Allowed:

- registry read cache
- schema cache
- plan metadata cache

Forbidden:

- serving stale authorization as valid
- bypassing policy evaluation because a previous result exists
- silently substituting cached assets for requested versions

## 8. Artifact Separation

Artifacts must be separated by producer class:

- compile artifacts
- run artifacts
- report artifacts

Each artifact must remain trace-linked.

## 9. Promotion Constraints

Before this document can become stable canon, review must explicitly confirm:

1. the `.cvf/` layout does not conflict with current repo conventions
2. the layout is compatible with existing scripts, tools, and `.gitignore`
3. the workspace model does not create an undeclared parallel state system
4. retention, pruning, and lock recovery rules are acceptable for long-term CVF operation

## 10. Current Adoption Rule

Use this document as a governed draft only.

It may guide implementation planning, but final workspace canon is still pending the heavier review required by Round 3 rebuttal.
