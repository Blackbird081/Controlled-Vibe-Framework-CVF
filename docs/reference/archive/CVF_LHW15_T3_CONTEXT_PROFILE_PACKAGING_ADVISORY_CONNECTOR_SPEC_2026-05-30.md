# CVF LHW15-T3 Context Profile Packaging Advisory Connector Spec

Memory class: FULL_RECORD

Contract version: `cvf.contextProfilePackagingAdvisory.lhw15.t3.v1`

Status: CLOSED_PASS_BOUNDED

docType: connector_spec

Date: 2026-05-30

---

## Scope/Target/Owner Boundary

- **Scope:** Documentation-only connector spec. No code file. No EXTENSIONS/ change.
- **Target:** CVF governance agents consuming VI2 `requestContextReadout` response field.
- **Owner:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-request-context-readout.ts` (VI2).
- **Applies-to:** Any agent or surface that needs to decide whether context is safe to package for handoff to the next role.

## Purpose

Close the remaining LH1 trigger for the `Workflow GoClaw` family (line 163)
by defining a context profile packaging advisory type. VI2 delivered
`routeRequestContextProfile` (budget tier, readiness, missing signals,
contamination flags, next action). The remaining gap is a packaging advisory
for agent handoff — how an agent should trim, augment, or block context transfer
to the next role based on observed signal density and contamination posture,
so that the receiving agent begins from a clean, governance-compliant context.

LH1 source: `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` line 163
VI2 owner surface: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-request-context-readout.ts`

Rejection label for this wave:
`Workflow GoClaw` live context execution is rejected from this LHW wave
(doc-only scope) — requires live route; eligible for separate live-proof
roadmap post-LHW.

---

## Advisory Type Definition

### `contextProfilePackagingAdvisoryType`

Six values covering all context packaging postures:

| Value | Meaning |
| --- | --- |
| `package_ready` | Context is within budget, signals are complete, no contamination; package as-is for handoff |
| `trim_required` | Context exceeds budget tier or signal density is too high; trim before packaging for handoff |
| `augment_required` | Required signals are missing; agent must augment context before handing off |
| `contamination_flag` | One or more contamination flags active (e.g. stale context, role bleed, cross-session leak); must clear before handoff |
| `budget_exceeded` | Context budget tier is EXCEEDED or CRITICAL; handoff must be deferred or split |
| `handoff_blocked` | Context cannot be packaged for handoff due to unresolvable contamination or governance gate |

### `packagingGuidance`

String field describing the required packaging action before handoff. Examples:

- `package_ready` → `"Context is within budget and clean. Package all signals for handoff."`
- `trim_required` → `"Context budget is near threshold. Remove non-essential knowledge chunks and limit intent length to 200 chars before handoff."`
- `contamination_flag` → `"Contamination detected: stale context from prior session. Flush and re-derive context from current receipts before handoff."`
- `handoff_blocked` → `"Handoff blocked. Context contains unresolved contamination flags and missing governance signals. Escalate to Orchestrator."`

---

## Connector Advisory Shape

```typescript
// Advisory readout only — no runtime execution, no context mutation.
interface ContextProfilePackagingAdvisory {
  contractVersion: 'cvf.contextProfilePackagingAdvisory.lhw15.t3.v1';
  contextProfilePackagingAdvisoryType: ContextProfilePackagingAdvisoryType;
  packagingGuidance: string;
  activeBudgetTier: string | null;        // Budget tier from VI2 readout
  activeContaminationFlags: string[];     // Flags from VI2 readout
  missingSignals: string[];               // Signals from VI2 readout
  runtimeExecutionAuthorized: false;      // invariant — advisory only
}

type ContextProfilePackagingAdvisoryType =
  | 'package_ready'
  | 'trim_required'
  | 'augment_required'
  | 'contamination_flag'
  | 'budget_exceeded'
  | 'handoff_blocked';
```

---

## Integration Guidance

This advisory type is designed to be consumed after reading a
`requestContextReadout` (VI2) response field. The consuming agent reads:

1. `requestContextReadout.budgetTier` — determines if budget is exceeded.
2. `requestContextReadout.missingSignals` — determines if augmentation is needed.
3. `requestContextReadout.contaminationFlags` — determines if contamination is active.
4. `requestContextReadout.readiness` — determines overall packaging posture.

From these four inputs the agent selects one of the six
`contextProfilePackagingAdvisoryType` values and constructs a `packagingGuidance`
string. No live provider call is required.

### Selection Priority

When multiple conditions are active, apply this precedence:

1. `handoff_blocked` — unresolvable contamination or governance gate failure
2. `budget_exceeded` — budget tier is EXCEEDED or CRITICAL
3. `contamination_flag` — contamination flags present but not governance-blocking
4. `augment_required` — missing required signals
5. `trim_required` — budget near threshold or signal density high
6. `package_ready` — none of the above conditions are active

---

## Invariants

- `runtimeExecutionAuthorized: false` — advisory never authorizes context execution.
- `rawMemoryReleased: false` — no memory promotion from this advisory.
- `canReinject: false` — context packaged for handoff is not reinjected back.
- No code file in this connector spec.
- No EXTENSIONS/ directory change.
- No receipt envelope change.
- No public-sync.

---

## LH1 Trigger Closure

**Closed:** `Workflow GoClaw` — LH1 line 163
**Status:** ABSORBED (doc-only connector scope)
**VI2 absorption already covers:** context budget classification, signal density
readout, contamination flag detection.
**This spec closes:** context profile packaging advisory for agent-to-agent
handoff governance.

---

## Claim Boundary

This spec is documentation-only. It does not claim:
- Automated context trimming or augmentation execution
- Live provider call for context repackaging
- Durable memory storage for context profiles
- Hosted readiness or production readiness
- Public release readiness
