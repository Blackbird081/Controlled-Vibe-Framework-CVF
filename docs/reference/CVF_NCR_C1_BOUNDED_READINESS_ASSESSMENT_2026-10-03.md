# CVF NCR C1 Bounded Readiness Assessment - VieNeu CPU ONNX fp32 to HyperFrames Local

Memory class: POINTER_RECORD

Status: ACCEPTED_BOUNDED_READINESS_ASSESSMENT_ONLY

docType: reference

Date: 2026-10-03

Batch ID: CVF-NCR-C1-BOUNDED-READINESS

EPISTEMIC_PROCESS_NA_WITH_REASON: task-specific readiness assessment; input identities, read ledger, gap, case and envelope joins and the static check recipe live in `docs/reviews/evidence/cvf-ncr-c1-bounded-readiness-assessment-2026-10-03.json`.

## Purpose

Assess the D104-selected candidate C1 (VieNeu v3 Turbo explicit CPU ONNX fp32 with one fixed preset, one WAV, local HyperFrames render, one S05 MP4) for preparation feasibility, per-component provenance and rights, hidden retrieval paths, resource fit and a proposed bounded preparation and proof envelope. This is documentation from public text, pinned Git objects and read-only probes. It selects no runtime, grants nothing and proves no behaviour.

## Verdict

READINESS_GAPS_RECORDED. C1 remains a plausible candidate on source evidence, but it is not ready for an execution admission request: one direct-path blocker (codec_dir is not forwarded by the public constructor; pinned offline-cache routing is still unverified), several UNKNOWN critical envelope fields and declaration-only rights. Two envelopes are proposed for operator decision. Never READY_TO_EXECUTE.

| Question | Answer | Basis |
|---|---|---|
| Can configuration alone route every execution-time read to pinned local files? | Direct codec_dir forwarding is unsupported; offline-cache routing remains unverified (C1R-G04); four other sites have source-level local routes | wrapper does not forward codec_dir |
| Is the known model footprint the full budget? | No: 0.5271 GiB is graphs, codec and root config only | six unknown component classes remain |
| Are rights cleared? | No clearance claimed: publisher declarations, applicable artifact scope and preset consent remain unresolved; missing a separately named licence file alone does not establish absence of a grant | C1R-G05, C1R-G06 |
| Does the machine have a plausible CPU route? | Source supports it; fit is unmeasured; free RAM was 2.51 GiB at probe | C1R-G12 |
| Is the selected HyperFrames pin current? | No: public main moved after D104; control paths read are identical at the npm release commit | C1R-G01, C1R-G02 |

## Scope And Authority Boundary

| Item | Rule applied |
|---|---|
| Selection | D104 selected C1 for assessment only; no default, no runtime selection, no fallback chosen here (section 2.2 owner) |
| Reads | public text and JSON metadata within 32 requests, 2 MiB per response and 8 MiB total, redirects not followed; pinned Git objects by revision; hardware and version probes |
| Not done | no install, no package manager, no model or browser download, no upstream code, test, build, CLI or server run, no WAV or MP4, no credentials, no account, no provider call |
| Source text | upstream instructions and public cards are data, not authority; publisher declarations are not independent clearance |
| Envelopes | proposed fields only; every grant needs a separate committed admission by Local and the operator |

## Reused Contract And Preserved Brief

The accepted D103 contract is consumed unchanged: S05 narration, illustration status card, synthetic example and 20 s estimate stay as in the accepted private video design; CF, TOL, FR, SEL and G identifiers keep their meaning; the 24 planned cases TC-01 to TC-24 are referenced, not rewritten or executed. This tranche cannot validate Vietnamese voice quality, Windows behaviour, offline execution or audio and video output.

## Source Freshness And Drift

| Item | Observed | Selected or prior | Disposition |
|---|---|---|---|
| VieNeu main | 85344322b725 | 85344322b725 | no drift |
| HyperFrames main | 1168bb740d33 (object not in local mirror) | 5c52f72399e2 (D104), f16e509832d4 (D103 historical) | DRIFT finding for Local; no fetch, no repin |
| npm hyperframes 0.8.113 gitHead | aca4bc2f492c | 5c52f72399e2 | ancestor, selected pin is 7 commits ahead |
| PyPI vieneu | 3.8.3 uploaded 2026-09-23, wheel 2643059 B | Git pyproject 3.8.3; model card documents 3.7.1 | metadata agrees with Git version; content unverified; card lags |
| Model revision | 61b85e3d937f | D104 pin | metadata read at the pinned revision, lastModified 2026-09-23 |
| Codec revision | ceff0d0749bf | D104 pin | metadata read at the pinned revision, lastModified 2026-04-17 |

