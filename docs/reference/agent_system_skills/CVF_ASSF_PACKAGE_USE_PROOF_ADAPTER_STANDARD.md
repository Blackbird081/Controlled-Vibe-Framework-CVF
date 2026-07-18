# CVF ASSF Package Use-Proof Adapter Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

Date: 2026-06-30

docType: reference_standard

Batch ID: ASCP-T5

## Purpose

Define the bounded ASSF package execution/use-proof adapter implemented by
`governance/compat/run_assf_package_use_proof_adapter.py`.

The adapter proves one explicit package body read, one matching
`CVF_ASSF_SKILL_USAGE_RECEIPT`, one activation-policy
`USED_WITH_RECEIPT` classification, and, when `--live` is used, one live
provider completion with a use-proof receipt.

## Scope / Applies-To

This standard applies to:

- `governance/compat/run_assf_package_use_proof_adapter.py`;
- `governance/compat/assf_live_model_selection.py`;
- `governance/compat/live_provider_bootstrap.py`;
- `governance/compat/test_run_assf_package_use_proof_adapter.py`;
- governed artifacts that claim ASCP-T5 package execution/use-proof behavior.

This standard does not authorize:

- package lifecycle source mutation to `ACTIVE`;
- automatic package invocation;
- remaining package conversion;
- MCP server runtime behavior;
- provider registry mutation;
- public-sync;
- production readiness.

## Adapter Contract

| Field | Required value |
|---|---|
| Adapter implementation | `IMPLEMENTED_BOUNDED_USE_PROOF_ADAPTER` |
| Live mode | `LIVE_PROVIDER_USE_PROOF` |
| Dry-run mode | `DRY_RUN_NO_PROVIDER_CALL` |
| Pass disposition | `LIVE_PROVIDER_USE_PROOF_PASS` |
| Proof receipt type | `CVF_ASSF_PACKAGE_USE_PROOF_RECEIPT` |
| Lifecycle mutation | `false` |
| Active promotion authorized | `false` |
| Source mutations | empty list |

## Evidence Chain

The valid ASCP-T5 use-proof chain is:

1. select exactly one generated ASSF package entry;
2. load the package body through the runtime package loader with explicit body
   request;
3. receive `CVF_ASSF_SKILL_USAGE_RECEIPT`;
4. classify output consumption through the activation policy resolver as
   `USED_WITH_RECEIPT`;
5. optionally call a live provider with the package instruction excerpt and a
   bounded task prompt;
6. emit `CVF_ASSF_PACKAGE_USE_PROOF_RECEIPT` only when the live call returns
   usable output.

The live provider output is evidence that the bounded adapter path executed.
It is not canonical source authority for package status, lifecycle mutation,
source facts, roadmap scope, or provider capability.

## Live Run Diagnostics

A failed live run must emit a secret-safe diagnostic with:

- `stage`;
- `class`;
- `retryable`;
- `userAction`;
- provider and model when known;
- HTTP status and latency when available;
- receipt or trace id when available;
- safe human-readable message.

The adapter must not print raw API keys. It may report the environment variable
name used as credential source.

## Live Model Selection Guard

ASCP-T5 live proof is a bounded Model Gateway use case. The adapter may
auto-select provider and model for this use case only, but this is not a
production model router.

Binding provider rules:

- the default provider selection is `AUTO_FROM_ASSF_LIVE_PROVIDER_CANDIDATES`;
- auto-selection may resolve only to source-backed provider candidates declared
  by the ASCP-T5 selector helper;
- the only current source-backed provider candidate is
  `alibaba-dashscope`;
- unsupported providers must return `PROVIDER_NOT_SOURCE_BACKED_FOR_ASSF_USE_CASE`
  before package body read or provider call;
- provider selection output must include a boundary stating that the selection
  is ASCP-T5 use-case scoped and not a production model router.

Alibaba/DashScope free-quota live proof must select its model from
`docs/reference/model_gateway/CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.json`
using the `models` array only.

Binding rules:

- the default model selection is `AUTO_FROM_ALIBABA_FREE_QUOTA_LEDGER`;
- auto-selection must resolve to an unexpired ledger entry before package body
  read or provider call;
- an explicit model absent from the ledger `models` array must return
  `MODEL_FREE_QUOTA_NOT_VERIFIED`;
- an explicit model past its `expirationDate` must return
  `MODEL_FREE_QUOTA_EXPIRED`;
- diagnostic rerun summary rows are not model-selection authority;
- provider capability registry entries are routability evidence only, not
  current free-quota selection authority.

## Live Environment Bootstrap Guard

Live provider helpers under `governance/compat` must use the shared
`governance/compat/live_provider_bootstrap.py` helper, or equivalent
repo-root insertion before importing `scripts._local_env`.

