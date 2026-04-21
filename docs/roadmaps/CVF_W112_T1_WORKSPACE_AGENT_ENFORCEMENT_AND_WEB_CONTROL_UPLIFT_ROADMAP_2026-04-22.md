# CVF W112-T1 Workspace Agent Enforcement And Web Control Uplift Roadmap

> Date: 2026-04-22
> Status: CLOSED DELIVERED / POST-REVIEW FIX VERIFIED
> Memory class: SUMMARY_RECORD
> Scope class: GOVERNANCE REALIZATION + WEB CONTROL DEEPENING
> Canonical predecessor: `docs/roadmaps/CVF_W111_T1_LIVE_EVIDENCE_PUBLICATION_ROADMAP_2026-04-21.md`

## 0. Closure Readout

W112-T1 is closed delivered after post-review verification on 2026-04-22.

Verified closure evidence:

- Workspace bootstrap smoke: `PASS (11/11 checks passed)` via `scripts/new-cvf-workspace.ps1` plus `scripts/check_cvf_workspace_agent_enforcement.ps1`
- Web targeted tests: `31 passed` for governance envelope and execute route coverage
- Web lint: `PASS` with warnings only
- Release gate bundle: `PASS` after setting process-local `DASHSCOPE_API_KEY` alias from the configured Alibaba key; UI mock `6 passed`, live governance `7 passed`

Post-review fixes applied:

- PowerShell workspace scripts were made ASCII-safe for Windows PowerShell parsing.
- `WebGovernanceEnvelope.tranceRef` typo was corrected to `trancheRef`.

## 1. Intent

W112-T1 turned two current truths into enforceable product behavior:

1. A downloaded CVF workspace must make agent governance active from the first downstream user request, not merely available as documentation.
2. CVF Web cannot and should not claim full CVF inheritance, but it can improve control quality on governance-relevant web entrypoints.

The target claim after this roadmap is closed:

> CVF Workspace is agent-enforcement-ready by default, and CVF Web has stronger governance coverage across meaningful execution and policy surfaces while preserving the honest boundary that web is not the full CVF runtime.

## 2. Current Truth Boundary

### 2.1 Workspace

Pre-W112 status:

- `scripts/new-cvf-workspace.ps1` creates an isolated sibling layout.
- The downstream project receives a bootstrap log.
- The generated VS Code workspace opens the downstream project, not CVF core.

Pre-W112 gap:

- The downstream project does not automatically receive a binding `AGENTS.md`.
- No `.cvf/` enforcement manifest is generated.
- No local doctor/preflight proves the downstream agent loaded CVF rules.
- No local hooks or CI checks require CVF agent governance before agent execution.

W112 closure status:

- The downstream project now receives generated `AGENTS.md`.
- `.cvf/manifest.json` and `.cvf/policy.json` are generated.
- The workspace doctor verifies required enforcement artifacts.
- Workspace smoke passed `11/11`.

Therefore the workspace is now `agent-enforcement-ready` when bootstrap artifacts and the doctor pass.

### 2.2 Web

Current status:

- The active `/api/execute` path is governance-inherited and live-proven.
- Governance claims require real provider API calls.
- Alibaba `qwen-turbo` and DeepSeek `deepseek-chat` are certified provider lanes.
- Mock mode is UI-only.

Current boundary:

- Web is an execution surface, not the whole CVF runtime.
- Web mirrors sandbox contracts where useful, but does not provide physical sandbox isolation for arbitrary code execution.
- Web should not claim full CVF inheritance across every module, guard, runtime plane, and agent workspace behavior.

Therefore the web claim remains:

> CVF Web is governance-inherited and live-proven on the active governed AI execution path.

## 3. Non-Goals

- Do not claim that Web is "full CVF".
- Do not add physical sandbox claims to Web unless Web begins executing untrusted code or plugins.
- Do not allow mock provider output as governance evidence.
- Do not weaken workspace isolation by opening downstream work directly inside CVF core.
- Do not commit provider secrets, generated local `.env` files, or raw API keys.

