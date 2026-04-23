# CVF W114 Public Evidence Packet

> Date: 2026-04-23
> Status: PUBLISHED
> Memory class: FULL_RECORD
> Audience: public readers, potential adopters, non-coder users
> Scope: W114-T1 Non-Coder Value Maximization — CP1 through CP7 complete

## What CVF Does For a Non-Coder

CVF is a governed control layer that sits between a non-coder and an AI provider.
When a non-coder submits a task through CVF Web, the following happens automatically:

1. **Risk classification.** CVF reads the request and assigns a risk level (R0 safe through R3 dangerous).
2. **Governance decision.** Based on risk, CVF allows, blocks, or routes to approval. The user sees why.
3. **Guided handling for risky requests.** If a request is too risky to allow, CVF explains what the risk is and offers a safe alternative direction rather than a silent rejection.
4. **Approval path for borderline requests.** Requests that need review are held for approval with a visible artifact — the user is not left waiting with no information.
5. **Knowledge-native context.** If the workspace has a knowledge base, CVF injects relevant project context into the execution, improving output quality without the user manually providing background.
6. **Provider transparency.** The processing screen shows which provider and model handled the request, which provider lane was selected, and what governance decisions were made.
7. **Audit trail.** Every governed execution records an envelope with route id, policy snapshot, risk classification, provider routing, and approval id. This is not user-facing paperwork — it is automatic background evidence.

The user experience is: I submit a task, I can see what CVF is doing and why, I get useful output if the task is safe, and I get clear guidance if it is not.

## Evidence Summary

All claims below are backed by live API calls on the Alibaba `qwen-turbo` provider lane.

| Claim | Evidence | Status |
| --- | --- | --- |
| Normal productivity tasks produce useful AI output | CP4 outcome pack: 12/12 allowed outputs scored usable | PROVEN |
| High-risk requests are blocked with guidance | CP4: 5/5 guided blocks; visible reason per block | PROVEN |
| Approval path produces a real approval artifact | CP4: 2/2 approval-path requests produced pending approval records | PROVEN |
| Follow-up iteration produces refined output | CP4: 2/2 follow-up requests produced improved outputs | PROVEN |
| Knowledge-native context improves output quality | CP4: 3/3 knowledge requests reflected expected project facts; +0.775 delta from W102 | PROVEN |
| Governance decisions match expected policy | CP4: 19/19 governance decisions matched expected outcomes | PROVEN |
| Web processing screen shows governance evidence | CP5: panel displays decision, provider, model, routing, snapshot id, envelope, approval id | PROVEN |
| Workspace bootstrap enforces CVF protocol from first request | W112/W113: doctor 11/11 PASS across multiple samples | PROVEN |
| Downstream adoption pattern is repeatable | CP7: 3 samples across cli, web-planning, data-analysis — all doctor 11/11, all tests pass | PROVEN |
| Evidence bridge links workspace to web without distributing keys | CP6: bridge receipt records doctor PASS, live key presence only, keys NOT copied | PROVEN |
| Multi-provider operability | W110: Alibaba qwen-turbo CERTIFIED (3/3), DeepSeek deepseek-chat CERTIFIED (3/3) | PROVEN |
| Release gate enforces live governance | Default gate requires live Playwright governance spec pass | ENFORCED |

## What CVF Helps a Non-Coder Do (Plain Language)

> CVF helps non-coders use AI through a governed path that is safer, clearer, and more reliable than unguided prompting.

More specifically:

- You can submit a task and receive useful AI output without worrying that a high-risk prompt will silently execute.
- If your task is risky, CVF tells you why and offers direction — you are not left with a cryptic refusal.
- If your task needs approval, CVF creates the approval artifact for you — you do not need to manually manage that workflow.
- If you have project knowledge configured, CVF uses it to improve your output without you having to repeat context.
- You can see what governance decisions were made on your request, which provider handled it, and what policy applied.
- You can adopt CVF on a new downstream project and be agent-enforcement-ready from the first request.

## Evidence Chain

Live outcome evidence:

- Script: `scripts/w114_noncoder_outcome_evidence_pack.js`
- Summary: `docs/assessments/CVF_W114_T1_NONCODER_OUTCOME_EVIDENCE_PACK_2026-04-23.md`
- Raw: `docs/assessments/CVF_W114_T1_NONCODER_OUTCOME_EVIDENCE_RAW_2026-04-23.json`

Web benefit visibility:

