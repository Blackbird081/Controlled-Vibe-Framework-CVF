<!-- Memory class: FULL_RECORD -->
# Public Developer Onboarding Proof

Date: 2026-05-22

Status: PASS with bounded npm audit residuals

## Purpose

Record the public repository onboarding proof for an agent or developer who
starts from the public CVF front door and needs a truthful local-first setup
path.

## Scope

This proof covers the public repository documentation and the local web
package setup path. It does not claim hosted deployment, provider parity,
workspace-bootstrap script availability in the public export, or live
governance behavior. Live governance claims still require:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

## Commands Verified

Run from the public-sync clone on 2026-05-22:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci
npm run check
cd ../../..
python scripts/run_cvf_static_ci_gate.py --json
```

## Result

| Check | Result |
|---|---|
| `npm ci` in `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web` | PASS, 654 packages installed/audited |
| `npm run check` in `cvf-web` | PASS, TypeScript `tsc --noEmit` clean |
| `python scripts/run_cvf_static_ci_gate.py --json` | PASS, 7/7 non-live checks |

Static gate checks:

| Static gate item | Result |
|---|---|
| Public surface guard | PASS |
| Workflow orchestration guard | PASS |
| Web build | PASS |
| Web TypeScript check | PASS |
| Secrets scan | PASS |
| Docs governance compatibility | PASS |
| Static governance/unit tests | PASS, 44/44 |

## Documentation Corrections

The public onboarding docs were aligned with commands that actually exist in
the public repository:

- `README.md`
- `docs/GET_STARTED.md`
- `docs/guides/CVF_5_MINUTE_RC_SETUP.md`
- `docs/reference/CVF_NEW_MACHINE_SETUP_CHECKLIST.md`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/README.md`

Removed or bounded from the public first-run path:

- `scripts/cvf_setup.py`
- `scripts/cvf_doctor.py`
- `scripts/new-cvf-workspace.ps1`
- `scripts/check_cvf_workspace_agent_enforcement.ps1`
- `scripts/bootstrap_foundations.ps1`
- `scripts/bootstrap_foundations.sh`

Those commands are not present in the current public repository. Workspace
bootstrap remains documented as public evidence and boundary material, not as
a runnable public onboarding command.

## Residuals

`npm ci` completed but npm reported dependency audit residuals:

- 4 moderate
- 7 high
- 1 critical

This P1 proof does not resolve dependency audit posture. It only proves that
the public local-first developer onboarding path installs and checks
successfully. A dependency-audit hardening tranche would require separate
authorization and a narrower remediation plan.

## Claim Boundary

This packet proves public developer onboarding coherence for the local-first
web package and non-live static gate. It does not claim live provider behavior,
hosted GitHub workflow freshness, GA parity, output-quality superiority, or
public availability of provenance-only workspace bootstrap scripts.
