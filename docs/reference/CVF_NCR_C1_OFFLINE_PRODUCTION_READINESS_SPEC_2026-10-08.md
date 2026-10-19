# CVF NCR C1 Offline Production Readiness Spec - S0 Documentary Reconciliation

Memory class: FULL_RECORD

docType: reference

Status: S0_READINESS_SPEC_PENDING_REVIEW

Date: 2026-10-08

Batch ID: CVF-NCR-C1-OFFLINE-PRODUCTION-READINESS-20261008

executionBaseHead: 726af3dabeb49213367d5c200e98fd194b0abc95

EPISTEMIC_PROCESS_NA_WITH_REASON: task-specific documentary reconciliation; every claim is joined to a hash-bound governed source or marked UNKNOWN or NOT_OBSERVED, and the machine-readable joins live in `docs/reviews/evidence/cvf-ncr-c1-offline-production-readiness-worker-2026-10-08.json`.

## Purpose

One joined, source-bound readiness contract for lane C1 (VieNeu v3 Turbo CPU/ONNX fp32, fixed preset, owned offline cache, then local HyperFrames). It reconciles the accepted 10-03 metadata and control designs with the accepted 10-08 preparation kit and the two selected limits, and it ends the circular demand to prove production effects before their plan is written. It finishes S0 only: production runtime stays NO_GO and no later stage is released by this document.

## Scope And Status

| Item | Disposition |
|---|---|
| Delivered | this spec, `docs/reviews/evidence/cvf-ncr-c1-offline-production-readiness-worker-2026-10-08.json`, `docs/reviews/CVF_NCR_C1_OFFLINE_PRODUCTION_READINESS_WORKER_RETURN_2026-10-08.md` |
| Selected by the operator | C1 CPU/ONNX fp32 fixed preset with a conditional owned offline cache; aggregate disk 10737418240 B (10 GiB); peak committed RAM 8589934592 B (8 GiB) |
| Everything else numeric | PROPOSED_NOT_SELECTED (kit rows R1-R10 and the new row R11 below) |
| Not done in S0 | zero acquisition, install, host change, firewall or Job Object change, TTS, WAV, MP4, provider or paid voice, cloning, upload, external dispatch, public sync |
| Not selected | Engine-direct, int8, GPU, cloud or cloning substitution; Windows candidate profiles W-A and W-B below are candidates, not admitted platform changes |
| Reuse | accepted preparation closure (37 tests, eight CLI cases), 10-03 selector acceptance (20 independent static checks), source-supported O1; none replayed |

## Evidence Levels

| Level | Meaning in this spec |
|---|---|
| DECLARED_PINNED | exact cited metadata or source identity from a hash-bound governed source (pin, size, declared hash, publisher text); it is never payload, rights, consent or enforcement proof |
| PAYLOAD_VERIFIED | a hash recomputed over bytes actually acquired under an admitted stage; every row in this spec is NOT_OBSERVED at this level |
| CONDITIONAL_SUM | arithmetic over declared rows under stated conditions; not an install ceiling |
| SCENARIO | conditional estimate (frames, duplicated cache); never summed into a certified upper bound |
| REPORTED_UNBOUND | statement from the forwarded amendment proposal without a bound receipt; recorded, not relied on |

## Frozen Inputs

Raw SHA-256 recomputed at execution start (executionBaseHead above, dispatch base 6f409ea6587de0b6470149699002486f896878de). The nine hashes the dispatcher bound in the intake MATCH; the two packet hashes MATCH the bootstrap currentAuthority.