## 4. Lane A: Workspace Agent Enforcement Bootstrap

### CP1. Downstream Agent Instruction Bootstrap

Deliver:

- Update `scripts/new-cvf-workspace.ps1` so new downstream projects receive a generated `AGENTS.md`.
- The generated file must bind downstream agents to:
  - CVF phase model: `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE`
  - live API requirement for governance claims
  - mock-only UI boundary
  - workspace isolation rule
  - CVF core reference path
  - required first-read docs
- Add a template source file in the CVF repo, for example:
  - `governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md`

Acceptance:

- Running the bootstrap script creates or updates downstream `AGENTS.md`.
- Existing downstream `AGENTS.md` is not overwritten without preserving user content or creating a clear merge block.
- The bootstrap log records `Agent Instructions: PRESENT`.

### CP2. `.cvf/` Enforcement Manifest

Deliver:

- Generate downstream `.cvf/manifest.json`.
- Generate downstream `.cvf/policy.json`.
- Required fields:
  - `cvfCorePath`
  - `cvfCoreCommit`
  - `workspaceRoot`
  - `projectPath`
  - `phaseModel`
  - `liveGovernanceEvidenceRequired`
  - `mockAllowedOnlyForUi`
  - `requiredDocs`
  - `bootstrapDate`
  - `enforcementVersion`

Acceptance:

- Manifest paths resolve.
- Manifest CVF commit matches `git -C <cvfCorePath> rev-parse --short HEAD`.
- Policy declares live governance evidence mandatory.

### CP3. Workspace Doctor / Preflight Gate

Deliver:

- Add a checker, for example:
  - `scripts/check_cvf_workspace_agent_enforcement.ps1`
- The checker must validate:
  - downstream project is not inside CVF core
  - `.cvf/manifest.json` exists and resolves
  - `.cvf/policy.json` exists
  - downstream `AGENTS.md` exists
  - bootstrap log exists
  - CVF core path is reachable
  - required docs referenced by manifest exist
  - live governance evidence policy is enabled

Acceptance:

- Checker returns non-zero on missing mandatory enforcement artifacts.
- Checker prints a compact PASS/FAIL table.
- README documents the checker as the first command after bootstrap.

### CP4. Local Hook And CI Integration

Deliver:

- Provide opt-in downstream hook installer or generated hook templates.
- Add a lightweight CI sample that runs the workspace doctor.
- Do not install hooks destructively.

Acceptance:

- Downstream projects can adopt the hook without editing CVF core.
- CI sample fails when `.cvf/` enforcement artifacts are missing.

### CP5. First-Request Agent Protocol

Deliver:

- Add a short downstream first-request protocol to generated `AGENTS.md`:
  - read `.cvf/manifest.json`
  - verify CVF core path
  - read downstream policy
  - classify request phase/risk/scope before action
  - use live API evidence for governance claims
  - record handoff/update when closing a tranche

Acceptance:

- A newly bootstrapped downstream project contains enough local instructions for an agent to apply CVF without the user repeating the rules.

## 5. Lane B: Web Control Uplift

Web should deepen control where it actually improves governance. The goal is stronger coverage, not false full-runtime parity.

### CP6. Web Governance Surface Inventory

Deliver:

- Create a web governance surface map covering:
  - `/api/execute`
  - approval APIs
  - provider configuration APIs
  - governance evaluate/simulate APIs
  - knowledge compile/refactor/maintain APIs
  - external asset prepare/register/retire APIs
  - admin DLP/quota/tool-registry APIs
- Classify each surface:
  - `governance-execution`
  - `policy-mutation`
  - `evidence-read`
  - `ui-support`
  - `out-of-scope`

Acceptance:

- Each governance-relevant route has an owner classification and expected control envelope.

### CP7. Web Governance Envelope Helper

Deliver:

- Add a shared web helper that normalizes governance metadata for governance-relevant routes.
- Candidate name:
  - `src/lib/web-governance-envelope.ts`
