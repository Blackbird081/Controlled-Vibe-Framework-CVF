# CVF ASSF Package: Engineering Performance Optimization Front Door

Memory class: FULL_RECORD

Status: ACTIVE

docType: assf_package_front_door

Batch ID: AGSK-R3; ASCP-P4-P6

skillId: cvf-engineering-performance-optimization

## Purpose

Provide the stable front door for the `cvf-engineering-performance-optimization` ASSF package.

## Scope / Applies-To

| Field | Value |
|---|---|
| Package root | `docs/reference/agent_system_skills/packages/cvf-engineering-performance-optimization/` |
| Canonical package body | `SKILL.md` |
| Source evidence | `skill.source.json` |
| Lifecycle state | ACTIVE |
| Runtime activation | BOUNDED_WITH_REASON: ASCP-P4-P6 permits explicit receipt-backed production package execution through CVF adapters only; it does not grant automatic invocation, filesystem, git, browser, provider routing, public-sync, merge, commit, or downstream action authority |

## Owner Surface

ASSF package proposal evidence under AGSK-R3 and production scale-up evidence under ASCP-P4-P6. Automatic invocation, public export, full MCP server behavior, and action authority remain outside this package front door.

## Claim Boundary

This front door orients readers to the ACTIVE package root. It does not execute, export, publish, merge, commit, call providers, or grant authority beyond explicit receipt-backed production package execution under an active governed work order.
