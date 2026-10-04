# CVF NCR C1 Metadata Footprint And Cache Analysis - VieNeu CPU ONNX fp32 to HyperFrames Local

Memory class: POINTER_RECORD

Status: WORKER_ANALYSIS_PENDING_LOCAL_REVIEW

docType: reference

Date: 2026-10-03

Batch ID: CVF-NCR-C1-METADATA-FOOTPRINT

EPISTEMIC_PROCESS_NA_WITH_REASON: task-specific metadata, lockfile and source analysis; the input identities, sealed check plan, read ledger, gap, case and envelope joins and the embedded static helper live in `docs/reviews/evidence/cvf-ncr-c1-metadata-footprint-analysis-2026-10-03.json`.

## Purpose

Resolve the D106 documentary gaps for the D104-selected candidate C1 (VieNeu v3 Turbo explicit CPU ONNX fp32, one fixed preset, one WAV, local HyperFrames render, one S05 MP4): platform-specific dependency inventory, conservative per-phase footprint, O1 pinned-cache and offline semantics, and the browser, FFmpeg, font and mux controls. Public text, immutable source objects and lockfile text only. It selects no runtime, grants nothing, installs nothing and proves no behaviour.

## Verdict

METADATA_GAPS_RECORDED. The O1 route (offline Hub mode with a pre-staged cache) is supported by the library source read at the lock version, so the V04 direct codec_dir blocker no longer implies that pinned local codec routing is impossible; it is still unproven at runtime. The Python lock closure is exactly sized for transfer but not for installed size. Browser, FFmpeg, font, unpacked-size, rights and consent fields stay UNKNOWN or declaration-only. Never READY_TO_EXECUTE.

| Question | Answer | Basis |
|---|---|---|
| Can the Hub client resolve every VieNeu retrieval site from a staged cache without codec_dir? | Source says yes in offline mode: refs/main plus snapshots/<commit>/ files are returned after the blocked metadata call (O1) | file_download.py at tag commit 3790483f |
| Is that proven? | No: runtime, Windows path and attempted-network behaviour are UNPROVEN (DC-01..DC-03) | no import, no execution |
| What does the lock say to install on the target? | 82 wheels, 262,308,771 B (0.2443 GiB), 25 win_amd64-specific; a 35-package import-needed subset is 71,956,507 B | uv.lock revision 3 at the pin, markers evaluated |
| Does the published package match that lock? | Not shown: published requires_dist floats and the lock pins differ from D105 floating figures | PyPI metadata |
| Are rights cleared? | No: declarations only; new LGPL native binary and GPL FFmpeg build notes added | registry and ffmpeg.org text |

## Scope And Authority Boundary

| Item | Rule applied |
|---|---|
| Release | pair and seven input hashes matched, three outputs absent, bound pre-implementation gate PASS at clean HEAD `99ca8b2ca` before any edit |
| Seal | exact positive, adversarial and false-denial expectations (33 cases) persisted at 2026-10-03T03:45:09Z with canonical SHA-256 `c8b43717f5dd52374d123556d1ea565684ff932b1743dad3f114d5cf52a143c1` before any new source or network read |
| Reads | 33 counted requests, 2,509,832 decoded bytes, 43 source paths; allowlisted hosts only, no redirect followed, no retry; Git objects read from named existing mirrors without fetch |
| Not done | no pip, uv, npm or npx command, solver, dry-run or hook; no archive, model, browser, FFmpeg or font payload; no import, inference, WAV, MP4, account, credential, provider, paid, public or deploy effect |
| Source text | upstream instructions (install hints, README) are data, not authority; publisher declarations are not clearance |
| Envelopes | proposed fields only; every grant needs a separate committed admission by Local and the operator |

## Reused Contract And Preserved Brief

The accepted D103 contract and D105 corrected readiness (F-01..F-06) are consumed unchanged: S05 narration, status card and 20 s estimate stay as in the accepted brief; CF, TOL, FR, SEL and G identifiers keep their meaning; TC-01..TC-24 and RC-01..RC-12 are referenced, not rewritten or executed. D105 sizes and Hub sha256 values for the model, codec and preset are reused as historical, hash-bound inputs and were not re-read. The 25 worker and 19 Local checks were not recreated. This tranche cannot validate Vietnamese voice quality, Windows behaviour, offline execution or audio and video output.

## Source Identity And Drift

