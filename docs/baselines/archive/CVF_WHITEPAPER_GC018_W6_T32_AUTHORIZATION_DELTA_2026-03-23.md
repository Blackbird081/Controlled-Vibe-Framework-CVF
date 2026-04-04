# CVF Whitepaper GC-018 W6-T32 Authorization Delta

Memory class: SUMMARY_RECORD
> Date: `2026-03-23`

## Tranche

**W6-T32 — CPF Gateway Auth & Auth Log Tests Slice**
Branch: `cvf-next`
Risk: R0 (test-only, no source changes)
Lane: Full Lane (closes CPF dedicated test coverage gap for gateway auth contracts)

## Scope

Provide dedicated test coverage for the CPF Gateway Auth pipeline — two contracts
that previously had coverage only via `index.test.ts`:

- `GatewayAuthContract` — GatewayAuthRequest → GatewayAuthResult
  (revoked=true→REVOKED; revoked priority over expired; expiresAt<=now→EXPIRED;
   expiresAt===now→EXPIRED; empty/whitespace token→DENIED; valid→AUTHENTICATED;
   authenticated: scopeGranted=scope; denied/revoked/expired: scopeGranted=[];
   tenantId propagated; evaluatedAt=now(); authHash deterministic; resultId truthy; factory works)
- `GatewayAuthLogContract` — GatewayAuthResult[] → GatewayAuthLog
  (empty→DENIED dominant; frequency-first DENIED>REVOKED>EXPIRED>AUTHENTICATED tiebreak;
   all status counts accurate; totalRequests; logHash deterministic; createdAt=now(); factory works)

Key behavioral notes tested:
- GatewayAuthContract: revoked evaluated FIRST before expiry check
- GatewayAuthLogContract: empty results → DENIED wins (all 0 > threshold -1, DENIED first in priority loop)

## Artifacts Delivered

| File | Change | Lines |
|---|---|---|
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.auth.log.test.ts` | New — dedicated test file (GC-023 compliant) | 276 |

## GC-023 Compliance

- `gateway.auth.log.test.ts`: 276 lines — under 1200 hard threshold ✓
- `tests/index.test.ts` (CPF, frozen at approved max) — untouched ✓
- `src/index.ts` (CPF) — untouched ✓

## Test Counts (Post-Delivery)

| Plane | Tests |
|---|---|
| LPF | 377 |
| GEF | 185 |
| EPF | 416 |
| CPF | 509 (+34) |
| GC  | 172 |

## Authorization

Authorized under GC-018 (Continuation Governance). Test-only — no risk to
existing contracts. Closes dedicated test coverage gap for GatewayAuthContract
and GatewayAuthLogContract (CPF contracts previously covered only via index.test.ts).
