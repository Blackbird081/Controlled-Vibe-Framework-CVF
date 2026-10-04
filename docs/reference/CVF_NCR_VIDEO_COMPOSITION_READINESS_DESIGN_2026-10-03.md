# CVF NCR Video Composition Readiness Design - S05 Voice To Render

Memory class: POINTER_RECORD

Status: ACCEPTED_BOUNDED_DESIGN_ONLY

docType: reference

Date: 2026-10-03

Batch ID: CVF-NCR-VIDEO-COMPOSITION-READINESS

EPISTEMIC_PROCESS_NA_WITH_REASON: proposed design only; input identities, field/gate/option/case joins and static checks live in `docs/reviews/evidence/cvf-ncr-video-composition-readiness-design-2026-10-03.json`.

## Purpose

Propose the smallest sufficient voice-to-render composition readiness contract for retained scene S05 of the accepted private Vietnamese 240-second 16:9 CVF explainer. The contract names what a future, separately admitted proof must identify, measure, refuse and hand over between a voice stage and a render stage. Everything here is design: proposed field, gate and case identifiers, not an implemented schema, adapter, runtime selection or executed result.

## Scope

- Job: `docs/reference/CVF_NCR_GENERAL_VIDEO_DESIGN_2026-10-02.md`, consumed unchanged (raw SHA-256 `3ce5e236...77e0`, full value in evidence). Ten scenes, 240 s estimated, 16:9, Vietnamese narration and on-screen text.
- Representative scene: S05 only, estimated window 95-115 s, estimated length 20 s, with the persistent illustration status card, synthetic example (monthly expense filter, two named files, five synthetic expense items) and claims C09/C10. An isolated S05 result is not the four-minute video.
- Inputs: seven governed inputs bound by `docs/reviews/evidence/cvf-ncr-video-composition-readiness-dispatch-inputs-2026-10-03.json`; raw SHA-256 and Git blob identities were rechecked at execution base and recorded in the evidence.
- Out of scope: installation, download, model or media creation, upstream execution, network, provider, paid service, voice cloning, credential use, upload, public sync, deployment, new CVF role, router, store, daemon or runtime owner.

## Authority And Selection Boundary

| Item | Rule in this design |
|---|---|
| Selector | Root operator in the CVF root; downstream project owner within operator-granted authority (section 2.2). No new CVF role or router. |
| Agent | May recommend; applies an explicit selection or granted policy inside the declared envelope; never selects or switches lane, budget, credential or data destination on its own. |
| Envelope | Bound once at selection (SEL fields below). Work inside it needs no repeated approval. |
| Fallback | Allowed only when the envelope pre-lists that fallback and its lane, budget, credential and egress effects; otherwise stop and request a new selection. |
| Acceptance | Narrated-video acceptance needs the joined chain (TC-18). A silent render, a WAV alone or an unrecorded fallback cannot satisfy it. |
| Design status | Option readiness labels are visibility, not support claims; implementation and execution need their own GC-018 admission. |

## Historical Source Identity

| Component | Prior observation | Status for this design |
|---|---|---|
| HyperFrames | Git pin `f16e509832d4fa02bbc9a5f81b59ff78f9d466af`, packages `0.8.112`, no tag at pin | RECOMMENDED render-core proof candidate (D101), not selected; npm-to-pin provenance UNKNOWN (R18) |
| VieNeu-TTS | Git pin `85344322b7258b4e25479b692e8e3396baf9db34`, code metadata 3.8.3, 25 presets | UNKNOWN_RUNTIME (D101); prior Local evidence recommends it as first local voice proof candidate, not default |
| Coverage | HyperFrames 35 READ / 8618; VieNeu 3 READ / 145 | PARTIAL; deferred paths carry no no-value verdict |

