# CVF NCR Video Production Preparation Kit

Memory class: FULL_RECORD

docType: reference

Status: PREPARATION_KIT_PENDING_REVIEW

Date: 2026-10-08

Batch ID: CVF-NCR-VIDEO-PRODUCTION-PREPARATION-20261008

EPISTEMIC_PROCESS_NA_WITH_REASON: task-specific preparation kit; every claim is joined to a pinned source or marked UNKNOWN, and the machine-readable joins live in `docs/reviews/evidence/cvf-ncr-video-production-preparation-worker-2026-10-08.json`.

## Purpose

One inspectable preparation kit for the accepted CVF Vietnamese explainer video, lane C1 (local VieNeu v3 Turbo CPU/ONNX fp32 fixed preset, then local HyperFrames). It makes the resource, offline-retrieval, rights and S05 composition gaps explicit and machine-checkable before any media execution. It is paired with `scripts/cvf_video_preflight.py`, a standard-library inspect/validate-only CLI, and `scripts/test_cvf_video_preflight.py`.

The kit is not an installation, a rights clearance, a runtime admission or a media result. A complete kit still reports runtimeAdmission NO_GO. It satisfies the preparation order only; it cannot satisfy production admission.

## Scope And Status

| Item | Disposition |
|---|---|
| Lane | C1 is the assessment candidate selected for readiness assessment only (`docs/reviews/CVF_NCR_S05_ASSESSMENT_LANE_SELECTION_2026-10-03.md`, Decision). Not an executed or certified lane. |
| Reused unchanged | Accepted ten-scene storyboard `docs/reference/CVF_NCR_GENERAL_VIDEO_DESIGN_2026-10-02.md`; composition contract `docs/reference/CVF_NCR_VIDEO_COMPOSITION_READINESS_DESIGN_2026-10-03.md`. |
| Excluded | Actual TTS, render, install, download, upstream build or test, provider call, voice cloning, paid or hosted voice, int8 or GPU substitution, mirror patching, native supervisor backend, stopped source-relay retries. |
| Old STOP | Unchanged; see Stopped Chain Preservation. |

## Frozen Inputs And Pin Freshness

All digests were recomputed at execution start (executionBaseHead `fce3cf9c75b338acc7cad9c966fcf9fca62dc8cf`) and matched the frozen input evidence `docs/reviews/evidence/cvf-ncr-video-production-preparation-inputs-2026-10-08.json`.

| Governed source | SHA256 |
|---|---|
| docs/reference/CVF_NCR_GENERAL_VIDEO_DESIGN_2026-10-02.md | 3ce5e2363c3e29997fcbf42cb4cec59af7447cca38409d4d970e8aa71e5777e0 |
| docs/reference/CVF_NCR_VIDEO_COMPOSITION_READINESS_DESIGN_2026-10-03.md | de3673a2f41695bfa83692095fd0d67f96cea924d48809aefd8b14266c8e6d87 |
| docs/reviews/CVF_NCR_S05_ASSESSMENT_LANE_SELECTION_2026-10-03.md | 6d95fc56401aee6de3eed37d082c15b6cd70ed40600e813b95721065aea71a62 |
| docs/reviews/CVF_CVF_NCR_S05_S1_R1_EVIDENCE_RELAY_LOCAL_REVIEW_2026-10-03.md | 54630fcaace2eca4f1ed5d136e8d69a3846484f306929628221c0361656526de |
| docs/reviews/evidence/cvf-ncr-s05-assessment-lane-selection-2026-10-03.json | 1bff8bd9149b2418a4c266b35106555fa69e047bde75d742a261fdf4e3ae5748 |

