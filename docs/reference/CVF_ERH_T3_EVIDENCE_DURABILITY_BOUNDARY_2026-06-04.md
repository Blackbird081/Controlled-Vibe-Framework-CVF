# CVF ERH-T3 Evidence Durability Boundary

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-04

Work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_ERH_T3_EVIDENCE_DURABILITY_BOUNDARY_2026-06-04.md`

## Purpose

Define the current evidence durability claim boundary for ERH. This packet is
for public claim calibration and future roadmap routing; it is not a runtime
hardening implementation.

## Scope / Target / Owner Boundary

Target surfaces:

- web control-plane event storage and CSV export signing;
- guard-contract SQLite audit storage wrapper;
- web rate limiter;
- web safety filter;
- web governance `policySnapshotId`;
- operational benchmark extension live-emission contract.

Out of scope: code changes, live proof, provider calls, production-readiness
claims, and public-sync edits.

## Evidence Durability Tier Ledger

| Surface | Source evidence | Current boundary | Public claim disposition |
| --- | --- | --- | --- |
| Web control-plane event store | `control-plane-events.ts` lines 86-89 | default path falls back to OS temp JSON unless `CVF_CONTROL_PLANE_EVENTS_PATH` is set | BOUNDED_NOT_DURABLE_BY_DEFAULT |
| CSV audit export signing | `control-plane-events.ts` lines 347-354 | signing is optional and key-gated; unsigned export warning exists | BOUNDED_OPTIONAL_SIGNING |
| Guard-contract audit storage | `sqlite-db.ts` lines 50-65 | SQLite audit wrapper exists in guard-contract package | ALLOWED_AS_SEPARATE_GUARD_CONTRACT_STORAGE |
| Rate limiting | `rate-limit.ts` lines 6-7 and 40-54 | in-memory maps per process | LOCAL_ONLY_NOT_DISTRIBUTED |
| Safety filter | `safety.ts` lines 1-35 | regex/pattern arrays for injection and PII-like strings | PATTERN_FILTER_NOT_ML_DLP |
| `policySnapshotId` | `web-governance-envelope.ts` lines 39-50 | date plus monotonic process counter, comment states future persisted policy version | PROCESS_LIFETIME_NOT_POLICY_VERSION |
| Benchmark live emission | `runtime-workflow.contract.ts` lines 85-90 and 206-226 | contract literal keeps `liveEmissionWired` false | DO_NOT_CLAIM_LIVE_EMISSION |

## Public Claim Rules

| Topic | Allowed public wording | Forbidden public wording |
| --- | --- | --- |
| Audit persistence | CVF has multiple evidence surfaces; web event storage needs explicit configured path for stronger persistence | all audit evidence is durable by default |
| Signing | CSV export can be signed when `CVF_AUDIT_SIGNING_KEY` is configured | all exports are always signed/hash-chained |
| SQLite | guard-contract package includes SQLite audit wrapper | web control-plane tmp JSON is the same as guard-contract SQLite persistence |
| Rate limit | current web limiter is local process protection | production distributed quota enforcement |
| Safety | pattern-based safety/PII screening is present | comprehensive ML DLP |
| Policy version | current web `policySnapshotId` identifies request-time process snapshot | persisted policy version or policy hash |
| Benchmark telemetry | benchmark contract records metrics with live emission not wired | live operational benchmark stream exists |

## Runtime Follow-Up Candidates

| Candidate | Trigger | Required new authority |
| --- | --- | --- |
| Non-tmp web audit default or managed store | public claim needs durable web evidence | fresh runtime GC-018/work order |
| Mandatory signing or hash chain | public claim needs signed tamper-evident export | fresh runtime/security work order |
| Distributed rate limiter | hosted/public deployment claim | fresh runtime work order |
| Persisted policy version/hash | public docs need stable policy-version evidence | fresh runtime/receipt work order |
| Stronger DLP classifier | public claim needs DLP beyond regex | fresh safety roadmap |
| Benchmark live emission wiring | benchmark telemetry claim | fresh runtime benchmark work order |

## Decision / Baseline / Proposed Tranche

Decision: T3 remains docs-only. Runtime-adjacent gaps are accepted as current
known boundaries and routed to future implementation only if the public claim
surface requires stronger behavior.

Baseline for ERH-T4: the current posture is not production-readiness proof. The
`next-auth` beta decision should therefore be framed as current-scope risk
acceptance or migration planning, not as hosted production certification.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| Durability language could overstate web evidence | RUNTIME_SIGNAL_GAP | RUNTIME_BEHAVIOR_LEARNING | RUNTIME_LEARNING_CANDIDATE | keep public wording bounded until runtime roadmap |
| Policy snapshot name can be overread as persisted version | RUNTIME_SIGNAL_GAP | RUNTIME_BEHAVIOR_LEARNING | RUNTIME_LEARNING_CANDIDATE | route persisted policy versioning to future runtime work |
| Benchmark contract can be overread as live telemetry | OPERATOR_SCOPE_CLARITY_GAP | DOCUMENTATION_ONLY_LEARNING | TEMPLATE_UPDATED | require `liveEmissionWired` caveat in public docs |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance boundary packet. It includes no public-sync remote,
public commit, or public artifact path evidence.

Next action: ERH-T1B may export summarized caveats after the public-sync work
order is opened in the public-sync clone.

## Claim Boundary

This packet documents current source-backed boundaries only. It does not change
runtime behavior, prove live governance behavior, or establish production/public
readiness.