These pins are 2026-10-02 observations. Before any runtime use, Local must observe, update and pin the selected sources, reconcile the delta, and separately pin code, weights, codec, phonemizer, presets, denoiser, fonts, browser, FFmpeg and dependency lockfiles. Unpinned publisher licence declarations (VieNeu v3 Turbo card, MOSS codec card, sea-g2p page) are recorded evidence, not independent rights clearance.

## S05 Job Binding

| Design requirement | Proposal |
|---|---|
| DR-01 Storyboard reuse | Hash the S05 Narration, On-screen and status-card text exactly as stored (recipe and values in evidence `s05TextIdentity`). Any differing byte is a different job input, not a correction. |
| DR-02 Timing | 95-115 s / 20 s is a planning estimate, not a voice requirement. Measured voice duration is recorded (CF-32). A shorter voice may be padded inside the 20 s scene; a longer one produces PROPOSED_RETIMING that Local or the operator must approve before render. No silent edit of the brief, no time-stretching of speech to fit. |
| Illustration status | Status card on every rendered frame of S05; synthetic data only; no UI capture. |
| Text normalisation | The stored S05 strings are NFC. Text sent to a voice engine is recorded as sent (CF-20) with any pronunciation overrides as a separate hashed list; overrides never change on-screen text. |

## Design Requirement Index

| ID | Requirement | Origin |
|---|---|---|
| DR-01 | accepted storyboard reused unchanged, S05 text identity | work order item 2 |
| DR-02 | estimated timing kept; explicit retiming decision | work order item 2 |
| DR-03 | historical pins; freshness and separate component pins before use | work order item 3 |
| DR-04 | one-runtime versus smallest composition, all lanes visible | work order item 4; section 2.2 |
| DR-05 | selector authority, envelope and fallback rule | work order item 4; section 2.2 |
| DR-06 | stable job, scene, text, source and attempt identity | work order item 5 |
| DR-07 | WAV shape, duration, timebase, hash and validation | work order item 5 |
| DR-08 | renderer, browser, FFmpeg, font and composition identity | work order item 5 |
| DR-09 | MP4 metadata, hash and human review evidence | work order item 5 |
| DR-10 | implicit effect gates | work order item 6; section 2.2 |
| DR-11 | preparation versus execution egress and retention | work order item 6 |
| DR-12 | budget envelope with UNKNOWN preserved | work order item 6 |
| DR-13 | per-component rights and voice consent | work order item 6; section 2.2 |
| DR-14 | failure, cancel, retry, cleanup and custody | work order item 7 |
| DR-15 | joined end-to-end acceptance; component success insufficient | work order item 8; section 2.2 |
| DR-16 | valid data-only artefacts not falsely denied | work order item 8 |

## Composition Alternatives

Readiness tokens: RECOMMENDED_FIRST_PROOF_CANDIDATE_NOT_SELECTED, DESIGNED_OPT_IN_NOT_ADMITTED, NOT_ADEQUATE, REDUCED_SCOPE_ONLY, REJECTED. Costs are UNKNOWN unless stated; none is zero.