| Pinned Git blob (VieNeu `85344322b7258b4e25479b692e8e3396baf9db34`, HyperFrames `5c52f72399e21f8dcf3ede2bf2d24978c6522a94`) | SHA256 | Bytes | Use |
|---|---|---|---|
| vieneu pyproject.toml | b36fc3303dceff0dddbe9f49067d0c82f3c11802e0dd82a2b58208f375d8df63 | 5991 | fully read |
| vieneu uv.lock | 0921052a578f63d82305eb4a19be2579751edfb579eab0c9d65d977652481e2e | 998772 | digest pin only, not parsed |
| vieneu LICENSE | c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4 | 11357 | header read (Apache 2.0 text) |
| vieneu src/vieneu/_v3_turbo_engine/onnx_runtime_lite.py | 7747ac18fb5b660a810a434461bd8386ba40b0b46d559c07907db0c19414084e | 32607 | fully read |
| vieneu src/vieneu/v3turbo.py | 10757905d3f6454e17c834ec32c73d33b5b9d322d05397295c0bbeb5f3ffb3ad | 38604 | fully read |
| hyperframes packages/cli/package.json | cb61f0ce2902e34791583d6eb5c80e70f6910e8663c1dc3f802c6409bbaef7b2 | 2467 | fully read |
| hyperframes packages/engine/package.json | 5d3aa6d8381c547fa93ddd57ca201857e62c54ed6e69771fb9a460cb8f508be7 | 2361 | fully read |
| hyperframes bun.lock | 5993fbbfd6a3affcc0e07f8789711fb69ddb36e7bf8cf716f9383c87b10b067e | 264395 | digest pin only, not parsed |
| hyperframes LICENSE | 4259155fb06f127687ee7b0a8a3682d45132db0f2da26cbc0b7a2d1e796436b8 | 10763 | header read (Apache 2.0 text) |

Additional immutable blobs at the same VieNeu pin were read as data only to resolve forwarding unknowns (no execution): `src/vieneu/factory.py` (sha256 0cd4631298d4da9de59471c3f3371a8c894b2b9019e40f584373e2c1a3ca3265, 2065 bytes), `src/vieneu/base.py` (48cc3f8b809a6bfd06e6fea6344673541e547068fb310caaef0dbc1099af6ac5, 19719 bytes; lines 36-66, 118-145, 290-298 read), `src/vieneu/_v3_turbo_engine/onnx_denoiser.py` (a0923ad09075a1285e09133f65401251cac39915b710c24357c9d9e721b1ffe3, 5419 bytes; header read) and a `git grep` of retrieval call sites under `src/vieneu` and `src/vieneu_utils`. The HyperFrames `packages/cli/src/commands/render.ts` blob (75751e0dc06b58334c4a9b358b3218d24ff57cf91de2d73270551a1f1ea4dcd1, 81918 bytes, 1949 lines) exists at the pin and was NOT read; nothing in this kit relies on its content.

Freshness: both pins are dated observations, not current-upstream truth. The VieNeu pin was observed as upstream main on 2026-10-03 and equals the 2026-10-02 design pin. The HyperFrames pin `5c52f723...` was observed as main on 2026-10-03 (CLI 0.8.113); the 2026-10-02 design pin was `f16e509832d4fa02bbc9a5f81b59ff78f9d466af` (0.8.112). The 0.8.113 delta and npm-to-pin provenance are not assessed here. No upstream refresh, clone, package fetch, binary download or upstream build, test, CLI or skill execution occurred. The preflight labels every pin `DATED_HISTORICAL_NOT_CURRENT_UPSTREAM`.

## Six Findings Joined To Rows

Each observed finding (VR01-VR06 in the frozen input evidence) is joined to a resource, control or rights row, exact source evidence, an owner and a terminal disposition. Reason codes are emitted by `cvf_video_preflight.py`; none of the dispositions below is a resolution.

