# CVF ASSF Package Contract

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-29

docType: reference

Batch ID: ASSF-T1 (AGSK-T4 field repair 2026-06-29)

rawMemoryReleased=false

## Purpose

Define the canonical contract for future CVF agent system-skill packages.
This contract reconciles the existing CVF Skill Spec with the accepted
ASSF-T0.1 legacy absorption ledger so later ASSF tranches can build package
sources, a generated index, a progressive resolver, learning promotion, and
adapter projections without creating competing skill definitions.

## Scope / Applies To

This document applies to future CVF-owned system-skill packages used by
internal agents and, after separate authorization, external CLI/MCP consumers.

This document is contract-definition-only. It describes the expected
`SKILL.md` profile, compact machine source schema, storage topology, and
adapter boundary. It does not create package instances, `SKILL.md`,
`skill.source.json`, a generated index, a resolver, an example package,
runtime behavior, CLI/MCP adapter behavior, provider/live proof, public-sync,
activation, readiness, or automatic promotion.

Reviewer note: the stable reference-family front door
`docs/reference/agent_system_skills/README.md` is a guard-required folder
index. It is not a package root, resolver, registry, generated index, or active
skill artifact.

## SKILL.md Profile

`SKILL.md` is the human-readable package front door loaded only after a
metadata-first resolver selects a package. It must not be used as the first
global library read.

Required profile sections:

| Section | Required content | Source reconciliation |
|---|---|---|
| Purpose | when the skill is useful and when it is not | CVF Skill Spec Intent Layer |
| Invocation boundary | allowed task classes, roles, phases, and surfaces | CVF Skill Spec Authority Mapping |
| Inputs and outputs | concrete input contract, output contract, and acceptance evidence | CVF Skill Spec Capability Layer |
| Risk and authority | risk class, authority ceiling, side effects, rollback, and safe stop | CVF Skill Spec Risk Profile |
| Progressive disclosure | what metadata can be read before full instructions, and what requires selection | T0.1 ADK SkillToolset progressive disclosure row |
| Evidence and UAT | required logs, validation hooks, UAT binding, and review evidence | CVF Skill Spec Audit and Traceability; Autonomous Extension |
| External disposition | whether external CLI/MCP projection is prohibited, deferred, contract-only, or implemented by a later adapter | Dual Agent Surface Accounting Standard |

## Compact Machine Source Schema

Future packages must use a compact machine-readable source file owned by a
later ASSF tranche. T1 defines the schema only; it does not create
`skill.source.json`.

Required field families:

| Field family | Canonical fields | Required? | Source reconciliation |
|---|---|---:|---|
| Identity | `skillId`, `name`, `version`, `owner`, `status`, `canonicalRoot` | yes | CVF Skill Spec Skill Identity; roadmap Candidate Package Contract |
| Provenance | `originLane`, `sourceArtifacts`, `legacyRows`, `license`, `reviewArtifacts` | yes | roadmap Candidate Package Contract; T0.1 ledger |
| Purpose and trigger | `purpose`, `triggerPatterns`, `taskClasses`, `useWhen`, `doNotUseWhen`, `riskTriggers` | yes | CVF Skill Spec Intent Layer; Hermes trigger pattern; AGSK-T4 |
| Selectors | `roles`, `phases`, `surfaces`, `riskCeiling`, `contextProfile` | yes | CVF Skill Spec Authority Mapping; Workflow GoClaw activation profile |
| Capability | `inputs`, `outputs`, `executionConstraints`, `acceptanceEvidence` | yes | CVF Skill Spec Capability Layer |
| Risk and authority | `riskProfile`, `authorityCeiling`, `sideEffects`, `permissions`, `rollback`, `safeStop` | yes | CVF Skill Spec Risk Profile; HF risk and policy fields |
| Lifecycle | `candidateState`, `approvalState`, `uatState`, `certificationState`, `deprecation`, `successor`, `retirement` | yes | Memento governed evolution; product skill lifecycle |
| Composition | `dependencies`, `conflicts`, `compositionOrder`, `capabilityBoundary` | yes | roadmap Candidate Package Contract |
| Internal disposition | `internalAgentDisposition`, `resolverBehavior`, `loaderBoundary` | yes | dual-agent standard |
| External disposition | `externalCliMcpDisposition`, `adapterContract`, `adapterEvidence`, `externalMutationBoundary` | yes | dual-agent standard; T0.1 CLI/MCP rows |
| Platform | `platformCompatibility`, `shellAssumptions`, `osConstraints` | yes | Windows Skill Normalization |
| Efficiency metadata | `verbosityMode`, `minimumTraceRequirement`, `contextAppetite`, `compressionTolerance`, `modelTierPreference` | optional | caveman efficiency profile |

