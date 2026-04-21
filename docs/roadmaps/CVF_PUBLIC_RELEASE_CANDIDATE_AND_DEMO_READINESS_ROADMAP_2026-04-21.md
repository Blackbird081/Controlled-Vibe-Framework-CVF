# CVF Public Release Candidate And Demo Readiness Roadmap

Memory class: SUMMARY_RECORD

> Date: 2026-04-21
> Status: DELIVERED — CP1-CP5 verified, release gate PASS
> Context: post-provider-lane closure; all core proof milestones reached; phase transition from capability proving to release packaging

---

## Goal

CVF has crossed the capability proving threshold. The bottleneck is no longer what the system can do — it is whether the system can be understood, demoed, and shared without breaking claim boundaries or leaking credentials.

This roadmap produces:

1. A **Release Candidate Truth Packet** — one authoritative document on what is proven, what is not, and what evidence exists.
2. A **Demo Script** — three bounded demo paths that work without live paid calls by default.
3. A **Public Docs Audit** — README, GET_STARTED, ARCHITECTURE, and START_HERE brought to current milestone truth.
4. A **Release Gate Bundle** — a single local check that confirms build, provider readiness, front-door smoke, secrets scan, and docs governance before any public share.
5. A **Known Limitations Register** — honest, public-safe accounting of what remains unproven or bounded.

Success means: the next agent or external reader can understand CVF's current state accurately, run a bounded demo, and share the repo without overstating or understating what has been delivered.

---

## What Is Proven (as of 2026-04-21)

| Milestone | Evidence | Status |
|---|---|---|
| Non-coder value path | front-door product proof, canary receipts | PROVEN |
| Multi-provider operability | Alibaba + DeepSeek CERTIFIED (3× PASS 6/6 each) | PROVEN |
| Provider UX + release readiness surface | W110-T3 delivery, CP1-CP4 closed | DELIVERED |
| Governed risk / approval path | High-Risk Guided Response roadmap | DELIVERED |
| Front-door product proof | W110-CP4 front-door canary 6/6 PASS | PROVEN |

Claim boundary (unchanged):

> Multi-provider operability is proven. Provider parity is not claimed. Provider economics remain user-selected. CVF proves governed AI-assisted development; it does not claim to be a production SaaS product.

This roadmap must preserve that claim boundary in every artifact it produces.

---

## Non-Goals

This roadmap is not for:

- adding new providers, features, or capabilities
- rewriting the architecture or modifying frozen layers
- running paid live canaries by default
- claiming full E2E Playwright coverage (known drift acknowledged)
- claiming parity between Alibaba, DeepSeek, or Anthropic lanes
- replacing CLAUDE.md governance with public marketing copy

---

## Step 1 — Release Candidate Truth Packet

Purpose:

- produce one document that future agents, collaborators, and the user can cite as the single source of milestone truth
- prevent overclaim and underclaim at the same time
- must be public-safe: no credentials, no internal keys, no unproven assertions

Create:

- `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md`

Required sections:

1. **What Is Proven**
   - milestone name, evidence pointer, date closed
   - use the table from this roadmap's header as the seed

2. **What Is Not Proven**
   - provider parity not claimed
   - full Playwright E2E coverage has known drift
   - live canaries are user-paid and not run in default CI
   - legacy surfaces (older EXTENSIONS) not formally reviewed in W110 scope

3. **Evidence Pointers**
   - canary receipts: `docs/baselines/` (latest per provider)
   - provider matrix: `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md`
   - operator runbook: `docs/reference/CVF_PROVIDER_LANE_OPERATOR_RUNBOOK.md`
   - front-door evidence: latest W110 baseline delta

4. **Claim Boundary Statement** (verbatim, for copy-paste into any public share)

5. **Release Scope** — what this RC covers and does not cover

Language rules:

- do not use "production-ready" without qualification
- do not use "all providers" — say "Alibaba and DeepSeek, evidence-backed"
- do not imply SaaS availability

Exit:

- truth packet is created and linked from README and INDEX.md

---

## Step 2 — Demo Script

Purpose:

- let any operator run bounded UI walkthroughs of CVF without spending paid API credits
- require live provider execution before any governance-quality proof is published
- give three named demo paths that correspond to the proven milestone claims

Create:

- `docs/guides/CVF_DEMO_SCRIPT_2026-04-21.md`

Required demo paths:

### Demo Path A — Non-Coder App Builder

Scope: user with no coding background creates a governed app using CVF template + front-door wizard.

Default mode: UI walkthrough only. Live AI call is required if this path is used as governance proof.

