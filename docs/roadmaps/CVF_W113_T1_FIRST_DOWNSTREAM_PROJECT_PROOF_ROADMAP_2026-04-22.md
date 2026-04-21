# CVF W113-T1 First Downstream Project Proof Roadmap

> Date: 2026-04-22
> Status: OPERATOR-APPROVED ROADMAP / READY FOR IMPLEMENTATION
> Memory class: SUMMARY_RECORD
> Scope class: DOWNSTREAM ADOPTION PROOF + DISTRIBUTION HARDENING
> Canonical predecessor: `docs/roadmaps/CVF_W112_T1_WORKSPACE_AGENT_ENFORCEMENT_AND_WEB_CONTROL_UPLIFT_ROADMAP_2026-04-22.md`

## 1. Intent

W112 made CVF Workspace agent-enforcement-ready by generating downstream `AGENTS.md`, `.cvf/` policy artifacts, and a workspace doctor.

W113 must prove that this is usable in a real downstream project, not only in a smoke folder.

The target claim after W113 is closed:

> A user can download CVF, bootstrap a separate downstream project, and have an agent apply CVF governance from the first request with local enforcement artifacts, doctor verification, and live API-backed governance evidence.

## 2. Current Truth Boundary

Current proven state:

- CVF Web active governed AI path is live-proven.
- Multi-provider operability is certified on Alibaba and DeepSeek.
- Mock is UI-only.
- Workspace bootstrap generates downstream enforcement artifacts.
- Workspace doctor can pass `11/11` on a generated workspace.

Current unproven state:

- No canonical downstream sample project proves the full adoption path.
- No published artifact shows an agent declaration from a downstream project before first action.
- No downstream tutorial demonstrates `.cvf/manifest.json` + `.cvf/policy.json` + `AGENTS.md` in an actual project flow.
- No downstream CI/hook proof is recorded.

Therefore W113 is a proof-and-packaging roadmap, not a redesign or broad feature wave.

## 3. Non-Goals

- Do not build a large product app.
- Do not weaken CVF core/downstream isolation.
- Do not put downstream project files inside the CVF root.
- Do not commit API keys, local `.env` secrets, or raw model responses that expose secrets.
- Do not use mock provider output as governance evidence.
- Do not claim provider quality parity, cost parity, or speed parity.
- Do not claim Web is the full CVF runtime.

## 4. Required Proof Project

The proof project should be small enough to audit and deterministic enough to repeat.

Recommended sample:

```text
cvf-downstream-bookmark-cli
```

Minimal product goal:

- a tiny CLI bookmark manager or task-note utility
- one or two files of implementation
- simple tests or manual verification
- no external service dependency beyond the live AI provider used for governance proof

The downstream project must be created outside the CVF core repo through `scripts/new-cvf-workspace.ps1`.

## 5. CP1: Downstream Bootstrap Proof

Deliver:

- Run `scripts/new-cvf-workspace.ps1` against a temporary or dedicated downstream workspace.
- Capture the generated artifact inventory:
  - downstream `AGENTS.md`
  - `.cvf/manifest.json`
  - `.cvf/policy.json`
  - `docs/CVF_BOOTSTRAP_LOG_YYYYMMDD.md`
  - VS Code workspace file
- Run `scripts/check_cvf_workspace_agent_enforcement.ps1`.
- Record PASS output without secrets.

Acceptance:

- Workspace doctor passes.
- Proof project is outside the CVF root.
- Artifact inventory is recorded in a W113 evidence doc.

Suggested evidence file:

```text
docs/assessments/CVF_W113_T1_DOWNSTREAM_BOOTSTRAP_PROOF_2026-04-22.md
```

## 6. CP2: First-Request Agent Declaration Proof

Deliver:

- Simulate or perform the first downstream agent interaction.
- The agent must read downstream `.cvf/manifest.json`, `.cvf/policy.json`, and `AGENTS.md` before acting.
- Record a declaration:

```text
CVF Agent Declaration
Project: <project name>
CVF Core: <cvfCorePath> @ <cvfCoreCommit>
Phase: INTAKE
Risk ceiling: <policy risk ceiling>
Live evidence required: YES
```

Acceptance:

- Declaration appears before substantive design/build action.
- Missing-file behavior is documented as fail-closed.
- The evidence proves that agent governance starts after the user request, not after manual reminding.

## 7. CP3: Governed Downstream Workflow Proof