| Item | Commit or version | Kind | Disposition |
|---|---|---|---|
| vieneu-pin | `85344322b7258b4e25479b692e8e3396baf9db34` | IMMUTABLE_COMMIT | SELECTED_PIN / MATCH |
| hyperframes-pin | `5c52f72399e21f8dcf3ede2bf2d24978c6522a94` | IMMUTABLE_COMMIT | HISTORICAL_PIN |
| hyperframes-npm-githead | `aca4bc2f492c2b038d87c875cd7d53a80dfb4bb1` | IMMUTABLE_COMMIT | PACKAGE_DECLARED_RELEASE_COMMIT |
| hyperframes-prior-main | `1168bb740d336f366849c91308a3c2bbb850c570` | IMMUTABLE_COMMIT | HISTORICAL_OBSERVATION |
| hyperframes-observed-head | `835e0c16ec62681008682934c4751e630d9d5d7b` | MUTABLE_OBSERVATION | OBSERVED_NOT_PIN / LOCAL_UPSTREAM_ADVANCED |
| hub-tag-v1.13.0-commit | `3790483f3c04f4e36b9ff27ab324fb43c08c5059` | MUTABLE_OBSERVATION | TAG_OBSERVATION_BOUND_TO_LOCK_VERSION |
| hub-observed-head | `d711944ddf94abe9ef2a34f80d41007968ff9c30` | MUTABLE_OBSERVATION | OBSERVED_NOT_PIN |
| model-revision | `61b85e3d937fbbacb387714180e8182823512523` | IMMUTABLE_COMMIT | D104_PIN_REUSED_HISTORICAL |
| codec-revision | `ceff0d0749bfb3fa2d61149794ec6feef0d1e1ae` | IMMUTABLE_COMMIT | D104_PIN_REUSED_HISTORICAL |

HyperFrames: public main advanced again to 835e0c16 after D105's 1168bb74. The local canonical mirror holds the pin and the npm release commit but not either later head, so only five control files were read at the head commit through raw text. Four are byte-identical to the pin (browser manager, FFmpeg resolver, chunk encoder, audio mixer); `packages/cli/package.json` differs in the version line only (0.8.113 to 0.8.114). That is a PARTIAL delta, not a whole-delta claim, and it is not a repin. The npm 0.8.113 dependency map equals the pin's CLI manifest exactly (17 packages, compared in Python); that is manifest correspondence only, the tarball and its SLSA attestation were not downloaded or verified. VieNeu main is unchanged at the pin (MATCH).

Hub client: the lock version for the Windows CPython 3.11 target is huggingface-hub 1.13.0 (0.36.0 serves other marker groups). Its tag v1.13.0 points to commit 3790483f3c04f4e36b9ff27ab324fb43c08c5059, observed through the GitHub API; the tag name is mutable, the commit object is what the source reads were addressed by, and the PyPI wheel was not compared to it.

## Python Dependency Inventory

Target: win32 AMD64, CPython 3.11.9, CPU ONNX fp32, fixed preset, no extras, uv default groups empty. `uv.lock` (revision 3, 175 package entries) was parsed as TOML text with a small marker evaluator that treats PEP 440 wildcards correctly; no resolver ran.

| Variant | Description | Packages | Wheel bytes | Status |
|---|---|---|---|---|
| V1 | lock default install of the source tree | 82 | 262,308,771 | exact transfer size for the lock; unpacked UNKNOWN |
| V2 | import-needed minimum from the same lock | 35 | 71,956,507 | future option needing altered packaging or an explicit list; not admitted |
| V3 | pip install of published vieneu 3.8.3 (wheel 2,643,059 B) | UNKNOWN | UNKNOWN | requires_dist floats; resolution differs from the lock |

Classes kept separate:

| Class | Members | Evidence |
|---|---|---|
| Import-needed on the C1 path | numpy, onnxruntime, tokenizers, huggingface_hub, soundfile, soxr, sea_g2p | onnx_runtime_lite.py:34,81,138,603,623; phonemize_text.py:11; base.py:7 |
| Required by wheel metadata, not needed by the fixed-preset path | gradio, librosa, kaldi-native-fbank and 44 further V1-only packages (47 total, 190,352,264 B) | pyproject.toml; librosa import in try with fallback (base.py:23); kaldi import lazy in the cloning path (audio_utils.py:40) |
| Marker or extra gated | legacy, cuda, finetune, pdf, watermark extras; dev and gpu groups; torch family | absent from the default closure; device auto would try import torch (v3turbo.py:163), so explicit cpu is required |
| Platform wheel | 25 of 82 packages resolve to win_amd64-specific wheels; none lacks a wheel for the target | lock wheel tag filter |
| Floating (published) | sea-g2p>=0.9.1, onnxruntime>=1.20.0, tokenizers>=0.20, gradio>=5.49.1, librosa>=0.11.0, others unpinned | PyPI requires_dist for 3.8.3 |

Largest V1-only wheels: gradio 5.49.1 (63,523,840 B); scipy 1.16.2 (38,687,626 B); llvmlite 0.45.1 (38,132,232 B); ruff 0.14.2 (13,565,279 B); pandas 2.3.3 (11,348,702 B); scikit-learn 1.7.2 (8,894,244 B). The hub chain inside both variants is huggingface-hub 1.13.0 (660,643 B) plus hf-xet 1.4.3 (3,677,359 B) and eight small helpers. sea-g2p is pinned by the lock at 0.9.1 (27,531,798 B; PyPI JSON for that file matches size and sha256 prefix), unlike the 0.10.0 figure in D105.

Coverage: lockfile text fully parsed; import analysis read 15 VieNeu source files (plus pyproject.toml and uv.lock), so apps/ and unread modules are not claimed. No complete transitive inventory is claimed for the published-package environment (V3) or for npm.

## O1 Cache, Ref And Offline Semantics

