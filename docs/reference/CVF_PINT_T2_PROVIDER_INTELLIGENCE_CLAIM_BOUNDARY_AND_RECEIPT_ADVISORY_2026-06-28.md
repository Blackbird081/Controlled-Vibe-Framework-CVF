# CVF PINT-T2 Provider Intelligence Claim Boundary And Receipt Advisory

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-28

Owner: Codex

rawMemoryReleased: false

## Purpose

Promote the useful subset of the Provider Intelligence source bundle into a
CVF-owned reference for provider/model choice language, claim boundaries, and
receipt-advisory fields.

This reference absorbs the source bundle as governance doctrine and receipt
vocabulary. It does not import the external package, copied reference drafts,
prototype checkers, OpenRouter dependency, MCP production route, live catalog,
benchmark campaign, cost/latency measurement, automatic model selection, or
runtime behavior.

## Scope / Applies To

Applies to future CVF roadmaps, GC-018 baselines, work orders, completion
reviews, Model Gateway design packets, and MCP boundary packets that discuss
provider/model choice, provider-market signals, provider health, route-choice
receipts, or dev-MCP model intelligence.

Does not apply to runtime source implementation, live/provider proof, public
sync, provider certification, generated aggregate mutation, OpenRouter
integration, MCP production routing, benchmark execution, or automatic
best-model routing.

## Source Authority

CVF authority comes from governed owner surfaces. The retained source bundle is
external advisory input only.

| Authority class | Source | Disposition |
|---|---|---|
| CVF roadmap authority | `docs/roadmaps/CVF_PINT_T0_PROVIDER_INTELLIGENCE_EXTERNAL_ABSORPTION_ROADMAP_2026-06-28.md` | ACCEPT |
| CVF reconciliation authority | `docs/baselines/CVF_GC018_PINT_T1_SOURCE_VERIFIED_PROVIDER_INTELLIGENCE_RECONCILIATION_2026-06-28.md` | ACCEPT |
| External source input | `.private_reference/legacy/CVF 28.06/CVF_PROVIDER_INTELLIGENCE/docs/absorptions/openrouter-provider-intelligence/README.md` | ADVISORY_ONLY |
| External source input | `.private_reference/legacy/CVF 28.06/CVF_PROVIDER_INTELLIGENCE/docs/absorptions/openrouter-provider-intelligence/03_PROVIDER_INTELLIGENCE_PLANE_SPEC.md` | ADVISORY_ONLY |
| External source input | `.private_reference/legacy/CVF 28.06/CVF_PROVIDER_INTELLIGENCE/docs/absorptions/openrouter-provider-intelligence/08_MODEL_SELECTION_DECISION_POLICY.md` | ADVISORY_ONLY |
| External source input | `.private_reference/legacy/CVF 28.06/CVF_PROVIDER_INTELLIGENCE/docs/absorptions/openrouter-provider-intelligence/09_DEV_MCP_VS_PRODUCTION_API_BOUNDARY.md` | ADVISORY_ONLY |
| External source input | `.private_reference/legacy/CVF 28.06/CVF_PROVIDER_INTELLIGENCE/docs/absorptions/openrouter-provider-intelligence/10_ROUTING_DECISION_RECEIPT_CONTRACT.md` | ADVISORY_ONLY |
| External source input | `.private_reference/legacy/CVF 28.06/CVF_PROVIDER_INTELLIGENCE/docs/absorptions/openrouter-provider-intelligence/11_COST_LATENCY_QUALITY_RECEIPT_SCHEMA.md` | ADVISORY_ONLY |
| Existing CVF policy owner | `EXTENSIONS/CVF_MODEL_GATEWAY/src/gateway-policy.ts` | ACCEPT |
| Existing CVF provider registry owner | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts` | ACCEPT |
| Existing CVF provider health owner | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-health.ts` | ACCEPT |
| Existing CVF dynamic registry boundary | `EXTENSIONS/CVF_MODEL_GATEWAY/src/dynamic-model-registry-contract.ts` | ACCEPT |
| Existing CVF receipt owner | `EXTENSIONS/CVF_MODEL_GATEWAY/src/gateway-receipt.ts` | ACCEPT |
| Existing CVF MCP boundary owner | `docs/reference/mcp_gateway/CVF_MODEL_GATEWAY_MCP_RUNTIME_BRIDGE_BOUNDARY.md` | ACCEPT |

