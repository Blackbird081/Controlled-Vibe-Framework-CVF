# CVF Model Gateway Proxy Provider Boundary Spec - 2026-05-16

Memory class: POINTER_RECORD

Document type: CANONICAL-CANDIDATE - CVF MODEL GATEWAY BOUNDARY

Source lineage: normalized from CVF 16.5 `free Claude Code` and `freellmapi`
drafts. Source material is reference-only; CVF remains authority.

## Purpose

This document records the reusable provider/proxy/gateway lessons from the CVF
16.5 legacy bundle.

The accepted value is protocol translation and provider routing discipline. The
rejected value is any bypass, free-provider, or hidden proxy claim.

## Source Destination Map

This spec is a delta/boundary document for the existing official Model Gateway
surface:

- existing CVF owner: `EXTENSIONS/CVF_MODEL_GATEWAY/README.md`
- source-declared FreeLLMAPI destination:
  `EXTENSIONS/CVF_MODEL_GATEWAY/src/` plus
  `EXTENSIONS/CVF_MODEL_GATEWAY/docs/FREELLMAPI_MAPPING.md`
- source-declared free-claude-code destination:
  `EXTENSIONS/CVF_MODEL_GATEWAY/free_claude_code_mapping/`
- disposition: adopt as future Model Gateway deltas only after a fresh GC-018;
  do not create a second provider gateway.

## Priority Adoption Candidates

The `freellmapi` source folder contains TypeScript artifacts, not just prose.
For any future Model Gateway runtime roadmap, these files should be reviewed as
priority adoption candidates before writing new equivalents:

- `.private_reference/legacy/CVF 16.5/freellmapi/provider.registry.ts`
- `.private_reference/legacy/CVF 16.5/freellmapi/provider.health.ts`
- `.private_reference/legacy/CVF 16.5/freellmapi/quota.ledger.ts`
- `.private_reference/legacy/CVF 16.5/freellmapi/routing.policy.ts`
- `.private_reference/legacy/CVF 16.5/freellmapi/fallback.policy.ts`
- `.private_reference/legacy/CVF 16.5/freellmapi/sticky.session.ts`
- `.private_reference/legacy/CVF 16.5/freellmapi/credential.vault.ts`
- `.private_reference/legacy/CVF 16.5/freellmapi/gateway.receipt.ts`

Until a future roadmap supersedes them, these files are the source
type-of-record for the legacy gateway shapes. CVF may add governance fields on
top, but should not silently diverge from their identifiers, quota, and health
decision fields.

## Core Rule

A proxy is not trusted because it is local. A provider is not trusted because it
is OpenAI-compatible. Both are trusted only when CVF governs them.

The allowed route is:

```text
client request
-> CVF Guard / policy decision
-> Model Gateway route decision
-> protocol translator
-> provider adapter
-> output validation
-> gateway audit receipt
-> governed response
```

## Proxy Security Boundary

Default denies:

- remote bind such as `0.0.0.0`, public IP, unapproved LAN IP, reverse tunnel,
  or public tunnel;
- unknown clients;
- raw prompt, tool-argument, file-path, source-code, terminal, stack-trace, or
  environment logging;
- direct tool execution by the proxy;
- key exposure to clients;
- third-party proxy endpoints as trusted defaults;
- hidden model substitution.

Allowed default log shape:

```json
{
  "trace_id": "",
  "provider_id": "",
  "model_id": "",
  "risk_class": "",
  "policy_result": "",
  "status": "",
  "latency_ms": 0,
  "token_usage": {}
}
```

## Provider Protocol Translator

The translator may convert protocols. It must not evaluate policy, choose a
provider, execute tools, mutate governance metadata, retry denied requests, or
fabricate usage/provider identity.

Initial supported direction:

```text
Anthropic Messages-style request
-> CVF normalized request
-> OpenAI-compatible provider request
-> provider response
-> CVF normalized response
-> client-compatible response
```

Unsupported fields must be explicit:

- `unsupported_but_safe_to_drop`
- `unsupported_requires_policy_review`
- `unsupported_blocked`
- `unsupported_needs_fallback_provider`

## Provider Routing Requirements

Provider routing should consider:

- registered provider and model;
- enabled/disabled state;
- health state;
- quota and rate-limit ledger;
- risk class;
- data classification;
- operator/workspace policy;
- cost posture;
- fallback allowance.

Fallback is allowed only when bounded by policy and receipt. It must not become
retry churn or hidden model substitution.

## Credential Boundary

Provider keys must stay server-side and must never be:

- hardcoded;
- committed;
- logged;
- returned to clients;
- stored in browser local storage;
- copied across workspaces without policy.

Allowed loading sources, in preference order:

1. secure local secret store;
2. operator-approved environment variable;
3. encrypted config file;
4. manual runtime injection.

## Gateway Receipt Shape

Every provider call should produce a safe receipt:

```yaml
gateway_receipt:
  receipt_id: string
  trace_id: string
  client_id: string
  provider_id: string
  requested_model: string
  actual_model: string
  route_reason: string
  fallback_used: boolean
  quota_allowed: boolean
  health_state: string
  substitution_reason: string|null
  risk_class: string
  data_classification: string
  policy_result: allow|deny|requires_approval
  estimated_tokens: number
  actual_tokens: number|null
  latency_ms: number
  validation_result: pass|fail|not_required
  final_status: success|blocked|error
  created_at: string
  metadata: {}
```

## Forbidden Claims

CVF documentation must not claim:

- free Claude Code;
- subscription bypass;
- unlimited provider access;
- free-tier production reliability;
- safe-for-secrets proxying by default;
- hidden provider substitution;
- no-risk protocol translation.

Allowed positioning:

- governed provider adapter;
- controlled model gateway;
- protocol translation layer;
- policy-aware provider routing;
- audit-ready proxy boundary.

## Runtime Boundary

This document is not an implementation. Any future translator, proxy, health
monitor, quota ledger, fallback engine, or credential vault requires a fresh
roadmap, tests, and live-governance proof when behavior claims are made.