Read at huggingface_hub commit 3790483f: constants.py, file_download.py, utils/_http.py and utils/_telemetry.py (four paths).

| ID | Source fact | Reference |
|---|---|---|
| H01 | default revision is main | constants.py:58; file_download.py:274 |
| H02 | commit-hash revision shortcut returns an existing snapshot pointer before any request; VieNeu passes no revision so it is unavailable | file_download.py:1055-1068 |
| H03 | offline flag is a module constant read from the environment at import, is_offline_mode returns it | constants.py:185,188 |
| H04 | request event hook raises OfflineModeIsEnabled before sending when offline | utils/_http.py:214-225 |
| H05 | OfflineModeIsEnabled is caught as the head error, then refs/<revision> file content is read as commit hash and snapshots/<commit>/<file> returned if present | file_download.py:1731,1103-1122 |
| H06 | refs and snapshot bytes are trusted; no hash is verified on this path | file_download.py:1103-1122 |
| H07 | symlink support is probed with os.symlink; failure degrades to move (new blob) or copy (existing blob) | file_download.py:80-140,595-686 |
| H08 | blob paths over 255 characters get the extended prefix only on the download branch | file_download.py:1195-1198 |
| H09 | telemetry sender is a no-op when offline or HF_HUB_DISABLE_TELEMETRY, DISABLE_TELEMETRY or DO_NOT_TRACK is set | utils/_telemetry.py:66; constants.py:219 |
| H10 | cache root from HF_HUB_CACHE or HF_HOME, defaults under the user profile; Xet transfer disabled by HF_HUB_DISABLE_XET | constants.py:151-168,312 |
| H11 | VieNeu hub sites call hf_hub_download without revision, cache_dir or local_files_only | onnx_runtime_lite.py:91,190,212; v3turbo.py:271; speaker/onnx_extractor.py:80 |
| H12 | wrapper still does not forward codec_dir; O1 does not need it | v3turbo.py:176-182; onnx_runtime_lite.py:100 |

Position: O1 is SOURCE_SUPPORTED_MECHANISM_RUNTIME_UNVERIFIED. With HF_HUB_OFFLINE set before the library is imported, a blocked metadata call falls back to refs/main and the snapshot pointer, so one staged tree (refs/main set to the pinned commit plus snapshots/<commit>/<files>, no blobs needed) can serve the model, codec and optional denoiser sites without codec_dir. Consequences kept explicit:

- The flag is read at import (H03), so a variable set later in the process has no effect; it belongs in the process environment before Python starts.
- The offline path trusts refs/main and file presence (H06); no hash is checked, so loaded-byte sha256 must be verified outside the library, and a wrong refs/main silently binds a different revision (case DC-02).
- The request hook raises before sending (H04): a code-level attempt exists, a socket-level one is not expected; neither is observed here, and an empty successful-host list proves nothing (RC-06, DC-01).
- Sites S1, S4 and S5 swallow exceptions (H11): an absent denoiser or voices override is silent, so absence of an error is not evidence of a complete load.
- Windows: without symlink support the library moves a new blob into the snapshot path or copies an existing blob (H07); a pre-built snapshot tree is 1x, a copy path can reach 2x (B07). Keep the cache root short: only the download branch applies the extended-length prefix (H08).
- Telemetry is a no-op offline or with the documented disable variables (H09); Xet transfer applies to online preparation only (H10).

O3 (a minimal codec_dir forwarding fix or an upstream alternative) is not needed on this source evidence and stays conditional on a failed O1 runtime proof; no fork, patch or probe is made here. O2 and O4 are unchanged. The direct-path blocker C1R-G04 is retained as a fact about the wrapper.

## npm, Browser, FFmpeg, Fonts And Mux

### npm

| Package | Version | Unpacked bytes | Files | Download ceiling | Note |
|---|---|---|---|---|---|
| hyperframes | 0.8.113 | 33,408,618 | 556 | 34,013,029 |  |
| sharp | 0.35.3 | 958,466 | 47 | 1,008,690 |  |
| @img/sharp-win32-x64 | 0.35.3 | 19,199,007 | 8 | 19,227,496 | Apache-2.0 AND LGPL-3.0-or-later; win32 x64 only |
| esbuild | 0.25.12 | 135,343 | 7 | 143,743 | postinstall: node install.js |
| @esbuild/win32-x64 | 0.25.12 | 10,617,862 | 3 | 10,632,644 |  |
| puppeteer-core | 25.11.0 | 5,972,104 | 927 | 6,929,363 |  |
| @puppeteer/browsers | 3.2.2 | 441,646 | 102 | 547,730 |  |
| prettier | 3.8.3 | 8,604,418 | 56 | 8,671,513 |  |
| fontkit | 2.0.4 | 5,610,637 | 131 | 5,751,615 |  |

Sum of unpacked sizes 84,948,101 B is a lower bound for the whole install; download ceilings use tar and gzip format overhead and sum to 86,925,823 B. Versions come from the monorepo bun.lock at the pin, so published caret resolution may differ. The other 9 direct dependencies and all transitive packages are UNKNOWN. Full puppeteer is a declared dependency of the producer and engine workspace packages but not of the published CLI manifest; whether the CLI build bundles or externalizes those packages was not verified (tsup configuration unread).