| Source | SHA-256 | Bytes | Role |
|---|---|---|---|
| docs/work_orders/CVF_AGENT_WORK_ORDER_NCR_C1_OFFLINE_PRODUCTION_READINESS_S0_2026-10-08.md | 1d46745dd7f0db94d960897b79dfa888bfd7a8ce62137a096d77162e41397351 | 41409 | governing S0 order |
| docs/baselines/CVF_GC018_NCR_C1_OFFLINE_PRODUCTION_READINESS_S0_2026-10-08.md | dcffa646e1052d90cb0293fa879bda8ecb8048b7cf7e6265dba7ea55c1a670df | 8420 | governing S0 baseline |
| docs/reviews/evidence/cvf-ncr-c1-offline-production-amendment-intake-2026-10-08.json | 6438118f3eef3c2b0fc7b4ebf0d90c3b15deecff7831141c8ac8f39a6a563c20 | 28632 | amendment intake A01..A10 |
| docs/reviews/evidence/cvf-ncr-c1-offline-production-selection-2026-10-08.json | 95d32b48ef418c5e107c7b4857f30107235f24c448b773de3e0935a29bd8b49d | 8442 | operator selection and historicalStop |
| docs/reference/CVF_NCR_VIDEO_PRODUCTION_PREPARATION_KIT_2026-10-08.md | a4bd94eff05b5a3d7d3c33367cd4f036ba99540bd24f381c1381afb3f0759697 | 31089 | accepted preparation kit |
| docs/reviews/CVF_NCR_VIDEO_PRODUCTION_PREPARATION_COMPLETION_2026-10-08.md | 66c39f7d2e29afd9820b9e85f963354fc183c9e159da7803469aedde6b62c583 | 21004 | accepted preparation completion |
| docs/reference/CVF_NCR_C1_METADATA_COMPLETION_SOURCE_DELTA_2026-10-03.md | e94ea7abb7879be6cfb0a72a5a830a0a0ae6dff5fab8fe4565f0d116ab819269 | 65031 | 10-03 metadata completion reference |
| docs/reviews/CVF_CVF_NCR_C1_METADATA_COMPLETION_SOURCE_DELTA_COMPLETION_2026-10-03.md | d7eb78ff39301218cf5fe07a2e556905ca8069d92bb5dd1168589b1f1f4c14cf | 19073 | 10-03 metadata completion review |
| docs/reviews/evidence/cvf-ncr-c1-metadata-completion-source-delta-2026-10-03.json | 01282c741e247fc7aea350399038dcb5b493caf6d19e145e5f7d8edc46047aa1 | 148041 | 10-03 metadata evidence |
| docs/reference/CVF_NCR_C1_METADATA_FOOTPRINT_ANALYSIS_2026-10-03.md | 2111d3b6efb7a64d4dd23dc6914cd60bd40243c7510230771bff06cb83375dbf | 36978 | 10-03 footprint and O1 analysis |
| docs/reference/CVF_NCR_S05_CONTROL_FIXTURE_DESIGN_2026-10-03.md | 7bc7a09bb5e4f67a25e8d3f92e156fbb9a8671b118408629af7acb2dc0538b52 | 37531 | 10-03 control design |
| docs/reference/CVF_NCR_C1_BOUNDED_READINESS_ASSESSMENT_2026-10-03.md | 1ea8f416c00ba64d414d192f10b389180ce3423044a7a8f4c231efea911898a9 | 37200 | D105 bounded readiness reference |
| docs/reviews/evidence/cvf-ncr-c1-bounded-readiness-assessment-2026-10-03.json | 68a496a583f99a44d0e923f363528401905cfc982f1daef6dbafded2aeb27c6f | 67250 | D105 bounded readiness evidence |
| docs/reviews/CVF_CVF_NCR_S05_S1_R1_EVIDENCE_RELAY_LOCAL_REVIEW_2026-10-03.md | 54630fcaace2eca4f1ed5d136e8d69a3846484f306929628221c0361656526de | 16266 | historical relay STOP |
| docs/reference/CVF_NCR_VIDEO_COMPOSITION_READINESS_DESIGN_2026-10-03.md | de3673a2f41695bfa83692095fd0d67f96cea924d48809aefd8b14266c8e6d87 | 30615 | composition design |
| docs/reference/CVF_NCR_GENERAL_VIDEO_DESIGN_2026-10-02.md | 3ce5e2363c3e29997fcbf42cb4cec59af7447cca38409d4d970e8aa71e5777e0 | 15049 | accepted storyboard |
| docs/baselines/CVF_GC018_NCR_C1_OFFLINE_PRODUCTION_READINESS_2026-10-08.md | 43a94438af1b04f013b1b00d9d031276c0416d278d7b0524cf7a6c748dd4eb4f | 6943 | predecessor held baseline |
| docs/work_orders/CVF_AGENT_WORK_ORDER_NCR_C1_OFFLINE_PRODUCTION_READINESS_2026-10-08.md | 87404a4231ae119dd07618afe0600a5c8d49e27a28829e1a0bcd2775fe9d4e80 | 34653 | predecessor held order |

## G1 - Offline Cache, Pins, Codec, Denoiser, Phonemizer

### O1 source facts (DECLARED_PINNED, runtime NOT_OBSERVED)

Source: `docs/reference/CVF_NCR_C1_METADATA_FOOTPRINT_ANALYSIS_2026-10-03.md`, section O1 Cache, Ref And Offline Semantics, read at huggingface_hub tag commit 3790483f (lock version 1.13.0). Position kept from that analysis: SOURCE_SUPPORTED_MECHANISM_RUNTIME_UNVERIFIED.

| Fact | Content | Consequence |
|---|---|---|
| H01-H02 | default revision is main; VieNeu passes no revision | a commit-hash shortcut is unavailable; lookups resolve through refs/main |
| H03 | offline flag is read at import | set in the process environment before Python starts |
| H04-H05 | request hook raises before sending; the blocked metadata call falls back to refs/main then snapshots/<commit>/<file> | a staged tree can serve model, codec and optional denoiser sites; a blocked call is still an attempt |
| H06 | refs and snapshot bytes are trusted, no hash verified | loaded-byte sha256 is verified outside the library; wrong refs/main silently binds another revision |
| H07-H08 | symlink probe degrades to move or copy; extended-path prefix only on download branch | layout 1x or up to 2x; keep the cache root short |
| H09-H10 | telemetry no-op when offline or opted out; cache root from HF_HUB_CACHE or HF_HOME | pin both to the owned root |
| H11-H12 | VieNeu hub sites pass no revision, cache_dir or local_files_only; wrapper does not forward codec_dir | O1 needs no codec_dir; strict zero attempts needs patch O3 |

Hub head d711944d differs from the lock tag in three of four compared files; the O1 invariants are present at the head, but the lock pins 1.13.0, so the head is context only (OB-05).

### Staged tree and environment contract (design, not executed)

1. Owned root holds one hub cache for the model repository at revision 61b85e3d and the codec repository at revision ceff0d07, each with refs/main equal to the pinned commit and snapshots/<commit>/ files; no blobs are needed.
2. Process environment before interpreter start: offline flag on, HF_HOME and HF_HUB_CACHE inside the owned root, telemetry opt-outs from kit and D105 evidence, no ambient credentials, empty working directory, no .env.
3. VieNeu call shape from the accepted kit: backend onnx, device cpu, precision fp32, local backbone directory, onnx_dir local, explicit voice name; wrapper preset resolution retained; auto device refused.
4. Every loaded file is hashed outside the library against the S3 manifest; refs/main is compared with the pinned commit before any load.
5. No silent fallback: a failed O1 proof stops. O2 (direct engine, disfavoured) and O3 (one-line forwarding patch) are visible, unselected, and need their own admission. Int8, GPU, cloud and cloning are not preauthorized.

