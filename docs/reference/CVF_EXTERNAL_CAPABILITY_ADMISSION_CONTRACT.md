# CVF External Capability Admission Contract

Memory class: FULL_RECORD

Status: ACTIVE

docType: contract

Date: 2026-05-29

Contract version: `cvf.externalCapabilityAdmission.pd2.v1`

Phase: A — documentation contract extension only

---

## Purpose

Extend the CVF External Capability Admission scope beyond skill packs (ES1) to
include MCP servers, CLI tools, external repositories, and database sources.
This contract defines governed admission gates for each source type.

This is Phase A only. Phase B (runtime enforcement) requires a separate GC-018.

This closes CVF 25.05 Gap 6: ES1/C7B/C7C cover skill-only admission;
MCP, tool, repo, and database admission remain undefined.

## Scope / Applies To

Applies to: CVF external capability governance surface. Target: documentation
contract defining admission gates. No runtime enforcement.

---

## S1 — Purpose and Claim Boundary

### Purpose

CVF currently governs external skill pack admission through ES1 (`CVF_EXTERNAL_SKILL_INTAKE_SCREENING_PACKET`) and C7B/C7C intake and review. MCP servers, CLI tools, external repositories, and database sources are ungoverned — not allowed, not forbidden, not governed.

This contract extends the ES1 screening model to these additional source types
with type-specific admission gates, risk classification, and scope limits.

### Claim Boundary

This is a governance contract extension. It does not claim runtime enforcement,
live admission execution, MCP server execution, tool execution, repo scanning,
database access, or production readiness.

---

## S2 — Admission Gate Matrix

| Source type | Admission path | Risk class | Scope limit | Existing surface |
| --- | --- | --- | --- | --- |
| External skill pack | ES1 + C7B/C7C | R1 | Skill definition only; no execution | ES1, C7B, C7C |
| MCP server | New: MCP admission gate | R2 | Server origin, tool list, scope limit, sandbox required | LHW9-T1 `mcpApprovalAdvisoryType` |
| CLI tool | LHW6-T2 onboarding classification | R1 | Tool path, args, side-effects; LHW6-T2 governs | LHW6-T2 `cliToolOnboardingGovernanceConnector` |
| External repo | New: Repo admission gate | R2 | Provenance, license, dependency scan, scope limit | None (new) |
| Database source | W3/LHW5-T1 taxonomy | R2 | Read-only proof only; write remains blocked | LHW5-T1 `databaseActionBoundaryConnector` |

---

## S3 — MCP Server Admission Gate

### Gate Requirements

An MCP server must satisfy all of the following before admission:

1. **Server origin verification:** server endpoint URL, protocol (stdio/HTTP/WS),
   and transport security verified
2. **Tool list declaration:** complete list of exposed tools with parameter
   schemas, declared side effects, and sandbox requirement
3. **Scope limit:** tools must declare maximum scope per W3 tool action taxonomy
   (`tool_action_surface`, `tool_action_side_effect`, `runtime_execution_authorized`)
4. **Sandbox requirement:** any tool with `runtime_execution_authorized=true` must
   run in a declared sandbox environment
5. **Approval state:** mapped through LHW9-T1 `mcpApprovalAdvisoryType` states:
   `not_required`, `pending_approval`, `satisfied_but_not_executable`,
   `blocked_before_approval`, `blocked_by_policy`, `incomplete_approval`

### Blocked Scenarios

| Scenario | Disposition |
| --- | --- |
| Server origin unknown or unverifiable | BLOCKED — `provenance_unknown` |
| Tool list incomplete or undeclared | BLOCKED — `tool_list_incomplete` |
| Any tool has `runtime_execution_authorized=true` without sandbox | BLOCKED — `sandbox_required` |
| Server exceeds declared scope limit | BLOCKED — `scope_exceeded` |

### Admission Flow

```
MCP Server Registration
  → 1. Origin verification
  → 2. Tool list audit (W3 taxonomy mapping)
  → 3. Scope limit check (max declared scope)
  → 4. Sandbox requirement check
  → 5. Approval state assignment (LHW9-T1)
  → 6. Admission decision: ADMIT / HOLD / BLOCK
  → 7. Register in external capability inventory
```

---

## S4 — CLI Tool Admission Gate (LHW6-T2 Governed)

### Gate Requirements

CLI tool admission is governed by LHW6-T2 `cliToolOnboardingGovernanceConnector`.
No new admission gate is created for CLI tools. The LHW6-T2 gate covers:

1. **Tool classification:** `install_review_required`, `pending_approval`,
   `hold_for_approval`, `blocked_before_approval`, `allowed`