## Non-Authority Inputs

The following are not CVF authority:

- copied provider-intelligence package source;
- copied prototype checkers and tests;
- copied sample receipts as schema authority;
- OpenRouter MCP documentation or dependency as a runtime requirement;
- provider-local memory or chat-only source summaries;
- live market, live provider, benchmark, cost, latency, or quality claims not
  backed by a future authorized proof tranche.

## Central Rule

Provider intelligence informs route choice. CVF policy and registry gates decide
route authority. CVF receipts record the decision and its evidence boundary.

The allowed order is:

1. classify data sensitivity and request risk;
2. apply `GatewayPolicyContext` and `isPolicyAllowed`;
3. apply `ProviderRegistry.isRoutable` or `ProviderRegistry.assertAllowed`;
4. consider provider health through `ProviderHealthMonitor`;
5. consider supported method, tier, cost, latency, and health enrichment through
   current capability and dynamic-registry owner surfaces;
6. select or reject route candidates;
7. record a `GatewayReceipt` or a future CVF-owned advisory companion;
8. keep validation, tests, review, and closure separate from provider-health or
   market-signal evidence.

## Owner Surface Matrix

| Provider-intelligence concept | External source basis | CVF owner surface | CVF adaptation | Future checker posture |
|---|---|---|---|---|
| Provider Intelligence support plane | README; plane spec | this reference plus Model Gateway boundary docs | use as advisory evidence vocabulary only | no checker now |
| Policy-first model selection | model selection policy; scope boundary | `GatewayPolicyContext`; `isPolicyAllowed` | policy, risk, and data classification precede market signals | checker candidate only if repeated overclaim appears |
| Routable-provider authority | model selection policy | `ProviderRegistry.isRoutable`; `ProviderRegistry.assertAllowed` | provider-market data cannot bypass provider registry gates | no checker now |
| Static capability fit | task capability matrix | `PROVIDER_CAPABILITY_REGISTRY` | supported methods stay owned by Model Gateway capability registry | no checker now |
| Dynamic cost/latency/health enrichment | catalog adapter; signal policy | `DynamicModelRegistryContract` | future dynamic registry may consume cost, latency, tier, and health metadata | runtime implementation parked |
| Provider health evidence | health protocol | `ProviderHealthMonitor` | health can block or caution routing; health is not output quality | no checker now |
| Route decision receipt | routing decision receipt contract | `GatewayReceiptInput`; `GatewayReceiptBuilder` | route evidence belongs in GatewayReceipt or a future companion owned by GatewayReceipt | defer schema checker |
| Cost/latency/quality evidence | CLQ receipt schema | GatewayReceipt metadata or future advisory companion | cost and latency are route evidence; quality requires validation/review | defer schema checker |
| Dev MCP model intelligence | dev MCP boundary | MCP Model Gateway bridge boundary | dev MCP can inform design; it cannot authorize production routing | checker candidate only after repeated dev-MCP overclaims |
| OpenRouter pattern | OpenRouter MCP absorption map | provider-neutral CVF references only | absorb pattern, not dependency | reject direct dependency |
| Provider-intelligence package | copied extension folder | current Model Gateway owner surfaces | reject direct package import | no package checker now |

## Claim Boundary Vocabulary

Allowed bounded claims:

- provider intelligence can inform a governed route decision;
- provider health can describe availability or degradation;
- cost and latency can describe route-selection evidence;
- capability fit can describe supported method compatibility;
- dev MCP can provide build-time intelligence;
- GatewayReceipt can carry route-decision evidence and bounded metadata;
- quality evidence requires validation, review, test, or benchmark evidence
  authorized by the relevant tranche.

