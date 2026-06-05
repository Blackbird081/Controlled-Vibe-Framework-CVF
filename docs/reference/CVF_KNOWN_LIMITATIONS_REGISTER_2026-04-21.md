# CVF Known Limitations Register

Memory class: POINTER_RECORD

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

Classification key:

- **Permanent** — will not change without a deliberate architecture decision. Not a deficiency.
- **Open** — known gap; may be closed in a future wave. Not hidden; just not yet addressed.

## Scope / Target / Owner Boundary

Target: public-safe limitations that affect GitHub readers, demos, external
agents, and public capability claims.

Owner boundary: this register is a curated public documentation surface. It
does not mirror private provenance, raw handoffs, raw provider transcripts, or
internal roadmap queues.

## Owner / Source

Owner: CVF public documentation surface.

Source: public-safe evidence packets, public source paths, and public claim
boundaries.

## Protocol / Contract / Requirements

Each limitation must state whether it is `Permanent`, `Open`, or `Closed`, name
its affected area, and preserve an explicit impact or future-action boundary.
New limitations must not create new runtime or provider claims by implication.

## Enforcement / Verification

Before publishing updates to this register, run the public documentation checks:

```bash
python governance/compat/check_docs_governance_compat.py
python governance/compat/check_markdown_structural_completeness.py --all-changed --enforce
python scripts/check_public_surface.py
```

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

### L-009 — Public Route Coverage Is Evidence-Linked, Not File-Inferred

| Field | Value |
| --- | --- |
| Classification | Open |
| Area | Public route coverage / external review |
| Statement | Public API route files may exist without a public evidence packet proving that each route is governed, authenticated, durable, or production-ready. Public review must classify route coverage by linked evidence, tests, and explicit claim text, not by file names or governance-related words inside a route. |
| Impact | External agents should report missing route evidence as a bounded coverage gap instead of assuming every route is governed or production-ready. |
| Future action | Add route-level public coverage evidence or caveats when a route is promoted into a public governance claim. |
| Boundary | `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`; `docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md` |

---

### L-010 — Static CI Is Public Hygiene, Not Live Governance Proof

| Field | Value |
| --- | --- |
| Classification | Permanent |
| Area | CI / release evidence |
| Statement | Public CI and static gates can check docs, source hygiene, guard compatibility, and build posture without consuming provider secrets. They do not prove live governance behavior. Release-quality governance claims still require the protected live release gate with operator-supplied provider credentials. |
| Why permanent | Live provider quota and keys must remain operator-controlled, while public CI should remain safe to run on ordinary pushes and pull requests. |
| Operator path | `python scripts/run_cvf_release_gate_bundle.py --json` or the protected live release-gate workflow with explicit quota confirmation. |
| Boundary | `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`; `docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md` |

---

### L-011 — No Public Default Database Or Distributed Audit Backend Claim

| Field | Value |
| --- | --- |
| Classification | Open |
| Area | Evidence durability / audit storage |
| Statement | Public CVF evidence durability claims are local-first and bounded unless a public evidence path names a live external backend, migration proof, and distributed recovery proof. The public repository must not be read as claiming a default production database, live Redis backend, multi-instance consensus, tamper-proof audit log, or distributed retention readiness. |
| Impact | External agents should classify missing database/distributed audit proof as an open bounded limitation, not as hidden proof and not as a contradiction when docs say CVF is evidence-based. |
| Future action | Publish a dedicated external-storage or database-backed evidence packet only if a later tranche implements and tests a live backend with migration and recovery evidence. |
| Boundary | `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`; `docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md` |

---

## How to Use This Register

**For demo preparation:** acknowledge open gaps proactively; do not wait for them to be discovered. Be explicit that certified provider/model lanes are listed in `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` while other providers remain experimental until canary-run. L-003 and L-008 are now closed.

**For agent handoff:** cite this register when scoping the next wave. Closed items such as L-003 and L-008 must not be reopened unless fresh evidence shows new drift.

**For future waves:** when a limitation is closed, update its entry to `Closed` with a date and evidence pointer, or remove it from this register entirely. Do not let closed gaps accumulate here.

---

## Boundaries / Non-Goals

This register is not a complete private defect backlog, runtime hardening
roadmap, CI implementation plan, provider SLA, legal assurance document, or
production-readiness attestation.

## Related Artifacts

- `README.md`
- `GOVERNANCE.md`
- `ARCHITECTURE.md`
- `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`
- `docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md`
- `docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md`
- `docs/evidence/latest-release-gate.md`

## Claim Boundary

This register records public-safe limitations and claim boundaries. It does not
prove runtime behavior, provider behavior, hosted freshness, route coverage, CI
freshness, production readiness, or private provenance completeness.

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