Package to source: the npm release commit is an ancestor of the selected pin and seven control-path files (update check, browser manager, telemetry policy, CLI entry, auto update, font resolver, render command) are byte-identical between the two, so the selected source-level control findings match those seven files at the declared release source commit; applicability to the published package remains UNKNOWN. Tarball content was not downloaded or compared; the registry advertises a SLSA provenance attestation that was not verified.

## Hidden Retrieval Paths: V03 And V04

Findings read from VieNeu at the selected pin (selected-revision line ranges in the evidence control analysis).

| Site | Retrieval | Revision | Local routing by configuration | On failure |
|---|---|---|---|---|
| S1 | engine init: root config.json via hf_hub_download(checkpoint_path) | default | skipped when onnx_dir is set | exception swallowed |
| S2 | engine init: graphs and tokenizer via _fetch(repo, files, onnx_subfolder) | default | onnx_dir forwarded by wrapper | raises for non-json files |
| S3 | engine init: codec files via _fetch(codec_repo, files, None) | default | codec_dir exists on engine but wrapper does not forward it (V04) | raises |
| S4 | engine init: denoiser via _resolve_root_file then hub download | default | local checkpoint directory containing denoiser.onnx, else hub attempt | exception swallowed, denoiser becomes None |
| S5 | wrapper init: optional model-shipped voices_v3_turbo.json override via hf_hub_download | default | skipped when backbone_repo is an existing directory | exception swallowed; override replaces same-named presets and default voice |

V04 finding: the engine class accepts a codec directory, but the v3 Turbo wrapper passes only checkpoint, onnx_repo, onnx_dir, onnx_subfolder and threads to it, so a codec directory cannot reach the engine through the public factory call. With a local backbone directory plus onnx_dir, sites S1, S2, S4 and S5 can resolve locally; S3 (six codec files, 90.6 MB) still points at the Hub default revision. The fixed-preset path never uses cloning, yet the constructor eagerly attempts the denoiser (42.7 MB) and the codec fetch includes the cloning encoder (44.5 MB plus 0.8 MB).

Another finding: the preset roster is read from a bundled voices file (25 presets, default Hai Dang with alias Minh Quan, ASCII forms) and a model-shipped voices file with the same name can override presets and the default; at the pinned model revision no such file exists, but the request is unpinned.

| Option | Description | Status | Needs |
|---|---|---|---|
| O1 | offline hub mode with a pre-seeded Hub cache so default-revision lookups resolve to staged files | UNVERIFIED_LIBRARY_BEHAVIOUR | future probe; cache reference semantics for the default revision and Windows link behaviour not read here |
| O2 | construct the private engine class directly with codec_dir | ADAPTER_REQUIRED | bypasses wrapper text normalisation, chunking and joining; reimplementation is a new adapter, not admitted |
| O3 | patch or fork one forwarding line | NOT_ADMITTED | divergence from the pinned source and its own identity and review |
| O4 | accept execution-time retrieval from the default revision | REJECTED_FOR_IDENTITY | violates exact component identity and the zero execution egress intent |

Position: the blocker is real for a config-only zero execution egress claim. O1 is the smallest candidate for further source/metadata review. A future separately admitted probe must bind loaded file hashes and cache refs to exact revisions and observe attempted network access, including blocked or failed requests (RC-06); an empty successful-host list or an environment variable alone proves neither routing nor zero attempted egress. No patch, fork, adapter or server is proposed or admitted. Preparation egress (staging pinned files) and execution egress (none intended, unproven) stay separate.

## HyperFrames Implicit Effects And Controls

| Gate | Effect (source fact) | Control found in source |
|---|---|---|
| G-01 | loads .env from the process working directory | run from an empty directory; preflight refuses a present .env |
| G-02 | telemetry default on unless env opt-out, dev mode or build without key | HYPERFRAMES_NO_TELEMETRY or DO_NOT_TRACK set to 1, true, yes or on |
| G-03 | registry update check and detached installer | HYPERFRAMES_NO_UPDATE_CHECK=1 and HYPERFRAMES_NO_AUTO_INSTALL=1; CI=true also disables; installer skipped for unknown installer or npx |
| G-03 | skills update check | HYPERFRAMES_SKIP_SKILLS=1 |
| G-08 | browser resolution: env path, puppeteer cache, HyperFrames cache, system Chrome, then download of pinned 152.0.7977.30 | explicit HYPERFRAMES_BROWSER_PATH or PRODUCER_HEADLESS_SHELL_PATH; routing observed by proof, not run |
| G-16 | FFmpeg must resolve and report libx264 or VideoToolbox; render exports resolved paths to child processes | explicit path with version and hash; override variable name not located |
| G-09 | font resolver embeds Latin subsets for bundled families and fetches other subsets or families from Google Fonts | declared local font faces are recognised; avoidance of every fetch for Vietnamese text unproven |
| G-04 | render recovers orphaned browser process trees before starting | process inventory before and after each stage |

