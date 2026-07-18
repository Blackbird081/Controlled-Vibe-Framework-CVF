# CVF ASSF Production Package Scale-Up Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

Date: 2026-06-30

docType: reference

Batch ID: ASCP-P4-P6

## Purpose

Define the bounded scale-up contract for promoting the remaining eighteen CVF
ASSF package roots into production-scoped runtime package skills after SCPL-T2
selection guidance and the ASCP-P1-P3 six-package production baseline.

## Scope Boundary

In scope:

- promote the eighteen remaining package roots from `PROPOSED` to `ACTIVE`;
- require UAT, certification, internal disposition, truth packets, generated
  truth index entries, and adapter evidence for every promoted package;
- reuse the existing production package executor and CLI/MCP envelope;
- require dry-run proof for every newly promoted package;
- require representative live provider proof for at least one newly promoted
  package before claiming batch closure.

Out of scope:

- rewriting package bodies or importing upstream code as runtime authority;
- full MCP server, daemon, queue, hook, or IDE bridge behavior;
- production Model Gateway/model router;
- provider registry mutation;
- public-sync or public catalog export;
- granting filesystem, git, browser, commit, merge, provider routing, or
  downstream action authority from package loading alone.

## Production Scale-Up Admission

Each promoted package must have these source fields in the ASSF registry entry
and matching package source record:

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
| `adapterEvidence` | ASCP-P4-P6 completion review |

`ACTIVE` source state is a prerequisite for receipt-backed package execution.
It is not permission to invoke a package automatically or to perform any
external action.

## Proof Contract

ASCP-P4-P6 must prove the batch through:

- generated ASSF skill index drift check;
- generated truth index drift check;
- certified metadata admission check;
- package productionization pipeline check;
- Skill Control Plane inventory check;
- runtime eligibility audit showing 24 runtime-eligible package roots;
- dry-run production executor or CLI/MCP envelope for all 18 newly promoted
  packages;
- one representative live provider proof on a newly promoted package, with
  secret-safe diagnostic fields and receipt ids.

## Package Skill Productionization Control Block

- SOP source: `docs/reference/agent_system_skills/CVF_PACKAGE_SKILL_PRODUCTIONIZATION_SOP.md`
- Current phase: P11 scale-up operation for remaining package roots
- Target lifecycle state: `ACTIVE_PRODUCTION_RUNTIME`
- Prior phase evidence: SCPL-T2 material commit `25361957`; ASCP-P1-P3 material commit `43e4092f`
- Next forbidden skip: no package may become ACTIVE without truth packet, generated index evidence, adapter evidence, dry-run proof, and representative live proof for the batch
- Runtime/provider proof: required for representative newly promoted package before closure
- Claim boundary: bounded package production scale-up only

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| Existing production executor requires ACTIVE source before execution | `governance/compat/run_assf_production_package_executor.py` | source | `_active_source_reasons`; `build_production_package_execution_packet` | production package executor | RUNTIME_BEHAVIOR | ACCEPT |
| Existing CLI/MCP envelope delegates to production executor | `governance/compat/run_assf_production_cli_mcp_adapter.py` | source | `build_cli_mcp_execution_envelope` | production CLI/MCP adapter | RUNTIME_BEHAVIOR | ACCEPT |
| Truth packet checker validates generated truth index and registry snapshot | `governance/compat/check_skill_truth_packets.py` | source | `_expected_index`; `_validate_packet` | skill truth packet checker | RUNTIME_BEHAVIOR | ACCEPT |
| Package pipeline checker requires truth packets for ACTIVE packages | `governance/compat/check_package_skill_productionization_pipeline.py` | source | `_check_active`; `_truth_packet_status` | package productionization pipeline checker | RUNTIME_BEHAVIOR | ACCEPT |
| Skill Control Plane inventory projects runtime and selection readiness | `governance/compat/generate_skill_control_plane_inventory.py` | source | `build_inventory` | Skill Control Plane generator | RUNTIME_BEHAVIOR | ACCEPT |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | production package executor | may request receipt-backed package execution for ACTIVE packages | production execution receipts | no action authority from loading | `IMPLEMENTED_FOR_24_PACKAGES` |
| `EXTERNAL_AGENT_CLI_MCP` | production CLI/MCP envelope | may consume receipt and sourceTruthTrace fields | CLI/MCP envelope receipts | no full MCP server or daemon | `IMPLEMENTED_FOR_24_PACKAGES` |
| `INTERNAL_AGENT` | package body selection | must use explicit package id and governed work-order authority | loader and production receipts | no automatic invocation telemetry outside bounded loader | `RECEIPT_BACKED_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | public or hosted interface | not authorized by this standard | N/A with reason: no public surface created | no public API | `DEFERRED_WITH_REASON` |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this standard references private ASSF package runtime, truth packets,
source mirrors, and live-provider proof receipts. Public-safe export requires a
separate public-sync authorization.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex dispatcher/implementer/reviewer/closer |
| Provider or surface | local workspace plus representative Alibaba DashScope-compatible live model proof |
| Session or invocation | ASCP-P4-P6 remaining package production scale-up, 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | source reads, mechanical JSON rewrite, generated indexes, dry-run smoke, live provider proof, governance gates |
| Target paths | this standard; eighteen registry entries; eighteen package roots; eighteen truth packets; generated indexes; baseline, work order, completion review |
| Allowed scope source | operator instruction to continue with production scale-up for the remaining eighteen package skills |
| Before status evidence | SCPL-T2 inventory reports 24 package roots, 6 runtime-eligible packages, 18 blocked package roots |
| After status evidence | expected 24 runtime-eligible package roots and 24 activation-ready packages after generated index refresh |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | remaining eighteen package production scale-up only |
| Claim boundary | bounded package runtime, not full platform/router/public export |
| Agent type | dispatcher/implementer/reviewer/closer |
| Invocation ID | `ascp-p4-p6-remaining-package-production-scale-up-2026-06-30` |
| Expected manifest | scale-up standard, baseline, work order, completion review, eighteen registry entries, eighteen package sources and READMEs, eighteen truth packets, generated indexes and inventory |
| Actual changed set | scale-up standard, baseline, work order, completion review, eighteen registry entries, eighteen package sources and READMEs, eighteen truth packets, generated indexes and inventory |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename planned |

## Claim Boundary

This standard authorizes only the ASCP-P4-P6 bounded scale-up of the remaining
eighteen CVF-owned package roots into receipt-backed production package
runtime. It does not implement a full MCP server, production Model Gateway/model
router, provider registry mutation, public-sync, automatic invocation, or
action authority from package loading alone.
