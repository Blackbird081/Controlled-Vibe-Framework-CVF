# CVF EAFR-R4 Private Provider Current Claim Manifest

Memory class: FULL_RECORD

docType: reference

Status: COMPLETE_PENDING_REVIEW

Date: 2026-08-25

## Purpose

Enumerate every active private provider-current claim projection reconciled by
EAFR-R4, record the exact classification of every claim surface searched, and
preserve the boundary between current certification status and historical
proof. This manifest is the private completeness record required by
`docs/work_orders/CVF_AGENT_WORK_ORDER_EAFR_R4_PRIVATE_PROVIDER_CURRENT_CLAIM_MANIFEST_RECONCILIATION_2026-08-25.md`
and its paired baseline
`docs/baselines/CVF_GC018_EAFR_R4_PRIVATE_PROVIDER_CURRENT_CLAIM_MANIFEST_RECONCILIATION_2026-08-25.md`.

## Scope / Applies To

Applies to the exact eleven-path EAFR-R4 worker manifest only: the five active
outward documents (`README.md`, `ARCHITECTURE.md`, Quick Orientation, Demo
Script, Known Limitations Register), the two runtime/UI provider projections
and their two test files, this manifest, and the worker return. Does not
apply to the canonical readiness matrix, any historical receipt or evidence
packet, prior baselines/work orders/reviews/roadmaps, session state,
environment, keys, packages, the public-sync clone, or any generated state.

## Target / Source

Target: the private current-claim projection surfaces named above.

Source authority: `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` (the
canonical model-specific readiness owner), read and hashed unchanged at
`c7a2ece2ccabdf4d74423b8ddbec6c688558e6f04c2f2cba152a9eaf24169460`.

## Provider Current Status Contract

| Provider/model | No key configured | Configured |
| --- | --- | --- |
| Alibaba `qwen-flash` | `UNCONFIGURED` | `EXPERIMENTAL` (fresh live proof pending; historical Alibaba receipts do not transfer to this current model) |
| DeepSeek `deepseek-chat` | `UNCONFIGURED` | `CERTIFIED` (current accepted three-run canary evidence) |
| OpenAI `gpt-4o-mini` | `UNCONFIGURED` | `EXPERIMENTAL` (historical receipts retained; current promotion held under R65 Option B; do not reverse) |
| other configured integrations | `UNCONFIGURED` | `EXPERIMENTAL` (default; integration or key presence is not certification) |

`readiness: live_task_ready` describes configuration only, never
certification. The canonical readiness matrix and all historical receipts
remain read-only inputs; this manifest does not alter either.

## Required Searches Performed

