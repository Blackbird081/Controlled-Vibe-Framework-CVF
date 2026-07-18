# CVF Package Skill Productionization SOP

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-30

docType: reference_sop

Batch ID: PKGSOP-T1

## Purpose

Define the standard operating procedure for moving skill value from external
repositories or CVF Learning Plane outputs into CVF-owned ASSF package skills,
then into bounded runtime package skills and production-scoped runtime package
skills.

This SOP is the process spine for future package-skill scale-up. It does not
convert more packages, mutate lifecycle sources, run a provider, implement a
new adapter, or claim public readiness by itself.

## Scope Boundary

In scope:

- external repository or copied-folder skill intake;
- Learning Plane or finding-to-governance package candidate intake;
- ASSF metadata candidate creation;
- package-root creation;
- UAT, certification, and internal runtime eligibility;
- SKSOT truth-packet creation;
- explicit package usage receipt tracing;
- active resolver, CLI/MCP projection, use-proof, and production runtime
  promotion gates;
- evidence required before scaling beyond the first six production package
  skills.

Out of scope:

- automatic package conversion;
- direct import of external skill code as CVF runtime authority;
- package activation without UAT, certification, truth packet, and receipts;
- full MCP server, daemon, queue, hook, or IDE bridge;
- production Model Gateway/model router;
- provider registry mutation;
- public-sync or public catalog export.

## Central Core

CVF owns the package skill. External repos, provider skills, Learning Plane
signals, and model outputs are inputs only. They become CVF authority only after
source verification, CVF-owner mapping, ASSF source record creation, governed
review, and machine-checkable evidence.

No phase may skip the source-of-truth trail. A package skill that cannot show
its source mirror or learning input, registry record, package root, truth
packet, usage receipt policy, adapter evidence, and production proof must stop
at the last proven lifecycle state.

## End-To-End Phase Ladder

| Phase | Entry input | Required action | Exit state | Required evidence | Forbidden expansion |
|---|---|---|---|---|---|
| P0 intake route | external repo, copied folder, legacy folder, external-agent output, or Learning Plane signal | classify input and owner surface | `INTAKE_CLASSIFIED` | chain-map route, source mirror or learning record, disposition | no package source, runtime, provider, or public claim |
| P1 source authority | high-value external repo or learning source | pin source mirror or cite governed learning artifact | `SOURCE_AUTHORITY_READY` | source mirror index row, pinned commit, or Learning Plane closure artifact | no derived pack promoted as upstream authority |
| P2 value conversion | read corpus or learning item | map value to package, runtime, checker, or doctrine lane | `PACKAGE_CANDIDATE_READY` or parked disposition | absorption ledger, value conversion matrix, owner-surface map | no direct import or hidden deferred value |
| P3 ASSF metadata candidate | accepted package candidate | create registry metadata-only entry | `CANDIDATE` | registry source entry, generated index check, sourceArtifacts | no `SKILL.md` runtime body |
| P4 package root proposal | approved package concept | create package root and compact source | `PROPOSED` | `SKILL.md`, `skill.source.json`, package anatomy check | no UAT, certification, or runtime use claim |
| P5 controlled package approval | package root with source evidence | complete UAT, certification, and internal disposition | `APPROVED` | UAT/review artifacts, certified metadata admission, runtime eligibility audit | no ACTIVE production claim |
| P6 truth packet | runtime-eligible package | create or update SKSOT packet | `TRUTH_APPROVED` | truth packet, generated truth index, SKSOT checker | no package output use without receipt |
| P7 usage receipt readiness | explicit body-read candidate | verify loader receipt path | `USAGE_RECEIPT_READY` | `CVF_ASSF_SKILL_USAGE_RECEIPT`, policy state evidence | no automatic invocation telemetry |
| P8 resolver and projection | approved truth-backed package | expose resolver/projection decisions | `ACTIVATION_READY` | active resolver, activation policy, CLI/MCP projection evidence | no external body read unless authorized |
| P9 use-proof | selected package with receipt path | run dry proof and live provider proof when behavior is claimed | `USE_PROOF_PASSED` | use-proof receipt, live diagnostic, HTTP status when live | no unclear rerun without diagnostic |
| P10 production package runtime | active source record with adapter evidence | execute through production executor and CLI/MCP envelope | `ACTIVE_PRODUCTION_RUNTIME` | production execution receipt, sourceTruthTrace, live proof | no action authority from loading alone |
| P11 scale-up operation | more package batches | repeat P0-P10 per batch with fresh scope | `SCALE_READY_WITH_LIMITS` | batch GC-018, work order, tests, gates, receipts | no bulk activation by analogy |

