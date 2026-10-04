# CVF NCR HTML B1 Print Browser Repair Proof

Memory class: bounded-proof-reference

docType: reference

Status: LOCAL_REVIEWED_BOUNDED

## Purpose

Record the bounded, synthetic, real-browser R2 proof that the Artifacts panel Print button reaches a native popup and native print call, prints the displayed version after a form edit, prints a 120-row document completely across pages, and gives the printed HTML no app-origin script, storage, cookie or request authority. It supersedes the rejected R0 (opener-only) and R1 (fixed-height frame) candidates.

## Scope / Applies-To

Target and owner boundary: `handlePrint` in `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ArtifactExportPanel.tsx`, owned by the Artifacts panel; the proof applies only to `tests/e2e/artifact-export-print-browser.spec.ts` and the jsdom regressions in `ArtifactExportPanel.test.tsx`. No route, auth, config or package file is changed.

## Architecture Reassessment

Written before the R2 implementation, as the order requires. Each row is judged against every outcome: origin safety (script, storage, cookie, request), insertion ordering, complete layout, native print lifecycle, displayed-version binding, short and long output, failure recovery and evidence discrimination.

| Alternative | Payload trust and authority | Complete long output | Verdict |
|---|---|---|---|
| R0: `document.write(result.html)` into the app-origin popup | Payload runs with app origin; opener detach does not help (Local D058 finding, reproduced in R1) | Yes | Rejected |
| R1: empty-sandbox frame at `100vh` | Opaque origin, no script | No: a replaced element prints only its own box; the R1 candidate printed 1 page and 44 of 120 rows (row 80, row 120 and the end marker missing) | Rejected (D060) |
| Sandboxed frame with `allow-same-origin` and no `allow-scripts`, sized from its own content | No script, but app origin: passive loads (images, stylesheets) would carry ambient cookies | Yes | Rejected alone: passive-load authority |
| `allow-scripts` frame that reports its height by `postMessage` | Payload scripts would run (opaque origin) and could still reach app endpoints | Yes | Rejected: payload script must not run |
| Sanitise `result.html` into the popup | Changes bytes and relies on a sanitiser; app-origin document | Yes | Rejected |
| Blob or data URL popup | Blob inherits app origin; top-level data URL navigation is blocked | n/a | Rejected |
| Server `Content-Security-Policy: sandbox` response | Would need a route or header change | n/a | Out of scope, forbidden paths |
| Chosen: CSP meta first, hidden measuring frame, opaque printed frame sized to measured height | Printed payload: empty sandbox (no script, opaque origin). Measuring frame: `allow-same-origin`, no script. Both inherit a popup CSP of `default-src 'none'` with only inline styles and `data:` images, fonts and frames about: allowed, so no network resource load and no connection | Yes: the frame is laid out at its own fixed width of 700 px, so the height measured there is the height it prints at | Chosen |

Choices and ordering: the opener is detached first, the CSP meta is inserted second, only then is any frame created. The printed frame is inserted only after measurement and after `srcdoc` is set, so `print()` runs on that frame's own content load and never on an empty frame (a first version printed at the empty first load; the browser test caught it). Any failure (popup blocked, opener not detached, height not measured, `print()` throws) closes the popup, shows a notice and prints nothing.

Documented differences from the displayed page: payload scripts never run in the print view; external images and stylesheets are blocked in the print view (the exported packet is self-contained and `data:` images still load); the print title is the export filename; the frame is 700 px wide and its height is measured with a 2 px allowance. The existing preview, which already has its own sandbox, was observed loading passive resources from the payload (1 image, 1 stylesheet) before Print is pressed; that is existing behavior outside this order and is reported, not changed.

## Proof Boundary

- One Chromium 145.0.7632.6 headless profile, mock config, synthetic intercepted export, no real data and no external URL.
- Positive origin control: the same payload bytes in an unsandboxed same-origin frame read and changed the seeded localStorage and cookie sentinels, reached its parent, completed a fetch, loaded a passive image and a passive stylesheet from the intercepted endpoint (1 hit each).
- Real Print, short and 120-row documents: one native popup, `window.open` returned a native Window, opener present at creation and null afterwards, zero `document.write`, one native `print()` call, one printed frame with `sandbox=""` and document origin `null`, printed `srcdoc` string-equal to the displayed result, heading from build #1 although the Title field was edited afterwards without rebuilding. Payload did not run, storage and cookie unchanged, endpoint hits 0 for fetch, image and stylesheet, no unexpected request.
- Output: the popup was rendered to A4 PDF by Chromium print media and read with `pdftotext -layout`. The 120-row document printed on 3 pages with all 120 row tokens and the unique end marker; the short document printed on 1 page with its heading and end marker. A directly rendered copy of the same long document through the same pipeline is complete, so the pipeline and fixture can show completeness.
- Mutations on the real Print path: stripping the sandbox attributes and the CSP meta gave the payload origin `http://localhost:3001`, ran the script, changed storage and cookie and hit fetch, image and stylesheet endpoints. Forcing the rejected `100vh` height printed 1 page with 44 of 120 rows and no end marker. Source-level removals were also run and restored: no sandbox line (R1), and no CSP insertion, which left scripts blocked by the sandbox but let image and stylesheet loads through, showing the CSP is what blocks passive loads.
- Pre-R2 receipt: on the R1 candidate the long document printed 1 page, 44 of 120 rows, with row 80, row 120 and the end marker missing, and Print itself caused one image and one stylesheet hit.
- Instrumentation is observe-only: wrappers record and then call the native `window.open`, `Document.prototype.write` and `window.print`. No popup, handle or print result is faked. Headless native `print()` opens no dialog; the PDF is a renderer output of the same popup, not paper.

## Untested Contexts

Physical paper, the print dialog, page margins and scaling chosen by a user, print-dialog accessibility, documents much longer than 120 rows or taller than a browser frame limit, content that needs a viewport wider than 700 px, other browsers or versions, headed mode, real popup blockers (blocked-popup, detach-failure, measure-failure and print-failure branches are covered by jsdom stand-ins only), downloaded HTML, the real export route and real data, and the existing preview's passive loads. Observed values are in `docs/reviews/evidence/cvf-ncr-html-b1-print-repair-worker-proof-2026-10-01.json`.

## Claim Boundary

Local completion decision: `docs/reviews/CVF_CVF_NCR_HTML_B1_PRINT_COMPLETENESS_R2_COMPLETION_2026-10-01.md`. This is synthetic renderer proof in one profile, not paper output, universal HTML safety, artifact acceptance, Q001/Q004 closure, public sync or deployment.

## Local Reviewer Evidence

Independent Local fixture: preformatted 120-line content at route-like font/spacing, distinct LOCALROW markers and a separate PyMuPDF output oracle. Actual Print popup output contained all 120 rows and end marker on 3 A4 renderer pages; origin null, no payload script, no storage/cookie mutation and zero Print endpoint hits. Preview retained one image and one stylesheet hit before Print. No broader content or physical-output claim. Local repaired only the unexpected-request filter, system-tool path selection/diagnostic and return evidence.
