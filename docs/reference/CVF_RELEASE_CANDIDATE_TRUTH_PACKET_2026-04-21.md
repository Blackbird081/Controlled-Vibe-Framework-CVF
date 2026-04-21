# CVF Release Candidate Truth Packet

**Date:** 2026-04-21  
**Status:** RELEASE CANDIDATE — evidence-backed  
**Scope:** CVF core platform + provider lane + front-door product surface  

---

## Purpose

This document is the single authoritative record of what CVF has proven, what evidence exists, and what remains explicitly out of scope or unproven.

It is intended for: agent handoff, operator orientation, external reviewers, and demo preparation.

It is not marketing copy. Every claim here must be traceable to a receipt, a baseline delta, or a closed roadmap CP.

---

## Claim Boundary (verbatim — copy-paste safe)

> CVF proves governed AI-assisted software development.  
> Multi-provider operability is proven for Alibaba (qwen-turbo) and DeepSeek (deepseek-chat), both CERTIFIED by three consecutive canary runs (PASS 6/6 each).  
> Provider parity — speed, cost, quality, reliability — is not claimed.  
> Provider economics are user-selected.  
> CVF is not a production SaaS product. It is a local governance framework with a web UI for development and demonstration.

---

## What Is Proven

### 1. Non-Coder Value Path

| Item | Detail |
|---|---|
| Claim | A user with no coding background can create a governed app using CVF's front-door wizard |
| Evidence | Front-door rewrite waves closed (commits d9c7313b, 956a7609, 303517a2, bf28ed9b) |
| Surface | `/landing`, template gallery, intake wizard, AppBuilderWizard |
| Date closed | 2026-04-21 (W109 post-front-door canon sync) |

### 2. Front-Door Product Proof