### Browser

The pinned build is chrome-headless-shell 152.0.7977.30 (manager.ts:50, identical at the observed head). Resolution is HYPERFRAMES_BROWSER_PATH, then PRODUCER_HEADLESS_SHELL_PATH, then cached builds under the user profile, then system Chrome, then a managed download. Chrome for Testing channel heads now are Stable 154.0.8037.92, Beta 156.0.8078.4, Dev 157.0.8081.0 and Canary 157.0.8083.0, so the pin is not a current head and its availability is unverified; the latest-patch listing exceeded the 2 MiB cap (DEV-04). Download prefix seen: storage.googleapis.com/chrome-for-testing-public (not allowlisted, not fetched). Size and terms UNKNOWN. Proposal: explicit browser path with version and hash, no managed download unless separately admitted.

### FFmpeg

Override symbols are HYPERFRAMES_FFMPEG_PATH and HYPERFRAMES_FFPROBE_PATH (ffBinaries.ts:11-12). Resolution: override, then on Windows a scan of the current working directory before PATH, then `.hyperframes/bin` under the working directory, then a bare name; the engine asserts a configured override exists. The CLI requires `ffmpeg -hide_banner -encoders` to list libx264 or VideoToolbox. ffmpeg.org's legal text names libx264 as a GPL library and says LGPL use needs a build without --enable-gpl, so a libx264 build carries GPL obligations. The publisher hint `winget install --id Gyan.FFmpeg -e` and the Windows sources listed on ffmpeg.org (including BtbN GitHub releases) are data. No build is selected; BtbN asset metadata was not read (DEV-08); size and hash UNKNOWN. Proposal: explicit paths with version, encoder list and sha256, and an empty working directory.

### Fonts

The read module authoredGoogleFonts.ts discovers only authored stylesheet links to fonts.googleapis.com and appends a text parameter; the system font locator scans the Windows font directories with a 5 MiB per-file limit. Be Vietnam Pro's CSS was served by fonts.googleapis.com (222 bytes, no subset segmentation for this client, binary hosts fonts.gstatic.com not fetched); Vietnamese coverage is not verified. Local hashed fonts with per-font rights remain the proposal; choices and rights are UNKNOWN. D105's resolver history was not re-read.

### Audio mux and padding (TOL-06, CF-54)

The mixer builds per-track atrim, volume, fade, adelay, apad, asetpts and a final atrim to the composition total duration and writes audio.m4a; muxVideoWithAudio then copies video, copies the AAC sidecar into the MP4 with +faststart (or re-encodes at 192k). An audio element source (the voice WAV) is first converted per track to pcm_s16le at 48 kHz (prepareAudioTrack, an intermediate file in the work directory), and the mix is encoded to AAC 192k with a total-duration limit. A separate producer audioPadTrim module pads or trims to frameCount/fps, documented for the distributed assemble path. So padding to the declared duration is source-native; A/V duration agreement for the voice case is not validated and remains the joined-acceptance obligation (DC-09).

## Resource Bounds By Phase

Numeric lower bound, supported upper bound, proposed stop cap and UNKNOWN are separate; a lower bound is never a total, existing runtimes are not zero, and typical compression is not a ceiling. Assumptions are in the evidence rows.

| ID | Phase | Component | Lower bound B | Supported upper B | Stop cap | Unknown |
|---|---|---|---|---|---|---|
| B01 | download | Python lock default install V1 | 262,308,771 | 262,308,771 | PROPOSED_FORMULA_ED-02 | published floating resolution and any sdist build |
| B02 | download | Python import-needed minimum V2 (future option) | 71,956,507 | 71,956,507 | PROPOSED_FORMULA_ED-02 | needs altered packaging or explicit dependency list, not admitted |
| B03 | download | model graphs plus codec plus root config | 565,974,704 | 608,636,118 | PROPOSED_FORMULA_ED-02 | none for the staged set |
| B04 | download | npm 9 sized packages | UNKNOWN | UNKNOWN | PROPOSED_FORMULA_ED-02 | Actual upper UNKNOWN; worker scenario retained in original archive |
| B05 | download | Chrome, FFmpeg, fonts | UNKNOWN | UNKNOWN | OPERATOR_AFTER_ASSET_METADATA | size metadata not read or not available |
| B06 | disk | Python installed | UNKNOWN | UNKNOWN | ED-03 enforced watch | unpacked size absent from lock |
| B07 | disk | hub cache staged layout | 565,974,704 | UNKNOWN | ED-03 | Actual upper UNKNOWN; worker scenario retained in original archive |
| B08 | disk | npm 9 sized packages unpacked | 84,948,101 | UNKNOWN | ED-03 | other packages and npm cache copy |
| B09 | disk | frames if not streamed (600 frames, 1920x1080) | 0 | UNKNOWN | ED-03 | Actual upper UNKNOWN; worker scenario retained in original archive |
| B10 | disk | WAV and mixed m4a | UNKNOWN | UNKNOWN | duration cap proposed by Local | Actual upper UNKNOWN; worker scenario retained in original archive |
| B11 | disk | MP4 output | UNKNOWN | UNKNOWN | ED-03 | crf mode, no maxrate or level argument read |
| B12 | ram | preparation and inference and render peaks | UNKNOWN | UNKNOWN | separately admitted bounded probe | no measurement |
| B13 | existing | Node and Python runtimes already present | UNKNOWN | UNKNOWN | not applicable | installed footprint of existing runtimes |