Deliver a compact downstream run using the canonical phase model:

1. `INTAKE`: user request, scope, risk classification.
2. `DESIGN`: short plan/spec.
3. `BUILD`: implement tiny sample.
4. `REVIEW`: run tests or manual verification.
5. `FREEZE`: record result and evidence.

Acceptance:

- Each phase has a short artifact or log entry.
- The downstream agent does not skip phases.
- The downstream project remains outside CVF core.

Suggested downstream evidence artifacts:

```text
docs/CVF_AGENT_DECLARATION_YYYYMMDD.md
docs/CVF_PHASE_RUN_YYYYMMDD.md
docs/CVF_FREEZE_RECEIPT_YYYYMMDD.md
```

## 8. CP4: Live API Governance Evidence

Deliver:

- At least one live provider API-backed governance proof from the downstream adoption flow.
- Use the current release gate discipline:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

or a narrower live downstream proof if W113 adds a dedicated runner.

Acceptance:

- Governance claim is backed by a real provider API call.
- Mock is not used for risk, phase, approval, provider routing, audit, or agent-control claims.
- Evidence records provider lane and model without exposing key values.

## 9. CP5: Downstream CI / Hook Adoption Proof

Deliver:

- Run or install the opt-in downstream hook sample via `scripts/install_cvf_hooks.ps1`.
- Add or demonstrate the CI sample from `governance/toolkit/05_OPERATION/CVF_CI_ENFORCEMENT_SAMPLE.yml`.
- Show that missing enforcement artifacts fail the doctor.

Acceptance:

- Hook/CI adoption is opt-in and non-destructive.
- Doctor fail-closed behavior is proven for at least one missing-artifact case.
- The pass case and fail case are both recorded.

## 10. CP6: First-Project Documentation Refresh

Deliver:

- Update `docs/tutorials/first-project.md` to reflect W112/W113 workspace enforcement.
- Update `docs/GET_STARTED.md` to show:
  - bootstrap command
  - doctor command
  - expected generated artifacts
  - first-request agent declaration
- Update `README.md` if the public quickstart needs a shorter pointer.

Acceptance:

- New users are no longer guided toward manual-only project setup as the primary first project path.
- Manual markdown-only flow can remain as legacy/basic path, but the recommended path must use workspace enforcement.

## 11. CP7: Closure Sync

Deliver:

- Update this roadmap with closure readout.
- Update `AGENT_HANDOFF.md`.
- Update `AGENTS.md` if the next active roadmap changes.
- Update `docs/INDEX.md`.
- If public claim wording changes, update `README.md` and `ARCHITECTURE.md`.

Acceptance:

- Repo front door says W113 is closed only after evidence exists.
- No public doc claims downstream adoption is proven before CP1-CP6 evidence is present.

## 12. Verification Plan

Minimum local verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\new-cvf-workspace.ps1 `
  -WorkspaceRoot "<temp-or-dedicated-workspace>" `
  -ProjectName "cvf-downstream-bookmark-cli"

powershell -ExecutionPolicy Bypass -File .\scripts\check_cvf_workspace_agent_enforcement.ps1 `
  -ProjectPath "<temp-or-dedicated-workspace>\cvf-downstream-bookmark-cli"
```

Hook verification:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install_cvf_hooks.ps1 `
  -ProjectPath "<temp-or-dedicated-workspace>\cvf-downstream-bookmark-cli"
```

Release-quality governance verification:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Documentation verification:

```bash
git diff --check
```

## 13. Exit Criteria

W113-T1 may close only when:

- A downstream project has been bootstrapped outside CVF core.
- Workspace doctor passes on the downstream project.
- A first-request agent declaration is recorded.
- A full `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE` downstream run is recorded.
- At least one live API-backed governance proof is recorded.
- Hook/CI adoption path is proven or explicitly bounded with evidence.
- First-project docs are updated to make workspace enforcement the recommended path.
- Public docs distinguish:
  - W112: enforcement mechanism exists
  - W113: downstream adoption proof exists

## 14. Recommended Execution Order

1. Create downstream proof workspace.
2. Run doctor and record artifact inventory.
3. Record first-request agent declaration.
4. Execute tiny downstream project through all five phases.
5. Capture live API governance evidence.
6. Verify hook/CI pass/fail behavior.
7. Refresh first-project docs.
8. Close and sync handoff/docs.

This keeps W113 focused: prove the real adoption path before adding more framework features.