Steps:

1. Start dev server: `cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run dev`
2. Open `http://localhost:3000`
3. Navigate to template gallery → select a non-coder starter template
4. Walk through the intake → design → review steps
5. Show risk classification output (R0 / R1 / R2 sample)

Expected output: intake form complete, template selected, risk level shown.

Claim: "Non-coder governance path — no code written, CVF handles structure and risk gates."

### Demo Path B — Governed Risk / Approval Path

Scope: a change classified above R1 enters the governed approval flow.

Default mode: local policy walkthrough only. Live AI call is required before claiming runtime governance proof.

Steps:

1. From dev server, select or simulate a high-risk operation (e.g., delete dataset, external API call)
2. Show the High-Risk Guided Response panel
3. Show approval prompt + scope confirmation
4. Show block if approval not granted

Expected output: high-risk operation is blocked or gated; approval UI is visible.

Claim: "CVF enforces governed AI behavior at runtime — not just in docs."

### Demo Path C — Provider Switch Certified Lane

Scope: operator switches between Anthropic (default), Alibaba, and DeepSeek lanes.

Default mode: provider status UI only. Fresh certification or release-quality proof requires a live call with an operator key.

Steps:

1. Navigate to Settings → Provider
2. Show lane status badges: `Certified`, `Experimental`, `Unconfigured`
3. Explain certification evidence (canary receipts, provider matrix link)
4. Optional live mode: `python scripts/run_cvf_provider_live_canary.py --provider alibaba` (requires key)

Expected output: lane badges visible, certification status explained, fresh live call succeeds if key is provided.

Claim: "Multi-provider operability is proven. Provider parity is not claimed."

---

Operator notes:

- all three paths can be walked as UI demos without paid API calls
- governance-quality proof requires live mode and an operator-provided key
- do not record or commit any API keys used during demo

Exit:

- demo script exists; all three paths are walkable from a cold repo clone

---

## Step 3 — Public Docs Audit

Purpose:

- eliminate stale claims (e.g., "multi-provider not proven", "under construction") from public-facing docs
- align README, GET_STARTED, START_HERE, and ARCHITECTURE with current milestone truth

Target files:

| File | Required update |
|---|---|
| `README.md` | reflect Alibaba + DeepSeek CERTIFIED; add truth packet link |
| `docs/GET_STARTED.md` | remove or update any "proof pending" language; add demo script link |
| `docs/CVF_CORE_KNOWLEDGE_BASE.md` | update provider section; reflect W110 delivery |
| `docs/guides/CVF_QUICK_ORIENTATION.md` | add RC truth packet and demo script to "what to read first" |
| `docs/INDEX.md` | add truth packet, demo script, known limitations register |

Audit rule: for each file, search for:

- "not proven", "pending", "under construction", "not yet", "planned"
- check if the statement is still true; if not, update with evidence pointer

Do not remove uncertainty statements that remain accurate. The known limitations register (Step 5) is the right place for those.

Exit:

- public-facing docs do not contain stale milestone claims
- all new Step 1-2-5 documents are linked from INDEX.md

---

## Step 4 — Release Gate Bundle

Purpose:

- one command (or short sequence) that confirms CVF is in a shareable state
- live governance E2E is mandatory for release-quality proof
- covers: build, provider readiness, front-door smoke, secrets scan, docs governance

Create or extend:

- `scripts/run_cvf_release_gate_bundle.py`

Required checks (in order):

| Check | Command | Exit on fail |
|---|---|---|
| Web build | `npm run build` (cvf-web) | yes |
| TypeScript check | `npm run check` (guard contract) | yes |
| Provider readiness | `python scripts/check_cvf_provider_release_readiness.py` | yes if no CERTIFIED lane |
| E2E UI mock | Playwright mock UI specs | yes |
| E2E live governance | Playwright live governance specs | yes |
| Secrets scan | `python tools/security_scan.py` or equivalent | yes |
| Docs governance | check truth packet + known limitations register exist and are non-empty | yes |

Output format:

```
CVF RELEASE GATE BUNDLE — 2026-04-21
[PASS] Web build
[PASS] TypeScript check
[PASS] Provider readiness — Alibaba: CERTIFIED, DeepSeek: CERTIFIED
[PASS] Secrets scan
[PASS] Docs governance — truth packet and limitations register present
[PASS] E2E Playwright UI (mock)
[PASS] E2E Playwright Governance (live)
---
GATE RESULT: PASS
```

Required flags:

- `--mock` — use saved provider-readiness receipts; not a substitute for live governance E2E in the default gate
- `--dry-run` — print what would run without executing
- `--json` — machine-readable output for CI integration

