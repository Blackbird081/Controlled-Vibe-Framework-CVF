# CVF LHW6 CLI Tool Onboarding Governance Connector Spec

Memory class: POINTER_RECORD

docType: reference

Contract version: `cvf.cliToolOnboardingGovernanceConnector.lhw6.t2.v1`

Date: 2026-05-28

Status: CLOSED_PASS_BOUNDED

---

## Scope

Applies to: Orchestrator agents and documentation consumers for CLI tool
onboarding governance planning. Documentation-only; no runtime enforcement,
code modification, or public sync.

## Purpose and Claim Boundary

This connector is a normative documentation standard binding W3
`surface=command_runtime` classification → TA1 `ToolActionApprovalState` →
LHW6-T1 `bridgeAdvisoryType` into a CLI tool onboarding governance packet
readable by an Orchestrator when a CLI tool is first encountered.

It closes the LH1 ledger `CLI-Anything` trigger gap: W3 classifies CLI commands
in the `command_runtime` surface and TA1 reports their approval state, but no
connector defined the first-use onboarding record that packages governance
classification + approval gate state + bridge advisory into a single
Orchestrator-readable packet.

T1 gate confirmed: `docs/reviews/CVF_LHW6_T1_TOOL_RUNTIME_BRIDGE_ADVISORY_CONNECTOR_COMPLETION_2026-05-28.md`
— Status: CLOSED_PASS_BOUNDED.

What this connector is not:

- Not a W3 or TA1 runtime extension.
- Not a CLI command executor or automated onboarding runner.
- Not a sandbox creator.

Explicit statement: "This connector does not execute CLI commands. The onboarding
packet is a governance planning record. Sandbox is required for all
`command_runtime` surface actions per W3 `resolveSandboxRequired`
(`surface === 'command_runtime'` → `sandboxRequired: true`).
`runtimeExecutionAuthorized=false` is preserved throughout."

---

## S2 — W3 command_runtime → TA1 Approval → LHW6-T1 Advisory Onboarding Mapping

Column definitions: `W3 sideEffect` | `TA1 approvalState` |
`LHW6-T1 bridgeAdvisoryType` | `Onboarding classification` | `First-run guidance`

| W3 sideEffect | TA1 approvalState | LHW6-T1 bridgeAdvisoryType | Onboarding classification | First-run guidance |
| --- | --- | --- | --- | --- |
| `read_only` | `not_required` | `advisory_allowed` | `safe_first_use` | This CLI command reads state only. No approval needed. Sandbox declaration still required. |
| `local_write` | `pending_approval` | `hold_for_approval` | `review_before_first_use` | This CLI command modifies local state. Obtain review approval before first run. |
| `workspace_mutation` | `blocked_by_policy` | `blocked` | `blocked_first_use` | This CLI command mutates the workspace. Blocked by current governance policy. |
| `install` | `pending_approval` | `hold_for_approval` | `install_review_required` | Install commands require explicit review approval before first run. W3 `resolveApprovalLevel` returns `explicit` for `install`, yielding `pending_approval`. |
| `network_egress` | `pending_approval` | `hold_for_approval` | `network_review_required` | This command reaches external networks. Explicit network review approval required before first run. |

Use W3 sideEffect tokens, TA1 approval state tokens, and LHW6-T1 `bridgeAdvisoryType`
values verbatim. `command_runtime` surface sandbox is always required; no
`safe_first_use` row implies sandbox waiver.

---

## S3 — CLI Onboarding Governance Packet Minimum Fields

Every CLI tool onboarding governance packet must contain the following fields.
These are documentation-only minimum requirements. `runtimeExecutionAuthorized=false`
is invariant. The packet does not extend `GovernanceEvidenceReceipt` or any
existing receipt envelope type.