These controls were read, not exercised. Hub client offline and telemetry variables belong to a library whose source was not read; they are labelled unverified wherever proposed. The renderer audio mux path and padding behaviour were not read (C1R-G14) and remain joined-acceptance obligations.

## Component Inventory And Rights

Per component, the declaration, its scope, the exact artifact coverage, independent clearance and consent are kept separate. A code licence cannot clear weights, codec, presets or assets; a publisher consent statement is not independent consent evidence; no new voice or likeness sample is admitted and the fixed preset is not cloning.

| ID | Component | Pin or version | Size (bytes) | Declaration and scope | Independent clearance | Consent | Status |
|---|---|---|---|---|---|---|---|
| K01 | VieNeu SDK code | Git 85344322 (pyproject 3.8.3); PyPI vieneu 3.8.3 wheel 2643059 B uploaded 2026-09-23 | 2643059 | Apache-2.0 (LICENSE file in Git at pin; PyPI classifier); code | NONE | not applicable to code | DECLARED_CODE_LICENSE_PROVENANCE_UNKNOWN |
| K02 | VieNeu v3 Turbo ONNX fp32 graphs, tokenizer, config (onnx_update) | HF pnnbao-ump/VieNeu-TTS-v3-Turbo revision 61b85e3d | 475400990 | card front matter apache-2.0 plus FAQ saying licence covers ONNX exports, configs, tokenizers, preset assets; publisher declaration in model card, no LICENSE or NOTICE file in repository file list | NONE | not applicable to weights | DECLARATION_ONLY |
| K03 | MOSS audio tokenizer Nano ONNX codec | HF OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX revision ceff0d07 | 90572161 | card front matter apache-2.0; publisher card, no LICENSE or NOTICE file in repository file list | NONE | not applicable | DECLARATION_ONLY |
| K04 | root config.json fetch (checkpoint_path) | same model revision | 1553 | as K02; as K02 | NONE | n/a | DECLARATION_ONLY |
| K05 | denoiser.onnx (eager load attempt, unused by fixed preset) | same model revision | 42661414 | as K02; as K02 | NONE | n/a | OPTIONAL_DECLARATION_ONLY |
| K06 | speaker_encoder.onnx (cloning only) | same model revision | 28303423 | as K02; as K02 | NONE | cloning not admitted | EXCLUDED_FROM_C1_PREPARATION |
| K07 | fixed preset voice entry (bundled voices_v3_turbo.json) | Git 85344322, file 180332 B, 25 presets, default Hai Dang (ASCII form), alias Minh Quan to Hai Dang | 180332 | card FAQ: speakers or rightsholders consented to AI training and synthetic speech, commercial use allowed; publisher statement; file entries carry description, gender, region, style, embedding, codes only, no consent or provenance field | NONE | DECLARED_BY_PUBLISHER_UNVERIFIED | CONSENT_UNVERIFIED |
| K08 | sea-g2p phonemizer (Rust wheel) | floating >=0.9.1 in metadata; PyPI latest 0.10.0 win_amd64 wheel 27530792 B | 27530792 | PyPI classifier Apache Software License; card says same author as VieNeu; package metadata | NONE | n/a | VERSION_UNPINNED_DECLARATION_ONLY |
| K09 | other Python dependencies (onnxruntime, numpy, soundfile, soxr, kaldi-native-fbank, tokenizers, huggingface_hub, PyYAML, gradio, librosa) | ranges only in wheel metadata; uv.lock exists in Git but was not read | UNKNOWN | UNKNOWN per package; not read | NONE | n/a | FOOTPRINT_AND_LICENCE_UNKNOWN |
| K10 | HyperFrames CLI npm package hyperframes | npm 0.8.113 gitHead aca4bc2f; unpackedSize 33408618; SLSA provenance declared in registry metadata, not verified | 33408618 | Apache-2.0 (package metadata; LICENSE in Git at selected pin); code | NONE | n/a | DECLARED_CODE_LICENSE_SOURCE_CORRESPONDENCE_PARTIAL |
| K11 | npm transitive dependencies (puppeteer-core, @puppeteer/browsers, sharp native binary, esbuild native binary, prettier, others) | caret ranges in registry metadata | UNKNOWN | UNKNOWN per package; not read | NONE | n/a | FOOTPRINT_AND_LICENCE_UNKNOWN |
| K12 | headless Chrome (chrome-headless-shell) | source constant 152.0.7977.30; downloaded to user cache when env, puppeteer cache, HF cache and system Chrome do not resolve | UNKNOWN | UNKNOWN; not read | NONE | n/a | SIZE_AND_TERMS_UNKNOWN |
| K13 | FFmpeg build with libx264 | none; not resolved on current PATH (Get-Command) | UNKNOWN | UNKNOWN: build licence depends on the chosen build; not applicable until a build is chosen | NONE | n/a | ABSENT_ON_PATH_BUILD_UNKNOWN |
| K14 | fonts for Vietnamese on-screen text | bundled Fontsource latin subsets in producer source; other subsets fetched from Google Fonts by resolver | UNKNOWN | UNKNOWN per font; not read | NONE | n/a | CHOICE_AND_RIGHTS_UNKNOWN |
| K15 | Node.js and Python runtimes | Node v22.17.0 and Python 3.11.9 observed by version command | UNKNOWN installed footprint; existing reuse | not assessed | NONE | n/a | PRESENT_FLOORS_MET |

