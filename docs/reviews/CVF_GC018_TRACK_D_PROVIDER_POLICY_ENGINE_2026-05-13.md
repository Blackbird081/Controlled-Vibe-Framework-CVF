# GC-018 Continuation Candidate — EA Track D: Multi-provider Policy Engine

```text
GC-018 Continuation Candidate
- Candidate ID: GC018-EA-TRACK-D-2026-05-13
- Date: 2026-05-13
- Parent roadmap / wave: docs/roadmaps/CVF_EA_ENHANCEMENT_ROADMAP_2026-05-12.md
- Proposed scope: Add a Provider Policy Engine layer to /api/execute that resolves
  provider/model routing based on risk level and user preference hint. Phase D.1
  only: single + failover topologies. review-chain topology deferred to D.2.
- Continuation class: REALIZATION
- Active quality assessment: EA Track A governance tax baseline established at
  commit 158309f. Tax measurement operational. Hard gates PASS across R5-R10 (6
  scored runs). Reviewer agreement gate has not passed since R5, but this is
  isolated to QBS scoring methodology — it does not affect governance runtime
  correctness. EA Track A/B/C all delivered clean with lint/tsc/test/build PASS.
- Assessment date: 2026-05-13
- Weighted total: 7.5/10
- Lowest dimension: Decision value (provider routing is an ergonomic improvement,
  not a hard correctness requirement — existing single-provider mode is functional)
- Quality-first decision: EXPAND_NOW
- Why expansion is still the better move now: EA Track A baseline is complete and
  clean (53 tests PASS, governance tax measurable). Track D adds routing overhead
  that can now be measured against the established baseline. The existing
  provider-router-adapter already handles single/DENY/ESCALATE decisions; Track D
  extends it with preference hints and failover without touching hard gate logic.
  Deferral risk: provider diversity is a doc-only claim until runtime routing is
  tested; Track D makes it a runtime-enforced property.
- Quality protection commitments:
  1. Provider Policy Engine MUST NOT be on the decision path for BLOCK/CLARIFY/
     NEEDS_APPROVAL — routing only activates after enforcement status is ALLOW.
  2. All existing route.qbs-hard-gates tests must continue to PASS unchanged.
  3. Governance tax overhead from routing layer must be < 5% additional tax vs
     Track A baseline (measured via governance-tax-logger).
  4. Routing decision logged in governance receipt (routingDecision field already
     exists — extend it with preference resolution detail).
  5. No provider names exposed to noncoder UI — preference tiers only
     (Fast / Accurate / Auto).
- Why now: Three clean EA tracks delivered. Provider routing is the highest-value
  remaining track that does not require new QBS scored runs. User-facing preference
  tier UI and failover are concrete deliverables with direct user benefit.
- Active-path impact: LIMITED — extends existing routeWebProvider call path;
  does not change guard contract, approval flow, or DLP pipeline.
- Risk if deferred: Provider diversity remains a documentation-only claim with no
  runtime enforcement. Failover is unavailable if a provider is temporarily
  unavailable. User cannot express routing preference even within governance bounds.
- Lateral alternative considered: YES
- Why not lateral shift: Alternative is to keep single-provider hardcoded and
  document the limitation. This is acceptable for local-first use but blocks any
  production deployment scenario where provider availability matters. Track D is
  the minimum viable routing layer.
- Real decision boundary improved: YES — adds governance-controlled provider
  selection policy (R0/R1/R2/R3 tiered override), making provider routing a
  first-class governance decision rather than an env-var default.
- Expected enforcement class: GATEWAY_PRECONDITION (routing runs before provider
  call, after enforcement decision, as a governance-controlled pre-condition)
- Required evidence if approved:
  - provider-policy-engine.ts unit tests PASS with R0/R1/R2/R3 tier coverage
  - Existing route.qbs-hard-gates.test.ts PASS unchanged
  - governance-tax-logger shows routing overhead < 5% additional tax
  - Failover test: mock primary provider failure → secondary provider used
  - npm run lint PASS (max-warnings=0)
  - npx tsc --noEmit PASS
  - npm run build PASS
  - python scripts/check_public_surface.py PASS

Depth Audit
- Risk reduction: 2 — adds governance-controlled routing; removes uncontrolled
  provider selection at env-var level; failover reduces availability risk
- Decision value: 1 — routing is ergonomic improvement, not hard correctness gate;
  existing single-provider mode is functional for current use cases
- Machine enforceability: 2 — routing policy is code-enforced with unit tests;
  preference tiers are abstracted so noncoder cannot name providers directly
- Operational efficiency: 2 — failover reduces manual intervention when a provider
  is unavailable; preference tier improves user control without governance bypass
- Portfolio priority: 2 — completes the EA Enhancement Track A-D sequence;
  unblocks provider diversity claim in docs
- Total: 9/10
- Decision: CONTINUE
- Reason: Depth audit score 9/10. Decision value is 1 (not 0) — routing does
  improve a real decision boundary (provider selection becomes governance-controlled
  rather than env-var default). All other dimensions score 2. No hard-stop triggered.

Authorization Boundary
- Authorized now: YES
- Next batch name: EA-TRACK-D-PHASE-1
- Scope authorized: Phase D.1 only — single topology (no change) + failover topology.
  Provider Policy Engine as a new lib module. Preference tier UI in Settings page.
  Routing decision logged in governance receipt.
- Scope NOT authorized in this GC-018:
  - review-chain topology (Phase D.2) — separate GC-018 required
  - Any change to BLOCK/CLARIFY/NEEDS_APPROVAL logic
  - Any change to guard contract or hard gate thresholds
  - Any change to QBS scoring or calibration artifacts
- Reopen trigger for D.2: Phase D.1 stable ≥ 1 week + separate GC-018 candidate
  addressing review-chain governance risk (circular governance overhead)
```