## External Repository Intake SOP

1. Start with the external knowledge absorption chain map.
2. If the upstream repository is high-value and reachable, use the source
   mirror discipline and pin the upstream commit.
3. Enumerate the corpus and record a processing ledger.
4. Create the External Absorption Value Conversion Matrix.
5. Map each package-worthy item to `PACKAGE_CANDIDATE` or
   `RUNTIME_CANDIDATE`.
6. Create ASSF metadata only after source authority and owner surface are
   clear.
7. Keep derived external-agent packs as secondary interpretation, not upstream
   fact authority.

Minimum closeout evidence:

- source mirror index row or blocked-source-mirror reason;
- manifest and processing ledger;
- package/runtime/checker value conversion matrix;
- Source Verification Block before registry mutation;
- generated skill-index check.

## Learning Plane Intake SOP

Learning Plane output may propose a package candidate, but it is not enough to
activate a package.

The dispatcher must:

1. identify the learning signal source artifact;
2. classify it through Finding-To-Governance Learning Disposition;
3. route package-worthy value to `PACKAGE_CANDIDATE` or `RUNTIME_CANDIDATE`;
4. open a fresh GC-018 and source-verified work order before package source
   creation;
5. convert the learning value into CVF package language rather than storing a
   provider-memory-only lesson;
6. require the same P3-P10 evidence ladder as external repository candidates.

Learning Plane signals may shorten discovery. They may not bypass source
verification, UAT, certification, truth packets, usage receipts, live proof, or
production runtime admission.

## Lifecycle Admission Checklist

| Lifecycle state | Required before setting state | Blocking condition |
|---|---|---|
| `CANDIDATE` | source-backed concept, registry entry, generated index | no source authority or owner surface |
| `PROPOSED` | package root, compact source, anatomy pass | missing `SKILL.md` or `skill.source.json` |
| `APPROVED` | UAT passed, certification passed, internal disposition implemented | UAT or certification absent |
| `ACTIVE` | production runtime standard, external adapter implemented when external use is claimed, truth packet updated | adapter evidence absent or no production proof |
| `DEPRECATED` | successor or retirement reason | no successor/retirement boundary |
| `RETIRED` | no longer selectable and closure evidence retained | unresolved dependency |

## Runtime Package Production Admission

A package is production-scale only when all of these are true:

- registry `status=ACTIVE`;
- package source `lifecycleState=ACTIVE`;
- `uatState=PASSED`;
- `certificationState=CERTIFIED`;
- `internalAgentDisposition=IMPLEMENTED`;
- `externalCliMcpDisposition=IMPLEMENTED` if external CLI/MCP use is claimed;
- `adapterContract` and `adapterEvidence` cite governed sources;
- SKSOT packet is `STRICT`, approved, and in generated truth index;
- runtime loader emits usage receipt for explicit body read;
- activation policy state is receipt-backed;
- use-proof adapter has dry proof and live proof when provider behavior is
  claimed;
- production executor emits production execution receipt;
- CLI/MCP envelope returns source-truth trace for external-agent use;
- no package loading path grants filesystem, git, browser, public-sync,
  provider registry, merge, push, or downstream action authority by itself.

## Required Evidence Matrix

