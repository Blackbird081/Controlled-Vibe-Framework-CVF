# CVF ASSF Activation Policy Semantics Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-30

docType: reference_standard

Batch ID: ASCP-T2

## Purpose

Define the CVF-owned semantics for the four ASSF activation-policy states:
selected, activation-ready, body-read requested, and used-with-receipt.

This standard prevents future internal agents, CLI tools, MCP adapters, Web
views, or package lifecycle work from treating metadata selection as package
use, treating activation readiness as body loading, or treating body loading as
consumed output without receipt evidence.

## Scope / Applies-To

This standard applies to CVF-owned ASSF/runtime package control-plane surfaces:

- generated ASSF metadata and metadata selectors;
- `governance/compat/run_assf_active_resolver.py`;
- `governance/compat/run_assf_runtime_package_loader.py`;
- `governance/compat/run_assf_activation_policy_resolver.py`;
- future CLI/MCP adapter readouts that expose activation policy state.

This standard does not create automatic package activation, lifecycle mutation
to `ACTIVE`, external CLI/MCP adapter behavior, provider runtime interception,
provider/live proof, public export, package body execution, or authority beyond
the active governed work order.

## State Semantics

| State | Required evidence | Meaning | Forbidden interpretation |
|---|---|---|---|
| `SELECTED` | metadata selector returned a package row | the package is a candidate in the current selector context | not ready, not body-read, not used, not active lifecycle state |
| `ACTIVATION_READY` | active resolver returned `ACTIVATION_READY` | the caller may explicitly request the runtime loader body-read command | not a package body read and not a usage receipt |
| `BODY_READ_REQUESTED` | caller requested a package body read after readiness | the next valid surface is the runtime package loader with explicit body-read request | not output consumption and not automatic authority |
| `USED_WITH_RECEIPT` | output was consumed and a matching `CVF_ASSF_SKILL_USAGE_RECEIPT` exists | package instruction body output can be cited as consumed CVF evidence | not lifecycle activation, provider proof, or authority expansion |

Denied policy states are required when a caller attempts to skip a step:

| State | Trigger | Required disposition |
|---|---|---|
| `BODY_READ_DENIED` | body read requested when active resolver did not return `ACTIVATION_READY` | stop and report policy denial |
| `USED_WITHOUT_RECEIPT_DENIED` | output consumed without a matching usage receipt | stop and file missing-receipt evidence instead of claiming use |

## Evidence Chain

The valid evidence progression is:

1. metadata selector returns a package row;
2. active resolver returns an activation decision and resolver decision receipt;
3. runtime package loader is explicitly invoked for body read only when ready;
4. loader emits `CVF_ASSF_SKILL_USAGE_RECEIPT` only after an eligible body read;
5. governed artifact trace records `USED_WITH_RECEIPT` only when output was
   consumed and the matching receipt ID is available.

The activation policy resolver may classify this progression, but it must not
open package bodies or mint skill usage receipts. Body reads and usage receipts
remain owned by the runtime package loader.

## Helper Contract

`governance/compat/run_assf_activation_policy_resolver.py` is the bounded local
helper for ASCP-T2 semantics.

It may:

- call the active resolver;
- classify policy state;
- accept loader receipt JSON as evidence;
- emit deterministic policy decision receipts;
- return human or JSON output.

It must not:

- open `SKILL.md` bodies;
- emit `skillUsageReceipts`;
- mutate generated index, registry, truth packets, package roots, session
  state, git state, or public-sync surfaces;
- call providers or external services;
- implement CLI/MCP adapter behavior.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| Active resolver returns readiness decisions without body reads | `governance/compat/run_assf_active_resolver.py` | module docstring; `build_active_resolver_packet` | `activationDecision` | active resolver helper | RUNTIME_BEHAVIOR | ACCEPT |
| Active resolver marks body receipts as required only for ready decisions | `governance/compat/run_assf_active_resolver.py` | `ActiveResolverItem.to_dict` | `packageBodyReceiptRequired` | active resolver item schema | RUNTIME_BEHAVIOR | ACCEPT |
| Runtime loader emits usage receipts only after explicit eligible body reads | `governance/compat/run_assf_runtime_package_loader.py` | `_build_skill_usage_receipt`; `build_runtime_package_packet` | `skillUsageReceipts` | runtime package loader | RUNTIME_BEHAVIOR | ACCEPT |
| Skill usage receipt trace standard defines consumed-output receipt semantics | `docs/reference/agent_system_skills/CVF_SKILL_USAGE_RECEIPT_TRACE_STANDARD.md` | Receipt Source; Authority Boundary | `CVF_ASSF_SKILL_USAGE_RECEIPT` | skill usage receipt trace standard | LITERAL_INVARIANT | ACCEPT |
| External adapter behavior remains deferred | `docs/reference/agent_system_skills/CVF_ASSF_EXTERNAL_AGENT_READOUT_CLI_MCP_ADAPTER_BOUNDARY_CONTRACT.md` | Adapter Admission Boundary | `EXTERNAL_AGENT_CLI_MCP` | external readout boundary contract | LITERAL_INVARIANT | ACCEPT |
| Activation policy helper is new in ASCP-T2 | `governance/compat/run_assf_activation_policy_resolver.py` | ASCP-T2 new file | `build_activation_policy_packet` | activation policy resolver | DOC_ONLY_NEW | ACCEPT |

## CVF Skill Usage Receipt Trace

| Field | Value |
|---|---|
| Usage disposition | NOT_USED_WITH_REASON |
| CVF skill id | N/A with reason: this standard defines policy semantics and does not consume package output |
| Package root | N/A with reason: no package body is requested by this standard |
| Invocation context | ASCP-T2 reference standard authoring |
| Receipt evidence | N/A with reason: no package output consumed by this standard |
| Output consumed by CVF | N/A with reason: none |
| Truth packet or source path | N/A with reason: no package output consumed |
| Authority boundary | policy semantics do not grant package authority or lifecycle activation |

## External Provider Skill Usage Trace

| Field | Value |
|---|---|
| Usage disposition | NOT_USED_WITH_REASON |
| Provider skill name | N/A with reason: no external/provider-owned skill output was consumed |
| Provider owner | N/A with reason: no provider-owned skill output consumed |
| Invocation context | local CVF standard authoring only |
| Output consumed by CVF | N/A with reason: no provider skill output consumed |
| CVF source-of-truth promotion path | N/A with reason: no provider skill output promoted |
| Evidence artifact | this standard |
| Authority boundary | provider-owned skill output is not CVF canonical authority |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this standard references internal ASSF governance and private
provenance control-plane surfaces. Public-safe export requires separate
public-sync authorization.

## Claim Boundary

ASCP-T2 defines activation policy semantics and adds a bounded local classifier.
It does not activate packages, mutate lifecycle sources, open package bodies,
emit skill usage receipts, implement external adapters, call providers,
public-sync, or claim production readiness.
