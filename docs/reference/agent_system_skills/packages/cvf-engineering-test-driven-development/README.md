# CVF ASSF Package: Engineering Test-Driven Development Front Door

Memory class: FULL_RECORD

Status: ACTIVE

docType: assf_package_front_door

Batch ID: AGSK-R3; AGSK-R7; ASCP-P1-P3

skillId: cvf-engineering-test-driven-development

## Purpose

Provide the stable front door for the `cvf-engineering-test-driven-development` ASSF package.

## Scope / Applies-To

| Field | Value |
|---|---|
| Package root | `docs/reference/agent_system_skills/packages/cvf-engineering-test-driven-development/` |
| Canonical package body | `SKILL.md` |
| Source evidence | `skill.source.json` |
| Lifecycle state | ACTIVE |
| Runtime activation | ACTIVE_WITH_BOUNDARY: AGSK-R7 historically admitted explicit internal package-loader body read; ASCP-P1-P3 later admitted this package to the receipt-backed production executor and bounded CLI/MCP envelope. No automatic selection, TDD-specific live proof, test execution authority, commit, public-sync, or general production readiness follows. |

## Owner Surface

ASSF package proposal evidence under AGSK-R3, bounded lifecycle promotion evidence under AGSK-R7, and ASCP-P1-P3 ACTIVE production package evidence. Automatic invocation, public export, and action authority remain outside this package front door.

## Claim Boundary

This front door orients readers to the ACTIVE package root and its receipt-backed executor/CLI-MCP path. Reading this README does not select or execute the skill, export, publish, run tests, commit, call providers, or grant action authority. The ASCP-P1-P3 live exemplar used a different skill ID.
