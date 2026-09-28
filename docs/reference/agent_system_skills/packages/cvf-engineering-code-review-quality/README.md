# CVF ASSF Package: Engineering Code Review And Quality Front Door

Memory class: FULL_RECORD

Status: ACTIVE

docType: assf_package_front_door

Batch ID: AGSK-R3; AGSK-R6; ASCP-P1-P3

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
| Runtime activation | ACTIVE_WITH_BOUNDARY: AGSK-R6 historically admitted explicit internal package-loader body read; ASCP-P1-P3 later admitted this package to the receipt-backed production executor and bounded CLI/MCP envelope. No automatic selection, code-review-specific live proof, merge, commit, public-sync, or general production readiness follows. |

## Owner Surface

ASSF package proposal evidence under AGSK-R3, bounded lifecycle promotion evidence under AGSK-R6, and ASCP-P1-P3 ACTIVE production package evidence. The implemented bounded CLI/MCP envelope is distinct from host installation or automatic invocation.

## Claim Boundary

This front door orients readers to the ACTIVE package root and its receipt-backed executor/CLI-MCP path. Reading this README does not select or execute the skill, export, publish, merge, commit, call providers, or grant action authority. The ASCP-P1-P3 live exemplar used a different skill ID.
