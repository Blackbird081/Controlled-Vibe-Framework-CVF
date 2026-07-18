# CVF Model Gateway Reference Front Door

Status: ACTIVE_REFERENCE_FRONT_DOOR

Memory class: POINTER_RECORD

Last updated: 2026-06-18

## Purpose

This folder stores stable Model Gateway reference surfaces used before bounded
runtime or provider live tests. It is not provider-local memory and is not a
runtime registry by itself.

## Scope / Applies-To

Applies to bounded Model Gateway reference lookup before Alibaba/DashScope
free-quota live tests.

Does not apply to provider selection for production, public claims, registry
mutation, or provider quality/ranking decisions.

## Scope / Target / Owner Boundary

Target: stable navigation for Model Gateway provider-test reference artifacts.

Owner boundary: this folder stores reference and pre-test lookup material only.
Runtime source, provider capability registries, governed work orders, live-run
receipts, and closure reviews remain in their existing owner paths.

## Current References

| Reference | Use |
|---|---|
| `CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.md` | Human-readable Alibaba free-quota model codes, expiration dates, and use-before-live-test rule. |
| `CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.json` | Machine-readable mirror for future guards or scripts. |
| `../mcp_gateway/CVF_MODEL_GATEWAY_MCP_RUNTIME_BRIDGE_BOUNDARY.md` | Boundary contract for any future MCP tool that intends to call Model Gateway runtime surfaces. |

## Required Use

Before interpreting an Alibaba/DashScope live-test failure, check the ledger for
the model code and expiration date. If the model is absent or expired, do not
classify the failure as a Model Gateway runtime defect without a fresh model
selection or quota refresh.

## Claim Boundary

This front door claims only that the listed files are the current stable lookup
surfaces in this folder. It does not verify live provider availability,
free-quota freshness, provider quality, production readiness, public readiness,
or Model Gateway runtime correctness.