| ID | Lane mix | Capability and fit | Readiness | Named gaps | Prep egress / exec egress | Credential / retention | Rights | Reconsider when |
|---|---|---|---|---|---|---|---|---|
| A1 | one runtime: HyperFrames local render plus its local Kokoro voice | render core fits; Kokoro has no Vietnamese (R05) | NOT_ADEQUATE | R05 contradicted | npm, Chrome, Kokoro model / none intended | none / local only | code Apache declared; model terms unread | upstream adds a Vietnamese local voice at a new pin |
| A2 | one runtime: HyperFrames local render plus HeyGen hosted voice | single tool chain if Vietnamese voice exists | DESIGNED_OPT_IN_NOT_ADMITTED | R06 Vietnamese availability, account, cost UNKNOWN | npm, Chrome / narration text to provider | explicit account grant; provider retention UNKNOWN | provider terms and voice rights UNKNOWN | user selects with credential, egress and budget envelope |
| A3 | one runtime: HeyGen hosted render and voice | end-to-end hosted | DESIGNED_OPT_IN_NOT_ADMITTED | upload, account, compatibility, cost UNKNOWN | none local / composition and text upload | explicit grant; retention UNKNOWN | provider terms UNKNOWN | user selects hosted render with upload consent |
| A4 | one runtime: VieNeu alone | Vietnamese WAV only, no renderer | NOT_ADEQUATE | no video stage | n/a | n/a | n/a | never for MP4 job; usable as a component |
| C1 | composition: local VieNeu v3 Turbo CPU/ONNX fixed preset, WAV, local HyperFrames render, MP4 | addresses both named gaps (Vietnamese voice, render core) with no execution-time credentials or data destination | RECOMMENDED_FIRST_PROOF_CANDIDATE_NOT_SELECTED | V03-V06, R04, R10, R13, R17, R18, R19 | weights, codec, denoiser, packages, Chrome, fonts / none intended, unproven (V04) | none intended; local disk retention only | code Apache declared; weights/codec/presets publisher-declared unpinned; FFmpeg build, fonts, Chrome terms UNKNOWN | user selects after pins, rights, hardware and budget envelope |
| C2 | composition: self-hosted voice endpoint (VieNeu or other) plus local HyperFrames | moves voice compute to user host | DESIGNED_OPT_IN_NOT_ADMITTED | endpoint identity, transport, availability UNKNOWN | host-side downloads / text to user host | endpoint secret custody, host retention | as C1 plus host software | user names endpoint operator and grants envelope |
| C3 | composition: hosted voice API (VieNeu v4 or vendor) plus local HyperFrames | possibly higher quality, no local model | DESIGNED_OPT_IN_NOT_ADMITTED | terms, pricing, Vietnamese quality UNKNOWN | packages, Chrome / narration text to vendor | explicit key grant; vendor retention UNKNOWN | vendor output terms UNKNOWN | user selects with budget, egress and retention consent |
| C4 | composition: local voice plus hosted render | offloads render | DESIGNED_OPT_IN_NOT_ADMITTED | larger effect surface than C1 for a 20 s scene | as C1 / WAV and composition upload | explicit grant | as C1 plus provider | local render proves insufficient and user selects |
| N0 | silent HyperFrames render only | visual proof | REDUCED_SCOPE_ONLY | no narration | as C1 minus voice | none | as C1 render part | user explicitly accepts reduced scope; never narrated acceptance |
| N1 | no change, text design only | always valid | REDUCED_SCOPE_ONLY | no media | none | none | n/a | default when nothing is admitted |
| X1 | custom CVF voice or renderer | rebuilds adequate upstream capability | REJECTED | section 2.1/2.2 | n/a | n/a | n/a | only if every reuse option is shown inadequate |

Comparison: no single runtime is both adequate and free of new credential or upload effects for this Vietnamese narrated job (A1, A4 inadequate; A2, A3 need hosted grants). C1 is the smallest composition that closes both named gaps locally, which is why it is recommended as the first proof candidate. Its preparation downloads, unpinned retrieval paths (V03, V04), Windows behaviour and costs remain UNKNOWN. The recommendation is not a selection or default; C2, C3, A2 and A3 stay selectable.

## Selection Envelope Fields

| ID | Field | Proposal |
|---|---|---|
| SEL-01 | selectorIdentity | operator or project owner, with granting authority reference |
| SEL-02 | selectedOptionId | one option ID above, plus per-component lane (Local, Self-hosted, Hosted/API) |
| SEL-03 | componentPins | exact code, model, codec, preset, font, browser, FFmpeg and lockfile identities |
| SEL-04 | egressAllowList | preparation hosts and execution destinations, listed separately |
| SEL-05 | credentialGrants | explicit named grants only; empty for C1 |
| SEL-06 | budgetEnvelope | money, call count, download bytes, disk bytes, peak memory, elapsed time per stage; UNKNOWN allowed, never read as zero |
| SEL-07 | preauthorizedFallbacks | ordered list with each fallback's lane, budget, credential and egress delta; empty means stop on failure |
| SEL-08 | retryPolicy | maximum attempts per stage and whether same-identity retries are allowed |
| SEL-09 | timeouts | per-stage wall-clock ceilings for subprocess or endpoint calls |
| SEL-10 | rightsAndConsentRefs | per-component rights evidence and voice/likeness consent references |

