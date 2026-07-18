# Memory Plane Reference Directory

Memory class: POINTER_RECORD

Status: ACTIVE

docType: reference_index_pointer

Date: 2026-06-22

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This README is a
front-door pointer to the `memory_plane` reference directory. Per the INDEX
classification standard, a GOVERNED_DOC is not labeled with an INDEX type.

## Purpose

This directory contains the CVF Memory Plane external-agent read-side reference
contracts. It is the documentation home for contracts that define how external
agents, CLI tools, or MCP clients may request memory summaries from CVF.

This directory is documentation-only, summary-only, and adapter-contract-only.
It does not implement a CLI/MCP adapter, service route, web route, authenticated
runtime access, durable store, vector DB, graph store, provider call, live proof,
or public-sync mechanism.

## Scope

**Applies to:** CVF Memory Plane external-agent read-side reference contracts
authorized by a GC-018 baseline. Applies to governance reviewers verifying that
MPI-T4 or later proposals stay within the read-side contract boundary.

**Does not apply to:** the current authenticated Memory readout route, the MPI-T2
scan-registry projection helper, the LSC write-side contracts, or any parked
MPI-T4/T5/T6 tranche.

## Active Contracts

| Contract | Path | Status | Purpose |
|---|---|---|---|
| MPI-T3 External Agent Memory Summary Contract | `docs/reference/memory_plane/CVF_MPI_T3_EXTERNAL_AGENT_MEMORY_SUMMARY_CONTRACT.md` | ACTIVE_REFERENCE | Read-side external-agent memory summary IO shape and boundary contract |

## Boundary

- **Documentation-only:** all artifacts in this directory are documentation and
  reference only. None implement runtime behavior.
- **Summary-only:** every summary read result inherits `rawMemoryReleased=false`,
  `canReinject=false`, and no raw `content` from the existing Memory readout
  surface.
- **Adapter-contract-only:** `adapterContractOnly=true` on the active read-side
  contract. No MCP tool, CLI adapter, route, or live adapter is implemented here.
- **No mutation:** no durable write, registry write, route edit, or session/
  handoff edit is authorized by any artifact in this directory.

## Related Surfaces

| Surface | Path | Role |
|---|---|---|
| Memory Plane Map | `docs/reference/CVF_MEMORY_PLANE_MAP.md` | front-door inventory of all Memory Plane surfaces |
| MPI-T2 Scan Registry Projection Contract | `docs/reference/CVF_MPI_T2_SCAN_REGISTRY_EPISODIC_READ_PROJECTION.md` | caller-driven projection helper boundary |
| Memory readout route | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | authenticated runtime route |
| LSC-T6 Write-Side Signal Contract | `docs/reference/learning_signal_chain/CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT.md` | write-side counterpart |

## Claim Boundary

All artifacts in this directory are documentation and reference only. They define
IO shape and boundaries (`adapterContractOnly=true`) without implementing runtime
behavior, adapters, route edits, registry writes, durable writes, provider
calls, or public-sync. The `rawMemoryReleased=false` and `canReinject=false`
invariants inherited from the existing Memory readout surface are not relaxed by
any artifact in this directory.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance Memory Plane reference directory. No public-sync,
public commit, or public catalog claim is authorized.