### Retrieval sites

| Site | Source behaviour (D105 control analysis) | S0 disposition |
|---|---|---|
| S1 root config.json | hub fetch only when onnx_dir is unset; exception swallowed | pass onnx_dir; absence of an error is not evidence of a load |
| S2 graphs, tokenizer | onnx_dir forwarded by the wrapper | local route exists |
| S3 codec files (six names) | wrapper does not forward codec_dir | O1 staged route, SOURCE_SUPPORTED, runtime NOT_OBSERVED |
| S4 denoiser | constructed eagerly; hub attempt when absent from a local directory; exception swallowed | proposed disposition STAGED (OB-03), not selected |
| S5 voices override | skipped when backbone is a directory; no root voices file at model rev 61b85e3d | local; a later main could add one because the request is unpinned |
| Phonemizer | phonemize_text.py imports sea_g2p only; package data not read | UNKNOWN until wheel listing (OB-04) |

### Planned failure cases (all NOT_EXECUTED_PLANNED)

DC-01 attempt log kept apart from success log; DC-02 refs/main drift or missing snapshot gives a block before load; DC-03 valid staged snapshot accepted only under an explicitly chosen attempt policy; DM-04 offline staged run records every library request attempt; swallowed-exception sites need loaded-file hash proof; RC-06 an empty success list never proves zero attempts.

### Attempt policy record

P1 (blocked attempts logged, zero socket egress by an enforcement mechanism not yet proven) is the design policy in `docs/reference/CVF_NCR_S05_CONTROL_FIXTURE_DESIGN_2026-10-03.md`; `docs/reference/CVF_NCR_C1_METADATA_COMPLETION_SOURCE_DELTA_2026-10-03.md` records no policy chosen. Neither is a production grant (intake A07); selection is obligation OB-02.

## G2 - Rights, Consent And Fixed Preset

Component rows. PAYLOAD_VERIFIED is NOT_OBSERVED for every row; "verified rights" is NONE for every row.

| Component | DECLARED_PINNED evidence | Status | Missing evidence | Owner |
|---|---|---|---|---|
| VieNeu and HyperFrames code | LICENSE blobs, Apache-2.0 text at the pins | code only; does not clear the rows below | none for code scope | Local |
| Model weights (onnx_update) and root config | model card front matter and FAQ at rev 61b85e3d; no LICENSE or NOTICE file in the repository list | DECLARATION_ONLY | pinned card text or licence artifacts (OB-09) | Local |
| MOSS codec | card front matter at rev ceff0d07; upstream licence unread | DECLARATION_ONLY | as above (OB-09) | Local |
| Fixed preset entry | file blob 3e07d6dd0bf594c04b873f4ddf578cb8090a04da, sha256 e1f13cd2c2e0d29fdab5e15bfd7a30f3d7b768e6132bb43dd2b853f8efefdce9, 180332 B, 25 presets, default Hai Dang with alias; entries carry no consent or provenance field | CONSENT_UNVERIFIED | preset selection and matching consent evidence (OB-07, OB-08) | operator |
| soxr, sharp win32 binary | PyPI and registry declare LGPL-2.1-or-later and Apache-2.0 AND LGPL-3.0-or-later | copyleft notice obligation unresolved | notice texts (OB-10) | Local |
| Other wheels and npm packages | classifiers and registry declarations (npm: 53 MIT, 7 Apache-2.0, 6 ISC, 2 BSD-3-Clause, 1 CC0-1.0, 1 0BSD, 1 Apache-2.0 AND LGPL-3.0-or-later) | DECLARED_CODE_LICENCE; 74 of 82 wheel licences UNKNOWN | per-package reads (OB-10) | Local |
| FFmpeg build with libx264 | gyan page states GPLv3; BtbN variants gpl or lgpl by name; LGPL variant lacks libx264 | GPL_DECISION_OPEN | immutable asset, encoder list, operator disposition (OB-11) | operator |
| Chrome headless shell | Chromium source LICENSE read at the tag; binary terms unread | BINARY_TERMS_UNKNOWN | terms text (OB-12) | Local, operator |
| Fonts | Be Vietnam Pro and Noto Sans declare OFL; OFL text read for Be Vietnam Pro only | DECLARATION_ONLY | file hash, OFL text, rendered coverage (OB-13) | operator, Local |

### Selection ambiguity record (intake A07)

Three governed statements conflict and are recorded, not resolved by this spec: D105 `docs/reference/CVF_NCR_C1_BOUNDED_READINESS_ASSESSMENT_2026-10-03.md` (XE-03) says the preset is not selected and the card default Minh Quan differs from the pin default Hai Dang; `docs/reference/CVF_NCR_C1_METADATA_COMPLETION_SOURCE_DELTA_2026-10-03.md` keeps OD-01 and OD-03 open; `docs/reference/CVF_NCR_S05_CONTROL_FIXTURE_DESIGN_2026-10-03.md` (G2) says P1, fp32 and the hashed Hai Dang entry are kept as already selected for design. Position: design assumptions only. No preset or consent is selected or cleared here, and a hash match never supplies consent or permission.

## G3 - Inventory