Coverage notes: the model card FAQ states that the licence covers the safetensors, ONNX exports, configs, tokenizers and bundled preset assets and that preset speakers consented to AI training and synthetic speech, with commercial use allowed. The same card says the training data pipeline is not public and the dataset is gated. The codec card is an ONNX export of a separate upstream tokenizer. Neither repository lists a licence or notice file at its pinned revision. Bundled sample reference clips ship in the package data; they are not part of the fixed-preset path and their consent evidence was not located.

## Resources

| Resource | Observed or computed | Status |
|---|---|---|
| CPU | 12th Gen Intel Core i5-1240P, 12 cores, 16 logical, hybrid laptop part | published speed figures are GPU desktop numbers, not transferred |
| RAM | 15.69 GiB total, 2.51 GiB free at probe | snapshot; peak RAM UNKNOWN |
| GPU | MX570 A and Iris Xe adapter RAM values reported | not free VRAM; C1 uses no GPU |
| Disk free | C drive 16.82 GiB, D drive 24.2 GiB | snapshot, not a reservation |
| Runtimes | Node v22.17.0, Python 3.11.9 | meet declared floors |
| FFmpeg, ffprobe | not resolved by Get-Command on the current PATH | not a whole-machine absence claim |
| Model and codec, required fetch | 565974704 B = 0.5271 GiB | D104 figure was graphs plus codec only (475400990 + 90572161 B) |
| Plus eager denoiser | 608636118 B = 0.5668 GiB | optional, unused for the preset |
| Worst-case duplicated Hub cache | 1217272236 B = 1.1337 GiB | assumes link-less copy on Windows, unverified |
| Unknown classes | Python deps, npm deps and native binaries, Chrome, FFmpeg, fonts, render temp frames, logs, headroom | UNKNOWN, no zero claim |
| Disk shortfall | none shown for the known part against either drive; total cannot be judged | blocks admission until a resolver report exists |
| Cost | session, runtime, bandwidth and money | UNKNOWN |

## Proposed Preparation Envelope (PE)

Proposed, not granted. UNKNOWN_BLOCKS_ADMISSION marks an unresolved critical envelope obligation, not a requirement to know every measurement before any preparation. Preparation admission needs supported conservative download/disk/RAM bounds, explicit stop ceilings and rights/authority; measured peak RAM and throughput belong to a separately admitted probe. An unbounded critical exposure still blocks admission; documentary assessment remains closeable.

