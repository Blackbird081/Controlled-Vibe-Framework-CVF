# CVF Work Order Source Verification Addendum

Memory class: STANDARD_ADDENDUM

Status: ACTIVE_ADDENDUM

docType: reference

Owner: CVF orchestration and delegation surface

rawMemoryReleased: false
Text Encoding Exception: em dash and standard punctuation used in governance prose

## Purpose

This addendum owns the detailed source-verification, negative-search, intake
role routing, single-agent multi-role, and source verification table rules for
CVF work orders.

Parent template:
`docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`

Folder index:
`docs/reference/work_order_template/README.md`

Applies to: work order section `## 6A. Source-Fidelity Pass` and any
dispatch-ready work order that names runtime or source facts.

## Scope / Target / Owner Boundary

Target: work order section `## 6A. Source-Fidelity Pass` and any dispatch-ready
work order that names runtime or source facts.

Owner boundary: this addendum defines authoring discipline for source-fact
verification. It does not own runtime behavior, live proof, or public-sync scope.

## Applies To

Apply this addendum when a work order:

- names runtime fields, interfaces, functions, types, schema keys, receipt
  fields, diagnostic classes, role values, route states, template IDs, pack
  IDs, policy enums, config keys, CLI/MCP tool names, or existing source paths;
- claims a token or field is absent (`NOT FOUND` / `BLOCKED_SOURCE_NOT_FOUND`);
- includes an Intake Role Routing Decision or Single-Agent Multi-Role block.

## Source-Fidelity Pass Rules

Before marking a work order ready for execution, verify every source fact it
names.

Required preflight commands:

```powershell
Test-Path "<existing path named in first reads>"
rg -n "<claimed function/type/templateId/role/policy field>" <source path>
rg -n --fixed-strings "<claimed token>" .
```

Required source-fidelity notes in the work order:

- Existing paths verified:
- Planned new paths clearly marked as NEW:
- Canonical role/type values verified from:
- Canonical template or pack IDs verified from:
- Runtime/source facts verified from current source or canonical contract:
- Completion review facts used only when no runtime/source contract exists:
- Draft-only tokens that appear nowhere else in repo:
- Same-token collisions with different meaning:
- Any missing or ambiguous source fact:

If a source fact cannot be verified, either correct the work order or return to
the orchestrator. Do not ask the implementer to discover that the work order
invented a path, symbol, role value, or baseline source.

### Source Priority

1. current runtime/source file or schema;
2. canonical reference/contract document;
3. completion review with explicit source trace;
4. handoff/session memory summary only as a pointer, not as source authority.

If a current runtime/source file exists, a completion review alone is not enough
to verify a field, enum, diagnostic class, route state, tool name, or schema key.

### Current Runtime Freshness Verification

If the work order claims a runtime/source capability is absent, not implemented,
hardcoded, per-role only, stale, missing, or intentionally not used in the
current lane, include a Current Runtime Freshness Verification section before
dispatch. This section must show the repo searches or source files that were
checked and must cite current owner paths for any partial implementation surface
found.

## Negative Search And Collision Discipline

If the work order claims a token, field, enum, schema key, failure token, or
config key is `NOT FOUND`, or uses `BLOCKED_SOURCE_NOT_FOUND`, include a
Negative Search And Collision Discipline section. The section must record:

- exact search roots;
- exact search command or structured query;
- coverage across source, tests, docs, JSON, and external evidence when
  applicable;
- same-token collision results;
- the absent-versus-collision disposition.

If the same token appears elsewhere with a different meaning, do not mark it
`NOT FOUND`. Record the collision or non-authoritative occurrence, cite it, and
explain why it is or is not binding for this work.

If a roadmap-derived work order claims complete ACCEPT_AS_OWNER_MAP coverage
from a source audit, include an ACCEPT_AS_OWNER_MAP coverage disposition that
names each accepted concept from the cited audit and marks it as in-scope,
already completed, deferred, rejected, or out-of-scope with reason.

## Intake Role Routing Decision

Ready or dispatched work orders must include an `## Intake Role Routing Decision`
block before worker execution. The orchestrator owns this block and must include
the fields required by:

