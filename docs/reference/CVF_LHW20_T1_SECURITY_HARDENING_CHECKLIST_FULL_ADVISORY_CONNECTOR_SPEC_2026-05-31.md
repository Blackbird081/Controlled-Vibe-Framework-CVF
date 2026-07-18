# CVF LHW20 T1 — Security Hardening Checklist Full Advisory Connector Spec

Contract ID: `cvf.securityHardeningChecklistFull.lhw20.t1.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW20 T1

GC-018: `docs/baselines/CVF_GC018_LHW20_CVF_IMPORTANT_DEEP_SCAN_WAVE_2026-05-31.md`

runtimeExecutionAuthorized: false

---

## Purpose

Document all 9 items from `CVF_SECURITY_HARDENING_CHECKLIST.md`. LHW17 T1 covered 3 items (H1 Path Normalization, H2 No Direct Execution, H3 Capability Request Governance). This spec adds the remaining 6 items from the full checklist.

## Scope / Applies To

All CVF runtime surfaces that enforce capability, execution isolation, or agent boundaries. Implementation of any item requires a separate governed tranche.

## CVF Owner Surfaces

| Item | Owner |
| --- | --- |
| H1-H3 (from LHW17 T1) | `CVF_v1.7.1_SAFETY_RUNTIME` + Delta D3 + `CVF_GUARD_CONTRACT` |
| H4-H9 (this spec) | `CVF_v1.2_CAPABILITY_EXTENSION` + `CVF_v1.7.1_SAFETY_RUNTIME` + `CVF_GUARD_CONTRACT` |

---

## Advisory Type

`securityHardeningChecklistFullAdvisoryType`

---

## Items from LHW17 T1 (reference only)

H1 Path Normalization — `CVF_LHW17_T1` advisory.
H2 No Direct Execution Guarantee — `CVF_LHW17_T1` advisory.
H3 Capability Request Governance (no auto-grant, audit log, rate limit) — `CVF_LHW17_T1` advisory.

---

## 6 Additional Hardening Items (NEW)

### H4 — Capability Hierarchy Enforcement (no parent auto-grants child)

**Source:** `CVF_CAPABILITY_AND_PERMISSION_MODEL.md` §4.2

**Advisory:** Granting `filesystem.*` must NOT automatically grant `filesystem.delete`. Each capability in the hierarchy must be explicitly granted. Parent capabilities are grouping constructs only.

**CVF gap:** Current `CVFRole` grants are coarse (role-level, not capability-level). Capability hierarchy enforcement requires UCO implementation tranche.

**Hardening boundary:** Document only. Implementation requires UCO tranche.

---

### H5 — Execution-Scoped Secret TTL

**Source:** `CVF_TRUST_AND_ISOLATION_LAYER.md` §5, `CVF_AGENT_RUNTIME_PROTOCOL.md` §9

**Advisory:** Secrets must be:
1. Bound to `execution_id` (not agent_id)
2. Decrypted just-in-time at Execution Proxy
3. Destroyed after execution ends
4. Never logged, never returned in output, never cached

**CVF gap:** Current API keys are loaded at server start from env vars. No execution-scoped TTL. Keys persist across requests.

**Hardening boundary:** Advisory only. Key rotation + execution-scoped binding requires separate security tranche.

---

### H6 — Agent-Level Context Isolation (no cross-agent contamination)

**Source:** `CVF_TRUST_AND_ISOLATION_LAYER.md` §4, `CVF_CAPABILITY_INTEGRATION_SPEC.md` §2

**Advisory:** Each execution must have:
- Its own context (no reuse from other executions)
- Its own credential scope
- Context marked with `context_id`, `owner: execution_id`, `scope: private|shared`
- Context sharing only via explicit policy allow + `shared` flag

**CVF gap:** Current `/api/execute` uses per-request scope but no formal context isolation contract. Workflow chains can share context; no explicit policy check.

**Hardening boundary:** Advisory only. Formal context isolation contract requires UCO tranche.

---

### H7 — Agent-to-Agent Communication Restriction (default DENY)

**Source:** `CVF_TRUST_AND_ISOLATION_LAYER.md` §6

**Advisory:** Agent-to-agent communication must default to DENY. Communication only allowed when:
- Explicitly defined in policy: `{ from, to, allowed: true, scope: limited_context }`
- Only filtered/structured data shared — no raw context, no full memory

**CVF gap:** Multi-agent workflows (WCE W1-W3) pass outputs between agents but have no explicit communication policy gate. `limited_context` restriction not enforced.

**Hardening boundary:** Advisory only. Communication policy gate requires separate tranche.

---

### H8 — Failure Severity Classification (Low/Medium/High/Critical)

**Source:** `CVF_FAILURE_AND_SAFETY_LAYER.md` §9

**Advisory:** Failures must be classified by severity before containment action:
- **Low:** retryable error → retry with same agent
- **Medium:** repeated failure → increase supervision, log pattern
- **High:** security violation, data leak risk → terminate execution, isolate context
- **Critical:** system compromise, cross-agent contamination → immediate shutdown, agent quarantine

**CVF gap:** EL-2/EL-3 handle timeout+deadlock but classify all as the same level. No severity-differentiated containment.

**Hardening boundary:** Advisory only. Severity classification in containment engine requires separate EL tranche.

---

### H9 — Cross-Check Detection (expected vs actual state)

**Source:** `CVF_FAILURE_AND_SAFETY_LAYER.md` §4.2 (Cross-check CRITICAL)

**Advisory:** Failure detection must NOT rely solely on agent self-report. The system must cross-check:
- Expected outcome (from Control/Task definition)
- Actual state (from environment/tool output)

Example: `{ expected: "file deleted", actual: "file still exists" }` → trigger integrity failure.

**CVF gap:** CVF validates agent output format (guard contract) but does not cross-check against expected environment state. GovernanceEvidenceReceipt contains `decision` but not `expectedOutcome vs actualState`.

**Hardening boundary:** Advisory only. State cross-check requires new integration with execution environment.

---

## Full Checklist Status

| Item | Description | Status in CVF |
| --- | --- | --- |
| H1 Path Normalization | canonical path before scope check | ADVISORY (LHW17 T1) |
| H2 No Direct Execution | proxy-only, no raw shell | ADVISORY (LHW17 T1) |
| H3 Capability Request Governance | no auto-grant, audit log | ADVISORY (LHW17 T1) |
| H4 Capability Hierarchy | parent does not grant child | ADVISORY (this spec) |
| H5 Secret TTL | execution-scoped, JIT decrypt | ADVISORY (this spec) |
| H6 Context Isolation | no cross-execution contamination | ADVISORY (this spec) |
| H7 Agent Communication Restriction | default DENY | ADVISORY (this spec) |
| H8 Severity Classification | Low/Med/High/Critical containment | ADVISORY (this spec) |
| H9 Cross-Check Detection | expected vs actual state | ADVISORY (this spec) |

---

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW20_CVF_IMPORTANT_DEEP_SCAN_WAVE_2026-05-31.md`
- LHW17 T1: `docs/reference/archive/CVF_LHW17_T1_TRUST_ISOLATION_HARDENING_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- Source: `.private_reference/legacy/CVF_Important/ADDING_TRUST & ISOLATION LAYER/CVF_SECURITY_HARDENING_CHECKLIST.md`

## Claim Boundary

Advisory only. All 9 items documented. Implementation of H4-H9 requires separate governed tranche. No code change in this wave.

## Invariants

- `runtimeExecutionAuthorized=false`
- R0-R3 preserved
- No route.ts change
- No code change