Frame ceilings assume 1920x1080, device scale 1, 8-bit RGBA and 600 frames: PNG worker scenario 4,982,880,000 B (4.6407 GiB), not a certified encoded-file ceiling; the JPEG format-theoretical ceiling 12,597,120,000 B is loose and not a planning value; streaming default does not prove zero temporary frame storage. WAV PCM payload scenario 23,040,000 B excluding headers, mixed m4a and intermediates at a 60 s duration stop. Free RAM and disk snapshots are historical (D105), not reservations; no RAM, throughput or cost number is invented.

## Component Inventory

| ID | Component | Pin or version | Known bytes | Size status | Rights status |
|---|---|---|---|---|---|
| MF-K01 | VieNeu SDK code | git 85344322 (pyproject 3.8.3) | 2,643,059 | PYPI_WHEEL_BYTES_NOT_PIN_CONTENT | DECLARED_CODE_LICENSE_PROVENANCE_UNKNOWN |
| MF-K02 | VieNeu v3 Turbo ONNX fp32 graphs, tokenizer, config | model rev 61b85e3d | 475,400,990 | D105_HISTORICAL_METADATA | DECLARATION_ONLY |
| MF-K03 | MOSS audio tokenizer Nano ONNX codec | codec rev ceff0d07 | 90,572,161 | D105_HISTORICAL_METADATA | DECLARATION_ONLY |
| MF-K04 | optional denoiser.onnx (eager attempt) | model rev 61b85e3d | 42,661,414 | D105_HISTORICAL_METADATA | OPTIONAL_DECLARATION_ONLY |
| MF-K05 | fixed preset entry (bundled voices_v3_turbo.json) | git 85344322 | 180,332 | D105_HISTORICAL_METADATA | CONSENT_UNVERIFIED |
| MF-K06 | Python dependency closure, lock default install (variant V1) | uv.lock revision 3, 82 packages, win_amd64 cp311 | 262,308,771 | WHEEL_BYTES_EXACT_FROM_LOCK_UNPACKED_UNKNOWN | LICENCE_UNKNOWN_PER_PACKAGE |
| MF-K07 | Python import-needed minimum (variant V2, future option) | 35 packages from the same lock | 71,956,507 | WHEEL_BYTES_EXACT_FROM_LOCK_UNPACKED_UNKNOWN | LICENCE_UNKNOWN_PER_PACKAGE |
| MF-K08 | huggingface_hub client plus hf-xet | 1.13.0 (tag commit 3790483f) and hf-xet 1.4.3 | 4,338,002 | WHEEL_BYTES_EXACT_FROM_LOCK | LICENCE_UNKNOWN |
| MF-K09 | npm package hyperframes CLI | 0.8.113 gitHead aca4bc2f | 33,408,618 | UNPACKED_EXACT_FROM_REGISTRY | DECLARED_CODE_LICENSE_TARBALL_NOT_COMPARED |
| MF-K10 | npm direct heavy dependencies (8 packages sized) | sharp 0.35.3, @img/sharp-win32-x64 0.35.3, esbuild 0.25.12, @esbuild/win32-x64 0.25.12, puppeteer-core 25.11.0, @puppeteer/browsers 3.2.2, prettier 3.8.3, fontkit 2.0.4 | 51,539,483 | UNPACKED_EXACT_FOR_THESE_ONLY_REST_UNKNOWN | LGPL_BINARY_NOTICE_OBLIGATION_UNRESOLVED |
| MF-K11 | npm remaining direct and all transitive dependencies | ranges only | UNKNOWN | UNKNOWN | UNKNOWN |
| MF-K12 | chrome-headless-shell | pin 152.0.7977.30 in source | UNKNOWN | UNKNOWN | UNKNOWN |
| MF-K13 | FFmpeg build with libx264 (no build selected) | none | UNKNOWN | UNKNOWN | GPL_BUILD_OBLIGATIONS_UNRESOLVED |
| MF-K14 | Vietnamese on-screen fonts | none selected | UNKNOWN | UNKNOWN | RIGHTS_UNKNOWN |
| MF-K15 | Node.js and Python runtimes | v22.17.0 and 3.11.9 observed in D105 (historical) | UNKNOWN | EXISTING_REUSE_FOOTPRINT_NOT_ZERO_UNKNOWN | NOT_ASSESSED |

## Proposed Envelope Deltas

Proposed, not granted; D105 PE and XE fields keep their IDs. Placeholder 8 GiB and the 900 s and 3600 s timeouts are not ratified. Risk acceptance cannot create permission, prove consent or waive CF-63.