| Item | Detail |
|---|---|
| Claim | CVF's front-door (landing + wizard + template gallery) is a coherent, operable product surface |
| Evidence | `docs/baselines/CVF_FRONT_DOOR_WAVE1_EXECUTION_NOTE_2026-04-21.md`, `CVF_FRONT_DOOR_WAVE2_EXECUTION_NOTE_2026-04-21.md` |
| Surface | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/landing/` |
| Date closed | 2026-04-21 |

### 3. Governed Risk / Approval Path

| Item | Detail |
|---|---|
| Claim | CVF classifies AI operations by risk level (R0–R3) and gates high-risk operations with an approval flow |
| Evidence | W87 High-Risk Guided Response + W88 UI realization (GC018 authorizations in `docs/baselines/`) |
| Surface | High-Risk Guided Response panel in agent task flow |
| Date closed | 2026-04-14 |

### 4. Multi-Provider Operability — Alibaba

| Item | Detail |
|---|---|
| Claim | CVF can route governed AI operations through Alibaba (DashScope / qwen-turbo) |
| Status | `CERTIFIED` |
| Certification window | 3 consecutive PASS 6/6 canary runs |
| Latest receipt | `docs/audits/alibaba-canary/CVF_RECEIPT_20260421-072551-422037.md` |
| Receipt index | `docs/audits/alibaba-canary/INDEX.md` |
| Date certified | 2026-04-21 (W110-T1 CP1) |

### 5. Multi-Provider Operability — DeepSeek

| Item | Detail |
|---|---|
| Claim | CVF can route governed AI operations through DeepSeek (deepseek-chat) |
| Status | `CERTIFIED` |
| Certification window | 3 consecutive PASS 6/6 canary runs |
| Latest receipt | `docs/audits/deepseek-canary/CVF_RECEIPT_20260421-114125-19515e.md` |
| Receipt index | `docs/audits/deepseek-canary/INDEX.md` |
| Date certified | 2026-04-21 (W110-CP4) |

### 6. Provider UX + Release Readiness Surface

| Item | Detail |
|---|---|
| Claim | Provider lane status (CERTIFIED / CANARY_PASS / EXPERIMENTAL / UNCONFIGURED / etc.) is visible in the product UI |
| Evidence | `docs/baselines/CVF_W110_T3_PROVIDER_LANE_UX_RELEASE_READINESS_DELTA_2026-04-21.md` |
| Surface | Settings.tsx, ProviderSwitcher.tsx — lane badges with pass window |
| Date closed | 2026-04-21 (W110-T3 CP1-CP4) |

### 7. Provider Readiness Toolchain

| Item | Detail |
|---|---|
| Claim | Operators can check provider lane readiness, run canaries, and evaluate certification without CVF code changes |
| Key scripts | `scripts/run_cvf_provider_live_canary.py`, `scripts/evaluate_cvf_provider_lane_certification.py`, `scripts/check_cvf_provider_release_readiness.py` |
| Operator docs | `docs/reference/CVF_PROVIDER_LANE_OPERATOR_RUNBOOK.md` |
| Status matrix | `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` |
| Date closed | 2026-04-21 (W110-T2/T3) |

---

## What Is Not Proven

These items are explicitly out of scope for this release candidate. They are not gaps or failures — they are honest scope boundaries.

| Limitation | Classification | Notes |
|---|---|---|
| Provider parity | Permanent boundary | Alibaba and DeepSeek pass CVF canaries. Speed, cost, quality, and reliability comparisons are not assessed by CVF. |
| Live provider credits | Permanent boundary | Keys are operator-supplied and never committed. Release-quality governance E2E requires `DASHSCOPE_API_KEY`; certification canaries also consume operator credits. |
| Playwright E2E full coverage | Closed for current release gate | Mock E2E is UI-only; live governance E2E is mandatory in `python scripts/run_cvf_release_gate_bundle.py --json`. |
| Legacy EXTENSIONS formal review | Open gap | Modules outside the core agent platform were not re-reviewed in W110 scope. |
| SaaS hosting / deployment | Permanent boundary | CVF is a local governance framework. There is no hosted service. |
| Token cost calibration | Open gap | Risk engine estimates token cost but does not calibrate against live provider billing data. |
| Universal model compatibility | Open gap | Only qwen-turbo and deepseek-chat have certification evidence. Other models are `EXPERIMENTAL` until canary-run. |

---

## Evidence Pointers

| Type | Location |
|---|---|
| Provider readiness matrix | `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` |
| Alibaba canary receipts | `docs/audits/alibaba-canary/INDEX.md` |
| DeepSeek canary receipts | `docs/audits/deepseek-canary/INDEX.md` |
| W110-T3 baseline delta | `docs/baselines/CVF_W110_T3_PROVIDER_LANE_UX_RELEASE_READINESS_DELTA_2026-04-21.md` |
| W110-T2 baseline delta | `docs/baselines/CVF_W110_T2_PROVIDER_LANE_CERTIFICATION_DELTA_2026-04-21.md` |
| Front-door wave notes | `docs/baselines/CVF_FRONT_DOOR_WAVE1_EXECUTION_NOTE_2026-04-21.md`, `..WAVE2..` |
| Operator runbook | `docs/reference/CVF_PROVIDER_LANE_OPERATOR_RUNBOOK.md` |
| Known limitations register | `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md` |
| Demo script | `docs/guides/CVF_DEMO_SCRIPT_2026-04-21.md` |

---

## Release Scope

This release candidate covers:

- CVF core governance framework (ECOSYSTEM, governance/, docs/)
- CVF Web UI platform (`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/`)
- Provider lane certification toolchain (Alibaba, DeepSeek)
- Front-door product surface (landing, wizard, template gallery)
- Guard Contract SDK (`EXTENSIONS/CVF_GUARD_CONTRACT/`)

This release candidate does not cover:

- Full production deployment infrastructure
- External SaaS access or hosted environment
- Providers beyond Alibaba and DeepSeek (Anthropic is the default, always present)
- Legacy EXTENSIONS outside the agent platform scope

---

## How To Use This Packet

**For demo preparation:** use the claim boundary verbatim. Use the evidence pointers to answer "how do you know?" questions.

**For agent handoff:** cite this file as the milestone truth source. Do not derive milestone state from git log alone — receipts and baselines are the ground truth.

**For external sharing:** the claim boundary block is copy-paste safe. Redact any internal path that contains credentials before sharing full file.

**For future waves:** when a new milestone closes, add a row to the "What Is Proven" table and update or remove the corresponding row in "What Is Not Proven" if applicable.

---

*Filed: 2026-04-21 — RC truth packet for post-provider-lane closure state*
