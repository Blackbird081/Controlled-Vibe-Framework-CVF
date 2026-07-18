# CVF Agent System Skills Reference

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-23

docType: reference

## Purpose

This folder is the canonical reference family for CVF agent system-skill
package architecture.

The current active contract is:

- `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md`

## Scope Boundary

This README is a stable front door required by the foundation storage layout
guard. It is not a skill package, resolver, generated index, activation
profile, CLI/MCP adapter, runtime implementation, provider integration, or
public artifact.

## Current Disposition

| Surface | Disposition |
|---|---|
| Internal agent package contract | `CONTRACT_ONLY` |
| External CLI/MCP package projection | `DEFERRED_WITH_REASON` |
| Package instances | N/A with reason: not created by ASSF-T1 |
| Generated index | N/A with reason: not created by ASSF-T1 |
| Runtime/provider/live behavior | N/A with reason: not in ASSF-T1 scope |

## Claim Boundary

This README is only the front door for the `docs/reference/agent_system_skills/`
reference family. It does not create, activate, register, load, publish, or
export any skill package.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this reference family currently depends on private ASSF legacy
absorption evidence. Public-safe skill architecture export requires separate
redaction and public-sync authorization.