---

## Implementation Plan — Phase D.1

### Files to create

| File | Purpose |
| --- | --- |
| `src/lib/provider-policy-engine.ts` | Policy engine: risk-tier → provider resolution, failover chain |
| `src/lib/provider-policy-engine.test.ts` | Unit tests: R0/R1/R2/R3 tiers, failover, preference resolution |
| `docs/benchmark/qbs-1/provider-routing-policy.md` | Governance policy document for routing decisions |

### Files to modify

| File | Change |
| --- | --- |
| `src/app/api/execute/route.ts` | Wire `resolveProviderPolicy()` after enforcement ALLOW, before `executeAI`; log result in receipt |
| `src/lib/ai/provider-router-adapter.ts` | Extend with preference hint input; preserve existing routing contract |
| `src/app/(dashboard)/settings/page.tsx` | Add Provider Preference selector (Fast / Accurate / Auto) |

### Routing policy (R-tier → provider override)

| Risk tier | User preference | Resolved provider | Notes |
| --- | --- | --- | --- |
| R0 (safe) | any | user preference if configured; else default | Full user agency |
| R1 (low) | any | user preference if in configured list; log override | Preference respected, logged |
| R2 (medium) | ignored | governance-approved provider list only | User preference overridden |
| R3 (high) | ignored | single approved provider; no override | Strict |

### Failover behaviour

If primary provider call fails (network/API error), the engine selects the first
available provider in the configured fallback chain (from `routingResult.fallbackChain`)
and retries once. Failover is only active for R0/R1 requests. R2/R3 requests fail
hard — no automatic failover to a potentially less-governed provider.

### Preference tiers (UI → engine mapping)

| UI label (VI) | UI label (EN) | Engine hint |
| --- | --- | --- |
| Tiết kiệm | Fast | `fast` → prefer lowest-cost configured provider |
| Chính xác | Accurate | `accurate` → prefer highest-capability configured provider |
| Tự động | Auto | `auto` → governance decides (current default behaviour) |

Preference tiers are resolved at runtime against the configured provider list.
If the preferred provider is not configured (no API key), fallback to `auto`.

### Governance receipt extension

`routingDecision` field in `GovernanceEvidenceReceipt` extended to include:

```json
{
  "routingDecision": "ALLOW",
  "routingDetail": {
    "requestedPreference": "fast",
    "resolvedProvider": "alibaba",
    "riskTierOverride": false,
    "failoverUsed": false,
    "fallbackChain": ["alibaba", "deepseek"]
  }
}
```

This field is already present in the receipt type — no schema break.

---

## Boundary (re-stated for implementation)

- Provider Policy Engine activates **only after** `enforcement.status === 'ALLOW'`
- Does **not** change guard contract, DLP, approval, or quota logic
- Does **not** expose provider names in noncoder-facing UI
- Does **not** touch QBS artifacts, calibration files, or scoring scripts
- Phase D.2 (review-chain) is **not** in scope — do not implement or stub