| ID | Field | Proposal | Status |
|---|---|---|---|
| ED-01 | PE-03 componentPins | pin Python by uv.lock revision 3 at git 85344322 with wheel sha256 per row; npm hyperframes 0.8.113 plus integrity sha512-FjkVaG++...; hub 1.13.0; Chrome 152.0.7977.30 source constant; HyperFrames head 835e0c16 recorded as drift only | PROPOSED_NOT_GRANTED |
| ED-02 | PE-06 downloadByteLimit | supported download bounds: Python V1 262308771 B or V2 71956507 B (lock-only), model plus codec 565974704 B (+42661414 B denoiser), npm known 9 packages worker estimate 86925823 B, actual archive upper UNKNOWN; browser, FFmpeg, fonts and other npm UNKNOWN; cap formula = 1.1 x supported known + operator allowance for UNKNOWN classes | UNKNOWN_BLOCKS_ADMISSION |
| ED-03 | PE-07 diskLimit, XE-08 | separate numeric lower bound, supported upper bound, stop cap and UNKNOWN per phase (see bounds); 8 GiB placeholder not ratified; directory-size watch proposed with partial cleanup; overshoot and enforcement unproven | UNKNOWN_BLOCKS_ADMISSION |
| ED-04 | XE-04 codecRoutingControl | O1: set HF_HUB_OFFLINE=1, HF_HOME and HF_HUB_CACHE in the process environment before Python starts; stage refs/main = pinned commit and snapshots/<commit>/ files for model and codec repos; verify loaded bytes by sha256; observe attempted network separately | PROPOSED_NOT_GRANTED |
| ED-05 | PE-05 downloadOriginAllowList | candidate hosts to name and observe before admission: huggingface.co and Xet CAS hosts (unobserved), files.pythonhosted.org (seen in metadata), registry.npmjs.org, storage.googleapis.com chrome-for-testing-public (seen as channel download prefix), FFmpeg build host (unselected), fonts.gstatic.com (seen in CSS) | UNKNOWN_BLOCKS_ADMISSION |
| ED-06 | PE-14 resolverDryRunPrecondition | npm lifecycle posture: esbuild declares postinstall node install.js; any future install needs a separate envelope deciding script execution (ignore-scripts versus allowed) and Python build-hook posture (no sdist in V1 or V2 closure) | PROPOSED_NOT_GRANTED |
| ED-07 | XE-06 renderConfiguration | explicit HYPERFRAMES_FFMPEG_PATH and HYPERFRAMES_FFPROBE_PATH with version, encoder list and sha256; empty working directory because Windows scans cwd before PATH | PROPOSED_NOT_GRANTED |
| ED-08 | XE-06 renderConfiguration | explicit HYPERFRAMES_BROWSER_PATH with version and sha256; managed download only if separately admitted; do not reuse a mutable system Chrome | PROPOSED_NOT_GRANTED |
| ED-09 | XE-08, TOL-06 | explicit HYPERFRAMES_EXTRACT_CACHE_DIR and workDir on the target drive; record streaming-encode state; mux acceptance joins CF-54 padded timing; proposed duration stop cap for the WAV | PROPOSED_NOT_GRANTED |
| ED-10 | PE-12 rightsAndConsentEvidence | per-artifact rights rows including LGPL native binary notice, GPL FFmpeg build obligations, font licences and fixed-preset consent; risk acceptance cannot create permission or waive CF-63 | UNKNOWN_BLOCKS_ADMISSION |
| ED-11 | XE-05 executionEgress | attempted-network observation plan: log attempted and successful requests separately; swallowed-exception sites need loaded-file hash proof; no OS isolation claim | PROPOSED_NOT_GRANTED |
| ED-12 | PE-01, PE-13, XE-03, XE-07, XE-11, XE-12 | operator-owned and unchanged: selector identity, preset, money, timeouts, listener, retiming, risk disposition; old 8 GiB and timeout placeholders not ratified | UNKNOWN_BLOCKS_ADMISSION |

## Alternatives Kept Visible

No lane is selected or defaulted and no fallback is chosen (RC-09). O1 is the first candidate for a future bounded proof; O2, O3 (conditional) and O4 as above. Hosted voice or render (A2, A3, C3, C4), a self-hosted voice endpoint (C2), the int8 backbone (C1-int8), reduced silent render (N0) and no change (N1) stay visible with D105's reconsideration triggers. The V2 minimal-source environment and any altered packaging are future options, not admitted.

## Gap Register