| Evidence family | Required artifact or command | Owner phase |
|---|---|---|
| Source authority | `.private_reference/source_mirrors/INDEX.md` or governed learning source | P1 |
| External absorption | External Absorption Core and value conversion matrix | P2 |
| Metadata candidate | registry entry and generated skill index | P3 |
| Package root | `SKILL.md`, `skill.source.json`, package anatomy check | P4 |
| UAT and certification | governed UAT/review artifacts and certified metadata admission | P5 |
| Truth packet | packet JSON, generated truth index, SKSOT checker | P6 |
| Usage receipt | runtime package loader receipt | P7 |
| Resolver and projection | active resolver, activation policy, CLI/MCP projection checks | P8 |
| Use-proof | package use-proof receipt and live diagnostic when applicable | P9 |
| Production execution | production executor and CLI/MCP adapter receipts | P10 |
| Closure | pre-dispatch, pre-implementation, commit-steward, pre-closure split ranges | all governed batches |

## Six-Package Production Baseline

As of ASCP-P1-P3, the first production-scoped runtime package set is:

| Skill id | Production disposition |
|---|---|
| `cvf-engineering-code-review-quality` | ACTIVE production runtime |
| `cvf-engineering-debugging-error-recovery` | ACTIVE production runtime |
| `cvf-engineering-planning-task-breakdown` | ACTIVE production runtime |
| `cvf-engineering-security-hardening` | ACTIVE production runtime |
| `cvf-engineering-spec-driven-development` | ACTIVE production runtime; representative live proof |
| `cvf-engineering-test-driven-development` | ACTIVE production runtime |

