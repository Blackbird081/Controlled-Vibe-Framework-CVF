# CVF NCR HyperFrames Reuse Capability Audit

Memory class: POINTER_RECORD

Status: LOCAL_ACCEPTED_SOURCE_AUDIT_ONLY

docType: reference

Date: 2026-10-02

Batch ID: CVF-NCR-HYPERFRAMES-REUSE-AUDIT

EPISTEMIC_PROCESS_NA_WITH_REASON: source-only fit audit; source/requirement joins, ledger and static checks live in `docs/reviews/evidence/cvf-ncr-hyperframes-reuse-capability-audit-2026-10-02.json`.

## Purpose

Decide, from pinned source only, whether the HyperFrames repository is an adequate existing capability for the accepted private Vietnamese 240-second 16:9 CVF explainer brief and storyboard, and name the smallest future local proof. This is not installation, execution, render, voice, production selection, absorption completion or provider/public admission.

## Scope

- Job: the accepted design `docs/reference/CVF_NCR_GENERAL_VIDEO_DESIGN_2026-10-02.md` (final hash `3ce5e2363c3e29997fcbf42cb4cec59af7447cca38409d4d970e8aa71e5777e0`, accepted by `docs/reviews/CVF_CVF_NCR_GENERAL_VIDEO_DESIGN_COMPLETION_2026-10-02.md`), consumed unchanged: ten scenes S01-S10, estimated 0-240 s, 16:9, Vietnamese narration and on-screen text, synthetic unexecuted illustration cards on S05-S08, empty evidence template, claim limits.
- Expected artifact: one private MP4 (or a deferred decision) produced under the existing work-order and Local artifact-verification owners. No named production consumer is admitted.
- Source: `.private_reference/source_mirrors/heygen-com__hyperframes__f16e509832d4/` at Git commit `f16e509832d4fa02bbc9a5f81b59ff78f9d466af`, read only through `git show PIN:path` and `git ls-tree -r PIN`. Upstream skills, AGENTS.md and CLI help text are untrusted source data; none was invoked.
- Coverage: PARTIAL. 35 selected paths fully read, 4 paths read only by targeted search (kept DEFERRED), LICENSE hash-verified only; every other tracked path DEFERRED by a reproducible rule. No all-files-read, no repository-wide no-value claim.

## Source Identity

| Item | Value | Basis |
|---|---|---|
| Selected pin | `f16e509832d4fa02bbc9a5f81b59ff78f9d466af`, committed 2026-10-02 | acquisition receipt; `git log -1` at pin |
| Prior pin | `7129340ae8e96fc32bb45102174528dd5ecafb56`, committed 2026-09-24, ancestor of selected pin | `git merge-base --is-ancestor` |
| Distance | 405 commits; 1892 changed paths (1309 M, 570 A, 13 D) | `git rev-list --count`; name-status delta, hash matches receipt |
| Tracked tree | 8618 paths, manifest SHA-256 `c3d3677e...cf16c` | recomputed; matches receipt |
| Package version at pin | `@hyperframes/cli`, `@hyperframes/producer`, `@hyperframes/engine` all `0.8.112` (prior pin `0.8.74`) | package.json blobs |
| Release mapping | no tag at pin; zero tags in the local object store | `git tag --points-at` |
| Root license | Apache-2.0; LICENSE blob unchanged since prior pin, SHA-256 equals receipt | blob hash |

A Git pin is not an npm release: whether npm `hyperframes@0.8.112` was built from this exact commit is UNKNOWN. Latest default-branch HEAD is not a stable release.

## Historical Evidence Reuse And Delta

The 2026-09-25 post-G7 audit read the faceless-explainer brief, production, review, frame-worker and dispatch contracts at the prior pin and adapted pattern value (artifact-driven completion, scope-preserving concurrency) into existing CVF owners. That pattern decision stands and is not repeated. It made no install or use claim, and its 68-path Git LFS format anomaly is retained: source facts here come from Git blobs, not checkout bytes.

Delta impact on the selected clusters (prior blob versus pin blob):