| Gap | Title | Severity | Status | Cases | Deltas |
|---|---|---|---|---|---|
| MF-G01 | Python dependency inventory: lock closure versus published floating resolution | MEDIUM | PARTIAL_BOUNDED | DC-04 | ED-01, ED-02 |
| MF-G02 | Installed (unpacked) size and duplicate caches not derivable from lock or registry metadata | MEDIUM | UNKNOWN_CAP_REQUIRED | DC-05 | ED-03 |
| MF-G03 | O1 pinned cache semantics: source supports offline refs/main plus snapshot routing for all hub_download sites | HIGH | SOURCE_SUPPORTED_RUNTIME_UNPROVEN | DC-01, DC-02, DC-03, RC-06, RC-08 | ED-04, ED-11 |
| MF-G04 | Offline flag read at import; attempt versus success; swallowed exceptions hide missing cache entries | HIGH | SOURCE_FACT_RUNTIME_UNPROVEN | DC-01, RC-06 | ED-04, ED-11 |
| MF-G05 | npm footprint partial, esbuild postinstall hook, LGPL native binary | MEDIUM | PARTIAL_BOUNDED | DC-06 | ED-02, ED-06, ED-10 |
| MF-G06 | Browser pin availability, size, host and terms | MEDIUM | UNKNOWN | DC-08, RC-05 | ED-05, ED-08 |
| MF-G07 | FFmpeg override symbols located; build, size and GPL obligations open; Windows cwd-first scan | HIGH | CONTROLS_FOUND_BUILD_UNSELECTED | DC-07, RC-07 | ED-05, ED-07, ED-10 |
| MF-G08 | Vietnamese font coverage and rights; authored Google stylesheet path | MEDIUM | UNPROVEN | DC-09, RC-10 | ED-05, ED-10 |
| MF-G09 | Audio mux and padding path mapped; timing acceptance unverified | MEDIUM | SOURCE_MAPPED_NOT_VALIDATED | DC-09 | ED-09 |
| MF-G10 | Frame, temp, output and log bounds; streaming default may flip on Windows | MEDIUM | PARTIAL_BOUNDED | DC-05, DC-10 | ED-03, ED-09 |
| MF-G11 | HyperFrames head advanced; partial delta only | HIGH | LOCAL_UPSTREAM_ADVANCED_PARTIAL_DELTA | DC-11, RC-01 | ED-01 |
| MF-G12 | Rights: declaration-only model/codec/preset plus new binary-licence notes | HIGH | DECLARATION_ONLY | DC-12, RC-03, RC-11 | ED-10 |
| MF-G13 | Published artifacts (wheel, tarball, hub wheel) not compared to source or lock | MEDIUM | NOT_COMPARED | DC-04, DC-11, RC-12 | ED-01 |
| MF-G14 | Read-envelope limits: unobserved download hosts and a capped metadata read | LOW | LIMITATION | DC-05, RC-05 | ED-05 |

- MF-G01: V1 82 packages and V2 35 packages are worker-selected candidate rows from the lock; exact target closure unverified; pip resolution of the published wheel floats (sea-g2p lock 0.9.1 versus D105 latest 0.10.0).
- MF-G02: wheel and tarball bytes are transfer sizes; unpacked Python size UNKNOWN, npm unpacked known for 9 packages only.
- MF-G03: direct codec_dir blocker retained; O3 forwarding fix remains an option if strict zero-attempt policy is required; O1 only supports source cache feasibility.
- MF-G04: env must precede import; request hook raises before send so a code-level attempt is not a socket-level observation.
- MF-G05: 17 declared direct dependencies match the source manifest; 9 packages sized; transitive set unknown.
- MF-G06: 152.0.7977.30 is not a current channel head; latest-patch metadata exceeded the 2 MiB read cap.
- MF-G07: HYPERFRAMES_FFMPEG_PATH and HYPERFRAMES_FFPROBE_PATH; libx264 builds are GPL.
- MF-G08: only authored stylesheet links to fonts.googleapis.com are discovered by the read module; resolver history from D105 not re-read.
- MF-G09: mixer pads and trims to composition duration into audio.m4a; mux copies the AAC sidecar; distributed assemble pad/trim is a separate module.
- MF-G10: format figures are conditional worker scenarios, not certified encoded-file ceilings; MP4 size has no read-supported ceiling.
- MF-G11: 4 of 5 compared files byte-identical, cli manifest differs in the version line only; no repin, no whole-delta claim.
- MF-G12: carries C1R-G05 and C1R-G06 unchanged; adds LGPL sharp binary and GPL FFmpeg build notes; hashes do not waive rights.
- MF-G13: registry gitHead and equal manifests are not package proof.
- MF-G14: files.pythonhosted.org and fonts.gstatic.com appear in metadata; storage.googleapis.com, Xet hosts and an FFmpeg build host are not observed or not allowlisted.

## Metadata-Specific Planned Cases

All cases are NOT_EXECUTED_PLANNED and add to TC-01..TC-24 and RC-01..RC-12.

