# CVF ASSF CLI/MCP Adapter Projection Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

Date: 2026-06-30

docType: reference_standard

Batch ID: ASCP-T3

## Purpose

Define the bounded external projection surface used by
`governance/compat/run_assf_cli_mcp_adapter_projection.py`.

The projection lets an external CLI/MCP consumer inspect allowlisted ASSF
metadata plus activation policy state. It does not implement an MCP server,
load package instruction bodies, call providers, mutate package lifecycle
state, or authorize external output use.

## Scope / Applies-To

This standard applies to:

- `governance/compat/run_assf_cli_mcp_adapter_projection.py`;
- tests for the projection helper;
- governed artifacts that claim ASCP-T3 external metadata/policy projection;
- future CLI/MCP readout documentation that exposes ASSF activation policy
  state without package execution.

This standard does not apply to:

- package instruction body loading;
- skill usage receipt emission or consumption;
- provider calls;
- MCP server runtime behavior;
- package lifecycle activation;
- public export.

## Projection Contract

| Field | Required value |
|---|---|
| Consumer | `EXTERNAL_AGENT_CLI_MCP` |
| Projection mode | `METADATA_POLICY_READOUT_ONLY` |
| Implementation claim | `IMPLEMENTED_BOUNDED_PROJECTION` |
| Metadata source | generated ASSF skill index through external metadata readout allowlist |
| Policy source | activation policy resolver with internal readiness computation |
| External body-read disposition | `DENIED_EXTERNAL_BODY_READ_NOT_IMPLEMENTED` |
| External output-use disposition | `DENIED_EXTERNAL_OUTPUT_USE_NOT_IMPLEMENTED` |

## Allowed Output Families

The projection may expose only these package metadata families:

| Family | Fields |
|---|---|
| identity | `skillId`, `name`, `version`, `canonicalRoot` |
| lifecycle display | `candidateState`, `uatState`, `certificationState`, `reviewArtifacts` |
| authority display | `authorityCeiling`, `riskCeiling`, `riskProfile`, `capabilityBoundary` |
| adapter posture | `externalCliMcpDisposition`, `adapterContract`, `adapterEvidence`, `externalMutationBoundary` |
| provenance | `sourceArtifacts`, `originLane`, `license` |

The projection may add these policy-safe fields:

| Field | Meaning |
|---|---|
| `activationPolicyState` | selected or readiness state computed by the activation policy resolver |
| `activationReady` | boolean readiness signal for planning only |
| `externalBodyReadDisposition` | fixed denial of external package body read |
| `externalOutputUseDisposition` | fixed denial of external output use |
| `policyReasons` | policy reasons emitted by the policy resolver |
| `projectionBoundary` | item-level claim boundary |

## Denied Output

The projection must not emit:

- package instruction bodies;
- `loaderCommand`;
- truth packet bodies or receipt hashes;
- resolver decision receipts;
- policy decision receipts;
- skill usage receipts;
- matched usage receipt IDs;
- runtime eligibility internals;
- package body receipt requirements;
- provider route or live-call data.

## Runtime Boundary

