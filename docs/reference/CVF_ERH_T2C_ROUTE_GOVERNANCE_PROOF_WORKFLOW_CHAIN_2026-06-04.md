# CVF ERH-T2C Route Governance Proof Workflow Chain

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-04

Owner work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_ERH_T2C_ROUTE_GOVERNANCE_PROOF_HARDENING_2026-06-04.md`

Owner implementation: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-governance-proof.ts`

## Purpose

Define the bounded route governance proof workflow chain created by ERH-T2C.
The chain turns the ERH-T2A missing-proof route gap into a reusable CVF route
proof system: route registry, body capture, auth evaluation, secret-safe proof
emission, and focused route evidence.

## Scope / Target / Owner Boundary

Target: five API routes identified by ERH-T2A as
`MISSING_ROUTE_GOVERNANCE_PROOF`.

Owner surface: `cvf-web` route governance proof helper and private ERH evidence
packets.

Boundary:

- session-or-service-token authorization proof only;
- no provider/live proof by this reference packet;
- no production or hosted readiness claim;
- no public-sync export;
- no claim that every CVF route is covered.

## Workflow Chain Contract

| Contract field | Value |
| --- | --- |
| workflow chain version | `cvf.routeGovernanceProofWorkflow.t2c.v1` |
| proof version | `cvf.routeGovernanceProof.t2c.v1` |
| implementation function | `authorizeRouteGovernanceProof()` |
| route registry | `ROUTE_GOVERNANCE_PROOF_REGISTRY` |
| route config resolver | `getRouteGovernanceProofConfig()` |
| allowed auth modes | `session`, `service_token` |
| denied auth mode | `unauthorized` |
| terminal proof field | `routeGovernanceProof` |

## Chain Stages

| Stage | Meaning | Evidence surface |
| --- | --- | --- |
| `BODY_CAPTURED` | route reads raw request body before JSON parsing | route source uses `request.text()` |
| `ROUTE_CONFIG_RESOLVED` | route resolves a registered config from the shared registry | `getRouteGovernanceProofConfig()` |
| `SERVICE_TOKEN_EVALUATED` | helper validates service token and optional signature using existing service-token helper | `verifyServiceTokenRequest()` |
| `SESSION_EVALUATED` | helper falls back to existing session verification when service-token auth is absent or invalid | `verifySessionCookie()` |
| `PROOF_EMITTED` | helper emits secret-safe proof metadata into success or denial path | response `routeGovernanceProof` |

## Route Registry

| Route | Surface | Risk | Status |
| --- | --- | --- | --- |
| `/api/artifacts/export` | artifact-export | R1 | REGISTERED |
| `/api/governance/override` | governance-override | R2 | REGISTERED |
| `/api/knowledge/ingest` | knowledge-ingest | R1 | REGISTERED |
| `/api/lpci/intake` | lpci-intake | R1 | REGISTERED |
| `/api/lpci/query` | lpci-query | R2 | REGISTERED |

## System Loop Interlock

GC-052 connection:

`erh-route-ledger-to-route-governance-proof-workflow`

Routing rule: when ERH-T2A identifies missing route governance proof and ERH-T2C
is authorized, the route ledger gap can feed a bounded runtime route proof
workflow chain. The downstream chain does not authorize public claims or live
governance proof without separate evidence.

## Evidence / Verification

Focused tests:

```powershell
npm run test:run -- src/lib/route-governance-proof.test.ts src/app/api/artifacts/export/route.test.ts src/app/api/governance/override/route.governance.test.ts src/app/api/knowledge/ingest/route.test.ts src/app/api/knowledge/ingest/w116-cp5-delta.test.ts src/app/api/lpci/intake/route.test.ts src/app/api/lpci/intake/route.governance.test.ts src/app/api/lpci/query/route.test.ts src/app/api/lpci/query/route.governance.test.ts
```

Expected result: PASS.

Observed result: PASS, 9 files / 36 tests.

System-loop gate:

```powershell
python governance/compat/check_system_loop_interlock.py --base 7c7dfc52 --head HEAD --enforce
```

Expected result: PASS.

Observed result: PASS.

Release gate:

```powershell
python scripts/run_cvf_release_gate_bundle.py --json
```

Observed result: PASS, including Playwright live governance.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| Route GAP should become a reusable workflow chain, not a one-off route patch | RUNTIME_SIGNAL_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | registry-backed workflow chain plus GC-052 interlock |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this is a private provenance route-governance workflow-chain reference.
Public export requires a separate public-sync batch after reviewer/committer
closure.

Next action: after T2C reviewer closure, decide whether to summarize the
workflow chain in public docs without claiming live proof.

## Claim Boundary

This packet defines a local route governance proof workflow chain and its
source/test evidence. It does not prove live governance behavior, provider
behavior, hosted freshness, production readiness, public readiness, or complete
route coverage for all CVF API routes.