Search roots per the work order's `## Required Searches`: `README.md`,
`ARCHITECTURE.md`, active `docs/reference` (excluding `docs/reference/archive/`
and files owned by other closed tranches), `docs/guides`, and non-test
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src` source. Commands used:
targeted `grep`/`rg` for `alibaba`, `deepseek`, `openai`, `qwen`, `gpt-4o`,
and `certified` (case-insensitive) across those roots, followed by a
proximity-scoped re-check for `alibaba` within 60 characters of `certif` to
separate a current-tense claim from a historical/experimental-qualified one.

## Active Projection Manifest

| # | Path | Hit(s) | Disposition |
| --- | --- | --- | --- |
| 1 | `README.md` line 14 (shields.io badge) | `Alibaba CERTIFIED \| DeepSeek CERTIFIED` | EDIT_TO_CURRENT - corrected to `Alibaba EXPERIMENTAL \| DeepSeek CERTIFIED` |
| 2 | `README.md` line 111 (Current Live-Proof Boundary) | current-tense "Alibaba/DashScope is the primary certified release lane" | EDIT_TO_CURRENT - reworded to state the certification as historical on the prior model, current `qwen-flash` target `EXPERIMENTAL` pending fresh proof, DeepSeek named the current certified lane |
| 3 | `README.md` line 272 (Local Dev provider proof note) | current-tense "the current certified release lane is Alibaba/DashScope" | EDIT_TO_CURRENT - corrected to name DeepSeek as the current certified lane and Alibaba `qwen-flash` as `EXPERIMENTAL` |
| 4 | `README.md` lines 176, 339 | already state Alibaba targets `qwen-flash` pending fresh proof, DeepSeek certified | ALREADY_ALIGNED_NO_EDIT |
| 5 | `ARCHITECTURE.md` line 5 (front-door readout) | "certified Alibaba + DeepSeek provider lanes" | EDIT_TO_CURRENT - corrected to a certified DeepSeek lane plus an `EXPERIMENTAL` Alibaba `qwen-flash` target |
| 6 | `ARCHITECTURE.md` line 143 (diagram node label) | "Certified provider lane / Alibaba primary / DeepSeek bounded" | EDIT_TO_CURRENT - corrected to name DeepSeek certified and Alibaba experimental with fresh proof pending |
| 7 | `ARCHITECTURE.md` line 162 (diagram note) | "Alibaba/DashScope is the primary certified release lane" | EDIT_TO_CURRENT - reworded to name DeepSeek as the current certified lane and Alibaba as historically certified on a prior model, now `EXPERIMENTAL` |
| 8 | `ARCHITECTURE.md` lines 21, 259 | already state Alibaba targets `qwen-flash` pending fresh proof, DeepSeek `CERTIFIED` | ALREADY_ALIGNED_NO_EDIT |
| 9 | `docs/guides/CVF_QUICK_ORIENTATION.md` line 8 (status banner) | "Alibaba CERTIFIED - DeepSeek CERTIFIED" | EDIT_TO_CURRENT - corrected to DeepSeek certified, Alibaba experimental pending fresh proof |
| 10 | `docs/guides/CVF_QUICK_ORIENTATION.md` line 93 (phase table) | "Alibaba + DeepSeek certified lanes" | EDIT_TO_CURRENT - corrected to DeepSeek certified lane, Alibaba `qwen-flash` experimental pending fresh proof |
| 11 | `docs/guides/CVF_DEMO_SCRIPT_2026-04-21.md` line 151 (Path C description) | "Alibaba and DeepSeek are both CERTIFIED" | EDIT_TO_CURRENT - corrected to DeepSeek certified, Alibaba experimental (historical receipt does not transfer) |
| 12 | `docs/guides/CVF_DEMO_SCRIPT_2026-04-21.md` line 218 (what-to-avoid-saying script) | "Alibaba and DeepSeek are certified" | EDIT_TO_CURRENT - corrected to "DeepSeek is certified; Alibaba's current target ... experimental" |
| 13 | `docs/guides/CVF_DEMO_SCRIPT_2026-04-21.md` lines 21, 25, 143-171, 194-230 | already qualify certification per-provider or reference the readiness matrix directly | ALREADY_ALIGNED_NO_EDIT |
| 14 | `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md` line 125 (demo-prep guidance) | "Alibaba and DeepSeek are certified" | EDIT_TO_CURRENT - corrected to state DeepSeek certified, Alibaba `qwen-flash` experimental pending fresh proof |
| 15 | `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md` lines 35, 106 (L-001, L-007) | already state Alibaba's current target awaits fresh proof and DeepSeek remains certified | ALREADY_ALIGNED_NO_EDIT |
| 16 | `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md` line 49 | `run_cvf_provider_live_canary.py --provider alibaba --save-receipt` runbook command reference | NOT_PROVIDER_CERTIFICATION_WITH_REASON - a command invocation naming a provider argument, not a status assertion |
| 17 | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/providers/route.ts` `KNOWN_LANE_STATUS` map | Alibaba/OpenAI `CERTIFIED` | EDIT_TO_CURRENT - Alibaba and OpenAI changed to `EXPERIMENTAL`; DeepSeek kept `CERTIFIED` |
| 18 | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/provider-lane-metadata.ts` `PROVIDER_LANE_EVIDENCE` map | Alibaba/OpenAI `status: 'CERTIFIED'` | EDIT_TO_CURRENT - Alibaba and OpenAI changed to `EXPERIMENTAL` with corrected label/passWindow/note; DeepSeek kept `CERTIFIED` |
| 19 | `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` (canonical owner) | already current and correct | VERIFIED_NO_EDIT (forbidden to edit; canonical owner) |
| 20 | `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md` | already current and correct | VERIFIED_NO_EDIT |
| 21 | `docs/CVF_CORE_KNOWLEDGE_BASE.md` | already current and correct | VERIFIED_NO_EDIT |
| 22 | `docs/reference/CVF_LIVE_EVIDENCE_PUBLICATION_PACKET_2026-04-21.md` | dated historical evidence packet | HISTORICAL_PRESERVE - explicitly excluded by the work order and baseline |
| 23 | `docs/reference/CVF_W114_PUBLIC_EVIDENCE_PACKET_2026-04-23.md` | dated historical evidence packet | HISTORICAL_PRESERVE - explicitly excluded by the work order and baseline |
| 24 | `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` line 118 | "certified only where evidence exists" plus links to the Alibaba/DeepSeek canary index | ALREADY_ALIGNED_NO_EDIT - qualified, no unconditional Alibaba-certified claim |
| 25 | `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` lines 121, 142-146, 239 | "certified" describing skill packs and `cvf-certified-skill-pack-registry.json` | NOT_PROVIDER_CERTIFICATION_WITH_REASON - generic skill-package certification vocabulary unrelated to a provider lane |
| 26 | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SkillDetailView.tsx`; `SkillLibrary.tsx` | `assfProjectionClass === 'CERTIFIED_PACKAGE_PROJECTION'` | NOT_PROVIDER_CERTIFICATION_WITH_REASON - skill-package projection class, not a provider lane status |
| 27 | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/phase2c-product-brief-slice.ts` | `PHASE_2C_CERTIFIED_CAPABILITY_REFS` | NOT_PROVIDER_CERTIFICATION_WITH_REASON - a capability-reference constant name, not a provider lane status |
| 28 | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/provider-lane-status.ts` | `LANE_STATUSES` enum and `classifyFromReceipts` classifier | VERIFIED_NO_EDIT - the shared status taxonomy and receipt-window classifier; not a per-provider current-claim projection and not in the writable manifest |
| 29 | `docs/guides/CVF_5_MINUTE_RC_SETUP.md`; `docs/guides/CVF_DEPLOY_GUIDE.md`; `docs/guides/enterprise.md`; `docs/guides/solo-developer.md`; `docs/guides/CVF_GENERIC_MCP_ADAPTER_INTEGRATION_GUIDE_2026-05-31.md` | environment-variable names, CLI command examples, generic provider-name mentions | NOT_PROVIDER_CERTIFICATION_WITH_REASON - configuration/setup references with no adjacent status assertion |