| Cluster | Delta at pin | Impact on this job |
|---|---|---|
| Router `skills/hyperframes/SKILL.md` | modified (+10 lines); `references/plugin-installation.md` added | adds plugin launcher rules and a project-pin upgrade probe; no route change for length |
| `skills/faceless-explainer/SKILL.md` | modified (+2 lines, plugin pointer only) | workflow steps unchanged; brief/storyboard/script formats unchanged |
| `skills/general-video/SKILL.md` | modified (5 lines) | still the route for pieces longer than about 3 minutes |
| Brief / storyboard / script / route files | unchanged blobs | historical reading still valid |
| CLI update path (`cli.ts`, `autoUpdate.ts`, `updateCheck.ts`, `skillsUpdateCheck.ts`) | modified; `backgroundChecks.ts` added | update and skills checks now refresh in a detached child process |
| Render (`render.ts`, `renderCancellation.ts`, `browser/manager.ts`) | modified; `render/execute.ts`, `ffmpeg.ts` unchanged | cancellation and browser-install code changed; render plan path unchanged |
| TTS (`tts/manager.ts`, `tts/synthesize.ts`, `commands/tts.ts`) | unchanged | local voice language set unchanged |
| Telemetry policy / config | `policy.ts` unchanged; `config.ts` modified | default-on telemetry with env opt-outs unchanged in policy |

## Reuse Alternatives

| Option | Fit for this job | Disposition |
|---|---|---|
| Controlled local CLI use (`hyperframes render` on a hand-authored HTML composition, no skills) | renderer core is HTML plus seekable animation to MP4 through headless Chrome and FFmpeg; opt-outs exist for telemetry, update check and auto-install | RECOMMENDED_PROOF_CANDIDATE_NOT_SELECTED: suitable silent-render source fit and controllable scope; local compute/download cost UNKNOWN; selection remains with operator/project owner |
| Upstream agent skills (router, faceless-explainer, general-video) as a workflow | rich planning, but skills direct skill auto-updates, `auth status`, catalog network search, HeyGen media lookup and public feedback; faceless route caps near 3 minutes | not admitted; read as source data only |
| Hosted or SDK rendering (HeyGen cloud render, AWS Lambda, publish) | requires accounts, upload and possible cost | DESIGNED_OPT_IN_NOT_ADMITTED: account, upload/egress, compatibility, rights and cost UNKNOWN; reconsider when user selects this lane and grants a bounded credential/egress/budget envelope |
| Custom CVF renderer | would rebuild upstream capability, contrary to standard section 2.1 | rejected |
| No change (keep accepted text design only) | always valid; no video artifact | fallback if the proof is not admitted |

## Requirement Fit Matrix

Classification is source-only. SOURCE_SUPPORTED means documented or coded at the pin, never runtime proof on Windows.