Exit:

- bundle script exists and runs clean (PASS or PASS-with-warning) from a cold local checkout

---

## Step 5 — Known Limitations Register

Purpose:

- honest, public-safe accounting of what CVF does not yet prove
- prevents future agents from treating claimed-but-unproven items as facts
- allows external readers to understand scope without being misled

Create:

- `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md`

Required entries:

| Limitation | Status | Notes |
|---|---|---|
| Provider parity not claimed | Permanent | Alibaba + DeepSeek pass CVF canaries; speed/cost/quality parity is not assessed |
| Live provider credits are operator-supplied | Permanent | Keys are never committed; release-quality governance E2E requires `DASHSCOPE_API_KEY`; certification canaries consume operator credits |
| Playwright E2E has known drift | Open | Some E2E tests may fail against current UI if not synced after W110-T3 changes |
| Legacy EXTENSIONS not in W110 scope | Open | Modules outside core agent platform not formally re-reviewed in W110 |
| No SaaS deployment | Permanent | CVF is a local governance framework; it does not include hosted infrastructure |
| Token cost estimation not calibrated | Open | Risk engine estimates token cost but does not calibrate against live provider billing |

Register rules:

- `Permanent` = will not change without a deliberate architecture decision
- `Open` = known gap; may be closed in a future wave
- do not add aspirational items; only record real current gaps

Exit:

- register exists with at least the six required entries above
- linked from README, INDEX.md, and truth packet

---

## Recommended Control Points

### CP1 — Release Candidate Truth Packet

Deliver:

- `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md`
- linked from `README.md` and `docs/INDEX.md`

Suggested verification:

- read truth packet aloud against current milestone table
- confirm no overclaim or underclaim vs. canary receipts and roadmap closure records

### CP2 — Demo Script

Deliver:

- `docs/guides/CVF_DEMO_SCRIPT_2026-04-21.md`
- all three demo paths walkable from cold checkout
- API key required for any live governance proof; mock/demo UI paths do not prove CVF governs real AI

Suggested verification:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run dev
# walk Demo Path A in browser
python scripts/evaluate_cvf_provider_lane_certification.py
# confirm CERTIFIED lanes present for Demo Path C
```

### CP3 — Public Docs Audit

Deliver:

- updated README, GET_STARTED, CORE_KNOWLEDGE_BASE, QUICK_ORIENTATION, INDEX
- no stale milestone claims remain in public-facing docs

Suggested verification:

```bash
grep -r "not proven\|under construction\|not yet proven" docs/ README.md
# expect zero results for stale claims
```

### CP4 — Release Gate Bundle

Deliver:

- `scripts/run_cvf_release_gate_bundle.py`
- default gate runs UI mock specs plus mandatory live governance specs
- `--mock` is limited to saved provider-readiness receipts and UI-only checks
- `--dry-run` flag working
- clean PASS or PASS-with-warning output

Suggested verification:

```bash
DASHSCOPE_API_KEY=<key> python scripts/run_cvf_release_gate_bundle.py --json
```

### CP5 — Known Limitations Register

Deliver:

- `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md`
- all six required entries present
- linked from README, INDEX.md, and truth packet

Suggested verification:

- read each entry; confirm it reflects actual current state, not aspirational state

---

## Evidence Requirements

Each completed control point should leave:

- a baseline delta under `docs/baselines/` if any code or material doc changes
- updated `docs/INDEX.md` with new file pointers
- no committed API keys
- no overclaim language in any new document

---

## Risk Notes

- Truth packet can accidentally become a marketing document — keep it factual with evidence pointers.
- Demo script must not embed or hard-code any API key, even a test key.
- Public docs audit can accidentally delete accurate uncertainty statements — check before removing.
- Release gate bundle must not call live APIs without explicit operator opt-in flag.
- Known limitations register must not list future roadmap items as limitations; only current real gaps.

---

## Success Definition

This roadmap is complete when:

1. A Release Candidate Truth Packet exists with accurate milestone evidence and claim boundaries.
2. A Demo Script with three walkable paths exists, all runnable without paid API credits by default.
3. Public-facing docs (README, GET_STARTED, QUICK_ORIENTATION, INDEX) are free of stale milestone claims.
4. A Release Gate Bundle script runs clean locally and outputs machine-readable gate status.
5. A Known Limitations Register exists with at least six entries, linked from README and INDEX.

---

*Filed: 2026-04-21 — next-wave roadmap after provider lane closure; focus shifts from capability proving to release packaging and public readiness*
