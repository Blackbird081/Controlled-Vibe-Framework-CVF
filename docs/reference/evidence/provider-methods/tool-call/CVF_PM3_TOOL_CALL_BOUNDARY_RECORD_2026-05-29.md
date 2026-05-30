# PM-3 Tool Call Boundary Record

Memory class: FULL_RECORD

Status: EVIDENCE

docType: evidence

Date: 2026-05-29

---

## Purpose

Source-verified boundary record for `tool_call` method. Documents that
`tool_call` is declared in the provider method contract type but no current
provider/model includes it in `supportedMethods`. PM-3 is a documentation-only
boundary record — no live proof is possible against a non-existent capability.

Closes CVF 25.05 Gap 3 for the `tool_call` method.

## Source Verification

| Claimed item | Source file | Line | Verified path | Disposition |
| --- | --- | --- | --- | --- |
| `tool_call` method name | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-contract.ts` | 7 | `"tool_call"` in `ProviderMethodName` | ACCEPT — method is defined in the contract type |
| No provider supports tool_call | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts` | full file | `supportedMethods` arrays | ACCEPT — no entry includes `tool_call` |

## Provider Capability Scan

| Provider | Model | supportedMethods | tool_call present? |
| --- | --- | --- | --- |
| DeepSeek | deepseek-chat | complete, chat, json_mode | NO |
| OpenAI | gpt-4o | complete, chat, json_mode, vision | NO |
| Alibaba | qwen-turbo | complete, chat, stream | NO |
| Gemini | gemini-pro | chat, vision | NO |
| Claude | claude-sonnet | chat, code | NO |

Source: `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts` lines 55–100.

## Unlock Condition

`tool_call` live proof becomes available when at least one provider/model adds
`tool_call` to its `supportedMethods` array in the capability registry. At that
point, a fresh GC-018 and evidence packet can be created.

## Boundary

- No live proof claim — no provider currently supports `tool_call`
- No new provider adapter required at this time
- No receipt envelope change
- PM-3 is informational boundary documentation only

## Receipt

- **Method:** tool_call
- **Status:** `source_verified_absent` — declared in contract type, not in any provider capability
- **Next step:** Unlock when a provider adds tool_call support
- **rawSecretPrinted:** false

## Scope / Target / Owner Boundary

Owner: CVF public evidence surface. Target: bounded evidence record exported in
the 2026-05-30 public-sync capability batch.

## Source

Source is the public-safe artifact set listed in
`docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`.

## Decision

Retain this record as bounded public evidence. It does not promote the related
capability to hosted, production, or universal provider readiness.

## Evidence / Verification

Public verification is limited to this evidence record and the matching exported
source/test paths listed in the public-sync evidence summary.

## Claim Boundary

No broad runtime, provider parity, hosted readiness, production readiness, or
cost-optimization claim is made from this evidence record alone.
