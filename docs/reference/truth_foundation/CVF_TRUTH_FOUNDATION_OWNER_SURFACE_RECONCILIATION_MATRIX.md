# CVF Truth Foundation Owner Surface Reconciliation Matrix

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference_matrix

Date: 2026-06-28

Batch ID: TKG-T2

matrixVersion: `cvf.truthFoundation.ownerSurfaceReconciliation.tkgT2.v1`

## Purpose

Reconcile the TKG-T1 truth foundation contract with current CVF evidence,
learning, release-truth, scoring, and claim-boundary owner surfaces so the
contract does not become a parallel truth subsystem.

This matrix converts the useful TKG-T1 doctrine into an owner-surface map. It
does not add a runtime, evidence database, obligation registry, SOT index,
generated aggregate, checker, provider proof, adapter, public export, package
activation, certification, MCP gateway, hypervisor, or MPI-T6 runtime.

## Scope / Target / Owner Boundary

In scope:

- map TKG-T1 source authority, provenance labels, evidence records,
  obligation records, verification results, and strict movement semantics to
  existing CVF owner surfaces;
- mark whether each rule is covered, covered as contract-only, partial, or a
  future checker candidate;
- preserve Enterprise Evidence Pack, MLW3, Release Candidate Truth Packet, and
  WD1 TruthScore as existing owner surfaces;
- select the next valuable bounded TKG candidate after T2.

Out of scope:

- AGT runtime adoption, MCP gateway, hypervisor, kill switch, quarantine,
  circuit breaker, runtime monitor, or hosted service;
- Truth Kernel package import, evidence database, obligation registry runtime,
  SOT index runtime, independent verifier service, or monitor;
- edits to runtime source, tests, checkers, generated aggregates, public-sync,
  provider/live proof, package activation, certification, or MPI-T6 runtime.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| TKG-T1 owns the source/provenance/verification contract | `docs/reference/truth_foundation/CVF_TRUTH_FOUNDATION_SOURCE_PROVENANCE_AND_VERIFICATION_CONTRACT.md` | Purpose; Source Authority Rule; Future Tranche Routing | `cvf.truthFoundation.sourceProvenanceVerification.tkgT1.v1` | truth foundation contract | VALUE_SET | ACCEPT |
| Truth foundation front door owns the folder route | `docs/reference/truth_foundation/README.md` | Active References; Existing CVF Owner Surfaces | `docs/reference/truth_foundation/` | truth foundation front door | EXISTS | ACCEPT |
| TKG-T0 requires TKG-T1/TKG-T2 reconciliation with existing owner surfaces before build | `docs/roadmaps/CVF_TKG_T0_AGENT_GOVERNANCE_TRUTH_KERNEL_EXTERNAL_ABSORPTION_ROADMAP_2026-06-28.md` | Design Control Gate; Proposed Roadmap | `RECONCILE_BEFORE_BUILD` | TKG-T0 roadmap | VALUE_SET | ACCEPT |
| Enterprise Evidence Pack owns evidence packaging and minimum evidence set | `docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md` | Evidence Pack Principles; Minimum Evidence Set; Control Families | CVF Enterprise Evidence Pack | evidence-pack reference | EXISTS | ACCEPT |
| MLW3 owns evidence-to-truth learning signal routing | `docs/reference/CVF_MLW3_EVIDENCE_TO_TRUTH_LEARNING_SIGNAL_PIPELINE_2026-06-05.md` | Purpose; Workflow; Failure Modes | `cvf.mlw3.evidenceToTruthLearningSignalPipeline.v1` | learning signal pipeline | VALUE_SET | ACCEPT |
| Release Candidate Truth Packet owns milestone claim boundary wording | `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md` | Purpose; Claim Boundary; What Is Proven; What Is Not Proven | CVF Release Candidate Truth Packet | release truth packet | EXISTS | ACCEPT |
| WD1 owns delivered TruthScore weighting doctrine | `docs/reviews/CVF_WD1_TRUTHSCORE_WEIGHTING_DOCTRINE_COMPLETION_2026-05-31.md` | Purpose; Doctrine Summary | `cvf.truthScoreWeightingDoctrine.wd1.v1` | TruthScore weighting doctrine | VALUE_SET | ACCEPT |
| Autorun workflow control already blocks claims stronger than source proof | `docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md` | Failure policy; Triage table | source invariant claim exceeds source proof | agent autorun workflow control standard | EXISTS | ACCEPT |
| Agent execution SOP already requires evidence proportional to the claim | `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md` | Evidence must be proportional to the claim; failure triage | Evidence cannot support claim | agent execution workflow SOP | EXISTS | ACCEPT |
| Equivalence claim guard already exists for nearby path/evidence claims | `governance/compat/check_equivalence_claim_evidence.py` | checker docstring; `EQUIVALENCE_PHRASES`; `check_text` | `check_text` | equivalence claim evidence checker | EXISTS | ACCEPT |
| Delta execution claim boundary guard already exists for execution-control claims | `governance/compat/check_delta_execution_claim_boundary.py` | `REQUIRED_SECTION`; `REQUIRED_FIELDS`; `check_text` | `check_text` | Delta execution claim boundary checker | EXISTS | ACCEPT |