## Identity And Authority Fields

| Field | Meaning | Rule |
|---|---|---|
| `skillId` | stable package identifier | must be unique in the future generated index |
| `name` | human-readable package name | must not imply runtime authority |
| `version` | semantic package version | changed through governed review |
| `owner` | CVF owner surface or role | must be a CVF-governed owner, not a provider-local memory file |
| `status` | lifecycle state | allowed states are defined below |
| `authorityCeiling` | maximum action authority the package can request | loading a skill never raises this ceiling |
| `allowedRoles` | roles that may use the package | must map to CVF roles, not provider names |
| `allowedPhases` | lifecycle phases where the package may be used | must be explicit |
| `forbiddenContexts` | contexts where the package must not be used | required for all R1+ packages |

## Risk And Lifecycle Fields

Package lifecycle states:

| State | Meaning |
|---|---|
| `CANDIDATE` | source-backed candidate, not usable as active package |
| `PROPOSED` | contract/source authored and awaiting review |
| `APPROVED` | accepted for controlled use but not broadly active |
| `ACTIVE` | selected for governed resolver/index use |
| `DEPRECATED` | retained with successor or warning |
| `RETIRED` | no longer selectable |
| `REJECTED` | not accepted as CVF-owned package |

Risk fields:

| Field | Rule |
|---|---|
| `riskClass` | must map to CVF risk/authority controls |
| `sideEffects` | must list filesystem, git, network, provider, public, or human-impact side effects |
| `permissions` | must state explicit allowed tools/actions |
| `rollback` | required for mutating or external-impact packages |
| `safeStop` | required for every package |
| `policyBindings` | required when a package can affect runtime or external behavior in later tranches |
| `riskTriggers` | zero-or-more list of CVF-normalized pattern labels that identify input or context conditions requiring elevated risk scrutiny; each entry is a trigger string optionally associated with an escalated risk class or a required approval note; `riskTriggers` is documentation-only guidance and must not raise the package authority beyond `authorityCeiling` or bypass `riskCeiling`; sourced from AGSK-T4 (advisory; no runtime enforcement until a separate checker or resolver tranche is authorized) |

## Composition And Dependency Fields

Future package composition must be deterministic and bounded.

| Field | Rule |
|---|---|
| `dependencies` | packages or standards that must be selected first |
| `conflicts` | packages or contexts that cannot be combined |
| `compositionOrder` | deterministic order when multiple packages are selected |
| `capabilityBoundary` | capabilities that remain forbidden even when dependencies load |
| `evidenceRequirements` | receipts, tests, or review artifacts needed for use |

No composition rule may grant additional role, phase, filesystem, git,
provider, live, public, or external-adapter authority.

## Internal-Agent And External-Agent CLI/MCP Disposition Fields

| Field | Allowed values | Rule |
|---|---|---|
| `internalAgentDisposition` | `CONTRACT_ONLY`, `IMPLEMENTED`, `DEFERRED_WITH_REASON`, `N/A_WITH_REASON` | records internal resolver/loader status |
| `externalCliMcpDisposition` | `CONTRACT_ONLY`, `IMPLEMENTED`, `DEFERRED_WITH_REASON`, `N/A_WITH_REASON`, `PROHIBITED` | records external adapter status |
| `adapterContract` | path or N/A with reason | required before `IMPLEMENTED` |
| `externalMutationBoundary` | text | required for any external-facing projection |
| `adapterEvidence` | review/test/public-sync proof or N/A with reason | required before any implemented adapter claim |

For ASSF-T1, external CLI/MCP status is `DEFERRED_WITH_REASON`.

## Provider Adapter Boundary

Provider, CLI, MCP, IDE, or runtime adapters are projections of the canonical
package contract. They are never canonical package authority.

Adapter boundary rules:

- adapter fields may not invent package identity, owner, authority, or risk;
- adapter exports must cite the canonical package source and generated index;
- external adapter behavior requires a separate GC-018, work order, tests, and
  closure review;
- provider-local files and memories are not source authority;
- external consumers must receive only fields explicitly approved for export;
- adapter loading must not imply package activation.

## Storage Topology

Future ASSF-T2/T6/T7 work may create this topology only through separate
source-verified authorization:

```text
docs/reference/agent_system_skills/
  README.md
  packages/
    <skill-id>/
      SKILL.md
      skill.source.json
      agents/
      references/
      scripts/
  registry/
    entries/
  generated/
    skill-index.json
```