## File-First Handoff Contract (Proposed Fields)

Contract form is file-first: each stage writes artefacts plus a small manifest into its own attempt directory; the next stage verifies hashes before reading. Owners stay existing: work order defines scope, Local artifact verification judges outputs. Field IDs are design names only.

| ID | Group | Field | Proposed content or rule |
|---|---|---|---|
| CF-01 | identity | jobId | stable ID for the accepted design job |
| CF-02 | identity | designSource | path, raw SHA-256 and Git blob of the accepted design |
| CF-03 | identity | sceneId | `S05` plus estimated window and length |
| CF-04 | identity | narrationTextSha256 | recipe in evidence; must equal stored value |
| CF-05 | identity | onScreenTextSha256 | recipe in evidence; must equal stored value |
| CF-06 | identity | statusCardTextSha256 | card prefix of the On-screen value |
| CF-07 | identity | attemptId | unique attempt ID assigned before execution and immutable; record its ordinal and bindings to CF-08 and the stage reuse keys CF-09; a retry has a new attempt ID |
| CF-08 | identity | envelopeRef | hash of the SEL record in force |
| CF-09 | identity | stageReuseKeys | proposed deterministic UTF-8 canonical manifest digests, sorted keys with explicit units; voice key binds CF-02..CF-06, CF-08, CF-11..CF-20 and CF-36; render key binds CF-08, verified CF-28, CF-34..CF-35 and CF-40..CF-47. Missing or ambiguous inputs forbid reuse. Attempt ordinal excluded; source artefact bytes and validation/rights/authority rechecked under the current envelope |
| CF-10 | voice | voiceLane | Local, Self-hosted or Hosted/API, copied from SEL-02 |
| CF-11 | voice | engineIdentity | repository, Git pin, package name and version, lockfile hash |
| CF-12 | voice | modelIdentity | weights repository, immutable revision, file hashes |
| CF-13 | voice | codecIdentity | codec repository, revision, file hashes, local path actually used |
| CF-14 | voice | phonemizerIdentity | package and version; dictionary hashes if any |
| CF-15 | voice | presetIdentity | preset ID and hash of the preset file actually loaded (V03 override risk) |
| CF-16 | voice | deviceBackend | explicit CPU/ONNX for C1; auto selection refused (V05) |
| CF-17 | voice | denoiserIdentity | identity or `NOT_LOADED` with observation |
| CF-18 | voice | rightsRefs | per-component licence evidence, each with its own level |
| CF-19 | voice | consentRef | preset consent evidence; cloning out of scope |
| CF-20 | voice | textAsSent | hash of exact engine input and of any pronunciation override list |
| CF-21 | wav | path | relative to the voice attempt directory |
| CF-22 | wav | container | RIFF/WAVE, header parsed |
| CF-23 | wav | sampleRateHz | proposed 48000 (V01 source fact); other values only by declared conversion |
| CF-24 | wav | channels | proposed 1 |
| CF-25 | wav | sampleFormat | PCM 16-bit or IEEE float 32-bit, declared |
| CF-26 | wav | frameCount | from header and data length, must agree |
| CF-27 | wav | durationSeconds | frameCount / sampleRateHz, timebase is samples |
| CF-28 | wav | sha256 | raw file bytes |
| CF-29 | wav | levelChecks | peak dBFS and full-scale run count |
| CF-30 | wav | silenceChecks | leading, trailing and longest internal silence; overall RMS |
| CF-31 | wav | validationDisposition | VALID, REJECTED_WITH_REASON or PARTIAL_NOT_ACCEPTED |
| CF-32 | timing | measuredVsEstimate | CF-27 minus 20 s estimate |
| CF-33 | timing | retimingDecision | NONE_PAD_WITHIN_SCENE, PROPOSED_RETIMING_PENDING_APPROVAL or APPROVED_RETIMING with approval ref |
| CF-34 | timing | finalTimeline | scene start, duration, audio offset, fps, frame count |
| CF-35 | timing | timebaseNote | audio in samples, video in frames, conversion recorded |
| CF-36 | voice | generationSettings | explicit seed or UNAVAILABLE_WITH_REASON, engine settings, speaking-rate and normalization/pronunciation configuration with exact values and hash; no ambient defaults; proposed manifest only |
| CF-40 | render | rendererIdentity | package name and version, lockfile hash, Git pin, publish mapping result |
| CF-41 | render | runtimeIdentity | Node version and binary hash |
| CF-42 | render | browserIdentity | headless browser version, path and hash |
| CF-43 | render | ffmpegIdentity | version, build configuration and hash |
| CF-44 | render | fontIdentity | font files, hashes, licences, Vietnamese glyph coverage result |
| CF-45 | render | compositionInputs | HTML, CSS and vendored script hashes; no remote URL |
| CF-46 | render | audioReference | WAV hash consumed; must equal CF-28 |
| CF-47 | render | renderSettings | 1920x1080, fps (proposed 30), codec and quality flags |
| CF-50 | mp4 | path | relative to the render attempt directory |
| CF-51 | mp4 | sha256 | raw file bytes |
| CF-52 | mp4 | videoStream | codec, width, height, fps, frame count, duration |
| CF-53 | mp4 | audioStream | codec, sample rate, channels, duration |
| CF-54 | mp4 | avDurationDelta | audio versus video duration |
| CF-55 | mp4 | snapshotHashes | frame snapshots used by reviewers |
| CF-60 | review | vietnameseListening | Vietnamese-speaking listener: intelligibility, diacritic tones, acronym and file-name handling |
| CF-61 | review | visualReview | status card on all frames, diacritics rendered, layout |
| CF-62 | review | audiovisualReview | sync, cut-off, padding, overall fit |
| CF-63 | review | joinedAcceptance | ACCEPTED_JOINED only if FR-01..FR-09 pass, selected-scope G-01..G-18 obligations have evidence (UNKNOWN means DEFERRED), CF-31 is VALID, CF-33 authorizes the timeline, CF-46 equals CF-28, TOL-06/TOL-07 pass and CF-60..CF-62 approve; bind all decisions to CF-08 and final hashes |
| CF-70 | effects | egressObservation | observed hosts per stage, or UNKNOWN with observation limit |
| CF-71 | effects | budgetUse | measured use against SEL-06 |
| CF-72 | effects | writeInventory | files created outside attempt directories (caches, home) |
| CF-73 | effects | processInventory | child processes started and confirmed ended |