### Python wheels (Windows cp311)

Reused from `docs/reference/CVF_NCR_C1_METADATA_COMPLETION_SOURCE_DELTA_2026-10-03.md` and `docs/reviews/evidence/cvf-ncr-c1-metadata-completion-source-delta-2026-10-03.json`; the 20 independent static checks of `docs/reviews/CVF_CVF_NCR_C1_METADATA_COMPLETION_SOURCE_DELTA_COMPLETION_2026-10-03.md` are consumed, not replayed. This spec only joined the accepted table.

| Check (join and arithmetic on the accepted table) | Result |
|---|---|
| rows transcribed | 82 (no duplicate name) |
| sum of lock sizes | 262308771 B (0.2443 GiB) MATCH 262308771 |
| row digest (rows joined by LF, pipe-separated fields, integer sizes) | 7611a30687fed16ac6b0f90475f0240bf4e2224ae3e61f8e05d1bbabd6cf962a MATCH the accepted digest |
| win_amd64-specific wheels | 25 MATCH; none-any wheels 57 |
| V2 import-needed subset | 35 packages, 71,956,507 B; future option, needs altered packaging, not admitted |

Limits kept: the selector is a metadata selector, not a resolver; installed closure and published-package resolution (V3) are unproven; payload hashes are NOT_OBSERVED (OB-15, OB-16).

### Model and codec files (DECLARED_PINNED from D105 evidence)

| File | Bytes | Hub large-file sha256 |
|---|---|---|
| onnx_update/vieneu_prefill.onnx | 324499 | 27f8b064f6b57b5448e95d095f1959588c005d614678045c2b97ecccf3b7a0f7 |
| onnx_update/vieneu_decode_step.onnx | 306134 | bedc379cea61ea5d616312750d95ad3924e055856662d19187a889a5edc24ceb |
| onnx_update/vieneu_acoustic_cached.onnx | 7207223 | f631e3387c788c3d8b9a5ac5df94952af5bc4c4d1049ff8a751e76a246fff2d4 |
| onnx_update/vieneu_backbone_shared.data | 415319040 | c7c072193db33d0542457e2612c7272c44c4279d1cafaf0aa4c379964911db2f |
| onnx_update/vieneu_v3_heads.npz | 52219622 | fb22484baa424bbb775133a6e5f0d00d6299b2b256fbe3312a864b85b9aed01e |
| onnx_update/config.json | 2152 | NONE_RECORDED |
| onnx_update/tokenizer.json | 22320 | NONE_RECORDED |
| moss_audio_tokenizer_decode_full.onnx | 681902 | 0fbbafe3fd4afa2a019af5c5ced204af6e2d1db044fa40f021525d2aee95b4ac |
| moss_audio_tokenizer_decode_shared.data | 44198912 | e69d52e0f4e84ca27850557ee54face46632d3a5a16c89bd246c7c408466dcad |
| moss_audio_tokenizer_decode_step.onnx | 351400 | 9527c86a29e1837edec1f74db57d5eeaadb3a715af3382703566460afed25855 |
| codec_browser_onnx_meta.json | 17036 | NONE_RECORDED |
| moss_audio_tokenizer_encode.onnx | 815775 | eadea4a645abdcf98714c7aead122ee2ce7da6e080f9f80b977cd1ca8e19473a |
| moss_audio_tokenizer_encode.data | 44507136 | aa751265b2bab2887eac224484546b194875aa7494b607115439b3dc6b228a2c |

Sums MATCH: graphs 475400990, codec 90572161, root config 1553, required known 565974704 (0.5271 GiB), optional denoiser 42661414 (sha256 b7621953291cfe05e695a9c0ff4255aa2f93239fc17c26627e18b7b6b8f72f0b), with denoiser 608636118. Three small files have no recorded payload hash: onnx_update/config.json, onnx_update/tokenizer.json, codec_browser_onnx_meta.json; the root config.json is a fourth small file also without one (OB-06). The speaker encoder (28303423 B) is cloning-only and excluded.

### SDK, npm, browser, FFmpeg, fonts

| Item | DECLARED_PINNED | Gap |
|---|---|---|
| SDK vieneu | lock root is an editable source package; wheels are dependency candidates only; proposed branch R-S3: allowlisted export of the pinned tree, no build, no editable install | export effect admission and import proof (OB-18) |
| npm graph | 71 rows, row digest c03624809ce9383eee6dc3bff4e7af1108f26635c28bee1c301280cb9f11d949, unpacked sum 76,676,928 B (pako has none) plus CLI package 33,408,618 B; esbuild postinstall hook; LGPL sharp binary | APPROXIMATE: bun nesting approximation, no tarball URL or size, no CLI row, hook text unread (OB-17) |
| Browser | chrome-headless-shell 152.0.7977.30 source constant; header Content-Length 119,527,247 B (patch .82: 119,768,220 B) | immutable asset identity, terms, size after unpack (OB-12, OB-16) |
| FFmpeg | BtbN GPL asset 194,054,347 B with API digest sha256:965cdfea...; gyan essentials about 109 MB, hash UNKNOWN | rolling latest must become an immutable asset; encoder list (OB-11) |
| Fonts | Be Vietnam Pro (18 declared files, 12 listed 131,492 B to 142,612 B); Noto Sans (variable files about 2.0 and 2.3 MB) | selection, file hash, coverage (OB-13) |
| Existing Node and Python | executables are unpinned; reported versions are unbound | host-read at S2 (OB-19) |