Forbidden claims without separate authorization:

- CVF has implemented provider-intelligence runtime;
- CVF routes production traffic through OpenRouter MCP;
- MCP dev probes authorize production model choice;
- provider health proves answer quality;
- cost or latency optimization proves correctness;
- benchmark summaries prove current live provider behavior without a fresh
  proof range;
- Provider Intelligence selects the best model automatically;
- copied sample receipts are canonical CVF schemas;
- copied checkers are active CVF guards;
- public or production readiness follows from this reference.

## Receipt Advisory

Use current `GatewayReceipt` as the authority for route-decision evidence. A
future receipt-advisory companion may be proposed only through fresh GC-018.

| Advisory field family | Current owner | Allowed use | Forbidden expansion |
|---|---|---|---|
| policy result | `GatewayReceipt.policyResult` via `GatewayPolicyContext` | record allow, deny, or approval state | bypassing policy gate |
| data classification | `GatewayReceipt.dataClassification` | record sensitivity context | treating classification as a model ranking |
| request risk | `GatewayReceipt.requestRiskClass` | record risk context | treating risk as cost preference |
| provider/model IDs | `GatewayReceipt.providerId`; `requestedModelId`; `selectedModelId` | record requested and selected route | declaring provider parity |
| health state | `GatewayReceipt.healthState` | record health context | claiming output quality |
| validation state | `GatewayReceipt.validationState` | record validation boundary | claiming review or test pass when not run |
| cost signal | `GatewayReceipt.metadata` or future companion | advisory route evidence only | billing, live price, or optimization claim without proof |
| latency signal | `GatewayReceipt.metadata` or future companion | advisory route evidence only | live latency claim without proof |
| quality signal | future companion, if authorized | reference to test/review/benchmark evidence | correctness proof without validation |
| dev MCP probe | future companion, if authorized | build-time evidence only | production routing authorization |

## Rejected Direct Imports

| External source element | Disposition | Reason |
|---|---|---|
| `EXTENSIONS/CVF_PROVIDER_INTELLIGENCE` package | REJECT_DIRECT_IMPORT | current Model Gateway already owns policy, registry, health, dynamic registry, and receipt surfaces |
| OpenRouter MCP dependency | REJECT_DIRECT_DEPENDENCY | CVF absorbs provider-neutral pattern only |
| copied claim-boundary checker | DEFER_WITH_REOPEN_CONDITION | vocabulary is now documented, but no repeated miss justifies a guard |
| copied receipt-schema checker | DEFER_WITH_REOPEN_CONDITION | receipt owner remains GatewayReceipt and no new schema is authorized |
| copied dev-MCP boundary checker | DEFER_WITH_REOPEN_CONDITION | MCP bridge boundary already records the governing rule |
| copied sample receipts | ADAPT_AS_LANGUAGE_ONLY | samples are not canonical schemas |
| live catalog or live health fetcher | PARKED_RUNTIME | runtime and live proof require separate authorization |

## Checker Candidate Ledger

| Candidate ID | Description | Value now | Decision |
|---|---|---|---|
| PINT-CC-1 | flag claims that provider intelligence authorizes or automatically selects production routes | medium | evaluate in PINT-T3 |
| PINT-CC-2 | flag claims that MCP dev probes authorize production model choice | medium | evaluate in PINT-T3 |
| PINT-CC-3 | require GatewayReceipt owner when new route-decision receipt fields are proposed | medium-low | defer; source verification and dispatch-quality already cover source facts |
| PINT-CC-4 | validate copied cost/latency/quality receipt schema | low now | defer until a CVF-owned companion schema exists |
| PINT-CC-5 | enforce OpenRouter dependency rejection | low | reject now; direct dependency is already a scope boundary |

## Provider Intelligence Rule

Future provider-intelligence work must pass this order:

1. source-verify the external or market signal;
2. map the signal to current Model Gateway owner surfaces;
3. keep policy, risk, data classification, provider registry, and health gates
   ahead of cost or latency preference;