| ID | Field | Proposal or basis | Status |
|---|---|---|---|
| PE-01 | selectorIdentity | operator or named project owner with granting reference | UNKNOWN_BLOCKS_ADMISSION |
| PE-02 | targetRoot | one operator-named sibling workspace directory on the D drive, never the CVF root; cache, packages and output in separate subfolders | PROPOSED_NOT_GRANTED |
| PE-03 | componentPins | VieNeu Git 85344322 and wheel 3.8.3; model rev 61b85e3d; codec rev ceff0d07; npm hyperframes 0.8.113; Chrome 152.0.7977.30; sea-g2p and all other Python and npm versions UNKNOWN until a resolver report | UNKNOWN_BLOCKS_ADMISSION |
| PE-04 | artifactHashes | Hub large-file sha256 from metadata for 10 large files; small files and all package archives hashed at download and recorded before use | PROPOSED_NOT_GRANTED |
| PE-05 | downloadOriginAllowList | huggingface.co plus its large-file CDN hosts (unobserved), pypi.org plus PyPI file host (unobserved), registry.npmjs.org, browser download host (unobserved), FFmpeg host UNKNOWN; each host must be observed and named before admission | UNKNOWN_BLOCKS_ADMISSION |
| PE-06 | downloadByteLimit | known model, codec and config 565974704 B plus optional denoiser 42661414 B; packages, browser, FFmpeg, fonts UNKNOWN; limit not derivable today | UNKNOWN_BLOCKS_ADMISSION |
| PE-07 | diskLimit | placeholder ceiling of 8 GiB on the D drive (24.2 GiB free at probe) with stop at 80 percent; not derived from a resolver report; worst-case duplicated model cache alone is 1.13 GiB | PROPOSED_NOT_GRANTED |
| PE-08 | ramLimit | Proposed preparation RAM ceiling and reservation still UNKNOWN; source-based bounds may support bounded preparation. Actual inference peak RAM is a future probe measurement, not a prerequisite for measuring it | UNKNOWN_BLOCKS_ADMISSION |
| PE-09 | perStageTimeout | proposal for operator tuning: 900 s per file download, 3600 s total preparation; no measurement basis | PROPOSED_NOT_GRANTED |
| PE-10 | retryCancelCleanup | one retry per file on the same URL and pin; cancel ends the process tree and deletes partial files; cleanup inventory of cache, temp and home-directory writes | PROPOSED_NOT_GRANTED |
| PE-11 | credentialAndEgressPolicy | no tokens, no accounts, no .env in the working directory, environment allowlist; set HYPERFRAMES_NO_TELEMETRY, DO_NOT_TRACK, HYPERFRAMES_NO_UPDATE_CHECK, HYPERFRAMES_NO_AUTO_INSTALL, HYPERFRAMES_SKIP_SKILLS (source verified); Hub client offline and telemetry variables are library behaviour not verified here | PROPOSED_NOT_GRANTED |
| PE-12 | rightsAndConsentEvidence | exact artifact-applicable license/attribution and fixed-preset consent evidence refs required. Record publisher declaration versus verified scope separately. Operator risk acceptance cannot create permission, prove consent or waive an unresolved CF-63 obligation | UNKNOWN_BLOCKS_ADMISSION |
| PE-13 | moneyLimit | UNKNOWN; public downloads show no price in observed metadata, bandwidth and any tool cost not measured; never read as zero | UNKNOWN_BLOCKS_ADMISSION |
| PE-14 | resolverDryRunPrecondition | a metadata/lockfile-only inventory and conservative footprint bound first, including FFmpeg build options; no package-manager execution. Any pip/uv/npm resolver, dry-run, metadata hook, archive acquisition or cache write needs a separate explicit envelope | PROPOSED_NOT_GRANTED |

## Proposed Proof Envelope (XE)

Proposed, not granted. It binds the accepted CF, TOL, FR and G contract to one S05 attempt; the 24 planned cases stay NOT_EXECUTED_PLANNED.

| ID | Field | Proposal or basis | Status |
|---|---|---|---|
| XE-01 | sceneInputIdentity | S05 narration, on-screen and status-card hashes from the accepted design, job design raw hash 3ce5e236 unchanged | PROPOSED_NOT_GRANTED |
| XE-02 | voiceConfiguration | v3turbo mode, backend onnx, precision fp32, device cpu, local backbone directory and onnx_dir at pinned revisions, explicit threads and generation settings, auto device refused | PROPOSED_NOT_GRANTED |
| XE-03 | presetSelection | one fixed preset chosen by the operator and bound by entry hash; source default at pin is Hai Dang, card default is Minh Quan; not selected here | UNKNOWN_BLOCKS_ADMISSION |
| XE-04 | codecRoutingControl | unresolved (C1R-G04): option O1 offline mode with seeded cache must be shown by observed hosts, otherwise O2, O3 need separate admission | UNKNOWN_BLOCKS_ADMISSION |
| XE-05 | executionEgress | none intended; observed hosts per stage recorded (CF-70); no OS isolation claim | PROPOSED_NOT_GRANTED |
| XE-06 | renderConfiguration | explicit browser path, explicit FFmpeg path with version and hash, local hashed Vietnamese fonts, no remote URL in composition, 1920x1080 and 30 fps per CF-47 | PROPOSED_NOT_GRANTED |
| XE-07 | perStageTimeout | voice and render ceilings to be set by the operator after a resolver report; no measured basis | UNKNOWN_BLOCKS_ADMISSION |
| XE-08 | ramAndDiskLimits | proposed hard RAM/disk stop ceilings still UNKNOWN; conservative bounds precede a bounded probe, measured peaks are probe outputs. Explicit temp directory, frame format/count, caches and headroom needed; no forced default C-drive temp | UNKNOWN_BLOCKS_ADMISSION |
| XE-09 | retryCancelCleanup | FR-01 to FR-10 of the accepted design apply unchanged | PROPOSED_NOT_GRANTED |
| XE-10 | fallbackPolicy | empty: stop on failure; any hosted, self-hosted or alternative lane needs a new selection | PROPOSED_NOT_GRANTED |
| XE-11 | joinedAcceptance | CF-63 with padded MP4 timing per TOL-06, Vietnamese listener nominated by the operator, explicit retiming approval if voice exceeds 19.5 s | UNKNOWN_BLOCKS_ADMISSION |
| XE-12 | moneyAndCostLimit | UNKNOWN; session and execution cost unmeasured | UNKNOWN_BLOCKS_ADMISSION |

## Alternatives Kept Visible

No lane is excluded and none is defaulted; costs, data destinations, retention and rights for the hosted and self-hosted lanes are UNKNOWN. A silent fallback is forbidden (RC-09).