| Finding | Resource / control / rights rows | Preflight reason codes | Exact source evidence | Owner | Terminal disposition |
|---|---|---|---|---|---|
| VR01 prior 0.527 GiB covers 13 selected entries only | Rows R1-R5 (cache, final, duplicate, log, aggregate disk) and R6 (peak RAM) in the envelope below | CEILING_EXCEEDED, AGGREGATE_DISK_OVERFLOW, CEILING_MISSING, CEILING_INVALID | lane-selection evidence `metadataSizeQualification` (sums 13 onnx_update and codec entries; excludes caches, packages, browser, duplicates, RAM); review Findings "Size" and "Hardware" | operator selects values; Local reviewer judges measured use | OPEN. Ceilings are PROPOSED_NOT_ENFORCED; real footprint UNKNOWN until separately admitted acquisition; 0.527 GiB is not promoted to a budget. |
| VR02 local dirs bypass fetch; denoiser still resolves a root file; remote fallback has no revision, cache_dir or local_files_only | Control rows C1 (egress block), C2 (owned local root), voice rows V2 (codec disposition), V3 (denoiser disposition) | ENFORCEMENT_EVIDENCE_MISSING, CODEC_DISPOSITION_MISSING, DENOISER_DISPOSITION_MISSING, SOURCE_FILE_SET_INCOMPLETE, ARTIFACT_MISSING | onnx_runtime_lite.py:88-100, 181-214; v3turbo.py:171-182 (see forwarding trace) | operator (codec path decision and enforcement), Local reviewer | OPEN, NO_GO. The public constructor cannot forward codec_dir, a gap beyond the original finding. |
| VR03 preset lookup can download voices_v3_turbo.json; no revision, cache_dir or local_files_only | Voice rows V1 (fixed preset identity and source), V4 (consent); rights row G3 | PRESET_MISSING, PRESET_SOURCE_MISSING, VOICE_CONSENT_MISSING, RIGHTS_SCOPE_INSUFFICIENT | v3turbo.py:229-253, 255-300, 468-488 | operator (preset and consent), Local reviewer | OPEN, NO_GO until a preset file hash and VOICE-scoped consent evidence are supplied. |
| VR04 core deps include gradio and librosa; Windows wheel closure and size unresolved | Inventory category python_wheel and source_lock; rows R1-R3 | PYTHON_CLOSURE_INCOMPLETE, WHEEL_PLATFORM_MISMATCH, WHEEL_FILENAME_INVALID, SOURCE_LOCK_DRIFT, standing WHEEL_CLOSURE_COMPLETENESS_NOT_PROVEN_BY_VALIDATOR | pyproject.toml:69-84 (dependencies), 5-11 (required-environments incl. win32 AMD64), 15-17 (default-groups empty); uv.lock pinned by digest only | Local acquisition worker under a separate admission | OPEN. Exact wheel set and sizes not resolved. |
| VR05 Node >=22 satisfied; FFmpeg not on PATH; browser and binary provenance unverified | Inventory categories browser, ffmpeg, font | CATEGORY_MISSING, RIGHTS_UNKNOWN, standing FONT_VIETNAMESE_GLYPH_COVERAGE_NOT_VERIFIED_BY_VALIDATOR | packages/cli/package.json:77-79; packages/engine/package.json:69-77 and 84-86; local observation Node v22.17.0, ffmpegOnPath false (not a whole-machine claim) | Local acquisition worker, operator (fonts) | PARTIAL. Only the Node version condition is satisfied. |
| VR06 source and relay STOP; rights and enforced envelope unproved | Rights rows G1-G5; control rows C1-C5; standing rows | RIGHTS_UNKNOWN, RIGHTS_NOT_CLEARED, ENFORCEMENT_EVIDENCE_MISSING, C1_STOP_RETAINED, OPERATOR_RUNTIME_ENVELOPE_NOT_ADMITTED | S1 R1 relay review Decision and Semantic Convergence Outcome; composition design G-16, G-17 | Local terminal disposition; operator | STOP RETAINED. No retry, reset or successor. |

## VieNeu Constructor And Consumer Forwarding Trace

Pinned VieNeu `85344322b7258b4e25479b692e8e3396baf9db34`. Line numbers are those of the pinned blobs. `V3Turbo` below is `V3TurboVieNeuTTS` in `src/vieneu/v3turbo.py`; `Engine` is `OnnxV3LiteEngine` in `src/vieneu/_v3_turbo_engine/onnx_runtime_lite.py`.