`docs/reference/CVF_INTAKE_ROLE_ROUTING_DECISION_STANDARD_2026-06-11.md`

Unresolved routing keeps the work order in `HOLD_*` or `DRAFT`.

## Single-Agent Multi-Role Control Block

If one agent owns implementation plus review/closure roles, include the block
required by:

`docs/reference/CVF_SINGLE_AGENT_MULTI_ROLE_CONTROL_STANDARD_2026-06-11.md`

## Source Verification Table

If the work order names, maps, modifies, consumes, or instructs an agent to use
any runtime field, interface, function, type, schema key, receipt field,
diagnostic class, role value, route state, template ID, pack ID, policy enum,
config key, CLI/MCP tool name, or existing source path, include this table:

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| <field/type/path/etc.> | <source path> | <line or section> | <verified symbol> | <owner> | <ACCEPT/REJECT/BLOCKED_SOURCE_NOT_FOUND> |

### Table Rules

- `ACCEPT` requires direct verification from the cited source file or canonical
  contract.
- `REJECT` must name the corrected field/symbol when known.
- `BLOCKED_SOURCE_NOT_FOUND` stops dispatch and returns to Orchestrator.
- A source fact with no file plus line/section is not verified.
- Row type must be declared in the claimed item or owning schema: `EXISTS`,
  `VALUE_SET`, `LITERAL_INVARIANT`, `RUNTIME_BEHAVIOR`, or `DOC_ONLY_NEW`.
- `Verified path or symbol` must contain only the field, path, or symbol being
  verified — no value assignments or type annotations (use `rawMemoryReleased`,
  not `rawMemoryReleased: false`).
- Ready/dispatch rows must use final dispositions `ACCEPT`, `REJECT`, or
  `BLOCKED_SOURCE_NOT_FOUND`; do not use `REQUIRED` as a disposition in a
  ready/dispatch packet.
- For code sources, an `ACCEPT` row must cite a symbol that exists in the cited
  file; dotted symbols must exist under the cited owner/interface/class.
- `Verified line/section` must cite the symbol definition line, not a
  continuation line inside a multiline function signature or type body.
- `LITERAL_INVARIANT` requires the cited source to declare or assign the value
  literally, for example `field: false` or `field = false`.
- If the connector requires a safer value than the source globally guarantees,
  mark it as `DOC_ONLY_NEW` or "connector-normalized requirement", not as a
  source-proven invariant.
- If a claimed token appears only in this draft work order, mark it
  `BLOCKED_SOURCE_NOT_FOUND` unless it is in the New Doc-Only Fields table.
- If a claimed token appears elsewhere with a different meaning, record the
  collision, cite the occurrence, and explain why it is or is not binding.
- Table columns are canonical per:
  `docs/reference/CVF_SOURCE_VERIFICATION_TABLE_SHAPE_STANDARD_2026-06-11.md`
- Forbidden closeout vocabulary for source facts: `UNVERIFIED`, `TBD`, `TODO`,
  `confirm later`, `confirm field name`, `verify during implementation`.

### New Doc-Only Fields Table

When the work order introduces new documentation-only connector fields:

| New doc-only field | Purpose | Not sourced from runtime? | Runtime claim blocked? | Validation expectation |
|---|---|---|---|---|
| <field name> | <why it exists> | Yes | Yes | <doc/schema/checklist validation only> |

### MA1 Section Reference Lock

MA1 section references are locked to the canonical standard at:

`docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md`

Do not invent or rename MA1 sections. Allowed labels:

- `## 0. Surface Fidelity Gate`
- `## 1. Authority Chain`
- `## 2. Transfer Objective`
- `## 3. Source Packet`
- `## 4. Role Assignment`
- `## 5. Execution Instructions`
- `## 6. Role Output Schema`
- `## 7. Dissent And Review Ledger`
- `## 8. Integration Decision`
- `## 9. Completion Evidence`
- `## 10. Claim Boundary`

Any alternate MA1 section label is a blocking defect unless the canonical MA1
standard has been updated first.

## Claim Boundary

This addendum defines source-verification authoring discipline only. It does not
authorize runtime behavior, provider calls, live proof, public-sync, legacy
absorption, or autonomous mutation.