### Proposed Tolerances (Design Proposals, Not Measurements)

| ID | Tolerance | Reason |
|---|---|---|
| TOL-01 | sample rate 48000 Hz mono; mismatch rejected unless a declared conversion step with identity is in the envelope | avoids silent resampling ambiguity; matches VieNeu V01 source fact |
| TOL-02 | WAV frame count and header length agree exactly | corrupt or truncated file detection |
| TOL-03 | no run of 3 or more samples at or above 0.999 full scale | simple clipping signal; listening still decides quality |
| TOL-04 | leading silence at most 1.0 s, trailing at most 1.5 s, no internal silence over 2.0 s, overall RMS above -40 dBFS | catches empty, silent or stalled synthesis without judging naturalness |
| TOL-05 | voice at most 19.5 s: pad inside 20 s scene; over 19.5 s: PROPOSED_RETIMING | keeps 0.5 s tail before cut and keeps the brief unchanged unless approved |
| TOL-06 | MP4 decoded audio-track and video durations differ by at most 0.1 s; video equals CF-34 within one frame. Short narration is followed by declared generated silence in the output track to the final scene end, no speech time-stretch and no source WAV mutation. CF-34 records the padding; TOL-04 applies only to the original voice WAV, not output padding | allows encoder padding while catching truncation |
| TOL-07 | MP4 1920x1080 and fps equal CF-47 exactly | 16:9 brief |