| ID | Lane | Status | Reason | Reconsider when |
|---|---|---|---|---|
| A2 | HyperFrames render with HeyGen hosted voice | VISIBLE_NOT_SELECTED | Vietnamese voice availability, account, retention and price unknown (D104 observed a wallet top-up page; not re-observed) | operator supplies account, egress and budget envelope |
| A3 | HeyGen hosted render and voice | VISIBLE_NOT_SELECTED | upload of composition and text, terms and price unknown | operator selects hosted render with upload consent |
| C2 | self-hosted voice endpoint plus local HyperFrames | VISIBLE_NOT_SELECTED | no operator-designated host exists; endpoint operations not justified for one scene | local capacity fails or operator names a host |
| C3 | hosted voice API plus local HyperFrames | VISIBLE_NOT_SELECTED | vendor terms, retention and Vietnamese quality unknown | operator selects with key, budget and retention consent |
| C4 | local voice plus hosted render | VISIBLE_NOT_SELECTED | larger effect surface than C1 for a 20 s scene | local render proves insufficient and operator selects |
| C1-int8 | C1 with int8 backbone instead of fp32 | VISIBLE_NOT_ASSUMED | card says faster and smaller but needs VNNI-class CPU support; quality unverified here; fp32 kept as the assessed target | fp32 throughput or memory proves inadequate in a measured proof |
| N0 | silent HyperFrames render only | VISIBLE_REDUCED_SCOPE | not narrated acceptance | operator accepts reduced scope |
| N1 | no change, text design only | VISIBLE_DEFAULT_WHEN_NOTHING_ADMITTED | no media | always valid |

## Gap Register

| Gap | Title | Severity | Status | Joins (D103 and D101 IDs) | Cases |
|---|---|---|---|---|---|
| C1R-G01 | HyperFrames head drift and absent current object | HIGH | OPEN_FINDING_FOR_LOCAL | G-18, R18 | RC-01 |
| C1R-G02 | Package to source correspondence is partial | MEDIUM | PARTIAL | G-18, R18, V02 | RC-12, RC-02 |
| C1R-G03 | V03 unpinned retrieval sites | HIGH | ROUTING_PARTIAL | G-05, G-06, G-07, V03 | RC-06, RC-08 |
| C1R-G04 | V04 codec_dir not forwarded by the public constructor | BLOCKER | CONFIG_ONLY_ZERO_EGRESS_UNSUPPORTED | G-05, V04 | RC-06, RC-08 |
| C1R-G05 | Rights are publisher declarations only | HIGH | DECLARATION_ONLY | G-16, R10 | RC-03 |
| C1R-G06 | Preset consent and identity are unverified | HIGH | CONSENT_UNVERIFIED | G-17, V02 | RC-11, TC-09 |
| C1R-G07 | Python dependency footprint and licences unknown | MEDIUM | UNKNOWN | G-15, R19 | RC-04 |
| C1R-G08 | Browser download size and terms unobserved | MEDIUM | UNKNOWN | G-08, G-15 | RC-04, RC-05 |
| C1R-G09 | FFmpeg unresolved on PATH and build unknown | HIGH | ABSENT_ON_PATH | G-16, R10 | RC-07 |
| C1R-G10 | Vietnamese font coverage may trigger render-time font egress | MEDIUM | UNPROVEN | G-09, R04 | RC-10 |
| C1R-G11 | HyperFrames implicit effects and their opt-outs | MEDIUM | SOURCE_CONTROLS_FOUND_NOT_RUN | G-01, G-02, G-03, G-04, G-12, G-13 | TC-11 |
| C1R-G12 | Resource fit is a snapshot, not a measurement | MEDIUM | UNKNOWN | G-15, R19 | RC-04, TC-16 |
| C1R-G13 | Execution cost and alternatives remain unpriced | MEDIUM | UNKNOWN | G-14, G-15 | RC-09, TC-12 |
| C1R-G14 | Audio mux path in the renderer was not read | MEDIUM | DEFERRED_TO_PROOF | TOL-06, CF-54 | TC-18 |
| C1R-G15 | Read envelope cannot observe CDN, browser and FFmpeg hosts | LOW | LIMITATION | G-14 | RC-05 |

