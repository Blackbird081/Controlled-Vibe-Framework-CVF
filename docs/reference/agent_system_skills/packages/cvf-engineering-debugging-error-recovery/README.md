# CVF ASSF Package: Engineering Debugging And Error Recovery Front Door

Memory class: FULL_RECORD

Status: ACTIVE

docType: assf_package_front_door

Batch ID: AGSK-R3; AGSK-R7; ASCP-P1-P3

skillId: cvf-engineering-debugging-error-recovery

## Purpose

Provide the stable front door for the `cvf-engineering-debugging-error-recovery` ASSF package.

## Scope / Applies-To

| Field | Value |
|---|---|
| Package root | `docs/reference/agent_system_skills/packages/cvf-engineering-debugging-error-recovery/` |
| Canonical package body | `SKILL.md` |
| Source evidence | `skill.source.json` |
| Lifecycle state | ACTIVE |
| Runtime activation | BOUNDED_WITH_REASON: AGSK-R7 permits explicit internal runtime package-loader body read only; it does not activate resolver, CLI/MCP adapter, provider/live proof, public-sync, repair execution authority, commit, or production behavior |

## Owner Surface

ASSF package proposal evidence under AGSK-R3, bounded lifecycle promotion evidence under AGSK-R7, and ASCP-P1-P3 production runtime evidence. Automatic invocation, public export, and action authority remain outside this package front door.

## Claim Boundary

This front door orients readers to the APPROVED package root. It does not activate, execute, export, publish, apply repairs, commit, call providers, or grant authority beyond explicit internal package-loader body read.