- The helper should capture:
  - request id
  - route id
  - actor/session role where available
  - phase/risk/scope classification where applicable
  - evidence mode: `live`, `ui_mock`, `static`, or `none`
  - provider lane where applicable
  - audit event ids where available

Acceptance:

- `/api/execute` preserves current behavior and returns/records the envelope.
- At least two non-execute governance routes use the envelope.

### CP8. Policy Snapshot Pinning

Deliver:

- Add policy snapshot id/version capture for execution and policy-mutation routes.
- Make audit evidence show which policy version governed the request.

Acceptance:

- `/api/execute` audit evidence includes a policy snapshot id/version.
- Policy-mutation routes record before/after policy identifiers.

### CP9. Human Approval Continuity

Deliver:

- Strengthen `NEEDS_APPROVAL` continuity so approval state can be resumed/reviewed across sessions.
- Ensure the web user can see what was blocked, why, and what approval is required.

Acceptance:

- A governed request that escalates to approval creates a reviewable approval record.
- Post-approval execution preserves the original request context and approval id.

### CP10. Provider Routing Explainability

Deliver:

- Expand provider routing response metadata with:
  - selected provider/model
  - fallback reason, if any
  - unavailable provider reason, if any
  - cost/latency policy class, if known
  - user-owned provider choice boundary

Acceptance:

- Web response and audit evidence explain why a provider lane was selected without claiming provider parity.

### CP11. Live Web Governance Regression Pack

Deliver:

- Add or update live tests for governance behavior that is publicly claimed:
  - risk classification / blocking
  - DLP filtering
  - bypass detection
  - approval escalation
  - provider routing metadata
  - audit evidence
- Tests must use real provider API calls when asserting governance behavior.
- UI-only tests may remain mock.

Acceptance:

- `python scripts/run_cvf_release_gate_bundle.py --json` remains the publication gate.
- Any new governance claim is backed by live API evidence.

## 6. Documentation And Claim Sync

Deliver:

- Update `README.md`, `ARCHITECTURE.md`, `docs/INDEX.md`, and `AGENT_HANDOFF.md`.
- Add explicit current-state wording:
  - Workspace before W112: `isolation-ready / reference-ready`
  - Workspace after W112: `agent-enforcement-ready`
  - Web current claim: `governance-inherited active path`
  - Web non-claim: `not full CVF runtime`

Acceptance:

- No public-facing doc claims that Web fully inherits all CVF modules.
- No public-facing doc implies downloaded workspaces automatically enforced agents before W112 is closed.

## 7. Verification Plan

Minimum verification for closure:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\new-cvf-workspace.ps1 `
  -WorkspaceRoot "<temp-workspace-root>" `
  -ProjectName "cvf-w112-smoke"

powershell -ExecutionPolicy Bypass -File .\scripts\check_cvf_workspace_agent_enforcement.ps1 `
  -ProjectPath "<temp-workspace-root>\cvf-w112-smoke"
```

Web verification:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm run lint
npm run build
npx vitest run
```

Publication verification:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Governance assertion rule:

- Any test or public claim that asserts CVF controls AI/agent behavior must use a real provider API call.
- Mock remains valid only for UI structure and non-governance rendering checks.

## 8. Exit Criteria

W112-T1 was closed after:

- New downstream workspaces receive agent instructions by default.
- New downstream workspaces receive `.cvf/` policy and manifest artifacts.
- Workspace doctor fails closed on missing enforcement artifacts.
- Docs clearly distinguish isolation from enforcement.
- Web governance surface inventory is complete.
- Web has at least one shared governance envelope across execution and non-execution governance routes.
- Live governance release gate passes.
- Public wording remains honest: Web is stronger, but not "full CVF".

## 9. Recommended Execution Order

1. CP1-CP3 Workspace enforcement baseline.
2. CP4-CP5 downstream adoption hardening.
3. CP6 Web surface inventory.
4. CP7-CP10 Web control uplift.
5. CP11 live regression pack.
6. Documentation sync and release gate.

This order makes the downloaded workspace trustworthy first, then deepens Web control without destabilizing the already live-proven `/api/execute` path.