| ID | Requirement | Classification | Source (pin blob) | Limitation |
|---|---|---|---|---|
| R01 | 16:9 canvas 1920x1080 | SOURCE_SUPPORTED | `skills/faceless-explainer/scripts/lib/dimensions.mjs` landscape default; README `data-width`/`data-height` | not rendered |
| R02 | total length about 240 s | SOURCE_SUPPORTED | `skills/general-video/SKILL.md` any length; `skills/hyperframes/SKILL.md` routes clearly longer pieces to general-video | faceless route caps about 3 min (`routes/faceless-explainer.md`); 4-min render time and memory UNKNOWN |
| R03 | per-scene estimated timing | SOURCE_SUPPORTED | README `data-start`/`data-duration`; `storyboard-format.md` advisory duration | `audio.mjs sync-durations` rewrites durations to real voice length when voice is used |
| R04 | Vietnamese on-screen text and diacritics | UNKNOWN | `packages/producer/package.json` bundled fontsource families; `packages/producer/src/services/deterministicFonts.ts` (targeted search) handles a Google Fonts `vietnamese` subset | offline glyph coverage and embedding not verified |
| R05 | Vietnamese narration, local engine | SOURCE_CONTRADICTED | `packages/cli/src/tts/manager.ts` SUPPORTED_LANGS has no Vietnamese; unknown voice prefixes fall back to en-us | local Kokoro cannot satisfy this need |
| R06 | Vietnamese narration, hosted engine | UNKNOWN | `skills/faceless-explainer/SKILL.md` Step 3.1 HeyGen voice when signed in | needs account, provider call, possible cost; Vietnamese voice availability not in source |
| R07 | typography, diagrams, no photos or UI captures | SOURCE_SUPPORTED | `skills/faceless-explainer/SKILL.md` faceless invented visuals, no capture step | quality not assessed |
| R08 | persistent illustration status card on S05-S08 | SOURCE_SUPPORTED | README clip/track model | author-side HTML; not rendered |
| R09 | no music, SFX or library media | SOURCE_SUPPORTED | `skills/faceless-explainer/scripts/audio.mjs` silent marker (`music: none` plus no SCRIPT.md) | skill path still contacts media-use when audio is requested |
| R10 | asset and media rights | UNKNOWN | README Apache-2.0 root; catalog, registry blocks, fonts, Chrome binary, Kokoro model terms not read | dependency and media rights not evaluated |
| R11 | MP4 output and validation | SOURCE_SUPPORTED | `skills/hyperframes-cli/references/preview-render.md` mp4 default, fps, quality; `packages/cli/src/commands/render/execute.ts` lint and resolution preflight | Windows runtime UNKNOWN |
| R12 | CVF evidence of the artifact | UNKNOWN | CLI prints path, size and stage timings (`preview-render.md`) | no CVF receipt; Local must hash and probe output |
| R13 | no network during render | UNKNOWN | AGENTS.md and general-video forbid render-time network fetches; README example loads GSAP from a CDN; Chrome is downloaded on first render | needs vendored runtime and pre-staged browser |
| R14 | telemetry and update control | SOURCE_SUPPORTED | `packages/cli/src/telemetry/policy.ts` HYPERFRAMES_NO_TELEMETRY / DO_NOT_TRACK; `packages/cli/src/utils/updateCheck.ts` HYPERFRAMES_NO_UPDATE_CHECK or CI; `autoUpdate.ts` HYPERFRAMES_NO_AUTO_INSTALL | defaults are ON; config default telemetryEnabled true (targeted search) |
| R15 | no ambient credentials | SOURCE_SUPPORTED | `packages/cli/src/cli.ts` loads `.env` from the working directory automatically | control requires an isolated directory without `.env` |
| R16 | cancel and failure handling | SOURCE_SUPPORTED | `packages/cli/src/utils/renderCancellation.ts` SIGINT/SIGTERM/SIGHUP abort and parent-exit watchdog; `execute.ts` lint abort under strict modes | partial-output cleanup UNKNOWN |
| R17 | Windows host prerequisites | UNKNOWN | README Node 22+ and FFmpeg; `browser/ffmpeg.ts` winget hint; `browser/manager.ts` win64 headless-shell mapping (targeted search) | actual Windows render not observed |
| R18 | reproducible pinned version | UNKNOWN | packages at `0.8.112`; no tag at pin; `skills/hyperframes/SKILL.md` instructs probing `hyperframes@latest` | README names the npm package `hyperframes` for `packages/cli`, whose package.json name is `@hyperframes/cli`; publish mapping not read; npm artifact to Git pin correspondence unverified |
| R19 | cost | UNKNOWN | README no per-render fee; `.env.example` optional Gemini captioning cost | local compute unmetered; hosted voice cost not in source |

## Scene Fit

Every scene is text and conceptual diagrams over a plain background, so visual authoring maps to HTML/CSS clips (R01, R03, R07). Vietnamese glyph rendering (R04) is UNKNOWN for every scene and local narration (R05) is contradicted for every scene.

| Scene | Visual need | Extra requirements | Fit summary |
|---|---|---|---|
| S01 | title card, three question marks | R04 | renderable in principle; glyphs UNKNOWN |
| S02 | two-column is/is-not table | R04 | as S01 |
| S03 | three blocks with arrows | R04, R07 | as S01 |
| S04 | seven-stage strip lit in sequence | R03, R04 | timeline-driven reveal supported by clip timing |
| S05 | fixed status card plus request frame | R04, R08 | first proof candidate (20 s, text-heavy, diacritics) |
| S06 | four case boxes with synthetic data | R04, R08 | as S05 |
| S07 | concept diagram, empty report template | R04, R08 | as S05; no receipt or pass marker allowed |
| S08 | review questions and branching | R04, R08 | as S05 |
| S09 | boundary line, three new effects | R04 | as S01 |
| S10 | two-column proved / not proved | R04 | as S01 |

