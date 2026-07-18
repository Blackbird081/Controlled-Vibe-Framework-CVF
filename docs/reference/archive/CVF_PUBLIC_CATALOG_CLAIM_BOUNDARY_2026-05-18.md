# CVF Public Catalog Claim Boundary

Memory class: POINTER_RECORD
Status: PHASE-B PUBLIC BASELINE SOURCE COPY

## Purpose

Define the public claim boundary for the CVF technical product catalog so a
user, developer, or agent can tell which CVF capabilities are proven, bounded,
demand-gated, partially absorbed, or roadmap-only.

## Scope

This provenance copy mirrors the public-safe claim boundary used by the
public-sync clone. It links only to public-safe repository surfaces and does
not promote private legacy material into public canon.

This is a claim-boundary document, not a release announcement.

## Owner

Owner surface: public/product orientation and claim-boundary documentation.

## Source / Predecessor Evidence

- `docs/baselines/CVF_GC018_PHASE_B_PUBLIC_CATALOG_BASELINE_2026-05-18.md`
- `docs/reviews/CVF_LEGACY_ABSORPTION_PHASE_A_FREEZE_2026-05-18.md`
- `docs/roadmaps/CVF_LEGACY_ABSORPTION_AND_PUBLIC_CATALOG_ROADMAP_2026-05-18.md`
- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`

## Decision / Baseline / Proposed Tranche

Decision: Phase B public catalog baseline accepted as a structured claim
boundary for the technical catalog source copy.

Baseline: this document preserves the existing public claim posture and adds a
reader-facing classification contract. It does not authorize runtime work,
release-gate changes, or public claim expansion.

Proposed tranche: none. Phase D implementation tranches require separate
GC-018 authorization before any code change.

## Requirements

Public catalog claims must:

- use only public-safe repository links;
- separate proven behavior from bounded or roadmap behavior;
- cite a concrete file for every strong claim;
- preserve the mandatory live-governance-proof rule;
- avoid claiming complete Agent OS status, universal provider parity, or full
  legacy absorption.

## Claim Classes

| Claim class | Meaning | Evidence requirement |
|---|---|---|
| proven | Implemented and supported by public architecture, evidence, or release-gate files | Concrete public-safe file link; live proof required for governance behavior claims |
| bounded | Implemented only in a named scope, path, provider lane, or workflow | Concrete public-safe file link plus explicit boundary |
| certified lane | Provider or runtime lane with published evidence | Concrete evidence file for that lane |
| partially absorbed | Contract, vocabulary, or guard exists, but full runtime enforcement is not complete | Public architecture or guard file plus roadmap/boundary wording |
| demand-gated | Work may proceed only after a named consuming need and fresh authorization | Public catalog or roadmap wording; no done claim |
| roadmap | Not currently claimed as complete | Boundary statement; implementation evidence not required |

## Capability Boundary

| Capability | Public claim allowed now | Evidence anchor | Boundary |
|---|---|---|---|
| Governance control plane | CVF is a governance-first AI control framework with documented control-plane surfaces | `ARCHITECTURE.md`, `governance/toolkit/05_OPERATION/CVF_AUDIT_PROTOCOL.md` | Does not prove every future tool/runtime action is governed |
| Live governance proof | Release-quality governance claims require live proof | `scripts/run_cvf_release_gate_bundle.py`, `docs/CVF_INCREMENTAL_TEST_LOG.md` | Mock-only UI checks do not count as governance proof |
| Non-coder governed path | Bounded non-coder value is proven where evidence exists | `docs/reference/archive/CVF_PUBLIC_NONCODER_VALUE_STATEMENT_2026-04-17.md`, `docs/assessments/CVF_W119_T1_NONCODER_ADOPTION_EVIDENCE_PACK_2026-04-23.md` | Not a claim of universal non-coder task coverage |
| Provider lanes | Provider lanes are certified only where evidence exists | `docs/audits/alibaba-canary/INDEX.md`, `docs/audits/deepseek-canary/INDEX.md` | No universal provider parity claim |
| Knowledge-backed execution | Knowledge-backed execution is proven only in the bounded execute path | `docs/audits/CVF_W101_T1_CP1_KNOWLEDGE_NATIVE_EXECUTE_PATH_INTEGRATION_AUDIT_2026-04-17.md`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/knowledge-store.ts` | Not a claim of universal memory reinjection |
| Deliverable packs | Implemented in the web product path | `README.md`, `docs/reviews/CVF_W130_EXPORT_ACTIVATION_CONTRACT_2026-04-28.md` | Export availability is not itself a live governance proof |
| External asset/capability governance | Partially productized | `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/external-asset-governance.ts` | Not a full external capability marketplace claim |
| Role and agent governance | Partially absorbed | `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` | Full enforceable role-permission runtime remains future work |
| Memory and continuity | Partially absorbed | `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` | Full governed reinjection across all worker paths is not claimed |
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

## Verification

This provenance copy is verified by local documentation governance checks.
The customer-facing public-sync derivative must also pass public-sync
`Test-Path` verification before commit.

Release-quality governance proof still uses:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

This Phase B baseline did not run live proof because it does not assert new
governance behavior, provider behavior, or release readiness.

## Related Artifacts

- `docs/baselines/CVF_GC018_PHASE_B_PUBLIC_CATALOG_BASELINE_2026-05-18.md`
- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`
- `docs/roadmaps/CVF_LEGACY_ABSORPTION_AND_PUBLIC_CATALOG_ROADMAP_2026-05-18.md`