| Concern | Exact trace (file:line, symbol) | Consequence for C1 |
|---|---|---|
| Public entry | factory.py:22-25 `Vieneu(mode="v3turbo", **kwargs)` returns `V3TurboVieNeuTTS(**kwargs)` | All keyword arguments land on the V3Turbo constructor. |
| Backend and device | v3turbo.py:141 `backend="auto"`, 161-169; with `device="auto"` the constructor tries `import torch` (162-167) | Pass `backend="onnx"` and `device="cpu"` explicitly so torch is never imported and no GPU or remote-code path is reachable. |
| Precision and subfolder | v3turbo.py:144, 158-159: `precision` maps "fp32" to `onnx_update`, "int8" to `onnx_int8` | Fixed `precision="fp32"`; int8 is a lane substitution (preflight LANE_SUBSTITUTION_REJECTED). |
| Local model root | v3turbo.py:136 `backbone_repo` is forwarded as `checkpoint_path` (176-177) and used by `_load_repo_voices` (216-217, 255-300) | `backbone_repo` must be a local directory so voice, denoiser and config lookups stay local. |
| onnx_dir | v3turbo.py:143 and 179 forward `onnx_dir`; Engine onnx_runtime_lite.py:88-100 skips the remote config probe (88-93) and `_fetch` (99) when `onnx_dir` is set | Local graph, config, tokenizer and heads are read from `onnx_dir` (103, 125, 139, 158-160). |
| codec_dir | Engine accepts `codec_dir` (77, 100). V3Turbo has no `codec_dir` parameter; extra keywords fall into `**kwargs` (150) and the Engine call (176-182) forwards only checkpoint_path, onnx_repo, onnx_dir, onnx_subfolder, threads | Through the public constructor the codec is always fetched by `_fetch(codec_repo, _CODEC_FILES, None)` (100), i.e. remote `OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX` (41). There is no local codec path without a bypass. |
| Codec file set | onnx_runtime_lite.py:47-51 six files; 161-162 decode_full loaded; 170-177 meta and decode_step optional; 163 and 609-613 encode loaded lazily for cloning | The manifest must cover all six names (SOURCE_FILE_SET_INCOMPLETE otherwise). |
| Denoiser | onnx_runtime_lite.py:181 `self.denoiser = self._load_denoiser()` always runs; 197-203 swallows any exception and returns None; 205-214 `_resolve_root_file("denoiser.onnx")` uses a local file only if `checkpoint_path` is a directory containing it, else `hf_hub_download(self.checkpoint_path, filename)` (211-212) | In a preset-only lane the denoiser is constructed but never used (v3turbo.py:468-488 `_resolve_ref` skips enrollment without `ref_audio`). Absence needs an explicit disposition because the fallback can reach the hub when `checkpoint_path` is not a directory. |
| Remote config probe | onnx_runtime_lite.py:88-93 `hf_hub_download(checkpoint_path, "config.json")` when `onnx_dir` is unset; exceptions swallowed | Avoided by passing `onnx_dir`. |
| Remote fetch arguments | onnx_runtime_lite.py:190 `hf_hub_download(repo, fn, repo_type="model", subfolder=...)`; also 91, 212; v3turbo.py:271 | No `revision`, `cache_dir` or `local_files_only` argument anywhere on these paths: nothing pins content. |
| Preset and voices | v3turbo.py:229-253 `_load_v3_voices` reads the packaged `assets/voices_v3_turbo.json`; 255-300 `_load_repo_voices` reads `<backbone_repo>/voices_v3_turbo.json` if it is a local directory with that file, else `hf_hub_download(backbone_repo, "voices_v3_turbo.json")` (269-273) | Same-name entries override built-ins (286) and the file's `default_voice` wins (297-298). Hash the file actually loaded (preflight `voice.presetSource`). Call `infer` with an explicit `voice` name. |
| Preset-only inference | v3turbo.py:473-488 `_resolve_ref`: `ref_audio=None` and a string `voice` resolves to the preset embedding and codes | No enrollment, no denoise, no speaker-encoder download. |
| Cloning side effects (excluded) | v3turbo.py:111-121 temp WAV under `Path.home() / ".cache" / "vieneu" / "tmp"`; 441-466 `save_voices` writes the packaged assets path; onnx_runtime_lite.py:216-222 speaker encoder via `from_pretrained` | Never reached without `ref_audio`, `add_voice` or `save_voices`. Cloning stays out of scope. |
| Watermark | base.py:61-62, 118-144 `perth` import is optional; 393-398 `_apply_watermark` is a no-op without a watermarker; pyproject.toml:109-114 puts it in the `watermark` extra | Not installed in C1, so output is unwatermarked. |
| WAV write | base.py:293-296 `save` uses `soundfile.write` at `self.sample_rate`; v3turbo.py:153 sets 48000 | Matches the design WAV proposal (48000 Hz, mono). |
| Import-time hub dependency | base.py:7 `from huggingface_hub import hf_hub_download` is a top-level import | huggingface_hub is a hard runtime dependency (also listed at pyproject.toml:77). |

### Codec Resolution Options (operator decision, not made here)

The manifest field `voice.codec.resolution` accepts only these two, each with an operator `decisionRef`; `OPERATOR_DISPOSITION_PENDING` or absence keeps CODEC_DISPOSITION_MISSING.