### Transport Profiles (Optional Mappings, No Adapter)

| ID | Profile | Mapping |
|---|---|---|
| TP-FILE | file exchange | base contract above; consumer verifies hashes |
| TP-SUBPROCESS | local process | command line, environment allowlist, working directory, exit code, stdout/stderr hashes; timeout SEL-09 |
| TP-LOCAL-ENDPOINT | loopback server | bind address, port, auth, start/stop record; response body hashed into CF-21..CF-28 |
| TP-SELF-HOSTED | user host | endpoint identity, TLS, secret ref, host software identity, retention statement |
| TP-HOSTED-API | provider | endpoint, model/voice name, request count, characters sent, receipt ID, cost reported, retention terms |

## Effect And Readiness Gate Matrix

Columns separate existing source fact (from D101 evidence), control proposal and the observable gap that only a future run can close. A virtual environment or isolated directory is not an OS sandbox and not offline proof.

| Gate | Effect | Existing source fact | Control proposal | Observable proof gap |
|---|---|---|---|---|
| G-01 | implicit `.env` loading | HyperFrames CLI loads `.env` from working directory (R15); VieNeu UNKNOWN | empty attempt directory, environment allowlist, preflight refuses a present `.env` | child process environment not yet observed |
| G-02 | default telemetry | HyperFrames telemetry default on, env opt-outs (R14); VieNeu and hub client UNKNOWN | set documented opt-outs; record environment | outbound hosts during run |
| G-03 | auto-update or installer | HyperFrames update check and detached auto-install (R14); VieNeu installer only web-reported | opt-outs, no global install, pinned local packages | installer detection on Windows |
| G-04 | background children | HyperFrames detached background checks; render spawns browser and FFmpeg | process inventory before and after each stage (CF-73) | orphan processes after cancel |
| G-05 | first-run model and codec retrieval | VieNeu downloads omit revision pin (V03); codec_dir not forwarded by public constructor (V04) | preparation stage with pinned revisions into a recorded cache; execution stage refuses retrieval | whether C1 can run with zero execution egress |
| G-06 | preset override | repository voice file may override built-in voices and default (V03) | pin preset file hash (CF-15); mismatch rejects | which file is loaded at run |
| G-07 | denoiser retrieval | constructor attempts denoiser retrieval in preset-only lane (V03) | stage in preparation or record as egress and stop | behaviour when unavailable |
| G-08 | browser retrieval | HyperFrames downloads headless Chrome when missing | pre-stage, pass explicit browser path, hash it (CF-42) | Windows download size and path |
| G-09 | font retrieval | producer may fetch Google Fonts subsets (R04) | local Vietnamese-capable fonts with hashes (CF-44) | offline glyph rendering |
| G-10 | GPU remote code | GPU path uses trust_remote_code (V05) | explicit CPU/ONNX; auto device refused | observe CPU/ONNX selection and absence of GPU/remote-code loading for C1; GPU lane needs its own admission |
| G-11 | endpoint exposure | VieNeu optional local API server (web-reported); HyperFrames preview server | TP-FILE or TP-SUBPROCESS for C1; endpoint profiles bind loopback with auth | listening sockets during run |
| G-12 | ambient secrets | HyperFrames auth state, hub tokens in user cache | no ambient credential fallback; only SEL-05 grants | token use observation |
| G-13 | public feedback, publish, skills update | HyperFrames documents feedback, publish, skills updates | never invoked; upstream instructions are data | future command/effect inventory confirms publish, feedback and skills update were not invoked |
| G-14 | egress split | downloads differ from narration-text egress and provider retention | SEL-04 lists preparation and execution separately; retention recorded per destination | observed versus declared hosts |
| G-15 | budget | costs UNKNOWN (R19, D101) | SEL-06 caps checked before each stage; stop at cap | measured download, disk, memory, time, money |
| G-16 | per-component rights | code Apache declared; weights, codec, presets publisher-declared unpinned; fonts, Chrome, FFmpeg build UNKNOWN (R10) | CF-18 per component; FFmpeg build licence recorded | pinned licence texts and attribution list |
| G-17 | voice and likeness consent | presets publisher states consent, unpinned | fixed preset with consent ref (CF-19); cloning refused | fixed-preset consent evidence must match the pinned preset and voice actually used; UNKNOWN blocks joined acceptance. Cloning remains separately out of scope |
| G-18 | source freshness and provenance | pins historical; npm-to-pin unknown (R18); 3.8.3 vs card 3.7.1 (V02) | Local freshness/delta review before use; mismatch blocks | package-to-source correspondence |