2. **Path verification:** tool executable path must exist and be source-verified
3. **Side-effect declaration:** W3 `ToolActionSideEffect` must be declared

### Admission Flow

```
CLI Tool Registration
  → 1. Path verification
  → 2. Side-effect declaration (W3)
  → 3. LHW6-T2 classification
  → 4. Admission decision: ALLOW / HOLD / BLOCK
  → 5. Register in external capability inventory
```

---

## S5 — External Repo Admission Gate

### Gate Requirements

An external repository must satisfy all of the following before admission:

1. **Provenance check:** repository origin URL, owner/maintainer verified,
   license type identified
2. **License compatibility:** license must be compatible with CVF's internal
   use (MIT, Apache-2.0, BSD-3-Clause, ISC, Unlicense, CC0; GPL-family requires
   legal review)
3. **Dependency scan:** third-party dependencies must not introduce known
   vulnerability chains at or above critical severity
4. **Scope limit:** repo code is read-only (no execution, no mutation); read
   access only for knowledge ingestion / reference purposes
5. **Cloning boundaries:** repo clone must be shallow, single-branch, and
   limited to the declared scope path

### Blocked Scenarios

| Scenario | Disposition |
| --- | --- |
| Repo origin unknown or unverifiable | BLOCKED — `provenance_unknown` |
| License incompatible with CVF internal use | BLOCKED — `license_incompatible` |
| Critical dependency vulnerability found | BLOCKED — `vulnerability_critical` |
| Repo requires execution or mutation access | BLOCKED — `execution_not_authorized` |

### Admission Flow

```
External Repo Registration
  → 1. Provenance check (origin, owner, license)
  → 2. License compatibility scan
  → 3. Dependency vulnerability scan
  → 4. Scope limit declaration (read-only, shallow clone)
  → 5. Admission decision: ADMIT_READ_ONLY / HOLD / BLOCK
  → 6. Register in external capability inventory
```

---

## S6 — Database Source Admission Gate (LHW5-T1 Governed)

### Gate Requirements

Database source admission is governed by LHW5-T1 `databaseActionBoundaryConnector`.
No new admission gate is created for database sources. The LHW5-T1 gate covers:

1. **Action classification:** all 7 `DatabaseActionFamily` values mapped
2. **Read-only boundary:** only `database_read` + `read_execution` → `allowed`;
   all mutation/schema/recovery/admin/export families → `blocked`
3. **Invariant:** `databaseMutationAuthorized=false`

### Admission Flow

```
Database Source Registration
  → 1. Declare required database actions
  → 2. LHW5-T1 classification
  → 3. Check: only read actions allowed
  → 4. Admission decision: ADMIT_READ_ONLY / BLOCK
  → 5. Register in external capability inventory
```

---

## S7 — External Capability Inventory

All admitted external capabilities must be registered in a capability inventory
with these fields:

| Field | Required | Description |
| --- | --- | --- |
| `capabilityId` | Yes | Unique identifier |
| `sourceType` | Yes | `skill_pack`, `mcp_server`, `cli_tool`, `external_repo`, `database_source` |
| `sourceOrigin` | Yes | URL, path, or endpoint |
| `admissionGoverningContract` | Yes | Which contract governs this capability |
| `admissionDecision` | Yes | `ADMIT`, `ADMIT_READ_ONLY`, `HOLD`, `BLOCK` |
| `admissionDate` | Yes | ISO 8601 timestamp |
| `scopeLimit` | Yes | Maximum allowed scope |
| `riskClass` | Yes | R0, R1, R2 |
| `approvedBy` | No | Operator or reviewer identity |
| `expiresAt` | No | Expiration date if time-limited |
| `notes` | No | Admission notes |

---

## S8 — Runtime Boundary

| Source type | Phase A status | Phase B requirement |
| --- | --- | --- |
| External skill pack | ES1 governs — operational | N/A (already operational) |
| MCP server | Admission gate defined — doc-only | Runtime origin verification and sandbox enforcement |
| CLI tool | LHW6-T2 governs — operational | N/A (already governed) |
| External repo | Admission gate defined — doc-only | Runtime provenance/license/dependency scanning |
| Database source | LHW5-T1 governs — operational | N/A (already governed) |

Phase A closes CVF 25.05 Gap 6 for MCP and repo scope. Phase B enforcement
requires separate GC-018 and live execution scope.

## Claim Boundary

This is a governance contract extension. It does not claim: runtime enforcement,
MCP server execution, tool execution, repo scanning, database access, live
admission workflow, provider behavior changes, receipt envelope schema changes,
hosted readiness, production readiness, or public release readiness.