No complete installed inventory is claimed. Total download is not certified: CONDITIONAL_SUM of declarations (wheels, model, codec, root config, denoiser, browser header, BtbN asset) is 1184526483 B (1.1032 GiB) and excludes npm tarballs, fonts, redirects and protocol overhead.

## G4 - Controls And Envelope

### Selected versus proposed

| Row | Value | Status |
|---|---|---|
| aggregate disk | 10737418240 B | SELECTED |
| peak committed RAM | 8589934592 B | SELECTED (job ceiling, not a requirement; no measurement) |
| R1 download or install cache | 5368709120 B (5 GiB) | PROPOSED_NOT_SELECTED |
| R2 final artifacts | 3221225472 B (3 GiB) | PROPOSED_NOT_SELECTED |
| R3 duplicated storage | 1073741824 B (1 GiB) | PROPOSED_NOT_SELECTED |
| R4 logs and evidence | 67108864 B (64 MiB) | PROPOSED_NOT_SELECTED |
| R7 process count | 24 | PROPOSED_NOT_SELECTED |
| R8 wall time per admitted stage | 1800 s (design proposals voice 300 s, render 600 s, aggregate 3600 s) | PROPOSED_NOT_SELECTED; two proposal sets conflict, reconcile at admission |
| R9 cancel grace | 30 s | PROPOSED_NOT_SELECTED |
| R10 retries | 1 attempt per stage | PROPOSED_NOT_SELECTED |
| R11 render workdir (new) | no value | PROPOSED_NOT_SELECTED; see accounting |

### Shared aggregate accounting

| Quantity | Bytes | GiB | Kind |
|---|---|---|---|
| R1+R2+R3+R4 as proposed | 9730785280 | 9.0625 | proposal arithmetic |
| headroom to the selected aggregate | 1006632960 | 0.9375 | arithmetic |
| render frame scenario (600 frames, 1920x1080, PNG; D107 history) | 4982880000 | 4.6407 | SCENARIO, not a certified bound |
| R1-R4 fully used plus that scenario | 14713665280 | 13.7032 | exceeds the selected aggregate by 3976247040 B; shows the proposals leave no render budget, not a prediction |
| R11 ceiling if R1 archives are purged after verification | 6375342080 | 5.9375 | formula 10 GiB - (R2+R3+R4); proposal arithmetic |
| model and codec hub cache duplicate worst case | 1217272236 | 1.1337 | SCENARIO (Windows link fallback) |

Position: render workdir, shared storage and duplicates must sit inside the one selected aggregate; scenario estimates are not added into a certified upper bound; archive purge after verification, JPEG frames or streaming encode are proposed mitigations, not authorized. No filesystem-quota or admin claim is made from a polling watch.

### Candidate control mechanisms (none admitted, none observed)

Platform statements are general platform knowledge, not retained evidence (control design DV-04), and each needs a fixture proof.

| Control | Candidate | Privilege | Status |
|---|---|---|---|
| committed memory, process count, deadline, tree binding, kill-on-close | Job Object supervisor helper; historical source and inert fixture builders exist but acceptance is withheld; no admitted executable backend or control proof exists (IR-G02) | not expected to need elevation (unverified) | NOT_OBSERVED |
| egress including DNS and children | program-scoped outbound deny rule on private runtime copies; AppContainer without network capability; container with no network (existing isolation, option B) | rule likely needs elevation (unverified) | NOT_OBSERVED; a timeout is NOT_PROVEN |
| disk | OS allocation bound (fixed container or quota) versus bounded overshoot by per-download length check, per-stage size check and cleanup inventory | allocation bound likely needs elevation | overshoot UNKNOWN |

Windows candidate profiles: W-A native Windows (matches the Windows82 rows and existing interpreters); W-B Linux container (kernel limits without a custom helper, but changes platform pins, needs new inventory, rights rows and image acquisition, and the reported VM memory is below the selected 8 GiB). Both are candidates; choosing W-B is a lane and pin change needing operator selection.

Planned fixtures, all NOT_EXECUTED_PLANNED: FX-D1 disk allocation, FX-M1 committed memory of a tree, FX-T1 deadline and orphans, FX-B1 breakaway and pre-execution binding, FX-N1 zero socket egress, FX-L1 log caps. Small limits prove the named control only. They need an admitted control implementation and S2 admission. Historical source was statically reviewed but acceptance is withheld; it is not an executable enforcement backend.

### Resource policy versions

| Source | Disk | RAM | Other | Disposition |
|---|---|---|---|---|
| control design resource policy | 8 GiB | 4 GiB aggregate | ingress 2 GiB; free RAM at least 6 GiB; free D at least 16 GiB; 3600/300/600 s | superseded for disk and RAM by the selection; others stay proposals |
| kit proposals R1-R10 | 10 GiB (R5) | 8 GiB (R6) | R7-R10 | R5, R6 selected; others proposals |
| selection 2026-10-08 | 10737418240 B | 8589934592 B | none selected | authoritative for the two limits |

### Host observations (REPORTED_UNBOUND and dated history)

Forwarded proposal (raw sha256 c64c2dff868c911c036b80d024c51222a8d40fe883f2e33b7a4a9b9463895982): Windows 11 Home build 26200 without administrator rights, RAM 15.69 GiB total and 2.91 GiB free, free C 33.44 GiB and D 19.35 GiB, Python 3.11.9, Node 22.17.0, ffmpeg absent from PATH, Docker engine reachable with a VM of 8,162,304,000 B. These are not relied on and not re-observed in S0 (intake A04). Dated history: D105 snapshot 2026-10-02 free RAM 2.51 GiB, C 16.82 and D 24.2 GiB; design snapshot 1.73 GiB free RAM. Every snapshot would fail the design precondition of 6 GiB free RAM, which is a proposal; no application is closed to create headroom. Re-observation belongs to the S2 preflight (OB-26).

