# CVF W7 CLI Command Surface

> **Document Type:** DEFERRED BY DESIGN
> **Status:** W71-T1 posture finalized 2026-04-13; CLI runtime not yet built; no CPF/LPF/cvf-web implementation evidence; intentionally deferred until a future CLI-build wave receives GC-018 authorization
> **Source Quality:** internal_design_draft
> **Scope:** operator-visible command surface for the W7 CLI MVP and near-term expansion
> **Scope Boundary:** This command surface belongs only to the W7/CLI intake and governed execution path. It is unrelated to the Alibaba provider PVV workstream.

## 1. Purpose

This document defines the narrow, governance-safe command surface for the CVF W7 CLI.

It does not create new architecture.
It maps operator commands onto already approved CVF modules and W7 paths.

## 2. Command Shape

All commands follow:

```text
cvf <domain> <verb> [flags]
```

Every mutating command must support:

- `--output json|table`
- `--dry-run`

## 3. Command Domains

### 3.1 `context`

Purpose:

- inspect governed context inputs
- build context packages for compile, plan, or run paths

Core commands:

- `cvf context inspect`
- `cvf context build`

### 3.2 `policy`

Purpose:

- inspect policy/guard bindings
- evaluate whether an operation is allowed, blocked, or conditional

Core commands:

- `cvf policy inspect`
- `cvf policy eval`

### 3.3 `asset`

Purpose:

- ingest external material
- classify and normalize it
- compile it into W7 assets
- validate and register it

Core commands:

- `cvf asset ingest`
- `cvf asset classify`
- `cvf asset normalize`
- `cvf asset compile`
- `cvf asset validate`
- `cvf asset register`
- `cvf asset show`
- `cvf asset list`

Deferred commands:

- `cvf asset diff`
- `cvf asset remove`

### 3.4 `plan`

Purpose:

- build governed plans from registered assets
- inspect dependency and authorization expectations

Core commands:

- `cvf plan build`
- `cvf plan inspect`
- `cvf plan validate`

### 3.5 `run`

Purpose:

- execute authorized runtime flows
- inspect live or completed run state

Core commands:

- `cvf run exec`
- `cvf run status`

Deferred commands:

- `cvf run cancel`
- `cvf run resume`

### 3.6 `trace`

Purpose:

- inspect traces, artifacts, eval, and related outputs

Core commands:

- `cvf trace show`
- `cvf trace artifact`

Near-term extension:

- `cvf trace eval`
- `cvf trace memory`

### 3.7 `system`

Purpose:

- inspect environment, version, and effective config

Core commands:

- `cvf system doctor`
- `cvf system version`
- `cvf system config show`

## 4. MVP Command Set

The MVP command set is:

```text
cvf system doctor
cvf asset ingest
cvf asset classify
cvf asset normalize
cvf asset compile
cvf asset validate
cvf asset register
cvf asset show
cvf plan build
cvf plan inspect
cvf run exec
cvf run status
cvf trace show
```

## 5. Non-Goals

The command surface must not:

- expose raw skill execution as a primary user path
- expose policy authoring/editing through CLI MVP
- create direct memory mutation commands
- become a general-purpose shell before the governed intake path is closed

## 6. Final Rule

Every command on this surface must preserve:

```text
command
-> mapped CVF module
-> required governance checks
-> W7 record emission
-> traceable outcome
```

If a command cannot preserve that chain, it should not exist.
