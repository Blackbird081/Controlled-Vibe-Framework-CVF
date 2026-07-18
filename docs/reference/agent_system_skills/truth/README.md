# CVF Skill Truth Packet Sources

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-30

docType: reference

Batch ID: SKSOT-T1

## Purpose

This folder holds CVF skill source-of-truth packet records for ASSF package
governance. The canonical packet sources live under `packets/`. The generated
read model lives under `generated/`.

## Canonical Contract

The packet contract is:

`docs/reference/agent_system_skills/CVF_SKILL_SOURCE_OF_TRUTH_PACKET_STANDARD.md`

The checker is:

`governance/compat/check_skill_truth_packets.py`

## Scope Boundary

This folder is a governed truth-record source family. It is not an ACTIVE
resolver, package invocation surface, provider adapter, CLI/MCP adapter, public
artifact, package certification process, or source mirror.

## Source Layout

| Surface | Disposition |
|---|---|
| `packets/*.json` | canonical per-skill truth packet sources |
| `generated/skill-truth-index.json` | generated read model derived from packets |
| ASSF registry entries | canonical lifecycle source for package fields |
| Runtime package loader and audit helpers | measured eligibility evidence only |

## Editing Rule

Edit packet sources first, then reconcile the generated truth index. Run:

```text
python governance/compat/check_skill_truth_packets.py --enforce
```

## Current Disposition

SKSOT-T1 seeds truth packets for the six package roots that the ASSF runtime
eligibility audit reports as runtime eligible. The remaining package roots stay
outside this packet set until their registry lifecycle, UAT, certification, and
internal-agent disposition satisfy the runtime eligibility gate.

## Claim Boundary

These packets record source-of-truth evidence and obligations. They do not
activate skills, load instruction bodies, grant authority, call providers,
mutate external systems, implement adapters, or publish public artifacts.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this truth source family cites private provenance and package evidence.
Public export requires a separate public-sync and redaction tranche.