| Option | Description | Open conditions |
|---|---|---|
| ENGINE_DIRECT_CODEC_DIR | Construct the Engine directly with `codec_dir` and bypass the V3Turbo wrapper | The wrapper's preset resolution, chunking, joining and `save` would be re-created or reused by hand; no code for this is written here. |
| HF_CACHE_PREPOPULATED_OFFLINE | Pre-populate a huggingface_hub cache inside the owned root and run with the hub offline | huggingface_hub offline and cache-layout semantics were NOT read from a pinned blob (UNKNOWN U1); needs verification against the pinned wheel before use. |

Forking or patching the mirror, and silently switching to int8, GPU, cloud, cloning or paid voices, are rejected without a new operator decision.

### Unknowns Named

| ID | Unknown |
|---|---|
| U1 | huggingface_hub offline and default cache behavior (dependency code not read) |
| U2 | Whether `hf_hub_download` given a local path string fails before any network use (denoiser fallback when `checkpoint_path` lacks the file) |
| U3 | sea-g2p and `vieneu_utils/phonemize_text.py` data files and any runtime retrieval (not read) |
| U4 | Content and consent text of the packaged `assets/voices_v3_turbo.json` (blob not read; preset names, default voice and any per-voice consent unknown) |
| U5 | HyperFrames `render.ts` flags, browser discovery and download, FFmpeg discovery, telemetry and updater behavior, 0.8.113 delta (unread) |
| U6 | Windows wheel closure and byte sizes (uv.lock not parsed) |
| U7 | Measured peak RAM, disk, process count and wall time (nothing executed) |
| U8 | Any OS-level enforcement mechanism and its evidence on this host |
| U9 | Pinned per-component licence texts for weights, codec, presets, fonts, browser and FFmpeg build |
| U10 | Chosen fonts and Vietnamese glyph coverage |
| U11 | npm-to-pin provenance of the HyperFrames package (design R18) |

## Preflight Manifest Contract

CLI: `python scripts/cvf_video_preflight.py --manifest <file> --root <owned root> --design docs/reference/CVF_NCR_GENERAL_VIDEO_DESIGN_2026-10-02.md [--report <new file outside root>]`. Inspect and validate only: standard library, no subprocess, socket, installer, environment mutation, inference or import of VieNeu, HyperFrames or provider clients. `--extract-s05 --design <file>` prints the S05 identity.

Exit codes: 0 only when `validationStatus` is `STRUCTURALLY_COMPLETE_NO_GO`; 1 for `INCOMPLETE_NO_GO` or `INVALID_NO_GO`; 2 for command-line usage errors. `runtimeAdmission` is always `NO_GO` and `osContainment` is always `NOT_ESTABLISHED`; a complete manifest never changes either. Output is deterministic JSON without timestamps.

| Manifest block | Required content |
|---|---|
| schemaVersion | `cvf.videoPreparationManifest@1` |
| artifacts | Per artifact: unique id; category; placement (CACHE, FINAL, DUPLICATE); exact relative path under the owned root; sha256; measured bytes; origin (kind, identity, `immutable: true`, 40-hex revision for git_blob and hf_revision); rights (disposition and evidence artifact id) |
| categories | python_wheel (with `distribution`), source_lock, model_graph, model_config, tokenizer, codec, phonemizer, preset, browser, ffmpeg, font, rights_attribution (with `rightsScopes`), enforcement_evidence; optional denoiser |
| file sets | model_graph, model_config, tokenizer, codec and preset must contain every basename named by onnx_runtime_lite.py:42-51 and `voices_v3_turbo.json` |
| sourcePins | the nine frozen blob pins, each with freshness `DATED_HISTORICAL_NOT_CURRENT_UPSTREAM`; lock artifacts must equal the pinned uv.lock and bun.lock blobs |
| ceilings | ten positive finite numbers with fixed units, each `status: PROPOSED_NOT_ENFORCED` |
| enforcement | five controls (egress_block, filesystem_quota, memory_cap, process_cap, walltime_cap), each joined to a hashed enforcement_evidence artifact |
| voice | presetId, presetArtifactId, presetSource, consentArtifactId, codec resolution and decisionRef, denoiser disposition, and fixed `backend onnx`, `device cpu`, `precision fp32`, `cloning false`, `paidOrHostedVoice false` |
| s05 | accepted digests, claim IDs, original estimate, measured narration (null until measured), retiming disposition, planned frames |

Path rules: relative, forward-slash only, no empty, dot or dotted-parent components, no drive letter, colon or backslash, no trailing space or dot, NFC and case-insensitive duplicate-target detection, every component checked with `lstat` for symlinks and Windows reparse points (attribute 0x400), regular files only, a shared-cache root (components such as `.cache`, `.huggingface`) rejected, size bounds checked before streaming SHA256.