Future packages must repeat the phase ladder. The six-package baseline is proof
of the process, not permission for bulk activation by similarity.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| External repo intake must route through chain-map classification and fresh GC-018/work order before governed action | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` | Mandatory Chain | `Runtime/provider/MCP/readiness claim` | external knowledge absorption chain map | LITERAL_INVARIANT | ACCEPT |
| High-value external repo facts prefer pinned source mirrors | `.private_reference/source_mirrors/INDEX.md` | Mirror Ledger; Selection Rule | `addyosmani__agent-skills` | source mirror index | VALUE_SET | ACCEPT |
| Package lifecycle vocabulary includes `CANDIDATE`, `PROPOSED`, `APPROVED`, and `ACTIVE` | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Risk And Lifecycle Fields | `ACTIVE` | ASSF package contract | LITERAL_INVARIANT | ACCEPT |
| Runtime-eligible truth packets require approved source and runtime eligibility fields | `docs/reference/agent_system_skills/CVF_SKILL_SOURCE_OF_TRUTH_PACKET_STANDARD.md` | Runtime Eligibility Binding | `RUNTIME_PACKAGE_ELIGIBLE` | SKSOT standard | LITERAL_INVARIANT | ACCEPT |
| Explicit package body reads must leave `CVF_ASSF_SKILL_USAGE_RECEIPT` evidence | `docs/reference/agent_system_skills/CVF_SKILL_USAGE_RECEIPT_TRACE_STANDARD.md` | Receipt Source | `CVF_ASSF_SKILL_USAGE_RECEIPT` | skill usage receipt trace standard | LITERAL_INVARIANT | ACCEPT |
| Production runtime admission requires ACTIVE source and receipt-backed executor path | `docs/reference/agent_system_skills/CVF_ASSF_PRODUCTION_PACKAGE_RUNTIME_STANDARD.md` | Production Lifecycle Admission; Runtime Execution Contract | `CVF_ASSF_PRODUCTION_PACKAGE_EXECUTION_RECEIPT` | production package runtime standard | LITERAL_INVARIANT | ACCEPT |
| Learning findings must be routed to governance or runtime-learning dispositions | `docs/reference/CVF_FINDING_TO_GOVERNANCE_LEARNING_TRIGGER_STANDARD.md` | Protocol | `RUNTIME_BEHAVIOR_LEARNING` | finding-to-governance learning standard | LITERAL_INVARIANT | ACCEPT |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | SOP reader and future package dispatcher | may use this SOP to plan governed package work | this SOP and source verification | no runtime adapter created | `REFERENCE_ONLY` |
| `INTERNAL_AGENT` | production executor for already ACTIVE packages | may execute only through receipt-backed production executor | ASCP-P1-P3 production standard and completion evidence | action authority remains outside package loading | `IMPLEMENTED_FOR_EXISTING_SIX` |
| `EXTERNAL_AGENT_CLI_MCP` | production CLI/MCP envelope for already ACTIVE packages | may consume bounded envelope and sourceTruthTrace only | ASCP-P1-P3 CLI/MCP adapter evidence | no full MCP server or daemon | `IMPLEMENTED_FOR_EXISTING_SIX` |
| `EXTERNAL_AGENT_CLI_MCP` | future packages | no external use until adapter evidence exists | future GC-018/work order required | no body read or production envelope by analogy | `DEFERRED_WITH_REASON` |

## CVF Skill Usage Receipt Trace

| Field | Value |
|---|---|
| Usage disposition | NOT_USED_WITH_REASON |
| CVF skill id | N/A with reason: this SOP defines the package-skill production process and does not consume package output |
| Package root | N/A with reason: this SOP does not load a package body |
| Invocation context | SOP authoring only |
| Receipt evidence | N/A with reason: no new skillUsageReceipt output consumed by this SOP |
| Output consumed by CVF | N/A with reason: none |
| Truth packet or source path | `docs/reference/agent_system_skills/CVF_SKILL_SOURCE_OF_TRUTH_PACKET_STANDARD.md` |
| Authority boundary | this SOP does not grant authority; future package use receipts do not grant authority |

## External Provider Skill Usage Trace

| Field | Value |
|---|---|
| Usage disposition | NOT_USED_WITH_REASON |
| Provider skill name | N/A with reason: no external/provider-owned skill output was consumed |
| Provider owner | N/A with reason: no provider-owned skill output consumed |
| Invocation context | SOP authoring only |
| Output consumed by CVF | N/A with reason: none |
| CVF source-of-truth promotion path | N/A with reason: no provider skill output promoted |
| Evidence artifact | this SOP and governed source standards |
| Authority boundary | provider-owned skill output is not CVF canonical authority without governed promotion |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | Runtime/provider/MCP/readiness claim |
| Chain map route | local CVF skill-control SOP -> source verification -> no external knowledge promotion |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | this SOP, paired baseline, work order, and completion review |
| Disposition | REJECT_DIRECT for external intake promotion; this SOP uses repo-local CVF source verification only |
| Claim boundary | external repositories and provider skills remain input sources, not CVF authority |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this SOP references private source mirrors, internal ASSF package
runtime, truth packets, and live-provider proof receipts. Public-safe export
requires separate public-sync authorization.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex dispatcher/implementer/reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | PKGSOP-T1 package skill productionization SOP, 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | source reads, apply_patch, governance gates |
| Target paths | this SOP; PKGSOP-T1 baseline, work order, and completion review |
| Allowed scope source | operator request to systematize package-skill path from external repos and Learning Plane into production-scale runtime package skills |
| Before status evidence | ASCP-P1-P3 closed at `43e4092f` with 6 ACTIVE runtime package skills |
| After status evidence | SOP defines reusable phase ladder without mutating package lifecycle source |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | SOP/reference documentation only |
| Claim boundary | no new runtime behavior, provider call, package activation, public-sync, or production-readiness expansion |
| Agent type | dispatcher/implementer/reviewer/closer |
| Invocation ID | `pkgsop-t1-package-skill-productionization-sop-2026-06-30` |
| Expected manifest | SOP reference, baseline, work order, completion review |
| Actual changed set | SOP reference, baseline, work order, completion review |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This SOP standardizes the package-skill productionization process. It does not
convert remaining packages, add runtime adapters, mutate lifecycle records,
consume package output, call providers, implement Model Gateway/model router
behavior, public-sync, or grant action authority from package loading alone.