Zero unmapped: every hit found by the Required Searches is classified above.

## Verified-Aligned No-Edit Manifest

| Path | Reason |
| --- | --- |
| `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` | canonical status owner; already states the exact contract; forbidden to edit |
| `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md` | already aligned to current provider boundary; outside writable manifest |
| `docs/CVF_CORE_KNOWLEDGE_BASE.md` | already aligned; structurally exempt from markdown completeness checks and outside writable manifest |
| `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` | qualified wording only; outside writable manifest |
| `README.md` lines 176, 339; `ARCHITECTURE.md` lines 21, 259; `docs/guides/CVF_DEMO_SCRIPT_2026-04-21.md` lines 21, 25, 143-171, 194-230; `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md` lines 35, 106 | already state the correct current contract inside the five writable docs; edited only where the same file also carried a stale statement elsewhere |

## Historical Evidence Exclusion Manifest

Not read for edit or altered: `docs/reference/CVF_LIVE_EVIDENCE_PUBLICATION_PACKET_2026-04-21.md`,
`docs/reference/CVF_W114_PUBLIC_EVIDENCE_PACKET_2026-04-23.md`, every prior
baseline, work order, review, and roadmap, every dated receipt under
`docs/audits/`, `docs/evidence/`, and `docs/assessments/`, session state,
and the public-sync clone. W149 (40/40 direct API, 40/40 browser UI,
12/12 DeepSeek confirmatory) and W152 (`7/7` release gate PASS) dated
historical results remain stated as historical facts in `README.md`; no
dated historical result was deleted or reframed as a current claim.

## Non-Certification Classification Rationale

A hit is `NOT_PROVIDER_CERTIFICATION_WITH_REASON` when it names a provider or
uses the word "certified" without asserting that provider's current lane
status: environment-variable names, CLI/script invocation examples, generic
skill-package or capability-reference vocabulary (`CERTIFIED_PACKAGE_PROJECTION`,
`cvf-certified-skill-pack-registry.json`, `PHASE_2C_CERTIFIED_CAPABILITY_REFS`),
and the shared `LaneStatus` type/classifier that computes status from receipts
generically rather than asserting one. None of these make or imply a
provider-current-certification claim, so none required edit.

## Source Verification