Rights rule: a source-code LICENSE never clears weights, codec, voices or fonts. A `CLEARED_PINNED_EVIDENCE` disposition must join a rights_attribution artifact whose `rightsScopes` contain the component scope (SOURCE_CODE, WEIGHTS, CODEC, VOICE, FONT, BINARY); otherwise RIGHTS_SCOPE_INSUFFICIENT. UNKNOWN or absent is RIGHTS_UNKNOWN; publisher declarations are RIGHTS_NOT_CLEARED. Even cleared dispositions stay manifest claims (standing RIGHTS_ASSERTIONS_UNREVIEWED_BY_VALIDATOR).

Production artifact pins stay UNKNOWN until actual acquisition. Only the test fixtures invent synthetic digests.

## Proposed Runtime Envelope (PROPOSED_NOT_ENFORCED)

These are proposals for operator selection, derived from the 2026-10-03 hardware observation (i5-1240P, 15.69 GiB RAM, free C 16.81 GiB and D 24.22 GiB, from the lane-selection evidence). None is measured or enforced.

| Row | Ceiling key | Unit | Proposed value | Basis |
|---|---|---|---|---|
| R1 | download_install_cache_bytes | bytes | 5368709120 (5 GiB) | wheels, onnx_update, codec, browser, FFmpeg; footprint UNKNOWN |
| R2 | final_artifact_bytes | bytes | 3221225472 (3 GiB) | extracted models and tools in the owned root |
| R3 | duplicated_storage_bytes | bytes | 1073741824 (1 GiB) | cache plus local-directory copies |
| R4 | log_evidence_bytes | bytes | 67108864 (64 MiB) | attempt logs and evidence |
| R5 | aggregate_disk_bytes | bytes | 10737418240 (10 GiB) | R1+R2+R3+R4 is 9.0625 GiB; below observed free space |
| R6 | peak_committed_ram_bytes | bytes | 8589934592 (8 GiB) | about half of observed RAM; single sequential job |
| R7 | process_count | count | 24 | node, browser children, FFmpeg, Python; unmeasured |
| R8 | walltime_seconds | seconds | 1800 per admitted stage | acquisition, voice and render each |
| R9 | cancellation_grace_seconds | seconds | 30 | process-tree end after cancel |
| R10 | retries | attempts_per_stage | 1 | one attempt, no retry (design SEL-08) |

Enforcement evidence is recorded separately from these numbers. Control rows C1 egress_block, C2 filesystem_quota, C3 memory_cap, C4 process_cap, C5 walltime_cap each need a hashed platform or effect evidence artifact. Candidate mechanisms (Windows firewall rule, Job Object limits, quota on the owned root) are NOT source-verified here and no native supervisor backend is implemented. The validator can report arithmetic and completeness but cannot report OS containment or runtime GO from metadata alone. Raw keys, tokens and provider payloads are never evidence.

## Rights And Consent Matrix

| Row | Component | Evidence available | Status |
|---|---|---|---|
| G1 | VieNeu code | pinned LICENSE blob (Apache 2.0 text) | source code only; does not clear the rows below |
| G2 | HyperFrames code | pinned LICENSE blob (Apache 2.0 text) | source code only |
| G3 | VieNeu v3 Turbo weights and presets | publisher declaration of Apache-2.0 and consent on a model card pinned at `61b85e3d937fbbacb387714180e8182823512523` (lane-selection review, Findings "Rights") | PUBLISHER_DECLARED_UNVERIFIED; per-file notice and matching preset consent evidence missing |
| G4 | MOSS codec | codec metadata pinned at `ceff0d0749bfb3fa2d61149794ec6feef0d1e1ae` (same review) | PUBLISHER_DECLARED_UNVERIFIED |
| G5 | Fonts, browser, FFmpeg build, sea-g2p and Python wheels | none pinned | RIGHTS_UNKNOWN |

Voice and likeness: only one fixed preset with matching consent evidence; cloning, paid or hosted voices are not admitted (design G-17).

## S05 Binding