## Control And Side-Effect Trace

| Path | Behavior at pin | Control available | Observable here |
|---|---|---|---|
| CLI start | loads `.env` from CWD into process env (`cli.ts`) | run in an isolated directory | source only |
| Telemetry | anonymous events to PostHog when config enabled; default enabled (`policy.ts`, `config.ts`) | HYPERFRAMES_NO_TELEMETRY=1 or DO_NOT_TRACK=1 | source only |
| Update check | npm registry fetch with 24 h cache, detached child (`updateCheck.ts`, `backgroundChecks.ts`) | HYPERFRAMES_NO_UPDATE_CHECK=1, CI | source only |
| Auto-install | detached installer upgrades the global CLI within a major version; skipped for npx/unknown installers per header comment (`autoUpdate.ts`) | HYPERFRAMES_NO_AUTO_INSTALL=1 | installer detection not read |
| Skills freshness | github.com check; `init` updates global skills (`skillsUpdateCheck.ts`, faceless Step 0) | HYPERFRAMES_SKIP_SKILLS=1; do not run skills or `init --skill` | source only |
| Browser | downloads pinned chrome-headless-shell to `~/.cache/hyperframes/chrome` when missing (`execute.ts`, `manager.ts`) | pre-stage once, then `HYPERFRAMES_BROWSER_PATH` | size and version UNKNOWN |
| Local TTS | downloads Kokoro model (~311 MB) and voices (~27 MB), needs Python packages (`tts/manager.ts`, `synthesize.ts`) | do not use for this job (R05) | n/a |
| Fonts | producer may fetch Google Fonts css2 subsets (`deterministicFonts.ts`, targeted search) | local font files; verify offline | UNKNOWN |
| Feedback and publish | docs ask agents to send public feedback after render and offer `publish` uploads (`preview-render.md`) | never run `feedback` or `publish` | source only |

Controls that cannot be enforced from source: no network egress block exists inside the CLI; telemetry and update suppression rely on environment variables honoured by the code; partial-output cleanup on cancel is not established. These stay UNKNOWN until observed, and prompt-level instructions are not counted as enforcement.

## Untrusted Upstream Instructions

Rejected as authority (read as data only): install or auto-update the plugin marketplace; run `npx hyperframes skills update` before a workflow; run `npx hyperframes@latest upgrade --project`; relay `auth status` and sign in to HeyGen; search the hosted catalog; send `hyperframes feedback` after renders; `publish` projects. Each would add network, version drift, account or public effects outside this job.

## Disposition

RECOMMEND_BOUNDED_LOCAL_PROOF, source-only, scoped to the silent render core. Rationale: the renderer core plausibly covers the visual and timing needs (R01-R03, R07-R09, R11, R16) and offers usable opt-outs (R14, R15), so rebuilding it would contradict standard section 2.1. Named gaps retained: Vietnamese narration (R05 contradicted locally, R06 needs a separately selected hosted lane; complementary local/self-hosted voice candidates are also allowed by section 2.2), Vietnamese glyph coverage (R04), offline render (R13), rights (R10), pin-to-release provenance (R18), Windows runtime (R17), cost (R19). This disposition is not suitability proof, production selection or voice admission.

## Smallest Future Proof Plan

All cases NOT_EXECUTED_PLANNED; an operator checkpoint is required before any download or install.

