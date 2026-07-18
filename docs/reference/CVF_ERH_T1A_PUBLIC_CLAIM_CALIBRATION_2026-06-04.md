# CVF ERH-T1A Public Claim Calibration

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-04

Work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_ERH_T1A_PUBLIC_CLAIM_CALIBRATION_2026-06-04.md`

## Purpose

Record the private claim calibration that must govern future public GitHub
README/catalog updates. This packet is designed for external-agent evaluation
accuracy, not advertising.

## Scope / Target / Owner Boundary

Target: public GitHub evaluation readiness for
`Blackbird081/Controlled-Vibe-Framework-CVF.git`.

Boundary:

- public GitHub docs should explain the current public snapshot, private
  provenance boundary, evidence status, and known gaps;
- landing-page mock examples, if later used, are non-coder orientation only;
- public evidence claims require public-sync artifacts and evidence paths;
- runtime behavior claims require source/test/live proof appropriate to the
  claim level.

## Calibration Ledger

| Public claim surface | Allowed wording class | Required boundary | Current disposition |
| --- | --- | --- | --- |
| What CVF is | Governance/control framework for AI-assisted workflows | state current public snapshot may lag private provenance | ALLOWED_WITH_BOUNDARY |
| Output quality | CVF preserves governance evidence and safety on tested corpora | do not claim output-quality parity or superiority; F-1 closed not met | BOUNDED_ONLY |
| Evidence durability | evidence surfaces exist across web tmp JSON, optional signing, and guard-contract SQLite wrapper | do not imply all web evidence is durable, signed, or hash-chained by default | BOUNDED_ONLY |
| Safety/DLP | regex and pattern safety filter exists in web layer | do not call it ML DLP or comprehensive data-loss prevention | BOUNDED_ONLY |
| Benchmark live telemetry | operational benchmark extension contract exists | do not claim live benchmark emission while `liveEmissionWired` is false | BLOCKED_UNTIL_RUNTIME_PROOF |
| Route governance coverage | route set can be inventoried | do not claim route coverage until ERH-T2A ledger is cited | BLOCKED_UNTIL_LEDGER |
| CI posture | CI runs type/build/test lanes | do not imply production-grade hardening until CI plan/workflow evidence exists | BOUNDED_ONLY |
| Public catalog | public-facing artifact map | must separate exported, deferred-private, and blocked missing-public-artifact items | PUBLIC_SYNC_REQUIRED |
| Mock usage sample | web-facing non-coder orientation only | not governance evidence, not operator usability gate, not ERH prerequisite | MOCK_ONLY |

## Public README / Catalog Content Requirements

Future public-sync content should include:

| Required section | Purpose | Export condition |
| --- | --- | --- |
| Snapshot boundary | explain public repo versus private provenance state | ERH-T1B |
| Evidence status | distinguish defined, tested, and live-proven claims | ERH-T1B |
| Known gaps | list durability, route ledger, CI, dependency caveats honestly | ERH-T1B |
| External-agent evaluation guide | tell reviewers what to inspect and what not to infer | ERH-T1B |
| Public Export Disposition | comply with public export standard | ERH-T1B |

## Source / Predecessor Evidence

| Source | Evidence | Disposition |
| --- | --- | --- |
| ERH GC-018 | `docs/baselines/CVF_GC018_ERH_EXTERNAL_REVIEW_HARDENING_2026-06-04.md` | ACCEPT |
| ERH roadmap | `docs/roadmaps/CVF_ERH_EXTERNAL_REVIEW_HARDENING_ROADMAP_2026-06-04.md` | ACCEPT |
| F-1 closure | `docs/reviews/CVF_F1_OUTPUT_QUALITY_PARITY_CLOSURE_NOT_MET_2026-05-15.md` | ACCEPT |
| Safety source | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/safety.ts` lines 1-35 | ACCEPT |
| Benchmark contract | `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/runtime-workflow.contract.ts` lines 85-90 and 206-226 | ACCEPT |

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| External agents can evaluate stale public claims as current private truth | OPERATOR_SCOPE_CLARITY_GAP | DOCUMENTATION_ONLY_LEARNING | TEMPLATE_UPDATED | require snapshot/evidence/known-gap sections in ERH-T1B |
| Mock usage samples could be confused with evidence | OPERATOR_SCOPE_CLARITY_GAP | DOCUMENTATION_ONLY_LEARNING | RULE_EXISTS | label mock samples as orientation-only |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance calibration packet. No public-sync remote, public
commit, or public artifact path evidence is included.

Next action: translate the allowed wording into the public-sync README/catalog
through ERH-T1B.

## Claim Boundary

This packet calibrates claims only. It does not update the public repository,
implement runtime changes, run live proof, or establish production readiness.