Source: the accepted storyboard, scene S05 (Outline 95-115 seconds). Extraction recipe (recorded identically in `s05Extraction` of the evidence): design bytes decoded as UTF-8, CRLF normalized to LF, S05 heading section, value after `- <Label>: ` to end of line, re-encoded as UTF-8, no newline; status card = On-screen value up to the first `. ` separator. The design raw SHA256 is `3ce5e2363c3e29997fcbf42cb4cec59af7447cca38409d4d970e8aa71e5777e0`. The preflight fails closed with S05_SOURCE_DRIFT if any byte of the accepted source changes, and with S05_MANIFEST_DRIFT if a manifest binding differs.

Narration (SHA256 `f6c1cd46a00b535e07dc634bcb53d75dc80ed521a58432de8c5b449cf4017fb8`, 314 UTF-8 bytes, 236 code points, NFC):

Ví dụ minh họa, chưa chạy thật, dữ liệu giả. Bạn có một ứng dụng liệt kê chi tiêu và muốn thêm bộ lọc theo tháng. Bạn giao việc có ranh giới: mục tiêu, hai file được sửa, những điều không được làm, và khi nào agent phải dừng lại để hỏi.

On-screen (SHA256 `0846e61c1a38e8468152a6df998e58b07e143a91f5d8d821ffb5c1ba77c2eede`, 345 UTF-8 bytes, 278 code points, NFC):

VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ. Mục tiêu: lọc chi tiêu theo tháng. Được sửa: src/expenses/ExpenseList.tsx và src/expenses/ExpenseList.test.tsx. Dữ liệu thử: 5 khoản chi giả tự nhập trong test. Không được: sửa file khác, thêm thư viện, gọi mạng, dùng dữ liệu thật.

Status card (SHA256 `ec3a424cb9b37d3ba630771347c60547b95275ce50900ab73bd8bb17463d3c25`, 45 code points):

VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ

Claim IDs for S05: C09, C10 (design Scene Handoff). Text sent to a voice engine must be recorded as sent (design CF-20); pronunciation overrides never change on-screen text. The kit does not alter, paraphrase or re-time any byte.

### Planned S05 Frame States

Every planned frame state carries the full status card plus exactly one On-screen segment, in source order, with claims C09 and C10. This split is derived mechanically from the stored On-screen value; it adds no wording. Frame timing inside the 20 second scene is not defined here.

| Frame | Status card (full, every frame) | On-screen segment (exact) | Segment SHA256 | Claims |
|---|---|---|---|---|
| S05-F01 | VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ | Mục tiêu: lọc chi tiêu theo tháng | 4944d2a1eea3007c8511ff86960cb9ff217aa2e2d07bac890b85fc41e017f1ff | C09, C10 |
| S05-F02 | VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ | Được sửa: src/expenses/ExpenseList.tsx và src/expenses/ExpenseList.test.tsx | 34272820afcdc19d96f2fc119ef54006ab18594b3c24fa901738387bb764f58f | C09, C10 |
| S05-F03 | VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ | Dữ liệu thử: 5 khoản chi giả tự nhập trong test | 6c94bb1ea30091d0eaf53ae45ddc0e10bce9d80499cd4e2e7959e532dca773b5 | C09, C10 |
| S05-F04 | VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ | Không được: sửa file khác, thêm thư viện, gọi mạng, dùng dữ liệu thật. | 87274bae99734a84ca1854b9b79d124790c06e2dd01838019584a1d97a06b541 | C09, C10 |

### Timing

| Item | Value |
|---|---|
| Original estimate | 20 seconds (design planning estimate, not a voice requirement) |
| Measured narration | NOT_MEASURED (null in the manifest); no audio exists |
| Pad limit | 19.5 seconds (design TOL-05) |
| Retiming | A measured narration above 19.5 seconds needs PROPOSED_RETIMING_PENDING_APPROVAL and an operator disposition before render; APPROVED_RETIMING needs an approval reference. Preflight codes RETIMING_DISPOSITION_REQUIRED, RETIMING_APPROVAL_PENDING, RETIMING_APPROVAL_UNBOUND. |

## Future Sequence (Not Executed)

1. Separately admitted preparation acquisition: resolve the exact Windows wheel closure, model graphs, codec, preset, denoiser disposition, browser, FFmpeg, fonts and licence texts into the owned root; record sha256, bytes and immutable origin per artifact; fill the manifest. Acquisition commands are NOT defined here (U6, U9).
2. Verified local-only resources and fail-closed effect controls: preflight reports `STRUCTURALLY_COMPLETE_NO_GO`, Local reviews rights and enforcement evidence, and the operator admits an exact runtime envelope. Only this step can change the admission state, and it is outside the validator.
3. At most one fixed-preset WAV, then at most one narrated S05 render, inside the selected limits.