## Failure, Cancel, Retry And Cleanup

| ID | Rule |
|---|---|
| FR-01 | Reject missing, stale or mixed identities: CF-04..CF-06 mismatch, CF-46 not equal to CF-28, or artefact not explicitly bound to this attempt and current CF-08/CF-09. Cross-attempt reuse needs FR-05 evidence, never implicit relabelling. |
| FR-02 | Reject wrong audio shape (TOL-01, TOL-02), clipping or silence breach (TOL-03, TOL-04) and unexplained duration change (TOL-05 without CF-33). |
| FR-03 | Reject unverified rights or consent, unapproved lane, credential, egress or budget effects. Rejection is recorded, never converted into success. |
| FR-04 | Outputs are written in the attempt directory and promoted only after validation; partial or older files are never marked accepted. |
| FR-05 | An exact CF-09 stage key may reuse a previously validated artefact across different attempt IDs only after rehashing bytes, rechecking current rights/consent and CF-08 authority, and recording the source attempt and validation evidence. Changed text-as-sent, override, generation settings, pins, envelope or relevant composition inputs creates a different key and forbids reuse. Concurrent duplicate stage-key requests are refused; ordinal distinguishes attempts, not content. |
| FR-06 | Timeouts come from SEL-09 per stage. On timeout the process tree is ended, outputs marked PARTIAL_NOT_ACCEPTED. |
| FR-07 | Cancel during voice: end process tree, quarantine partial WAV. Cancel between stages: keep validated WAV as unaccepted intermediate, render not started. Cancel during render: use renderer cancellation, inventory partial MP4 and caches. |
| FR-08 | After any end state, inventory temp files, partial outputs, caches and home-directory writes (CF-72) and children (CF-73); cleanup responsibility named in the return. |
| FR-09 | Retry follows SEL-08 only: same lane, same envelope, bounded count. A change of lane, budget, credential or destination stops for a new selection. No ambient credential fallback. |
| FR-10 | No durable acceptance store, daemon, watcher, send/B2 repair or new runtime owner is introduced; evidence stays in the attempt record reviewed by Local. |

## Planned Cases

All cases are NOT_EXECUTED_PLANNED; full joins (requirement, field, gate, source gap, expected evidence) are in the evidence JSON.