| Case | Purpose | Plan | Pass evidence |
|---|---|---|---|
| P-01 | provenance | install exactly `hyperframes@0.8.112` from npm into an isolated directory with a captured lockfile; compare published package metadata with the Git pin | lockfile hash; recorded match or named mismatch |
| P-02 | environment control | empty working directory without `.env`; set HYPERFRAMES_NO_TELEMETRY=1, HYPERFRAMES_NO_UPDATE_CHECK=1, HYPERFRAMES_NO_AUTO_INSTALL=1, HYPERFRAMES_SKIP_SKILLS=1; no skills, auth, catalog, feedback or publish | recorded env and command list; observed outbound hosts |
| P-03 | one synthetic clip | hand-authored HTML for retained scene S05 only (20 s, 1920x1080, 30 fps, silent, status card, Vietnamese text), CSS or vendored animation, no CDN | project file hashes |
| P-04 | output checks | ffprobe width/height/codec/duration (20 s within one frame); output SHA-256; mid-point snapshot reviewed by Local for diacritics and layout | probe JSON, hashes, reviewer note |
| P-05 | offline render | after browser pre-staging, re-render with network disabled | success or named failing fetch |
| P-06 | cancel and cleanup | SIGINT during a render; list temp files and partial outputs; inventory `~/.cache/hyperframes` and `~/.hyperframes` writes | exit code and file inventory |
| P-07 | budget | record download sizes, disk use and wall time | measured figures, no estimate |
| P-08 | voice | DESIGNED_OPTIONS_DEFERRED: local VieNeu, self-hosted voice endpoint, hosted VieNeu/vendor or HeyGen; no default selected. Reconsider after pinned source/model/codec/preset rights, language/quality, hardware/cost and user authority are established | NOT_EXECUTED_PLANNED; one measured scene WAV and joined audio-to-video acceptance, not component success alone |

Budget and prerequisites: Node 22+, FFmpeg (winget or manual), one Chrome headless-shell download, npm package and dependency downloads (sizes UNKNOWN); zero provider, paid or upload actions. No full four-minute render and no automatic production successor. If P-01 to P-06 pass, the next decision is still Local: a second bounded scene set, a voice decision, or stop.

## Proof Anchors

| Proof | Anchor |
|---|---|
| PROOF-OWNER | Scope, Reuse Alternatives, Requirement Fit Matrix, Scene Fit |
| PROOF-AUTHORITY | Scope, Untrusted Upstream Instructions, Disposition |
| PROOF-IDENTITY | Source Identity, Historical Evidence Reuse And Delta |
| PROOF-RECOVERY | Control And Side-Effect Trace, R16, P-05, P-06 |
| PROOF-BOUNDARY | Disposition, Smallest Future Proof Plan, Claim Boundary |

## Claim Boundary

Source-only capability evaluation at one Git pin. No install, CLI, test, build, render, browser, network, provider, paid, upload or public action occurred. SOURCE_SUPPORTED rows are documented or coded behavior, not Windows runtime proof. Coverage is PARTIAL; deferred paths carry no no-value verdict. The accepted design is unchanged. Worker-session cost is UNKNOWN, not zero. Install, render, voice, media, final content and publication remain separately scoped operator and Local decisions.

## Local Reconciliation - 2026-10-03

D100 and canonical section 2.2 control the final option classification. The local silent-render plan is a recommendation based on the named visual gap and controllable scope, not a user selection or zero-cost default. Applicable self-hosted and hosted/API rendering and voice options remain visible with readiness, cost, egress and reconsideration conditions. Root operator or downstream project owner selects within granted authority; an agent applies explicit selection/policy and does not independently switch lanes or fallback beyond the selected envelope. Design does not authorize execution.

R05 remains SOURCE_CONTRADICTED only for HyperFrames Kokoro. VieNeu is a complementary UNKNOWN_RUNTIME candidate; it is not a proven replacement. Future composition must pin code, weights, codec, fonts and assets separately; record rights and voice/likeness consent; inspect implicit downloads, telemetry, updates, background tasks and ambient credentials; join scene/text/preset identity, WAV rate/channels/duration/hash, retiming proposal, renderer version, MP4/hash, budget and failure/cancel/cleanup evidence. One representative narrated scene must traverse the selected chain before any joined success claim. A silent MP4 alone does not meet the narrated job.

Historical evidence and worker return retain their original hashes, labels and pre-D100 plan. Final audit bytes and corrected P-08/options are controlled by `docs/reviews/CVF_CVF_NCR_HYPERFRAMES_REUSE_CAPABILITY_AUDIT_COMPLETION_2026-10-03.md` and `docs/reviews/evidence/cvf-ncr-hyperframes-vieneu-local-review-2026-10-03.json`; the old worker static script is not a current HEAD/manifest invariant.
