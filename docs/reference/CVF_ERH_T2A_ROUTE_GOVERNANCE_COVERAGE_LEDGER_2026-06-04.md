# CVF ERH-T2A Route Governance Coverage Ledger

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-04

Work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_ERH_T2A_ROUTE_GOVERNANCE_COVERAGE_LEDGER_2026-06-04.md`

## Purpose

Provide a complete, bounded route ledger for external-review hardening. This is
not a live route proof. It is a filesystem-backed map of current API routes,
visible auth/governance evidence, and gap dispositions.

## Scope / Target / Owner Boundary

Target corpus:
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/**/route.ts`

Out of scope: runtime edits, route tests, live provider calls, CI workflow edits,
and public README/catalog changes.

## Corpus Completeness And Report Integrity

| Requirement | Evidence |
| --- | --- |
| Filesystem enumeration | `Get-ChildItem -LiteralPath 'EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api' -Recurse -Filter route.ts` |
| Enumerated files | 68 |
| Processing ledger | route table below, one row per file |
| Exclusions | none |
| Unreadable or unsupported files | none |
| Aggregation check | route table rows equal enumerated file count |
| Drift check | PASS at authoring; rerun enumeration before public export |
| Output traceability | each row cites the route source path |
| Adversarial verification | lexical-hit evidence is not treated as semantic proof |
| Verdict | COMPLETE_VERIFIED |

## Disposition Legend

| Disposition | Meaning |
| --- | --- |
| GOVERNED_OR_GOVERNANCE_PROXY | route visibly participates in governance/approval/evidence/proxy flow, but still needs route-specific tests for stronger claims |
| ADMIN_AUTH_BOUNDARY | route is admin-auth or policy/admin surface; not public user execution proof |
| AUTH_SESSION_BOUNDARY | route is auth/session scoped; governance proof depends on caller flow |
| PUBLIC_INFO_OR_HEALTH_BOUNDARY | route appears informational/health/openapi/pricing/provider readout |
| MISSING_ROUTE_GOVERNANCE_PROOF | no visible auth/governance proof in shallow route scan; do not cite as governed |
| MOCK_OR_LOCAL_ONLY_BOUNDARY | route appears demo/local/test/session utility; not public governance evidence |

## Route Ledger