| Case | Class | Summary |
|---|---|---|
| TC-01 | POSITIVE | selected C1 chain produces S05 MP4 with all joins |
| TC-02 | ADVERSARIAL | Unicode NFC/NFD, diacritics, acronym and file-name text |
| TC-03 | ADVERSARIAL | voice longer than TOL-05 requires approved retiming |
| TC-04 | POSITIVE | shorter voice padded inside scene, brief unchanged |
| TC-05 | ADVERSARIAL | wrong WAV rate, channels or subtype |
| TC-06 | ADVERSARIAL | corrupt, empty, clipped or silent WAV |
| TC-07 | ADVERSARIAL | missing, mixed or stale input hashes |
| TC-08 | ADVERSARIAL | source, revision or rights drift |
| TC-09 | ADVERSARIAL | preset override or cloning without consent |
| TC-10 | ADVERSARIAL | implicit first-run network at execution |
| TC-11 | ADVERSARIAL | ambient `.env`, telemetry, updater, auto GPU device or open endpoint |
| TC-12 | ADVERSARIAL | unauthorized hosted fallback |
| TC-13 | POSITIVE | preauthorized fallback inside envelope |
| TC-14 | ADVERSARIAL | cancel in voice, between stages, in render |
| TC-15 | ADVERSARIAL | timeout, retry, duplicate attempt, partial cleanup |
| TC-16 | ADVERSARIAL | budget cap reached |
| TC-17 | ADVERSARIAL | model or package provenance mismatch |
| TC-18 | POSITIVE | joined output validation and Vietnamese listening |
| TC-19 | FALSE_DENIAL | valid data-only artefacts must not be refused |
| TC-20 | ADVERSARIAL | silent or component-only success claimed as narrated |
| TC-21 | POSITIVE | explicitly selected hosted voice lane with envelope |
| TC-22 | ADVERSARIAL | Changed pronunciation/settings/envelope with same attempt inputs |
| TC-23 | POSITIVE | Exact authorized stage inputs reused under a new attempt ordinal |
| TC-24 | ADVERSARIAL | Short unpadded output audio or silence counted as source-voice silence |

## Open Obligations And UNKNOWNs

| ID | Obligation | Owner |
|---|---|---|
| OBL-01 | select option, lanes and SEL envelope | operator or project owner |
| OBL-02 | refresh and pin sources, models, codec, presets, fonts, browser, FFmpeg | Local, in an admitted scope |
| OBL-03 | establish per-component rights and consent evidence | Local with operator |
| OBL-04 | set budget, timeout and retry values (UNKNOWN today) | operator |
| OBL-05 | admit a GC-018 proof scope before any download or run | operator and Local |
| OBL-06 | nominate a Vietnamese-speaking listener for CF-60 | operator |
| OBL-07 | approve or reject any PROPOSED_RETIMING | Local or operator |

Session cost and every execution cost are UNKNOWN; no zero-cost claim.

## Proof Anchors

| Proof | Anchor |
|---|---|
| PROOF-OWNER | Scope, S05 Job Binding, Composition Alternatives |
| PROOF-AUTHORITY | Authority And Selection Boundary, Selection Envelope Fields |
| PROOF-IDENTITY | Historical Source Identity, handoff fields CF-01..CF-47, G-18 |
| PROOF-RECOVERY | Failure, Cancel, Retry And Cleanup; gates G-04, G-05, G-07 |
| PROOF-BOUNDARY | Effect And Readiness Gate Matrix, Open Obligations, Claim Boundary |

## Local Review Disposition

Accepted as a proposed contract only after Local F-01 duration/padding and F-02 reuse-identity corrections, including dependent joined-acceptance and effect-observation clarifications. Original worker evidence remains historical and recoverable; current review: `docs/reviews/CVF_CVF_NCR_VIDEO_COMPOSITION_READINESS_DESIGN_COMPLETION_2026-10-03.md`; current static evidence: `docs/reviews/evidence/cvf-ncr-video-composition-readiness-local-review-2026-10-03.json`. No option selected, threshold measured or runtime admitted.

## Claim Boundary

Proposed design only. No option is selected or defaulted; C1 is a recommendation supported by D101 source-only evidence. Fields, tolerances, gates and cases are design proposals, not an implemented schema or measured thresholds. Source coverage stays PARTIAL and pins historical. No install, download, model, WAV, MP4, project file, upstream run, network, provider, paid, credential, clone, upload, public or deployment effect occurred. The accepted storyboard is unchanged. Q001/Q004/P11 and send/B2 keep their boundaries.