## Reconciliation Matrix

| TKG-T1 rule or surface | Current owner surface | Coverage status | T2 disposition | Future checker candidate |
|---|---|---|---|---|
| CVF source authority beats external input | TKG-T1 contract; TKG-T0 roadmap; AGENTS provider-specific boundary | COVERED_DOCTRINE | Keep TKG-T1 as the stable truth-foundation contract and use TKG-T0 as intake evidence only | yes, for external-input-to-authority overclaim language |
| External repositories and copied folders are advisory until CVF-owned | TKG-T0 roadmap; external knowledge intake chain map; TKG-T1 contract | COVERED_DOCTRINE | Keep external intake as source input; require CVF owner surface before ACCEPT authority use | yes, if repeated overclaims appear |
| Integrity is not truth | TKG-T1 contract; Enterprise Evidence Pack; autorun workflow control | PARTIAL_COVERAGE | Evidence packaging and workflow gates cover proof discipline, but no focused guard catches hash/receipt-to-truth overclaim language | yes, selected for TKG-T3 plan |
| LLM output is not self-trusting | TKG-T1 contract; agent execution SOP; MLW3 proposal-only boundary | PARTIAL_COVERAGE | Existing SOP and MLW3 constrain evidence and learning proposals; no focused guard catches LLM-as-verifier claim language | yes, selected for TKG-T3 plan |
| Important claims should carry provenance labels | TKG-T1 contract | GAP_CANDIDATE_DOC_ONLY | TKG-T1 owns doc-only label vocabulary; existing artifacts are not required to retrofit labels | yes, after plan defines applicability |
| Evidence record minimum | Enterprise Evidence Pack; TKG-T1 contract | COVERED_CONTRACT_ONLY | Enterprise Evidence Pack owns audit/export layout; TKG-T1 supplies future source/provenance fields without creating a database | possible after field reconciliation becomes implementation need |
| Obligation record minimum | TKG-T1 contract; work-order source verification and closure-quality standards | GAP_CANDIDATE_DOC_ONLY | TKG-T1 owns doc-only obligation fields; no obligation registry runtime is authorized | possible later, lower priority than claim-language guard |
| Verification result minimum | existing governance gates; TKG-T1 contract; Enterprise Evidence Pack | PARTIAL_COVERAGE | Current gates output pass/fail evidence; TKG-T1 names future result fields without changing checker schemas | possible after TKG-T3 plan |
| Strict movement blocks missing hard evidence | autorun workflow control; work-order source verification; closure-quality gate; TKG-T1 contract | COVERED_BY_PROCESS | Preserve as process doctrine; no runtime gate exists from TKG-T2 | no immediate implementation |
| Strict movement blocks stale or conflicted source | autorun workflow control; source verification; TKG-T1 contract | PARTIAL_COVERAGE | Existing gates catch some stale source claims; TKG labels remain doc-only | yes, as part of TKG-T3 plan if bounded |
| Release milestone claim boundaries | Release Candidate Truth Packet; Public Export Disposition standard; Enterprise Evidence Pack | COVERED_OWNER_SURFACE | Release truth packet keeps milestone wording; TKG does not rewrite release truth | no immediate new checker |
| Evidence-to-truth learning proposals | MLW3 | COVERED_OWNER_SURFACE | MLW3 keeps proposal-only learning route and BLOCK_SIGNAL failure modes | no immediate new checker |
| TruthScore weighting and confidence behavior | WD1 completion and runtime source named by WD1 | COVERED_OWNER_SURFACE | TKG does not recalibrate scoring or change WD1 doctrine | no immediate new checker |
| Equivalence or copy claims near paths | `governance/compat/check_equivalence_claim_evidence.py` | MACHINE_GUARD_AVAILABLE | Reuse existing guard; do not duplicate equivalence checking in TKG | no immediate new checker |
| Execution-control claim boundary | `governance/compat/check_delta_execution_claim_boundary.py` | MACHINE_GUARD_AVAILABLE | Reuse existing guard; TKG-T2 creates no execution-control behavior | no immediate new checker |
| Public claim posture | Release Candidate Truth Packet; Public Export Disposition standard; agent SOP | COVERED_PROCESS | Public-safe wording remains separate public-sync work | no immediate new checker |
| AGT runtime and Truth Kernel runtime concepts | TKG-T0 and TKG-T1 claim boundaries | PARKED_RUNTIME | Keep parked until explicit operator authorization, fresh GC-018, source verification, tests, and live proof when behavior is claimed | no TKG-T3 runtime work |

