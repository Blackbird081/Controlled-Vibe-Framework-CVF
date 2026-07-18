# CVF ASSF Production Package Runtime Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

Date: 2026-06-30

docType: reference

Batch ID: ASCP-P1-P3

## Purpose

Define the bounded production runtime contract for the first six CVF ASSF
package skills. This standard upgrades the existing package loader and
use-proof path into a production-scoped package execution surface with
ACTIVE source state, receipt-backed execution, and a CLI/MCP-facing envelope.

## Scope Boundary

In scope:

- promote the six current runtime-eligible package records to `ACTIVE`;
- require ACTIVE source state before production execution;
- require package body read receipt, activation policy receipt, package
  use-proof receipt, and production execution receipt;
- expose a CLI/MCP-facing wrapper for external agents through CVF-controlled
  receipt and source-truth trace fields;
- run focused tests and one live provider proof.

Out of scope:

- converting the remaining 18 package roots;
- granting filesystem, git, browser, public-sync, merge, or production action
  authority from package loading alone;
- full MCP server or daemon behavior;
- production Model Gateway/model router;
- provider registry mutation;
- public export.

## Production Lifecycle Admission

A package may be marked `ACTIVE` for this production surface only when all of
these source fields are present in the registry entry:

| Field | Required value |
|---|---|
| `status` | `ACTIVE` |
| `candidateState` | `ACTIVE` |
| `approvalState` | `APPROVED` |
| `uatState` | `PASSED` |
| `certificationState` | `CERTIFIED` |
| `internalAgentDisposition` | `IMPLEMENTED` |
| `externalCliMcpDisposition` | `IMPLEMENTED` |
| `adapterContract` | this standard |
| `adapterEvidence` | governed completion evidence for ASCP-P1-P3 |

`ACTIVE` source state does not grant action authority. It only allows the
production package executor to request the existing receipt-backed package
use path.

## Runtime Execution Contract

`governance/compat/run_assf_production_package_executor.py` is the internal
production execution adapter.

Required checks:

- load generated ASSF metadata from the generated skill index;
- reject non-`ACTIVE` package source records before package body read;
- reject external consumers unless `externalCliMcpDisposition=IMPLEMENTED`;
- delegate package body read, activation policy, and provider proof to the
  package use-proof adapter;
- emit `CVF_ASSF_PRODUCTION_PACKAGE_EXECUTION_RECEIPT` only after live
  package use proof passes;
- emit source-truth trace fields for registry, package root, truth packet,
  usage receipt, policy receipt, use-proof receipt, and execution receipt.

## CLI/MCP Adapter Contract

`governance/compat/run_assf_production_cli_mcp_adapter.py` is the bounded
CLI/MCP-facing adapter for external agents.

The adapter:

- accepts a package skill id and request id;
- delegates execution to the production executor using consumer
  `EXTERNAL_AGENT_CLI_MCP`;
- returns a JSON envelope containing execution disposition, source-truth trace,
  and receipt ids;
- does not implement a persistent MCP server, daemon, queue, public API, or
  provider router.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| Package lifecycle state includes `ACTIVE` | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Risk And Lifecycle Fields | `ACTIVE` | ASSF package contract | LITERAL_INVARIANT | ACCEPT |
| Runtime loader emits `CVF_ASSF_SKILL_USAGE_RECEIPT` after eligible body read | `governance/compat/run_assf_runtime_package_loader.py` | `_build_skill_usage_receipt` | `CVF_ASSF_SKILL_USAGE_RECEIPT` | runtime package loader | RUNTIME_BEHAVIOR | ACCEPT |
| Activation policy resolver classifies matching receipt use as `USED_WITH_RECEIPT` | `governance/compat/run_assf_activation_policy_resolver.py` | `_state_for` | `USED_WITH_RECEIPT` | activation policy resolver | RUNTIME_BEHAVIOR | ACCEPT |
| Use-proof adapter emits package use-proof receipt after live provider pass | `governance/compat/run_assf_package_use_proof_adapter.py` | `_build_use_proof_receipt`; `build_package_use_proof_packet` | `CVF_ASSF_PACKAGE_USE_PROOF_RECEIPT` | package use-proof adapter | RUNTIME_BEHAVIOR | ACCEPT |
| Production executor requires ACTIVE source before execution | `governance/compat/run_assf_production_package_executor.py` | `_active_source_reasons`; `build_production_package_execution_packet` | `ACTIVE`; `PRODUCTION_PACKAGE_EXECUTION_PASS` | production package executor | RUNTIME_BEHAVIOR | ACCEPT |
| CLI/MCP wrapper delegates to the production executor | `governance/compat/run_assf_production_cli_mcp_adapter.py` | `build_cli_mcp_execution_envelope` | `EXTERNAL_AGENT_CLI_MCP` | production CLI/MCP adapter | RUNTIME_BEHAVIOR | ACCEPT |

## Core Guard Self-Protection Authorization

Authorized guard-maintenance scope: implement ASCP-P1-P3 production package
runtime controls, tests, and checker updates for the first six ACTIVE package
skills.

Protected paths:

- `governance/compat/run_assf_production_package_executor.py`
- `governance/compat/run_assf_production_cli_mcp_adapter.py`
- `governance/compat/test_run_assf_production_package_executor.py`
- `governance/compat/check_assf_certified_metadata_admission.py`
- `governance/compat/test_check_assf_certified_metadata_admission.py`
- `governance/compat/check_skill_truth_packets.py`
- `governance/compat/test_check_skill_truth_packets.py`

Operator authorization: operator requested P1-P3 productionization for the six
existing runtime-eligible package skills.

Rollback boundary: revert ASCP-P1-P3 production runtime changes only; do not
revert ASCP-T1 through ASCP-T5 closures, package roots, source mirrors, or
prior session-sync commits.

## Claim Boundary

This standard authorizes only the bounded ASCP-P1-P3 implementation for six
existing runtime-eligible packages. It does not authorize remaining package
conversion, automatic skill invocation outside CVF receipt paths, provider
router behavior, public-sync, or action authority beyond the active governed
work order.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this standard references private ASSF runtime package and live-provider
proof surfaces. Public-safe export requires separate public-sync authorization.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex implementer/reviewer |
| Provider or surface | local workspace |
| Session or invocation | ASCP-P1-P3 production package runtime, 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | apply_patch; generated ASSF index; tests; live proof |
| Target paths | this standard; production executor; CLI/MCP adapter; checker updates; six registry entries; six truth packets |
| Allowed scope source | operator instruction to do P1-P3 for the six existing runtime-eligible packages |
| Before status evidence | base commit `02e26d49`; 6 runtime-eligible packages; 0 active source records |
| After status evidence | six ACTIVE runtime-eligible packages with production executor and CLI/MCP adapter evidence |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | six-package productionization only |
| Claim boundary | bounded package runtime, not full platform/router/public export |
| Agent type | dispatcher/implementer/reviewer/closer |
| Invocation ID | `ascp-p1-p3-production-package-runtime-2026-06-30` |
| Expected manifest | production standard, executor, CLI/MCP adapter, tests, checker updates, six registry entries, six truth packets, generated indexes, completion review |
| Actual changed set | production standard, executor, CLI/MCP adapter, tests, checker updates, six registry entries, six package sources, six truth packets, generated indexes, baseline, work order, completion review |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename planned |