| Case | Class | Summary | Gaps | Expected evidence |
|---|---|---|---|---|
| DC-01 | ADVERSARIAL | offline staged cache run: any attempted request, including pre-send blocked ones, is recorded apart from successful hosts | MF-G03, MF-G04 | attempt log and success log separate; empty success list alone never proves no attempt |
| DC-02 | ADVERSARIAL | refs/main content differs from the pinned commit or snapshot file missing | MF-G03 | BLOCKED_CACHE_REF_DRIFT before any load |
| DC-03 | FALSE_DENIAL | Valid staged snapshot accepted only under a separately chosen policy permitting logged pre-send blocked attempts | MF-G03, MF-G12 | Strict zero-attempt policy remains unproven; hashes do not waive rights or envelope choice |
| DC-04 | ADVERSARIAL | installed set differs from the lock closure (published floating resolution) | MF-G01, MF-G13 | different environment recorded, not equated to V1 or V2 |
| DC-05 | ADVERSARIAL | download or directory size crosses the stop cap mid-preparation | MF-G02, MF-G10, MF-G14 | stop, partial files discarded, cleanup inventory |
| DC-06 | ADVERSARIAL | npm lifecycle script present versus ignore-scripts posture | MF-G05 | executed scripts enumerated; unexpected hook blocks |
| DC-07 | ADVERSARIAL | FFmpeg resolution through cwd or PATH instead of explicit override; libx264 absent; build licence class unknown | MF-G07 | explicit path, version, encoder list and hash recorded; otherwise stop |
| DC-08 | ADVERSARIAL | browser resolves to a system or unpinned build or triggers a managed download | MF-G06 | explicit path and version recorded; otherwise stop |
| DC-09 | ADVERSARIAL | Joined audio timing and Vietnamese font check | MF-G08, MF-G09 | D103 TOL-06 <=0.1 s and TOL-07, CF-63 human review; attempted font requests and successful hosts separate |
| DC-10 | ADVERSARIAL | frames land on the OS temp drive or streaming flips off on Windows | MF-G10 | workDir, format, frame count and bytes recorded against the stop cap |
| DC-11 | ADVERSARIAL | head refresh: pin versus later head for ffmpeg, browser and mux files, and bound release artifact | MF-G11, MF-G13 | BLOCKED_PIN_DRIFT until Local disposes; no silent repin |
| DC-12 | FALSE_DENIAL | declaration-only rights record is kept as DECLARATION_ONLY and is not refused as NO_GRANT | MF-G12 | exact artifact scope recorded; missing LICENSE filename alone is not a no-grant verdict |

## Proposed Next Moves For Local

Local decides; nothing below is authorised or automatic.

1. Keep 5c52f723 as the historical pin; if the 835e0c16 head matters, admit a named source-object acquisition and bounded delta (the head object is absent locally) and bind the actual npm release artifact; no automatic main tracking.
2. Decide whether a bounded O1 proof envelope is worth opening (DC-01..DC-03) before any preparation, or whether O3 should be pursued upstream; no runtime probe is implied.
3. Name any admission needed for the unread metadata classes: FFmpeg build assets (for example BtbN), browser archive size, per-package licences, npm transitive set, and Hub or Xet CDN hosts.
4. Operator checkpoint unchanged: exact fixed preset entry, applicable rights and consent evidence with risk disposition, money and resource caps, nominated Vietnamese listener, retiming authority. Resource bounds above are inputs for those caps, not caps.

## Limitations

Source coverage is PARTIAL (named files at pins and one head comparison). Pins and heads expire. Package archives, tarballs and wheels were not downloaded or compared; wheel and tarball bytes are transfer sizes. Hub client behaviour is a source reading, not an execution. Hardware and RAM figures are D105 history. No quality, speed, memory, offline, Windows, cost or rights result exists. Session and execution cost are UNKNOWN, not zero.

## Claim Boundary

Documentary metadata, lockfile and source analysis only, qualified PASS_STATIC_ONLY. No install, download, import, model load, inference, WAV, MP4, upstream execution, provider, paid, account, credential, upload, public or deploy effect occurred. Proposed envelopes and cases are proposals. Publisher declarations are recorded, not cleared. C1 is neither selected as runtime nor defaulted; Q001, Q004, P11, send and B2 boundaries are unchanged. DEFERRED_PRIVATE_ONLY.


## Local Review Qualification

ACCEPTED_METADATA_ANALYSIS_WITH_QUALIFICATIONS at PASS_STATIC_ONLY. F-01..F-05 in the completion review and Local evidence control current interpretations. All three original raw files were persisted before repair; worker return and original plan/check evidence remain historical.

The 82/35 package lists and 262,308,771/71,956,507 B sums are worker-selected candidate metadata, not a verified resolver closure; full artifact identities and marker/wheel selector regression evidence remain absent. B01/B02 equalities apply only to the selected rows, not a complete install. B04 npm archive formula, B07 cache copies, B09 PNG/JPEG and B10 PCM audio figures are scenario estimates: actual upper UNKNOWN. Extra tar metadata, compression choices, cache/intermediate copies and container overhead are not bounded here. A directory polling watch can overshoot; no hard ceiling is proven.

O1 may perform library requests blocked before socket send. It cannot satisfy a strict zero-attempt policy on this source evidence. A separately chosen policy may allow logged pre-send blocks; agent must not infer that choice. O3 stays visible for strict attempt controls. DC-09 retains D103 TOL-06 0.1 s, TOL-07 and joined CF-63 human review.

DEV-01..09 remain disclosed deviations, not retroactively compliant behavior. Broad mirror status may refresh indices; actual incidental effects UNKNOWN. Chrome capped partial body was not parsed, so availability is UNKNOWN. Final SP-10 refinement is not a changed expectation or independent detector proof. Local waives only the documentary independent probe. No source refresh, install, runtime, lane/preset/rights/budget choice or new worker dispatch here.
