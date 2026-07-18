# CVF ASSF Package: Engineering Code Review And Quality Front Door

Memory class: FULL_RECORD

Status: ACTIVE

docType: assf_package_front_door

Batch ID: AGSK-R3; AGSK-R6

skillId: cvf-engineering-code-review-quality

## Purpose

Provide the stable front door for the `cvf-engineering-code-review-quality` ASSF package.

## Scope / Applies-To

| Field | Value |
|---|---|
| Package root | `docs/reference/agent_system_skills/packages/cvf-engineering-code-review-quality/` |
| Canonical package body | `SKILL.md` |
| Source evidence | `skill.source.json` |
| Lifecycle state | ACTIVE |
| Runtime activation | BOUNDED_WITH_REASON: AGSK-R6 permits explicit internal runtime package-loader body read only; it does not activate resolver, CLI/MCP adapter, provider/live proof, public-sync, merge, commit, or production behavior |

## Owner Surface

ASSF package proposal evidence under AGSK-R3 and bounded lifecycle promotion evidence under AGSK-R6. A later ACTIVE resolver or adapter tranche is required before automatic invocation or external exposure.

## Claim Boundary

This front door orients readers to the APPROVED package root. It does not activate, execute, export, publish, merge, commit, call providers, or grant authority beyond explicit internal package-loader body read.
