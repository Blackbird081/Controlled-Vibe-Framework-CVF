# CVF Known Limitations Register

Memory class: FULL_RECORD

Status: CURRENT PUBLIC LIMITATIONS REGISTER

**Date:** 2026-04-21 (updated 2026-04-21 — L-003 + L-008 closed by E2E stabilization wave)  
**Scope:** CVF Release Candidate — post-provider-lane closure  
**Classification:** Permanent boundary / Open gap  

---

## Purpose

This register is an honest, public-safe accounting of what CVF does not prove, what is explicitly out of scope, and what remains open for future waves.

It exists to prevent two failure modes:

1. **Overclaim** — treating unproven items as proven facts in demos, docs, or handoffs.
2. **Underclaim** — listing gaps that are actually closed, making CVF look less capable than it is.

Every entry must reflect actual current state. Aspirational items do not belong here.

## Scope

This register covers public-safe limitations and closed limitation entries that
shape CVF release-candidate claim boundaries. It does not contain private raw
run logs, handoffs, or unpublished provider-key material.

## Claim Boundary

This file permits honest limitation disclosure only. A limitation may be removed
or closed only when a later evidence packet proves the change and updates the
public claim boundary.

Classification key:

- **Permanent** — will not change without a deliberate architecture decision. Not a deficiency.
- **Open** — known gap; may be closed in a future wave. Not hidden; just not yet addressed.

## Source

Predecessor evidence anchors:

- `docs/evidence/current-cvf-quality-status.md`
- `docs/evidence/latest-release-gate.md`
- `docs/evidence/provider-lanes.md`
- `docs/evidence/claim-boundaries.md`
- internal wave packets preserved in the provenance archive

## Requirements

Every register entry must:

- carry a unique `L-NNN` ID;
- declare classification (`Permanent` or `Open`);
- name the affected area;
- state the limitation in public-safe language;
- cite the evidence anchor that supports the entry;
- record closure date and closure receipt when an entry moves to closed.

## Enforcement

This register is treated as the authoritative public limitations source.
Public documents and external communication may not contradict an open
entry. Closing an entry requires fresh evidence under `docs/evidence/` and
a dated update to this file.

## Related Artifacts

- `docs/evidence/claim-boundaries.md`
- `docs/evidence/current-cvf-quality-status.md`
- `docs/benchmark/quality-benchmark-suite-methodology.md`
- `docs/benchmark/qbs-1/README.md`

---

## Limitations Register

### L-001 — Provider Parity Not Claimed

| Field | Value |
| --- | --- |
| Classification | Permanent |
| Area | Multi-provider operability |
| Statement | Alibaba (qwen-turbo) and DeepSeek (deepseek-chat) both pass CVF's governed canary suite. CVF does not assess or claim parity between providers on speed, cost, output quality, reliability, or rate limits. |
| Why permanent | Provider economics are owned by the provider, not by CVF. Attempting to claim or enforce parity would misrepresent the architecture. |
| Evidence | `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` — operator notes per provider |

---

### L-002 — Live Provider Credits Are Operator-Supplied

| Field | Value |
| --- | --- |
| Classification | Permanent |
| Area | CI / provider testing |
| Statement | CVF never commits provider API keys. Certification canaries consume the operator's own provider credits, and release-quality governance E2E now requires an operator-supplied live key (`DASHSCOPE_API_KEY`). Mock mode is valid only for UI structure checks. |
| Why permanent | Paid provider access must remain operator-controlled, while CVF governance claims require live execution evidence. A missing live key is therefore a release-gate failure, not a successful mock fallback. |
| Operator path | `python scripts/run_cvf_release_gate_bundle.py --json` for mandatory live governance E2E; `python scripts/run_cvf_provider_live_canary.py --provider alibaba --save-receipt` for lane certification receipts |

---

### L-003 — Playwright E2E Coverage Has Known Drift — **CLOSED 2026-04-21**

| Field | Value |
| --- | --- |
| Classification | Closed |
| Area | Test coverage |
| Closure | `tests/e2e/provider-lane-ui.spec.ts` (4 tests) added — provider lane badges + no-parity-language assertions cover W110-T3 surfaces. Release-gate mock E2E now runs the current UI-structure specs under `playwright.config.mock.ts`; obsolete exact-mock-response agent flow checks are excluded from the gate. Drift repaired in CP1 (config split + drift audit). |
| Evidence | E2E Proof & Regression Stabilization roadmap — CP1 + CP3 DELIVERED 2026-04-21. Delta: `docs/baselines/CVF_E2E_PROOF_STABILIZATION_DELTA_2026-04-21.md`. |

