# CVF W113-T1 Downstream Live Proof Assessment

> Date: 2026-04-22
> Status: PASS / LIVE-PROVEN
> Memory class: FULL_RECORD
> Roadmap: `docs/roadmaps/CVF_W113_T1_FIRST_DOWNSTREAM_PROJECT_PROOF_ROADMAP_2026-04-22.md`

## 1. Verdict

W113-T1 is live-proven for the current scope.

CVF now has evidence that:

- a downstream project can be bootstrapped outside CVF core;
- generated downstream enforcement artifacts are present;
- the workspace doctor passes and fails closed when a required artifact is missing;
- a downstream agent declaration and full phase run can be recorded;
- a live provider-backed CVF governance run can be executed and can expose W112 web governance metadata;
- the default release gate still passes with live governance E2E.

## 2. Downstream Workspace Proof

Proof workspace:

```text
C:\Users\DELL\AppData\Local\Temp\CVF-W113-Downstream-Proof
```

Downstream project:

```text
C:\Users\DELL\AppData\Local\Temp\CVF-W113-Downstream-Proof\cvf-downstream-bookmark-cli
```

Generated artifacts verified:

- `AGENTS.md`
- `.cvf/manifest.json`
- `.cvf/policy.json`
- `.vscode/settings.json`
- `docs/CVF_BOOTSTRAP_LOG_20260422.md`
- `docs/CVF_AGENT_DECLARATION_20260422.md`
- `docs/CVF_PHASE_RUN_20260422.md`
- `docs/CVF_FREEZE_RECEIPT_20260422.md`
- `.github/workflows/cvf-enforcement.yml`
- `.git/hooks/pre-commit`

Workspace doctor result:

```text
RESULT: PASS (11/11 checks passed)
This workspace is agent-enforcement-ready.
```

Isolation proof:

- downstream project is outside the CVF core root;
- CVF core is available through the sibling `.Controlled-Vibe-Framework-CVF` path;
- the proof run resolved the junction target before invoking live web tests to avoid Windows/Next.js path composition issues.

## 3. First-Request Agent Declaration

Recorded downstream declaration:

```text
CVF Agent Declaration
Project: cvf-downstream-bookmark-cli
CVF Core: <cvfCorePath> @ <cvfCoreCommit>
Phase: INTAKE
Risk ceiling: R2
Live evidence required: YES
Mock boundary: UI-only
```

This declaration was recorded before downstream design/build artifacts were created.

## 4. Phase Run Proof

Downstream run used the canonical model:

```text
INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE
```

Sample implementation:

- `src/bookmarks.py`
- `tests/test_bookmarks.py`

Review command:

```bash
python -m unittest discover -s tests
```

Review result:

```text
Ran 2 tests
OK
```

## 5. Hook / CI Proof

Hook installer:

```powershell
powershell -ExecutionPolicy Bypass -File <cvf-core>\scripts\install_cvf_hooks.ps1 `
  -ProjectPath <downstream-project>
```

Result:

```text
HOOK_PRE_COMMIT=PASS
CI_SAMPLE=PASS
```

Fail-closed proof:

- `.cvf/policy.json` was temporarily moved away.
- Workspace doctor returned non-zero.
- Failing checks:
  - `.cvf/policy.json exists`
  - `Required docs referenced by manifest exist`
- After restoring `.cvf/policy.json`, doctor returned `PASS (11/11)`.

Fail-closed exit:

```text
FAIL_CLOSED_EXIT=1
```

## 6. Web W112 Live Metadata Proof

New live proof spec:

```text
EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/tests/e2e/w113-workspace-web-live-proof.spec.ts
```

Command:

```bash
npx playwright test --config playwright.config.ts tests/e2e/w113-workspace-web-live-proof.spec.ts --reporter=line
```

Provider lane:

```text
Alibaba qwen-turbo
```

Result:

```text
1 passed
```

The live response asserted:

- `success === true`
- output is not mock output
- `governanceEnvelope.routeId === "/api/execute"`
- `governanceEnvelope.surfaceClass === "governance-execution"`
- `governanceEnvelope.evidenceMode === "live"`
- `governanceEnvelope.trancheRef === "W112-T1"`
- `policySnapshotId` matches the envelope policy snapshot id
- provider routing selected Alibaba
- envelope provider lane is Alibaba

This proves the W112 web governance envelope and policy snapshot are present on a real provider-backed execution path.

## 7. Release Gate Proof

Command:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Result:

```text
gate_result: PASS
```

Checks:

- Web build: PASS
- Guard Contract TypeScript check: PASS
- Provider readiness: PASS, `CERTIFIED lanes: 2`
- Secrets scan: PASS
- Docs governance: PASS
- E2E Playwright UI mock: PASS, `6 passed`
- E2E Playwright Governance live: PASS, `7 passed`

## 8. Execution Notes

The first attempt to run the full live gate through the downstream project timed out and left port `3001` occupied. A second full-gate attempt failed because that port was still in use.

A direct targeted W113 live spec then failed when invoked through the Windows junction path because Next.js composed an invalid `.next` path. The final counted run resolved the junction target to the real CVF core path before invoking Playwright and passed.

These non-counted attempts exposed a Windows path nuance; they did not invalidate the final live proof.

## 9. Boundary

This assessment proves downstream adoption for one small sample project and the current W112/W113 governance surfaces.

It does not claim:

- provider speed, cost, or quality parity;
- Web is the full CVF runtime;
- arbitrary downstream projects need no project-specific adaptation;
- physical sandbox isolation in Web.

Mock remains valid only for UI structure checks.
