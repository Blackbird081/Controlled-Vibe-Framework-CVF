# CVF NCR HTML B1 Preview Passive Resource Policy Proof

Memory class: bounded-proof-reference

docType: reference

Status: WORKER_RETURNED_PENDING_REVIEW

## Purpose

Record the bounded, synthetic, real-browser proof that the Artifacts panel Preview, which already blocks payload scripts and has an opaque origin, now also denies passive network and data resource loads, while canonical `result.html` used by Copy, Download and Print is unchanged. Worker evidence for Local review, not acceptance.

## Scope / Applies-To

Owner: the Preview iframe in `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ArtifactExportPanel.tsx`. Proof applies to `tests/e2e/artifact-export-preview-sandbox.spec.ts`, the retained Print regression in `tests/e2e/artifact-export-print-browser.spec.ts` and the jsdom units in `ArtifactExportPanel.test.tsx`. No route, auth, config, package, ledger or storage file is changed.

## Policy And Resource Choices

Preview receives a derived `srcdoc`, not `result.html`:

| Aspect | Choice |
|---|---|
| Policy | `default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'` as a meta element |
| Ordering | The meta is the first element the parser sees. If the payload starts with optional whitespace and the plain `<!doctype html>`, the meta follows that doctype so the document mode is unchanged; any other payload (early markup, comment before doctype, quoted or unterminated doctype, empty) gets the meta prepended, because a payload-controlled doctype could otherwise swallow the policy tag |
| Payload policy | A payload-supplied meta policy can only add restrictions; it cannot reopen network authority and is placed after the Preview policy |
| Sandbox | Unchanged: `sandbox=""`, no scripts, opaque origin, no forms, no top navigation, no opener |
| Network resources | Denied: images, `srcset`, link stylesheets, CSS `@import`, CSS backgrounds, fonts, nested `iframe`, `object` and their nested images, same-origin and off-origin alike |
| Inline CSS | Allowed (`style-src 'unsafe-inline'`): `<style>` and `style=""` still style benign content |
| data: and blob: | Blocked in Preview on purpose (`default-src 'none'`, no `img-src`); proved by a data image that decodes with width 1 in the no-policy control and has width 0 in the actual Preview. Print still allows `data:` images; Preview shows text and inline-styled layout only |
| Canonical identity | `result.html` is never altered. Copy, Download and Print consume it verbatim; Preview consumes `buildPreviewDocument(result.html)`. Units assert byte equality for current build, unsaved edit, latest-response supersession, failed newer build and `initialResult` unknown provenance |

## Rendering Limits

Embedded `data:`/`blob:` images and any web fonts do not display in Preview. A payload without a plain leading doctype may render in a different compatibility mode than its original. Scripts never run (unchanged). The policy is presentation isolation, not sanitization.

## Proof Boundary

- One Chromium 145.0.7632.6 headless profile, mock config, synthetic intercepted export, no real data, no forwarding of fixture traffic. Interception is installed on the browser context before login, navigation, Build and payload insertion; the off-origin host never resolves.
- Positive control: a disposable context with the existing empty sandbox and no resource policy produced all 20 expected hits (10 classes on the app origin and on the off origin: image, srcset, link stylesheet, CSS import, CSS background, font, nested frame, frame image, object, object image) with no script running, and a data image decoded with width 1.
- Actual Preview before any Print click, two fixtures (early passive markup before the doctype and any head with duplicate heads and a permissive payload policy; plain doctype with head inline style): counters reset before Build, zero controlled hits, zero unexpected sub-frame requests, empty sandbox, origin `null`, payload script not run, heading color and paragraph background from inline CSS applied, benign text visible, data image blocked, derived `srcdoc` differs from canonical and carries the policy before the first resource markup.
- Policy-only mutation on the real product path: removing only the Preview policy meta (sandbox kept) produced all 20 hits and a decoded data image; the same oracle failed with passive-resource and data-image violations only, while sandbox, origin and script isolation stayed intact.
- Print regression: all accepted R2 assertions retained and passing (native invocation, opener detach, isolation, 1-page short output, 3-page 120-row output, both mutations). The printed `srcdoc` is now compared to the canonical response fixture, not the displayed Preview, and Preview hits before Print are asserted zero (previously one image and one stylesheet).
- Units: 55 passed in `ArtifactExportPanel.test.tsx`, TypeScript and ESLint clean. Unit regressions are jsdom proof of construction and byte identity, not browser proof.

## Untested Contexts

Navigation (meta refresh, link clicks), other browsers and versions, headed mode, quirks versus standards rendering differences, real exported packets, much larger documents, paper or print dialog, accessibility, and the real export route and real data. The disclosed production exploitability of the original gap is unproven; hits were synthetic.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Internal worker |
| Provider or surface | Shared private CVF workspace; local Next dev server and one headless Chromium; synthetic fixture |
| Session or invocation | NCR HTML B1 Preview passive resource worker, 2026-10-01 |
| Working directory | Repository root and `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web` |
| Command or tool surface | Playwright; Vitest; tsc; eslint; worker fast gate |
| Target paths | Exact seven-path worker acceptance ledger |
| Allowed scope source | Bound B1 Preview work order and paired GC-018 baseline |
| Before status evidence | `git status --short --untracked-files=all` empty at HEAD `7548ac66b` before any edit |
| After status evidence | Four modified tracked paths and three untracked worker paths, no staged path, no worker commit |
| Diff evidence | `git diff --name-status` and `git status --short --untracked-files=all` list the seven paths |
| Approval boundary | Worker evidence only; Local reviewer owns acceptance and commit |
| Claim boundary | Synthetic one-profile Chromium Preview observation; no acceptance or universal safety claim |
| Agent type | INTERNAL_AGENT worker |
| Invocation ID | cvf-ncr-html-b1-preview-passive-resource-worker-20261001 |
| Expected manifest | the seven paths in the paired work order |
| Actual changed set | the same seven paths |
| Manifest delta | MATCH |

## Epistemic Process Block

### Expected Result / Prediction

An empty sandbox without a resource policy loads passive resources; a CSP meta placed first in the derived Preview document stops them for early markup, duplicate heads and a permissive payload policy without changing canonical outputs.

### Evidence Comparison

The control produced 20 of 20 hits, the actual Preview 0 for both fixtures, and removing only the policy restored 20 of 20 and failed the same oracle.

### Contradiction Or Gap Disposition

A first control run produced 19 hits because two stylesheets styled one class; distinct per-origin selectors fixed it. Untested contexts are listed above.

### Claim Update

Observed one-profile Chromium result, reviewer acceptance pending; Q001 and Q004 remain open.

## Claim Boundary

Synthetic Preview resource denial and canonical identity in one profile only. Not a production incident, universal safety, durable acceptance, Q001/Q004 exit, public sync or deployment. Observed values: `docs/reviews/evidence/cvf-ncr-html-b1-preview-passive-resource-worker-proof-2026-10-01.json`.