## Field Ownership Matrix

| TKG field family | Owner now | TKG-T2 field status | Allowed current use | Forbidden current use |
|---|---|---|---|---|
| provenance labels | TKG-T1 contract | DOC_ONLY_NEW | label future documentation claims when useful | claim a runtime enum or mandatory repo-wide retrofit exists |
| evidence record minimum | Enterprise Evidence Pack plus TKG-T1 contract | CONTRACT_ONLY | inform future evidence packet field design | create or imply an evidence database |
| obligation record minimum | TKG-T1 contract | CONTRACT_ONLY | inform future work-order or policy obligation design | create or imply an obligation registry runtime |
| verification result minimum | existing checkers plus TKG-T1 contract | CONTRACT_ONLY | inform future checker or receipt design | claim current checker schemas emit TKG verification records |
| strict movement semantics | autorun/work-order/closure gates plus TKG-T1 contract | PROCESS_DOCTRINE | use as claim-boundary language in future dispatch | claim a Truth Kernel strict-mode runtime exists |
| SOT/reference-not-copy | TKG-T1 contract plus current CVF source-verification rules | PROCESS_DOCTRINE | require source paths, receipts, and boundaries | create a parallel SOT index runtime |
| human approval boundary | existing operator/approval rules plus TKG-T1 contract | PROCESS_DOCTRINE | distinguish authorization from factual proof | treat approval as proof of truth |
| AGT deny/block/fail-closed doctrine | TKG-T0/TKG-T1 | DOCTRINE_SEED | inform future guard wording | claim AGT enforcement point exists |

## Gap And Candidate Matrix

| Gap or candidate | Current risk | Existing coverage | T2 route |
|---|---|---|---|
| integrity evidence overclaimed as semantic truth | medium; receipts and hashes are frequent in governed docs | general claim-boundary and evidence-pack doctrine | RECOMMEND_TKG_T3_PLAN |
| LLM or reviewer prose overclaimed as independent verifier | medium; review prose is common in closure packets | SOP plus MLW3 proposal-only boundary | RECOMMEND_TKG_T3_PLAN |
| important claim lacks provenance label | medium; TKG label vocabulary is new and not repo-wide | TKG-T1 doctrine only | RECOMMEND_TKG_T3_PLAN |
| external input treated as CVF source authority | medium; absorption lanes repeat this risk | external intake routing and provider-memory boundary | RECOMMEND_TKG_T3_PLAN |
| obligation registry runtime absence | low until a runtime or policy engine is authorized | TKG-T1 claim boundary | DEFER |
| evidence database absence | low because Enterprise Evidence Pack covers current packet use | Enterprise Evidence Pack | DEFER |
| AGT/Truth Kernel runtime import | high if reopened without contract/code alignment | TKG-T0/TKG-T1 parked boundaries | REJECT_FOR_THIS_CHAIN |

## T2 Decision

Decision: `RECONCILED_OWNER_SURFACES_WITH_T3_CLAIM_GUARD_PLAN_CANDIDATE`

The highest-value next candidate is a documentation-only TKG-T3 plan for a
small static claim-boundary guard. The plan should define whether a future
checker should catch:

- hash, receipt, approval, or commit evidence overclaimed as truth;
- LLM or reviewer output used as sole verification for hard claims;
- external input treated as CVF authority without a CVF owner surface;
- important truth-foundation claims missing an explicit provenance label.

T2 does not authorize that checker. It only records that the checker-plan
candidate has better near-term value than adding a database, registry, runtime,
MCP gateway, package import, or AGT/Truth Kernel adapter.

## Future Candidate Matrix