---

### L-004 — Legacy EXTENSIONS Not Re-Reviewed in W110 Scope

| Field | Value |
| --- | --- |
| Classification | Open |
| Area | Extension coverage |
| Statement | CVF contains 36+ extension modules. The W110 tranche focused on the core agent platform (`CVF_v1.6_AGENT_PLATFORM`) and provider lane toolchain. Older extensions (e.g., `CVF_ECO_v1.0`–`v1.4`, `CVF_v1.7`–`v1.9`) were not formally re-reviewed in this tranche. |
| Impact | Those extensions retain their last formal review state. No regression is claimed or denied; they are simply outside the current scope boundary. |
| Future action | Targeted extension health review in a future tranche if those modules are activated. |

---

### L-005 — No SaaS Hosting or Deployed Infrastructure

| Field | Value |
| --- | --- |
| Classification | Permanent |
| Area | Deployment / access |
| Statement | CVF is a local governance framework. There is no hosted service, shared cloud deployment, or public URL where CVF can be accessed without cloning the repository. |
| Why permanent | CVF is not designed as a SaaS product. It is a framework for governing AI-assisted development within a team's own environment. |
| Quick start | `git clone … && cd cvf-web && npm ci && npm run dev` → `http://localhost:3000` |

---

### L-006 — Token Cost Estimation Not Calibrated Against Live Billing

| Field | Value |
| --- | --- |
| Classification | Open |
| Area | Risk engine / cost awareness |
| Statement | The CVF risk engine estimates token cost and classifies operations by resource intensity. However, these estimates are not calibrated against live provider billing data. Actual cost may differ from estimated cost per provider. |
| Impact | Cost classification is directionally correct (low / medium / high) but not numerically precise. Operators should verify actual cost with their provider dashboard. |
| Future action | Calibration pass using canary receipt data if cost precision becomes a product requirement. |

---

### L-007 — Only Two Providers Have Certification Evidence

| Field | Value |
| --- | --- |
| Classification | Open |
| Area | Provider coverage |
| Statement | Alibaba (qwen-turbo) and DeepSeek (deepseek-chat) are the only providers with `CERTIFIED` status. All other provider integrations that may exist (OpenAI, Gemini, etc.) are `EXPERIMENTAL` until a full CVF canary suite is run and receipts are saved. |
| Impact | Operators who wish to use other providers must run the canary suite against those providers before claiming CVF-governed operability. |
| Path to certify | `python scripts/run_cvf_provider_live_canary.py --provider <name> --save-receipt` (3× consecutive PASS required) |

---

### L-008 — Full E2E Non-Coder Path Not Automated End-to-End — **CLOSED 2026-04-21**

| Field | Value |
| --- | --- |
| Classification | Closed |
| Area | Non-coder value validation |
| Closure | `tests/e2e/noncoder-governance-live.spec.ts` covers landing → template gallery → intake wizard structure, then real Alibaba `qwen-turbo` output through `/api/execute`. The live proof asserts governance metadata (`guardResult`, `outputValidation`, `providerRouting`) rather than exact AI text. Phase-gated/full-mode UI behavior is not used as live-output proof because it can correctly stop before provider execution. |
| Evidence | E2E Proof & Regression Stabilization roadmap — CP2 DELIVERED 2026-04-21. Delta: `docs/baselines/CVF_E2E_PROOF_STABILIZATION_DELTA_2026-04-21.md`. |

---

## How to Use This Register

**For demo preparation:** acknowledge open gaps proactively; do not wait for them to be discovered. Be explicit that Alibaba and DeepSeek are certified while other providers remain experimental until canary-run. L-003 and L-008 are now closed.

**For agent handoff:** cite this register when scoping the next wave. Closed items such as L-003 and L-008 must not be reopened unless fresh evidence shows new drift.

**For future waves:** when a limitation is closed, update its entry to `Closed` with a date and evidence pointer, or remove it from this register entirely. Do not let closed gaps accumulate here.

---

## Update Path

When a new limitation is discovered:

1. Add an entry with a new `L-NNN` identifier (incrementing from last entry).
2. Classify as `Permanent` or `Open`.
3. Include: area, statement, impact, and (for Open) future action.
4. Link from `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md` if it materially changes the claim boundary.

When a limitation is closed:

1. Remove the entry from the active register.
2. Note the closure in the relevant baseline delta.

---

*Filed: 2026-04-21 — RC known limitations register, post-provider-lane closure*
