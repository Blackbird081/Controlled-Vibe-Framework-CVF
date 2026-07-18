# CVF LHW13-T1 Agent Reading Protocol Governance Connector Spec

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

Wave: LHW13 CLOSED_PASS_BOUNDED

docType: connector_spec

Date: 2026-05-29

---

## Purpose

This connector defines a documentation-only advisory that helps Orchestrators
judge whether an agent's capability claim is supported by the kind of file and
startup state the agent cites.

## Scope / Applies To

Applies to LHW13-T1 agent reading protocol governance. Target owner surface:
documentation-only connector specs and Orchestrator review packets. It does not
change runtime source, provider behavior, receipt envelopes, memory behavior, or
agent execution enforcement.

---

## S1 — Purpose and Gap Citation

Source gap: CVF 25.05 Gop_y.md Gap 1 — CLAUDE.md and AGENTS.md cover reading
rules piecemeal; no single connector maps claim-tier × canonical-file-type ×
startup acknowledgment status → a named `agentReadingAdvisoryType` that
Orchestrators can use to validate agent claims before acting.

An agent claiming "X is proven" should trigger a different reading advisory
than an agent claiming "X is roadmap." Without this connector, Orchestrators
must infer claim validity manually from file type and status tokens, creating
inconsistency across sessions and agents.

This connector normalizes the reading protocol into a machine-readable advisory
vocabulary. It does NOT enforce agent behavior at runtime. The reading advisory
is a governance planning record for Orchestrators. `runtimeExecutionAuthorized=false`.

Authority chain:
- LHW13 roadmap: `docs/roadmaps/CVF_LHW13_WORKFLOW_CONNECTOR_WAVE13_ROADMAP_2026-05-29.md`
- LHW13 GC-018: `docs/baselines/CVF_GC018_LHW13_WORKFLOW_CONNECTOR_WAVE13_2026-05-29.md`
- CLAUDE.md: Mandatory Startup Acknowledgment section
- Session state: `CVF_SESSION/ACTIVE_SESSION_STATE.json` — `requiredFirstReads` at line 80

---

## S2 — Connector Design

### Claim-Tier Vocabulary (connector-normalized)

Derived from CVF Release Readiness source statuses and CVF claim-boundary doctrine.
These are doc-only planning values; not runtime/source enum values.

| `claimTier` | Source-status mapping | Meaning |
| --- | --- | --- |
| `proven` | `ALIGNED` (all required evidence present and runtime-backed) | Claim is backed by runtime source or completion evidence |
| `active` | `SUBSTANTIALLY ALIGNED` (GC-018 authorized, in-session) | Claim is authorized and session-active; no live proof required |
| `schema_defined` | `ALIGNED WITH CAVEATS` (schema/contract only, not runtime-proven) | Claim is schema or contract only; no live execution proven |
| `roadmap` | Status: `ACTIVE` roadmap / `DEMAND_GATED` / `WORK_ORDER_READY` | Claim is future intent; block if agent implies current capability |

### Canonical File-Type Classes

| `canonicalFileType` | Exemplar path | Trust anchor |
| --- | --- | --- |
| `runtime_source` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | Highest trust — compiled and executed |
| `completion_review` | `docs/reviews/CVF_LHW11_T1_*_COMPLETION_2026-05-28.md` | Evidence-backed closure record |
| `gc018_baseline` | `docs/baselines/CVF_GC018_LHW13_WORKFLOW_CONNECTOR_WAVE13_2026-05-29.md` | GC-018 authorized scope record |
| `session_front_door` | `CVF_SESSION_MEMORY.md` (value of `activeSessionFrontDoor`) | Session-scoped startup anchor |

### Startup Acknowledgment Status Axis

| `startupAcknowledgmentStatus` | Condition |
| --- | --- |
| `acknowledged` | Agent has read `CVF_SESSION_MEMORY.md` and resolved `ACTIVE_SESSION_STATE.json` |
| `missing` | Agent has not confirmed startup front door before material work |

### Output Advisory Mapping

`claimTier` × `canonicalFileType` × `startupAcknowledgmentStatus` → `agentReadingAdvisoryType` + `claimValidationAdvisory`:

| `claimTier` | `canonicalFileType` | `startupAcknowledgmentStatus` | `agentReadingAdvisoryType` | `claimValidationAdvisory` |
| --- | --- | --- | --- | --- |
| `proven` | `runtime_source` | `acknowledged` | `reading_claim_verified` | Claim backed by runtime source; advisory-clear for Orchestrator action |
| `proven` | `completion_review` | `acknowledged` | `reading_claim_evidence_backed` | Claim backed by completion evidence; advisory-clear |
| `active` | `gc018_baseline` | `acknowledged` | `reading_claim_authorized` | Claim authorized by GC-018; no live proof required for advisory acceptance |
| `active` | `session_front_door` | `acknowledged` | `reading_claim_session_bounded` | Claim valid within this session scope; advise re-verification on new session |
| `schema_defined` | any | `acknowledged` | `reading_claim_schema_only` | Claim is schema/contract only; no live execution proven; advise caution before acting |
| `roadmap` | any | `acknowledged` | `reading_claim_future_only` | Claim is roadmap only; block if agent implies current capability |
| any | any | `missing` | `reading_claim_startup_incomplete` | Agent must resolve startup front door before any material governed work |

