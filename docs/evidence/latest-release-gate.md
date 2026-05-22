# Latest Release Gate

Memory class: POINTER_RECORD

Status: fresh local-first release gate PASS on 2026-05-22.

## Purpose

Point public readers at the current release-gate proof so evaluators and
agents can verify CVF's most recent governed-execution evidence without
guessing which command or workflow is authoritative.

## Scope

Local-first release-gate command, hosted protected live-gate workflow, and
the boundary between local proof, hosted proof, and provenance-only history.

## Local Release-Gate Command

The release-quality local command is:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

The command includes live governance E2E and must fail if no
DashScope-compatible live key is available.

## Hosted Protected Workflow

Renewed repository live proof must be run after GitHub cutover through:

```text
.github/workflows/cvf-protected-live-release-gate.yml
```

## Boundary

- Local-first release gate proof is recorded at
  `docs/evidence/local-first-release-gate-proof-2026-05-16.md`.
- Historical live evidence is preserved in the provenance repository.
- The 2026-05-21 local release gate passed all seven checks, including live
  governance E2E, before the post-Phase 2.B publicization summary was updated.
- The gate passed again on 2026-05-21 before the second-window provider
  repeatability evidence delta was published.
- The gate passed again on 2026-05-22 after the public A2 governance-kernel
  coherence readout and changelog sync were published.
- Hosted GitHub protected live-gate evidence is still separate from local
  proof. Any hosted/public GA claim must cite a hosted workflow run when
  required.

## Source

Predecessor evidence:

- `docs/evidence/local-first-release-gate-proof-2026-05-16.md`
- `docs/evidence/post-phase-2b-publicization-readiness.md`
- Provenance-only historical run records.

## Decision

Local-first release gate is treated as the current authoritative public
evidence for governed execution. Hosted GitHub protected workflow is the
required path for any hosted/public GA claim.

## Evidence

The local command emits a JSON report including governed E2E results. The
hosted workflow path is `.github/workflows/cvf-protected-live-release-gate.yml`.
Hosted runs are linked from the public limitations register when a hosted
claim is asserted.

Latest local run summary, 2026-05-22:

| Check | Status |
|---|---|
| Web build (`npm run build`) | PASS |
| TypeScript check (guard contract) | PASS |
| Provider readiness | PASS |
| Secrets scan | PASS |
| Docs governance (RC docs present) | PASS |
| E2E Playwright UI (mock) | PASS |
| E2E Playwright Governance (live) | PASS |

The 2026-05-22 run used operator-supplied live provider keys from process
environment. Raw key values were not printed, committed, or copied into the
public repository.

## Claim Boundary

This file claims only the latest release-gate command, workflow path, and
proof pointers. It does not claim a hosted run is current, does not claim GA
parity, and does not authorize publishing a public GA badge without a fresh
hosted workflow run.