| Candidate | Value | Prerequisite | T2 route |
|---|---|---|---|
| TKG-T3 Truth Foundation Static Claim Guard Plan | defines a bounded checker candidate before implementation | this matrix and TKG-T1 contract | RECOMMENDED_NEXT |
| TKG-T4 Static checker implementation | catches one or more TKG-T3-approved claim-language classes | TKG-T3 plan plus fresh GC-018 | DEFER |
| Evidence record schema/checker | useful only after field reconciliation becomes a concrete packet need | source-verified schema owner and GC-018 | DEFER |
| Obligation registry design | useful only when policy/runtime work needs tracked obligations | explicit operator requirement and fresh GC-018 | DEFER |
| Truth Kernel runtime/package import | product/runtime capability, not owner-surface reconciliation | explicit operator authorization, source verification, tests, and live proof plan | REJECT_FOR_THIS_CHAIN |
| AGT MCP gateway or hypervisor | runtime enforcement capability, not T2 documentation | separate runtime/operator requirement and live proof if behavior is claimed | REJECT_FOR_THIS_CHAIN |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | External repo or copied folder |
| Chain map route | External repo or copied folder -> Root/folder lifecycle classification plus absorption map when retained -> CVF-owned reference contract -> ABSORB, ADAPT, DEFER, REJECT, or BLOCK |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | `docs/reference/truth_foundation/CVF_TRUTH_FOUNDATION_OWNER_SURFACE_RECONCILIATION_MATRIX.md` |
| Disposition | ADAPT TKG-T1 truth-foundation doctrine into a CVF owner-surface reconciliation matrix |
| Claim boundary | external materials remain inputs; this matrix cites CVF-owned owner surfaces and current local guards only |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this reconciliation matrix | may use for future dispatch/source-verification routing and TKG-T3 planning | Source Verification Block, Reconciliation Matrix, and Field Ownership Matrix | N/A with reason: documentation reference only | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future public-safe or adapter truth-foundation readout | no external interface, MCP tool, CLI command, or public package behavior is created | deferred by this matrix and TKG-T1 | separate GC-018/source-verified work order required | `DEFERRED_WITH_REASON` |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reconciliation over current CVF truth and evidence
owner surfaces. Public wording requires a separate public-sync decision.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | TKG-T2 truth foundation owner-surface reconciliation matrix |
| claimDisposition | N/A with reason: reference matrix only |
| receiptEvidence | N/A with reason: no runtime receipt or execution-control claim |
| actionEvidence | ACTION_EVIDENCE_PRESENT - owner-surface matrix authored from TKG-T1 and current CVF owner surfaces |
| invocationBoundary | local governed documentation authoring |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | reference/matrix language only |
| forbiddenExpansion | no Truth Kernel runtime, AGT runtime, MCP gateway, hypervisor, evidence database, obligation registry runtime, verifier service, provider/live proof, public-sync, adapter, package activation, certification, generated aggregate, or MPI-T6 runtime |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | `tkg-t2-truth-foundation-owner-surface-reconciliation-2026-06-28` |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, rg, Select-String, Get-Content, apply_patch, governance gates |
| Target paths | `docs/reference/truth_foundation/CVF_TRUTH_FOUNDATION_OWNER_SURFACE_RECONCILIATION_MATRIX.md`; `docs/reference/truth_foundation/README.md` |
| Allowed scope source | operator approved next tranche after TKG-T1 contract promotion |
| Before status evidence | baseHead `fab9a28d`; worktree clean before patch |
| After status evidence | TKG-T2 matrix added and truth foundation front door updated |
| Diff evidence | `git diff --name-status fab9a28d..HEAD` |
| Approval boundary | documentation-only owner-surface reconciliation |
| Claim boundary | no runtime, provider/live, public-sync, generated aggregate, checker, adapter, package activation, certification, MCP gateway, hypervisor, circuit breaker, evidence database, obligation registry runtime, SOT index runtime, verifier service, or Truth Kernel package import |
| Agent type | single-agent dispatcher/implementer/reviewer/closer |
| Invocation ID | `tkg-t2-owner-surface-reconciliation-2026-06-28` |
| Expected manifest | this matrix plus truth foundation README pointer |
| Actual changed set | this matrix plus truth foundation README pointer |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename in this tranche |

## Claim Boundary

This matrix is documentation-only owner-surface reconciliation. It does not
implement or authorize AGT runtime governance, MCP gateway interception,
hypervisor execution rings, circuit breakers, Truth Kernel runtime, evidence
database, obligation registry runtime, SOT index runtime, independent verifier
service, provider/live proof, public-sync export, CLI/MCP adapter, package
activation, certification, generated aggregate, checker mutation, or
production/hosted readiness.
