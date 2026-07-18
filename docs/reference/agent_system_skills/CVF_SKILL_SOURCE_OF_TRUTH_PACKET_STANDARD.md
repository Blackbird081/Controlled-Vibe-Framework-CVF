# CVF Skill Source Of Truth Packet Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-30

docType: reference

Batch ID: SKSOT-T1

## Purpose

Define the CVF-owned source-of-truth packet for ASSF skill package records.
The packet records what CVF knows about a skill package, which evidence backs
that knowledge, which obligations must stay true before runtime-package use,
and which receipt hash appears in the generated truth index.

This standard absorbs useful patterns from the private Truth Kernel reference
input into CVF-governed skill control. The private reference input is not
canonical CVF authority. Canonical authority for skill truth packets comes from
this standard, the ASSF package contract, the ASSF registry source entries, the
packet JSON files under `docs/reference/agent_system_skills/truth/packets/`,
and `governance/compat/check_skill_truth_packets.py`.

## Scope Boundary

This standard creates a governed truth-packet contract and checker only. It
does not create an ACTIVE resolver, invoke a skill, grant authority, call a
provider, implement an external CLI/MCP adapter, create public export, certify
additional packages, or replace the ASSF registry.

The generated truth index is a read model. It is not the source record. Agents
must edit packet sources and then keep the generated index in sync.

## Canonical Storage

| Surface | Role |
|---|---|
| `docs/reference/agent_system_skills/truth/README.md` | Truth packet layout front door |
| `docs/reference/agent_system_skills/truth/packets/*.json` | Canonical per-skill truth packet sources |
| `docs/reference/agent_system_skills/truth/generated/skill-truth-index.json` | Generated read model derived from packet sources |
| `governance/compat/check_skill_truth_packets.py` | Machine checker for packet shape, registry consistency, and index drift |

## Packet Required Fields

Each packet must contain these fields:

| Field | Rule |
|---|---|
| `schemaVersion` | `0.1.0` for SKSOT-T1 packets |
| `truthPacketId` | stable packet identifier unique in the packet folder |
| `skillId` | must match one ASSF registry entry under `registry/entries/` |
| `canonicalPacketPath` | repo-relative path to the packet file |
| `registryEntryPath` | repo-relative path to the matching registry entry |
| `packageRootPath` | repo-relative `SKILL.md` path for runtime-package eligible records |
| `truthStatus` | one of `approved`, `draft`, `pending_review`, `rejected`, `expired` |
| `verificationMode` | one of `STRICT`, `RELAXED`, `BLOCKED` |
| `runtimeEligibility` | one of `RUNTIME_PACKAGE_ELIGIBLE`, `RUNTIME_PACKAGE_INELIGIBLE`, `NOT_RUNTIME_PACKAGE` |
| `lifecycleSnapshot` | copied lifecycle fields from the registry entry |
| `authorityBoundary` | explicit no-activation/no-adapter/no-provider boundary |
| `evidence` | source records with `evidenceId`, `kind`, `status`, and `sourcePath` |
| `provenanceLabels` | claim labels tied to evidence records |
| `obligations` | runtime or governance obligations tied to this packet |
| `verificationResults` | schema/source/obligation/test results tied to evidence and obligations |
| `receipt` | receipt metadata including `hash` as `sha256:<64 lowercase hex>` |

## Provenance Labels

Allowed labels are:

| Label | Meaning |
|---|---|
| `MEASURED` | directly read from a source file, registry entry, review artifact, or command output |
| `COMPUTED` | deterministically derived from measured records, such as runtime eligibility |
| `LLM_INFERRED` | model-generated interpretation that still needs source evidence and review |
| `HUMAN_APPROVED` | approved by operator or governed review; this never erases original provenance |

Runtime-package truth packets should prefer `MEASURED`, `COMPUTED`, and
`HUMAN_APPROVED`. A `STRICT` packet may contain `LLM_INFERRED` only when it is
backed by approved evidence and passing verification results.

## Evidence Lifecycle

Evidence status values are:

| Status | Meaning |
|---|---|
| `approved` | accepted by governed review or current canonical source |
| `draft` | recorded but not yet accepted |
| `pending_review` | awaiting governed review |
| `rejected` | explicitly rejected |
| `expired` | no longer current |

`STRICT` packets require every evidence record to be `approved`.

## Obligations

Obligation strength values are `HARD` and `SOFT`. Obligation state values are
`satisfied`, `open`, `blocked`, and `not_applicable`.

`STRICT` packets require every `HARD` obligation to be `satisfied`. Runtime
eligible ASSF packages must at minimum record obligations for UAT,
certification, internal-agent disposition, no automatic resolver authority, and
the current adapter/provider boundary. For ASCP-P1-P3 ACTIVE packages, the
adapter/provider obligations are satisfied by receipt-backed production
executor evidence rather than by a no-adapter/no-provider invariant.

## Runtime Eligibility Binding

A packet with `runtimeEligibility=RUNTIME_PACKAGE_ELIGIBLE` must match a
registry entry whose current source fields are:

| Registry field | Required value |
|---|---|
| `status` | `APPROVED` or `ACTIVE` |
| `uatState` | `PASSED` |
| `certificationState` | `CERTIFIED` |
| `internalAgentDisposition` | `IMPLEMENTED` |

The packet must also point to an existing package `SKILL.md` under
`docs/reference/agent_system_skills/packages/`.

## Generated Index Discipline

The generated truth index must contain only:

| Field | Source |
|---|---|
| `truthPacketId` | packet source |
| `skillId` | packet source |
| `truthStatus` | packet source |
| `verificationMode` | packet source |
| `runtimeEligibility` | packet source |
| `receiptHash` | packet receipt hash |
| `canonicalPacketPath` | packet source |

Do not hand-edit the generated truth index without reconciling it with the
packet source files. `governance/compat/check_skill_truth_packets.py --enforce`
fails index drift.

## Source Authority Boundary

ASSF registry source entries remain the canonical source for skill lifecycle
fields. Skill truth packets are canonical for evidence, provenance labels,
obligations, verification results, and truth receipts. Generated indexes,
runtime audit output, provider-local memories, chat history, and private
reference folders are not source-of-truth authority.

## Claim Boundary

SKSOT-T1 records approved truth packets for the six existing runtime-eligible
ASSF package roots only. ASCP-P1-P3 may update those six packet snapshots from
`APPROVED` to `ACTIVE` only when the matching registry entries carry governed
production runtime and CLI/MCP adapter evidence. This standard does not
broaden runtime eligibility, convert the remaining package roots, export public
artifacts, or grant action authority from package loading alone.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: skill truth packets cite private ASSF provenance and source mirrors.
Public-safe export requires a separate redaction and public-sync work order.