- `onboardingPacketId`: unique token for this onboarding record (doc-only)
- `cliToolId`: identifier for the CLI tool or command being onboarded (doc-only)
- `surface`: from W3 `ToolActionSurface` (always `command_runtime` for this connector)
- `sideEffect`: from W3 `ToolActionSideEffect`
- `approvalState`: from TA1 `ToolActionApprovalState`
- `bridgeAdvisoryType`: from LHW6-T1 (`advisory_allowed` | `hold_for_approval` | `blocked`)
- `runtimeExecutionAuthorized`: always `false`
- `onboardingClassification`: one of `safe_first_use` | `review_before_first_use` | `blocked_first_use` | `install_review_required` | `network_review_required` (doc-only)
- `onboardingGuidance`: plain-language guidance for operator or non-coder (doc-only)

State explicitly: "These fields are documentation-only minimum requirements.
`runtimeExecutionAuthorized=false` is invariant. The onboarding packet does not
extend `GovernanceEvidenceReceipt` or any existing receipt envelope."

---

## S4 — Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
| --- | --- | --- |
| W3 tool action taxonomy classification | Runtime (`governance/contracts`) | Stable |
| TA1 tool action approval readout | Runtime (`governance/contracts`) | Stable |
| LHW6-T1 tool bridge advisory packet | Document-only (LHW6-T1) | Future: tool bridge advisory engine |
| CLI onboarding packet composition | Document-only | Future: CLI onboarding governance engine |
| CLI sandbox enforcement | Document-only (W3 contract rule) | Future: sandbox execution gate |

No doc-only row is labeled Runtime. Composition and sandbox enforcement remain
advisory documentation only.

---

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| W3 `command_runtime` surface token | `governance/contracts/tool-action-taxonomy.ts` | lines 9–14 | `command_runtime` | `ToolActionSurface` | ACCEPT |
| W3 sideEffect tokens `read_only`, `local_write`, `workspace_mutation`, `install`, `network_egress` | `governance/contracts/tool-action-taxonomy.ts` | lines 16–31 | `ToolActionSideEffect` | `ToolActionSideEffect` | ACCEPT |
| W3 `command_runtime` → `sandboxRequired: true` | `governance/contracts/tool-action-taxonomy.ts` | lines 381–386 | `surface === 'command_runtime'` → returns `true` | `resolveSandboxRequired` | ACCEPT |
| W3 `runtimeExecutionAuthorized=false` | `governance/contracts/tool-action-taxonomy.ts` | lines 119, 141 | `ToolActionTaxonomyEvaluation.runtimeExecutionAuthorized`, `ToolActionApprovalReadout.runtimeExecutionAuthorized` | `ToolActionTaxonomyEvaluation` / `ToolActionApprovalReadout` | ACCEPT |
| TA1 `approvalState` tokens `not_required`, `pending_approval`, `blocked_by_policy` | `governance/contracts/tool-action-taxonomy.ts` | lines 64–70 | `ToolActionApprovalState` | `ToolActionApprovalState` | ACCEPT |
| LHW6-T1 `bridgeAdvisoryType` values `advisory_allowed`, `hold_for_approval`, `blocked` | `docs/reference/CVF_LHW6_TOOL_RUNTIME_BRIDGE_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S3 field list | `bridgeAdvisoryType` | LHW6-T1 advisory packet | ACCEPT |
| Doc-only fields `onboardingPacketId`, `cliToolId`, `onboardingClassification`, `onboardingGuidance` | N/A — new doc-only fields proposed by LHW6-T2 work order | work order S3 new doc-only fields block | doc-only; no runtime source | LHW6-T2 onboarding packet | ACCEPT |

All claimed runtime/source items are ACCEPT. No blocking source-verification
disposition remains in this table.

---

## Claim Boundary

This connector is documentation-only. It does not claim W3 or TA1 runtime
extension, CLI command execution, sandbox creation, automated onboarding,
receipt envelope extension, provider behavior, hosted readiness, production
readiness, or public release readiness.