## Joined Obligation Ledger

One table for every missing production condition. None is an S0 failure; each blocks the named dependent action only.

| ID | Group | Obligation | Owner | Missing source | Dependent action | Release condition |
|---|---|---|---|---|---|---|
| OB-01 | G1 | O1 runtime proof: loaded-byte sha256, refs/main equal to the pinned commit, Windows link-or-copy layout, attempt log kept apart from success log | Local reviewer (probe); operator (effect admission) | no staged cache and no runtime observation (TG-07, DC-01..DC-03, DM-04) | S3 cache staging; S6 voice | S2 control proof passed, then a staged tree exists under an admitted stage |
| OB-02 | G1 | Attempt policy: P1 (blocked attempts logged, zero socket egress) versus P0 (strict zero attempts, needs source patch O3) | operator | explicit selection; the control design keeps P1 as design policy while the metadata completion records no policy chosen | any offline wording; S6 | operator selection line; O3 only after a failed O1 proof and its own admission |
| OB-03 | G1 | Denoiser disposition: staged in the snapshot (42,661,414 B declared) versus recorded egress and stop | operator; Local | decision (kit VR02, G-07) | S3 manifest; S6 | decision row inside the admission |
| OB-04 | G1 | Phonemizer data: sea-g2p wheel package data and any runtime retrieval | Local | wheel content listing (kit U3; source reading shows import only) | S4; S6 | S4 archive listing admitted, then reviewed |
| OB-05 | G1 | Pre-use freshness: HyperFrames head 835e0c16 (0.8.114) versus pin 5c52f723 (0.8.113); hub head d711944d versus lock 1.13.0; npm tarball and hub wheel artifact identity (TG-08, TG-09, G-18) | Local | admitted refresh read and artifact identity | S3 | E1 metadata admission; no silent repin |
| OB-06 | G1 | Model and codec payload identity: four small files lack a recorded payload hash (onnx_update/config.json, onnx_update/tokenizer.json, codec_browser_onnx_meta.json, root config.json); redirect and CDN host scope (IR-G13) | Local | registry tree metadata or acquired bytes | S3 | E1 metadata read or S3 acquired bytes |
| OB-07 | G2 | Fixed preset selection and entry-hash binding (OD-01): Hai Dang is a retained design assumption; conflicting historical statements are recorded | operator | operator selection line | S6 | operator names one preset; Local binds the entry hash actually loaded |
| OB-08 | G2 | Preset consent evidence and risk disposition (OD-02): entries carry no consent field; the model card statement is a publisher declaration | operator (risk); Local (match check) | pinned consent evidence applicable to the preset and intended use; risk language cannot supply it | S6 | evidence plus disposition |
| OB-09 | G2 | Weights and codec rights: pinned licence or notice scope; retention of model card bytes is UNKNOWN | Local | pinned card text or licence artifacts at model rev 61b85e3d and codec rev ceff0d07 | S3 use | E1 text read admitted and reviewed |
| OB-10 | G2 | LGPL notices (soxr, sharp win32 binary) and per-package licences for 74 of 82 wheels (TG-04) | Local | notice texts and package licence reads | S4 | E1 or S4 metadata read |
| OB-11 | G2 | FFmpeg build identity (immutable asset, not rolling latest), libx264 presence, GPL acceptance (OD-04) | operator; Local | immutable asset identity and encoder list (TG-05) | S3; S5; S7 | operator disposition; S5 identity inspection |
| OB-12 | G2 | Browser pin choice (.30 versus .82), archive availability and binary terms (OD-05, TG-06) | operator; Local | terms text and immutable asset identity | S3; S7 | operator choice; E1 read |
| OB-13 | G2 | Fonts: selection, per-file rights, Vietnamese glyph coverage (OD-06, DM-09) | operator (choice); Local | font file hash, OFL text, rendered coverage | S7 | operator choice; E1 read; S7 render check |
| OB-14 | G2 | Vietnamese listener and retiming authority (OD-08, CF-63) | operator | nominee and decision | S6; S7; S8 | operator input at the voice stage |
| OB-15 | G3 | PAYLOAD_VERIFIED for the 82 wheels: acquired-byte sha256 against the retained rows | Local | acquisition | S4 | S3 acquisition admitted and completed |
| OB-16 | G3 | Installed closure and unpacked size for Python, browser, FFmpeg; published-package versus lock difference (TG-01, DM-01, DM-02) | Local | archive listing or install | aggregate accounting; S6 | S4 admitted |
| OB-17 | G3 | npm closure: 71 rows are approximate; tarball URLs and bytes, CLI package row, esbuild hook text, resolver-validated graph, CLI-to-source join (TG-02, TG-03, IR-G11, IR-G12) | Local | registry metadata and archive listing | S4; S7 | E1, S3, S4 |
| OB-18 | G3 | SDK deployment through a pinned source-tree allowlist export (branch R-S3) and its import proof (DS-12) | Local | export effect admission and proof | S6 | S3 or S4 admitted |
| OB-19 | G3 | Base Node and Python executables: path, version and hash are unpinned | Local | host-read of the exact executables | S2; S4 | S2 precondition snapshot |
| OB-20 | G4 | Enforced egress control including DNS and child processes (FX-N1); mechanism and privilege unselected | Local (design); operator (host change, privilege) | mechanism, privilege, proof | S3 onward | S2 proof passed |
| OB-21 | G4 | Disk bound: OS allocation bound versus bounded overshoot; overshoot is unmeasured (IR-G03, DM-06) | operator (privilege); Local | mechanism and measurement | S3 onward | S2 proof passed |
| OB-22 | G4 | Memory, process-count, deadline, cancel and cleanup controls: historical helper source and inert fixture builders exist, but acceptance and executable OS proof remain withheld (IR-G02, IR-G04, IR-G05); the frozen successor boundary of the stopped supervisor-source chain needs an explicit disposition before any helper path is admitted | operator (boundary disposition); Local (review) | source path admission, review, fixtures | S2 | S1 admission carrying the boundary disposition |
| OB-23 | G4 | Ceilings R1-R4 and R7-R10 remain proposals; render workdir R11 is new and unselected | operator | selection or delegation | S2 onward | admission row |
| OB-24 | G4 | Owned root, volume, cache root, evidence custody and retention (IR-D06) | operator | paths and retention | S2 | admission row |
| OB-25 | G4 | Measured RAM, disk, process and time peaks; frame, audio, MP4 and log bounds (TG-10) | Local | bounded measurement | S6; S7 | after S2 controls |
| OB-26 | G4 | Host precondition re-observation (free RAM, free disk, privileges, installed tools); forwarded host values are reported and unbound | Local | bound receipts | S2 | host-read inside the S2 preflight |
| OB-27 | G4 | Money and time ceilings: zero paid spend and per-stage time confirmation (OI-10) | operator | confirmation | S3 onward | admission row |
| OB-28 | X | Historical STOP: metadata chain ordinal 2 counters 0/0/1/2; source-contract chain successor 1; no reset, no successor | Local | nothing to supply; retained | any successor | only an explicit new Local and operator disposition; outside S0 |
| OB-29 | X | Final storyboard and media acceptance is a separate operator checkpoint | operator | acceptance | S8; S9 | operator acceptance after S7 |

