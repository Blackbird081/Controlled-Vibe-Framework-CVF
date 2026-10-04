# CVF NCR HTML B1 Synthetic Sandbox Proof

Memory class: bounded-proof-reference

docType: reference

Status: WORKER_PENDING_REVIEW

## Purpose

Record the bounded, synthetic, real-browser proof that the existing Artifacts preview iframe (`srcDoc` with `sandbox=""`) blocks one harmless inline script in Chromium, paired with an executable unsandboxed control.

## Scope / Applies-To

Target and owner boundary: the Artifacts preview iframe in `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ArtifactExportPanel.tsx`, owned by the Artifacts panel; the proof applies only to the focused spec `tests/e2e/artifact-export-preview-sandbox.spec.ts`. No production file is changed.

## Proof Boundary

- One Chromium 145.0.7632.6 headless profile, one run, mock config, synthetic intercepted export response.
- Positive control: the same fixture in an unsandboxed same-origin srcdoc iframe set an in-memory parent sentinel and a self marker, so the script is executable.
- Panel: the actual preview iframe had an empty sandbox token list, the benign heading rendered, the parent sentinel stayed unset, the self marker was absent, the parent could not reach the iframe document and the frame origin evaluated to `null`.
- Network: export route intercepted once; zero fixture requests and zero unexpected subframe requests.

## Untested Contexts

Passive loads, printing, downloaded HTML execution, accessibility, other browsers or versions, other profiles, real export route, real data, provider behavior, and any universal HTML safety or AI governance claim. Observed values are in `docs/reviews/evidence/cvf-ncr-html-b1-sandbox-worker-proof-2026-10-01.json`.

## Claim Boundary

Worker evidence pending Local review. This is not artifact acceptance, panel or route repair, Q001/Q004 closure, public sync or deployment.