---

## S3 — Invariants and Boundary

1. `runtimeExecutionAuthorized=false` — this connector does not enforce agent
   behavior at runtime. No agent action is blocked or permitted by this advisory.
2. Startup acknowledgment status is the highest-priority axis: `missing` produces
   `reading_claim_startup_incomplete` regardless of claim tier or file type.
3. `claimTier=roadmap` always produces `reading_claim_future_only` regardless of
   file type or startup status when startup is `acknowledged`.
4. `claimValidationAdvisory` is a planning record only; Orchestrators must apply
   their own judgment based on the advisory output.
5. This connector does not introduce new session state, receipt envelopes, or
   memory structures.

---

## S4 — Non-Goals

- Runtime agent behavior enforcement or blocking
- Receipt envelope extension
- Memory reinjection or capture
- New role taxonomy or RBAC changes
- Provider behavior changes
- Hosted readiness, production readiness, or public release readiness
- Universal translation or language mediation
- Any tranche beyond T1 without T1 completion confirmation

---

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| Startup first-read registry exists | `CVF_SESSION/ACTIVE_SESSION_STATE.json` | required first reads registry | `requiredFirstReads` | Active session state registry | ACCEPT |
| Startup acknowledgment registry exists | `CVF_SESSION/ACTIVE_SESSION_STATE.json` | startup acknowledgment registry | `startupAcknowledgmentRequired` | Active session state registry | ACCEPT |
| Active session front door path exists | `CVF_SESSION/ACTIVE_SESSION_STATE.json` | active session front door key | `activeSessionFrontDoor` | Active session state registry | ACCEPT |
| Release-readiness `ALIGNED` status exists | `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md` | status rows | `ALIGNED` | Release-readiness status reference | ACCEPT |
| Release-readiness `SUBSTANTIALLY ALIGNED` status exists | `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md` | status rows | `SUBSTANTIALLY ALIGNED` | Release-readiness status reference | ACCEPT |
| Release-readiness `ALIGNED WITH CAVEATS` status exists | `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md` | status rows | `ALIGNED WITH CAVEATS` | Release-readiness status reference | ACCEPT |
| LHW13 GC-018 baseline exists | `docs/baselines/CVF_GC018_LHW13_WORKFLOW_CONNECTOR_WAVE13_2026-05-29.md` | file root | `CVF_GC018_LHW13_WORKFLOW_CONNECTOR_WAVE13_2026-05-29.md` | LHW13 GC-018 baseline | ACCEPT |
| Completion review exemplar exists | `docs/reviews/CVF_LHW11_T1_SESSION_GOVERNANCE_POSTURE_AGGREGATOR_CONNECTOR_COMPLETION_2026-05-28.md` | file root | `CVF_LHW11_T1_SESSION_GOVERNANCE_POSTURE_AGGREGATOR_CONNECTOR_COMPLETION_2026-05-28.md` | LHW11-T1 completion review | ACCEPT |
| Runtime source exemplar exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | file root | `workflow-resolver.ts` | workflow resolver runtime source | ACCEPT |

## New Doc-Only Fields

| Field | Definition surface | Runtime/source status | Dispatch disposition |
| --- | --- | --- | --- |
| `agentReadingAdvisoryType` | S2 output advisory mapping | New documentation-only connector field | Defined by this connector spec; not source-verified as existing runtime |
| `claimValidationAdvisory` | S2 output advisory mapping | New documentation-only connector field | Defined by this connector spec; not source-verified as existing runtime |
| `claimTier` values: `roadmap`, `schema_defined`, `active`, `proven` | S2 claim-tier vocabulary | Connector-normalized values derived from source-status concepts | Defined by this connector spec; not source-verified as existing runtime |
| `canonicalFileType` values: `runtime_source`, `completion_review`, `gc018_baseline`, `session_front_door` | S2 canonical file-type classes | Connector-normalized values derived from exemplar source classes | Defined by this connector spec; not source-verified as existing runtime |
| `startupAcknowledgmentStatus` values: `acknowledged`, `missing` | S2 startup acknowledgment axis | Connector-normalized values derived from session startup rules | Defined by this connector spec; not source-verified as existing runtime |

---

## Claim Boundary

This connector produces a documentation planning record. It does not claim
runtime agent enforcement, receipt envelope extension, memory reinjection,
provider behavior, hosted readiness, production readiness, or public release
readiness.

T2 gate answer: YES — T1 reading protocol reveals that when an agent claims
memory continuity, no connector maps `memorySnapshotAdvisoryType` ×
`canReinject` × `memoryContextSeedDecayAdvisoryType` → a named
`memoryContinuityLevelAdvisoryType` (L0/L1/L2/L3). T2 closes that gap.
