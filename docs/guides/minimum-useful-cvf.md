# Minimum Useful CVF

Memory class: POINTER_RECORD

Status: CURRENT PUBLIC GUIDE

This guide shows the smallest public-safe way to understand CVF as an
operational system.

It is intentionally not an enterprise readiness document. It does not claim
NIST, ISO, hosted multi-tenancy, SLO commitments, or cryptographic receipt
semantics. Those require separate implementation and verification.

## Purpose

Give a new operator the shortest practical path from "what is CVF?" to a local
walkthrough and, when needed, live governed proof.

## Mục đích nhanh

Nếu bạn chỉ cần hiểu CVF có ích ở đâu, hãy bắt đầu bằng luồng nhỏ nhất:
yêu cầu -> đánh giá rủi ro -> gọi provider có kiểm soát -> kiểm chứng đầu ra
-> biên nhận audit.

## Scope

This guide covers UI-only walkthrough, live governed proof, and
real workflow adoption. It does not replace the full architecture,
provider, cost, or evidence documents.

## Claim Boundary

UI-only walkthroughs prove navigation and product surface only. Governance
claims require the live release-gate command and an operator-supplied provider
key.

## Source

This guide is a public-safe orientation written from the current CVF
control-surface state. It does not substitute for the architecture,
governance, provider, or evidence documents linked under Related Artifacts.

## Requirements

To follow the live-proof path (Path B below), an operator needs:

- a DashScope-compatible API key supplied via environment variable;
- Python and Node.js installed locally;
- ability to run `scripts/run_cvf_release_gate_bundle.py` from the repo root.

## Enforcement

UI walkthroughs (Path A) prove navigation only. Governance claims must run
Path B (live release-gate) and produce the JSON release-gate output, which
includes the live governance E2E result.

## Related Artifacts

- `README.md` — public positioning and quick start
- `ARCHITECTURE.md` — control-plane model
- `GOVERNANCE.md` — governed behaviors and live-proof rule
- `PROVIDERS.md` — provider-lane boundaries
- `docs/evidence/README.md` — curated public evidence summaries

## The Smallest Useful Flow

```text
request
  -> intake and risk check
  -> policy or approval decision
  -> provider or agent execution
  -> DLP and output validation
  -> audit receipt
  -> governed result
```

Without CVF, an AI or agent workflow can drift into untracked provider calls,
manual approval notes, inconsistent outputs, and weak evidence of what happened.

With CVF, the same workflow has a governed boundary: the request is classified,
the provider lane is explicit, output is checked, and the user receives a
reviewable evidence receipt.

## Path A: UI-Only Walkthrough

Use this path to understand navigation and the product surface without spending
provider credits.

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci
npm run dev
```

Open:

```text
http://localhost:3000
```

What this proves:

- the web control surface boots
- the operator can inspect templates, settings, provider posture, and evidence UI
- UI structure and navigation are available locally

What this does not prove:

- real AI governance behavior
- provider routing behavior
- DLP, output validation, or audit receipt behavior against live model output

## Path B: Live Governed Proof

Use this path when you need to claim that CVF governed a real AI/provider call.

Set one DashScope-compatible key in your environment. Do not commit or print the
raw value.

```bash
DASHSCOPE_API_KEY=<operator-supplied-key>
```

Accepted aliases:

```text
ALIBABA_API_KEY
CVF_ALIBABA_API_KEY
CVF_BENCHMARK_ALIBABA_KEY
```

Run:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

What this proves when it passes:

- the release gate reached the live governance E2E path
- the provider key was supplied by the operator
- CVF can record the bounded governance result for the active proof lane

Current boundary:

- Alibaba/DashScope is the primary live-proof lane
- DeepSeek has bounded provider-lane evidence
- provider parity is not claimed

## Path C: Real Workflow Adoption

Use this path when CVF is becoming part of actual work.

1. Choose one repeatable workflow, such as content generation, feature planning,
   app scaffolding, or operator review.
2. Decide which actions are allowed, blocked, or approval-required.
3. Run the workflow through the governed path.
4. Inspect the receipt fields surfaced by the UI or evidence summary.
5. Keep only the curated result public; keep raw operating material private.

The first adoption target should be boring and repeatable. CVF is most useful
when it reduces daily AI-operation chaos.

## Common Failure Boundaries

| Situation | Expected CVF posture |
|---|---|
| Missing live provider key | Live governance proof should fail instead of falling back to mock proof. |
| Provider timeout or error | Treat as an operational failure; do not count it as a governed success. |
| High-risk action | Require block, escalation, or approval depending on the configured policy path. |
| Invalid or unsafe output | Treat output validation as part of the governed result, not as optional polish. |
| UI mock test passes | Count it only as UI structure evidence, not governance evidence. |
| Unsupported provider | Treat as experimental until live evidence is produced for that lane. |

## Read Next

- `README.md` for public positioning and quick start
- `ARCHITECTURE.md` for the control-plane model
- `GOVERNANCE.md` for governed behaviors and live-proof rule
- `PROVIDERS.md` for provider-lane boundaries
- `docs/evidence/README.md` for curated public evidence summaries