- C1R-G01: Public main is now 1168bb74; D104 selected 5c52f723; npm 0.8.113 gitHead is aca4bc2f. The current head object is not in the local mirror and was not fetched. VieNeu main is unchanged at 85344322.
- C1R-G02: npm gitHead aca4bc2f is a release commit that is an ancestor of the selected pin (7 commits behind) and 7 control-path files are identical, but no tarball content was compared. PyPI vieneu 3.8.3 was not compared to the Git pin and the model card still documents 3.7.1.
- C1R-G03: Five retrieval sites use the default Hub revision: root config.json, graphs and tokenizer, codec files, denoiser and an optional voices_v3_turbo.json override. With a local backbone directory and onnx_dir, four can resolve locally by configuration; the codec cannot (G04).
- C1R-G04: The engine accepts codec_dir but the v3 Turbo wrapper passes only checkpoint, onnx_repo, onnx_dir, onnx_subfolder and threads. Configuration alone cannot route codec reads to a pinned local directory. Options O1 offline mode with a seeded Hub cache (unverified), O2 direct private engine use (adapter), O3 patch or fork (not admitted), O4 accept unpinned execution egress (rejected as identity loss).
- C1R-G05: Model and codec repositories list no LICENSE or NOTICE file at the pinned revisions; Apache-2.0 appears in card front matter. Training data pipeline is not public. No independent clearance exists for weights, codec, dependencies, browser, FFmpeg or fonts.
- C1R-G06: Preset entries carry no consent or provenance field. The card documents 23 voices with default Minh Quan at SDK 3.7.1; the pin ships 25 voices with default Hai Dang and an alias. Bundled sample clips ship in the package data but are not part of the fixed-preset path.
- C1R-G07: Core metadata requires gradio and librosa; versions float; sea-g2p latest is 0.10.0 above the 0.9.1 floor. No resolver run, so peak storage is not computable.
- C1R-G08: Source pins chrome-headless-shell 152.0.7977.30 as download of last resort; resolution can select an unpinned system Chrome first. The download host is outside the read allowlist, so size is unobserved.
- C1R-G09: Get-Command ffmpeg and ffprobe resolve nothing on the current PATH; this is not a whole-machine absence claim. Render needs a libx264 capable build; its licence terms depend on the chosen build.
- C1R-G10: The resolver embeds Latin subsets for bundled families and fetches other subsets or families from Google Fonts; declared local font faces are recognised, but whether that avoids all fetches for Vietnamese text was not proven.
- C1R-G11: Source shows .env loading from the working directory, default telemetry with HYPERFRAMES_NO_TELEMETRY or DO_NOT_TRACK opt-out, update check and detached installer with HYPERFRAMES_NO_UPDATE_CHECK and HYPERFRAMES_NO_AUTO_INSTALL opt-outs, skills update check with HYPERFRAMES_SKIP_SKILLS, and user-home cache and config writes. Controls were read, not exercised.
- C1R-G12: Free RAM was 2.51 GiB of 15.69 GiB at probe time; D drive free 24.2 GiB, C drive 16.82 GiB. Peak RAM, elapsed time and CPU throughput are unmeasured; published benchmarks are GPU desktop figures and are not transferred to this hybrid laptop CPU.
- C1R-G13: Session cost, bandwidth cost, runtime cost and any hosted alternative price are UNKNOWN; none is zero.
- C1R-G14: How the renderer muxes the WAV into MP4, padding behaviour and A/V duration agreement were not read; they remain joined-acceptance obligations.
- C1R-G15: Redirects were not followed and only allowlisted hosts were read, so Hub large-file CDN hosts, the browser download host, the PyPI file host and any FFmpeg host are expected but unobserved.

## Readiness-Specific Planned Cases

All cases are NOT_EXECUTED_PLANNED; they add to, and do not replace, TC-01 to TC-24. Joins to gaps are in the evidence.

