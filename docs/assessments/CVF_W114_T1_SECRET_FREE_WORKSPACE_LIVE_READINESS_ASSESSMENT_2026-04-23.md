# CVF W114-T1 Secret-Free Workspace Live Readiness Assessment

> Date: 2026-04-23
> Status: CP2 COMPLETE
> Memory class: FULL_RECORD
> Roadmap: `docs/roadmaps/CVF_W114_T1_NONCODER_VALUE_MAXIMIZATION_AND_EVIDENCE_ROADMAP_2026-04-22.md`

## 1. Verdict

W114 CP2 is complete.

The workspace doctor now has an optional secret-free live readiness mode:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check_cvf_workspace_agent_enforcement.ps1 `
  -ProjectPath "<downstream-project>" `
  -CheckLiveReadiness
```

This mode reports whether a DashScope-compatible live key is available for release-quality governance proof without storing or printing the key.

## 2. Implementation

Changed files:

- `scripts/check_cvf_workspace_agent_enforcement.ps1`
- `scripts/new-cvf-workspace.ps1`

Behavior added:

- New optional switch: `-CheckLiveReadiness`
- Accepted live-key aliases:
  - `DASHSCOPE_API_KEY`
  - `ALIBABA_API_KEY`
  - `CVF_ALIBABA_API_KEY`
  - `CVF_BENCHMARK_ALIBABA_KEY`
- Sources checked:
  - process environment;
  - ignored repo-local env files under CVF core, including `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.local`.
- Output reports only:
  - `live_key_available`;
  - `provider_lane`;
  - `key_name`;
  - `source`;
  - optional source path;
  - `raw_key_value: NOT PRINTED`.

The normal doctor remains an enforcement-artifact check. Missing live key does not fail workspace enforcement.

## 3. Verification

Command shape verified on a temporary downstream project outside CVF core:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check_cvf_workspace_agent_enforcement.ps1 `
  -ProjectPath "<temp>\CVF-W114-Doctor-Readiness\sample-project" `
  -CheckLiveReadiness
```

Result summary:

```text
RESULT: PASS (11/11 checks passed)
This workspace is agent-enforcement-ready.

CVF Live Governance Readiness (optional, secret-free)
live_key_available: true
provider_lane: alibaba
key_name: ALIBABA_API_KEY
source: ignored_local_env
raw_key_value: NOT PRINTED
```

No raw key value was printed or written.

## 4. Boundary

This closes the workspace live-readiness visibility gap. It does not change the governance proof rule:

- workspace doctor `PASS` proves downstream enforcement artifacts and fail-closed policy;
- live governance proof still requires `python scripts/run_cvf_release_gate_bundle.py --json`;
- missing live key should be reported as a release-proof blocker, not as workspace-enforcement failure.

## 5. Next Step

Per W114 order, the next recommended step is CP4: compact live non-coder outcome evidence pack.
