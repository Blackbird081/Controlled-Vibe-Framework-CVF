# Minimum Useful CVF

This guide shows the smallest public-safe way to understand CVF as an
operational system, not just an architecture diagram.

It is intentionally not an enterprise readiness document. It does not claim
NIST, ISO, hosted multi-tenancy, SLO commitments, or cryptographic receipt
semantics. Those claims require separate implementation and verification.

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
when it reduces daily AI-operation chaos, not when it is used only for a demo.

## Common Failure Boundaries

| Situation | Expected CVF posture |
|---|---|
| Missing live provider key | Live governance proof should fail instead of falling back to mock proof. |
| Provider timeout or error | Treat as an operational failure; do not count it as a governed success. |
| High-risk action | Require block, escalation, or approval depending on the configured policy path. |
| Invalid or unsafe output | Treat output validation as part of the governed result, not as optional polish. |
| UI mock test passes | Count it only as UI structure evidence, not governance evidence. |
| Unsupported provider | Treat as experimental until live evidence is produced for that lane. |

## Before And After

| Without CVF | With CVF |
|---|---|
| Prompt and provider choices are ad hoc. | Provider lane and policy boundary are visible. |
| Approval may happen in chat or memory. | Approval state is part of the governed path. |
| Output quality checks are manual and inconsistent. | Validation is part of the control loop. |
| Evidence is scattered across logs and screenshots. | Receipts and summaries give a reviewable trail. |
| Mock tests can be mistaken for governance proof. | Mock is explicitly limited to UI structure. |

## Read Next

- `README.md` for public positioning and quick start
- `ARCHITECTURE.md` for the control-plane model
- `GOVERNANCE.md` for governed behaviors and live-proof rule
- `PROVIDERS.md` for provider-lane boundaries
- `docs/evidence/README.md` for curated public evidence summaries
