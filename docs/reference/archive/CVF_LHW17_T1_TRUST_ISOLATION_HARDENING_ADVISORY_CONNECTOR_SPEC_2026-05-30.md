# CVF LHW17 T1 — Trust & Isolation Hardening Advisory Connector Spec

Contract ID: `cvf.trustIsolationHardeningAdvisory.lhw17.t1.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-30

Wave: LHW17 T1

GC-018: `docs/baselines/CVF_GC018_LHW17_CVF_IMPORTANT_ABSORPTION_WAVE_2026-05-30.md`

runtimeExecutionAuthorized: false

---

## Purpose

Document the 3 mandatory Trust & Isolation hardening items from the Red Team Attack Scenarios
source as advisory connector specs against existing CVF owner surfaces. Closes the EA CONDITIONAL
finding on Review 12 for the LHW17 doc-only scope.

## Scope / Applies To

Applies to any future CVF runtime surface that enforces file-scope constraints, manages agent
execution paths, or processes capability requests. Does NOT authorize implementation in this wave.

## Source

`.private_reference/legacy/CVF_Important/ADDING_TRUST & ISOLATION LAYER/Red Team Attack Scenarios.md`

EA finding: `EA_CROSS_CHECK_ASSESSMENT.md` — Review 12 downgraded from FULL CANDIDATE to CONDITIONAL
pending 3 hardening items. Outstanding since 2026-03-21.

---

## Purpose

Closes the EA CONDITIONAL finding on Trust & Isolation (Review 12) by documenting the 3 mandatory
hardening items as advisory connector specs against existing CVF owner surfaces. This is
documentation-only — it does not implement runtime enforcement.

---

## CVF Owner Surfaces

| Layer | Owner module |
| --- | --- |
| Sandbox boundary | `CVF_v1.7.1_SAFETY_RUNTIME` + Delta D3 `cvf_invoke_cli_stage` in-process guarantee |
| Capability Gate | `CVF_v1.2_CAPABILITY_EXTENSION` + `CVF_GUARD_CONTRACT` |
| Policy Engine | `CVF_ECO_v1.2_LLM_RISK_ENGINE` + `CVF_v1.6.1_GOVERNANCE_ENGINE` |

---

## Advisory Type

`trustIsolationHardeningAdvisoryType`

---

## 3 Hardening Items — Advisory Boundary

### H1 — Path Normalization (CRITICAL)

**Source finding:** Red Team Scenario 2 — path traversal `../../etc/passwd` bypasses scope check
if path is not normalized before comparison.

**Advisory:** Any CVF surface that enforces a file-scope or path-scope capability constraint MUST
normalize the requested path to its canonical form before performing the scope comparison.

```
normalize(requestedPath) → canonicalPath
scopeCheck(canonicalPath, allowedScope) → ALLOW | DENY
```

**CVF owner surface:** `CVF_v1.2_CAPABILITY_EXTENSION` scope enforcement path.

**Hardening boundary:** This advisory documents the requirement. Runtime enforcement belongs to
a future governed implementation tranche under `CVF_v1.7.1_SAFETY_RUNTIME`. No code change
is authorized in this wave.

---

### H2 — No Direct Execution Guarantee

**Source finding:** Red Team Scenario 5 — sidecar escape passes only if "all execution goes
through proxy." If any raw shell escape hatch exists, the guarantee breaks.

**Advisory:** CVF must maintain the invariant that agents have no direct execution path outside
the governed capability gate. Specifically:
- no `spawn` / `exec` / raw shell call reachable from agent context
- all CLI execution routes through `cvf_invoke_cli_stage` whitelist (Delta D3)
- the whitelist (`evaluate`, `status`, `help`) is the only authorized direct-execution surface

**CVF owner surface:** Delta D3 `cvf_invoke_cli_stage` in-process guarantee
(`docs/reference/CVF_DELTA_D3_SANDBOX_BOUNDARY_SPEC_2026-05-29.md`).

**Hardening boundary:** Delta D3 already provides a bounded in-process proof. This advisory
extends the documentation of the invariant to the full agent runtime boundary. No new code
change in this wave.

---

### H3 — Capability Request Governance

**Source finding:** Red Team Scenario 6 — unauthorized capability request passes only if the
system denies auto-grant and maintains a mandatory audit log.

**Advisory:** Any runtime surface that processes agent capability requests MUST:
1. Never auto-grant beyond the pre-authorized capability set for the session
2. Record every capability request (granted and denied) in the governance audit trail
3. Escalate requests for capabilities above `R1` to require operator authorization

**CVF owner surface:** `CVF_GUARD_CONTRACT` (AuthorityGateGuard) + `CVF_v1.6.1_GOVERNANCE_ENGINE`
policy engine.

**Hardening boundary:** Guard contract already enforces authority gate. This advisory formalizes
the audit-log and escalation requirement as a documented boundary for future runtime hardening.
No code change in this wave.

---

## Advisory Readout Fields

When a future runtime surface absorbs this spec, the governance evidence receipt SHOULD surface:

```typescript
trustIsolationHardeningAdvisoryType: "cvf.trustIsolationHardeningAdvisory.lhw17.t1.v1"
hardeningAdvisory: {
  h1PathNormalization: "REQUIRED" | "IMPLEMENTED" | "DEFERRED"
  h2NoDirectExecution: "REQUIRED" | "IMPLEMENTED" | "DEFERRED"
  h3CapabilityRequestGovernance: "REQUIRED" | "IMPLEMENTED" | "DEFERRED"
  hardeningNote: string   // advisory boundary note
}
```

---

## LH1 Trigger Closure

This spec closes the Trust & Isolation (Review 12) EA CONDITIONAL finding for the doc-only
LHW17 wave scope. Runtime hardening implementation is eligible for a separate live-proof
roadmap post-LHW under `CVF_v1.7.1_SAFETY_RUNTIME`.

---

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW17_CVF_IMPORTANT_ABSORPTION_WAVE_2026-05-30.md`
- Source: `.private_reference/legacy/CVF_Important/ADDING_TRUST & ISOLATION LAYER/Red Team Attack Scenarios.md`
- EA finding: `.private_reference/legacy/CVF_Important/REVIEW FOLDER/EA_CROSS_CHECK_ASSESSMENT.md`
- Delta D3 sandbox spec: `docs/reference/CVF_DELTA_D3_SANDBOX_BOUNDARY_SPEC_2026-05-29.md`

## Claim Boundary

This spec is documentation-only advisory. It does not prove runtime enforcement, hosted
readiness, production readiness, or public release readiness. Runtime hardening implementation
is eligible for a separate governed tranche under `CVF_v1.7.1_SAFETY_RUNTIME`.

## Invariants

- `runtimeExecutionAuthorized=false`
- Risk model: R0-R3 (L0-L4 must NOT appear)
- No route.ts change
- No receipt-envelope extension
- No database/persistence change
- No public release readiness claim