This prevents nested helper execution from reporting a false
`missing_live_provider_key` when the key is present in repo-local env files.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| Runtime loader emits usage receipts only for explicit eligible body reads | `governance/compat/run_assf_runtime_package_loader.py` | `_build_skill_usage_receipt`; `build_runtime_package_packet` | `skillUsageReceipts` | runtime package loader | RUNTIME_BEHAVIOR | ACCEPT |
| Activation policy resolver requires matching usage receipt for consumed output | `governance/compat/run_assf_activation_policy_resolver.py` | `_state_for`; `build_activation_policy_packet` | `USED_WITH_RECEIPT` | activation policy resolver | RUNTIME_BEHAVIOR | ACCEPT |
| Live key loader accepts repo env files and aliases without printing values | `scripts/_local_env.py`; `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/alibaba-env.ts` | `DEFAULT_ENV_FILES`; `keyCandidates` | `DEFAULT_ENV_FILES`; `DASHSCOPE_API_KEY` | repo env bootstrap and Alibaba env source | RUNTIME_BEHAVIOR | ACCEPT |
| Live provider helper inserts repo root before loading local env files | `governance/compat/live_provider_bootstrap.py` | `ensure_repo_root_on_sys_path`; `bootstrap_live_provider_env` | `sys.path`; `scripts._local_env` | live provider bootstrap helper | RUNTIME_BEHAVIOR | ACCEPT |
| ASSF live provider/model selector rejects unsupported providers | `governance/compat/assf_live_model_selection.py` | `resolve_provider_model` | `AUTO_FROM_ASSF_LIVE_PROVIDER_CANDIDATES`; `PROVIDER_NOT_SOURCE_BACKED_FOR_ASSF_USE_CASE` | ASSF live provider/model selection helper | RUNTIME_BEHAVIOR | ACCEPT |
| ASSF live provider/model selector rejects absent or expired free-quota models | `governance/compat/assf_live_model_selection.py` | `resolve_provider_model`; `resolve_free_quota_model` | `MODEL_FREE_QUOTA_NOT_VERIFIED`; `MODEL_FREE_QUOTA_EXPIRED` | ASSF live provider/model selection helper | RUNTIME_BEHAVIOR | ACCEPT |
| Alibaba free-quota model selection is controlled by the model ledger `models` array | `docs/reference/model_gateway/CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.json` | `models`; `useBeforeLiveTestRule` | `modelCode`; `expirationDate` | Alibaba free-quota ledger | VALUE_SET | ACCEPT |
| Provider capability registry entries are not current free-quota selection authority | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts`; `docs/reference/model_gateway/CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.md` | `PROVIDER_CAPABILITY_REGISTRY`; `Use-Before-Live-Test Rule` | `qwen-turbo`; `MODEL_FREE_QUOTA_NOT_VERIFIED` | Model Gateway capability registry and free-quota ledger | LITERAL_INVARIANT | ACCEPT |
| Live run diagnostic standard requires secret-safe failure classification | `docs/reference/archive/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md` | Required Diagnostic Record | `stage`; `class`; `retryable`; `safeMessage` | live run diagnostic standard | LITERAL_INVARIANT | ACCEPT |
| Package use-proof adapter is new in ASCP-T5 | `governance/compat/run_assf_package_use_proof_adapter.py` | ASCP-T5 new file | `build_package_use_proof_packet` | package use-proof adapter | DOC_ONLY_NEW | ACCEPT |

## CVF Skill Usage Receipt Trace

| Field | Value |
|---|---|
| Usage disposition | USED_WITH_RECEIPT |
| CVF skill id | `cvf-engineering-spec-driven-development` |
| Package root | `docs/reference/agent_system_skills/packages/cvf-engineering-spec-driven-development/SKILL.md` |
| Invocation context | ASCP-T5 live use-proof adapter smoke |
| Receipt evidence | `sha256:aa4e26d13ccd75475431e434ef1bd304f20d3b72d77f95a4726fdf6038f2455f` |
| Output consumed by CVF | package-use proof receipt and output hash only |
| Truth packet or source path | `docs/reference/agent_system_skills/truth/generated/skill-truth-index.json` |
| Authority boundary | skill usage receipt does not grant authority, activate package lifecycle state, or bypass work-order scope |

## External Provider Skill Usage Trace

| Field | Value |
|---|---|
| Usage disposition | NOT_USED_WITH_REASON |
| Provider skill name | N/A with reason: no provider-owned skill surface was consumed |
| Provider owner | N/A with reason: no provider-owned skill surface was consumed |
| Invocation context | ASCP-T5 model-completion proof; provider skill surface: none |
| Output consumed by CVF | N/A with reason: no provider-owned skill output was consumed |
| CVF source-of-truth promotion path | N/A with reason: provider-owned skill output was not promoted |
| Evidence artifact | this standard and ASCP-T5 completion evidence |
| Authority boundary | provider model output is proof evidence only; provider skill surface: none; not CVF canonical authority |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this standard references private ASSF package runtime and live-provider
proof surfaces. Public-safe export requires separate public-sync authorization.

## Claim Boundary

ASCP-T5 implements bounded package use-proof only. It does not activate
packages, mutate lifecycle state, convert remaining packages, implement an MCP
server, public-sync, or claim production readiness.
