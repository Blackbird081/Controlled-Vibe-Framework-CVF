# CVF W67-T1 External Asset Productization Execution Plan — 2026-04-13

Memory class: SUMMARY_RECORD

## 1. Executive Decision

Recommended next bounded wave:

`W67-T1 — External Asset Productization`

This wave turns the already-runnable bounded governance path in `cvf-web`

`POST /api/governance/external-assets/prepare`

into a first-class intake-to-registry product path.

This wave must stay narrow. It builds on the now-integrated `CVF ADDING NEW` + `Windows_Skill_Normalization` uplift, but it must not reopen PVV/provider execution or broaden the design-draft corpus again.

## 2. Why This Wave Exists

CVF now has all of the following at the same time:

- canon/reference docs for external asset intake, semantic policy intent, planner heuristics, provisional signals, W7 normalization, and Windows compatibility
- CPF/LPF helpers that implement those concepts in bounded form
- a runnable `cvf-web` route that executes the bounded preparation chain

What is still missing is product shape:

- a stable operator-facing entry point
- a governed handoff target for approved outputs
- visibility around review issues and readiness state
- a clean closure rule for when a prepared asset becomes registry-ready

## 3. Scope

### In Scope

- `cvf-web` operator-facing workflow for external asset preparation
- request/response contract hardening for `/api/governance/external-assets/prepare`
- governed storage or registry handoff for approved `registry_ready_governed_asset`
- review visibility for intake issues, semantic mismatches, planner ambiguity, provisional signals, and Windows compatibility posture
- canon/doc updates needed to support the product path

### Out Of Scope

- reopening PVV/API-key/provider execution
- modifying `/api/execute`
- new provider lanes, new comparison runs, or Phase B PVV expansion
- widening the private-reference ingestion wave again
- changing sandbox doctrine or execution routing

## 4. Primary Product Outcome

Desired outcome:

`external asset arrives -> governance preparation runs -> operator sees actionable review -> approved output can be persisted as a governed asset`

The flow should no longer end as a dead-end analysis response only.

## 5. Control Points

### CP1 — Contract and UX Hardening

Deliver:

- stable API contract docs for `/api/governance/external-assets/prepare`
- explicit status model for `invalid | review_required | registry_ready`
- a minimal operator-facing `cvf-web` surface to submit and inspect preparation results

Acceptance criteria:

- route payload shape documented canonically
- operator can run the flow without crafting raw JSON manually
- UI/readout makes issue classes legible

### CP2 — Registry Handoff

Deliver:

- bounded storage/registry sink for approved `registry_ready_governed_asset`
- clear persistence rule and artifact metadata
- write path separated from provider execution paths

Acceptance criteria:

- approved output can be persisted with deterministic artifact identity
- persisted artifacts are auditable and scoped to the governance-preparation lane
- no coupling to `/api/execute` or PVV evidence files

### CP3 — Review Visibility and Workflow Closure

Deliver:

- review summaries for intake issues, semantic mismatches, Windows compatibility, and planner ambiguity
- operator-visible distinction between:
  - cannot proceed
  - can proceed after clarification
  - ready for governed registration

Acceptance criteria:

- reviewers do not need to inspect raw machine payloads to understand the result
- the route and UI expose the same closure state
- handoff notes and canon docs reflect the final workflow

## 6. Technical Workstreams

### Workstream A — API/Product Contract

Likely files:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/external-assets/prepare/route.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/external-asset-governance.ts`
- new reference docs under `docs/reference/`

Focus:

- stabilize response shape
- define explicit workflow status
- document persistence boundary

### Workstream B — Operator Surface

Likely files:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/...`
- related UI/server helpers under `cvf-web/src/lib/...`

Focus:

- minimal operator flow
- review-first presentation
- payload/result legibility

### Workstream C — Governed Registry Handoff

Likely files:

- `cvf-web` server helper layer
- possibly CPF helper wrappers if bounded canonicalization is needed

Focus:

- deterministic persistence metadata
- approved artifact write path
- auditability without widening scope

## 7. Testing Strategy

Minimum proving commands for this wave:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx tsc --noEmit
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run test:run
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run build
```

Add targeted tests for:

- route contract/status transitions
- registry handoff success/failure
- operator-facing workflow helpers

Only rerun CPF/LPF full suites if shared helpers or exports are modified.

## 8. Governance Rules

- Open this as a fresh bounded `GC-018` before implementation beyond trivial docs
- Preserve maintainability rules and deterministic clock threading patterns
- Do not mix this wave with PVV/API-key/provider execution work
- Do not repurpose PVV evidence files as a registry sink

## 9. Definition Of Done

This wave is done when:

- `cvf-web` exposes a usable operator-facing preparation path
- prepared assets can be reviewed with legible closure states
- approved outputs can be persisted through a governed sink
- canon docs and handoff reflect the new product path
- verification passes without reopening PVV/provider work

## 10. Canonical References

- `docs/assessments/CVF_NEXT_DEVELOPMENT_DIRECTION_REVIEW_2026-04-13.md`
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md`
- `docs/reference/CVF_SEMANTIC_POLICY_INTENT_REGISTRY.md`
- `docs/reference/CVF_PLANNER_TRIGGER_HEURISTICS.md`
- `docs/reference/CVF_PROVISIONAL_EVALUATION_SIGNAL_CANDIDATES.md`
- `docs/reference/CVF_W7_EXECUTION_ENVIRONMENT_NORMALIZATION_POLICY.md`
- `docs/reference/CVF_W7_WINDOWS_COMPATIBILITY_EVALUATION_CHECKLIST.md`

## 11. Next-Agent Instruction

If a future agent picks this up, the correct first move is:

`draft and/or confirm the bounded GC-018 for W67-T1 using this execution plan, then implement CP1 before touching CP2`

Do not reopen PVV/provider lanes as part of this wave.