`activationReady=true` means only that the internal activation policy layer has
classified the package as ready for a future governed body-read request. For
external consumers, package body reads remain denied by this projection. A
separate adapter/runtime tranche is required before an external CLI/MCP surface
may request package bodies or consume package output.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| External metadata allowlist defines the package metadata families | `docs/reference/agent_system_skills/CVF_ASSF_EXTERNAL_AGENT_READOUT_CLI_MCP_ADAPTER_BOUNDARY_CONTRACT.md` | Readout Field Allowlist | `skillId`; `externalCliMcpDisposition`; `sourceArtifacts` | external readout boundary contract | LITERAL_INVARIANT | ACCEPT |
| External adapter admission requires separate evidence before package execution | `docs/reference/agent_system_skills/CVF_ASSF_EXTERNAL_AGENT_READOUT_CLI_MCP_ADAPTER_BOUNDARY_CONTRACT.md` | Adapter Admission Boundary | `EXTERNAL_AGENT_CLI_MCP` | external readout boundary contract | LITERAL_INVARIANT | ACCEPT |
| Activation policy standard allows future CLI/MCP readouts to expose activation policy state | `docs/reference/agent_system_skills/CVF_ASSF_ACTIVATION_POLICY_SEMANTICS_STANDARD.md` | Scope | `activationPolicyState` | activation policy semantics standard | LITERAL_INVARIANT | ACCEPT |
| Activation policy helper classifies without opening package bodies | `governance/compat/run_assf_activation_policy_resolver.py` | `build_activation_policy_packet` | `body_read_requested` | activation policy resolver | RUNTIME_BEHAVIOR | ACCEPT |
| CLI/MCP projection helper is new in ASCP-T3 | `governance/compat/run_assf_cli_mcp_adapter_projection.py` | ASCP-T3 new file | `build_cli_mcp_adapter_projection` | CLI/MCP adapter projection helper | DOC_ONLY_NEW | ACCEPT |

## ADIF Defect Registry Disclosure

Resolver query: taskClass=`implementation`, role=`worker`,
lifecyclePhase=`implementation`, surfaceSelector=`docs/reference/agent_system_skills`,
riskCeiling=`HIGH`, maxResults=`20`

Returned defects: NONE_RETURNED

Disclosure command:

```text
python governance/compat/run_adif_defect_resolver.py --task-class implementation --role worker --lifecycle-phase implementation --surface-selector docs/reference/agent_system_skills --risk-ceiling HIGH --max-results 20 --json
```

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | activation policy resolver | may compute readiness and policy state without body reads | ASCP-T2 tests and smokes | no external adapter | `IMPLEMENTED_BOUNDED` |
| `EXTERNAL_AGENT_CLI_MCP` | CLI/MCP adapter projection helper | may inspect allowlisted metadata and policy state only | ASCP-T3 tests and projection smoke | external body reads and output use denied | `IMPLEMENTED_BOUNDED_PROJECTION` |
| `EXTERNAL_AGENT_CLI_MCP` | package execution adapter | no package body read, provider call, or output use authorized by this standard | N/A with reason: not implemented in ASCP-T3 | separate adapter/runtime work order required | `DEFERRED_WITH_REASON` |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | Runtime/provider/MCP/readiness claim |
| Chain map route | local CVF skill-control implementation -> no external knowledge promotion |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | ASCP-T3 standard, helper, tests, baseline, work order, completion review, and roadmap |
| Disposition | REJECT_DIRECT for external intake promotion; this tranche uses repo-local CVF source verification only |
| Claim boundary | no external source, provider output, or provider-local memory is promoted as CVF authority |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | local workspace |
| Session or invocation | ASCP-T3 CLI/MCP adapter projection on 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | apply_patch; Python unittest; projection smoke |
| Target paths | projection standard, helper, tests, roadmap, baseline, work order, completion review |
| Allowed scope source | active next move plus ASCP-T3 baseline and work order |
| Before status evidence | base commit `fe2f6205`; clean worktree before ASCP-T3 edits |
| After status evidence | pending material closure changed set |
| Diff evidence | focused tests, projection smoke, and governance gates |
| Approval boundary | active next move authorized ASCP-T3; live API keys not needed because no live behavior claim is made |
| Claim boundary | bounded external metadata and policy readout only |
| Agent type | dispatcher/implementer/reviewer/closer |
| Invocation ID | `cvf-ascp-t3-cli-mcp-adapter-projection-2026-06-30` |
| Expected manifest | standard, helper, tests, roadmap update, baseline, work order, completion review |
| Actual changed set | standard, helper, tests, roadmap update, baseline, work order, completion review |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: none |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this standard references internal ASSF governance and private
provenance surfaces. Public-safe export requires separate public-sync
authorization.

## Claim Boundary

This standard authorizes a bounded external projection readout only. It does
not authorize external package body reads, package output use, provider calls,
MCP server behavior, lifecycle activation, public-sync, or production-readiness
claims.