| Claimed item | Source file | Verified line/section | Disposition |
| --- | --- | --- | --- |
| canonical model-specific statuses | `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` | Provider Readiness table, rows for Alibaba/DeepSeek/OpenAI | ACCEPT |
| stale README badge and prose | `README.md` | lines 14, 111, 272 (pre-edit) | ACCEPT (repaired) |
| stale ARCHITECTURE prose and diagram | `ARCHITECTURE.md` | lines 5, 143, 162 (pre-edit) | ACCEPT (repaired) |
| stale Quick Orientation banner and table | `docs/guides/CVF_QUICK_ORIENTATION.md` | lines 8, 93 (pre-edit) | ACCEPT (repaired) |
| stale Demo Script Path C wording | `docs/guides/CVF_DEMO_SCRIPT_2026-04-21.md` | lines 151, 218 (pre-edit) | ACCEPT (repaired) |
| stale Known Limitations demo-prep note | `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md` | line 125 (pre-edit) | ACCEPT (repaired) |
| stale runtime lane-status map | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/providers/route.ts` | `KNOWN_LANE_STATUS` | ACCEPT (repaired) |
| stale UI evidence map | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/provider-lane-metadata.ts` | `PROVIDER_LANE_EVIDENCE` | ACCEPT (repaired) |

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | delegated no-commit provider-claim reconciliation worker |
| Provider or surface | local private provenance repository |
| Session or invocation | EAFR-R4 private provider current claim manifest reconciliation, 2026-08-25 |
| Working directory | repository root and `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web` |
| Command or tool surface | file read/edit tools; `sha256sum`; `rg`/`grep`; `git status`; `git diff`; `git rev-parse`; `git merge-base`; `npx vitest run`; `npm run check`; `npm run test:run`; `python governance/compat/run_worker_return_fast_gate.py` |
| Target paths | the exact eleven-path manifest named in the work order's Write Ownership section |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_EAFR_R4_PRIVATE_PROVIDER_CURRENT_CLAIM_MANIFEST_RECONCILIATION_2026-08-25.md`, Authority And Scope and Write Ownership sections |
| Before status evidence | clean worktree at HEAD `1041747fe484e1deeba4721ef7ce3e6672eca03d`; empty staging; all 12 pinned hashes matched; both new output paths absent |
| After status evidence | `git status --short --untracked-files=all` shows exactly nine modified tracked paths plus two untracked new paths (this manifest and the worker return); HEAD unchanged; nothing staged |
| Diff evidence | `git diff --name-status` shows exactly the nine modified tracked paths listed in the worker return's Changed Files section |
| Approval boundary | exact eleven-path private local reconciliation under `WORKER_MUST_NOT_COMMIT` |
| Claim boundary | no runtime, live, provider, network, credential, deployment, public-sync, or production claim; no closure claim |
| Agent type | worker |
| Invocation ID | `eafr-r4-private-provider-current-claim-manifest-reconciliation-worker-2026-08-25` |
| Expected manifest | the exact eleven paths in the work order's Write Ownership section |
| Actual changed set | matches exactly; see the worker return's Changed Files section |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename occurred |

## Epistemic Process Block

Epistemic Process Applicability: HIGH_EVIDENCE

Expected Result / Prediction: per the baseline's Current Runtime Freshness
Verification, direct search of the five active docs, the two runtime
projections, and the canonical readiness matrix was expected to find stale
current-tense "Alibaba CERTIFIED" claims in outward prose and both Web
projections, while the readiness matrix, the RC truth packet, and the core
knowledge base stayed aligned to the accepted current contract.

Evidence Comparison: the prediction held. Eleven stale current-tense Alibaba
certification statements were found across `README.md` (lines 14, 111, 272),
`ARCHITECTURE.md` (lines 5, 143, 162), `docs/guides/CVF_QUICK_ORIENTATION.md`
(lines 8, 93), `docs/guides/CVF_DEMO_SCRIPT_2026-04-21.md` (lines 151, 218),
and `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md` (line 125),
plus both runtime projections' static maps. The canonical readiness matrix,
release-candidate truth packet, and core knowledge base carried no drift.

Contradiction or Gap Disposition: no contradiction between the work order's
prediction and the observed corpus. One nuance not spelled out in the packet
was found and recorded: several lines inside the same five files already
carried the correct current contract (e.g. `README.md` lines 176, 339), so
each file needed a targeted line-level repair rather than a uniform rewrite.

Claim Update: every enumerated active provider-current claim surface now
states DeepSeek `deepseek-chat` as the current certified lane and Alibaba
`qwen-flash` (plus OpenAI `gpt-4o-mini`) as `EXPERIMENTAL` pending fresh
proof, while every historical W149/W152 result and receipt reference remains
stated as a historical fact, not a current claim.

## Public Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reconciliation record; no public-sync authority
is exercised or claimed by this manifest.

## Claim Boundary

This manifest records only a private, bounded reconciliation of the exact
provider-current claim projections named in the EAFR-R4 work order and
baseline. It makes no live/provider/network call, no credential access, no
fresh certification, no canonical-matrix edit, no historical-evidence edit,
no public-sync, deployment, or production readiness claim. It does not close
EAFR-R4; the independent reviewer owns closure and any material commit.