T1 creates this contract document and the guard-required folder README front
door only. It does not create `packages/`, `registry/`, `generated/`,
`SKILL.md`, `skill.source.json`, or an example package.

## CVF Skill Spec Reconciliation Table

| CVF Skill Spec source | Contract field or section | Disposition |
|---|---|---|
| Skill Identity: Skill ID | `skillId` | ABSORBED |
| Skill Identity: Skill Name | `name` | ABSORBED |
| Skill Identity: Version | `version` | ABSORBED |
| Skill Identity: Owner | `owner` | ABSORBED |
| Intent Layer: problem and decisions supported | `purpose`, `useWhen`, `doNotUseWhen` | ABSORBED |
| Capability Layer: actions, inputs, outputs, constraints | `inputs`, `outputs`, `executionConstraints`, `acceptanceEvidence` | ABSORBED |
| Risk Profile: primary/secondary risks, failure handling, safe stop | `riskProfile`, `rollback`, `safeStop` | ABSORBED |
| Authority Mapping: roles, phases, preconditions, forbidden contexts | `allowedRoles`, `allowedPhases`, `prerequisites`, `forbiddenContexts` | ABSORBED |
| Audit and Traceability: logs, decision references, validation hooks | `sourceArtifacts`, `reviewArtifacts`, `evidenceRequirements` | ABSORBED |
| Autonomous Extension | `uatState`, `certificationState`, `policyBindings`, `validationHooks` | ABSORBED_FOR_AUTONOMOUS_OR_MUTATING_PACKAGES |
| Skill Classification: Assistive/R0 | `riskClass=R0`, read-only packages | ABSORBED |
| Skill Classification: Advisory/R1 | `riskClass=R1`, human-confirmed advisory packages | ABSORBED |
| Skill Classification: Executable/R2 | `riskClass=R2`, bounded-action packages requiring explicit invocation | ABSORBED_WITH_EXTRA_AUTHORITY_CONTROLS |
| Skill Classification: Analytical/R3 | `riskClass=R3`, multi-step packages requiring stricter evidence | ABSORBED_WITH_EXTRA_AUTHORITY_CONTROLS |

## ASSF-T0.1 Ledger Consumption Table

| T0.1 candidate | T0.1 disposition | Contract field or disposition | T1 result |
|---|---|---|---|
| ADK SkillToolset notes | `ABSORB_AS_LIFECYCLE_INPUT` | `resolverBehavior`, progressive disclosure profile | ABSORBED |
| Windows Skill Normalization notes | `ABSORB_AS_CONTRACT_INPUT` | `platformCompatibility`, `shellAssumptions`, `osConstraints` | ABSORBED |
| ADDING CVF Skill Formation Layer notes | `ABSORB_AS_PACKAGE_PATTERN` | `SKILL.md` profile and storage topology | ABSORBED_AS_PATTERN |
| Formation Layer `CVF_SKILL_MODEL.md` | `ABSORB_AS_CONTRACT_INPUT` | lifecycle creation rule and authority boundary | ABSORBED |
| Skill Creator `CVF_SKILL_MODEL.md` | `ABSORB_AS_CONTRACT_INPUT` | candidate definition, reconciled with stricter Formation Layer rule | ABSORBED_WITH_CONSTRAINT |
| Skill Registry | `ABSORB_AS_TOOL_ADAPTER_INPUT` | `externalCliMcpDisposition`, `adapterContract`, registry concept deferred | DEFERRED_TO_T7 |
| HowtoClaude normalization schema | `ABSORB_AS_LIFECYCLE_INPUT` | intake-to-normalization lifecycle | ABSORBED |
| HF Skill Absorption Spec | `ABSORB_AS_LIFECYCLE_INPUT` | candidate intake invariants, no direct trust, traceability | ABSORBED |
| HF Skill Normalization Schema | `ABSORB_AS_CONTRACT_INPUT` | identity, risk, policy, sandbox, trace fields | ABSORBED |
| Hermes Skill Package Model | `ABSORB_AS_PACKAGE_PATTERN` | trigger patterns, maturity, registry status | ABSORBED |
| Workflow GoClaw activation profile | `ABSORB_AS_LIFECYCLE_INPUT` | selector profile and resolver constraints | ABSORBED_FOR_T4 |
| caveman efficiency profile | `ABSORB_AS_CONTRACT_INPUT` | optional efficiency metadata | ABSORBED_OPTIONAL |
| gridex W7 binding | `ABSORB_AS_TOOL_ADAPTER_INPUT` | W7/domain adapter field candidate | DEFERRED_PENDING_OPERATOR_DECISION |
| CLI-Anything notes | `ABSORB_AS_TOOL_ADAPTER_INPUT` | CLI discoverability and structured-output adapter candidate | DEFERRED_TO_T7 |
| Memento skill evolution packet | `ABSORB_AS_LIFECYCLE_INPUT` | candidate evolution, review, UAT, reinjection controls | ABSORBED |
| `BLOCKED_UNVERIFIED_SOURCE` rows | blocked in T0.1 | no direct contract authority | DEFERRED_UNTIL_SOURCE_VERIFIED |
| `REFERENCE_ONLY` and zero-keyword rows | reference-only | no contract field | REJECT_DIRECT_FOR_T1 |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | canonical package contract for future resolver and loader | contract only; no loader, resolver, package source, or activation behavior is implemented by T1 | CVF Skill Spec reconciliation table and T0.1 ledger consumption table | no adapter implemented | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future CLI/MCP package discovery or load adapter | external disposition is defined, but no external adapter or export is implemented | external disposition fields and T0.1 CLI/MCP candidate rows | adapter work requires separate GC-018/work order | `DEFERRED_WITH_REASON` |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | ASSF-T1 package contract reference document only |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE - contract definition, no runtime execution |
| receiptEvidence | N/A with reason: no runtime receipt or provider call |
| actionEvidence | ACTION_EVIDENCE_PRESENT - reconciliation tables and source-backed contract fields |
| invocationBoundary | local documentation authoring under worker-return lane |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | defines the future package contract and storage topology |
| forbiddenExpansion | no package root beyond this file's parent, `SKILL.md`, `skill.source.json`, generated index, resolver, example package, migration, runtime/provider/live, public-sync, active skill, or CLI/MCP adapter implementation |