## Finite Stage Admission Proposal

Proposal only. No stage is released, and S0 acceptance does not release any. Each admission must name exact commands, paths, bytes, time, money (zero paid spend proposed) and rollback.

| Stage | Effect | Exact scope | Owner | Release condition | State |
|---|---|---|---|---|---|
| S1 | control helper source authoring and independent review | source files only, no host effect, no execution; exact new paths to be named by the admission | operator (admission, boundary disposition); Local reviewer | OB-22 boundary disposition | HELD_NOT_RELEASED |
| E1 | public metadata and text reads (GET or HEAD) | candidate hosts huggingface.co, files.pythonhosted.org, registry.npmjs.org, storage.googleapis.com, api.github.com, raw.githubusercontent.com; proposed caps 160 requests and 16 MiB decoded, no credentials, no redirect following; closes OB-05, 06, 09, 10, 11, 12, 13, 17 | operator (admission); Local | exact host list and caps in an admission | HELD_NOT_RELEASED |
| S2 | owned root, control fixtures, optional outbound rule | creates the owned root, runs fixtures FX-D1, FX-M1, FX-T1, FX-B1, FX-N1, FX-L1; may change security or network state; privileges unknown; rollback from a verified before-state | operator (effects, privileges, root path); Local | OB-19, OB-20, OB-21, OB-22, OB-24, OB-26 | HELD_NOT_RELEASED |
| S3 | acquisition of exact manifest artifacts | URLs, revisions, byte ceilings, hashes and redirect map per artifact; ingress ceiling proposal 2 GiB; zero paid spend; staged cache tree for O1 | operator (admission); Local | S2 proof, E1 result, OB-02, OB-03, OB-07, OB-08 dispositions | HELD_NOT_RELEASED |
| S4 | offline setup and archive listing | extraction-only into the owned root, lifecycle scripts disabled, venv from the existing interpreter, hash-pinned offline wheel install | operator; Local | S3 completed; OB-10, OB-17 reviewed | HELD_NOT_RELEASED |
| S5 | binary identity inspection | FFmpeg encoder list and browser version run under the S2 controls | operator; Local | S4 completed; OB-11, OB-12 dispositions | HELD_NOT_RELEASED |
| S6 | one fixed-preset WAV | one sequential voice attempt; needs preset consent disposition and a nominated Vietnamese listener | operator | OB-07, OB-08, OB-14; O1 proof OB-01 | HELD_NOT_RELEASED |
| S7 | one S05 render | one attempt after the voice process tree has exited; retiming approval if narration exceeds 19.5 s | operator | S6 accepted; OB-13, OB-14 | HELD_NOT_RELEASED |
| S8 | joined human acceptance (CF-63) | human review of the joined MP4 | operator | S7 completed | HELD_NOT_RELEASED |
| S9 | publication | not admitted; separate rights and public-export review | operator | not applicable now | HELD_NOT_RELEASED |

## Historical STOP And Boundary Preservation

