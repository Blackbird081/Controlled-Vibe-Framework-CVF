# CVF Skill Usage Receipt Trace Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-30

docType: reference

Batch ID: SKUSE-T1

## Purpose

Define the CVF-owned trace requirement for ASSF runtime package use. A skill
truth packet answers whether CVF has source-backed knowledge about a skill
package. A skill usage receipt answers whether a specific body-read claim left
inspectable evidence.

This standard covers CVF-owned ASSF/runtime package usage only. Provider-owned
external skills remain governed by the external provider skill source-of-truth
standard.

## Scope Boundary

SKUSE-T1 creates a bounded runtime-loader receipt and a markdown trace checker.
It does not create automatic package activation, an ACTIVE resolver, provider
runtime interception, an external CLI/MCP adapter, package lifecycle promotion,
public export, live provider proof, or production readiness.

## Receipt Source

`governance/compat/run_assf_runtime_package_loader.py` emits
`skillUsageReceipts` when all of these conditions are true:

- the caller explicitly requests instruction bodies;
- the selected package passes the runtime eligibility gate;
- the loader opens the package `SKILL.md` body.

Metadata-only loader readouts do not create usage receipts. Denied packages do
not create usage receipts.

The loader receipt includes:

| Field | Meaning |
|---|---|
| `receiptType` | `CVF_ASSF_SKILL_USAGE_RECEIPT` |
| `schemaVersion` | receipt schema version |
| `receiptId` | deterministic `sha256:` hash over receipt material |
| `skillId` | ASSF skill identifier |
| `packageRootPath` | repo-relative `SKILL.md` package root |
| `sourceIndexPath` | generated ASSF index used by the loader |
| `bodyHash` | `sha256:` hash of the loaded instruction body |
| `packageBodyDisposition` | `LOADED` |
| `generatedBy` | runtime package loader helper path |
| `authorityBoundary` | explicit no-authority/no-activation boundary |

The optional loader `--receipt-out` argument may write a JSON receipt bundle
when an operator or reviewer needs file-backed evidence. Normal JSON output
also carries `skillUsageReceipts`.

## Governed Artifact Trace Requirement

Any changed governed artifact that claims CVF-owned ASSF/runtime package output
was used, invoked, loaded, opened, or consumed as CVF work evidence must include
this section:

## CVF Skill Usage Receipt Trace

| Field | Value |
|---|---|
| Usage disposition | NOT_USED_WITH_REASON |
| CVF skill id | N/A with reason: this standard defines the trace shape and does not consume package output |
| Package root | N/A with reason: this standard defines the trace shape and does not consume package output |
| Invocation context | N/A with reason: reference standard only |
| Receipt evidence | N/A with reason: no skillUsageReceipt output consumed by this standard |
| Output consumed by CVF | N/A with reason: none |
| Truth packet or source path | N/A with reason: no package output consumed |
| Authority boundary | no package output is consumed here; any future receipt does not grant authority |

Allowed `Usage disposition` values are:

| Token | Rule |
|---|---|
| `USED_WITH_RECEIPT` | use when CVF package output was consumed; all rows must be concrete and receipt evidence must cite `skillUsageReceipt` output or a `sha256:` receipt ID |
| `NOT_USED_WITH_REASON` | use when no CVF package output was consumed |

## Machine Checker

`governance/compat/check_cvf_skill_usage_receipt_trace.py` enforces the trace
block for changed governed markdown artifacts under baselines, work orders,
reviews, references, roadmaps, and active handoffs.

The checker is a trace guard only. It does not observe hidden agent behavior,
provider-side tool execution, IDE activity, shell commands, or future adapter
invocations. It validates claims in changed CVF artifacts.

## Authority Boundary

A `CVF_ASSF_SKILL_USAGE_RECEIPT` proves an explicit eligible package body read
through the bounded loader. It does not grant authority, activate a package,
authorize side effects, certify a package, call providers, bypass work-order
scope, or promote generated output into canonical source.

Canonical authority still comes from the active work order, ASSF package
contract, ASSF registry source entries, skill truth packets, and the relevant
review/closure artifact.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this standard references internal ASSF governance and private
provenance surfaces. Public-safe export requires separate redaction and
public-sync authorization.

## Claim Boundary

SKUSE-T1 adds receipt traceability for CVF-owned ASSF/runtime package body reads
through the bounded loader and artifact checker only. It does not implement
automatic invocation, provider runtime interception, external adapters, public
export, package lifecycle promotion, or production runtime control.