Command recipes (all PLANNED_NOT_EXECUTED; shapes are source-backed, values are placeholders):

| Step | Recipe | Source backing |
|---|---|---|
| Preflight | `python scripts/cvf_video_preflight.py --manifest <manifest> --root <owned root> --design docs/reference/CVF_NCR_GENERAL_VIDEO_DESIGN_2026-10-02.md --report <new report>` | this order; executed only against synthetic fixtures |
| Voice | `tts = V3TurboVieNeuTTS(backbone_repo=<ROOT>/model, onnx_dir=<ROOT>/model/onnx_update, backend="onnx", device="cpu", precision="fp32", threads=<N>)`; `wav = tts.infer(<S05 narration>, voice=<presetId>)`; `tts.save(wav, <attempt dir>/s05.wav)` | v3turbo.py:134-182, 588-636; base.py:293-296. Blocked until the codec resolution is dispositioned (no codec_dir forwarding). |
| Render | `node <ROOT>/node_modules/@hyperframes/cli/bin/hyperframes.mjs ...` | packages/cli/package.json:11-14 names the bin; subcommand and flags are UNKNOWN (U5) and must be read at the pin before dispatch |
| Re-check | rerun preflight, then inventory writes outside the attempt directory and child processes | design CF-72, CF-73 |

## Consolidated NO_GO Matrix

One matrix for all missing conditions; it is not a request for further source-relay rounds.

| Condition | Source of the condition | Owner | State |
|---|---|---|---|
| Production artifact digests, sizes and immutable origins | no acquisition | Local acquisition worker | UNKNOWN, NO_GO |
| Wheel closure and sizes (VR04) | uv.lock not resolved | Local acquisition worker | UNKNOWN, NO_GO |
| Codec local path (VR02) | V3Turbo forwards no codec_dir | operator decision | PENDING, NO_GO |
| Denoiser disposition (VR02) | constructor always resolves a root file | operator decision | PENDING, NO_GO |
| Fixed preset hash and consent (VR03) | packaged and root preset files | operator, Local reviewer | UNKNOWN, NO_GO |
| Per-component rights (VR06) | no pinned licence texts for weights, codec, fonts, browser, FFmpeg | Local with operator | UNKNOWN, NO_GO |
| Enforced egress, disk, RAM, process, time controls | no enforcement evidence | operator and Local | MISSING, NO_GO |
| FFmpeg, browser, fonts (VR05) | none staged | Local acquisition worker | MISSING, NO_GO |
| Measured narration and retiming disposition | no audio | operator | NOT_MEASURED |
| Runtime envelope admission | proposals only | operator | NOT_ADMITTED |

## Stopped Chain Preservation

These identities and counters are quoted from `docs/reviews/CVF_CVF_NCR_S05_S1_R1_EVIDENCE_RELAY_LOCAL_REVIEW_2026-10-03.md` (Claim Boundary) and are unchanged by this kit: the old `cvf-ncr-c1-metadata-footprint` chain stays STOP at ordinal 2 with `C1_DEPENDENCY_FOOTPRINT_CACHE_SEMANTICS_UNSPECIFIED` and counters 0/0/1/2; the `local-supervisor-source-contract` chain stays SUCCESSOR 1 with its counters unchanged; the relay review keeps `reviewDisposition: REVIEW_COMPLETE_RELAY_STOP_SOURCE_CLOSURE_WITHHELD`, `workerRedispatchAllowed: NO` and `FEATURE_SUCCESSORS_FROZEN`. This preparation order has its own identity (`cvf-ncr-video-preflight-kit-construction`, INITIAL, ordinal 0). It does not resolve, rename, reset or succeed any stopped blocker and opens no retry or successor.

## Claim Boundary

Pure-local preparation construction only. No installation, download, model or weight consent clearance, inference, TTS, WAV, MP4, browser, FFmpeg, provider, hosted or paid voice, cloning, public, deployment or live CVF governance claim. Proposed ceilings are not enforced containment. The preflight validates local metadata and file digests; it does not establish offline operation, OS containment, rights clearance or runtime readiness. The accepted storyboard is unchanged. Source coverage is partial and pins are historical.

Text Encoding Exception: this document is ASCII except the S05 narration, On-screen and status-card strings, which are Vietnamese source content preserved byte-for-byte with diacritics.