| Case | Class | Summary | Gaps | Expected evidence |
|---|---|---|---|---|
| RC-01 | ADVERSARIAL | Current pin drift: head differs from selected pin or object missing | C1R-G01 | pin check records BLOCKED_PIN_DRIFT until Local chooses to retain the immutable historical assessment pin or admits a fresh snapshot/delta; branch movement alone does not force an upgrade; no silent repin |
| RC-02 | ADVERSARIAL | Metadata unavailable: Hub, npm or PyPI read fails, redirects or changes shape | C1R-G02 | BLOCKED_SOURCE_READ with URL and status; no value is inferred or reused as current |
| RC-03 | ADVERSARIAL | Package or weight rights gap: no sufficient artifact-applicable license or required attribution evidence | C1R-G05 | record evidence level and exact artifact scope; missing a file named LICENSE or NOTICE alone is not proof of no grant; unresolved applicable rights/attribution or consent keeps CF-63 DEFERRED |
| RC-04 | ADVERSARIAL | Footprint known versus bounded versus unknown: justify conservative total bounds before preparation | C1R-G07, C1R-G08, C1R-G12 | known 0.527 GiB is not the budget; supported conservative upper bounds plus hard stop ceilings may admit bounded preparation. Unbounded critical footprint or disk shortfall blocks; unknown exact peak alone does not create a circular measurement prerequisite |
| RC-05 | ADVERSARIAL | Redirect, binary, auth or cap stop in a read or download step | C1R-G15, C1R-G08 | stop at cross-host redirect, non-text type, auth prompt or byte cap; partial files discarded |
| RC-06 | ADVERSARIAL | V03 and V04 control infeasibility: configuration-only local routing still reaches the Hub | C1R-G03, C1R-G04 | any attempted execution network request, including blocked/failed attempts, rejects the no-network-attempt claim; local cache reads require exact revision and loaded-hash evidence. Distinguish no successful egress from no network attempt |
| RC-07 | ADVERSARIAL | PATH absence is not whole-machine absence; configured binary path is recorded | C1R-G09 | FFmpeg identity comes from an explicit path with version and hash; no PATH-only claim in either direction |
| RC-08 | FALSE_DENIAL | Valid pre-staged local model, codec and preset sources must not be refused | C1R-G03, C1R-G04, C1R-G05 | valid pinned local directories/cache refs with matching loaded hashes AND sufficient artifact-applicable rights/consent evidence are accepted without attempted network. Cache naming or missing separate LICENSE filename alone must not cause refusal; hashes alone must not waive rights/consent |
| RC-09 | ADVERSARIAL | No unapproved hosted fallback after a local-stage failure | C1R-G13 | stop and request a new selection; zero hosted calls unless the envelope pre-lists the fallback |
| RC-10 | ADVERSARIAL | Vietnamese glyph coverage and font egress at render | C1R-G10 | local hashed fonts render all diacritics and observed hosts include no font origin; otherwise stop |
| RC-11 | ADVERSARIAL | Preset identity: alias or roster drift between card and pin | C1R-G06 | proof binds the preset entry hash actually loaded, not a display name; alias resolution is recorded |
| RC-12 | ADVERSARIAL | Package-to-source mismatch: tarball or wheel content differs from the pinned source | C1R-G02 | mismatch or unverifiable correspondence blocks use of the package as the pinned source |

## Proposed Next Moves For Local

Local decides; nothing below is authorised or automatic.

1. Local retains 5c52f723 as the historical assessment pin only. Before runtime use, refresh an immutable source snapshot, inspect bounded relevant delta and bind the actual package/release artifact; no automatic main tracking, no package correspondence inferred from gitHead. Source-only acquisition/delta needs its own named authority; no repin in this closure.
2. Local selects a next metadata/lockfile/source-only resolver/footprint assessment: dependency inventory, conservative total bounds, browser/FFmpeg/font options, mux paths and O1 cache/ref/offline semantics. No package-manager dry-run, archive/model/browser download, install, import or inference. Prepare a separate committed/hash-bound work order before worker execution; no released successor in this closure.
3. Local prioritizes O1 source/metadata cache analysis; no runtime probe yet. If exact pinned cache routing cannot be supported, document a bounded O3 forwarding fix/upstream alternative for separate admission, rather than reimplement wrapper behavior through O2. O4 unpinned retrieval is unsuitable for this identity envelope; hosted/self-hosted/complementary alternatives stay visible, not selected.
4. Operator checkpoint remains: exact fixed preset entry (source default Hai Dang is an option, not an auditioned recommendation), applicable rights/consent evidence and disclosed risk disposition, monetary/resource envelope, nominated Vietnamese listener and retiming authority. Local first derives resource bounds; placeholder 8 GiB and timeout proposals are not ratified. No effect depends on assumed answers.

## Limitations

Source coverage is PARTIAL: 24 selected-revision paths, mostly targeted ranges. Pins and metadata were observed on 2026-10-02 and 2026-10-03 UTC and expire. Library behaviour of the Hub client, link handling and the Chrome and FFmpeg origins is unobserved. Hardware values are a snapshot. No quality, speed, memory, offline, Windows or cost result exists. Session and runtime cost are UNKNOWN, not zero.

## Claim Boundary

Documentary readiness assessment only. No install, download, model load, inference, WAV, MP4, upstream execution, provider, paid, account, credential, upload, public or deploy effect occurred. Proposed envelopes are proposals. Publisher declarations are recorded, not cleared. C1 is neither selected as runtime nor defaulted. Q001, Q004, P11, send and B2 boundaries are unchanged. DEFERRED_PRIVATE_ONLY.

## Local Review Qualification

Local accepted this bounded documentary assessment after F-01..F-06 corrections in the completion review and Local evidence. The unchanged worker return, 25-check result and plan seal describe worker-time artifacts. The reviewer helper wrote corrections before persisting its in-memory raw archive, then failed the evidence line cap; original raw assessment/evidence snapshots were not retained. This limit is disclosed, not presented as byte preservation. Worker return is preserved and archived; historical seal/check fields remain distinct from current corrections. The missing pre-assessment static-case seal is a disclosed deviation, not retroactively repaired. Worker mirror HEAD 7129340ae remains unattributed; the named canonical mirror was observed at f16e5098 and clean. No source refresh, new dispatch, installation, proof or operator choice in this closure.
