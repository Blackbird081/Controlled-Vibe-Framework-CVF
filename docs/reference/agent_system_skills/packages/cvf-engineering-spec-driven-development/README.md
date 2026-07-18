# CVF ASSF Package: Engineering Spec-Driven Development Front Door

Memory class: FULL_RECORD

Status: ACTIVE

docType: assf_package_front_door

Batch ID: AGSK-R3; AGSK-R7; ASCP-P1-P3

skillId: cvf-engineering-spec-driven-development

## Purpose

Provide the stable front door for the `cvf-engineering-spec-driven-development` ASSF package.

## Scope / Applies-To

| Field | Value |
|---|---|
| Package root | `docs/reference/agent_system_skills/packages/cvf-engineering-spec-driven-development/` |
| Canonical package body | `SKILL.md` |
| Source evidence | `skill.source.json` |
| Lifecycle state | ACTIVE |
| Runtime activation | ACTIVE_PRODUCTION_BOUNDED: ASCP-P1-P3 permits receipt-backed production package execution through the CVF production executor and CLI/MCP wrapper; package loading alone grants no filesystem, git, browser, public-sync, commit, merge, or production action authority |

## Owner Surface

ASSF package proposal evidence under AGSK-R3, bounded lifecycle promotion evidence under AGSK-R7, and ASCP-P1-P3 production runtime evidence. Automatic invocation, public export, and action authority remain outside this package front door.

## Claim Boundary

This front door orients readers to the ACTIVE package root for receipt-backed CVF production package execution. It does not grant filesystem, git, browser, public-sync, commit, merge, provider router, or production action authority beyond the active governed work order.
