# CVF Public Catalog Claim Boundary

Memory class: POINTER_RECORD
Status: CURRENT PUBLIC CLAIM BOUNDARY - updated 2026-05-22

## Purpose

Define the public claim boundary for the CVF technical product catalog so a
user, developer, or agent can tell which CVF capabilities are proven, bounded,
demand-gated, partially absorbed, or roadmap-only.

## Scope

This document is public-safe. It links only to files that exist in the public
repository surface and does not expose private provenance, review, baseline, or
legacy source folders.

This is a claim-boundary document, not a release announcement.

## Owner

Owner surface: public/product orientation and claim-boundary documentation.

## Source / Predecessor Evidence

- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`
- `docs/evidence/latest-release-gate.md`
- `docs/evidence/provider-lanes.md`
- `docs/evidence/web-governance-path.md`
- `docs/evidence/cvf-16-5-runtime-absorption.md`
- `docs/reference/CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md`

## Decision / Baseline / Proposed Tranche

Decision: Phase B public catalog baseline remains accepted as a structured
claim boundary for the public technical catalog, with the 2026-05-22 A2
public-safe governance-kernel coherence readout added.

Baseline: this document preserves the existing public claim posture and adds a
reader-facing classification contract plus the A2 coherence readout boundary.
It does not authorize runtime work, release-gate changes, or public claim
expansion.

Proposed tranche: none. Phase D implementation tranches require separate
GC-018 authorization before any code change.

## Requirements

Public catalog claims must:

- use only public repository links;
- separate proven behavior from bounded or roadmap behavior;
- cite a concrete file for every strong claim;
- preserve the mandatory live-governance-proof rule;
- avoid claiming complete Agent OS status, universal provider parity, or full
  legacy absorption.

## Claim Classes

| Claim class | Meaning | Evidence requirement |
|---|---|---|
| proven | Implemented and supported by public architecture, evidence, or release-gate files | Concrete public file link; live proof required for governance behavior claims |
| bounded | Implemented only in a named scope, path, provider lane, or workflow | Concrete public file link plus explicit boundary |
| certified lane | Provider or runtime lane with published evidence | Concrete evidence file for that lane |
| partially absorbed | Contract, vocabulary, or guard exists, but full runtime enforcement is not complete | Public architecture or guard file plus roadmap/boundary wording |
| demand-gated | Work may proceed only after a named consuming need and fresh authorization | Public catalog or roadmap wording; no done claim |
| roadmap | Not currently claimed as complete | Boundary statement; implementation evidence not required |

## Capability Boundary

| Capability | Public claim allowed now | Evidence anchor | Boundary |
|---|---|---|---|
| Governance control plane | CVF is a governance-first AI control framework with documented control-plane surfaces | `ARCHITECTURE.md`, `GOVERNANCE.md`, `governance/toolkit/05_OPERATION/CVF_AUDIT_PROTOCOL.md` | Does not prove every future tool/runtime action is governed |
| Governance kernel coherence | Audit-equivalent public reader baseline through existing public owner surfaces | `docs/reference/CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md`, `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`, `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md` | Does not lift freeze or prove new runtime/provider/tool/database/subagent behavior |
| Live governance proof | Release-quality governance claims require live proof | `scripts/run_cvf_release_gate_bundle.py`, `docs/evidence/latest-release-gate.md` | Mock-only UI checks do not count as governance proof |
| Non-coder governed path | Bounded non-coder value is proven where public evidence exists | `docs/reference/CVF_PUBLIC_NONCODER_VALUE_STATEMENT_2026-04-17.md`, `docs/evidence/web-governance-path.md` | Not a claim of universal non-coder task coverage |
| Provider lanes | Provider lanes are certified only where public lane evidence exists | `docs/evidence/provider-lanes.md` | No universal provider parity claim |
| Knowledge-backed execution | Knowledge-backed execution is proven only in the bounded execute path | `docs/evidence/cvf-16-5-runtime-absorption.md`, `docs/evidence/web-governance-path.md` | Not a claim of universal memory reinjection |
| Deliverable packs and evidence export | Implemented in the web product path | `README.md`, `docs/evidence/web-governance-path.md` | Export availability is not itself a live governance proof |
| External asset/capability governance | Partially productized | `docs/evidence/web-governance-path.md`, `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md` | Not a full external capability marketplace claim |
| Role and agent governance | Partially absorbed | `governance/toolkit/03_CONTROL/CVF_AGENT_REGISTRY.md`, `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md` | Full enforceable role-permission runtime remains future work |
| Memory and continuity | Partially absorbed | `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md`, `governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md` | Full governed reinjection across all worker paths is not claimed |
| Provider method breadth | Demand-gated | `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` | New provider methods need named consumer slices and live proof if they affect governed execution |
| Tool/MCP/database action governance | Roadmap | `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` | Full canonical action taxonomy is not claimed |
| Async workers/subagents | Roadmap | `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` | Canonical async work-ticket and delegation lifecycle remain future work |
| Graph/code-intelligence context | Roadmap | `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` | No full graph-native context resolver claim |

## Public Claim Boundary

CVF may claim:

- governance-first AI control framework;
- bounded live non-coder value;
- evidence-backed provider lanes where public evidence exists;
- governed knowledge-backed execution in the bounded proven path;
- governance-kernel coherence as audit-equivalent public orientation;
- public auditability through architecture, evidence packets, guards, and
  release gates.

CVF must not claim:

- complete Agent OS status;
- full universal provider parity;
- full external capability marketplace readiness;
- full legacy repository absorption;
- unrestricted autonomous self-improvement;
- complete role-permission, memory-reinjection, async-worker, graph-context,
  database-action, or provider-method coverage.
- freeze lift, kernel-owner replacement, or A2 as proof of new runtime
  behavior.

## Verification

Public-sync path verification for this Phase B baseline:

```powershell
Test-Path README.md
Test-Path ARCHITECTURE.md
Test-Path GOVERNANCE.md
Test-Path docs/GET_STARTED.md
Test-Path docs/evidence/README.md
Test-Path docs/evidence/latest-release-gate.md
Test-Path docs/evidence/provider-lanes.md
Test-Path docs/evidence/web-governance-path.md
Test-Path docs/evidence/cvf-16-5-runtime-absorption.md
Test-Path docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md
Test-Path docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md
Test-Path docs/reference/CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md
Test-Path docs/reference/CVF_PUBLIC_NONCODER_VALUE_STATEMENT_2026-04-17.md
Test-Path docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md
Test-Path docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md
Test-Path docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md
Test-Path EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/runtime-workflow.contract.ts
Test-Path EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/orchestrator.contract.ts
Test-Path EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/policy-decision.contract.ts
Test-Path governance/toolkit/03_CONTROL/CVF_AGENT_REGISTRY.md
Test-Path governance/toolkit/05_OPERATION/CVF_AUDIT_PROTOCOL.md
Test-Path governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md
Test-Path governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md
Test-Path scripts/run_cvf_release_gate_bundle.py
```

Release-quality governance proof still uses:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

This Phase B baseline did not run live proof because it does not assert new
governance behavior, provider behavior, or release readiness.

## Related Artifacts

- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`
- `docs/evidence/latest-release-gate.md`
- `docs/evidence/provider-lanes.md`
- `docs/evidence/web-governance-path.md`
- `docs/evidence/cvf-16-5-runtime-absorption.md`
- `docs/reference/CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md`