## Epistemic Process Block

### Expected Result / Prediction

A valid ASSF-T1 contract should reconcile the existing CVF Skill Spec with the
ASSF-T0.1 legacy absorption ledger, define package metadata and storage
contract fields, and avoid creating active package/runtime behavior.

### Evidence Comparison

The contract maps the CVF Skill Spec sections and classification classes,
consumes the T0.1 `ABSORB_AS_*` rows into field families or explicit deferrals,
and defines internal/external agent disposition fields without creating a
resolver, generated index, package source, or adapter.

### Contradiction Or Gap Disposition

The original worker manifest omitted the guard-required folder README for the
new `docs/reference/agent_system_skills/` family. Reviewer closure treats that
README as a storage-layout front door only, not as package activation or package
source implementation.

### Claim Update

The ASSF-T1 claim remains contract-definition-only. Follow-up tranches must
still separately authorize package source files, generated index, resolver,
activation profile, adapter projection, and public-sync work.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | ASSF-T1 worker/reviewer closure (Codex) |
| Provider or surface | local workspace |
| Session or invocation | ASSF-T1 contract authoring and reviewer guard repair, 2026-06-23 |
| Working directory | repository root |
| Command or tool surface | source reads, autorun gates, apply_patch, local governance gates |
| Target paths | this contract; `docs/reference/agent_system_skills/README.md`; worker return and reviewer completion packet |
| Allowed scope source | ASSF-T1 work order plus guard-required foundation README repair |
| Before status evidence | material closure began from session-synced HEAD `f79853a4` |
| After status evidence | contract plus guard front door prepared for reviewer closure |
| Diff evidence | `git diff --check`; worker-return fast/reviewer-fast gates |
| Approval boundary | operator allowed Codex to fix minor review-friction findings and commit after review |
| Claim boundary | contract-definition-only; no package implementation or activation |
| Agent type | worker/reviewer/closer |
| Invocation ID | `cvf-assf-t1-canonical-package-contract-closure-2026-06-23` |
| Expected manifest | package contract, folder README front door, worker return, reviewer completion updates |
| Actual changed set | pending reviewer closure diff |
| Manifest delta | README front door added to satisfy foundation storage layout guard |
| Deletion or rename disposition | N/A with reason: none |

## Claim Boundary

This document is the ASSF-T1 active reference contract after reviewer
acceptance. It does not create or activate any system-skill package, generated
index, resolver, package root contents, external adapter, runtime behavior,
provider behavior, live proof, public artifact, or readiness claim.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this contract consumes private ASSF-T0.1 legacy absorption evidence.
Public-safe skill architecture output requires a separate redaction and
public-sync authorization.