- Implementation: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ProcessingScreen.tsx`
- Assessment: `docs/assessments/CVF_W114_T1_WEB_BENEFIT_VISIBILITY_ASSESSMENT_2026-04-23.md`

Workspace enforcement:

- Bootstrap: `scripts/new-cvf-workspace.ps1`
- Doctor: `scripts/check_cvf_workspace_agent_enforcement.ps1`
- Assessment: `docs/assessments/CVF_W113_T1_DOWNSTREAM_LIVE_PROOF_ASSESSMENT_2026-04-22.md`

Multi-sample downstream proof:

- Script: `scripts/w114_cp7_multi_sample_downstream_proof.ps1`
- Assessment: `docs/assessments/CVF_W114_T1_MULTI_SAMPLE_DOWNSTREAM_PROOF_2026-04-23.md`
- Raw: `docs/assessments/CVF_W114_CP7_RAW_2026-04-23.json`

Workspace-to-web evidence bridge:

- Script: `scripts/write_cvf_workspace_web_evidence_bridge.ps1`
- Assessment: `docs/assessments/CVF_W114_T1_WORKSPACE_WEB_EVIDENCE_BRIDGE_ASSESSMENT_2026-04-23.md`

Non-coder value scorecard:

- `docs/assessments/CVF_W114_T1_NONCODER_VALUE_SCORECARD_2026-04-23.md`

Release gate (mandatory live governance baseline):

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Post-CP7 gate result: secrets scan PASS, UI mock `6 passed`, live governance `8 passed`.

## Claim Boundaries

These claims remain bounded. Do not extend them beyond what is stated here.

| Boundary | What It Means |
| --- | --- |
| One-provider value proof | Non-coder governance value is proven on the Alibaba `qwen-turbo` lane. DeepSeek is certified for operability, not independently value-proved. |
| Multi-provider operability | Alibaba and DeepSeek both pass the same 6-scenario front-door canary. Operability means the lane can execute the test suite. It does not mean equal speed, quality, latency, or cost. |
| Web is not the full CVF runtime | Web is governance-inherited on the active `/api/execute` path. It does not claim physical sandbox isolation or full inheritance of all CVF modules. |
| Workspace doctor is not key proof | Doctor checks enforcement artifacts. It does not prove provider API reachability. Live readiness check (`-CheckLiveReadiness`) reports key presence separately. |
| Three samples are not universal | CP7 proves repeatable adoption across three project kinds. It does not prove that every arbitrary downstream project needs no adaptation. |
| Mock is UI-only | Vitest and mock-mode Playwright specs prove UI rendering and structure. They do not prove governance behavior. |

## Known Limitations

| Limitation | Status |
| --- | --- |
| Physical sandbox isolation for code execution in Web | NOT claimed |
| Full CVF runtime inheritance in Web | NOT claimed — Web is active-path-only governance-inherited |
| Provider quality, speed, latency, cost parity | NOT claimed — provider economics are user-selected lane tradeoffs |
| Universal downstream project compatibility | NOT claimed — CP7 proves pattern repeatability, not universal fit |
| Benchmark truth for all 42 front-door skills | Only `TRUSTED_FOR_VALUE_PROOF` subset is benchmark-backed |

## How To Verify

Any reader can reproduce the governance claims:

```bash
# Live governance E2E (requires DASHSCOPE_API_KEY or ALIBABA_API_KEY)
python scripts/run_cvf_release_gate_bundle.py --json

# Workspace enforcement (requires a bootstrapped downstream project)
powershell -ExecutionPolicy Bypass -File .\scripts\check_cvf_workspace_agent_enforcement.ps1 -ProjectPath "<project>"

# Multi-sample downstream proof (creates 3 temp samples automatically)
powershell -ExecutionPolicy Bypass -File .\scripts\w114_cp7_multi_sample_downstream_proof.ps1

# Workspace-to-web evidence bridge (from inside a bootstrapped downstream project)
powershell -ExecutionPolicy Bypass -File <cvf-core>\scripts\write_cvf_workspace_web_evidence_bridge.ps1 -ProjectPath "." -CheckLiveReadiness -ReleaseGateResult "ATTACH_LATEST_GATE_RESULT"
```

## Publication History

| Date | Scope |
| --- | --- |
| 2026-04-21 | Initial live evidence publication (W111-T1) |
| 2026-04-22 | Workspace enforcement + first downstream proof (W112/W113) |
| 2026-04-23 | Non-coder value maximization evidence (W114 CP1-CP7) — this packet |