| Route source path | Methods | Visible auth evidence | Visible governance evidence | Disposition |
| --- | --- | --- | --- | --- |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/audit-feed/route.ts` | GET | admin-auth | audit lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/audit/route.ts` | GET, POST | admin-auth | audit lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/dlp/policy/route.ts` | GET, POST | admin-auth | policy lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/finops/route.ts` | GET | admin-auth | none visible | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/impersonate/end/route.ts` | POST | session/service auth | audit/governance lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/impersonate/route.ts` | POST | admin-auth | audit/governance lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/knowledge/audit/route.ts` | GET | admin-auth | audit lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/knowledge/collections/[id]/chunks/[chunkId]/route.ts` | DELETE | admin-auth | none visible | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/knowledge/collections/[id]/chunks/route.ts` | POST | admin-auth | none visible | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/knowledge/collections/[id]/route.ts` | DELETE, PUT | admin-auth | none visible | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/knowledge/collections/route.ts` | POST | admin-auth | none visible | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/quota/override/route.ts` | DELETE, POST | admin-auth | policy/governance lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/quota/policy/route.ts` | POST | admin-auth | policy/governance lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/siem/route.ts` | GET, POST | admin-auth | audit/governance lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/tool-registry/knowledge-scope/route.ts` | POST | admin-auth | policy lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/tool-registry/policy/route.ts` | POST | admin-auth | policy lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/admin/tool-registry/route.ts` | GET | admin-auth | policy lexical hit | ADMIN_AUTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/approvals/[id]/route.ts` | GET, PATCH | admin/session auth | approval/audit/envelope lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/approvals/route.ts` | GET, POST | admin/session auth | `buildGovernanceEnvelope` lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/artifacts/export/route.ts` | POST | none visible | receipt/source hash lexical hit | MISSING_ROUTE_GOVERNANCE_PROOF |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/auth/[...nextauth]/route.ts` | NextAuth handler | next-auth handler | none visible | AUTH_SESSION_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/auth/login/route.ts` | POST | session auth | none visible | AUTH_SESSION_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/auth/logout/route.ts` | GET, POST | none visible | none visible | AUTH_SESSION_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/auth/me/route.ts` | GET | session auth | none visible | AUTH_SESSION_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` | POST | session/service auth | governance/audit/risk lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/approve/route.ts` | POST | session auth | governance approval lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/brand-drift/route.ts` | GET | none visible | governance proxy lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/evaluate/route.ts` | POST | session auth | governance evaluate lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/evidence/route.ts` | GET | none visible | evidence lexical hit | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/prepare/route.ts` | POST | session auth | external asset governance lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/register/route.ts` | GET, POST | session auth | pipeline authority lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/retire/route.ts` | POST | session auth | external asset governance lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/false-positive-report/route.ts` | GET, POST | session auth | audit/receipt lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/health/route.ts` | GET | none visible | governance health lexical hit | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/knowledge/compile/route.ts` | POST | session auth | knowledge governance lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/knowledge/maintain/route.ts` | POST | session auth | knowledge governance lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/knowledge/refactor/route.ts` | POST | session auth | knowledge governance lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/ledger/route.ts` | GET | session auth | governance ledger lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/metrics/route.ts` | GET | none visible | governance metrics lexical hit | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/override/route.ts` | POST | none visible | governance override lexical hit | MISSING_ROUTE_GOVERNANCE_PROOF |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/overrides/active/route.ts` | GET | none visible | governance override lexical hit | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/risk-convert/route.ts` | POST | session auth | governance risk lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/simulate/route.ts` | POST | none visible | governance simulate lexical hit | MOCK_OR_LOCAL_ONLY_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/trends/route.ts` | GET | none visible | governance trends lexical hit | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/audit-log/route.ts` | GET | none visible | audit lexical hit | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/evaluate/route.ts` | GET, POST | none visible | guard evaluate lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/health/route.ts` | GET | none visible | guard health lexical hit | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/openapi/route.ts` | GET | none visible | openapi lexical hit | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/phase-gate/route.ts` | GET, POST | none visible | phase-gate lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/integrations/test/route.ts` | POST | none visible | none visible | MOCK_OR_LOCAL_ONLY_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/kernel-telemetry/route.ts` | GET | none visible | trace/policy/risk lexical hit | MOCK_OR_LOCAL_ONLY_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/knowledge/ingest/route.ts` | POST | none visible | none visible | MISSING_ROUTE_GOVERNANCE_PROOF |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/learning-plane/readout/route.ts` | POST | session/service auth | learning readout lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/lpci/corpus/[corpusId]/status/route.ts` | GET | none visible | none visible | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/lpci/intake/route.ts` | POST | none visible | receipt/policy lexical hit | MISSING_ROUTE_GOVERNANCE_PROOF |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/lpci/query/route.ts` | POST | none visible | governance lexical hit | MISSING_ROUTE_GOVERNANCE_PROOF |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | POST | session/service auth | memory governance lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/write/route.ts` | POST | session/service auth | memory governance lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/openclaw/route.ts` | GET, POST | none visible | none visible | MOCK_OR_LOCAL_ONLY_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/pricing/route.ts` | GET | none visible | none visible | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/providers/route.ts` | GET | none visible | provider lexical hit | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/runtime/observability/route.ts` | GET | none visible | none visible | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/sessions/[id]/route.ts` | DELETE, GET, PUT | none visible | none visible | MOCK_OR_LOCAL_ONLY_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/sessions/route.ts` | GET, POST | session auth | none visible | AUTH_SESSION_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/system/health/route.ts` | GET | none visible | none visible | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/system/jobs/route.ts` | GET, POST | session auth | governance job lexical hit | GOVERNED_OR_GOVERNANCE_PROXY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/system/modules/route.ts` | GET | none visible | none visible | PUBLIC_INFO_OR_HEALTH_BOUNDARY |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/tools/policies/route.ts` | GET | session auth | policy lexical hit | AUTH_SESSION_BOUNDARY |

## Gap Summary

| Disposition | Count | Public claim consequence |
| --- | --- | --- |
| GOVERNED_OR_GOVERNANCE_PROXY | 21 | cite only as route-inventory evidence, not live proof |
| ADMIN_AUTH_BOUNDARY | 17 | public docs should call these admin/control-plane surfaces |
| AUTH_SESSION_BOUNDARY | 6 | public docs should avoid treating auth/session routes as governance proof |
| PUBLIC_INFO_OR_HEALTH_BOUNDARY | 14 | informational/health/readout route caveat required |
| MISSING_ROUTE_GOVERNANCE_PROOF | 5 | follow-up route hardening or explicit public caveat required |
| MOCK_OR_LOCAL_ONLY_BOUNDARY | 5 | mock/local/demo caveat required |

## Corpus Intelligence Classification

- Classification task class: GOVERNANCE_QA
- Source corpus evidence: `## Corpus Completeness And Report Integrity` in this packet
- Knowledge map evidence: N/A with reason: this ledger maps route surfaces, not a retrievable knowledge map
- Classification ledger: inline `### Corpus Intelligence Classification Ledger`
- Legal/policy corpus: NO
- Domain fields: N/A with reason: web API route inventory is not legal/policy corpus
- Response Boundary: DIRECT_CITED_ANSWER, SUMMARY_WITH_SOURCE, PROCEDURAL_GUIDANCE, ESCALATE_OR_ABSTAIN
- Adversarial sampling plan: shallow adversarial check verifies lexical hits are not semantic governance proof
- Classification verdict: CLASSIFIED_STRUCTURAL_PASS

### Corpus Intelligence Classification Ledger

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer | answerClass | domainFields |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/**/route.ts` | READ_SHALLOW | GOVERNANCE | RUNTIME_ROUTE | ACCEPT_SUMMARY_ONLY | Route Ledger section | SUMMARY_WITH_SOURCE | N/A with reason: non-legal route inventory |

Response-boundary interpretation:

| Class | Allowed use |
| --- | --- |
| DIRECT_CITED_ANSWER | file count, route path presence, and visible lexical/auth evidence only |
| SUMMARY_WITH_SOURCE | gap summary and disposition counts |
| PROCEDURAL_GUIDANCE | ERH-T2B CI plan input |
| ESCALATE_OR_ABSTAIN | semantic runtime enforcement or live governance behavior claims |

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| Route coverage evidence was incomplete for external-agent review | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | add route-ledger drift check candidate after public-sync |
| Five routes lack visible route governance proof in shallow scan | RUNTIME_SIGNAL_GAP | RUNTIME_BEHAVIOR_LEARNING | RUNTIME_LEARNING_CANDIDATE | open separate route hardening work only if claim boundary requires it |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance route ledger. Public README/catalog export requires
ERH-T1B from the public-sync clone.

Next action: future public docs may summarize this ledger only with the explicit
boundary that it is shallow source inventory, not live route proof.

## Claim Boundary

This ledger proves route enumeration completeness for the checked source tree
and records shallow source evidence. It does not prove semantic enforcement,
auth correctness, live provider behavior, production readiness, or public export.
