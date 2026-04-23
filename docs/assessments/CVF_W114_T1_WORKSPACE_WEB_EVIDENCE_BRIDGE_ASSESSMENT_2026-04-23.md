# CVF W114-T1 Workspace-To-Web Evidence Bridge Assessment

> Date: 2026-04-23
> Status: CP6 COMPLETE
> Scope: Downstream workspace receipt bridge to CVF Web live governance proof
> Evidence class: WORKSPACE_PROOF + SECRET_FREE_REFERENCE

## 1. Verdict

CP6 is complete.

Downstream workspaces now have a repeatable way to reference CVF Web governance evidence without copying provider API keys into the downstream project.

## 2. Delivered Surface

New script:

- `scripts/write_cvf_workspace_web_evidence_bridge.ps1`

Updated bootstrap and downstream instructions:

- `scripts/new-cvf-workspace.ps1`
- `governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md`

Generated downstream receipt shape:

- `docs/CVF_WORKSPACE_WEB_EVIDENCE_BRIDGE_<YYYYMMDD>.md`

The receipt records:

- workspace doctor status;
- optional secret-free live readiness summary;
- raw provider key values as `NOT PRINTED`;
- provider keys copied into downstream project as `NO`;
- release gate command to run from CVF core;
- operator-attached latest release gate result;
- links to W114 CP4/CP5 evidence records;
- claim boundaries that preserve the workspace/API-key separation.

## 3. Verification

Parser checks:

```powershell
[System.Management.Automation.Language.Parser]::ParseFile(...)
```

Result:

```text
parser-ok
```

Temporary downstream verification:

```text
C:\Users\DELL\AppData\Local\Temp\CVF-W114-CP6-367f2cc9\cp6-bridge-sample
```

Verification flow:

1. Created a temporary workspace outside CVF core.
2. Added a junction `.Controlled-Vibe-Framework-CVF` pointing to the current CVF core, avoiding any clone or key copy.
3. Ran `scripts/new-cvf-workspace.ps1`.
4. Ran `scripts/write_cvf_workspace_web_evidence_bridge.ps1 -CheckLiveReadiness`.
5. Confirmed generated receipt fields.

Observed result:

```text
Workspace doctor status: PASS
Optional live readiness summary: live_key_available=true
Raw provider key values: NOT PRINTED
Provider keys copied into downstream project: NO
```

The workspace doctor inside the generated receipt reported:

```text
RESULT: PASS (11/11 checks passed)
This workspace is agent-enforcement-ready.
```

Final release gate after CP6:

```text
gate_result: PASS
Web build: PASS
Guard Contract TypeScript: PASS
Provider readiness: PASS, CERTIFIED lanes: 2
Secrets scan: PASS
Docs governance: PASS
UI mock E2E: 6 passed
Live governance E2E: 8 passed
```

## 4. Boundary

This bridge proves a repeatable evidence-linking pattern. It does not prove that every downstream project has a live provider key configured.

Correct claim:

- downstream workspace enforcement is proven by the workspace doctor;
- live readiness can be reported secret-free;
- CVF Web governance proof is referenced through the CVF core release gate and evidence records.

Incorrect claim:

- `.cvf/` stores or distributes provider API keys;
- workspace doctor pass proves provider connectivity;
- mock UI checks prove governance;
- Web is the full CVF runtime.

Release-quality governance proof remains:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```
