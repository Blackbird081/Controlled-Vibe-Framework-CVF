# CVF ASSF External Agent Readout / CLI-MCP Adapter Boundary Contract

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-26

docType: reference_contract

Batch ID: ASSF-EAR-CLI-MCP-T1-T3

## Purpose

Define the metadata-only readout boundary for external agents and the minimum
admission criteria for any future CLI/MCP adapter that consumes ASSF package
metadata.

## Scope

This contract is documentation authority for future planning. It does not
create a CLI command, MCP tool, Web API route, provider route, package
instance, resolver behavior, generated index mutation, or external-agent
runtime behavior.

## Readout Field Allowlist

An external-agent readout may expose only these field families before an
adapter implementation work order exists:

| Field family | Allowed fields | Boundary |
|---|---|---|
| identity | `skillId`, `name`, `version`, `canonicalRoot` | metadata only |
| lifecycle display | `candidateState`, `uatState`, `certificationState`, `reviewArtifacts` | read-only; no lifecycle mutation |
| authority display | `authorityCeiling`, `riskCeiling`, `riskProfile`, `capabilityBoundary` | no role or permission grant |
| adapter posture | `externalCliMcpDisposition`, `adapterContract`, `adapterEvidence`, `externalMutationBoundary` | posture only; not implementation |
| provenance | `sourceArtifacts`, `originLane`, `license` | repo-local references only |

Denied before a separate adapter work order:

- package instruction body loading;
- `SKILL.md` execution;
- provider call or live proof;
- mutation of registry, generated index, resolver, lifecycle, or package roots;
- commit, push, public-sync, activation, or package integration.

## Adapter Admission Boundary

A future CLI/MCP adapter may claim `IMPLEMENTED` only when all prerequisites
exist in the same or earlier governed range:

| Prerequisite | Required evidence |
|---|---|
| adapter contract | path named in `adapterContract` |
| adapter evidence | tests, review, and closure artifact named in `adapterEvidence` |
| authorization | fresh GC-018 baseline and source-verified work order |
| generated-index consistency | `check_assf_skill_index_drift.py` PASS |
| certified metadata admission | `check_assf_certified_metadata_admission.py --require-certified` PASS |
| mutation boundary | explicit denial of external mutation unless separately authorized |
| dual-agent accounting | Dual Agent Surface Matrix with `EXTERNAL_AGENT_CLI_MCP` row |

Until those prerequisites exist, the only valid external posture for the
current certified package is `DEFERRED_WITH_REASON`.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| ASSF package contract defines external disposition fields | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | lines 75 and 138-141 | `externalCliMcpDisposition` | ASSF package contract | EXISTS | ACCEPT |
| ASSF package contract says adapters are not canonical authority | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Provider Adapter Boundary | `adapterContract` | ASSF package contract | LITERAL_INVARIANT | ACCEPT |
| Web projection contract requires a separate adapter work order | `docs/reference/agent_system_skills/CVF_ASSF_WEB_PROJECTION_CONTRACT.md` | Principle 5 | `adapterContract` | Web projection contract | LITERAL_INVARIANT | ACCEPT |
| Generated ASSF index denies adapter authorization | `docs/reference/agent_system_skills/generated/skill-index.json` | root `claimBoundary` | `claimBoundary` | generated ASSF skill index | LITERAL_INVARIANT | ACCEPT |
| Certified-admission checker requires adapter evidence for IMPLEMENTED | `governance/compat/check_assf_certified_metadata_admission.py` | lines 145-157 | `adapterEvidence` | certified metadata admission checker | RUNTIME_BEHAVIOR | ACCEPT |
| Web Skill type includes display-only adapter posture fields | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/types/skill.ts` | lines 34-40 | `externalCliMcpDisposition` | Web Skill type | EXISTS | ACCEPT |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this contract and ASSF registry/generated index | internal agents may read metadata and plan future work only | package contract, Web projection contract, generated index | N/A with reason: no adapter is implemented here | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future CLI/MCP adapter or readout tool | no mutation, certification, activation, package execution, provider call, public claim, commit, or push | dual-agent standard and Source Verification Block | deferred; separate GC-018/work order/test/review required | `DEFERRED_WITH_REASON` |

## External Knowledge Intake Routing

| Input type | Source | Routing decision | Disposition |
|---|---|---|---|
| CVF_GOVERNED_SOURCE | ASSF package/Web/generated-index contracts | use as source authority | ACCEPT |
| PROVIDER_LOCAL_MEMORY | none | do not use as authority | N/A_WITH_REASON |
| EXTERNAL_ARTIFACT | none | no external artifact absorbed | N/A_WITH_REASON |
| OPERATOR_PROVIDED_CONTEXT | active next allowed move | use only as lane authorization, not source fact | ACCEPT_WITH_BOUNDARY |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance contract; no public-sync authorization.

## Epistemic Process Block

### Expected Result / Prediction

A readout/adapter boundary contract should let future agents plan external
adapter work without mistaking metadata projection for runtime availability.

### Evidence Comparison

The ASSF package contract, Web projection contract, generated-index claim
boundary, and certified-admission checker all point to the same posture:
external adapter behavior is deferred until a separate source-verified
implementation tranche exists.

### Contradiction Or Gap Disposition

No contradiction found. The gap is implementation, and this contract keeps that
gap explicit rather than silently treating Web projection as an adapter.

### Claim Update

The current claim is contract-only. A later adapter tranche must bring its own
GC-018 baseline, source-verified work order, tests, and closure evidence.

## Claim Boundary

This contract defines readout and adapter-admission boundaries only. It does not
make the external adapter available, does not change generated ASSF metadata,
and does not grant external agents authority to mutate, activate, execute, or
publish ASSF packages.
