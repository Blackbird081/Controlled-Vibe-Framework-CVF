# CVF Provider Routing Policy — QBS-1 Benchmark Reference

Memory class: FULL_RECORD

Status: CURRENT PUBLIC PROVIDER ROUTING POLICY

```text
Document class: GOVERNANCE_POLICY
Track: EA Track D — Phase D.1 Provider Policy Engine
Authorization: GC-018 continuation candidate (docs/reviews/CVF_GC018_TRACK_D_PROVIDER_POLICY_ENGINE_2026-05-13.md)
Date: 2026-05-13
```

## Scope

Public provider routing policy that governs `resolveProviderPolicy` for the
CVF Agent Platform. This file is the authoritative reference for benchmark
runs that route provider selection through CVF.

## Target

`resolveProviderPolicy` in `src/lib/provider-policy-engine.ts` and any
benchmark or scored run that depends on CVF provider selection.

## Methodology

Policy assigns a preference tier per (provider, model) pair, applies
selection in order of tier, and falls back to a documented backup tier when
the primary tier is unavailable.

## Findings

The current policy passes EA Track D Phase D.1 acceptance criteria and is
referenced by QBS-1 scored-run readiness for provider routing identity.

## Decision

Treated as the authoritative public provider routing policy reference.
Updates require a new dated revision under EA Track D and a corresponding
public commit.

## Purpose

This document defines the provider routing policy that governs how the CVF
Agent Platform selects an AI provider for each request. It is the authoritative
reference for the `resolveProviderPolicy` function in
`src/lib/provider-policy-engine.ts`.

---

## Risk Tier → Provider Override Table

| Risk tier | User preference | Resolved provider | `riskTierOverride` |
| --- | --- | --- | --- |
| R0 (safe) | respected | requested if configured; else preference-ranked | `false` |
| R1 (low) | respected | requested if configured; else preference-ranked | `false` |
| R2 (medium) | **ignored** | requested if eligible; else first eligible | `true` |
| R3 (high) | **ignored** | requested if eligible; else first eligible | `true` |

**Eligibility** is determined by `ProviderDefinition.maxRiskLevel`. A provider
is eligible for a request at risk tier `Rx` only if `Rx ≤ provider.maxRiskLevel`.

---

## Provider Eligibility by Risk Tier

| Provider | `maxRiskLevel` | Eligible at R0 | Eligible at R1 | Eligible at R2 | Eligible at R3 |
| --- | --- | --- | --- | --- | --- |
| alibaba | R1 | yes | yes | no | no |
| deepseek | R1 | yes | yes | no | no |
| openrouter | R1 | yes | yes | no | no |
| openai | R2 | yes | yes | yes | no |
| gemini | R2 | yes | yes | yes | no |
| claude | R2 | yes | yes | yes | no |

No provider currently has `maxRiskLevel: R3`. R3 requests with no eligible
providers fall through to the routing layer (DENY path).

---

## Preference Tier Resolution (R0/R1 only)

| Preference (`ProviderPreference`) | Selection rule |
| --- | --- |
| `auto` | Use requested provider if in eligible list; else first eligible |
| `fast` | Sort eligible by cost tier (free < standard < premium), then by capability (lower = faster/cheaper) |
| `accurate` | Sort eligible by capability (higher = more capable); pick highest |

Cost tier and capability order are defined in `provider-policy-engine.ts`:

- **Cost order:** `free` (0) < `standard` (1) < `premium` (2)
- **Capability order:** alibaba (0) < deepseek (1) < openrouter (2) < openai/gemini (3) < claude (4)

---

## Failover Behaviour

Failover is active **only** when `riskTierOverride === false` (R0/R1 requests).

If the primary provider call fails (network or API error):
1. If `riskTierOverride === true` (R2/R3): throw immediately — no failover.
2. If `fallbackChain` is empty: throw immediately.
3. Otherwise: retry once with `fallbackChain[0]`.

`executeWithFailover` in `src/lib/provider-policy-engine.ts` implements this
contract. The `failoverUsed` flag in the response indicates whether failover
was activated.

---

## Governance Receipt Extension

The `routingDetail` sub-field of `routingDecision` in `GovernanceEvidenceReceipt`
is extended by Track D to include:

```json
{
  "routingDecision": "ALLOW",
  "routingDetail": {
    "requestedPreference": "fast",
    "resolvedProvider": "alibaba",
    "riskTierOverride": false,
    "failoverUsed": false,
    "fallbackChain": ["deepseek", "openai"]
  }
}
```

---

## Boundary

- Provider Policy Engine activates **only after** `enforcement.status === 'ALLOW'`.
- Does **not** change BLOCK/CLARIFY/NEEDS_APPROVAL logic.
- Does **not** expose provider names in noncoder-facing UI (preference tiers only).
- Phase D.2 (review-chain topology) is **not** in scope of this document.
- Provider name changes require updating `CAPABILITY_ORDER` and
  `WEB_PROVIDER_DEFINITIONS` in `provider-router-adapter.ts`.

## Rule

Provider selection runs after `enforcement.status === 'ALLOW'`, scans the
preference-tier table in declared order, picks the first available tier,
and records the selected provider/model in the request receipt.

## Requirements

- preference-tier order is declared in code and reflected in this document
- provider names stay out of noncoder-facing UI
- selection is logged in the audit receipt for every governed request

## Exceptions

No public override path. Provider name changes require updating
`CAPABILITY_ORDER` and `WEB_PROVIDER_DEFINITIONS` in
`provider-router-adapter.ts` and a new revision of this file.

## Enforcement Surface

- `resolveProviderPolicy` in `src/lib/provider-policy-engine.ts`
- `provider-router-adapter.ts` capability ordering
- audit receipt fields recording the selected provider/model

## Related Artifacts

- `runner-contract.md`
- `../quality-benchmark-suite-methodology.md`
- `../../evidence/provider-lanes.md`
- `../../reviews/CVF_GC018_TRACK_D_PROVIDER_POLICY_ENGINE_2026-05-13.md`

## Final Clause

This policy claims only the preference-tier routing rule, the declared
fallback behavior, and the audit-receipt requirement. It does not claim
provider parity, does not authorize hidden provider substitution, and does
not extend Phase D.1 into review-chain topology (Phase D.2).