| Identity | Retained value |
|---|---|
| metadata chain | problemKey cvf-ncr-c1-metadata-footprint, ordinal 2, disposition STOP, blocker C1_DEPENDENCY_FOOTPRINT_CACHE_SEMANTICS_UNSPECIFIED, counters 0/0/1/2 (selection evidence historicalStop; D109 snapshot ordinal 1 counters 0/0/1/1) |
| source-contract chain | successor 1 with its counters; relay review disposition REVIEW_COMPLETE_RELAY_STOP_SOURCE_CLOSURE_WITHHELD, workerRedispatchAllowed NO, FEATURE_SUCCESSORS_FROZEN, cluster s05-s1-source-contract-validation-custody |
| kit chain | cvf-ncr-video-preflight-kit-construction, INITIAL ordinal 0 |
| this S0 | cvf-ncr-c1-operator-selected-readiness-contract, INITIAL ordinal 0, current blocker C1_EFFECT_ADMISSION_MISSING (a production hold) |

O1 source facts predate the STOP and cannot resolve it. No counter is reset, no chain renamed, no supervisor source or recursive relay successor is admitted, and source-supervisor acceptance stays withheld.

## S05 And Storyboard Preservation

The storyboard `docs/reference/CVF_NCR_GENERAL_VIDEO_DESIGN_2026-10-02.md` raw sha256 3ce5e2363c3e29997fcbf42cb4cec59af7447cca38409d4d970e8aa71e5777e0 MATCH the kit and the selection sources. The existing extraction CLI (read-only) returned narration f6c1cd46a00b535e07dc634bcb53d75dc80ed521a58432de8c5b449cf4017fb8 (314 B), on-screen 0846e61c1a38e8468152a6df998e58b07e143a91f5d8d821ffb5c1ba77c2eede (345 B), status card ec3a424cb9b37d3ba630771347c60547b95275ce50900ab73bd8bb17463d3c25, claim IDs C09 and C10, four frame segments; all MATCH the kit. Measured narration is NOT_MEASURED; the 19.5 s pad limit and 20 s estimate are retained design values. No text, timing or claim ID is altered here.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | INTERNAL_AGENT shared-workspace documentary worker |
| Provider or surface | private Local workspace via IDE session; zero provider invocations |
| Session or invocation | cvf-ncr-c1-offline-s0-worker-20261008 |
| Working directory | D:/UNG DUNG AI/TOOL AI 2026/Controlled-Vibe-Framework-CVF |
| Command or tool surface | file reads, hash and arithmetic joins, scoped file writes, bound pre-implementation and return gates, existing read-only S05 CLI |
| Target paths | `docs/reference/CVF_NCR_C1_OFFLINE_PRODUCTION_READINESS_SPEC_2026-10-08.md`; `docs/reviews/evidence/cvf-ncr-c1-offline-production-readiness-worker-2026-10-08.json`; `docs/reviews/CVF_NCR_C1_OFFLINE_PRODUCTION_READINESS_WORKER_RETURN_2026-10-08.md` |
| Allowed scope source | docs/work_orders/CVF_AGENT_WORK_ORDER_NCR_C1_OFFLINE_PRODUCTION_READINESS_S0_2026-10-08.md |
| Before status evidence | git status --short empty at 726af3dabeb49213367d5c200e98fd194b0abc95 before any write |
| After status evidence | three untracked worker paths only; HEAD unchanged |
| Diff evidence | git diff --name-status (empty, no tracked change); git status --short --untracked-files=all |
| Approval boundary | worker scope only; commit, closure and continuity deferred to Local reviewer and steward |
| Claim boundary | documentary S0 spec only |
| Agent type | INTERNAL_AGENT |
| Invocation ID | cvf-ncr-c1-offline-s0-worker-20261008 |
| Expected manifest | `docs/reference/CVF_NCR_C1_OFFLINE_PRODUCTION_READINESS_SPEC_2026-10-08.md`; `docs/reviews/evidence/cvf-ncr-c1-offline-production-readiness-worker-2026-10-08.json`; `docs/reviews/CVF_NCR_C1_OFFLINE_PRODUCTION_READINESS_WORKER_RETURN_2026-10-08.md` |
| Actual changed set | `docs/reference/CVF_NCR_C1_OFFLINE_PRODUCTION_READINESS_SPEC_2026-10-08.md`; `docs/reviews/evidence/cvf-ncr-c1-offline-production-readiness-worker-2026-10-08.json`; `docs/reviews/CVF_NCR_C1_OFFLINE_PRODUCTION_READINESS_WORKER_RETURN_2026-10-08.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletions or renames |

## Claim Boundary

Documentary S0 reconciliation only. No acquisition, install, import, model load, inference, TTS, WAV, MP4, host or policy change, provider or paid voice, cloning, upload, public or deploy effect occurred or is authorized. DECLARED_PINNED is not payload, rights, consent or enforcement proof; publisher declarations are recorded, not cleared; selected limits are ceilings, not measured use; proposals and fixtures are unexecuted; W-A and W-B are candidates. The old STOP identities and counters are retained and this spec is not production acceptance, rights clearance, offline proof or media acceptance. Public export: DEFERRED_PRIVATE_ONLY.

Text Encoding: this document is ASCII; Vietnamese source strings are referenced by hash only.

## Local Review Qualification

Accepted for documentary S0 by `docs/reviews/CVF_NCR_C1_OFFLINE_PRODUCTION_READINESS_COMPLETION_2026-10-08.md`. Historical helper source/inert fixtures were already statically reviewed in `docs/reviews/CVF_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_R1_LOCAL_REVIEW_2026-10-03.md`; acceptance is withheld and native methods are not admitted. This is not source/runtime successor permission or current host verification. OB-06 includes all four small hash-missing files; Local repaired these two evidence joins only. Original submission snapshots and reviewer probe bytes are retained in `docs/reviews/evidence/cvf-ncr-c1-offline-production-readiness-local-review-2026-10-08.json`.