4. record route evidence through GatewayReceipt or an authorized companion;
5. record validation/review/test evidence separately from market signals;
6. reject direct package or dependency import when a CVF owner already exists;
7. open fresh GC-018 before runtime, live proof, checker, public-sync, or
   generated aggregate work.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this reference plus existing Model Gateway owner surfaces | internal agents may cite the reference for planning, source verification, and review language only | PINT-T1 source verification and this reference | N/A with reason: internal documentation/reference only | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future CLI/MCP adapter owner, if separately authorized | no current ingress, authentication, approval, mutation, raw-data release, public claim, route execution, or adapter runtime | PINT-T0/PINT-T1/PINT-T2 all defer adapter and MCP production work | deferred adapter owner | `DEFERRED_WITH_REASON` |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | External repo or copied folder |
| Chain map route | External repo or copied folder -> source-verified reconciliation -> CVF-owned provider-intelligence reference -> future GC-018 only if implementation is separately authorized |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | this provider-intelligence reference |
| Disposition | ADAPT high-value provider-intelligence doctrine to existing CVF Model Gateway and MCP owner surfaces |
| Claim boundary | this reference creates no runtime, package, public, provider, adapter, MCP production, benchmark, cost/latency measurement, automatic model-selection, or checker support |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | PINT-T2 provider-intelligence reference |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no runtime receipt is created or consumed |
| actionEvidence | ACTION_EVIDENCE_PRESENT: documentation reference and governance gate evidence only |
| invocationBoundary | local private provenance documentation only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, Web runtime, adapter, package, watcher, daemon, or production route interception claim |
| claimLanguage | provider-intelligence owner-surface mapping, claim boundary, and receipt-advisory language only |
| forbiddenExpansion | no runtime, provider/live proof, public-sync, package activation, OpenRouter dependency, MCP production routing, benchmark campaign, cost/latency measurement, automatic model selection, checker implementation, certification, generated aggregate mutation, or production/hosted readiness |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | local repository tools |
| Session or invocation | `pint-t2-provider-intelligence-reference-2026-06-28` |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, source reads, apply_patch, governance gates |
| Target paths | this reference |
| Allowed scope source | active session next allowed move after PINT-T1 |
| Before status evidence | HEAD `8237f85f`; worktree clean before material patch |
| After status evidence | PINT-T2 reference authored |
| Diff evidence | `git diff --name-status 8237f85f --` |
| Approval boundary | documentation/reference only |
| Claim boundary | no runtime, provider/live proof, public-sync, checker, generated aggregate, adapter, package activation, certification, OpenRouter dependency, MCP production routing, benchmark campaign, cost/latency measurement, automatic model selection, or production/hosted readiness |
| Agent type | single-agent reviewer/closer |
| Invocation ID | `pint-t2-reference-2026-06-28` |
| Expected manifest | this reference; PINT-T3 closeout; PINT-T0 roadmap update |
| Actual changed set | `docs/reference/CVF_PINT_T2_PROVIDER_INTELLIGENCE_CLAIM_BOUNDARY_AND_RECEIPT_ADVISORY_2026-06-28.md`; `docs/reviews/CVF_PINT_T3_STATIC_CHECKER_VALUE_DECISION_AND_LANE_CLOSEOUT_2026-06-28.md`; `docs/roadmaps/CVF_PINT_T0_PROVIDER_INTELLIGENCE_EXTERNAL_ABSORPTION_ROADMAP_2026-06-28.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename in this tranche |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference. No public-sync remote, public commit,
public artifact path, or public claim is authorized.

## Claim Boundary

This reference is a provider-intelligence claim-boundary and receipt-advisory
surface only. It does not authorize or claim provider-intelligence runtime,
OpenRouter integration, model-market API routing, production MCP routing, live
catalog lookup, provider benchmarking, automatic best-model selection,
cost/latency optimization, provider parity, public-sync export, checker
enforcement, package activation, certification, generated aggregate mutation,
production readiness, hosted readiness, or universal provider-routing
intelligence.
